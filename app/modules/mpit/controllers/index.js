const baseRepository = require('../../../services/repository'),
	response = require('../../../libs/response'),
	statusCode = require('../../../consts/statusCode'),
    url = require('url'),
    _ = require('lodash'),
    sqlstring = require('sqlstring'),
    {redis,pgsql,query} = require('../../../libs/db');

const table_sql = process.env.PG_SCHEMA+'.gw_case_mpit';
exports.list = async (req, res, next) => {
    try{
        let case_number = req.query.case_number;
        if(case_number == null || case_number == undefined){
            return response.fail(req, res, {
                message: 'Yêu cầu nhập Case Number',
                errorCode:statusCode.INVALID_PARAMS
            }, statusCode.INVALID_PARAMS);
        }
        let query_str = `SELECT * FROM ${table_sql} WHERE casenumber like '%${case_number}'`;
        let data = await pgsql.query(query_str);
        return response.success(req, res, data.rows);
    }catch(e){
        return response.fail(req, res, {
            message: e + '',
            errorCode:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};