const baseRepository = require('../services/repository'),
    baseService = require('../services/base'),
    { pgsql } = require('../libs/db'),
    response = require('../libs/response'),
    statusCode = require('../consts/statusCode'),
    consts = require('../consts'),
    pgRepository = require('../services/pgRepository'),
    validator = require('validator'),
    objectLibs = require('../libs/object'),
    Joi = require('@hapi/joi');

const schema = process.env.PG_SCHEMA;
const object = 'Contract';
// list
exports.list = async (req, res, next) => {
    try {

    }catch (e) {
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
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
exports.createSF = async (req, res, next) => {
    try {
        let params = req.body;
        let url = `${req.user.instance_url}/services/data/${req.query.ver}/sobjects/${object}`;
        let data = await baseRepository.create(url, params, req);
        if(data.statusCode != statusCode.POST_SUCCESS)
            return response.fail(req, res, data.body, data.statusCode);
        return response.success(req, res, data.body, data.statusCode);
    }catch (e) {
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }

}
// update
exports.updateSF = async (req, res, next) => {
    try{
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
    }catch(e){
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
}
