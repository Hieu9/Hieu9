require('dotenv').config();
/* State active, inactive, failed, complete */

const kue = require('kue'),
	cluster = require('cluster'),
	dbConfig = require('./configs/database'),
    { redis, pgsql } = require('./libs/db'),
    objectConfigs = require('./configs/object'),
    dataModel = require('./models/data'),
    pgFormat = require('pg-format'),
    uuidv1 = require('uuid/v1'),
    _ = require('lodash'),
    {jobs} = require('./configs/schedule');

const { async } = require('q');
    
let queue = kue.createQueue(dbConfig.redisKue);
queue.setMaxListeners(10000);
queue.watchStuckJobs(1000);
var clusterWorkerSize = require('os').cpus().length;

console.log('\n 🚂 BCCP  Worker running');

const Expired_Redis = 3600;

queue.on( 'error', function( err ) {
	console.log( 'Oops... ', err );
});

if (cluster.isMaster) {
	for (var i = 0; i < clusterWorkerSize; i++) {
		cluster.fork();
	}
} else {
    // process save data from job suitecrm to database
    for(let i=0; i < jobs.length; i++){
		if(jobs[i].merchant != undefined){
			processPullData(jobs[i]);
		}
	}
}
async function processPullData(jobs){
    try{
        let chanel = `${jobs.merchant}_PULL_${jobs.object.toLowerCase()}_${jobs.operation}`;
        console.log(chanel);
        queue.process(chanel, 1, async function(job, done){
            let data = job.data
            try{
                let keyRedis = `${process.env.REDIS_KEYPREFIX}:DATABASE:${data.key}`;
                let dataRedisOld = await redis.g(keyRedis);
                if(dataRedisOld.length <= 0){
                    // log error redis
                    return false;
                }
                
                let dataRedis = funcMapFields(dataRedisOld, objectConfigs.fields[jobs.object]);
                
                let check  = true;
                let sobjects = [];
                let orders = [];
                for(let i=0; i<dataRedis.length; i++){
                    dataRedis[i].From__c = 'BCCP';
                    if(data.object.toLowerCase() === 'receipt__c'){
                        dataRedis[i].External_Receipt_Id__c = `R${dataRedis[i].Package_Number__c}`;
                    }
                    if(typeof dataRedis[i][objectConfigs.externalIds[data.object.toLowerCase()]] !== 'undefined' ){
                        let sobject = createObjTrack(data.merchant,data.object.toLowerCase(),data.operation,dataRedis[i],job.id);

                        sobjects.push(sobject);
                        if(data.object === 'Batch__c' || (data.object === 'Package__c' && dataRedis[i].Batch_Number__c == null)){
                            let SalesOrderNumber__c = '';
                            if(data.object === 'Batch__c'){
                                SalesOrderNumber__c = `B${dataRedis[i].Batch_Number__c}`;
                            }
                            if(data.object === 'Package__c'){
                                SalesOrderNumber__c = `P${dataRedis[i].Package_Number__c}`;
                            }

                            let value = {SalesOrderNumber__c, From__c: 'BCCP', 'Account.Ma_khach_hang__c': "99999999999999999", Status: 'Draft', EffectiveDate: new Date().toISOString().slice(0,10)};
                            let order = createObjTrack(data.merchant,'order',data.operation,value,job.id);
                            orders.push(order)
                        }
                    }else{
                        check = false;
                    }
                }
                // insert batchs
                if(sobjects.length > 0){
                    await insertBigData(sobjects, data.object.toLowerCase());
                }
                // // insert salesorder
                if(orders.length > 0){
                    await insertBigData(orders, 'order');
                }
                if(check){
                    // await redis.del(keyRedis,function (err, reply) {
                    //     console.log("Redis Del Key", keyRedis);
                        done();
                    // });
                }else{
                    return done(new Error('Error data'));
                }
            }catch(e){
                console.log(e.stack);
                await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${data.merchant}:${new Date().toISOString().slice(0,10)}:${job.type}-${e.message}-${Date.now()}`, {name: e.name,stack: e.stack}, Expired_Redis);
                return done(new Error(e.stack));
            }
        });
    }catch(e){
        console.log(e.stack);
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${new Date().toISOString().slice(0,10)}:processPullData-${e.message}-${Date.now()}`, {name: e.name,stack: e.stack}, Expired_Redis);
		//return done(new Error(e.stack+''));
	}
}

function createObjTrack(merchant, object, operation, value, job_id){
    let obj = {
        id: uuidv1(),
        status: 0,
        merchant,
        value,
        object,
        operation,
        job_id,
        uuid__c: uuidv1(),
        created_at: Date.now()
    }
    return obj;
}

async function insertBigData(trackings, object, limitRecord = 1000){
    try {
        // begin a transaction
        await pgsql.query('BEGIN');
        //5700 . 4 lan
        if(trackings.length > limitRecord){
            let number = Math.ceil(trackings.length/limitRecord);
            // i = 0; i <= 4; i++
            for(let i = 0; i <= number; i++){
                let dataUpdate = [];
                let dataOffset = limitRecord*(i+1);
                if(dataOffset >= trackings.length){
                    dataOffset = trackings.length + 1;
                }
                for(let j = i*limitRecord; j < dataOffset; j++){
                    if(trackings[j]){
                        dataUpdate.push(trackings[j]);
                    }
                }
                if(dataUpdate.length > 0){
                    let query = dataModel[object].insert(dataUpdate).returning(dataModel[object].id).toQuery();
                    await pgsql.query(query);
                }
            }
        }else{
            if(trackings.length > 0){
                let query = dataModel[object].insert(trackings).returning(dataModel[object].id).toQuery();
                await pgsql.query(query);
            }else{
                await pgsql.query('ROLLBACK');
            }
        }
        // commit transaction
        await pgsql.query('COMMIT');
        return true;
    } catch (err) {
        console.log(err.stack);
        await pgsql.query('ROLLBACK');
    }
}

function funcMapFields(dataRes, mapFields){
	let datas = [];
	// lấy ra các field trong field map
	for(let i = 0; i<dataRes.length; i++){
		let jsonValue = dataRes[i];
		_.each(jsonValue, function(value, key) {
			key = mapFields[key] || key;
			jsonValue[key] = value;
		});
		let item = _.pick(jsonValue, Object.keys(mapFields)); // oposite omit
		datas.push(item);
	}

	// lấy ra các field # trong field map

	let dataDone = [];

	for(let i = 0; i<datas.length; i++){
		let jsonValue = datas[i];
		_.each(jsonValue, function(value, key) {
			key = mapFields[key] || key;
			jsonValue[key] = value;
		});
		//console.log(Object.values(mapFields));
		let it = _.pick(jsonValue, Object.values(mapFields));
		dataDone.push(it);
	}
	return dataDone;
}