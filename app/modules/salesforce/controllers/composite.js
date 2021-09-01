const baseRepository = require('../../../services/repository'),
	response = require('../../../libs/response'),
	statusCode = require('../../../consts/statusCode'),
    consts = require('../../../consts');

// list
exports.batch = async (req, res, next) => {
    let data = [];
    return response.success(req, res, data);
}