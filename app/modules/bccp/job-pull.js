require('dotenv').config();

var CronJob = require('cron').CronJob;
var kue = require('kue');
const { redis, pgsql } = require('./libs/db'),
	{ jobs, SCHEDULE_JOB} = require('./configs/schedule'),
	dbConfig = require('./configs/database'),
	objectConfigs = require('./configs/object'),
	bccpController = require('./controllers/bccp'),
	uuidv1 = require('uuid/v1'),
	_ = require('lodash');

const Expired_Redis = 3600;
var queue = kue.createQueue(dbConfig.redisKue);
queue.setMaxListeners(10000);

console.log('\n 🚂 Job BBCP running');

queue.on('job enqueue', function(id, type){
	// console.log( 'Job %s got queued of type %s', id, type );
});

// BCCP PULL DATA FROM TRUC
for(let i=0; i < jobs.length; i++){
	let schedule = jobs[i].schedule?jobs[i].schedule:SCHEDULE_JOB;
	// get job by merchant
	if(jobs[i].merchant != undefined){
		new CronJob(schedule, async function() {
			await pullBccpData(jobs[i]);
		}, function () {
			/* This function is executed when the job stops */
			console.log('JOB FAIL');
		}, true, /* Start the job right now */
		process.env.TIME_ZONE /* Time zone of this job. */
		).start();
	}
}

// insert SF
async function pullBccpData(jobs){
	// 
	let object = jobs.object;
	let date = new Date().toISOString().slice(0,10);
	let uuid = uuidv1();
	let key = `${object.toUpperCase()}:${date}:${uuid}`;
	try{
		const dataRes = await bccpController.getData(object, key);
		// const dataRes = require('./sample/pack.json');
		// if(object.toLowerCase() === 'item__c' || object.toLowerCase() === 'added_value_in_package__c'){
		// 	console.log(dataRes);
		// }else{
		// 	console.log(object.toLowerCase());
		// }
		// console.log(dataRes.length);
		if(dataRes != null && dataRes.length > 0){
			console.log(`${process.env.REDIS_KEYPREFIX}:DATABASE:${key}`)
			const redisRes = await redis.s(`${process.env.REDIS_KEYPREFIX}:DATABASE:${key}`, dataRes, Expired_Redis);
			if(redisRes){
				let chanel = `${jobs.merchant}_PULL_${jobs.object.toLowerCase()}_${jobs.operation}`;
				console.log(chanel);
				let queueRes = queue.create(chanel, { title: `Job run at BCCP with object: ${object}`, object, key, merchant: jobs.merchant, operation: jobs.operation })
					.attempts(3) // if job fails retry 3 times
					.backoff({delay: 60*2*1000, type:'fixed'}) // wait 60s before retry
					.save(async function( error) {
						if (!error){
							// log job
							console.log(key);
						}else{
							await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:pullBccpData:${key}`, {
								error
							}, Expired_Redis);
						}
					});
				//console.log('queue', queueRes.data);
			}
		}
	}catch (e){
		console.log(e.stack);
		await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:job:${new Date().toISOString().slice(0,10)}:pullBccpData:${key}`, {
			error: e.stack,
			name: e.name
		}, Expired_Redis);
	}
}