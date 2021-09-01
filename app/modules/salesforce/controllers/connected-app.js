const response = require('../../../libs/response'),

    statusCode = require('../../../consts/statusCode'),
    { pgsql } = require('../../../libs/db'),
    pgRepository = require('../../../services/pgRepository'),
    bcrypt = require('bcrypt-nodejs'),
    path = require('path');
// detail
const schema = process.env.PG_SCHEMA;
exports.addConnectedApp = async (req, res, next) => {
    try{
        let params = req.body;
        await pgsql.query('BEGIN');

        //<editor-fold desc="gen secret key">
        let salt = process.env.SALT;
        bcrypt.genSalt(salt, function(err, salt) {
        	bcrypt.hash(params.consumer_secret, salt, null,async function(err, hash) {
                if(!err){
        		    params.consumer_secret = hash;
                    let data = await pgRepository.create(schema,'gw_sessions','consumer_key,consumer_secret,created_at,name,url,auth', [
                        params.consumer_key,params.consumer_secret,Date.now(),params.name, params.url,params.auth
                    ]);
                    if(!data.success){
                        return response.fail(req, res, data, statusCode.PG_INVALID_PARAMS);
                    }
                    await pgsql.query('COMMIT');
                    return response.success(req, res, data, statusCode.SUCCESS);
                }else {
                    return response.fail(req, res, {}, statusCode.PG_INVALID_PARAMS, err);
                }
        	});
        });
        //</editor-fold>

    }catch(e){
        // rollback when error
        await pgsql.query('ROLLBACK');
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};