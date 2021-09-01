// var session = require('express-session');
const querystring = require('querystring'),
    statusCode = require('../consts/statusCode'),
    responseLibs = require('../libs/response'),
    datetime = require('../libs/datetime'),
    _ = require('lodash'),
    pgRepository = require('../services/pgRepository'),
    SqlString = require('sqlstring'),
    urlLib = require('url'),
    {redis, pgsql} = require('../libs/db');

module.exports = async (req, res, next) => {
    try {
        let url = req.originalUrl.replace(/\?.*$/, '');
        Object.values(req.params).length > 0 ? url = url.replace('/' + Object.values(req.params).join('/'),'') : '';

        let method = req.method;
        let from = req.body.from__c ? req.body.from__c : 'ANONYMOUS:'+req.ip;
        let keyRedis = 'CountRequest:' + from + ':' + datetime.dayvnNow('date');
        let log = await redis.g(keyRedis);
        if(!log) log = {};
        if(!log || _.isUndefined(log[url])){
            log[url] = {
                [method]: 1
            };
            await redis.s(keyRedis, log, 25200);
        }else {
            if(!_.isUndefined(log[url][method])){
                log[url][method] = log[url][method]*1 + 1;
            }else {
                log[url][method] = 1;
            }
            await redis.s(keyRedis,log, 25200);
        }
    } catch (error) {
        console.log(error);
        return responseLibs.fail(req, res, {}, statusCode.INVALID_PARAMS);
    }
    next();
};

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}
