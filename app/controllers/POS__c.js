const baseRepository = require('../services/repository'),
    response = require('../libs/response'),
    statusCode = require('../consts/statusCode'),
    consts = require('../consts'),
    pgRepository = require('../services/pgRepository'),
    { pgsql } = require('../libs/db'),
    validator = require('validator'),
    objectLibs = require('../libs/object');

const schema = process.env.PG_SCHEMA;
const object = 'POS__c';
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
        const id = req.params.id;
        let condition = `Name='${id}' Or Postal_Code__c='${id}'`;

        let result = await baseRepository.detail(req, object, fields, condition);

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
exports.create = async (req, res, next) => {
    try{
        let params = req.body;
        let url = `${req.user.instance_url}/services/data/${req.query.ver}/sobjects/${object}`;
        let data = await baseRepository.create(url, params, req);
        if(data.statusCode != statusCode.POST_SUCCESS)
            return response.fail(req, res, data.body, data.statusCode);
        return response.success(req, res, data.body, data.statusCode);
    }catch(e){
        await response.logRedis(req, e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
}
// put
exports.update = async (req, res, next) => {
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
        await response.logRedis(req, e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
}
