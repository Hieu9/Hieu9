// const statusCodeConst = require('../consts/statusCode');
// const winston = require('../configs/winston');
const objectLibs = require('./object');
const datetime = require('./datetime');
const {redis} = require('./db');

module.exports = {
    success: function(req, res, body, statusCode = 200, statusMessage = 'success'){
        body = objectLibs.responseBodySuccess(statusCode, body);
        res.status(statusCode);
        res.json({
            statusCode,
            statusMessage,
            body
        }).end();
    },
    successPaginate: function(req, res, object, limit = 5, offset = 1, total=0, statusCode = 200, statusMessage = 'success'){
        results = objectLibs.responseBodySuccess(statusCode, object.results);
        let body = { limit: limit, offset: offset, total: total };
        if(object.nextRecordsUrl){
            let arrUrl = object.nextRecordsUrl.split(/[\s/]+/);
            body.nextRecordsUrl = `/query/${arrUrl[arrUrl.length-1]}`;
        };
        body.results = object.records;
        res.status(statusCode);
        res.json({
            statusCode,
            statusMessage,
            body
        }).end();
    },
    fail: async function(req, res, body, statusCode = 405, statusMessage = 'failed', options = {}){
        body = objectLibs.responseBodyFail(statusCode, body);
        res.status(statusCode);
        res.json({
            statusCode,
            statusMessage,
            body
        }).end();
    },
    logRedis
};

async function logRedis(req, e){
    let url = req.originalUrl;
    let keyRedis = 'Failed:' + url + ':' + datetime.dayvnNow('date') + ':' + datetime.dayvnNow('minute');
    try {
        let errorData = {
            name: e.name, // e.g. ReferenceError
            url: req.originalUrl,
            stack: e.stack // stacktrace string; remember, different per-browser!
        };
        await redis.s(keyRedis, errorData, 86400*60);
    }catch (e) {
        await redis.s(keyRedis, {redis_error: true})
    }
}
