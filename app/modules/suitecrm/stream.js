require('dotenv').config();

const { mysql } = require('./libs/db'),
    uuidv1 = require('uuid/v1');

const jsforce = require('jsforce');

console.log('\n 🚂 SuiteCrm Stream running');

const username = process.env.SFUSERNAME || 'admin2019@vnpost.com.vn.full';
const password = process.env.PASSWORD || 'cmcts@2020vnpost';
const loginUrl = process.env.LOGIN_URL || 'https://test.salesforce.com';
//const securityToken = 'YOUR_SECURITY_TOKEN';
const conn = new jsforce.Connection({ loginUrl: loginUrl });
conn.login(username, password, function(err, res) {
    if (err) {
        return console.error(err);
    }
    console.log('Authenticated');
    let subscription = conn.streaming.topic("Lead").subscribe(function(message) {
        console.log('-----------------Start------------------------');
        console.log('Event Created : ' + message.event.createdDate);
        console.log('Object Id : ' + message.sobject.Id);
        console.log('Event : ' + JSON.stringify(message));
        let { sobject } = message;

        if(message.event.type == 'updated'){
            // message.sobject.Id
            console.log('Event Type : ' + message.event.type);
            console.log(message.sobject);
            let sql = `SELECT * FROM leads Where sf_id = '${message.sobject.Id}'`;

            mysql.query(sql, function (err, result) {
                if (err) return console.log(err);
                // update
                if(result.length > 0){
                    console.log('update');
                    let sqlUpdate = `UPDATE leads SET first_name = ?,last_name = ?,department = ?,phone_home = ?,phone_work = ?,phone_fax = ?,website = ? WHERE sf_id = '${message.sobject.Id}'`;

                    mysql.query(sqlUpdate, [
                        sobject.FirstName,sobject.LastName,sobject.Company,sobject.Phone,sobject.MobilePhone,sobject.Fax,sobject.Wesite
                    ], function (err, result) {
                        if (err) return console.log(err);
                        console.log('-----Result----', result);
                    });
                }else{ //insert
                    console.log('insert');
                    let scrm_id = sobject.ScrmId__c || uuidv1();
                    let date_entered = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') // delete the dot and everything after
                    let sqlInsert = "INSERT INTO leads (id,sf_id,first_name,last_name,department,phone_home,phone_work,phone_fax,website,status,date_entered,created_by,deleted) VALUES ?";
                    let values = [[scrm_id,sobject.Id,sobject.FirstName,sobject.LastName,sobject.Company,sobject.Phone,sobject.MobilePhone,sobject.Fax,sobject.Wesite,'New',date_entered,1,0]];

                    mysql.query(sqlInsert, [values], function (err, result) {
                        if (err) return console.log(err);
                        console.log('-----Result----', result);
                    });
                }
            });
        }else if (message.event.type == 'deleted'){
            // message.sobject.Id
            // let sql = `DELETE FROM leads WHERE sf_id = '${message.sobject.Id}'`;

            let sqlUpdate = `UPDATE leads SET deleted = ? WHERE sf_id = '${message.sobject.Id}'`;

            mysql.query(sqlUpdate, [1], function (err, result) {
                if (err) return console.log(err);
                console.log('deleted');
                console.log('-----Result----', result);
            });
        }else{
            console.log('Event Type : ' + message.event.type);
        }
    });
    conn.streaming.topic('Lead').unsubscribe();
    subscription.cancel(); 
});