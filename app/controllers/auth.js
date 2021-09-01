const authRepository = require('../repositories/auth'),
	statusCodeConst = require('../consts/statusCode'),
	response = require('../libs/response'),
	request = require('request'),
	bcrypt = require('bcrypt-nodejs'),
	_ = require('lodash'),
	redisDeletePattern  = require('redis-delete-pattern'),
	{ redis, pgsql } = require('../libs/db');

// const client_id = process.env.CONSUMER_KEY || '3MVG9G9pzCUSkzZvLnOoNdZiIwkzbwEXkfKTDDLU8yxwkoM0JOtF28T0_ITtPViC7jUnXGTAhatw4cofvvYLp';
// const client_secret = process.env.CONSUMER_SECRET || '27F973550D8414FBE2D628B2A6543BC19487DB39C0744E06DF60600B626878B2';

const app_token_url = process.env.CONSUMER_TOKEN_URL || 'https://login.salesforce.com/services/oauth2/token';
const instance_url = 'https://vnpost.my.salesforce.com';

exports.login = async (req, res, next) => {
	try{
	    let client_id = req.body.client_id;
	    let client_secret = req.body.client_secret;

		//<editor-fold desc="gen secret key">
		// let salt = process.env.SALT;
		// bcrypt.genSalt(salt, function(err, salt) {
		// 	console.log(1111);
		// 	bcrypt.hash(client_secret, salt, null,function(err, hash) {
		// 		console.log('err', err);
		// 		console.log('hash', hash);
		// 		console.log(22222222);
		// 	});
		// });
		//</editor-fold>

	    if(client_id == undefined || client_id == ''){
	    	return response.fail(req, res, {
	    		message: 'Client Id Invalid',
            	errorCode: statusCodeConst.INVALID_PARAMS
	    	}, statusCodeConst.INVALID_PARAMS);
	    }
	    if(client_secret == undefined || client_secret == ''){
	    	return response.fail(req, res, {
	    		message: 'Client Secret Invalid',
            	errorCode: statusCodeConst.INVALID_PARAMS
	    	}, statusCodeConst.INVALID_PARAMS);
	    }
	    let username = process.env.SFUSERNAME;
		let password = process.env.PASSWORD;
	    // login with salesforce
		const computedURL = app_token_url+'?client_id='+client_id+'&grant_type=password'+'&client_secret='+client_secret+'&username='+username+'&password='+password;
		let data = await authRepository.login(computedURL, {});
		if(data.statusCode != statusCodeConst.SUCCESS){
			return response.fail(req, res, data.body, data.statusCode);
		}
		// update db
		//let expired_at = parseInt(data.body.issued_at) + 2*60*60*1000; // + 2 hours
		//let created_at = Date.now();
		let access_token = data.body.access_token;

		let sql_select = `SELECT * from ${process.env.PG_SCHEMA}.gw_sessions where consumer_key = $1 LIMIT 1`;
		let sessionsSelect = await pgsql.query(sql_select,[client_id]);

		if(!_.isUndefined(sessionsSelect) && _.isArray(sessionsSelect.rows) && sessionsSelect.rows.length){
			let appUser = sessionsSelect.rows[0];
			let check = await bcrypt.compareSync(client_secret, appUser.consumer_secret);
			if(!check){
				return response.fail(req, res, {
					message: 'Client Id Invalid',
					errorCode: statusCodeConst.INVALID_PARAMS
				}, statusCodeConst.INVALID_PARAMS);
			}
			let key_redis = 'sessions:' + access_token;
			let time_redis = 7200;
			await redis.s(key_redis, appUser, time_redis);
			return response.success(req, res, data.body);
		}else {
			return response.fail(req, res, {
				message: 'Client Id Invalid',
				errorCode: statusCodeConst.INVALID_PARAMS
			}, statusCodeConst.INVALID_PARAMS);
		}

	}catch(e){
		await response.logRedis(req,e);
		return response.fail(req, res, {
			message: e + '',
			errorCode: e.name?e.name:statusCodeConst.INVALID_PARAMS
		}, statusCodeConst.INVALID_PARAMS);
    }
}

exports.refresh = async (req, res, next) => {
    // login with salesforce
    let client_id = req.body.client_id;
    let client_secret = req.body.client_secret;
	const computedURL = app_token_url+'?grant_type=refresh_token&client_id='+client_id+'&client_secret='+client_secret+'&refresh_token='+req.headers.authorization;
	let data = await authRepository.login(computedURL, {});
	if(data.statusCode != statusCodeConst.SUCCESS){
		return response.fail(req, res, data.body, data.statusCode);
	}
	return response.success(req, res, data.body);
}

exports.logout = async (req, res, next) => {
	let computedURL = `${instance_url}/services/oauth2/revoke?token=${req.headers.authorization}`;
	let data = await authRepository.login(computedURL, {});
	if(data.statusCode != statusCodeConst.SUCCESS){
		return response.fail(req, res, data.body, data.statusCode);
	}
	// update lại
	return response.success(req, res, {});
}

exports.callback = async (req, res, next) => {
	console.log(111111);
	console.log(res.body);
	return response.success(req, res, res);
}

exports.code = async (req, res, next) => {
	let client_id = req.body.client_id;
    let client_secret = req.body.client_secret;
	if(req.query.code){
		// get token
		const computedURL = app_token_url+
					'?client_id='+ client_id +
					'&client_secret='+client_secret+
					'&grant_type=authorization_code'+
					'&code='+req.query.code+
					'&redirect_uri=http://localhost:9001/v46.0/auth/callback';
		let data = await authRepository.login(computedURL, {});
		if(data.statusCode != statusCodeConst.SUCCESS){
			return response.fail(req, res, data.body, data.statusCode);
		}
		return response.success(req, res, data.body);
	}else{
		return response.fail(req, res, {}, 400);
	}
}

exports.authorize = (req, res, next) => {
	let computedURL =`${instance_url}/services/oauth2/authorize?response_type=code&client_id=3MVG9G9pzCUSkzZvLnOoNdZiIwkzbwEXkfKTDDLU8yxwkoM0JOtF28T0_ITtPViC7jUnXGTAhatw4cofvvYLp&redirect_uri=http://localhost:9001/v46.0/auth/code`;
	authRepository.authorize(computedURL, {}, res);
}

exports.deleteCache = (req, res, next) => {
	let key = req.query.key;
	if(key){
		redisDeletePattern({
			redis: redis,
			pattern: key
		}, function handleError (err) {
			if(err){
				console.log('err:', err);
				return response.fail(req, res, {});
			}else {
				return response.success(req, res, {});
			}
		});
	}else {
		return response.fail(req, res, {});
	}
}
