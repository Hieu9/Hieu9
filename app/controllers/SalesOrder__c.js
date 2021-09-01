const baseRepository = require('../services/repository'),
    baseService = require('../services/base'),
    { pgsql } = require('../libs/db'),
    response = require('../libs/response'),
    statusCode = require('../consts/statusCode'),
    consts = require('../consts'),
    pgRepository = require('../services/pgRepository'),
    objectLibs = require('../libs/object'),
    _ = require('lodash'),
    SqlString = require('sqlstring'),
    uuidv1 = require('uuid/v1'),
    Joi = require('@hapi/joi');

const object = 'SalesOrder__c';
const objectBatch = 'Batch__c';
const objectPackage = 'Package__c';
const objectItem = 'Item__c';
const objectStatus = 'Status__c';
const objectAddedValue = 'Added_Value_in_Package__c';
const objectReceipt = 'Receipt__c';
const schema = process.env.PG_SCHEMA;
// list
exports.list = async (req, res, next) => {
    try{
        let fields = await objectLibs.cacheFields(object);
        let field = req.query.f?req.query.f:fields;
        let limit = req.query.limit?req.query.limit:consts.LIMIT;
        let offset = req.query.offset?req.query.offset:consts.OFFSET;
        let orderBy = req.query.orderBy?req.query.orderBy:'CreatedDate DESC NULLS FIRST';
        let condition = req.query.q?req.query.q:'';

        let obj = await baseRepository.query(req, object, field, condition, orderBy, limit, offset);

        if(obj.statusCode != statusCode.SUCCESS)
            return response.fail(req, res, obj.body, obj.statusCode);

        let counts = await baseRepository.query(req,object,'count()',condition);
        if(counts.statusCode != statusCode.SUCCESS)
            return response.fail(req, res, counts.body, counts.statusCode);

        return response.successPaginate(req, res, obj.body, limit, offset, counts.body.totalSize);
    }catch(e){
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};
// detail
exports.detail = async (req, res, next) => {
    try{
        let fields = await objectLibs.cacheFields(object);
        let field = req.query.f?req.query.f:fields;
        const id = req.params.id;
        let condition = `SalesOrder_Number__c='${id}'`;

        let result = await baseRepository.detail(req, object, field, condition);

        if(result.statusCode != statusCode.SUCCESS)
            return response.fail(req, res, result.body, result.statusCode);
        let data = result.body.records[0];
        if(data == undefined || data == ''){
            data = {
              "errorCode" : "NOT_FOUND",
              "message" : "The requested resource does not exist"
            };
            result.statusCode = statusCode.INVALID_PARAMS;
        }
        return response.success(req, res, data, result.statusCode);
    }catch(e){
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};
exports.create = async (req, res, next) => {
    try{
        let soData, batchData, packageData, itemData, statusData, addedValueData, receiptData;

        let body = req.body;
        body = objectLibs.clean(body);
        let merchant = body.from__c;
        let batchBody = objectLibs.clean(body.Batch__c); delete body.Batch__c;
        let packageBody = objectLibs.clean(body.Package__c); delete body.Package__c;
        let itemBody = objectLibs.clean(body.Item__c); delete body.Item__c;

        await pgsql.query('BEGIN');
        let s_uuid = uuidv1();
        soData = await pgRepository.createTracking(schema,object.toLowerCase(),'merchant,created_at,salesorder_number__c',[[ merchant, Date.now(), body.salesorder_number__c ]],[[
                object.toLowerCase(),body,consts.JOB_OPERATION_UPSERT,Date.now(),body.from__c,s_uuid
            ]]);
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
                let uuid__c = uuidv1(); item.from__c = merchant;
                let batchValue = objValues(item,merchant,uuid__c);
                    batchValue.push(item.Batch_Number__c);
                batchObjValues.push(batchValue);
                batchValues.push(objTrackValues(objectBatch,item,merchant,uuid__c));
            }
            if(batchObjValues.length > 0){
                batchData = await pgRepository.createTracking(schema,objectBatch.toLowerCase(),'id,merchant,created_at,batch_number__c',batchObjValues,batchValues);
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
                let uuid__c = uuidv1(); item.from__c = merchant;
                //item.so_uuid__c = s_uuid;
                let objValue = objValues(item,merchant,uuid__c);
                    objValue.push(item.Item_Code__c);
                itemObjValues.push(objValue);
                itemValues.push(objTrackValues(objectItem,item,merchant,uuid__c));
            }
            if(itemObjValues.length > 0){
                itemData = await pgRepository.createTracking(schema,objectItem.toLowerCase(),'id,merchant,created_at,external_item_id__c',itemObjValues,itemValues);
                if(!itemData.success){ return response.fail(req, res, itemData, statusCode.PG_INVALID_PARAMS);}
                let tmp = [];
                for(let item of itemData.resTrackings){
                    let itemTmp = {
                        UUID__c: item.uuid__c,
                        Item_Code__c: item.value.Item_Code__c,
                        Package_Number__c: item.value.Package_Number__c
                    }
                    tmp.push(itemTmp);
                }
                itemData = tmp;
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
            let uuid = uuidv1();
            item.from__c = merchant;
            // get receipt
            if(item.Receipt__c){
                let receiptBody = objectLibs.clean(item.Receipt__c); delete item.Receipt__c;
                let validate = await objectLibs.validateObject(objectReceipt, receiptBody);
                if (validate.success != true) {
                    return response.fail(req, res, validate.body, statusCode.INVALID_PARAMS, 'Has params unnecessary');
                }
                let uuid__c = uuidv1();
                receiptBody.from__c = merchant;
                let objValue = objValues(item,merchant,uuid__c);
                    objValue.push(item.Package_Number__c);
                receiptObjValues.push(objValue);
                receiptValues.push(objTrackValues(objectReceipt,receiptBody,merchant,uuid__c));
            }

            // get status
            if(item.Status__c){
                let statusBody = objectLibs.clean(item.Status__c); delete item.Status__c;
                for (let itemStatus of statusBody) {
                    let validate = await objectLibs.validateObject(objectStatus, itemStatus);
                    if (validate.success != true) {
                        return response.fail(req, res, validate.body, statusCode.INVALID_PARAMS, 'Has params unnecessary');
                    }
                    let uuid__c = uuidv1(); itemStatus.from__c = merchant;
                    itemStatus.Package_Number__c = item.Package_Number__c;
                    //value status
                    let objValue = objValues(itemStatus,merchant,uuid__c);
                        objValue.push(itemStatus.External_Status_Id__c);
                    statusObjValues.push(objValue);
                    // value tracks
                    statusValues.push(objTrackValues(objectStatus,itemStatus,merchant,uuid__c));
                }
            }

            // get added value service
            if(item.Added_Value_in_Package__c){
                let addedValueBody = objectLibs.clean(item.Added_Value_in_Package__c); delete item.Added_Value_in_Package__c;
                for (let itemAdd of addedValueBody) {
                    let validate = await objectLibs.validateObject(objectAddedValue, itemAdd);
                    if (validate.success != true) {
                        return response.fail(req, res, validate.body, statusCode.INVALID_PARAMS, 'Has params unnecessary');
                    }
                    let uuid__c = uuidv1(); itemAdd.from__c = merchant;
                    itemAdd.Package_Number__c = item.Package_Number__c;
                    // process package_code
                    let objValue = objValues(itemAdd,merchant,uuid__c);
                        objValue.push(itemAdd.External_AVP_Id__c);
                    addedObjValues.push(objValue);
                    //value added
                    addedValues.push(objTrackValues(objectAddedValue,itemAdd,merchant,uuid__c));
                }
            }
            let objValue = objValues(item,merchant,uuid);
                objValue.push(item.Package_Number__c);
            packageObjValues.push(objValue);
            packageValues.push(objTrackValues(objectPackage,item,merchant,uuid));
        }
        if(packageObjValues.length > 0){
            packageData = await pgRepository.createTracking(schema,objectPackage.toLowerCase(),'id,merchant,created_at,package_number__c',packageObjValues,packageValues);
            if(!packageData.success){ return response.fail(req, res, packageData, statusCode.PG_INVALID_PARAMS);}
            packageData = keyValuePg('Package_Number__c', packageData.resTrackings);
        }
        if(receiptObjValues.length > 0){
            receiptData = await pgRepository.createTracking(schema,objectReceipt.toLowerCase(),'id,merchant,created_at,external_receipt_id__c',receiptObjValues,receiptValues);
            if(!receiptData.success){ return response.fail(req, res, receiptData, statusCode.PG_INVALID_PARAMS);}
            receiptData = keyValuePg('External_Receipt_Id__c', receiptData.resTrackings);
        }
        if(addedObjValues.length > 0){
            addedValueData = await pgRepository.createTracking(schema,objectAddedValue.toLowerCase(),'id,merchant,created_at,external_avp_id__c',addedObjValues,addedValues);
            if(!addedValueData.success){ return response.fail(req, res, addedValueData, statusCode.PG_INVALID_PARAMS);}
        }
        if(statusObjValues.length > 0){
            statusData = await pgRepository.createTracking(schema,objectStatus.toLowerCase(),'id,merchant,created_at,external_status_id__c',statusObjValues,statusValues);
            if(!statusData.success){ return response.fail(req, res, statusData, statusCode.PG_INVALID_PARAMS);}
        }

        // End Package
        await pgsql.query('COMMIT');
        return response.success(req, res, {
            UUID__C: soData.resObj[0].id,
            Package__c: packageData,
            Receipt__c: receiptData,
            Item__c: itemData,
            success: true,
            errors: []
        }, statusCode.SUCCESS);
    }catch(e){
        // rollback when error
        await pgsql.query('ROLLBACK');
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
}

exports.upsert = async (req, res, next) => {
    try{
        await pgsql.query('BEGIN');
        let params = req.body;
        let uuid = '';
        let objItem = await pgRepository.findFirst(schema, object.toLowerCase(),'id,sf_id,salesorder_number__c', `salesorder_number__c = '${params.salesorder_number__c}'`);
        if(!objItem.success){
            objItem = await pgRepository.create(schema,object.toLowerCase(),'merchant,created_at,salesorder_number__c', [
                params.from__c,Date.now(),params.salesorder_number__c
            ]);
            uuid = objItem.id;
        }else{
            uuid = objItem.row.id;
        }
        let data = await pgRepository.create(schema,'gw_trackings','object,value,operation,created_at,merchant,uuid__c', [
            object.toLowerCase(),params,consts.JOB_OPERATION_UPSERT,Date.now(),params.from__c,uuid
        ]);
        if(!data.success) return response.fail(req, res, data, statusCode.PG_INVALID_PARAMS);
        data.id = uuid;
        await pgsql.query('COMMIT');
        return response.success(req, res, data, statusCode.SUCCESS);
    }catch(e){
        await pgsql.query('ROLLBACK');
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};

function keyValuePg(key, obj){
    let tmp = [];
    for(let item of obj){
        let itemTmp = {
            UUID__c: item.uuid__c,
            [key]: item.value[key]
        }
        tmp.push(itemTmp);
    }
    return tmp;
}

function objTrackValues(object, item, merchant, uuid, operation=consts.JOB_OPERATION_UPSERT, option = {}){
    let obj = {};
    obj.object = object.toLowerCase();
    obj.value = item;
    obj.operation = operation;
    obj.created_at = Date.now();
    obj.merchant = merchant;
    obj.uuid__c = uuid;
    return Object.values(obj);
}

function objValues(item, merchant, id, obj = {}){
    obj.id = id;
    obj.merchant = merchant;
    obj.created_at = Date.now();
    return Object.values(obj);
}
// create
exports.createSF = async (req, res, next) => {
    try{
        let params = req.body;
        if(params.from__c == 'MYVNPOST'){
            let url = `${req.user.instance_url}/services/data/${req.query.ver}/sobjects/${object}`;
            let data = await baseRepository.create(url, params, req);
            if(data.statusCode != statusCode.POST_SUCCESS)
                return response.fail(req, res, data.body, data.statusCode);
            return response.success(req, res, data.body, data.statusCode);
        }else{
            throw "You do not have permission to access";
        }
    }catch(e){
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};
// patch
exports.updateSF = async (req, res, next) => {
    try {
        let params = req.body;
        let url =  `${req.user.instance_url}/services/data/${req.query.ver}/sobjects/${object}/${req.params.id}`;
        let data = await baseRepository.update(url, params, req);
        if(data.statusCode != statusCode.UPDATE_SUCCESS){
            return response.fail(req, res, data.body, data.statusCode);
        }
        return response.success(req, res, {
            "id": req.params.id,
            "success": true,
            "errors": []
        }, 200);
    }catch (e) {
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};
// delete
exports.delete = async (req, res, next) => {
    try {
        let url = `${req.user.instance_url}/services/data/${req.query.ver}/sobjects/${object}/${req.params.id}`;
        let data = await baseRepository.delete(url, req);
        if(data.statusCode != statusCode.DELETE_SUCCESS)
            return response.fail(req, res, data.body, data.statusCode);
        return response.success(req, res, {
            "id": req.params.id,
            "success": true,
            "errors": []
        }, 200);
    }catch (e) {
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};
