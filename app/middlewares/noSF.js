// var session = require('express-session');
const querystring = require('querystring'),
		statusCode = require('../consts/statusCode'),
		responseLibs = require('../libs/response'),
		configConst = require('../configs'),
		_ = require('lodash'),
		{ redis, pgsql } = require('../libs/db');

module.exports = async (req, res, next) => {
	try{
		const token = req.headers.authorization;
		if(token == '' && token == undefined){
			return responseLibs.fail(req, res, {}, statusCode.UNAUTHORIED);
		}
		let key_redis = `sessions:${token}`;
		let sessions = await redis.g(key_redis);
		if(_.isEmpty(sessions)){
			return responseLibs.fail(req, res, {}, statusCode.UNAUTHORIED);
		}else{
			req.query.ver = req.query.ver?req.query.ver:configConst.VERSION;
			req.user = {token, instance_url: process.env.INSTANCE_URL, app_info: {
				id: sessions.id,
				name: sessions.name,
				url: sessions.url
			}};
			req.body.from__c = sessions?sessions.name.toUpperCase():'';
			next();
		}
	} catch (error) {
		console.log(error);
		return responseLibs.fail(req, res, {}, statusCode.UNAUTHORIED_USERCHATTER);
	}
};