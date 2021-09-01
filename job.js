require('dotenv').config();

var CronJob = require('cron').CronJob;
var kue = require('kue');
const csv = require('csvtojson'),
	pgFormat = require('pg-format'),
	{ redis, pgsql } = require('./app/libs/db'),
	{ jobs, SCHEDULE_JOB, SCHEDULE_PULL_CASE, SCHEDULE_LOGS, SCHEDULE_UPDATE_FAILED} = require('./app/configs/schedule'),
	dbConfig = require('./app/configs/database'),
	moment = require('moment-timezone'),
	statusCodeConst = require('./app/consts/statusCode'),
	baseRepository = require('./app/services/repository'),
	authRepository = require('./app/repositories/auth'),
	SqlString = require('sqlstring'),
	querystring = require('querystring'),
	_ = require('lodash'),
	datetime = require('./app/libs/datetime'),
	pgRepository = require('./app/services/pgRepository'),
	libsFile = require('./app/libs/file');

const folder_token = 'sessions';
const Expired_Redis = 3600*24*30;

var queue = kue.createQueue(dbConfig.redisKue);
queue.setMaxListeners(10000);

console.log('\n  🚂   Job running');

queue.on('job enqueue', function(id, type){
	// console.log( 'Job %s got queued of type %s', id, type );
});

// queue.inactive( function( err, ids ) {
//   ids.forEach( function( id ) {
//     kue.Job.get( id, function( err, job ) {
//       // Your application should check if job is a stuck one
//       job.active();
//     });
//   });
// });

// job process batch main
for(let i=0; i < jobs.length; i++){
	let schedule = jobs[i].schedule?jobs[i].schedule:SCHEDULE_JOB;
	let totalRecord = jobs[i].totalRecord?jobs[i].totalRecord:process.env.JOB_NUM_RECORD;
	let numRecord = jobs[i].numRecord?jobs[i].numRecord:process.env.JOB_NUM_RECORD;
	// get job by merchant
	if(jobs[i].merchant != undefined && jobs[i].merchant.length > 0){
		let arrMerchant = jobs[i].merchant;
		for(let j=0; j < arrMerchant.length; j++){
			new CronJob(schedule, async function() {
					let number = 3; // số lần đẩy lên SF nếu chưa được đẩy
					let status = 0; // trạng thái default khi chưa xử lý
					let merchant = arrMerchant[j].toUpperCase();
					let sql = `SELECT count(*) FROM ${process.env.PG_SCHEMA}.gw_trackings 
							WHERE operation = '${jobs[i].operation}' AND status = ${status} AND number < ${number} 
							AND sf_job_id IS NULL 
							AND merchant = '${merchant}' AND object = '${jobs[i].object.toLowerCase()}'`;
					await jobProcessRecord(sql,jobs[i],merchant,totalRecord,numRecord);
				}, function () {
					/* This function is executed when the job stops */
					console.log('JOB FAIL');
				}, true, /* Start the job right now */
				process.env.TIME_ZONE /* Time zone of this job. */
			).start();
		}
	}
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
		// if(object == 'Case' && operation == 'insert' && merchant.toUpperCase() == 'MPITS'){
		// 	console.log(countRecord);
		// }
		if(countRecord > 0){
			let data =  {
							title: `Job run at ${merchant} with object: ${object} operation is ${operation} at ${now_at}`,
							operation,object,now_at, countRecord, numRecord, timeRecord
						};
			// run job
			let title = `${merchant}_${process.env.PG_SCHEMA}_${object.toLowerCase()}_${operation}`;
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

// job process get Case from all system 5' and return MPITS
const jobPull = new CronJob(SCHEDULE_PULL_CASE, async function() {
		await jobProcessPullCase(process.env.PG_SCHEMA, 'Case');
	}, function () {
		console.log('JOB FAIL');
	},
	true,
	process.env.TIME_ZONE
);
async function jobProcessPullCase(schema, object){
	let merchant = 'MPITS';
	try{
		let chanel = 'JOBS_PULL_CASE';
		let operation = 'pull';
		let memories = await pgsql.query(`SELECT * FROM ${schema}.gw_memories WHERE operation = '${operation}' AND object = '${object.toLowerCase()}' AND status = 1 ORDER BY created_at DESC LIMIT 1`);

		let memory_at = (memories.rows.length > 0)?memories.rows[0].memory_at:0;

		let memory_f_at = moment.unix(parseInt(memory_at)/1000+1).utc().format("YYYY-MM-DDTHH:mm:ss.SSS")+'+0000';
		let now_memory_at = moment.unix(parseInt(Date.now())/1000).utc().format("YYYY-MM-DDTHH:mm:ss.SSS")+'+0000';
		// login
		let userLogin = await libsFile.readFile(folder_token, process.env.SFUSERNAME);
		if(!userLogin){ userLogin = await authRepository.loginBg(folder_token); }
		let auth = `${userLogin.token_type} ${userLogin.access_token}`;
		let instance_url = userLogin.instance_url;
		// query //  AND Status like '%Đã tiếp nhận%'
		let condition = `From__c != 'MPITS' AND Nga_y_ti_p_nh_n__c >= ${memory_f_at} AND Nga_y_ti_p_nh_n__c <= ${now_memory_at} AND Nhan_vien_CSKH__c != null AND Priority != null AND Origin != null AND Service__c != null AND Status != null AND SuppliedName != null AND SuppliedPhone != null AND Nga_y_ti_p_nh_n__c != null AND Unit__c != null`;
		let query = `SELECT Id, Nga_y_ti_p_nh_n__c FROM Case WHERE ${condition} ORDER BY Nga_y_ti_p_nh_n__c DESC LIMIT 1`;
		const data = await baseRepository.job(`${instance_url}/services/data/v46.0/query?${querystring.stringify({q: query})}`, {}, { 'Authorization': auth, 'Content-Type': 'application/json' },'get', {json: true});

		if(data.statusCode == statusCodeConst.UNAUTHORIED){
			userLogin = await authRepository.loginBg('sessions');
			auth = `${userLogin.token_type} ${userLogin.access_token}`;
			instance_url = userLogin.instance_url;
			data = await baseRepository.job(`${instance_url}/services/data/v46.0/query?${querystring.stringify({q: query})}`, {}, { 'Authorization': auth, 'Content-Type': 'application/json' },'get', {json: true});
		}

		if(data.statusCode == statusCodeConst.SUCCESS){
			console.log(data.body);
			if(data.body.totalSize>0){
				let jobQueue = queue.create(chanel, { title: `Time PULL CASE running MPITS at ${memory_f_at}`, schema, object, memory_at, operation, condition, now_at: Date.now() })
					.attempts(3)
					.backoff({delay: 60*2*1000, type:'fixed'})
					.save(async function(error) {
					if (!error){
						let ngay_tiep_nhan = data.body.records[0].Nga_y_ti_p_nh_n__c;
						if(ngay_tiep_nhan != undefined){
							let sql = `INSERT INTO ${schema}.gw_memories 
							                (memory_at, object, operation, created_at, memory_end_at, job_id) 
							            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;
							            `;
							await pgsql.query(sql, [ moment(ngay_tiep_nhan).tz("UTC").valueOf(), object.toLowerCase(), operation, Date.now(), memory_at, jobQueue.id ]);
							console.log(`Job ${jobQueue.id} run at JOBS_PULL_CASE with object: ${Date.now()}`);
						}else{
							await redis.s(`${process.env.REDIS_KEYPREFIX}:MPITS:job:fail:jobProcessPullCase:Error Ngay tiep nhan-${Date.now()}`, {query},Expired_Redis);
						}
					}else{
						await redis.s(`${process.env.REDIS_KEYPREFIX}:MPITS:job:fail:jobProcessPullCase:Create Job Error-${Date.now()}`, {query},Expired_Redis);
					}
				});
			}
		}
	}catch (e){
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:job:${merchant}:${new Date().toISOString().slice(0,10)}:jobProcessPullCase:${e.message}-${Date.now()}`, {
		  name: e.name,
		  stack: e.stack
		}, Expired_Redis);
	}
}

let jobSaveLogs = new CronJob(SCHEDULE_LOGS,
	async function () {
		console.log('---save log to db---');
		await saveLogsToDB();
	},
	function () {
		/* This function is executed when the job stops */
		console.log('JOB FAIL');
	},
	true, /* Start the job right now */
	process.env.TIME_ZONE /* Time zone of this job. */
);

async function saveLogsToDB () {
	let merchant = 'GATEWAY';
	try{
		let key_redis = 'CountRequest:*' + ':' + datetime.dayvnNow('date',1);
		let keys = await redis.keys(key_redis);
		let data = [];
		if(!_.isUndefined(keys) && _.isArray(keys)){
			await asyncForEach(keys, async (item) => {
				let data_key = await redis.g(item);
				let merchant = item.split(':')[1];
				if(!_.isUndefined(data_key)){
					data_key['save_at'] = item.split(':')[2];
					data[merchant] = data_key;
				}
			});
		}

		let dataInput = [];
		let keyFields = [
			'end_point', 'merchant', 'method', 'total_request','save_at', 'created_at'
		];
		_.mapKeys(data, function (value, key) {
			let save_at = value['save_at'];
			delete value['save_at'];
			_.mapKeys(value, (v, k) => {
				_.mapKeys(v, (x,y) => {
					let item = [];
					//end point
					item.push(SqlString.escape(k));
					//merchant
					item.push(SqlString.escape(key));
					//method
					item.push(SqlString.escape(y));
					//total request
					item.push(SqlString.escape(x));
					//save at
					item.push(SqlString.escape(save_at));
					//created at
					item.push(parseInt((Date.now()/1000).toString()));
					dataInput.push(item);
				});
			});
		});
		await pgRepository.createBatch(process.env.PG_SCHEMA, 'gw_logs', keyFields.join(','), dataInput);
	}catch (e){
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:job:${merchant}:${new Date().toISOString().slice(0,10)}:saveLogsToDB-${e.message}-${Date.now()}`, {
		  name: e.name,
		  stack: e.stack
		}, Expired_Redis);
	}
}


async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
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

cronjobUpdateFailed.start();
jobPull.start();
jobSaveLogs.start();

const jobTest = new CronJob('*/1 * * * *', async function() {
		let auth = 'Bearer 00D0T0000000OyI!AQEAQDHVfMMc0KjaSSJ5w9h7jZ6ypkkb5UUGVJiHEr8GN7J7VeXEK60ElCd0SqwQov_WCfbh2TyJexar9fFAwbmvb10fsVPr';
		const jobFailedResults = await baseRepository.job(`${process.env.INSTANCE_URL}/services/data/v46.0/jobs/ingest/7500T0000005su3/failedResults`, {}, { 'Authorization': auth, 'Content-Type': 'text/csv' },'get', {json: true});

		if(jobFailedResults.statusCode == statusCodeConst.SUCCESS){
			// update to job_fails
			let data = await csv({ quote: '"' }).fromString(jobFailedResults.body);
			const dataUpload = [];
		    data.map(item => {
		    	let itemTmp = [];
		    	let sfError = item.sf__Error?item.sf__Error:'';
		    	itemTmp.push(item.UUID_TRACKING__c);
		    	itemTmp.push(1);
		    	itemTmp.push(sfError);
		    	itemTmp.push(item.sf__Id);
		    	itemTmp.push('7500T0000005su3');
		    	dataUpload.push(itemTmp);
		    });
		    let sql = pgFormat(`WITH trackings AS (UPDATE dev.gw_trackings as dobj SET
					    status = doup.status::int,
					    sf_error = doup.sf_error::varchar(500),
					    sf_id = doup.sf_id::varchar(100),
					    sf_job_id = doup.sf_job_id::varchar(100),
					    updated_at = ${Date.now()} 
					FROM (values %L) as doup(id, status, sf_error, sf_id, sf_job_id)
					WHERE doup.id::uuid = dobj.id 
					RETURNING dobj.uuid__c, dobj.sf_id) UPDATE dev.account obj
						SET sf_id = trackings.sf_id,updated_at = ${Date.now()}
						FROM trackings
						WHERE obj.id = trackings.uuid__c
						RETURNING obj.id`, dataUpload);
		    let result = await pgsql.query(sql);
		}else{
			// insert to tmp_jobs  step = 1
			//throw new Error('Retrieve Failed Error Job Id: 7500T0000005su3');
		}
	}, function () {
		console.log('JOB FAIL');
	},
	true,
	process.env.TIME_ZONE
);
// jobTest.start();
