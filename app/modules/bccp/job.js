require('dotenv').config();

var CronJob = require('cron').CronJob;
var kue = require('kue');
const csv = require('csvtojson'),
	{ redis, pgsql } = require('./libs/db'),
	{ jobs_sf, SCHEDULE_JOB_SF, SCHEDULE_UPDATE_FAILED} = require('./configs/schedule'),
	dbConfig = require('./configs/database');

const Expired_Redis = 3600*24*30;

var queue = kue.createQueue(dbConfig.redisSfKue);
queue.setMaxListeners(10000);

console.log('\n  🚂   Job BCCP - SF running');

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
					// let objectRef = 'bccp.order';
					// let keyRef = 'SalesOrderNumber__c';
					// let whereJoin = `CONCAT ('B', first.value ->> 'Batch_Number__c')`;
					// if(object == 'order'){
						let sql = `SELECT count(DISTINCT value->> '${externalId}') FROM ${process.env.BCCP_PG_SCHEMA}.${object} 
						WHERE operation = '${jobs_sf[i].operation}' AND status = ${status} AND number < ${number} 
						AND sf_job_id IS NULL 
						AND merchant = '${merchant}' AND object = '${object}'`;
					// }else if (object == 'package__c'){
					// 	sql = `SELECT count(DISTINCT value->> '${externalId}') FROM ${process.env.BCCP_PG_SCHEMA}.${object} 
					// 	WHERE operation = '${jobs_sf[i].operation}' AND status = ${status} AND number < ${number} 
					// 	AND sf_job_id IS NULL 
					// 	AND merchant = '${merchant}' AND object = '${object}'`;
					// }else{
					// 	sql = `SELECT count(DISTINCT value->> '${externalId}') FROM ${process.env.BCCP_PG_SCHEMA}.${object} first, ${objectRef} second 
					// 	WHERE first.operation = '${jobs_sf[i].operation}' AND first.status = ${status} AND first.number < ${number} 
					// 	AND second.value ->> '${keyRef}' = ${whereJoin} 
					// 	AND second.sf_id IS NOT NULL
					// 	AND first.sf_job_id IS NULL 
					// 	AND first.merchant = '${merchant}' AND first.object = '${object}'`;
					// }
					/*
					SELECT count(DISTINCT value->> 'Batch_Number__c') FROM bccp.batch__c b, bccp.order o 
					WHERE b.operation = 'upsert' AND b.object = 'batch__c' and o.sf_id is not null and o.value ->> 'SalesOrderNumber__c' = CONCAT ('B', b.value ->> 'Batch_Number__c')
					*/		
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
			let title = `${merchant}_${process.env.BCCP_PG_SCHEMA}_${object.toLowerCase()}_${operation}`;
			queue.create(title, data)
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
		},Expired_Redis);
	}
}

/* JOB UPDATE FAILED */
// job process get record create object
async function jobUpdateFailed(){
	let merchant = 'GW';
	let sql = '';
	try{
		let now_at = Date.now();
		let time_more_one_hour = now_at - 5400;
		sql = `SELECT DISTINCT ON (tracking.sf_job_id) sf_job_id, tracking."object", tracking."operation", tracking.merchant, tracking.status, tracking.created_at 
		FROM public.gw_trackings as tracking
		LEFT JOIN public.gw_jobs as jobs ON tracking.sf_job_id = jobs.pid
		WHERE tracking.status = 0 AND (tracking.sf_job_id IS NOT NULL || tracking.sf_job_id != '') 
		AND jobs."state" != 'Failed' AND jobs.number_records_processed != 0 
		AND tracking.number < 3 AND tracking.created_at <= '${time_more_one_hour}' 
		ORDER BY tracking.sf_job_id, tracking.created_at ASC 
		LIMIT 1000 OFFSET 0`;
		let records = await pgsql.query(sql);
		let jobs = records.rows;
		if(jobs.length > 0){
			for(let i = 0; i < jobs.length; i++){
				let data =  {
							title: `Job run at GW WITH JobId: ${jobs[i].sf_job_id} merchant is ${jobs[i].merchant} object is ${jobs[i].object} operation is ${jobs[i].operation} at ${now_at}`,
							sf_job_id: jobs[i].sf_job_id,
							merchant: jobs[i].merchant,
							object: jobs[i].object,
							operation: jobs[i].operation
						};
				// run job
				let title = `GW_SFJOB_UPDATE`;
				queue.create(title, data)
					.attempts(3) // if job fails retry 3 times
					.backoff({delay: 60*2*1000, type:'fixed'}) // wait 120s before retry
					.save(async function(error) {
						if (!error){
							// log job
							console.log(data.title);
							await redis.s(`${process.env.REDIS_KEYPREFIX}:success:job:${merchant}:${new Date().toISOString().slice(0,10)}:jobUpdateFailed:${Date.now()}`, {
								sql, data
							},Expired_Redis);
						}else{
							await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:job:${merchant}:${new Date().toISOString().slice(0,10)}:jobUpdateFailed:${data.title}-${now_at}`, {
								error
							},Expired_Redis);
						}
					});
			}
		}
	}catch (e){
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:job:${merchant}:${new Date().toISOString().slice(0,10)}:jobUpdateFailed:${e.message}-${Date.now()}`, {
			error: e.stack,
			name: e.name,
			sql
		},Expired_Redis);
	}
}

const cronjobUpdateFailed = new CronJob(SCHEDULE_UPDATE_FAILED, async function() {
		await jobUpdateFailed();
	}, function () {
		console.log('JOB FAIL');
	},
	true,
	process.env.TIME_ZONE
);

// cronjobUpdateFailed.start();
