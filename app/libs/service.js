const Promise = require("bluebird"), request = Promise.promisifyAll(require('request'));
const winston = require('../configs/winston');
const fs = require('fs');
var { redis } = require('../libs/db');
const response = require('../libs/response');
const statusCode = require('../consts/statusCode');

const timeout = 30000;

module.exports = {
    getAsyncService: async (url, req) => {
        let serverCode = statusCode.SERVER
        try{
            const opts = {
                headers: {
                    'Authorization': 'OAuth ' + req.user.token,
                    'Content-Type': 'application/json'
                },
                url: url,
                json: true,
                timeout: timeout
            };
            const { body, statusCode } = await request.getAsync(opts);
            serverCode = statusCode
            winston.info(`GET ASYNC SERVICE - ${statusCode} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${JSON.stringify(opts)}`);
            return {
                body: body,
                statusCode: serverCode
            };
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:getAsyncService:getAsyncService-error-${Date.now()}`, {
                error: e.stack, name: e.name,
                url
            });
            return {
                body: {
                    message: e + '',
                    errorCode: e.name?e.name:statusCode.SERVER
                },
                statusCode: serverCode
            }
        }
    },
    postAsyncService: async (url, params, req, ContentType='application/json') => {
        let serverCode = statusCode.SERVER
        try{
            const opts = {
                headers: {
                    'Authorization': 'OAuth ' + req.user.token,
                    'Content-Type': ContentType,
                    'Sforce-Auto-Assign': false
                },
                body: params,
                url: url,
                json: true,
                timeout: timeout
            }
            const { body, statusCode } = await request.postAsync(opts);
            serverCode = statusCode
            winston.info(`POST ASYNC SERVICE - ${statusCode} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${JSON.stringify(opts)} - ${JSON.stringify(body)}`);
            return {
                body: body,
                statusCode: serverCode
            };
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:postAsyncService:postAsyncService-error-${Date.now()}`, {
                name: e.name,
                stack: e.stack
            });
            return {
                body: {
                    message: e + '',
                    errorCode: e.name?e.name:statusCode.SERVER
                },
                statusCode: serverCode
            }
        }
    },
    deleteAsyncService: async (url, req) => {
        const opts = {
            headers: {
                'Authorization': 'OAuth ' + req.user.token,
                'Content-Type': 'application/json'
            },
            url: url,
            json: true,
            timeout: timeout
        }
        const { body, statusCode } = await request.deleteAsync(opts);
        winston.info(`DELETE ASYNC SERVICE - ${statusCode} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${JSON.stringify(opts)} - ${JSON.stringify(body)}`);
        return {
            body: body,
            statusCode: statusCode
        };
    },
    updateAsyncService: async (url, params, req) => {
        let serverCode = statusCode.SERVER
        try{
            const opts = {
                headers: {
                    'Authorization': 'OAuth ' + req.user.token,
                    'Content-Type': 'application/json',
                    'Sforce-Auto-Assign': false
                },
                body: params,
                url: url,
                json: true,
                timeout: timeout
            }
            const { body, statusCode } = await request.patchAsync(opts);
            winston.info(`PATCH ASYNC SERVICE - ${statusCode} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${JSON.stringify(opts)} - ${JSON.stringify(body)}`);
            serverCode = statusCode
            return {
                body: body,
                statusCode: serverCode
            };
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:updateAsyncService:updateAsyncService-error-${Date.now()}`, {
                name: e.name,
                stack: e.stack
            });
            return {
                body: {
                    message: e + '',
                    errorCode: e.name?e.name:statusCode.SERVER
                },
                statusCode: serverCode
            }
        }
    },
    updateService: (url, params, req) => {
        let serverCode = statusCode.SERVER
        try{
            const opts = {
                headers: {
                    'Authorization': 'OAuth ' + req.user.token,
                    'Content-Type': 'application/json'
                },
                body: params,
                url: url,
                json: true,
                timeout: timeout
            }
            const { body } = request.patch(opts);
            winston.info(`PATCH SERVICE - ${req.originalUrl} - ${req.method} - ${req.ip} - ${JSON.stringify(opts)} - ${JSON.stringify(body)}`);
            return body;
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:updateService:updateService-error-${Date.now()}`, {
                name: e.name,
                stack: e.stack
            });
            return {
                body: {
                    message: e + '',
                    errorCode: e.name?e.name:statusCode.SERVER
                },
                statusCode: serverCode
            }
        }
    },
    putAsyncService: async (url, params, req, headers = {}) => {
        try{
            if(headers.length <= 0){
                headers = {
                    'Authorization': 'OAuth ' + req.user.token,
                    'Content-Type': 'application/json'
                }
            }
            const opts = {
                headers,
                body: params,
                url: url,
                json: true,
                timeout: timeout
            }
            const { body, statusCode } = await request.putAsync(opts);
            winston.info(`PATCH ASYNC SERVICE - ${statusCode} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${JSON.stringify(opts)} - ${JSON.stringify(body)}`);
            return {
                body: body,
                statusCode: statusCode
            };
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:putAsyncService:putAsyncService-error-${Date.now()}`, {
                name: e.name,
                stack: e.stack
            });
            return {
                body: {
                    message: e + '',
                    errorCode: e.name?e.name:statusCode.SERVER
                },
                statusCode: statusCode.SERVER
            }
        }
    },
    downloadAsyncService: async (url, req) => {
        try{
            const opts = {
                headers: {
                    'Authorization': 'OAuth ' + req.user.token,
                    'Content-Disposition': 'attachment, filename = abc.png'
                },
                url: url,
                json: true,
                timeout: timeout
            };

            const { body, statusCode } = await request.getAsync(opts);
            winston.info(`GET ASYNC SERVICE - ${statusCode} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${JSON.stringify(opts)}`);
            return {
                body: body,
                statusCode: statusCode
            };
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:downloadAsyncService:downloadAsyncService-error-${Date.now()}`, {
                name: e.name,
                stack: e.stack
            });
            return {
                body: {
                    message: e + '',
                    errorCode: e.name?e.name:statusCode.SERVER
                },
                statusCode: statusCode.SERVER
            }
        }
    },
    uploadAsyncService: async (url, req) => {
        try{
            let file = req.file;
            let bodyReq = req.body;
            let data = {
                "Name": file.originalname,
                "Description": bodyReq.Description,
                "ParentId": bodyReq.ParentId
            };
            const opts = {
                url: url,
                json: true,
                headers: {
                    'Authorization': 'Bearer '+ req.user.token,
                    'Content-Type': 'multipart/form-data',
                },
                formData: {
                    entity_document: {
                        value: JSON.stringify(data),
                        options: {
                            contentType: "application/json"
                        }
                    },
                    Body: fs.createReadStream(file.path)
                },
                timeout: timeout
            };
            const { body, statusCode } = await request.postAsync(opts);
            winston.info(`GET ASYNC SERVICE - ${statusCode} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${JSON.stringify(opts)}`);
            return {
                body: body,
                statusCode: statusCode
            };
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:uploadAsyncService:uploadAsyncService-error-${Date.now()}`, {
                name: e.name,
                stack: e.stack
            });
            return {
                body: {
                    message: e + '',
                    errorCode: e.name?e.name:statusCode.SERVER
                },
                statusCode: statusCode.SERVER
            }
        }
    }
};
