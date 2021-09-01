const response = require('../libs/response');

// list
exports.list = (req, res, next) => {
    return response.successPaginate(req, res, {});
}

exports.detail = (req, res, next) => {
    return response.success(req, res, {});
}

// create
exports.create = (req, res, next) => {
    return response.success(req, res, {});
}

// put
exports.update = (req, res, next) => {
    return response.success(req, res, {});
}

// delete
exports.delete = (req, res, next) => {
    return response.success(req, res, {});
}