const baseRepository = require('../services/repository'),
    baseService = require('../services/base'),
    { pgsql } = require('../libs/db'),
    response = require('../libs/response'),
    statusCode = require('../consts/statusCode'),
    consts = require('../consts'),
    pgRepository = require('../services/pgRepository'),
    objectLibs = require('../libs/object'),
    Joi = require('@hapi/joi');

const object = 'Refered_Status__c';
const schema = process.env.PG_SCHEMA;
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
