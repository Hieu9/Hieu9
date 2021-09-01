const response = require('../../../libs/response'),
    { mysql } = require('../../../libs/db'),
    uuidv1 = require('uuid/v1');

exports.getAccountList = async (req, res, next) => {
    // select data
    var query = "SELECT * FROM accounts limit 100";
    mysql.query(query, function (err, result) {
        if (err) throw err;
        console.log(result);
        
        return response.success(req, res, result);
    });
}

exports.createLead = async (req, res, next) => {
    let dataBody = req.body;
    let id = dataBody.id;
    let last_name = dataBody.last_name;
    let first_name = dataBody.first_name;
    let status = dataBody.status;
    let phone_work = dataBody.phone_work;

    var query = `INSERT INTO suitecrm.leads(id, last_name, first_name, status, phone_work) VALUES (${id}, ${last_name}, ${first_name}, ${status}, ${phone_work});`
    mysql.query(query, function (err, result) {
        if (err) throw err;
        console.log(result);
        return response.success(req, res, result);
    });
}