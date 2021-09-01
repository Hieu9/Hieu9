const pgRepository = require('./pgRepository'),
    { pgsql } = require('../libs/db'),
    consts = require('../consts');

module.exports = {
    update: async function(schema,object,params,operation=consts.JOB_OPERATION_UPDATE){
        try{
            await pgsql.query('BEGIN');
            let gw_id = condition = '';
            // find Id in DB
            if(params.id.length == 18 || params.id.length == 15){
                condition = `sf_id = '${params.id}'`;
            }else{
                condition = `id = '${params.id}'`;
            }
            let objRes = await pgRepository.findFirst(schema, object.toLowerCase(),'id,sf_id', condition);
            
            if(objRes.row == null || objRes.row == undefined){
                let objResNew = await pgRepository.create(schema,object.toLowerCase(),'merchant,created_at', [
                    params.from__c,Date.now()
                ]);
                gw_id = objResNew.id;
            }else{
                gw_id = objRes.row.id;
            }
            let data = await pgRepository.create(schema,'gw_trackings','object,value,operation,created_at,merchant,uuid__c', [
                object.toLowerCase(),params,operation,Date.now(),params.from__c,gw_id
            ]);
            data.id = gw_id;
            await pgsql.query('COMMIT');
            return data;
        }catch(e){
            await pgsql.query('ROLLBACK');
        }
    }
}