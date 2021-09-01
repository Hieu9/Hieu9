const Promise = require("bluebird"), request = Promise.promisifyAll(require('request'));
const express = require('express'),
	router = express.Router(),
	checkAuth = require('../middlewares'),
	baseRepository = require('../services/repository'),
	response = require('../libs/response'),
	querystring = require('querystring'),
	consts = require('../consts'),
	statusCode = require('../consts/statusCode'),
	objectLibs = require('../libs/object'),
	pgRepository = require('../services/pgRepository'),
	{ redis, pgsql } = require('../libs/db');

var fs = require('fs');

// function to encode file data to base64 encoded string
function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

// function to create file from base64 encoded string
function base64_decode(base64str, file) {
    // create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
    var bitmap = new Buffer(base64str, 'base64');
    // write buffer to file
    fs.writeFileSync(file, bitmap);
    console.log('******** File created from base64 encoded string ********');
}

router.get('/decodeFile', checkAuth, async function(req, res, next){
	let url = `${req.user.instance_url}/services/apexrest/link-document/`;
    let data = await baseRepository.findFirst(url, req);
    //console.log(data.body);
 //    let buff = Buffer.from(data.body, 'base64');  
	// let text = buff.toString('utf-8');
	// var base64str = base64_encode('kitten.jpg');
	// console.log(base64str);
	// convert base64 string back to image 

	console.log('data',data)

	// let buff = new Buffer(data.body);
 //    let s = buff.toString('base64');

    //var dataURL = blobUtil.blobToDataURL(data.body);

    // var b64toBlob = require('b64-to-blob');

	// var contentType = 'image/png';
	// var b64Data = s;

	// var blob = b64toBlob(b64Data, contentType);

	console.log(1);

    console.log('******** File created from base64 encoded string ********');

	return response.success(req, res, {data: 1}, 200);
});

router.get('/ping', async function(req, res, next){
	try{
		let sql = `SELECT DISTINCT ON (tracking.sf_job_id) sf_job_id, tracking."object", tracking."operation", tracking.merchant, tracking.status, tracking.created_at 
		FROM public.gw_trackings as tracking
		LEFT JOIN public.gw_jobs as jobs ON tracking.sf_job_id = jobs.pid
		WHERE tracking.status = 0 AND (tracking.sf_job_id IS NOT NULL || tracking.sf_job_id != '') 
		AND jobs."state" != 'Failed' AND jobs.number_records_processed != 0 
		AND tracking.number < 3 ORDER BY tracking.sf_job_id, tracking.created_at ASC 
		LIMIT 1000 OFFSET 0`;
		let records = await pgsql.query(sql);
		await redis.s('test', {data: null});
		return response.success(req, res, 'pong', 200);
    }catch(e){
        await pgsql.query('ROLLBACK');
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
});

router.post('/perfor', async function(req, res, next){
	try{
        await pgsql.query('BEGIN');
        const object = 'Receipt__c';
		const schema = process.env.PG_SCHEMA;
        let params = req.body;
        params = objectLibs.clean(params);
        let uuid = '';
        let objItem = await pgRepository.findFirst(schema, object.toLowerCase(),'id,sf_id,external_receipt_id__c', `external_receipt_id__c = '${params.external_receipt_id__c}'`);
        if(!objItem.success){
            objItem = await pgRepository.create(schema,object.toLowerCase(),'merchant,created_at,external_receipt_id__c', [
                params.from__c,Date.now(),params.external_receipt_id__c
            ]);
            uuid = objItem.id;
        }else{
            uuid = objItem.row.id;
        }
        let data = await pgRepository.create(schema,'gw_trackings','object,value,operation,created_at,merchant,uuid__c', [
            object.toLowerCase(),params,consts.JOB_OPERATION_UPSERT,Date.now(),params.from__c,uuid
        ]);
        if(!data.success) return response.fail(req, res, data, statusCode.PG_INVALID_PARAMS);
        data.id = uuid;
        await pgsql.query('COMMIT');
        await redis.s('test', {data});
		console.log('pong');
		return response.success(req, res, 'pong', 200);
    }catch(e){
        await pgsql.query('ROLLBACK');
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
});

router.post('/webhook', async function(req, res, next){
	let username = process.env.MPIT_USERNAME_AUTH_BASIC;
	let password = process.env.MPIT_PASSWORD_AUTH_BASIC;
	let auth = "Basic " + Buffer.from(`${username}:${password}`).toString('base64');
	let mpit_res = await baseRepository.job(process.env.MPIT_URL_PULL_CASE, { items: [] }, { 'Content-Type': 'application/json; charset=utf-8', 'Authorization' : auth },'post', { json: true });

	return response.success(req, res, mpit_res.body, 200);
});

router.get('/listByIds', function(req, res, next){
	let arrIds = [];
	for (var i = data.length - 1; i >= 0; i--) {
		arrIds.push(data[i].Id);
	}
	return response.success(req, res, arrIds, 200);
});

router.get('/performance', checkAuth, async function(req, res, next){
	let instance_url = req.user.instance_url;
	let auth = 'Bearer '+ req.user.token;
	let field = 'Id,AccountId,Employee__c,Nhan_vien_CSKH__c,Tai_Lieu_Dinh_Kem__c,CaseNumber,Description,Comments__c,So_Ho_So__c,So_phieu_khieu_nai__c,Li_do_khieu_nai__c,Priority,Origin,Nhom_dich_vu__c,Location_Type__c,Service__c,Status,CreatedDate,Shipment__c,SuppliedName,SuppliedPhone,SuppliedEmail,Contact_address__c,Contact_province__c,Contact_district__c,Contact_commune__c,Nga_y_ti_p_nh_n__c,LastModifiedDate,Employee__r.Employee_Code__c,Nhan_vien_CSKH__r.Employee_Code__c,Contact_province__r.Name,Contact_district__r.Name,Contact_commune__r.Name,Service__r.ProductCode,Shipment__r.Name,Account.Ma_khach_hang__c,Unit__r.Name,(SELECT ContentDocumentId,Id,LinkedEntityId FROM ContentDocumentLinks)';

	let orderBy = 'Nga_y_ti_p_nh_n__c ASC'; let limit = 10;

	let query = `SELECT ${field} FROM Case ORDER BY ${orderBy} LIMIT ${limit}`;

	const data = await baseRepository.job(`${instance_url}/services/data/v46.0/query?${querystring.stringify({q: query})}`, {}, { 'Authorization': auth, 'Content-Type': 'application/json' },'get', {json: true});
	
	if(data.statusCode == 200){
		let records = data.body.records;
		if(records.length > 0){
				records.forEach(element => {
					if(element.ContentDocumentLinks != null){
						console.log(element.ContentDocumentLinks);
					}
				});
		}
		return response.successPaginate(req, res, data.body.records, limit);
	}
});

router.post('/performance', checkAuth, async function(req, res, next){
	let object = 'Case';
 //    let url = `http://183.91.11.56:9001/v46.0/case`;
 //    for(let i = 0; i < 310; i++){
	// 	let params = {
	// 		"AccountId":"",
	// 		"Account.Ma_khach_hang__c":"",
	// 		"Case_Reference_Code__c":"",
	// 		"Chi_Tra_Boi_Thuong__c":"",
	// 		"ContactId":"",
	// 		"Co_Boi_Thuong__c":"",
	// 		"CurrencyIsoCode":"",
	// 		"Description":"",
	// 		"Don_Vi_Chi_Tra_BT_Cho_KH__c":"",
	// 		"Employee__c":"",
	// 		"Employee__r.Employee_Code__c":"",
	// 		"Ket_Qua_Dieu_Tra_Cua_Doi_Tac__c":"",
	// 		"Ket_Qua_Khieu_Nai__c":"",
	// 		"Li_do_khieu_nai__c":"",
	// 		"Li_Do_Mo_Lai__c":"",
	// 		"Location_Type__c":"",
	// 		"Ngay_Boi_Thuong__c":"",
	// 		"Nhan_vien_CSKH__c":"",
	// 		"Nhom_dich_vu__c":"",
	// 		"Noi_dung_ho_tro__c":"",
	// 		"Noi_dung_tu_van__c":"",
	// 		"Origin":"Khác",
	// 		"OwnerId":"",
	// 		"Pha_p_nh_n__c":"",
	// 		"POS_Chu_Tri__c":"",
	// 		"POS_Chu_Tri__r.Name":"",
	// 		"Priority":"Cao",
	// 		"QDBT__c":"",
	// 		"Reason":"ho tro",
	// 		"Package__c":"",
	// 		"Package__r.Name":"",
	// 		"Package_text__c":"HTP12226"+i,
	// 		"Service__c":"",
	// 		"Service__r.External_service__c":"",
	// 		"So_Ho_So__c":"",
	// 		"So_phieu_khieu_nai__c":"",
	// 		"So_Tien_Phai_Boi_Thuong__c":"",
	// 		"Status":"",
	// 		"Subject":"H T SB "+i+" 13/2/2020",
	// 		"Legacy_Meta_Data__c":"",
	// 		"S_quy_t_i_nh_BT__c":"",
	// 		"Tai_Lieu_Dinh_Kem__c":"",
	// 		"Thoi_gian1__c":"",
	// 		"Nhan_vien_CSKH__r.Employee_Code__c":"",
	// 		"SuppliedName":"",
	// 		"SuppliedPhone":"",
	// 		"SuppliedEmail":"",
	// 		"Contact_address__c":"",
	// 		"Contact_province__r.Name":"",
	// 		"Contact_district__r.Name":"",
	// 		"Contact_commune__r.Name":"",
	// 		"Nga_y_ti_p_nh_n__c":""
	// 	};
	// 	console.log('procesed '+i);
	// 	let data = await baseRepository.create(url, params, req);
	// 	console.log(data.body);
 //    }
 //    return 1;
 //    next();
	// let url = `${req.user.instance_url}/services/data/v46.0/composite/tree/Performance__c`;
	// let j = 0;
	// while (j < 10) {
	// 	let performances = {records:[]};
	// 	for(let i = 0; i<201; i++){
	// 		let performance = {
	// 		    "attributes" : {"type" : "Performance__c", "referenceId" : "ref"+i+j},
	// 		    "Name" : "Test Performance " + j*10000+i,
	// 		    "Performance_Number__c" : j*10000+i,
	// 		    "Performance_Email__c" : j*10000+i+"@cmc.com.vn" 
	// 	    }
	// 		performances.records.push(performance);
	// 	}
	// 	let data = await baseRepository.create(url, performances, req);
	// 	//console.log(data.body.results);
	// 	j++;
	// 	console.log('j:'+j);
	// }
});

router.get('/redis', async function(req, res, next){
	// for(let i = 0; i <= 200; i++){
	// 	redis.s('Lead', {
	// 	    LastName: "Last Name "+i,
	// 	    FirstName: "First Name "+i,
	// 	    Description: "Description "+i,
	// 	    Title: "Title "+i,
	// 	    LeadSource: "LeadSource "+i
	// 	})
	// }
	// let data = await redis.g('Lead_1');
	// let data = [];
	// // Create a readable stream (object mode)
	// var stream = redis.scanStream({ match: 'Lead_*',count: 200 });
	// stream.on('data', function (resultKeys) {
	//   // `resultKeys` is an array of strings representing key names.
	//   for (let i = 0; i < resultKeys.length; i++) {
	//   	let item = redis.g(resultKeys[i]);
	//   	data.push(item);
	//   }
	// });
	// stream.on('end', function () {
	// 	console.log(data);
	//   	//console.log('all keys have been visited');
	// });

	// console.log(data);
	// console.log('redis');
	// let params = {
	// 	username: "admin2019@vnpost.com.vn",
	// 	password: "cmcsi123"
	// };
	// let url = 'http://183.91.11.56:8000/v46.0/auth/login';
	// const opts = {
	//     headers: {
	//         'Content-Type': 'application/json'
	//     },
	//     body: params,
	//     url: url,
	//     json: true
	// }
	// const body = await request.postAsync(opts);
	//console.log(body);
	return response.success(req, res, 'oke', 200);
});

router.get('/pgsql', async function(req, res, next){
	let data = await pgsql.query('SELECT id, key, value FROM leads LIMIT $1', [10]);

	console.log(data);
	return response.success(req, res, data.rows, 200);
});

module.exports = router;