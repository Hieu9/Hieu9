const baseRepository = require('../../../services/repository'),
	response = require('../../../libs/response'),
	statusCode = require('../../../consts/statusCode'),
    url = require('url'),
    _ = require('lodash'),
    sqlstring = require('sqlstring'),
    {redis,pgsql,query} = require('../../../libs/db');

// list

const table_sql = process.env.PG_SCHEMA + '.gw_logs';
exports.getLogs = async (req, res, next) => {
    let url_parts = url.parse(req.url, true);
    let params = url_parts.query;
    let condition = [];

    try{
        if(!_.isUndefined(params)){
            if(!_.isUndefined(params['from']) && !_.isUndefined(params['to']) && params['from'] > params['to']){
                return response.fail(req,null,null,statusCode.INVALID_PARAMS,'From greater than to!')
            }
            if(!_.isUndefined(params['from']) && !_.isEmpty(params['from'])){
                let str_from = ` save_at >= ${params['from']} `;
                condition.push(str_from);
            }
            if(!_.isUndefined(params['to']) && !_.isEmpty(params['to'])){
                let str_to = ` save_at <= ${params['to']} `;
                condition.push(str_to) ;
            }
            if(!_.isUndefined(params['merchant'])){
                let str_merchant = ` merchant = ${sqlstring.escape(params['merchant'])} `;
                condition.push(str_merchant) ;
            }
        }
        let condition_str = condition.join('and');
        let query_str = '';
        if(condition_str){
            query_str = `SELECT merchant, end_point, "sum"("total_request"), "method" FROM ${table_sql} where ${condition_str} GROUP BY merchant,end_point,"method"`;
        }else {
            query_str = `SELECT merchant, end_point, "sum"("total_request"), "method" FROM ${table_sql} GROUP BY merchant,end_point,"method"`
        }
        let data = await pgsql.query(query_str);
        return response.success(req, res, data.rows);
    }catch(e){
        return response.fail(req, res, {
            message: e + '',
            errorCode:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }



};