const redisDeletePattern  = require('redis-delete-pattern');
const {CACHED_EXPIRATION} = require('../consts');

module.exports = {
    cacheRequest: function(options){
    	const client = require('redis').createClient(process.env.REDIS_PORT, process.env.REDIS_HOST, { auth_pass: process.env.REDIS_PASSWORD });
        client.select(process.env.REDIS_DB);
        const cache = require('express-redis-cache')({
            client: client, prefix: 'cache-request:'+options.prefix,
            expire: Object.assign(CACHED_EXPIRATION,{200: 60*2})
        });
        cache.on('error', function (error) {
            console.log(error);
          throw new Error('Cache error!');
        });
        return cache;
    },
    // use customize
    folk: async (req, res, next) => {
        let hash = Buffer.from(JSON.stringify(req.body)).toString('base64');
        res.express_redis_cache_name = req.originalUrl + '----hash=' + hash;
        next();
    },
    useCache: async (req, res, next) => {
        let cached = true;
        if (typeof req.query.cached !== 'undefined') {
            cached = Boolean(Number(req.query.cached))
        }
        res.use_express_redis_cache = cached;
        next();
    },
};
