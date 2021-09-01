// var session = require('express-session');
const querystring = require('querystring'),
    statusCode = require('../consts/statusCode'),
    responseLibs = require('../libs/response'),
    configConst = require('../configs'),
    objectLibs = require('../libs/object'),
    _ = require('lodash');

module.exports = async (req, res, next) => {
    try {
        let objectReq = req.originalUrl.replace(/\?.*$/, '').split('/')[2];

        let validate = await objectLibs.validateObject(objectReq, req.body);
        if (validate.success == true) {
            req.body = validate.body;
            next();
        } else {
            return responseLibs.fail(req, res, validate.body, statusCode.INVALID_PARAMS, 'Has params unnecessary');
        }

    } catch (error) {
        return responseLibs.fail(req, res, {
            message: error + '',
            errorCode: error.name?error.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};
