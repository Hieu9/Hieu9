const Promise = require("bluebird"),
    request = Promise.promisifyAll(require('request')),
    service = require('../libs/service'),
    response = require('../libs/response'),
    statusCode = require('../consts/statusCode'),
    querystring = require('querystring'),
    _ = require('lodash'),
    { redis } = require('../libs/db');

module.exports = {
    find: async (url, req) => {
        try{
            return await service.getAsyncService(url, req);
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:find:find-error-${Date.now()}`, {
                name: e.name,
                stack: e.stack
            });
            return {
                statusCode: statusCode.SERVER,
                body: e.stack
            };
        }
    },
    findFirst: async function(url, req){
        try{
            return await service.getAsyncService(url, req);
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:findFirst:findFirst-error-${Date.now()}`, {
                name: e.name,
                stack: e.stack
            });
            return {
                statusCode: statusCode.SERVER,
                body: e.stack
            };
        }
    },
    create: async function(url, params, req){
        try{
            return await service.postAsyncService(url, params, req);
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:create:create-error-${Date.now()}`, {
                name: e.name,
                stack: e.stack
            });
            return {
                statusCode: statusCode.SERVER,
                body: e.stack
            };
        }
    },
    delete: async function(url, req){
        try{
            return await service.deleteAsyncService(url, req);
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:delete:delete-error-${Date.now()}`, {
                name: e.name,
                stack: e.stack
            });
            return {
                statusCode: statusCode.SERVER,
                body: e.stack
            };
        }
    },
    update: async function(url, params, req){
        try{
            return await service.updateAsyncService(url, params, req);
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:update:update-error-${Date.now()}`, {
                name: e.name,
                stack: e.stack
            });
            return {
                statusCode: statusCode.SERVER,
                body: e.stack
            };
        }
    },
    put: async function(url, params, req, headers = {}){
        try{
            return await service.putAsyncService(url, params, req, headers);
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:put:put-error-${Date.now()}`, {
                name: e.name,
                stack: e.stack
            });
            return {
                statusCode: statusCode.SERVER,
                body: e.stack
            };
        }
    },
    count: async (url, req) => {
        try{
            return await service.getAsyncService(url, req);
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:count:count-error-${Date.now()}`, {
                name: e.name,
                stack: e.stack
            });
            return {
                statusCode: statusCode.SERVER,
                body: e.stack
            };
        }
    },
    queryUrl: function(req, object, field, condition = '', order = '', l=0, o=0, i_url = true){
        try{
            let limit = req.query.limit?'LIMIT '+req.query.limit:'';
            let offset = req.query.offset?'OFFSET '+o:'';
            let where = (condition != '')?`WHERE ${condition}`:'';
            let orderBy = (order != '')?'ORDER BY '+order:'';
            let query = `SELECT ${field} FROM ${object} ${where} ${orderBy} ${limit} ${offset}`;
            let url = '';
            if(i_url){
                url = req.user.instance_url+'/services/data/'+req.query.ver+'/query?'+querystring.stringify({q: query});
            }else{
                url = req.query.ver+'/query?'+querystring.stringify({q: query});
            }
            return url;
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:queryUrl:queryUrl-error-${Date.now()}`, {
                name: e.name,
                stack: e.stack
            });
            return {
                statusCode: statusCode.SERVER,
                body: e.stack
            };
        }
    },
    query: async (req, object, field, condition = '', order = '', l=0, o=0) => {
        try{
            let url = module.exports.queryUrl(req,object,field,condition,order,l,o);
            return await service.getAsyncService(url, req);
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:query:query-error-${Date.now()}`, {
                name: e.name,
                stack: e.stack
            });
            return {
                statusCode: statusCode.SERVER,
                body: e.stack
            };
        }
    },
    detail: async (req, object, field, condition = '') => {
        try{
            let where = (condition != '')?'WHERE '+condition:'';
            let query = `SELECT ${field} FROM ${object} ${where} LIMIT 1`;
            let url = req.user.instance_url+'/services/data/'+req.query.ver+'/query?'+querystring.stringify({q: query});
            return await service.getAsyncService(url, req);
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:detail:detail-error-${Date.now()}`, {
                name: e.name,
                stack: e.stack
            });
            return {
                statusCode: statusCode.SERVER,
                body: e.stack
            };
        }
    },
    tree: async function(object, params, req){
        try{
            let body = {records:[]};
            if(params.length > 0){
                for(let i=0; i<params.length; i++){
                    params[i].attributes = {"type" : object, "referenceId" : "ref"+(i+1)};
                    body.records.push(params[i]);
                }
            }
            let url = `${req.user.instance_url}/services/data/${req.query.ver}/composite/tree/${object}`;
            return await service.postAsyncService(url, body, req);
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:tree:tree-error-${Date.now()}`, {
                name: e.name,
                stack: e.stack
            });
            return {
                statusCode: statusCode.SERVER,
                body: e.stack
            };
        }
    },
    batch: async function(params, req){
        try{
            let body = { batchRequests: params };
            let url = `${req.user.instance_url}/services/data/${req.query.ver}/composite/batch`;
            return await service.postAsyncService(url, body, req);
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:batch:batch-error-${Date.now()}`, {
                name: e.name,
                stack: e.stack
            });
            return {
                statusCode: statusCode.SERVER,
                body: e.stack
            };
        }
    },
    job: async function(url, body, headers, method, option = {}){
        let result = {};
        try{
            let opts = { headers, body, url, json: true, timeout: 30000 }; // 30000: 30s
            if(option.json != undefined && option.json == false){
                opts.json = false;
            }
            if(method == 'put'){
                result = await request.putAsync(opts);
            }else if(method == 'patch'){
                result = await request.patchAsync(opts);
            }else if(method == 'post'){
                result = await request.postAsync(opts);
            }else{
                let optsGet = { headers, url, json: true };
                result = await request.getAsync(optsGet);
            }
            return result;
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:worker:System:${new Date().toISOString().slice(0,10)}:job:job-error-${Date.now()}`, {
                error: e.stack,
                name: e.name,
                url
            });
            return result;
        }
    },
    getFiles: async function(records, instance_url, token){
        try{
            if(records){
                let url = instance_url+'/services/apexrest/link-document';
                let ids = records.map(function(item){
                    return item.Id;
                }).join(",");
                const opts = {
                    headers: {
                        'Authorization': 'OAuth ' + token,
                        'Content-Type': 'application/json'
                    },
                    body: { ids },
                    url: url,
                    json: true
                }
                let data = await request.postAsync(opts);
                let grIds = _.chain(data.body).groupBy("id").map((value, key) => ({ Id: key, Files: value })).value();
                _.merge(_.keyBy(records, 'Id'), _.keyBy(grIds, 'Id'));
            }
            return records;
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:getFiles:getFiles-error-${Date.now()}`, {
                name: e.name,
                stack: e.stack
            });
            return {
                statusCode: statusCode.SERVER,
                body: e.stack
            };
        }
    },
    downloadFile: async function(url, req){
        try{
            return await service.downloadAsyncService(url, req);
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:downloadFile:downloadFile-error-${Date.now()}`, {
                name: e.name,
                stack: e.stack
            });
            return {
                statusCode: statusCode.SERVER,
                body: e.stack
            };
        }
    },
    uploadFiles: async function(url, req) {
        try{
            return await service.uploadAsyncService(url, req);
        }catch(e){
            redis.s(`${process.env.REDIS_KEYPREFIX}:fail:System:${new Date().toISOString().slice(0,10)}:uploadFiles:uploadFiles-error-${Date.now()}`, {
                name: e.name,
                stack: e.stack
            });
            return {
                statusCode: statusCode.SERVER,
                body: e.stack
            };
        }
    }
}
