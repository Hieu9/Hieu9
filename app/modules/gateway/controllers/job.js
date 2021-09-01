const baseRepository = require('../../../services/repository'),
	response = require('../../../libs/response'),
	statusCode = require('../../../consts/statusCode'),
    consts = require('../../../consts'),
    url = require('url'),
    _ = require('lodash'),
    sqlstring = require('sqlstring'),
    pgFormat = require('pg-format'),
    {redis,pgsql,query} = require('../../../libs/db');

const table_sql = process.env.PG_SCHEMA+'.gw_jobs';
exports.list = async (req, res, next) => {
    try{
        let limit = req.query.limit?req.query.limit:consts.LIMIT;
        let offset = req.query.offset?req.query.offset:consts.OFFSET;
        let orderBy = req.query.orderBy?req.query.orderBy:'created_at DESC';
        let conditions = [];
        _.mapKeys(req.query, function (v, k) {
            if(v){
                switch (k) {
                    case 'id':
                        conditions.push('id = ' + sqlstring.escape(v));
                        break;
                    case 'state':
                        conditions.push('state = ' + sqlstring.escape(v));
                        break;
                    case 'merchant':
                        conditions.push('merchant = ' + sqlstring.escape(v));
                        break;
                    case 'object':
                        conditions.push('object = ' + sqlstring.escape(v));
                        break;
                    case 'pid':
                        conditions.push('pid = ' + sqlstring.escape(v));
                        break;
                    case 'job_id':
                        conditions.push('job_id = ' + sqlstring.escape(v));
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
        condition ? query_str = `SELECT *, to_char(to_timestamp(created_at::numeric/1000) at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD-HH24:MI:SS') as created_at_fm FROM ${table_sql} where ${condition} ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}` : query_str = `SELECT *, to_char(to_timestamp(created_at::numeric/1000) at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD-HH24:MI:SS') as created_at_fm FROM ${table_sql} ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`;
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
