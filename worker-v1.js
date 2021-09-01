require('dotenv').config();
/* State active, inactive, failed, complete */

var CronJob = require('cron').CronJob;
const kue = require('kue'),
	fs = require('fs'),
	path = require('path'),
	fastcsv = require('fast-csv'),
	csv = require('csvtojson'),
	libsDt = require('./app/libs/datetime'),
	libsFile = require('./app/libs/file'),
	libsString = require('./app/libs/string'),
	mkdirp = require('mkdirp'),
	statusCodeConst = require('./app/consts/statusCode'),
	baseRepository = require('./app/services/repository'),
	pgRepository = require('./app/services/pgRepository'),
	authRepository = require('./app/repositories/auth'),
	{ jobs, scheduleQueue, DELAY_JOBS_RESULT } = require('./app/configs/schedule'),
	dbConfig = require('./app/configs/database'),
	{ redis, pgsql } = require('./app/libs/db'),
	pgFormat = require('pg-format'),
	querystring = require('querystring'),
	_ = require('lodash'),
	moment = require('moment-timezone');

let queue = kue.createQueue(dbConfig.redisKue);
process.setMaxListeners(5000);
queue.setMaxListeners(5000);

queue.on( 'error', function( err ) {
  console.log( 'Oops... ', err );
});

console.log('\n  🚂   Worker running');

const folder = 'csvs';
const folder_token = 'sessions';
const PGSCHEMA = process.env.PG_SCHEMA;

for(let i=0; i < jobs.length; i++){
	if(jobs[i].merchant != undefined && jobs[i].merchant.length > 0){
		let arrMerchant = jobs[i].merchant;
		for(let j=0; j < arrMerchant.length; j++){
			processQueue(arrMerchant[j].toUpperCase(), folder, process.env.PG_SCHEMA, jobs[i]);
		}
	}
}

async function processQueue(merchant, folder, schema, jobs){
	try{
		let chanel = `${merchant}_${schema}_${jobs.object.toLowerCase()}_${jobs.operation}`;
		let object = jobs.object.toLowerCase();
		let operation = jobs.operation;
		let step = jobs.step;
		let externalIdFieldName = jobs.externalIdFieldName?jobs.externalIdFieldName:'Id';
		let obj = `${schema}.${object}`;
		let objRef = jobs.object_ref?`${schema}.${jobs.object_ref.toLowerCase()}`:'';
		let key_sf_ref = jobs.key_sf_ref?jobs.key_sf_ref:'';
		let key_ref = jobs.key_ref?jobs.key_ref:'';

		queue.process(chanel, async function(job, done){
			// variable
			let timenow = Date.now();
			let time = libsDt.dayvnNow('date');
			let now_at = job.data.now_at;
			let memory_at = memory_end_at = 0;

			console.log(`${merchant}_${schema}_${object}_${operation} working on job ${job.id} at ${timenow}`);
			// path file
			let dir = path.join('./', `csvs/${merchant}/${object}/${operation}`);
			let dirExist = await fs.existsSync(dir);
			if (!dirExist){ mkdirp.sync(dir, {mode: 777});}

			const filePath = path.join(dir, `./${merchant}-${object}-${operation}-${job.id}-${time}-${now_at}.csv`);

			for(let i = 0; i < job.data.timeRecord; i++){
				let limit = job.data.numRecord;
				let offset = i*job.data.numRecord;
				let objectResult = null;
				if(step == 1){
					objectResult = await pgsql.query(`SELECT * FROM ${obj} 
						WHERE operation = $1 AND created_at > $2 AND created_at <= $3 AND merchant = $4 
						ORDER BY created_at ASC 
						LIMIT $5 
						OFFSET $6`, [
						job.data.operation, job.data.memory_at, now_at, merchant, limit, offset
					]);
				}else{
					let sql = `SELECT ${obj}.*, ${objRef}.id as f_id, ${objRef}.sf_id as f_sf_id 
								FROM ${obj} INNER JOIN ${objRef} ON ${obj}.f_uuid = ${objRef}.id 
								WHERE ${objRef}.sf_id IS NOT NULL AND ${objRef}.status = 1 
								AND ${obj}.operation = '${operation}' AND ${obj}.sf_id IS NULL 
								AND ${obj}.status = 0 AND ${obj}.sf_job_id IS NULL 
								AND ${obj}.merchant = '${merchant}' 
								LIMIT $1 OFFSET $2`;
					objectResult = await pgsql.query(sql, [limit, offset]);
				}
				
				let objectResultRows = objectResult.rows;
				let data = [];
				for(let j = 0; j < objectResultRows.length; j++){
					// gan data step 1
					let record = objectResultRows[j].value;
					record.UUID__c = objectResultRows[j].id;
					// gan data step 2
					if(step == 2){
			    		record[key_sf_ref] = objectResultRows[j].f_sf_id;
			    		record[key_ref] = objectResultRows[j].f_uuid;
					}else{ // if step = 1 moi update memory
						if(i==0 && j==0) memory_end_at =  objectResultRows[j].created_at; // ngay ban ghi dau
						if(i==job.data.timeRecord -1 && j==objectResultRows.length - 1) memory_at = objectResultRows[j].created_at; // ngay ban ghi cuoi
					}
					
					data.push(record);
				}
				await libsFile.writeFileSync(filePath, data, `VNP_CSV:jobs:${merchant}:fail:file-create:${object}:${operation}:${job.id}:${timenow}`, i);
			}

			//use auth login if not login after relogin and set session
			let userLogin = await libsFile.readFile(folder_token, process.env.SFUSERNAME);
			if(!userLogin){
				userLogin = await authRepository.loginBg(folder_token);
			}
			// job process
			await processJob(merchant, folder, schema, object, operation, filePath, job.id, userLogin, externalIdFieldName);
			// step 1 insert memories
			if(step == 1){
				let sql = pgFormat(`UPDATE ${schema}.memories 
									SET status = 1, memory_end_at = ${memory_end_at}, memory_at = ${memory_at}, updated_at = ${timenow} 
									WHERE job_id = '${job.id}' AND object = '${object.toLowerCase()}' AND operation = '${operation}' 
									AND merchant = '${merchant}' RETURNING id;`);
				await pgsql.query(sql);
			}
			done();
		});
	}catch(e){
		await redis.s(`VNP_CSV:jobs:${merchant}:fail:Try-Catch:processQueue-${Date.now()}`, e);
	}
}

async function processJob(merchant, folder, schema, object, operation, pathFile, job_id, userLogin, externalIdFieldName = ''){
	try{
		let created_at = Date.now();
		// url, body, headers, method
		let auth = `${userLogin.token_type} ${userLogin.access_token}`;
		let instance_url = userLogin.instance_url;
		let dataJob = { object, contentType: "CSV", operation, lineEnding: "LF" };
	    if(operation == 'upsert'){
	    	dataJob.externalIdFieldName = externalIdFieldName;
	    }
		let jobResult = await baseRepository.job(`${instance_url}/services/data/v46.0/jobs/ingest`,
			dataJob,
			{ 'Authorization': auth, 'Content-Type': 'application/json' },'post', { json: true });
		if(jobResult.statusCode != statusCodeConst.SUCCESS){
			if(jobResult.statusCode == statusCodeConst.UNAUTHORIED){
				let userLogin = await authRepository.loginBg('sessions');
				auth = `${userLogin.token_type} ${userLogin.access_token}`;
				jobResult = await baseRepository.job(`${instance_url}/services/data/v46.0/jobs/ingest`,
				dataJob,
				{ 'Authorization': auth, 'Content-Type': 'application/json' },'post', { json: true });
				if(jobResult.statusCode != statusCodeConst.SUCCESS){
					redis.s(`jobs:fail:ingest-create:${object}:${operation}:${job_id}-${created_at}`, jobResult.body);
					return 0;
				}
			}else{
				redis.s(`jobs:fail:ingest-create:${object}:${operation}:${job_id}-${created_at}`, jobResult.body);
				return 0;
			}
		}
		let jobResultBody = jobResult.body;
	    let keyRedis = `${schema}:${object}:${operation}:${jobResultBody.id}-${job_id}-${libsDt.format(created_at)}`;
		// save job
	    let csvData = await fs.readFileSync(pathFile, {encoding: 'utf8'});

	    const batchResult = await baseRepository.job(`${instance_url}/${jobResult.body.contentUrl}`, csvData, { 'Authorization': auth, 'Content-Type': 'text/csv' },'put', {json: false});
	    if(batchResult.statusCode == statusCodeConst.POST_SUCCESS){
		    const batchDone = await baseRepository.job(`${instance_url}/services/data/v46.0/jobs/ingest/${jobResult.body.id}`, { state: "UploadComplete" }, { 'Authorization': auth, 'Content-Type': 'application/json' },'patch');
		    if(batchDone.statusCode == statusCodeConst.SUCCESS){
		    	// insert db
		    	let sql = `
	            INSERT INTO ${schema}.jobs 
	                (pid, job_id, operation, object, created_by_id, created_date, system_modstamp, state, concurrency_mode, content_type, api_version, content_url, line_ending, column_delimiter, created_at, merchant) 
	            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
	            RETURNING id;`;
		        let jobsResult = await pgsql.query(sql, [
		            jobResultBody.id, job_id, jobResultBody.operation, jobResultBody.object,
		            jobResultBody.createdById, jobResultBody.createdDate, jobResultBody.systemModstamp,
		            jobResultBody.state, jobResultBody.concurrencyMode, jobResultBody.contentType,
		            jobResultBody.apiVersion, jobResultBody.contentUrl, jobResultBody.lineEnding,
		            jobResultBody.columnDelimiter, created_at, merchant
		        ]);
		        if(jobsResult.rows.length > 0){
		        	//remove file
			    	// let fileUnlink = await fs.unlinkSync(pathFile);
			    	// if(fileUnlink != undefined){
			    	// 	redis.s(`VNP_CSV:jobs:${merchant}:fail:unlink:${keyRedis}`, fileUnlink);
			    	// }
			    	let titleJob = `Job Id ${job_id} ${merchant} with object: ${object} operation: ${operation} at ${Date.now()}`;
			    	jobResultBody.uuid = jobsResult.rows[0].id;
			    	jobResultBody.job_id = job_id;
			    	jobResultBody.merchant = merchant;
			    	jobResultBody.title = titleJob;
			    	var jobQueue = queue.create('JOBS_RESULT', jobResultBody).delay(DELAY_JOBS_RESULT)
			    		.priority('high')	
						.save(function(error) {
							if (!error){
								console.log(`JOBS RESULT ${jobQueue.id} running ${titleJob}`);
							}else{
								console.log(error);
							}
						});
					queue.on('job enqueue', function(id, type){
			    		console.log( 'Job %s got queued of type %s', id, type );
			    	});
			    	await redis.s(`VNP_CSV:jobs:${merchant}:success:${keyRedis}`, jobResultBody);
		        }
		    }else{
		    	await redis.s(`VNP_CSV:jobs:${merchant}:fail:ingest-detail:${keyRedis}`, batchDone.body);
		    }
	    }else{
	    	await redis.s(`VNP_CSV:jobs:${merchant}:fail:ingest-batch:${keyRedis}`, batchResult.body);
	    }
	}catch(e){
		await redis.s(`VNP_CSV:jobs:${merchant}:fail:Try-Catch:processJob-${Date.now()}`, e);
	}
}

// JOBS_RESULT
queue.process('JOBS_RESULT', async function(job, done){
	let merchant = job.data.merchant;
	try{
		// call job data if job not yet complete save tmp_jobs
		let userLogin = await libsFile.readFile(folder_token, process.env.SFUSERNAME);
		if(!userLogin){
			userLogin = await authRepository.loginBg(folder_token);
		}
		let auth = `${userLogin.token_type} ${userLogin.access_token}`;
		let instance_url = userLogin.instance_url;
		const jobResult = await baseRepository.job(`${instance_url}/services/data/v46.0/jobs/ingest/${job.data.id}`, {}, { 'Authorization': auth, 'Content-Type': 'text/csv' },'get', {json: true});
		let step = 0; // gan step loi

	    if(jobResult.statusCode == statusCodeConst.SUCCESS){
			let jobBody = jobResult.body;
			if(jobBody.state != 'JobComplete'){
				// insert to tmp_jobs with step = 0
				await insertToJobTmp(merchant, job.data.id, job.data.job_id, job.data.uuid, step, job.data.object, jobBody.state);
				return done();
			}else{
				// job failed
				if(jobBody.numberRecordsFailed > 0){
					const jobFailedResults = await baseRepository.job(`${instance_url}/services/data/v46.0/jobs/ingest/${job.data.id}/failedResults`, {}, { 'Authorization': auth, 'Content-Type': 'text/csv' },'get', {json: true});
					if(jobFailedResults.statusCode == statusCodeConst.SUCCESS){
						// update to job_fails
						let data = await csv({ quote: '"' }).fromString(jobFailedResults.body);
						await updateToJobStatus(merchant, job.data.id, job.data.object, data, job, 0);
						// transform and sent to MyVnpost
						await sentToMerchant(merchant, job.data.object, data);
					}else{
						// insert to tmp_jobs  step = 1
						step = -2;	
						await insertToJobTmp(merchant, job.data.id, job.data.job_id, job.data.uuid, step, job.data.object, jobBody.state);
					}
				}
				let numberRecordsSuccess = jobBody.numberRecordsProcessed - jobBody.numberRecordsFailed;

				if(numberRecordsSuccess > 0){
					const successfulResults = await baseRepository.job(`${instance_url}/services/data/v46.0/jobs/ingest/${job.data.id}/successfulResults`, {}, { 'Authorization': auth, 'Content-Type': 'text/csv' },'get', {json: true});
					
					if(successfulResults.statusCode == statusCodeConst.SUCCESS){
						// update to job_fails
						let dataSuccessfulResults = await csv({ quote: '"' }).fromString(successfulResults.body);
						await updateToJobStatus(merchant, job.data.id, job.data.object, dataSuccessfulResults, job, 1);
					}
				}
			}
	    }else{
	    	// insert to tmp_jobs with step = -1
	    	step = -1;
	    	await insertToJobTmp(merchant, job.data.id, job.data.job_id, job.data.uuid, step, job.data.object);
	    }
	    return done();
	}catch(e){
		console.log(e);
		await redis.s(`VNP_CSV:jobs:${merchant}:fail:Try-Catch:JOBS_RESULT-${Date.now()}`, e + '');
		return done(new Error(`VNP_CSV:jobs:${merchant}:fail:Try-Catch:JOBS_RESULT-${Date.now()}`));
	}
});

// JOBS_RESULT_TMP
queue.process('JOBS_RESULT_TMP', async function(job, done){
	try{
		let merchant = job.data.merchant;
		// call job data if job not yet complete save tmp_jobs
		let userLogin = await libsFile.readFile(folder_token, process.env.SFUSERNAME);
		if(!userLogin){
			userLogin = await authRepository.loginBg(folder_token);
		}
		let auth = `${userLogin.token_type} ${userLogin.access_token}`;
		let instance_url = userLogin.instance_url;
		const jobResult = await baseRepository.job(`${instance_url}/services/data/v46.0/jobs/ingest/${job.data.id}`, {}, { 'Authorization': auth, 'Content-Type': 'text/csv' },'get', {json: true});

	    if(jobResult.statusCode == statusCodeConst.SUCCESS){
			let jobBody = jobResult.body;
			if(jobBody.state == 'JobComplete'){
				if(jobBody.numberRecordsFailed > 0){
					const jobFailedResults = await baseRepository.job(`${instance_url}/services/data/v46.0/jobs/ingest/${job.data.id}/failedResults`, {}, { 'Authorization': auth, 'Content-Type': 'text/csv' },'get', {json: true});
					if(jobFailedResults.statusCode == statusCodeConst.SUCCESS){
						// update to job_fails
						let data = await csv({ quote: '"' }).fromString(jobFailedResults.body);
						let result = await updateToJobStatus(merchant, job.data.id, job.data.object, data, job, 0);
						if(result == 'oke'){
							// transform and sent to MyVnpost
							await sentToMerchant(merchant, job.data.object, data);
							// remove logic from tmp
							await removeFromTmp(job.data.uuid);
						}else{
							redis.s(`VNP_CSV:jobs:${merchant}:fail:JOBS_RESULT_TMP:${job.data.id}`, job.data);
							job.failed();
						}
					}
				}

				let numberRecordsSuccess = jobBody.numberRecordsProcessed - jobBody.numberRecordsFailed;
				if(numberRecordsSuccess > 0){
					const successfulResults = await baseRepository.job(`${instance_url}/services/data/v46.0/jobs/ingest/${job.data.id}/successfulResults`, {}, { 'Authorization': auth, 'Content-Type': 'text/csv' },'get', {json: true});
					if(successfulResults.statusCode == statusCodeConst.SUCCESS){
						// update to job_fails
						let dataSuccessfulResults = await csv({ quote: '"' }).fromString(successfulResults.body);
						await updateToJobStatus(merchant, job.data.id, job.data.object, dataSuccessfulResults, job, 1);
					}
				}
			}else{
				// update status job
				let sf_error_message = jobBody.errorMessage?jobBody.errorMessage:'';
				await updateJobTmp(job.data.uuid, jobBody.state, sf_error_message);
			}
	    }
	    return done();
	}catch(e){
		await redis.s(`VNP_CSV:jobs:${merchant}:fail:Try-Catch:JOBS_RESULT_TMP-${Date.now()}`, e);
	}
});

// queue process pull case
// JOBS_PULL_CASE
queue.process('JOBS_PULL_CASE', async function(job, done){
	try{
		// call job data if job not yet complete save tmp_jobs
		let userLogin = await libsFile.readFile(folder_token, process.env.SFUSERNAME);
		if(!userLogin){ userLogin = await authRepository.loginBg(folder_token); }
		let auth = `${userLogin.token_type} ${userLogin.access_token}`;
		let instance_url = userLogin.instance_url;
		let field = 'Id,AccountId,Employee__c,Nhan_vien_CSKH__c,Tai_Lieu_Dinh_Kem__c,CaseNumber,Description,Comments__c,So_Ho_So__c,So_phieu_khieu_nai__c,Li_do_khieu_nai__c,Priority,Origin,Nhom_dich_vu__c,Location_Type__c,Service__c,Status,CreatedDate,Shipment__c,SuppliedName,SuppliedPhone,SuppliedEmail,Contact_address__c,Contact_province__c,Contact_district__c,Contact_commune__c,Nga_y_ti_p_nh_n__c,LastModifiedDate,Employee__r.Employee_Code__c,Nhan_vien_CSKH__r.Employee_Code__c,Contact_province__r.Name,Contact_district__r.Name,Contact_commune__r.Name,Service__r.ProductCode,Shipment__r.Name,Account.Ma_khach_hang__c,Unit__r.Name';

		let orderBy = 'Nga_y_ti_p_nh_n__c ASC'; let limit = 2000;

		let query = `SELECT ${field} FROM ${job.data.object} WHERE ${job.data.condition} ORDER BY ${orderBy} LIMIT ${limit}`;

		const data = await baseRepository.job(`${instance_url}/services/data/v46.0/query?${querystring.stringify({q: query})}`, {}, { 'Authorization': auth, 'Content-Type': 'application/json' },'get', {json: true});

		if(data.statusCode == statusCodeConst.SUCCESS){
			if(data.body.totalSize > 0){
				let arrDataTransform = [];
				let finish_at = '';
				let items = data.body.records;
				for(let i=0; i < items.length; i++){
					let employee = nhan_vien_cskh = unit = service = account = shipment = '';
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
					if(items[i].Shipment__r){
						shipment = items[i].Shipment__r.Name?items[i].Shipment__r.Name:null;
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
						"Li_do_khieu_nai__c": items[i].Li_do_khieu_nai__c,
						"Priority": items[i].Priority,
						"Origin": items[i].Origin,
						"Nhom_dich_vu__c": items[i].Nhom_dich_vu__c,
						"Location_Type__c": items[i].Location_Type__c,
						"Service__c": service,
						"Status": items[i].Status,
						"So_Ho_So__c": items[i].So_Ho_So__c,
						"POS__c": unit,
						"Ng_y_ti_p_nh_n__c": items[i].Nga_y_ti_p_nh_n__c,
						"Sales_Order__c": shipment,
						"SuppliedName": items[i].SuppliedName,
						"SuppliedPhone": items[i].SuppliedPhone,
						"SuppliedEmail": items[i].SuppliedEmail,
						"Contact_Address__c": items[i].Contact_address__c,
						"Contact_province__c": province,
						"Contact_district__c": district,
						"Contact_commune__c": commune,
						"CreatedDate": items[i].CreatedDate,
						"LastModifiedDate": items[i].LastModifiedDate
					};
					arrDataTransform.push(item);
					
					if(i == items.length - 1){
						finish_at = items[i].Nga_y_ti_p_nh_n__c;
					}
				}
				if(arrDataTransform.length > 0){
					let username = process.env.MPIT_USERNAME_AUTH_BASIC;
					let password = process.env.MPIT_PASSWORD_AUTH_BASIC;
					let auth = "Basic " + new Buffer(username + ":" + password).toString("base64");

					let mpit_res = await baseRepository.job(process.env.MPIT_URL_PULL_CASE, { items: arrDataTransform }, { 'Content-Type': 'application/json; charset=utf-8', 'Authorization' : auth },'post', { json: true });

					if(mpit_res.statusCode == statusCodeConst.SUCCESS){
						// save log from MPIT
						let params = mpit_res.body.rows;
						if(params != undefined){
							// insert
							let dataInput = [];
							let keyFields = [
					            'CaseNumber','AcountID','Nhan_vien_CSKH__c','Li_do_khieu_nai__c','Nhom_dich_vu__c','Location_Type__c',
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
					        
					        let caseMpitRes = await pgRepository.createBatch(job.data.schema, 'case_mpit', keyFields.join(','), dataInput);
					        if(caseMpitRes.success){
					        	// update memories
						        let sql = pgFormat(`UPDATE ${job.data.schema}.memories 
										SET status = 1, memory_at = ${moment(finish_at).tz("UTC").valueOf()}
										WHERE job_id = '${job.id}' AND object = '${job.data.object.toLowerCase()}' AND operation = '${job.data.operation}' 
										RETURNING id;`);
								let dPgsql = await pgsql.query(sql);
					        }else{
					        	console.log('Server DB GATEWAY not Run');
								await redis.s(`jobs:fail:JOBS_PULL_CASE-DB-GATEWAY-${Date.now()}`, caseMpitRes);
					        }
						}
					}else{
						console.log('Server Mpit not Run: '+process.env.MPIT_URL_PULL_CASE);
						await redis.s(`jobs:fail:JOBS_PULL_CASE-MITNOTRUN-${Date.now()}`, mpit_res);
					}
				}
			}
		}
	    return done();
	}catch(e){
		await redis.s(`jobs:fail:Try-Catch:JOBS_PULL_CASE-${Date.now()}`, e + '');
		return done(new Error(`jobs:fail:Try-Catch:JOBS_PULL_CASE-${Date.now()}` + e + ''));
	}
});

async function updateToJobStatus(merchant, sf_job_id, object, data, job, status){
	try{
		const dataUpload = [];
	    data.map(item => {
	    	let itemTmp = [];
	    	let sfError = item.sf__Error?item.sf__Error:'';
	    	itemTmp.push(item.UUID__c);
	    	itemTmp.push(status);
	    	itemTmp.push(sfError);
	    	itemTmp.push(item.sf__Id);
	    	itemTmp.push(sf_job_id);
	    	dataUpload.push(itemTmp);
	    });
	    let sql = pgFormat(`UPDATE ${PGSCHEMA}.${object.toLowerCase()} as dobj SET
				    status = doup.status::int,
				    sf_error = doup.sf_error::varchar(500),
				    sf_id = doup.sf_id::varchar(100),
				    sf_job_id = doup.sf_job_id::varchar(100)
				FROM (values %L) as doup(id, status, sf_error, sf_id, sf_job_id)
				WHERE doup.id::uuid = dobj.id 
				RETURNING dobj.id;`, dataUpload);
		let result = await pgsql.query(sql);
	    if(result.rows.length != 0){
	    	return 'oke';
	    }else{
	    	return 'failed';
	    }
	}catch(e){
		console.log(e + ' Job Id: '+ job.id);
		await redis.s(`VNP_CSV:jobs:${merchant}:fail:Try-Catch:updateToJobFail-${Date.now()}`, e + '');
		return 'failed';
	}
}

async function insertToJobTmp(merchant, sf_job_id, gw_job_id, uuid, step, object, status){
	try{
		let sql = `
	            INSERT INTO ${PGSCHEMA}.job_tmps 
	                (sf_job_id, gw_job_id, uuid, step, object, status, created_at, merchant) 
	            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
	            RETURNING id;`;
	    await pgsql.query(sql, [
	        sf_job_id,
	        gw_job_id,
	        uuid,
	        step,
	        object,
	        status,
	        Date.now(),
	        merchant
	    ]);
	}catch(e){
		await redis.s(`VNP_CSV:jobs:${merchant}:fail:Try-Catch:insertToJobTmp-${Date.now()}`, e + '');
	}
}

async function sentToMerchant(merch, object, data){
	try{
		// extract data
		// let merchant = [...new Set(data.map(x => libsString.replace(x.from__c, '')))];
		let sql = pgFormat(`SELECT id, url, name, auth FROM ${PGSCHEMA}.sessions WHERE LOWER(name) IN (%L)`, merch.toLowerCase());
		let sessions = await pgsql.query(sql);
		if(sessions.rows.length > 0){
			for(let i = 0; i < sessions.rows.length; i++){
				// check nếu có url thì trả log, không có thì bỏ qua.
				if(sessions.rows[i].url != null){
					var dataWh = data.filter(function(item) {
					  return libsString.replace(item.from__c, '').toLowerCase()	== merch.toLowerCase();
					});
					let dataRes = { object, rows: dataWh };
					let headers = { 'Content-Type': 'application/json; charset=utf-8' };
					if(sessions.rows[i].auth){
						if(sessions.rows[i].auth.type == 'basic'){
							let auth = "Basic " + new Buffer(sessions.rows[i].auth.username + ":" + sessions.rows[i].auth.password).toString("base64");
							headers = { 'Content-Type': 'application/json; charset=utf-8', 'Authorization' : auth };
						}else if(sessions.rows[i].auth.type == 'apikey'){
							headers = { 'Content-Type': 'application/json; charset=utf-8', 'Authorization' : `${sessions.rows[i].auth.typeKey} ${sessions.rows[i].auth.key}` };
						}
					}
					let {statusCode, body} = await baseRepository.job(sessions.rows[i].url, dataRes, headers,'post', { json: true });
					console.log('Code tra ve tu callback '+sessions.rows[i].name+':'+statusCode);
					console.log(body);
					if(statusCode != statusCodeConst.SUCCESS){
						console.log(`SERVER ${sessions.rows[i].name} lỗi nhận callback`);
					}
				}
			}
		}
	}catch(e){
		await redis.s(`VNP_CSV:jobs:${merch}:fail:Try-Catch:sentToMerchant-${Date.now()}`, e + '');
	}
}

async function removeFromTmp(uuid){
	try{
		let sql = `UPDATE ${PGSCHEMA}.job_tmps SET deleted_at = $1 WHERE id = $2 RETURNING id, deleted_at;`;
	    let jobsResult = await pgsql.query(sql, [Date.now(), uuid]);
	    if(jobsResult.rows.length > 0){
	    	console.log('Remove Job Id: '+uuid+' from job_tmps');
	    }
	}catch(e){
		await redis.s(`jobs:fail:Try-Catch:removeFromTmp-${Date.now()}`, e + '');
	}
}


async function updateJobTmp(uuid, status, sf_error_message = ''){
	try{
		let sql = `UPDATE ${PGSCHEMA}.job_tmps SET status = $1, SET sf_error_message = $2 WHERE id = $3 RETURNING id, status;`;
	    let jobsResult = await pgsql.query(sql, [status, sf_error_message, uuid]);
	    if(jobsResult.rows.length > 0){
	    	console.log('Remove Job Id: '+uuid+' from job_tmps');
	    }
	}catch(e){
		await redis.s(`jobs:fail:Try-Catch:removeFromTmp-${Date.now()}`, e + '');
	}
}