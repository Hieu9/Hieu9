const Redi = require('ioredis'),
    utility = require('./utility'),
    db = require('../configs/database'),
    pg = require('pg'),
    cmysql = require('mysql'),
    Q = require('q'),
    redisDeletePattern = require('redis-delete-pattern');

var config = {
     host : db.pg.host,
     user: db.pg.user,
     database: db.pg.database,
     password: db.pg.password,
     port: db.pg.port,
     ssl: false
};

const pgsql = new pg.Pool(config);

exports.query = function (sql, values, singleItem, dontLog) {
    try{
        if (!dontLog) {
            typeof values !== 'undefined' ? console.log(sql, values) : console.log(sql);
        }

        var deferred = Q.defer();

        pgsql.connect(function (err, conn, done) {
            if (err) return deferred.reject(err);
            try {
                console.log(err);
                conn.query(sql, values, function (err, result) {
                    done();
                    if (err) {
                        deferred.reject(err);
                    } else {
                        deferred.resolve(singleItem ? result.rows[0] : result.rows);
                    }
                });
            }
            catch (e) {
                console.log(e);
                done();
                deferred.reject(e);
            }
        });
        return deferred.promise;
    }catch(e){
        console.log(e.stack)
    }
}

const redis = new Redi({
    host: db.redis.host,
    port: db.redis.port,
    db: db.redis.db,
    password: db.redis.password,
    keyPrefix: db.redis.REDIS_KEYPREFIX,
    lazyConnect: true,
    enableOfflineQueue: false,
    reconnectOnError: (err) => {
        try{
            let res = false
            const targetError = 'READONLY'
            if (err.message.slice(0, targetError.length) === targetError) {
                console.log(`\n\n*****************\nRedis connection is error...\n--------------------------------\n\n${err.stack}\n\n*********************************************\n\n`);
                res = true
            }
            return res
        }catch(e){
            console.log(e)
        }
    },
    retryStrategy: (times) => {
        try{
            console.log('\n---------------------------\nCannot connect to Redis database, system will auto re-connect after 9 seconds later\n----------------------------------------------\n', 96.3)
            const delay = 9000
            return delay
        }catch(e){
            console.log(e.stack)
        }
    }
})

redis.connect().catch(() => {
    console.log('\n*********************************************\n~~~ !Please Install Redis Database First! ~~~\n*********************************************\n');

    // redis.disconnect()
})
//time truyền s
redis.s = async (key = '', val = null, exp = 3600*24) => {
    try{
        let result
        if (key && val) {
            const value = utility.isJSON(val) ? JSON.stringify(val) : val
            result = await redis.set(key, value, 'EX', exp)
        }
        return result
    }catch(e){
        console.log(e.stack)
    }
}

redis.g = async (key = '') => {
    try{
        const resp = await redis.get(key)
        const result = utility.isJSON(resp) ? JSON.parse(resp) : resp
        return result
    }catch(e){
        console.log(e)
    }
}

redis.d = async (key = '') => {
    try{
        const driver = redis.pipeline()
        const result = await driver.del(key)
        return result
    }catch(e){
        console.log(e.stack)
    }
}

redis.cache = async (obj = null) => {
    try{
        let res
        if (obj && typeof obj === 'object' && !Array.isArray(obj) && obj.val) {
            res = await redis.set(obj.key, utility.isJSON(obj.val) ? JSON.stringify(obj.val) : obj.val, 'EX', obj.exp || configs.authorize.expire)
        } else if (typeof obj === 'string' || typeof obj === 'object') {
            const resp = await redis.get(obj)
            res = utility.isJSON(resp) ? JSON.parse(resp) : resp
        }
        return res
    }catch(e){
        console.log(e.stack)
    }
}

redis.deletePattern = async (key) => {
    try{
        console.log(key)
        await redisDeletePattern({
            redis: redis,
            pattern: key
        }, function handleError (err) {
            console.log('err:', err);

            if(err){
                return false;
            }else {
                return true;
            }
        });
    }catch(e){
        console.log(e.stack)
    }
};

// var mysql = cmysql.createConnection({
//     host: "183.91.11.54",
//     user: "root",
//     password: "CMCts.992020",
//     port: "3306",
//     database: "suitecrm"
// });
  
// mysql.connect(function(err) {
//     if (err) throw err;
//     console.log("Connected!");
// });

module.exports = {
    redis,
    pgsql,
    // mysql
}
