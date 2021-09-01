exports.create = async (req, res, next) => {
    try{
        let soData, batchData, packageData, itemData, statusData, addedValueData;

        let body = req.body;
        let merchant = body.from__c;
        let batchBody = body.Batch__c; delete body.Batch__c;
        let packageBody = body.Package__c; delete body.Package__c;
        let itemBody = body.Item__c; delete body.Item__c;

        await pgsql.query('BEGIN');
        let s_uuid = '';
        if(body.uuid__c != undefined){
            s_uuid = body.uuid__c;
            let sItem = await pgRepository.findFirst(schema, object.toLowerCase(), 'id,sf_id', `id = '${s_uuid}'`);
            if(!sItem.success){
                return response.fail(req, res, {}, statusCode.INVALID_PARAMS, 'Không tìm thấy SalesOrder: '+s_uuid);
            }
            // check exist s uuid
            soData = await pgRepository.create(schema,'gw_trackings','object,value,operation,created_at,merchant,uuid__c', [
                object.toLowerCase(),body,consts.JOB_OPERATION_UPSERT,Date.now(),body.from__c,s_uuid
            ]);
        }else{
            s_uuid = uuidv1();
            soData = await pgRepository.createTracking(schema,object.toLowerCase(),'merchant,created_at',[[ merchant, Date.now() ]],[[
                object.toLowerCase(),body,consts.JOB_OPERATION_UPSERT,Date.now(),body.from__c,s_uuid
            ]]);
        }
        if(!soData.success){ return response.fail(req, res, soData, statusCode.PG_INVALID_PARAMS);}
        // End SalesOrder
        // Batch
        if(batchBody){
            let batchObjValues = []; let batchValues = [];
            for (let item of batchBody) {
                let validate = await objectLibs.validateObject(objectBatch, item);
                if (validate.success != true) {
                    return response.fail(req, res, validate.body, statusCode.INVALID_PARAMS, 'Has params unnecessary');
                }
                // 
                let batchItem = await pgRepository.findFirst(schema, objectBatch.toLowerCase(), 'id,sf_id,batch_number__c', `batch_number__c = '${item.Batch_Number__c}'`);
                let uuid__c = batchItem.success?batchItem.row.id:uuidv1();
                item.from__c = merchant;
                item.so_uuid__c = s_uuid;
                if(!batchItem.success){
                    let objValue = objValues(item,merchant,uuid__c);
                    objValue.push(item.Batch_Number__c);
                    batchObjValues.push(objValue);
                }
                batchValues.push(objTrackValues(objectBatch,item,merchant,uuid__c));
            }
            // insert
            if(batchObjValues.length > 0){
                batchData = await pgRepository.createTracking(schema,objectBatch.toLowerCase(),'id,merchant,created_at,batch_number__c',batchObjValues,batchValues);
                if(!batchData.success){ return response.fail(req, res, batchData, statusCode.PG_INVALID_PARAMS);}
            }else{
                //update
                batchData = await pgRepository.createSingleTracking(schema,batchValues);
                if(!batchData.success){ return response.fail(req, res, batchData, statusCode.PG_INVALID_PARAMS);}
            }
        }
        // End Batch
        // Item
        if(itemBody){
            let itemObjValues = []; let itemValues = [];
            for (let item of itemBody) {
                let validate = await objectLibs.validateObject(objectItem, item);
                if (validate.success != true) {
                    return response.fail(req, res, validate.body, statusCode.INVALID_PARAMS, 'Has params unnecessary');
                }
                let iItem = await pgRepository.findFirst(schema, objectItem.toLowerCase(), 'id,sf_id,item_code__c', `item_code__c = '${item.Item_Code__c}'`);
                let uuid__c = iItem.success?iItem.row.id:uuidv1();
                item.from__c = merchant;
                if(!iItem.success){
                    let objValue = objValues(item,merchant,uuid__c);
                    objValue.push(item.Item_Code__c);
                    itemObjValues.push(objValue);
                }
                itemValues.push(objTrackValues(objectItem,item,merchant,uuid__c));
            }
            // insert
            if(itemObjValues.length > 0){
                itemData = await pgRepository.createTracking(schema,objectItem.toLowerCase(),'id,merchant,created_at,item_code__c',itemObjValues,itemValues);
                if(!itemData.success){ return response.fail(req, res, itemData, statusCode.PG_INVALID_PARAMS);}
            }else{
                //update
                itemData = await pgRepository.createSingleTracking(schema,itemValues);
                if(!itemData.success){ return response.fail(req, res, itemData, statusCode.PG_INVALID_PARAMS);}
            }
        }
        // End Item

        // Package
        let packageObjValues = []; let packageValues = [];
        let receiptObjValues = []; let receiptValues = [];
        let statusObjValues = []; let statusValues = [];
        let addedObjValues = []; let addedValues = [];
        for (let item of packageBody) {
            let validate = await objectLibs.validateObject(objectPackage, item);
            if (validate.success != true) {
                return response.fail(req, res, validate.body, statusCode.INVALID_PARAMS, 'Has params unnecessary');
            }
            let packageItem = await pgRepository.findFirst(schema, objectPackage.toLowerCase(), 'id,sf_id,package_number__c', `package_number__c = '${item.Package_Number__c}'`);
            let uuid = packageItem.success?packageItem.row.id:uuidv1();
            item.from__c = merchant;
            item.so_uuid__c = s_uuid;
            // get receipt
            if(item.Receipt__c){
                let receiptBody = item.Receipt__c; delete item.Receipt__c;
                let validate = await objectLibs.validateObject(objectReceipt, receiptBody);
                if (validate.success != true) {
                    return response.fail(req, res, validate.body, statusCode.INVALID_PARAMS, 'Has params unnecessary');
                }
                let receiptItem = await pgRepository.findFirst(schema, objectReceipt.toLowerCase(), 'id,sf_id,package_number__c', `package_number__c = '${item.Package_Number__c}'`);
                let uuid__c = receiptItem.success?receiptItem.row.id:uuidv1();
                receiptBody.from__c = merchant;
                receiptBody.package_uuid__c = uuid__c;
                // insert
                if(!receiptItem.success){
                    let objValue = objValues(item,merchant,uuid__c);
                    objValue.push(item.Package_Number__c);
                    receiptObjValues.push(objValue);
                }
                receiptValues.push(objTrackValues(objectReceipt,receiptBody,merchant,uuid__c));
            }
            
            // get status
            if(item.Status__c){
                let statusBody = item.Status__c; delete item.Status__c;
                for (let itemStatus of statusBody) {
                    let validate = await objectLibs.validateObject(objectStatus, itemStatus);
                    if (validate.success != true) {
                        return response.fail(req, res, validate.body, statusCode.INVALID_PARAMS, 'Has params unnecessary');
                    }
                    let uuid__c = uuidv1(); 
                    itemStatus.from__c = merchant;
                    itemStatus.package_uuid__c = uuid;
                    statusObjValues.push(objValues(itemStatus,merchant,uuid__c));
                    statusValues.push(objTrackValues(objectStatus,itemStatus,merchant,uuid__c,consts.JOB_OPERATION_INSERT));
                }
            }
            
            // get added value service
            if(item.Added_Value_in_Package__c){
                let addedValueBody = item.Added_Value_in_Package__c; delete item.Added_Value_in_Package__c;
                for (let itemAdd of addedValueBody) {
                    let validate = await objectLibs.validateObject(objectAddedValue, itemAdd);
                    if (validate.success != true) {
                        return response.fail(req, res, validate.body, statusCode.INVALID_PARAMS, 'Has params unnecessary');
                    }

                    let package_code = item.Package_Number__c+itemAdd['Added_Value_Service__r.Added_Value_Service_Code__c'];
                    let addItem = await pgRepository.findFirst(schema, objectAddedValue.toLowerCase(), 'id,sf_id,package_code', `package_code = '${package_code}'`);
                    let uuid__c = addItem.success?addItem.row.id:uuidv1();

                    itemAdd.from__c = merchant;
                    itemAdd.package_uuid__c = uuid;
                    if(!addItem.success){
                        let objValue = objValues(item,merchant,uuid__c);
                        objValue.push(package_code);
                        addedObjValues.push(objValue);
                    }                    
                    addedValues.push(objTrackValues(objectAddedValue,itemAdd,merchant,uuid__c));
                }
            }
            if(!packageItem.success){
                let objValue = objValues(item,merchant,uuid);
                objValue.push(item.Package_Number__c);
                packageObjValues.push(objValue);
            }
            packageValues.push(objTrackValues(objectPackage,item,merchant,uuid));
        }
        // insert
        if(packageObjValues.length > 0){
            packageData = await pgRepository.createTracking(schema,objectPackage.toLowerCase(),'id,merchant,created_at,package_number__c',packageObjValues,packageValues);
            if(!packageData.success){ return response.fail(req, res, packageData, statusCode.PG_INVALID_PARAMS);}
            packageData = keyValuePg('Package_Number__c', packageData.resTrackings);
        }else{
            // update
            packageData = await pgRepository.createSingleTracking(schema,packageValues);
            if(!packageData.success){ return response.fail(req, res, packageData, statusCode.PG_INVALID_PARAMS);}
            packageData = keyValuePg('Package_Number__c', packageData.resTrackings);
        }
        //insert
        if(receiptObjValues.length > 0){
            receiptData = await pgRepository.createTracking(schema,objectReceipt.toLowerCase(),'id,merchant,created_at,package_number__c',receiptObjValues,receiptValues);
            if(!receiptData.success){ return response.fail(req, res, receiptData, statusCode.PG_INVALID_PARAMS);}
            receiptData = keyValuePg('Package_Number__c', receiptData.resTrackings);
        }else{
            // update
            receiptData = await pgRepository.createSingleTracking(schema,receiptValues);
            if(!receiptData.success){ return response.fail(req, res, receiptData, statusCode.PG_INVALID_PARAMS);}
            receiptData = keyValuePg('Package_Number__c', receiptData.resTrackings);
        }
        //insert
        if(addedObjValues.length > 0){
            addedValueData = await pgRepository.createTracking(schema,objectAddedValue.toLowerCase(),'id,merchant,created_at,package_code',addedObjValues,addedValues);
            if(!addedValueData.success){ return response.fail(req, res, addedValueData, statusCode.PG_INVALID_PARAMS);}
        }else{
            //update
            addedValueData = await pgRepository.createSingleTracking(schema,addedValues);
            if(!addedValueData.success){ return response.fail(req, res, addedValueData, statusCode.PG_INVALID_PARAMS);}
        }
        if(statusObjValues.length > 0){
            statusData = await pgRepository.createTracking(schema,objectStatus.toLowerCase(),'id,merchant,created_at',statusObjValues,statusValues);
            if(!statusData.success){ return response.fail(req, res, statusData, statusCode.PG_INVALID_PARAMS);}
        }

        // End Package
        await pgsql.query('COMMIT');
        return response.success(req, res, {
            UUID__C: s_uuid,
            Package__c: packageData,
            Receipt__c: receiptData,
            success: true,
            errors: []
        }, statusCode.SUCCESS);
    }catch(e){
        // rollback when error
        await pgsql.query('ROLLBACK');
        console.log(e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
}