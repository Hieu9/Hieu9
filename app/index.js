const express = require('express'),
	cors = require('cors'),
	bodyParser = require('body-parser'),
	fs = require('fs'),
	path = require('path'),
	morgan = require('morgan'),
	moment = require('moment-timezone'),
	app = express(),
	winston = require('./configs/winston'),
	kue = require('kue'),
	ui = require('kue-ui'),
	csvConvert = require('./libs/csvToJson'),
	rateLimit = require("express-rate-limit");
// config kue, job
	kue.createQueue({
		prefix: process.env.REDIS_KEYPREFIX+'_JOB', 
		redis: {
			port: process.env.REDIS_PORT,
			host: process.env.REDIS_HOST, 
			auth: process.env.REDIS_PASSWORD,
			db: process.env.REDIS_DB_JOB
		}
	});
	ui.setup({
		apiURL: '/jobs-api',
		baseURL: '/jobs',
		updateInterval: 5000
	});
// let a = [];
// for(let i =1; i <=2000; i++){
// 	a.push(`'${i}'`);
// }
// console.log(a.join(','));
// const Sentry = require('@sentry/node');
// Sentry.init({ dsn: 'https://53399ac2803f4e49a3fc660a11810830@sentry.io/1868602' });
// config logs
const accessLogStream = fs.createWriteStream(
	path.join('./', 'logs', 'access.log'),{ flags: 'a' }
);
const VERSION = process.env.VERSION || 'v46.0';

app.use(express.static('public'));

app.use(morgan('combined', { stream: winston.stream }));
// var whitelist = ['http://183.91.11.56:9001', 'http://183.91.11.56:8000', 'http://localhost:8000', 'http://localhost:9001']
// var corsOptions = {
//   origin: function (origin, callback) {
//     if (whitelist.indexOf(origin) !== -1) {
//       callback(null, true)
//     } else {
//       callback(new Error('Not allowed by CORS'))
//     }
//   }
// }
app.use(cors());
app.use(bodyParser.json({limit: '1000mb'}));
app.use(bodyParser.urlencoded({ limit: '1000mb', extended: true }));
app.use((req, res, next) => {
	//Access Control
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
	//and remove cacheing so we get the most recent comments
	res.setHeader('Cache-Control', 'no-cache');
	next(); // make sure we go to the next routes and don't stop here
});
// routes
// module salesforce
app.use('/jobs-api', kue.app);
app.use('/jobs', ui.app);

const suitecrmRoutes = require('./modules/suitecrm/routes/index');
app.use(`/${VERSION}/suitecrm`, suitecrmRoutes);

const sfJobRoutes = require('./modules/salesforce/routes/jobs');
app.use(`/${VERSION}/jobs`, sfJobRoutes);

const sfQueryRoutes = require('./modules/salesforce/routes/query');
app.use(`/${VERSION}/query`, sfQueryRoutes);

const mpitRoutes = require('./modules/mpit/routes/index');
app.use(`/${VERSION}/mpit`, mpitRoutes);

const gwRoutes = require('./modules/gateway/routes/index');
app.use(`/${VERSION}/gw`, gwRoutes);

const downloadRoutes = require('./modules/salesforce/routes/download-document');
app.use(`/${VERSION}/document`, downloadRoutes);

const connectedAppRoutes = require('./modules/salesforce/routes/connected-app');
app.use(`/${VERSION}/connected-app`, connectedAppRoutes);

const sfObjectInfoRoutes = require('./modules/salesforce/routes/object-info');
app.use(`/${VERSION}/object-info`, sfObjectInfoRoutes);

const sfRecordTypeRoutes = require('./modules/salesforce/routes/recordType');
app.use(`/${VERSION}/RecordType`, sfRecordTypeRoutes);
//
const sobjectsRoutes = require('./routes/sobjects');
app.use(`/${VERSION}/sobjects`, sobjectsRoutes);

const ccWebhookRoutes = require('./modules/CallCenter/routes/webhook');
app.use(`/${VERSION}/cc`, ccWebhookRoutes);

app.enable("trust proxy");

const apiLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 15 minutes 15 * 60 * 1000
	max: 6,
	message: "Too many request login from this IP, please try again after 1 minutes"
});

const authRoutes = require('./routes/auth');
app.use(`/${VERSION}/auth`,apiLimiter, authRoutes);

const referedStatusRoutes = require('./routes/Refered_Status__c');
app.use(`/${VERSION}/Refered_Status__c`, referedStatusRoutes);

const viphamRoutes = require('./routes/Vi_pham__c');
app.use(`/${VERSION}/Vi_pham__c`, viphamRoutes);

const tienTrinhXuLiRoutes = require('./routes/Tien_trinh_xu_li__c');
app.use(`/${VERSION}/Tien_trinh_xu_li__c`, tienTrinhXuLiRoutes);

const hoTroRoutes = require('./routes/Ho_tro__c');
app.use(`/${VERSION}/Ho_tro__c`, hoTroRoutes);

const caseRoutes = require('./routes/case');
app.use(`/${VERSION}/case`, caseRoutes);

const taskRoutes = require('./routes/task');
app.use(`/${VERSION}/task`, taskRoutes);

const accountRoutes = require('./routes/account');
app.use(`/${VERSION}/account`, accountRoutes);

const leadRoutes = require('./routes/lead');
app.use(`/${VERSION}/lead`, leadRoutes);

const contactRoutes = require('./routes/contact');
app.use(`/${VERSION}/contact`, contactRoutes);

const contractRoutes = require('./routes/contract');
app.use(`/${VERSION}/contract`, contractRoutes);

const opportunityRoutes = require('./routes/opportunity');
app.use(`/${VERSION}/opportunity`, opportunityRoutes);

const paypostRoutes = require('./modules/paypost/routes/index');
app.use(`/${VERSION}/paypost`, paypostRoutes);

// Sales Order

// const salesOrderRoutes = require('./routes/SalesOrder__c');
// app.use(`/${VERSION}/SalesOrder__c`, salesOrderRoutes);

// const receiptRoutes = require('./routes/receipt__c');
// app.use(`/${VERSION}/receipt__c`, receiptRoutes);

// const itemRoutes = require('./routes/item__c');
// app.use(`/${VERSION}/item__c`, itemRoutes);

const packageRoutes = require('./routes/Package__c');
app.use(`/${VERSION}/Package__c`, packageRoutes);

// const batchRoutes = require('./routes/Batch__c');
// app.use(`/${VERSION}/Batch__c`, batchRoutes);

// const addedRoutes = require('./routes/Added_Value_in_Package__c');
// app.use(`/${VERSION}/Added_Value_in_Package__c`, addedRoutes);

// const statusRoutes = require('./routes/Status__c');
// app.use(`/${VERSION}/Status__c`, statusRoutes);

// End Sales Order

const addedValueRoutes = require('./routes/added_value_service__c');
app.use(`/${VERSION}/added_value_service__c`, addedValueRoutes);

const employeeRoutes = require('./routes/employee');
app.use(`/${VERSION}/employee__c`, employeeRoutes);

const noteRoutes = require('./routes/note');
app.use(`/${VERSION}/note`, noteRoutes);

const productRoutes = require('./routes/product');
app.use(`/${VERSION}/product`, productRoutes);

const posRoutes = require('./routes/POS__c');
app.use(`/${VERSION}/POS__c`, posRoutes);

const mbcRoutes = require('./routes/Ma_buu_chinh__c');
app.use(`/${VERSION}/Ma_buu_chinh__c`, mbcRoutes);

const userRoutes = require('./routes/User');
app.use(`/${VERSION}/User`, userRoutes);

const geLogsRoutes = require('./modules/salesforce/routes/gw-logs');
app.use(`/${VERSION}/gw-logs`, geLogsRoutes);

const testRoutes = require('./routes/test');
app.use(`/${VERSION}/test`, testRoutes);
// error 404
// app.use((req, res, next) => {
// 	const error = new Error('Not found');
// 	//console.log(error);
// 	// winston.error(`404 - Resource not found - ${req.originalUrl} - ${req.method} - ${req.ip}`);
// 	error.status = 404;
// 	next(error);
// });
// // error 500
// app.use((error, req, res, next) => {
// 	//console.log(error);
// 	winston.error(`500 - Server Error - ${req.originalUrl} - ${req.method} - ${req.ip}`);
// 	res.status(error.status || 500);
// 	res.json({
// 		  "statusCode": 500,
// 		  "statusMessage": "failed",
// 		  "body": {
// 			"message": error.message,
// 			"errorCode": "500_EXCEPTION"
// 		}
// 	});
// 	next();
// });

app.use(function(req, res, next) {
	winston.error(`400 - Not found Error - ${req.originalUrl} - ${req.method} - ${req.ip}`);
	return res.status(404).send({
		  "statusCode": 404,
		  "statusMessage": "failed",
		  "body": {
			"message": "Not found",
			"errorCode": "404_EXCEPTION"
		}
	});
});

// 500 - Any server error
app.use(function(err, req, res, next) {
	// console.log(err);
	winston.error(`500 - Server Error - ${req.originalUrl} - ${req.method} - ${req.ip}`);
	return res.status(500).send({
		  "statusCode": 500,
		  "statusMessage": "failed",
		  "body": {
			"message": "Error",
			"errorCode": "500_EXCEPTION"
		}
	});
});
module.exports = app;
