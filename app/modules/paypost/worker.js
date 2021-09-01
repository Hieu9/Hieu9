require('dotenv').config();
/* State active, inactive, failed, complete */

const kue = require('kue'),
	cluster = require('cluster'),
	fs = require('fs'),
	path = require('path'),
	csv = require('csvtojson'),
	libsDt = require('../../../app/libs/datetime'),
	libsFile = require('../../../app/libs/file'),
	mkdirp = require('mkdirp'),
	statusCodeConst = require('../../../app/consts/statusCode'),
	baseRepository = require('../../../app/services/repository'),
	authRepository = require('../../../app/repositories/auth'),
	{ jobs_sf } = require('./configs/schedule'),
	dbConfig = require('./configs/database'),
	{ redis, pgsql } = require('./libs/db'),
	pgFormat = require('pg-format');

let queue = kue.createQueue(dbConfig.redisKue);
queue.setMaxListeners(10000);
queue.watchStuckJobs(1000);
var clusterWorkerSize = require('os').cpus().length;

// queue.inactive( function( err, ids ) {
//   ids.forEach( function( id ) {
//     kue.Job.get( id, function( err, job ) {
//       // Your application should check if job is a stuck one
//       job.active();
//     });
//   });
// });

console.log('\n  🚂   Worker PAYPOST - SF running');

const folder_token = process.env.FOLDER_SESSION;
const PGSCHEMA = process.env.PAYPOST_PG_SCHEMA;
const Expired_Redis = 3600*24*30;

queue.on( 'error', function( err ) {
	console.log( 'Oops... ', err );
});

if (cluster.isMaster) {
	for (var i = 0; i < clusterWorkerSize; i++) {
		cluster.fork();
	}
} else {
	for(let i=0; i < jobs_sf.length; i++){
		if(jobs_sf[i].merchant != undefined){
			processQueue(jobs_sf[i].merchant.toUpperCase(), jobs_sf[i]);
		}
	}
}

async function processQueue(merchant, jobs){
	try{
		let schema = process.env.PAYPOST_PG_SCHEMA;
		let chanel = `${merchant}_${schema}_${jobs.object.toLowerCase()}_${jobs.operation}`;
		let object = jobs.object;
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
				let sql = `SELECT DISTINCT ON (value->> '${externalIdFieldName}') value, * FROM ${schema}.${object.toLowerCase()} 
						WHERE operation = $1 AND status = $2 AND sf_job_id IS NULL AND number < $3 AND merchant = $4 AND object = $5  
						ORDER BY value->> '${externalIdFieldName}', created_at ASC LIMIT $6 OFFSET $7`;
				objectResult = await pgsql.query(sql, [
					job.data.operation,0,3,merchant,object.toLowerCase(),limit,offset
				]);

				let objectResultRows = objectResult.rows;
				let data = [];
				for(let j = 0; j < objectResultRows.length; j++){
					let record = objectResultRows[j].value;
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
				await updateJobId(merchant, dataIdUpdate, jobSfResultBody.id, object, done);
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
		        	// await utilLibs.sleep(1);
		        	//remove file
			    	let fileUnlink = await fs.unlinkSync(pathFile);
			    	if(fileUnlink != undefined){
			    		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:unlink:${keyRedis}`, fileUnlink,Expired_Redis);
			    	}
					// poll data
					// console.log(jobSfResultBody.id);
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
		console.log(e.stack);
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:processJob-${e.message}-${Date.now()}`, {name: e.name,stack: e.stack}, Expired_Redis);
		//return done(new Error(e.stack));
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
			console.log(e.stack);
			await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:poll:${e.message}-${Date.now()}`, {name: e.name,stack: e.stack}, Expired_Redis);
			//return done(new Error('poll Error'));
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
				// await sentToMerchant(merchant, jobInfo.object, data, done);
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
		console.log(e.stack);
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:retrieve:${e.message}-${Date.now()}`, {name: e.name,stack: e.stack}, Expired_Redis);
		// return done(new Error(e.stack));
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
								sql = pgFormat(`UPDATE ${PGSCHEMA}.${object.toLowerCase()} as dobj SET
										    status = doup.status::int,
										    sf_error = doup.sf_error::varchar(500),
										    sf_id = doup.sf_id::varchar(100),
										    sf_job_id = doup.sf_job_id::varchar(100),
										    updated_at = ${Date.now()} 
										FROM (values %L) as doup(id, status, sf_error, sf_id, sf_job_id)
										WHERE doup.id::uuid = dobj.id 
										RETURNING dobj.uuid__c, dobj.sf_id`, dataUpdate);
								result = await pgsql.query(sql);
							}
						}
					}else{
				    	sql = pgFormat(`UPDATE ${PGSCHEMA}.${object.toLowerCase()} as dobj SET
							    status = doup.status::int,
							    sf_error = doup.sf_error::varchar(500),
							    sf_id = doup.sf_id::varchar(100),
							    sf_job_id = doup.sf_job_id::varchar(100),
							    updated_at = ${Date.now()} 
							FROM (values %L) as doup(id, status, sf_error, sf_id, sf_job_id)
							WHERE doup.id::uuid = dobj.id 
							RETURNING dobj.uuid__c, dobj.sf_id`, dataUpload);
						result = await pgsql.query(sql);
					}
		    	}
		    }
		}
	}catch(e){
		console.log(e.stack);
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:updateToJobStatus:${sf_job_id}-${e.message}-${Date.now()}`, {
			stack: e.stack,
			name: e.name,
			sql,
			result
		},Expired_Redis);
		//return done(new Error(e.stack));
	}
}

async function updateJobId(merchant, data, sf_job_id, object, done){
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
					sql = pgFormat(`UPDATE ${PGSCHEMA}.${object.toLowerCase()} as gt SET 
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
			    sql = pgFormat(`UPDATE ${PGSCHEMA}.${object.toLowerCase()} as gt SET 
						    sf_job_id = '${sf_job_id}',
						    updated_at = ${Date.now()} 
						FROM (values %L) as doup(id)
						WHERE doup.id::uuid = gt.id 
						RETURNING gt.id`, [data]);
				result = await pgsql.query(sql);
			}
		}
	}catch(e){
		console.log(e.stack);
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${merchant}:${new Date().toISOString().slice(0,10)}:updateJobId:${sf_job_id}-${e.message}-${Date.now()}`, {
			stack: e.stack,
			name: e.name,
			sql: sql,
			result
		},Expired_Redis);
		//return done(new Error(e.stack));
	}
}

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
