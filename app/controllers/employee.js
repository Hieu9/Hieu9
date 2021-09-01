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
const object = 'Employee__c';
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

}
// detail
exports.detail = async (req, res, next) => {
    try {
        let fields = await objectLibs.cacheFields(object);
        let field = req.query.f?req.query.f:fields;
        const id = req.params.id;
        let condition = `Id='${id}'`;

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

}
// create
exports.create = async (req, res, next) => {
    try{
        let params = req.body;
        // clean params
        params = objectLibs.clean(params);
        await pgsql.query('BEGIN');
        let objRes = await pgRepository.create(schema,object.toLowerCase(),'merchant,created_at', [
            params.from__c,Date.now()
        ]);
        let data = await pgRepository.create(schema,'gw_trackings','object,value,operation,created_at,merchant,uuid__c', [
            object.toLowerCase(),params,consts.JOB_OPERATION_INSERT,Date.now(),params.from__c,objRes.id
        ]);
        if(!data.success){
            return response.fail(req, res, data, statusCode.PG_INVALID_PARAMS);
        }
        await pgsql.query('COMMIT');
        return response.success(req, res, objRes, statusCode.SUCCESS);
    }catch(e){
        // rollback when error
        await pgsql.query('ROLLBACK');
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};
// patch
exports.update = async (req, res, next) => {
    try{
        let params = req.body;
        // clean params
        params = objectLibs.clean(params);
        params.id = req.params.id;
        let data = await baseService.update(schema, object, params);
        return response.success(req, res, data, statusCode.SUCCESS);
    }catch(e){
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};
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
}
