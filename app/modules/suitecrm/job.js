require('dotenv').config();

var CronJob = require('cron').CronJob;
var kue = require('kue');
const { redis, pgsql, mysql } = require('./libs/db'),
	{ jobs, SCHEDULE_JOB} = require('./configs/schedule'),
    dbConfig = require('./configs/database');

const Expired_Redis = 3600*24*30;
var queue = kue.createQueue(dbConfig.redisKue);
queue.setMaxListeners(10000);

console.log('\n 🚂 SuiteCrm Job running');

queue.on('job enqueue', function(id, type){
	// console.log( 'Job %s got queued of type %s', id, type );
});

// job process batch main
// for(let i=0; i < jobs.length; i++){
// 	let schedule = jobs[i].schedule?jobs[i].schedule:SCHEDULE_JOB;
// 	let totalRecord = jobs[i].totalRecord?jobs[i].totalRecord:process.env.JOB_NUM_RECORD;
// 	let numRecord = jobs[i].numRecord?jobs[i].numRecord:process.env.JOB_NUM_RECORD;
// 	// get job by merchant
// 	if(jobs[i].merchant != undefined && jobs[i].merchant.length > 0){
// 		let arrMerchant = jobs[i].merchant;
// 		for(let j=0; j < arrMerchant.length; j++){
// 			new CronJob(schedule, async function() {
// 					let number = 3; // số lần đẩy lên SF nếu chưa được đẩy
// 					let status = 0; // trạng thái default khi chưa xử lý
// 					let merchant = arrMerchant[j].toUpperCase();
// 					let sql = `SELECT count(*) FROM ${process.env.PG_SCHEMA}.gw_trackings 
// 							WHERE operation = '${jobs[i].operation}' AND status = ${status} AND number < ${number} 
// 							AND sf_job_id IS NULL 
// 							AND merchant = '${merchant}' AND object = '${jobs[i].object.toLowerCase()}'`;
// 					await jobProcessRecord(sql,jobs[i],merchant,totalRecord,numRecord);
// 				}, function () {
// 					/* This function is executed when the job stops */
// 					console.log('JOB FAIL');
// 				}, true, /* Start the job right now */
// 				process.env.TIME_ZONE /* Time zone of this job. */
// 			).start();
// 		}
// 	}
// }

// job process get record create object
// async function jobProcessRecord(sql, job, merchant, totalRecord, numRecord){
// 	try{
// 		let object = job.object;
// 		let operation = job.operation;
// 		let now_at = Date.now();
// 		let countObjRecord = await pgsql.query(sql);
// 		let countRecord = (parseInt(countObjRecord.rows[0].count) <= totalRecord)?parseInt(countObjRecord.rows[0].count):totalRecord;
// 		let timeRecord = Math.ceil(countRecord/numRecord);
// 		if(countRecord > 0){
// 			let data =  {
// 							title: `Job run at ${merchant} with object: ${object} operation is ${operation} at ${now_at}`,
// 							operation,object,now_at, countRecord, numRecord, timeRecord
// 						};
// 			// run job
// 			let title = `${merchant}_${process.env.PG_SCHEMA}_${object.toLowerCase()}_${operation}`;
// 			queue.create(title, data)
// 				.attempts(3) // if job fails retry 3 times
// 				.backoff({delay: 60*2*1000, type:'fixed'}) // wait 60s before retry
// 				.save(async function(error) {
// 					if (!error){
// 						// log job
// 						console.log(data.title);
// 					}else{
// 						await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:job:${merchant}:${new Date().toISOString().slice(0,10)}:jobProcessSelectRecord:${data.title}-${Date.now()}`, {
// 							error
// 						},Expired_Redis);
// 					}
// 				});
// 		}
// 	}catch (e){
// 		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:job:${merchant}:${new Date().toISOString().slice(0,10)}:jobProcessSelectRecord:${e.message}-${Date.now()}`, {
// 			error: e.stack,
// 			name: e.name,
// 			sql
// 		},Expired_Redis);
// 	}
// }

// Process pull data froms suitecrm

// job process batch main
new CronJob("*/1 * * * *", async function() {
        let now_at = Date.now();
        let merchant = 'SCRM';
        let object = "leads";
        let operation = "insert";
        //let fields = "id,first_name,last_name,lead_source,status,contact_id,contact_id,opportunity_id,campaign_id,department,description,phone_home,phone_mobile,phone_fax,website,date_entered,date_modified,created_by,deleted";   
        let fields = "id,first_name,last_name,department,description,phone_home,phone_mobile,phone_fax,website";   
        
        var mapFields = {
            "id":"ScrmId__c",
            "first_name":"FirstName",
            "last_name":"LastName",
            // "lead_source":"LeadSource",
            // "status":"Status",
            // "contact_id":"ScrmContactId",
            // "account_id":"ScrmAccountId",
            // "opportunity_id":"ScrmOpportunityId",
            // "campaign_id":"ScrmCampaignId",
            "department":"Company",
            "description":"Description",
            "phone_home":"Phone",
            "phone_mobile":"MobilePhone",
            "phone_fax":"Fax",
            "website":"Website",
            // "date_entered":"ScrmDateEntered",
            // "date_modified":"ScrmDateModified",
            // "created_by":"ScrmCreatedBy",
            // "deleted":"IsDeleted"
        }
        let limit = 200;
        let condition = "sf_id IS NULL and deleted = 0";
        let orderBy = "date_entered ASC";

        let sql = `SELECT ${fields} FROM ${object} WHERE ${condition} ORDER BY ${orderBy} LIMIT 1;`;
        let options = {
            object, fields, condition, orderBy, limit, operation, mapFields, now_at
        };
        await pullScrmData(merchant, operation, sql, options);
    }, function () {
        /* This function is executed when the job stops */
        console.log('JOB FAIL');
    }, true, /* Start the job right now */
    process.env.TIME_ZONE /* Time zone of this job. */
).start();

// insert SF
async function pullScrmData(merchant, operation, sql, options){
	try{
        let data =  {
                        title: `Job run at ${merchant} with object: ${options.object} operation is ${operation} at ${options.now_at}`,
                        merchant, ...options
                    };
        // run job
        mysql.query(sql, function (err, result) {
            if (err) throw err;
            if(result.length > 0){
                let title = `${merchant}_${options.object.toUpperCase()}_${operation.toUpperCase()}`;
                console.log(title);
                queue.create(title, data)
                    .attempts(3) // if job fails retry 3 times
                    .backoff({delay: 60*2*1000, type:'fixed'}) // wait 60s before retry
                    .save(async function(error) {
                        if (!error){
                            // log job
                            console.log(data.title);
                        }else{
                            await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:job:${merchant}:${new Date().toISOString().slice(0,10)}:pullScrmData:${data.title}-${Date.now()}`, {
                                error
                            },Expired_Redis);
                        }
                    });
            }else{
                console.log(`leads record insert: ${result.length} at ${options.now_at}`);
            }
        });
	}catch (e){
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:job:${merchant}:${new Date().toISOString().slice(0,10)}:pullScrmData:${e.message}-${Date.now()}`, {
			error: e.stack,
			name: e.name,
			sql
		},Expired_Redis);
	}
}

// update
new CronJob("*/1 * * * *", async function() {
    let now_at = Date.now();
    let merchant = 'SCRM';
    let object = "leads";
    let operation = "update";
    //let fields = "id,first_name,last_name,lead_source,status,contact_id,contact_id,opportunity_id,campaign_id,department,description,phone_home,phone_mobile,phone_fax,website,date_entered,date_modified,created_by,deleted";   
    let fields = "id,sf_id,first_name,last_name,department,description,phone_home,phone_mobile,phone_fax,website";   
    
    var mapFields = {
        id:"ScrmId__c",
        sf_id: "Id",
        first_name:"FirstName",
        last_name:"LastName",
        // "lead_source":"LeadSource",
        // "status":"Status",
        // "contact_id":"ScrmContactId",
        // "account_id":"ScrmAccountId",
        // "opportunity_id":"ScrmOpportunityId",
        // "campaign_id":"ScrmCampaignId",
        department:"Company",
        description:"Description",
        phone_home:"Phone",
        phone_mobile:"MobilePhone",
        phone_fax:"Fax",
        website:"Website",
        // "date_entered":"ScrmDateEntered",
        // "date_modified":"ScrmDateModified",
        // "created_by":"ScrmCreatedBy",
        // "deleted":"IsDeleted"
    }
    let limit = 200;
    // date now - 5 minute
    let dataBeforeTs = now_at - 5 * 60 * 1000;
    let dataBefore = new Date(dataBeforeTs).toISOString().replace(/T/, ' ').replace(/\..+/, '');
    let condition = `date_modified >= '${dataBefore}' and sf_id IS NOT NULL`;
    let orderBy = "date_modified ASC";

    let sql = `SELECT ${fields} FROM ${object} WHERE ${condition} ORDER BY ${orderBy} LIMIT 1;`;
    
    let options = {
        object, fields, condition, orderBy, limit, operation, mapFields, now_at
    };
    await updateScrmData(merchant, operation, sql, options);
}, function () {
    /* This function is executed when the job stops */
    console.log('JOB FAIL');
}, true, /* Start the job right now */
process.env.TIME_ZONE /* Time zone of this job. */
).start();

// update SF
async function updateScrmData(merchant, operation, sql, options){
	try{
        let data =  {
                        title: `Job run at ${merchant} with object: ${options.object} operation is ${operation} at ${options.now_at}`,
                        merchant, ...options
                    };
        // run job
        mysql.query(sql, function (err, result) {
            if (err) throw err;
            if(result.length > 0){
                let title = `${merchant}_${options.object.toUpperCase()}_${operation.toUpperCase()}`;
                console.log(title);
                queue.create(title, data)
                    .attempts(3) // if job fails retry 3 times
                    .backoff({delay: 60*2*1000, type:'fixed'}) // wait 60s before retry
                    .save(async function(error) {
                        if (!error){
                            // log job
                            console.log(data.title);
                        }else{
                            await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:job:${merchant}:${new Date().toISOString().slice(0,10)}:pullScrmData:${data.title}-${Date.now()}`, {
                                error
                            },Expired_Redis);
                        }
                    });
            }else{
                console.log(`leads record update: ${result.length} at ${options.now_at}`);
            }
        });
	}catch (e){
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:job:${merchant}:${new Date().toISOString().slice(0,10)}:pullScrmData:${e.message}-${Date.now()}`, {
			error: e.stack,
			name: e.name,
			sql
		},Expired_Redis);
	}
}