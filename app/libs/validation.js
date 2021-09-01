const baseRepository = require('../services/repository'),
    statusCode = require('../consts/statusCode');

module.exports = {
    checkLookup: async function(req, object, id){
        let data = await baseRepository.query(req, object, 'Id', `Id='${id}'`);
        return data;
    }
}