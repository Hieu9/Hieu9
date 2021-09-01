require('dotenv').config();
/* State active, inactive, failed, complete */

const kue = require('kue'),
	cluster = require('cluster'),
	dbConfig = require('./configs/database'),
    { redis, pgsql, mysql } = require('./libs/db'),
    pgFormat = require('pg-format'),
    uuidv1 = require('uuid/v1'),
    _ = require('lodash');

const jsforce = require('jsforce');
    
let queue = kue.createQueue(dbConfig.redisKue);
queue.setMaxListeners(10000);
queue.watchStuckJobs(1000);
var clusterWorkerSize = require('os').cpus().length;

console.log('\n  🚂 SuiteCrm  Worker running');

const Expired_Redis = 3600*24*30;

queue.on( 'error', function( err ) {
	console.log( 'Oops... ', err );
});

if (cluster.isMaster) {
	for (var i = 0; i < clusterWorkerSize; i++) {
		cluster.fork();
	}
} else {
    const username = process.env.SFUSERNAME || 'admin2019@vnpost.com.vn.full';
    const password = process.env.PASSWORD || 'cmcts@2020vnpost';
    const loginUrl = process.env.LOGIN_URL || 'https://test.salesforce.com';
    //const securityToken = 'YOUR_SECURITY_TOKEN';
    const conn = new jsforce.Connection({ loginUrl: loginUrl });
    
    // push data insert to salesforce
    // process save data from job suitecrm to database
    queue.process('SCRM_LEADS_INSERT', async function(job, done){
        try{
            let now_at = Date.now();
            let logs = `--- WORKER RUN AT chanel: SCRM_LEADS_INSERT ${now_at} ---`;
            console.log(logs);
            let data = job.data;
            let sql = `SELECT ${data.fields} FROM ${data.object} WHERE ${data.condition} ORDER BY ${data.orderBy} LIMIT ${data.limit} `;
            mysql.query(sql, async function (err, results) {
                if (err) throw err;
                // save data to postgresql db
                if(results.length){
                    conn.login(username, password, function(err, res) {
                        if (err) {
                            return console.error(err);
                        }
                        console.log('Authenticated');
                        const leads = [];
                        let mapFields = data.mapFields;
                        for(let i = 0; i<results.length; i++){
                            let jsonValue = results[i];
                            _.each(jsonValue, function(value, key) {
                                key = mapFields[key] || key;
                                jsonValue[key] = value;
                            });
                            value = _.omit(jsonValue, Object.keys(mapFields));
                            leads.push({
                                FirstName: value.FirstName,
                                LastName: value.LastName,
                                Company: value.Company,
                                Phone: value.Phone,
                                MobilePhone: value.MobilePhone,
                                Fax: value.Fax,
                                Website: value.Website,
                                ScrmId__c: value.ScrmId__c
                            });
                        }

                        conn.sobject('Lead')
                            .create(leads, { allOrNone: true })
                            .then((rets) => {
                                // All leads are successfully inserted
                                console.log(rets);
                                let dataUpdates = [];
                                for (let j = 0;j<rets.length; j++) {
                                    if(rets[j].success){
                                        leads[j].Id = rets[j].id;
                                        dataUpdates.push([leads[j].ScrmId__c, leads[j].Id]);
                                    }
                                }
                                if(dataUpdates.length){
                                    // update leads
                                    let sqlUpdate = "INSERT INTO leads (id,sf_id) VALUES ? ON DUPLICATE KEY UPDATE sf_id=VALUES(sf_id);";
                                    mysql.query(sqlUpdate, [dataUpdates], function (err, resUpdate) {
                                        if (err) throw err;
                                        console.log('-----Result----', resUpdate);
                                    });
                                }
                            })
                            .catch((err) => {
                                console.log(err);
                                // some of the records failed in insertion
                            });
                    });
                    // let values = [];
                    // let mapFields = data.mapFields;
                    // for(let i = 0; i<results.length; i++){
                    //     let jsonValue = results[i];
                    //     _.each(jsonValue, function(value, key) {
                    //         key = mapFields[key] || key;
                    //         jsonValue[key] = value;
                    //     });
                    //     value = _.omit(jsonValue, Object.keys(mapFields));
                    //     values.push([data.merchant, value.ScrmId__c, data.object, data.operation, value, uuidv1()]);
                    // }
                    // let sqlInsert = pgFormat('INSERT INTO suitecrm.gw_trackings(merchant,srcm_id,object,operation,value,uuid__c) VALUES %L', values);
                    // let resInsert = await pgsql.query(sqlInsert);
                    // if(resInsert){
                    //     // insert datetime now memory
                    //     return done();
                    // }
                }
                return done(false);
            });
        }catch(e){
            await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${data.merchant}:${new Date().toISOString().slice(0,10)}:JOBS_PULL_CASE-${e.message}-${Date.now()}`, {name: e.name,stack: e.stack}, Expired_Redis);
            return done(new Error(e.stack));
        }
    });

    // update SF Data

    // process save data from job suitecrm to database
    queue.process('SCRM_LEADS_UPDATE', async function(job, done){
        try{
            let now_at = Date.now();
            let logs = `--- WORKER RUN AT chanel: SCRM_LEADS_UPDATE ${now_at} ---`;
            console.log(logs);
            let data = job.data;
            let sql = `SELECT ${data.fields} FROM ${data.object} WHERE ${data.condition} ORDER BY ${data.orderBy} LIMIT ${data.limit} `;
            mysql.query(sql, async function (err, results) {
                if (err) throw err;
                // save data to postgresql db
                if(results.length){
                    conn.login(username, password, function(err, res) {
                        if (err) {
                            return console.error(err);
                        }
                        console.log('Authenticated');
                        const leads = [];
                        let mapFields = data.mapFields;
                        for(let i = 0; i<results.length; i++){
                            let jsonValue = results[i];
                            _.each(jsonValue, function(value, key) {
                                key = mapFields[key] || key;
                                jsonValue[key] = value;
                            });
                            value = _.omit(jsonValue, Object.keys(mapFields));
                            leads.push({
                                Id: value.Id,
                                FirstName: value.FirstName,
                                LastName: value.LastName,
                                Company: value.Company,
                                Phone: value.Phone,
                                MobilePhone: value.MobilePhone,
                                Fax: value.Fax,
                                Website: value.Website,
                                ScrmId__c: value.ScrmId__c
                            });
                        }

                        conn.sobject('Lead')
                            .update(leads, { allOrNone: true })
                            .then((rets) => {
                                // All leads are successfully inserted
                                console.log(rets);
                            })
                            .catch((err) => {
                                console.log(err);
                                // some of the records failed in insertion
                            });
                    });
                }
                return done(false);
            });
        }catch(e){
            await redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:${data.merchant}:${new Date().toISOString().slice(0,10)}:JOBS_PULL_CASE-${e.message}-${Date.now()}`, {name: e.name,stack: e.stack}, Expired_Redis);
            return done(new Error(e.stack));
        }
    });
}
