const baseRepository = require('../services/repository'),
    baseService = require('../services/base'),
    response = require('../libs/response'),
    statusCode = require('../consts/statusCode'),
    consts = require('../consts'),
    pgRepository = require('../services/pgRepository'),
    objectLibs = require('../libs/object'),
    Joi = require('@hapi/joi'),
    _ = require('lodash'),
    { pgsql } = require('../libs/db');

const schema = process.env.PG_SCHEMA;
const object = 'Case';
const objectTicket = 'Ho_tro__c';

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
        //get files
        await baseRepository.getFiles(obj.body.records, req.user.instance_url, req.user.token);
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
        // if(params.reason == 'Khiếu nại khách hàng'){
        //     params.reason = 'Khieu_nai';
        // }
        // try {
        //     let objectCase = await objectLibs.cacheObjects(object);
        //     let recordTypes = objectCase.recordTypeInfos;
        //     if(!_.isUndefined(recordTypes) && _.isArray(recordTypes)){
        //         params.recordTypeId = _.result(_.find(recordTypes, function(obj) {
        //             return (obj.developerName === params.reason || obj.name === params.reason);
        //         }), 'recordTypeId');
        //     }
        // }catch (e) {
        //     console.log(e);
        //     return response.fail(req, res, {});a
        // }
        // console.log(params);
        let hoTroParams = params.ho_tro__c;

        delete params.ho_tro__c;
        delete params.Ho_tro__c;

        await pgsql.query('BEGIN');
        // create Case
        let objRes = await pgRepository.create(schema,object.toLowerCase(),'merchant,created_at', [
            params.from__c,Date.now()
        ]);
        let data = await pgRepository.create(schema,'gw_trackings','object,value,operation,created_at,merchant,uuid__c', [
            object.toLowerCase(),params,consts.JOB_OPERATION_INSERT,Date.now(),params.from__c,objRes.id
        ]);
        if(!data.success){
            return response.fail(req, res, data, statusCode.PG_INVALID_PARAMS);
        }
        // create ticket ho tro
        if(hoTroParams != undefined && hoTroParams.length > 0){
            let recordTypename = params.Noi_dung_ho_tro__c;
            let objectHoTro = await objectLibs.cacheObjects(objectTicket);
            let rtId = '';
            if(!_.isUndefined(objectHoTro)){
                let rtHoTro = objectHoTro.recordTypeInfos;
                if(_.isArray(rtHoTro)){
                    rtHoTro = rtHoTro.filter(x => {
                        return x.name == recordTypename;
                    });
                    if(rtHoTro.length > 0) rtId = rtHoTro[0].recordTypeId
                }
            }

            objRes.Ho_tro__c = [];
            for(let i = 0; i <= hoTroParams.length - 1; i++){
                if(!_.isEmpty(rtId)) hoTroParams[i].RecordTypeId = rtId;
                let validate = await objectLibs.validateObject(objectTicket, hoTroParams[i]);
                if (validate.success != true) {
                    return response.fail(req, res, validate.body, statusCode.INVALID_PARAMS, 'Has params unnecessary');
                }
                hoTroParams[i].f_uuid__c = objRes.id;
                hoTroParams[i].from__c = params.from__c;
                //if(!_.isEmpty(rtId)) hoTroParams[i].RecordTypeId = rtId;

                let hotroRes = await pgRepository.create(schema,objectTicket.toLowerCase(),'merchant,created_at,f_uuid__c', [
                    params.from__c,Date.now(),objRes.id
                ]);
                let gw_trackings = await pgRepository.create(schema,'gw_trackings','object,value,operation,created_at,merchant,uuid__c', [
                    objectTicket.toLowerCase(),hoTroParams[i],consts.JOB_OPERATION_INSERT,Date.now(),params.from__c,hotroRes.id
                ]);

                if(!gw_trackings.success){
                    return response.fail(req, res, gw_trackings, statusCode.PG_INVALID_PARAMS);
                }
                objRes.Ho_tro__c.push(hotroRes.id);
            }
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
}
// put
exports.update = async (req, res, next) => {
    try{
        let params = req.body;
        params = objectLibs.clean(params);
        params.id = req.params.id;
        // clean params
        // params = objectLibs.clean(params);
        // check validate Id Sf
        const schJoi = Joi.object({
            id: Joi.string().required().pattern(new RegExp('^[A-Za-z0-9]{15}(?:[A-Za-z0-9]{3})?$','mi'), 'id')
        }).unknown(true);
        await schJoi.validateAsync(params);
        let data = await baseService.update(schema, object, params);
        return response.success(req, res, data, statusCode.SUCCESS);
    }catch(e){
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
}
