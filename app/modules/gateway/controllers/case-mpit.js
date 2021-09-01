const baseRepository = require('../../../services/repository'),
	response = require('../../../libs/response'),
	statusCode = require('../../../consts/statusCode'),
    consts = require('../../../consts'),
    url = require('url'),
    _ = require('lodash'),
    sqlstring = require('sqlstring'),
    pgFormat = require('pg-format'),
    {redis,pgsql,query} = require('../../../libs/db');

const table_sql = process.env.PG_SCHEMA+'.gw_case_mpit';
exports.list = async (req, res, next) => {
    try{
        console.log('hello')
        let limit = req.query.limit?req.query.limit:consts.LIMIT;
        let offset = req.query.offset?req.query.offset:consts.OFFSET;
        let orderBy = req.query.orderBy?req.query.orderBy:'created_at DESC';
        let conditions = [];
        _.mapKeys(req.query, function (v, k) {
            if(v){
                switch (k) {
                    case 'casenumber':
                        conditions.push('casenumber = ' + sqlstring.escape(v));
                        break;
                    case 'acountid':
                        conditions.push('acountid = ' + sqlstring.escape(v));
                        break;
                    case 'nhan_vien_cskh__c':
                        conditions.push('nhan_vien_cskh__c = ' + sqlstring.escape(v));
                        break;
                    case 'service__c':
                        conditions.push('service__c = ' + sqlstring.escape(v));
                        break;
                    case 'pos__c':
                        conditions.push('pos__c = ' + sqlstring.escape(v));
                        break;
                    case 'status':
                        conditions.push('status = ' + sqlstring.escape(v));
                        break;
                    case 'sfid':
                        conditions.push('sfid = ' + sqlstring.escape(v));
                        break;
                    case 'created_at':
                        if(_.isArray(v)) {
                            v = v.map(x => {
                                return sqlstring.escape((new Date(x).getTime()).toString());
                            });
                            conditions.push('created_at >= ' +  v[0]);
                            conditions.push('created_at <= ' +  v[1]);
                        }
                        break;
                }
            }
        });
        let condition = conditions.join(' and ');
        let query_str = '';
        condition ? query_str = `SELECT *, created_at as created_at_fm FROM ${table_sql} where ${condition} ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}` : query_str = `SELECT *, created_at as created_at_fm FROM ${table_sql} ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`;
        console.log(query_str)
        let data = await pgsql.query(query_str);
        let query_count = '';
        condition ? query_count = `SELECT count(*) FROM ${table_sql} where ${condition}` : query_count = `SELECT count(*) FROM ${table_sql} `;
        let countData = await pgsql.query(query_count);
        return response.successPaginate(req, res, {
            records: data.rows
        }, limit, offset, countData.rows[0].count);
    }catch(e){
        return response.fail(req, res, {
            message: e + '',
            errorCode:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};
