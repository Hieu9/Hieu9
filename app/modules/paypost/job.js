require('dotenv').config();

var CronJob = require('cron').CronJob;
var kue = require('kue');
const csv = require('csvtojson'),
	{ redis, pgsql } = require('./libs/db'),
	{ jobs_sf, SCHEDULE_JOB_SF} = require('./configs/schedule'),
	dbConfig = require('./configs/database');

const Expired_Redis = 3600*24*30;

var queue = kue.createQueue(dbConfig.redisKue);
queue.setMaxListeners(10000);

console.log('\n  🚂  Job PAYPOST - SF running');

queue.on('job enqueue', function(id, type){
	// console.log( 'Job %s got queued of type %s', id, type );
});
try{
	// job process batch main
	for(let i=0; i < jobs_sf.length; i++){
		let schedule = jobs_sf[i].schedule?jobs_sf[i].schedule:SCHEDULE_JOB_SF;
		let totalRecord = jobs_sf[i].totalRecord?jobs_sf[i].totalRecord:process.env.JOB_NUM_RECORD;
		let numRecord = jobs_sf[i].numRecord?jobs_sf[i].numRecord:process.env.JOB_NUM_RECORD;
		// get job by merchant
		if(jobs_sf[i].merchant != undefined){
			new CronJob(schedule, async function() {
					let number = 3; // số lần đẩy lên SF nếu chưa được đẩy
					let status = 0; // trạng thái default khi chưa xử lý
					let merchant = jobs_sf[i].merchant.toUpperCase();
					let externalId = jobs_sf[i].externalIdFieldName;
					let object = jobs_sf[i].object.toLocaleLowerCase();
					let sql = `SELECT count(DISTINCT value->> '${externalId}') FROM ${process.env.PAYPOST_PG_SCHEMA}.${object} 
					WHERE operation = '${jobs_sf[i].operation}' AND status = ${status} AND number < ${number} 
					AND sf_job_id IS NULL 
					AND merchant = '${merchant}' AND object = '${object}'`;
					await jobProcessRecord(sql,jobs_sf[i],merchant,totalRecord,numRecord);
				}, function () {
					/* This function is executed when the job stops */
					console.log('JOB FAIL');
				}, true, /* Start the job right now */
				process.env.TIME_ZONE /* Time zone of this job. */
			).start();
		}
	}
}catch (e){
	console.log(e.stack);
}

// job process get record create object
async function jobProcessRecord(sql, job, merchant, totalRecord, numRecord){
	try{
		let object = job.object;
		let operation = job.operation;
		let now_at = Date.now();
		let countObjRecord = await pgsql.query(sql);
		let countRecord = (parseInt(countObjRecord.rows[0].count) <= totalRecord)?parseInt(countObjRecord.rows[0].count):totalRecord;
		let timeRecord = Math.ceil(countRecord/numRecord);
		// if(object == 'Case' && operation == 'insert' && merchant.toUpperCase() == 'BCCP'){
		// 	console.log(countRecord);
		// }
		if(countRecord > 0){
			let data =  {
							title: `Job run at ${merchant} with object: ${object} operation is ${operation} at ${now_at}`,
							operation,object,now_at, countRecord, numRecord, timeRecord
						};
			// run job
			let chanel = `${merchant}_${process.env.PAYPOST_PG_SCHEMA}_${object.toLowerCase()}_${operation}`;
			console.log(chanel);
			queue.create(chanel, data)
				.attempts(3) // if job fails retry 3 times
				.backoff({delay: 60*2*1000, type:'fixed'}) // wait 60s before retry
				.save(async function(error) {
					if (!error){
						// log job
						console.log(data.title);
					}else{
						await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:job:${merchant}:${new Date().toISOString().slice(0,10)}:jobProcessSelectRecord:${data.title}-${Date.now()}`, {
							error
						},Expired_Redis);
					}
				});
		}
	}catch (e){
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:job:${merchant}:${new Date().toISOString().slice(0,10)}:jobProcessSelectRecord:${e.message}-${Date.now()}`, {
			error: e.stack,
			name: e.name,
			sql
		}, Expired_Redis);
	}
}