// var session = require('express-session');
const querystring = require('querystring'),
    statusCode = require('../consts/statusCode'),
    responseLibs = require('../libs/response'),
    configConst = require('../configs'),
    objectLibs = require('../libs/object'),
    _ = require('lodash'),
    {redis, pgsql} = require('../libs/db');

module.exports = async (req, res, next) => {
    try {
        let objectBody = req.body;
        objectBody = _.mapKeys(objectBody, function (v, k) { return k.toLowerCase().trim(); });
        let objectReq = req.originalUrl.replace(/\?.*$/, '').split('/')[2];
        let rFields = await objectLibs.fieldsObject(objectReq);
        rFields.map(x => {
            return x.name;
        });
        rFields = [...new Set(rFields)];
        // tạo Object với key Lower
        let objLower = _.mapKeys(objectBody, function (v, k) { return k.toLowerCase(); });
        await rFields.forEach(rF => {
            // check neu key origin # key lower thi add
            if (!_.has(objLower, _.keys(rF)[0].toLowerCase())) {
                objectBody[Object.keys(rF)] = Object.values(rF)[0];
            }
        });
        //</editor-fold>
        req.body = objectBody;
        // console.log(JSON.stringify(objectBody))
        next();
    } catch (error) {
        console.log(error);
        return responseLibs.fail(req, res, {}, statusCode.INVALID_PARAMS);
    }
};

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}