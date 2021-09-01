const baseRepository = require('../../../services/repository'),
	response = require('../../../libs/response'),
	statusCode = require('../../../consts/statusCode'),
    consts = require('../../../consts'),
    libsDt = require('../../../libs/datetime'),
    { redis, pgsql } = require('../../../libs/db'),
    winston = require('../../../configs/winston');

exports.callback = async (req, res, next) => {
    let created_at = new Date().getTime();
    try{
        let data = req.body;
        await redis.s('ctel:data:'+data.cdrId+'-'+created_at, req.body);
        if(data.cdrId == null || data.cdrId == undefined){
            await redis.s('ctel:fail:not-cdrId:'+created_at, JSON.stringify(req.body));
            return response.fail(req, res, {
                'err_code': 1,
                'msg': 'fail'
            }, 400);
        }

        if(data.refer == null || data.refer == undefined){
            data.refer = '';
        }

        let schema = process.env.PG_SCHEMA;
        let sql = `
            INSERT INTO ${schema}.gw_call_logs 
                (call_id,cdrid,duration,answered_duration,record_url,status,type,id_sys,name,username,refer,from_phone,to_phone,created_at,callee_id) 
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
            ;`

        let callLogs = await pgsql.query(sql, [
            data.callerId,data.cdrId,data.duration,data.answeredDuration,data.recordUrl,data.status,data.type,data.extension.id,data.extension.name,data.extension.username,data.refer,data.from,data.to,created_at,data.calleeId
        ]);
        return response.success(req, res, {
            'err_code': 0,
            'msg': 'success'
        }, 200);
    }catch(e){
        let error = e + '';
        await redis.s('ctel:fail:catch:'+created_at, error);
        return response.fail(req, res, {
            'err_code': 1,
            'msg': e + ''
        }, 400);
    }
}

exports.getCallback = async (req, res, next) => {
    // LEAD20191031163052 
    let time = libsDt.dayvnNow('minute');
    let key = `LEAD${time}`;

    for(let i = 0; i <= 500; i++){
        let data = {
            "Id": i,
            "Code": i,
            "Description": "Mô tả "+i,
            "FirstName": "Thu",
            "LastName": "Cúc "+i,
            "Title": null,
            "Phone": null,
            "MobilePhone": "0985632174",
            "Fax": null,
            "Company": "EMD",
            "Email": null,
            "Website": null,
            "LeadSource": "Web",
            "Status": "None"
        }
        let sql = `
            INSERT INTO public.case 
                (key, value, push, created_at, operation) 
            VALUES ($1, $2, $3, $4, $5)
            ;`;
        let created_at = Date.now();
        let callLogs = await pgsql.query(sql, [
            key,
            data,
            0,
            created_at,
            'update'
        ]);
    }
    return response.success(req, res, {
        'err_code': 0,
        'msg': 'success'
    }, 200);
    // console e.log('--------body--------', req.body);
    // // console.log('------ req ------', req);
    // // console.log('------ res ------', res);
    // let body = {
    //     "duration": 5,
    //     "caller": "20449",
    //     "parrentUuid": "8284a080-b271-11e9-91b7-2d807e4ed6e1",
    //     "endedAt": 1564453633000,
    //     // "recordUrl": "http://183.91.11.21//2019-07-30/2019-07-30-09-27-00_0354214164_20449.wav",
    //     "answeredAt": 1564453627000,
    //     "destination": "0354214164",
    //     "context": "external",
    //     "startedAt": 1564453620000,
    //     "state": "hangup",
    //     "uuid": "8284a080-b271-11e9-91b7-2d807e4ed6e3",
    //     "direction": "outbound"
    // };

    // if(body.uuid != null || body.uuid != undefined){
    //     let data = await pgsql.query("SELECT id FROM public.call_logs WHERE uuid = $1", [body.uuid]);
    //     if(data.rows.length <= 0){
    //         let callLogs = await pgsql.query(`INSERT INTO public.call_logs (parrent_uuid,uuid,caller,ended_at,record_url,answered_at,destination,context,started_at,state,direction,duration
    //         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12);`, [
    //             body.parrentUuid,body.uuid,body.caller,body.endedAt,body.recordUrl,body.answeredAt,
    //             body.destination,body.context,body.startedAt,body.state,body.direction,body.duration
    //         ]);
    //     }
    // }
}