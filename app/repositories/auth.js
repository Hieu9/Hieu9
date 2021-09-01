var Promise = require("bluebird"),
    request = Promise.promisifyAll(require('request')),
    winston = require('../configs/winston'),
    libsFile = require('../libs/file'),
    { redis } = require('../libs/db');

module.exports = {
    login: async function(computedURL, params){
        const opts = {
            headers: {'Content-Type': 'application/json'},
            url: computedURL,
            json: true
        }
        const { body, statusCode } = await request.postAsync(opts);
        winston.info(`POST ASYNC SERVICE - ${statusCode} - ${JSON.stringify(opts)} - ${JSON.stringify(body)}`);
        return {
            body: body,
            statusCode: statusCode    
        };
    },
    revoke: async function(computedURL, params){
        const opts = {
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            url: computedURL
        }
        const { body, statusCode } = await request.postAsync(opts);
        winston.info(`POST REVOKE ASYNC SERVICE - ${statusCode} - ${JSON.stringify(opts)} - ${JSON.stringify(body)}`);
        return {
            body: body,
            statusCode: statusCode    
        };
    },
    authorize: function(computedURL, params, res){
        const opts = {
            headers: {'Content-Type': 'application/json'},
            url: computedURL,
            json: true
        }

        request(opts, function(err, remoteResponse, remoteBody) {
            if (err) { return res.status(500).end('Error'); }
            //res.writeHead(...); // copy all headers from remoteResponse
            res.end(remoteBody);
        });

    },
    loginBg: async function(folder_token){
        try{
            let client_id = process.env.CONSUMER_KEY;
            let client_secret = process.env.CONSUMER_SECRET;
            let username = process.env.SFUSERNAME;
            let password = process.env.PASSWORD;
            // login with salesforce
            const computedURL = process.env.CONSUMER_TOKEN_URL+'?client_id='+client_id+'&grant_type=password'+'&client_secret='+client_secret+'&username='+username+'&password='+password;
            
            const { body, statusCode } = await request.postAsync({
                headers: {'Content-Type': 'application/json'},
                url: computedURL,
                json: true
            });

            if(statusCode == 200){
                await libsFile.writeFile(body, 'sessions', process.env.SFUSERNAME);
                let userLogin = await libsFile.readFile(folder_token, process.env.SFUSERNAME);
                return userLogin;
            }else{
                return null;
            }
        }catch(e){
            await redis.s(`${process.env.REDIS_KEYPREFIX}:System:loginBg:fail:Login-Error-${Date.now()}`, e);
        }
    }
}