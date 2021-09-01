const { pgsql } = require('../libs/db');
const _ = require('lodash');
const pgFormat = require('pg-format');
const SqlString = require('sqlstring');
const consts = require('../consts');
module.exports = {
    find: async (schema, object, fields, conditions) => {
        try{
            let data = await pgsql.query(`SELECT ${fields} FROM ${schema}.${object} WHERE ${conditions}`);
            return data.rows;
        }catch(e){
            return {
                success: false,
                message: e + ''
            };
        }
    },
    findFirst: async function(schema, object, fields = '*', conditions = '1=1'){
        try{
            let sql = `SELECT ${fields} FROM ${schema}.${object} WHERE ${conditions}`;
            let data = await pgsql.query(sql);
            if(data.rows.length > 0){
                return {
                    success: true,
                    row: data.rows[0]?data.rows[0]:null,
                    errors: []
                };
            }else{
                return {
                    success: false,
                    errors: []
                };
            }            
        }catch(e){
            return {
                success: false,
                message: e + ''
            };
        }
    },
    create: async function(schema, object, fields, values){
        try{
            let values_length = '';
            for (let i = 0; i < values.length; i++) {
                if(i == values.length - 1){
                    values_length += '$'+(i+1)+'';
                }else{
                    values_length += '$'+(i+1)+',';
                }
            }
            let sql = `INSERT INTO ${schema}.${object} (${fields}) VALUES (${values_length}) RETURNING Id;`;
            let result = await pgsql.query(sql, values);
            return {
                success: true,
                id: result.rows[0].id,
                errors: []
            };
        }catch(e){
            return {
                success: false,
                message: e + ''
            };
        }
    },
    delete: async function(url, req){
        // return await service.deleteAsyncService(url, req);
    },
    update: async function(url, params, req){
        // return await service.updateAsyncService(url, params, req);
    },
    createTracking: async function(schema, object, fields, valobjs, valtrackings){
        try{
            if(_.isArray(valobjs) && valobjs.length > 0){
                let sql = pgFormat(`INSERT INTO ${schema}.${object} (${fields}) VALUES %L RETURNING *;`, valobjs);
                let resObj = await pgsql.query(sql);
                    sql = pgFormat(`INSERT INTO ${schema}.gw_trackings (object,value,operation,created_at,merchant,uuid__c) VALUES %L RETURNING *;`, valtrackings);
                let resTrackings = await pgsql.query(sql);
                return {
                    success: true,
                    resObj: resObj.rows,
                    resTrackings: resTrackings.rows,
                    errors: []
                };
            }else {
                return {
                    success: false,
                    message: 'Empty record!'
                };
            }
        }catch(e){
            console.log(e);
            return {
                success: false,
                message: e + ''
            };
        }
    },
    createSingleTracking: async function(schema, valtrackings){
        try{
            if(valtrackings.length > 0){
                sql = pgFormat(`INSERT INTO ${schema}.gw_trackings (object,value,operation,created_at,merchant,uuid__c) VALUES %L RETURNING *;`, valtrackings);
                let resTrackings = await pgsql.query(sql);
                return {
                    success: true,
                    resTrackings: resTrackings.rows,
                    errors: []
                };
            }else {
                return {
                    success: false,
                    message: 'Empty record!'
                };
            }
        }catch(e){
            console.log(e);
            return {
                success: false,
                message: e + ''
            };
        }
    },
    createBatch: async function(schema, object, fields, values){
        try{
            if(_.isArray(values) && values.length > 0){
                let valueInsert = [];
                values.forEach(x => {
                    var str_sql = `( ${x.join(',')})`;
                    valueInsert.push(str_sql);
                });
                var str_sql_insert = valueInsert.join(',');
                let sql = `INSERT INTO ${schema}.${object} (${fields}) VALUES ${str_sql_insert} RETURNING id;`;
                let result = await pgsql.query(sql);
                return {
                    success: true,
                    id: result.rows,
                    errors: []
                };
            }else {
                return {
                    success: false,
                    message: 'Empty record!'
                };
            }
        }catch(e){
            console.log(e);
            return {
                success: false,
                message: e + ''
            };
        }
    }
}