const baseRepository = require('../services/repository'),
    baseService = require('../services/base'),
    { pgsql } = require('../libs/db'),
    response = require('../libs/response'),
    statusCode = require('../consts/statusCode'),
    consts = require('../consts'),
    pgRepository = require('../services/pgRepository'),
    validator = require('validator'),
    objectLibs = require('../libs/object');

const schema = process.env.PG_SCHEMA;
const object = 'Status__c';
// list
exports.list = async (req, res, next) => {
    try {
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
    }catch (e) {
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};
// detail
exports.detail = async (req, res, next) => {
    try {
        let fields = await objectLibs.cacheFields(object);
        let field = req.query.f?req.query.f:fields;
        const id = req.params.id;
        let condition = `External_Status_Id__c='${id}'`;

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
    }catch (e) {
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};

exports.upsert = async (req, res, next) => {
    try{
        await pgsql.query('BEGIN');
        let params = req.body;
        params = objectLibs.clean(params);
        let uuid = '';
        let objItem = await pgRepository.findFirst(schema, object.toLowerCase(),'id,sf_id,external_status_id__c', `external_status_id__c = '${params.external_status_id__c}'`);
        if(!objItem.success){
            objItem = await pgRepository.create(schema,object.toLowerCase(),'merchant,created_at,external_status_id__c', [
                params.from__c,Date.now(),params.external_status_id__c
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
