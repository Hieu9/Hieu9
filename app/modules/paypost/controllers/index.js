const { pgsql } = require('../libs/db'),
    response = require('../../../libs/response'),
    statusCode = require('../../../consts/statusCode'),
    objectLibs = require('../../../libs/object'),
    objectConfigs = require('../configs/object'),
    paypostModel = require('../models/paypost'),
    uuidv1 = require('uuid/v1');

// create
exports.create = async (req, res, next) => {
    try{
        let params = req.body;
        if(typeof params.records === undefined){
            return response.fail(req, res, {
                message: 'records must exist',
                errorCode: 'DATA_NOT_FOUND'
            }, 400);
        }

        let records = params.records;
        if(records.length < 0 || records.length > 200){
            return response.fail(req, res, {
                message: 'records is not empty or count records < 200',
                errorCode: 'DATA_LARGE'
            }, 400);
        }

        let data = [];
        let dataTmp = [];

        for(let i = 0; i<records.length; i++){
            records[i].id = uuidv1(); 
            // convert key to lowercase
            newobj = objectLibs.keyToLower(records[i]);
            data.push(newobj);
            let otherObj = Object.assign({}, newobj);
            dataTmp.push(otherObj);
        }

        let orders = objectLibs.funcMapFields(dataTmp, objectConfigs.fields['order']);
            orders = createObjTracks('PAYPOST','order','upsert',orders, data, null);

        let account_sent = objectLibs.funcMapFields(dataTmp, objectConfigs.fields['account_sent']);
            account_sent = createObjTracks('PAYPOST','account','upsert',account_sent, data, null);

        let account_rc = objectLibs.funcMapFields(dataTmp, objectConfigs.fields['account_rc']);
            account_rc = createObjTracks('PAYPOST','account','upsert',account_rc, data, null);

        let receipts = objectLibs.funcMapFields(dataTmp, objectConfigs.fields['receipt__c']);
            receipts = createObjTracks('PAYPOST','receipt__c','upsert',receipts, data, null);

        let results = [];

        try {
            // begin a transaction
            await pgsql.query('BEGIN');
            let query = paypostModel['data'].insert(data).returning(paypostModel['data'].id).toQuery();
            results = await pgsql.query(query);
            // insert order
            let queryOrder = paypostModel['order'].insert(orders).returning(paypostModel['data'].id).toQuery();
            orderResults = await pgsql.query(queryOrder);
            // insert account sent
            let queryAccount_sent = paypostModel['account'].insert(account_sent).returning(paypostModel['account'].id).toQuery();
            account_sentResults = await pgsql.query(queryAccount_sent);
            // insert account rc
            let queryAccount_rc = paypostModel['account'].insert(account_rc).returning(paypostModel['account'].id).toQuery();
            account_rcResults = await pgsql.query(queryAccount_rc);
            // insert receipt
            let queryReceipt = paypostModel['receipt__c'].insert(receipts).returning(paypostModel['receipt__c'].id).toQuery();
            receiptResults = await pgsql.query(queryReceipt);
            // commit transaction
            await pgsql.query('COMMIT');
        } catch (e) {
            console.log(e.stack);
            await pgsql.query('ROLLBACK');
            return response.fail(req, res, {
                message: e + '',
                errorCode: 'ERROR SAVE DATABASE'
            }, statusCode.INVALID_PARAMS);
        }

        return response.success(req, res, {
            hasErrors: results.rows?false:true,
            results: results.rows
        }, 200);
    }catch(e){
        console.log(e.stack);
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
}

function createObjTracks(merchant, object, operation, values, data, job_id) {
    let objects = [];
    for(let i = 0; i < values.length; i++){
        if(object == 'receipt__c'){
            values[i].External_Receipt_Id__c =  uuidv1();
        }
        let item = {
            id: uuidv1(),
            status: 0,
            merchant,
            value: values[i],
            object,
            operation,
            job_id,
            uuid__c: uuidv1(),
            created_at: Date.now(),
            data_id: data[i].id
        };
        objects.push(item);
    }
    return objects;
}