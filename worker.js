require('dotenv').config();
/* State active, inactive, failed, complete */

const kue = require('kue'),
	cluster = require('cluster'),
	fs = require('fs'),
	path = require('path'),
	csv = require('csvtojson'),
	libsDt = require('./app/libs/datetime'),
	libsFile = require('./app/libs/file'),
	libsString = require('./app/libs/string'),
	//utilLibs = require('./app/libs/utility'),
	mkdirp = require('mkdirp'),
	statusCodeConst = require('./app/consts/statusCode'),
	baseRepository = require('./app/services/repository'),
	pgRepository = require('./app/services/pgRepository'),
	authRepository = require('./app/repositories/auth'),
	{ jobs } = require('./app/configs/schedule'),
	dbConfig = require('./app/configs/database'),
	{ redis, pgsql } = require('./app/libs/db'),
	pgFormat = require('pg-format'),
	querystring = require('querystring'),
	_ = require('lodash'),
	moment = require('moment-timezone');

let queue = kue.createQueue(dbConfig.redisKue);
queue.setMaxListeners(10000);
//queue.watchStuckJobs(1000);
var clusterWorkerSize = require('os').cpus().length;

// queue.inactive( function( err, ids ) {
//   ids.forEach( function( id ) {
//     kue.Job.get( id, function( err, job ) {
//       // Your application should check if job is a stuck one
//       job.active();
//     });
//   });
// });

console.log('\n  🚂   Worker running');

const folder_token = process.env.FOLDER_SESSION;
const PGSCHEMA = process.env.PG_SCHEMA;
const Expired_Redis = 3600*24*30;

queue.on( 'error', function( err ) {
	console.log( 'Oops... ', err );
});

if (cluster.isMaster) {
	for (var i = 0; i < clusterWorkerSize; i++) {
		cluster.fork();
	}
} else {
	for(let i=0; i < jobs.length; i++){
		if(jobs[i].merchant != undefined && jobs[i].merchant.length > 0){
			let arrMerchant = jobs[i].merchant;
			for(let j=0; j < arrMerchant.length; j++){
				processQueue(arrMerchant[j].toUpperCase(), jobs[i]);
			}
		}
	}
}

async function processQueue(merchant, jobs){
	try{
		let schema = process.env.PG_SCHEMA;
		let chanel = `${merchant}_${schema}_${jobs.object.toLowerCase()}_${jobs.operation}`;
		let object = jobs.object.toLowerCase();
		let operation = jobs.operation;
		let externalIdFieldName = jobs.externalIdFieldName?jobs.externalIdFieldName:'Id';

		queue.process(chanel, 12, async function(job, done){
			// variable
			let timenow = Date.now();
			let time = libsDt.dayvnNow('date');
			let now_at = job.data.now_at;
			console.log(`${merchant}_${schema}_${object}_${operation} working on job ${job.id} at ${timenow}`);
			// path file
			let dir = path.join('./', `csvs/${merchant}/${object}/${operation}`);
			let dirExist = await fs.existsSync(dir);
			if (!dirExist){ mkdirp.sync(dir, {mode: 777});}

			const filePath = path.join(dir, `./${merchant}-${object}-${operation}-${job.id}-${time}-${now_at}.csv`);
			var dataIdUpdate = [];
			for(let i = 0; i < job.data.timeRecord; i++){
				let limit = job.data.numRecord;
				let offset = i*job.data.numRecord;
				let objectResult = null;
				let sql = '';
				if(operation != 'upsert'){
					sql = `SELECT DISTINCT ON (uuid__c) uuid__c,* FROM ${schema}.gw_trackings 
						WHERE operation = $1 AND status = $2 AND sf_job_id IS NULL AND number < $3 AND merchant = $4 AND object = $5  
						ORDER BY uuid__c, created_at ASC LIMIT $6 OFFSET $7`;
				}else{
					sql = `SELECT DISTINCT ON (uuid__c) uuid__c,* FROM ${schema}.gw_trackings 
						WHERE operation = $1 AND status = $2 AND sf_job_id IS NULL AND number < $3 AND merchant = $4 AND object = $5  
						ORDER BY uuid__c, created_at ASC LIMIT $6 OFFSET $7`;
				}
				objectResult = await pgsql.query(sql, [
					job.data.operation,0,3,merchant,object,limit,offset
				]);

				let objectResultRows = objectResult.rows;
				let data = [];
				for(let j = 0; j < objectResultRows.length; j++){
					let record = objectResultRows[j].value;
					record.uuid__c = objectResultRows[j].uuid__c;
					record.uuid_tracking__c = objectResultRows[j].id;
					data.push(record);
					dataIdUpdate.push(objectResultRows[j].id);
				}
				await libsFile.writeFileSync(filePath, data, `${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:file-create:${object}:${operation}:${job.id}:${timenow}`, i);
			}

			//use auth login if not login after relogin and set session
			let userLogin = await libsFile.readFile(folder_token, process.env.SFUSERNAME);
			if(!userLogin){
				userLogin = await authRepository.loginBg(folder_token);
				if(userLogin == null){
					return done(new Error('Not Login SF'));
				}
			}
			let auth = `${userLogin.token_type} ${userLogin.access_token}`;
			let instance_url = userLogin.instance_url;
			let dataJob = { object, contentType: "CSV", operation, lineEnding: "CRLF", columnDelimiter: "COMMA"};
		    if(operation == 'upsert'){
		    	dataJob.externalIdFieldName = externalIdFieldName;
		    }
			let jobSfResult = await baseRepository.job(`${instance_url}/services/data/v46.0/jobs/ingest`,
				dataJob,
				{ 'Authorization': auth, 'Content-Type': 'application/json' },'post', { json: true });
			if(jobSfResult.statusCode != statusCodeConst.SUCCESS){
				if(jobSfResult.statusCode == statusCodeConst.UNAUTHORIED){
					let userLogin = await authRepository.loginBg('sessions');
					if(userLogin != null){
						auth = `${userLogin.token_type} ${userLogin.access_token}`;
						jobSfResult = await baseRepository.job(`${instance_url}/services/data/v46.0/jobs/ingest`,
						dataJob, { 'Authorization': auth, 'Content-Type': 'application/json' },'post', { json: true });
						if(jobSfResult.statusCode != statusCodeConst.SUCCESS){
							await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:processQueue-UnAuthorization-${Date.now()}`, jobSfResult.body,Expired_Redis);
						}
					}else{
						job.log('$%d Not Login SF', job.id);
						await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:processQueue-UnAuthorization-${Date.now()}`, jobSfResult.body,Expired_Redis);
						return done(new Error('Not Login SF'));
					}
				}else{
					job.log('$%d Not Login SF', job.id);
					await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:processQueue-UnAuthorization-${Date.now()}`, jobSfResult.body,Expired_Redis);
					return done(new Error('Not Login SF'));
				}
			}
			let jobSfResultBody = jobSfResult.body;
			// job process
			await processJob(merchant, object, operation, filePath, job.id, jobSfResultBody, auth,instance_url, dataIdUpdate, done);
			done();
		});
	}catch(e){
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:processQueue-${e.message}-${Date.now()}`, {name: e.name,stack: e.stack}, Expired_Redis);
		return done(new Error(e.stack+''));
	}
}

async function processJob(merchant, object, operation, pathFile, job_id, jobSfResultBody, auth, instance_url, dataIdUpdate, done){
	try{
		let created_at = Date.now();
	    let keyRedis = `${PGSCHEMA}:${object}:${operation}:${jobSfResultBody.id}-${job_id}-${libsDt.format(created_at)}`;
		// save job
	    let csvData = await fs.readFileSync(pathFile, {encoding: 'utf8'});

	    const batchResult = await baseRepository.job(`${instance_url}/${jobSfResultBody.contentUrl}`, csvData, { 'Authorization': auth, 'Content-Type': 'text/csv' },'put', {json: false});

		if(batchResult.statusCode == statusCodeConst.POST_SUCCESS){
		    const batchDone = await baseRepository.job(`${instance_url}/services/data/v46.0/jobs/ingest/${jobSfResultBody.id}`, { state: "UploadComplete" }, { 'Authorization': auth, 'Content-Type': 'application/json' },'patch');

		    if(batchDone.statusCode == statusCodeConst.SUCCESS){
				// update data with job id
				await updateJobId(merchant, dataIdUpdate, jobSfResultBody.id, done);
		    	// insert db
		    	let sql = `
	            INSERT INTO ${PGSCHEMA}.gw_jobs 
	                (pid, job_id, operation, object, created_by_id, created_date, system_modstamp, state, concurrency_mode, content_type, api_version, content_url, line_ending, column_delimiter, created_at, merchant) 
	            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
	            RETURNING id;`;
		        let jobsResult = await pgsql.query(sql, [
		            jobSfResultBody.id, job_id, jobSfResultBody.operation, jobSfResultBody.object,
		            jobSfResultBody.createdById, jobSfResultBody.createdDate, jobSfResultBody.systemModstamp,
		            jobSfResultBody.state, jobSfResultBody.concurrencyMode, jobSfResultBody.contentType,
		            jobSfResultBody.apiVersion, jobSfResultBody.contentUrl, jobSfResultBody.lineEnding,
		            jobSfResultBody.columnDelimiter, created_at, merchant
		        ]);
		        if(jobsResult.rows.length > 0){
		        	//console.log(jobsResult.rows);
		        	// sleep
		        	//await utilLibs.sleep(1);
		        	//remove file
			    	let fileUnlink = await fs.unlinkSync(pathFile);
			    	if(fileUnlink != undefined){
			    		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:unlink:${keyRedis}`, fileUnlink,Expired_Redis);
			    	}
			    	// poll data
			    	await poll(merchant, PGSCHEMA, jobSfResultBody.id, auth, instance_url, done);
		        }else{
		        	await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:processJob:Not save jobs to GW-${Date.now()}`, jobsResult.body,Expired_Redis);
					return done(new Error('Not save jobs to GW'));
		        }
		    }else{
		    	await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:processJob:Not change status Job to GW-${Date.now()}`, batchDone.body,Expired_Redis);
				return done(new Error('Not change status Job to GW'));
		    }
	    }else{
	    	await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:processJob:Not create Job to GW-${Date.now()}`, batchResult.body,Expired_Redis);
			return done(new Error('Not create Job to GW'));
		}
	}catch(e){
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:processJob-${e.message}-${Date.now()}`, {name: e.name,stack: e.stack}, Expired_Redis);
		return done(new Error(e.stack));
	}
}

async function poll(merchant, schema, jobId, auth, instance_url, interval = 1 * 60 * 1000, timeout = 60 * 60 * 1000, done){
	var startTime = new Date().getTime();
	var poll = async function() {
		try{
			var now = new Date().getTime();
			if (startTime + timeout < now) {
				var err = new Error("Polling time out. Job Id = " + jobId);
				err.name = 'PollingTimeout';
				err.jobId = jobId;
				throw new Error(err);
			}
			const jobResult = await baseRepository.job(`${instance_url}/services/data/v46.0/jobs/ingest/${jobId}`, {}, { 'Authorization': auth, 'Content-Type': 'text/csv' },'get', {json: true});
			if (jobResult.statusCode != statusCodeConst.SUCCESS) {
				//throw new Error(err);
				setTimeout(poll, interval);
			} else {
			    if (jobResult.body.state === "Failed") {
					if (parseInt(jobResult.body.numberRecordsProcessed, 10) > 0) {
						await retrieve(merchant, jobResult.body, instance_url, auth, schema, done);
					}
			    } else if (jobResult.body.state === "JobComplete") {
					await retrieve(merchant, jobResult.body, instance_url, auth, schema, done);
			    } else {
					setTimeout(poll, interval);
			    }
		  		// update JOB
		  		let errMsg = (jobResult.body.errorMessage != undefined)?jobResult.body.errorMessage:'';
		  		let sql = pgFormat(`UPDATE ${schema}.gw_jobs 
									SET state = '${jobResult.body.state}',number_records_processed = '${jobResult.body.numberRecordsProcessed}', 
									number_records_failed = '${jobResult.body.numberRecordsFailed}', sf_error = '${errMsg}'
									WHERE pid = '${jobId}' RETURNING id;`);
				await pgsql.query(sql);
		  	}
		}catch(e){
			await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:poll:${e.message}-${Date.now()}`, {name: e.name,stack: e.stack}, Expired_Redis);
			return done(new Error('poll Error'));
		}
	};
	setTimeout(poll, interval);
}

async function retrieve(merchant, jobInfo, instance_url, auth, schema = '', done){
	try{
		if(jobInfo.numberRecordsFailed > 0){
			const jobFailedResults = await baseRepository.job(`${instance_url}/services/data/v46.0/jobs/ingest/${jobInfo.id}/failedResults`, {}, { 'Authorization': auth, 'Content-Type': 'text/csv' },'get', {json: true});
			if(jobFailedResults.statusCode == statusCodeConst.SUCCESS){
				// update to job_fails
				let data = await csv({ quote: '"' }).fromString(jobFailedResults.body);
				await updateToJobStatus(merchant, jobInfo.id, jobInfo.object, data, 2, done);
				// transform and sent to MyVnpost
				await sentToMerchant(merchant, jobInfo.object, data, done);
			}else{
				await poll(merchant, schema, jobInfo.id, auth, instance_url, done);
				// insert to tmp_jobs  step = 1
				await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:retrieve:failedResults:${jobInfo.id}:${Date.now()}`, {
					body: jobFailedResults.body,
					statusCode: jobFailedResults.statusCode
				},Expired_Redis);
			}
		}
		let numberRecordsSuccess = jobInfo.numberRecordsProcessed - jobInfo.numberRecordsFailed;
		if(numberRecordsSuccess > 0){
			const successfulResults = await baseRepository.job(`${instance_url}/services/data/v46.0/jobs/ingest/${jobInfo.id}/successfulResults`, {}, { 'Authorization': auth, 'Content-Type': 'text/csv' },'get', {json: true});
			if(successfulResults.statusCode == statusCodeConst.SUCCESS){
				// update to job_fails
				let dataSuccessfulResults = await csv({ quote: '"' }).fromString(successfulResults.body);
				await updateToJobStatus(merchant, jobInfo.id, jobInfo.object, dataSuccessfulResults, 1, done);
			}else{
				await poll(merchant, schema, jobInfo.id, auth, instance_url, done);
				await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:retrieve:successfulResults:${jobInfo.id}:${Date.now()}`, {
					body: successfulResults.body,
					number: numberRecordsSuccess,
					statusCode: successfulResults.statusCode
				},Expired_Redis);
			}
		}
	}catch(e){
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:retrieve:${e.message}-${Date.now()}`, {name: e.name,stack: e.stack}, Expired_Redis);
		return done(new Error(e.stack));
	}
}

async function updateToJobStatus(merchant, sf_job_id, object, data, status, done){
	let sql = '';
	let result = null;
	try{
		const dataUpload = [];
		if(data != undefined){
			data.map(item => {
		    	let itemTmp = [];
		    	let sfError = item.sf__Error?item.sf__Error:'';
		    	if(item.uuid_tracking__c != undefined && (item.uuid_tracking__c != null || item.uuid_tracking__c != '')){
		    		if(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(item.uuid_tracking__c)){
			    		itemTmp.push(item.uuid_tracking__c);
				    	itemTmp.push(status);
				    	itemTmp.push(sfError);
				    	itemTmp.push(item.sf__Id);
				    	itemTmp.push(sf_job_id);
				    	dataUpload.push(itemTmp);
				    }
		    	}
		    });
		    if(dataUpload){
		    	if(dataUpload.length > 0){
		    		let limitRecord = 1000;
					if(dataUpload.length > limitRecord){
						let number = Math.ceil(dataUpload.length/limitRecord);
						// i = 0; i <= 4; i++
						for(let i = 0; i <= number; i++){
							let dataUpdate = [];
							let dataOffset = limitRecord*(i+1);
							if(dataOffset >= dataUpload.length){
								dataOffset = dataUpload.length + 1;
							}
							// Lan 1: j = 0; j < 1600
							// Lan 2: j = 1600; j < 3200
							// Lan 3: j = 3200; j < 4800
							// Lan 4: j = 4800; j < 5700
							for(let j = i*limitRecord; j < dataOffset; j++){
								if(dataUpload[j]){
									dataUpdate.push(dataUpload[j]);
								}
							}
							if(dataUpdate.length > 0){
								sql = pgFormat(`WITH trackings AS (UPDATE ${PGSCHEMA}.gw_trackings as dobj SET
										    status = doup.status::int,
										    sf_error = doup.sf_error::varchar(500),
										    sf_id = doup.sf_id::varchar(100),
										    sf_job_id = doup.sf_job_id::varchar(100),
										    updated_at = ${Date.now()} 
										FROM (values %L) as doup(id, status, sf_error, sf_id, sf_job_id)
										WHERE doup.id::uuid = dobj.id 
										RETURNING dobj.uuid__c, dobj.sf_id) UPDATE ${PGSCHEMA}.${object.toLowerCase()} obj
											SET sf_id = trackings.sf_id,updated_at = ${Date.now()}
											FROM trackings
											WHERE obj.id = trackings.uuid__c
											RETURNING obj.id`, dataUpdate);
								result = await pgsql.query(sql);
							}
						}
					}else{
				    	sql = pgFormat(`WITH trackings AS (UPDATE ${PGSCHEMA}.gw_trackings as dobj SET
							    status = doup.status::int,
							    sf_error = doup.sf_error::varchar(500),
							    sf_id = doup.sf_id::varchar(100),
							    sf_job_id = doup.sf_job_id::varchar(100),
							    updated_at = ${Date.now()} 
							FROM (values %L) as doup(id, status, sf_error, sf_id, sf_job_id)
							WHERE doup.id::uuid = dobj.id 
							RETURNING dobj.uuid__c, dobj.sf_id) UPDATE ${PGSCHEMA}.${object.toLowerCase()} obj
								SET sf_id = trackings.sf_id,updated_at = ${Date.now()}
								FROM trackings
								WHERE obj.id = trackings.uuid__c
								RETURNING obj.id`, dataUpload);
						result = await pgsql.query(sql);
					}
		    	}
		    }
		}
	}catch(e){
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:updateToJobStatus:${sf_job_id}-${e.message}-${Date.now()}`, {
			stack: e.stack,
			name: e.name,
			sql,
			result
		},Expired_Redis);
		return done(new Error(e.stack));
	}
}

async function updateJobId(merchant, data, sf_job_id, done){
	let sql = '';
	let result = null;
	try{
		//5700 . 4 lan
		let limitRecord = 1600;
		if(data.length > limitRecord){
			let number = Math.ceil(data.length/limitRecord);
			// i = 0; i <= 4; i++
			for(let i = 0; i <= number; i++){
				let dataUpdate = [];
				let dataOffset = limitRecord*(i+1);
				if(dataOffset >= data.length){
					dataOffset = data.length + 1;
				}
				// Lan 1: j = 0; j < 1600
				// Lan 2: j = 1600; j < 3200
				// Lan 3: j = 3200; j < 4800
				// Lan 4: j = 4800; j < 5700
				for(let j = i*limitRecord; j < dataOffset; j++){
					if(data[j]){
						dataUpdate.push(data[j]);
					}
				}
				if(dataUpdate.length > 0){
					sql = pgFormat(`UPDATE ${PGSCHEMA}.gw_trackings as gt SET 
									    sf_job_id = '${sf_job_id}',
									    updated_at = ${Date.now()} 
									FROM (values %L) as doup(id)
									WHERE doup.id::uuid = gt.id 
									RETURNING gt.id`, [dataUpdate]);
					result = await pgsql.query(sql);
				}
			}
		}else{
			if(data.length > 0){
			    sql = pgFormat(`UPDATE ${PGSCHEMA}.gw_trackings as gt SET 
						    sf_job_id = '${sf_job_id}',
						    updated_at = ${Date.now()} 
						FROM (values %L) as doup(id)
						WHERE doup.id::uuid = gt.id 
						RETURNING gt.id`, [data]);
				result = await pgsql.query(sql);
			}
		}
	}catch(e){
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:updateJobId:${sf_job_id}-${e.message}-${Date.now()}`, {
			stack: e.stack,
			name: e.name,
			sql: sql,
			result
		},Expired_Redis);
		return done(new Error(e.stack));
	}
}

async function sentToMerchant(merchant, object, data, done){
	let dateNow = Date.now();
	try{
		// extract data
		let sql = pgFormat(`SELECT id, url, name, auth FROM ${PGSCHEMA}.gw_sessions WHERE LOWER(name) IN (%L)`, merchant.toLowerCase());
		let sessions = await pgsql.query(sql);
		if(sessions.rows.length > 0){
			for(let i = 0; i < sessions.rows.length; i++){
				// check nếu có url thì trả log, không có thì bỏ qua.
				if(sessions.rows[i].url != null){
					var dataWh = data.filter(function(item) {
					  return libsString.replace(item.from__c, '').toLowerCase()	 == sessions.rows[i].name.toLowerCase();
					});
					let dataRes = { object, rows: dataWh };
					let headers = { 'Content-Type': 'application/json; charset=utf-8' };
					if(sessions.rows[i].auth){
						if(sessions.rows[i].auth.type == 'basic'){
							let auth = "Basic " + Buffer.from(sessions.rows[i].auth.username + ":" + sessions.rows[i].auth.password).toString("base64");
							headers = { 'Content-Type': 'application/json; charset=utf-8', 'Authorization' : auth };
						}else if(sessions.rows[i].auth.type == 'apikey'){
							headers = { 'Content-Type': 'application/json; charset=utf-8', 'Authorization' : `${sessions.rows[i].auth.typeKey} ${sessions.rows[i].auth.key}` };
						}
					}
					let jobRes = await baseRepository.job(sessions.rows[i].url, dataRes, headers,'post', { json: true });
					if(jobRes.statusCode != statusCodeConst.SUCCESS){
						//let base64DataRes = Buffer.from(dataRes).toString("base64");
						// console.log('---------------- Error from MPITS sentToMerchant --------------', jobRes.body)
						// console.log(jobRes.body)
						await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:sentToMerchant:${dateNow}`, {
							message: `SERVER ${sessions.rows[i].name} lỗi nhận callback với statusCode - ${jobRes.statusCode}`,
							errorData: JSON.stringify(jobRes.body),
							dataRes
						},Expired_Redis);
						return done(new Error(`SERVER ${sessions.rows[i].name} lỗi nhận callback với statusCode - ${jobRes.statusCode}`));
					}else{
						//let base64DataRes = Buffer.from(dataRes).toString("base64");
						await redis.s(`${process.env.REDIS_KEYPREFIX}:MPITS:worker:success:JOBS_PUSH_WH:${new Date().toISOString().slice(0,10)}`, { errorData: jobRes, dataRes }, Expired_Redis);
					}
				}
			}
		}
	}catch(e){
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:sentToMerchant:${e.message}-${dateNow}`, {name: e.name,stack: e.stack}, Expired_Redis);
		return done(new Error(e.stack));
	}
}

// queue process pull case
// JOBS_PULL_CASE
queue.process('JOBS_PULL_CASE', async function(job, done){
	let merchant = 'MPITS';
	try{
		// call job data if job not yet complete save tmp_jobs
		let userLogin = await libsFile.readFile(folder_token, process.env.SFUSERNAME);
		if(!userLogin){ userLogin = await authRepository.loginBg(folder_token); }
		let auth = `${userLogin.token_type} ${userLogin.access_token}`;
		let instance_url = userLogin.instance_url;
		let field = 'Id,AccountId,Employee__c,Nhan_vien_CSKH__c,Tai_Lieu_Dinh_Kem__c,CaseNumber,Description,Comments__c,So_Ho_So__c,So_phieu_khieu_nai__c,Priority,Origin,Service__c,Status,CreatedDate,Package__c,SuppliedName,SuppliedPhone,SuppliedEmail,Contact_address__c,Contact_province__c,Contact_district__c,Contact_commune__c,Nga_y_ti_p_nh_n__c,LastModifiedDate,Employee__r.Employee_Code__c,Nhan_vien_CSKH__r.Employee_Code__c,Contact_province__r.Name,Contact_district__r.Name,Contact_commune__r.Name,Service__r.ProductCode,Package__r.Name,Account.Ma_khach_hang__c,Unit__r.Name,(SELECT Id, Name FROM Attachments),UUID__c';

		let orderBy = 'Nga_y_ti_p_nh_n__c ASC'; let limit = 2000;

		let query = `SELECT ${field} FROM ${job.data.object} WHERE ${job.data.condition} ORDER BY ${orderBy} LIMIT ${limit}`;

		const data = await baseRepository.job(`${instance_url}/services/data/v46.0/query?${querystring.stringify({q: query})}`, {}, { 'Authorization': auth, 'Content-Type': 'application/json' },'get', {json: true});

		if(data.statusCode == statusCodeConst.UNAUTHORIED){
			userLogin = await authRepository.loginBg('sessions');
			auth = `${userLogin.token_type} ${userLogin.access_token}`;
			instance_url = userLogin.instance_url;
			data = await baseRepository.job(`${instance_url}/services/data/v46.0/query?${querystring.stringify({q: query})}`, {}, { 'Authorization': auth, 'Content-Type': 'application/json' },'get', {json: true});
		}

		if(data.statusCode == statusCodeConst.SUCCESS){
			if(data.body.totalSize > 0){
				let arrDataTransform = [];
				let finish_at = '';
				let items = data.body.records;
				await baseRepository.getFiles(items, instance_url, userLogin.access_token);
				let datUpdateSfId = [];
				for(let i=0; i < items.length; i++){
					let employee = nhan_vien_cskh = unit = service = account = package = '';
					let province = district = commune = '';
					if(items[i].Employee__r){
						employee = items[i].Employee__r.Employee_Code__c?items[i].Employee__r.Employee_Code__c:null;
					}
					if(items[i].Nhan_vien_CSKH__r){
						nhan_vien_cskh = items[i].Nhan_vien_CSKH__r.Employee_Code__c?items[i].Nhan_vien_CSKH__r.Employee_Code__c:null;
					}
					if(items[i].Unit__r){
						unit = items[i].Unit__r.Name?items[i].Unit__r.Name:null;
					}
					if(items[i].Contact_province__r){
						province = items[i].Contact_province__r.Name?items[i].Contact_province__r.Name:null;
					}
					if(items[i].Contact_district__r){
						district = items[i].Contact_district__r.Name?items[i].Contact_district__r.Name:null;
					}
					if(items[i].Contact_commune__r){
						commune = items[i].Contact_commune__r.Name?items[i].Contact_commune__r.Name:null;
					}
					if(items[i].Service__r){
						service = items[i].Service__r.ProductCode?items[i].Service__r.ProductCode:null;
					}
					if(items[i].Account){
						account = items[i].Account.Ma_khach_hang__c?items[i].Account.Ma_khach_hang__c:null;
					}
					if(items[i].Package__r){
						package = items[i].Package__r.Name?items[i].Package__r.Name:null;
					}

					let item = {
						"Id": items[i].Id,
						"AcountID": account,
						"Employee__c": employee,
						"Nhan_vien_CSKH__c": nhan_vien_cskh,
						"Tai_Lieu_Dinh_Kem__c": items[i].Tai_Lieu_Dinh_Kem__c,
						"CaseNumber": items[i].CaseNumber,
						"Description": items[i].Comments__c,
						"So_phieu_khieu_nai__c": items[i].So_phieu_khieu_nai__c,
						"Priority": items[i].Priority,
						"Origin": items[i].Origin,
						"Service__c": service,
						"Status": items[i].Status,
						"So_Ho_So__c": items[i].So_Ho_So__c,
						"POS__c": unit,
						"Ng_y_ti_p_nh_n__c": items[i].Nga_y_ti_p_nh_n__c,
						"Sales_Order__c": package,
						"SuppliedName": items[i].SuppliedName,
						"SuppliedPhone": items[i].SuppliedPhone,
						"SuppliedEmail": items[i].SuppliedEmail,
						"Contact_Address__c": items[i].Contact_address__c,
						"Contact_province__c": province,
						"Contact_district__c": district,
						"Contact_commune__c": commune,
						"CreatedDate": items[i].CreatedDate,
						"LastModifiedDate": items[i].LastModifiedDate,
						"Files": items[i].Files?items[i].Files:null,
						"Attachments": items[i].Attachments
					};
					arrDataTransform.push(item);

					if(i == items.length - 1){
						finish_at = items[i].Nga_y_ti_p_nh_n__c;
					}
					datUpdateSfId.push([items[i].Id,items[i].UUID__c]);
				}
				if(arrDataTransform.length > 0){
					// update data
					await updateSfId('case', datUpdateSfId, '', done);
					let username = process.env.MPIT_USERNAME_AUTH_BASIC;
					let password = process.env.MPIT_PASSWORD_AUTH_BASIC;
					let auth = "Basic " + Buffer.from(`${username}:${password}`).toString('base64');
					
					await redis.s(`${process.env.REDIS_KEYPREFIX}:MPITS:worker:success:JOBS_PULL_CASE:${job.id}-${Date.now()}`, { items: arrDataTransform },Expired_Redis);
					let mpit_res = await baseRepository.job(process.env.MPIT_URL_PULL_CASE, { items: arrDataTransform }, 
						{ 'Content-Type': 'application/json; charset=utf-8', 'Authorization' : auth },'post', { json: true });
					
					if(mpit_res.statusCode == statusCodeConst.SUCCESS){
						// save log from MPIT
						let params = mpit_res.body.rows;
						if(params != undefined){
							// insert
							let dataInput = [];
							let keyFields = [
					            'CaseNumber','AcountID','Nhan_vien_CSKH__c',
					            'Service__c','Description','Origin','Priority','Employee__c','So_phieu_khieu_nai__c','Status',
					            'Tai_Lieu_Dinh_Kem__c','POS__c','Sales_Order__c','transactionId','SuppliedName',
					            'Contact_Address__c','Contact_province__c','Contact_district__c','Contact_commune__c',
					            'SuppliedPhone','SuppliedEmail','Ng_y_ti_p_nh_n__c','error','SFID'
					        ];
					        arrDataTransform.forEach(x=>{
					            let item = [];
					            // get error in params
					            params.forEach(f => {
					            	if(f.Id == x.Id){
					            		x.error = f.error;
					            	}
					            });
					            keyFields.forEach(f => {
					                if(_.isString(x[f])) x[f] = '\'' + x[f] + '\'';
					                if(f == 'SFID'){
					                    if(_.isString(x['Id'])) x['Id'] = '\'' + x['Id'] + '\'';
					                    item.push(x.Id);
					                } else {
					                    item.push(_.isEmpty(x[f]) ? 'null' : x[f]);
					                }
					            });
					            dataInput.push([item.join(',')])
					        });

					        let caseMpitRes = await pgRepository.createBatch(job.data.schema, 'gw_case_mpit', keyFields.join(','), dataInput);
							if(caseMpitRes.success){
					        	// update memories
						        let sql = pgFormat(`UPDATE ${job.data.schema}.gw_memories 
										SET status = 1, memory_at = ${moment(finish_at).tz("UTC").valueOf()}
										WHERE job_id = '${job.id}' AND object = '${job.data.object.toLowerCase()}' AND operation = '${job.data.operation}' 
										RETURNING id;`);
								await pgsql.query(sql);
					        }else{
					        	await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:JOBS_PULL_CASE:${job.id}-${Date.now()}`, { error: mpit_res.body, body: caseMpitRes.body },Expired_Redis);
					        }
						}
					}else{
						await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:JOBS_PULL_CASE:${job.id}-${Date.now()}`, { error: mpit_res.body, message: 'Server Mpit not Run: '+process.env.MPIT_URL_PULL_CASE },Expired_Redis);
					}
				}
			}
		}
	    return done();
	}catch(e){
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:JOBS_PULL_CASE-${e.message}-${Date.now()}`, {name: e.name,stack: e.stack}, Expired_Redis);
		return done(new Error(e.stack));
	}
});

// JOBS_UPDATE_FAILED
queue.process('GW_SFJOB_UPDATE', 12, async function(job, done){
	let merchant = 'GW';
	try{
		let data = job.data;
		let userLogin = await libsFile.readFile(folder_token, process.env.SFUSERNAME);
		if(!userLogin){
			userLogin = await authRepository.loginBg(folder_token);
		}
		let auth = `${userLogin.token_type} ${userLogin.access_token}`;
		let instance_url = userLogin.instance_url;
		const jobResult = await baseRepository.job(`${instance_url}/services/data/v46.0/jobs/ingest/${data.sf_job_id}`, {}, { 'Authorization': auth, 'Content-Type': 'text/csv' },'get', {json: true});

		if (jobResult.statusCode == statusCodeConst.SUCCESS) {
			if (jobResult.body.state === "Failed") {
				if (parseInt(jobResult.body.numberRecordsProcessed, 10) > 0) {
					await retrieve(data.merchant, jobResult.body, instance_url, auth, PGSCHEMA, done);
				}
		    } else if (jobResult.body.state === "JobComplete") {
				await retrieve(data.merchant, jobResult.body, instance_url, auth, PGSCHEMA, done);
		    }
	  		// update JOB
	  		let errMsg = (jobResult.body.errorMessage != undefined)?jobResult.body.errorMessage:'';
	  		let sql = pgFormat(`UPDATE ${PGSCHEMA}.gw_jobs 
								SET state = '${jobResult.body.state}',number_records_processed = '${jobResult.body.numberRecordsProcessed}', 
								number_records_failed = '${jobResult.body.numberRecordsFailed}', sf_error = '${errMsg}'
								WHERE pid = '${data.sf_job_id}' RETURNING id;`);
			await pgsql.query(sql);
		}
		return done();
	}catch(e){
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:GW_SFJOB_UPDATE-${e.message}-${Date.now()}`, {name: e.name,stack: e.stack}, Expired_Redis);
		return done(new Error(e.stack));
	}
});

async function updateSfId(object, data, done){
	let sql = '';
	let result = null;
	let merchant = 'MPITS';
	try{
		//5700 . 4 lan
		let limitRecord = 1600;
		if(data.length > limitRecord){
			let number = Math.ceil(data.length/limitRecord);
			// i = 0; i <= 4; i++
			for(let i = 0; i <= number; i++){
				let dataUpdate = [];
				let dataOffset = limitRecord*(i+1);
				if(dataOffset >= data.length){
					dataOffset = data.length + 1;
				}
				// Lan 1: j = 0; j < 1600
				// Lan 2: j = 1600; j < 3200
				// Lan 3: j = 3200; j < 4800
				// Lan 4: j = 4800; j < 5700
				for(let j = i*limitRecord; j < dataOffset; j++){
					if(data[j]){
						dataUpdate.push(data[j]);
					}
				}
				if(dataUpdate.length > 0){
					sql = pgFormat(`UPDATE ${PGSCHEMA}.${object} as gt SET 
				    			id = doup.uuid__c::uuid,
							    sf_id = doup.id::varchar(100),
							    updated_at = ${Date.now()} 
							FROM (values %L) as doup(id,uuid__c)
							WHERE doup.uuid__c::uuid = gt.id 
							RETURNING gt.id;`, [dataUpdate]);
					result = await pgsql.query(sql);
				}
			}
		}else{
			if(data.length > 0){
			    sql = pgFormat(`UPDATE ${PGSCHEMA}.${object} as gt SET 
			    			id = doup.uuid__c::uuid,
						    sf_id = doup.id::varchar(100),
						    updated_at = ${Date.now()} 
						FROM (values %L) as doup(id,uuid__c)
						WHERE doup.uuid__c::uuid = gt.id 
						RETURNING gt.id;`, [data]);
				result = await pgsql.query(sql);
			}
		}
	}catch(e){
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:${e.message}-${Date.now()}`, {
			stack: e.stack,
			name: e.name,
			sql,
			result
		},Expired_Redis);
		return done(new Error(e.stack));
	}
}
