const baseRepository = require('../../../services/repository'),
	response = require('../../../libs/response'),
	statusCode = require('../../../consts/statusCode'),
    consts = require('../../../consts'),
    { redis, pgsql } = require('../../../libs/db'),
    winston = require('../../../configs/winston');

exports.detail = async (req, res, next) => {
    if(req.body.callId == '' || req.body.callId == null || req.body.callId == undefined){
        return response.fail(req, res, {}, consts.INVALID_PARAMS);
    }
    let state = req.body.state?req.body.state:'hangup';
    let data = await pgsql.query(`SELECT * FROM ${process.env.PG_SCHEMA}.gw_call_logs WHERE call_id = $1 AND duration IS NOT NULL AND record_url IS NOT NULL`, [req.body.callId]);
    if(data.rows.length <= 0)
        return response.success(req, res, {});
    return response.success(req, res, data.rows[0]);
}

exports.details = async (req, res, next) => {
    if(req.body.callIds == '' || req.body.callIds == null || req.body.callIds == undefined){
        return response.fail(req, res, [], consts.INVALID_PARAMS);
    }
    let callIds = req.body.callIds;
    let state = req.body.state?req.body.state:'hangup';
    let cdrIds = await pgsql.query(`select DISTINCT(cdrid), call_id, callee_id from ${process.env.PG_SCHEMA}.gw_call_logs where (call_id = ANY($1) OR callee_id = ANY($1)) AND duration IS NOT NULL AND record_url != ''`, [callIds]);
    if(cdrIds.rows.length <= 0){
        return response.success(req, res, cdrIds.rows);
    }
    
    let arrCdrIds = [];
    let i = 0;
    while (i < cdrIds.rows.length) {
      arrCdrIds.push(cdrIds.rows[i].cdrid);
      i++;
    }

    let data = await pgsql.query(`select * from ${process.env.PG_SCHEMA}.gw_call_logs where cdrid = ANY($1) AND duration IS NOT NULL AND record_url != '' AND (status = 'answer' OR status = 'hangup')`, [arrCdrIds]);
    if(data.rows.length <= 0){
        return response.success(req, res, data.rows);
    }

    let body = [];
    for(let i=0; i < data.rows.length; i++){
        for(let j=0; j<cdrIds.rows.length; j++){
            if(data.rows[i].cdrid == cdrIds.rows[j].cdrid){
                data.rows[i].call_id = cdrIds.rows[j].call_id;
                data.rows[i].callee_id = cdrIds.rows[j].callee_id;
            }
        }
        body.push(data.rows[i]);
        
        // if(data.rows[i].type == 'inbound'){
        //     if(data.rows[i].refer != ''){
        //         //console.log(data.rows[i].refer);
        //         if(data.rows[i].status == 'hangup'){
        //             body.push(data.rows[i]);
        //         }
        //     }else{
        //         console.log(data.rows[i]);
        //         if(data.rows[i].status == 'answer'){
        //             body.push(data.rows[i]);
        //         }
        //     }
        // }else{
        //     if(data.rows[i].status == 'hangup'){
        //         body.push(data.rows[i]);
        //     }
        // }
    }

    return response.success(req, res, body);
}