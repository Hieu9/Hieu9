const baseRepository = require('../../../services/repository'),
	response = require('../../../libs/response'),
	statusCode = require('../../../consts/statusCode'),
    consts = require('../../../consts'),
    {redis,pgsql,query} = require('../../../libs/db');

var instance_url = 'https://ap4alex-dev-ed.my.salesforce.com';

exports.getList = async (req, res, next) => {
    try{
        let limit = req.query.limit?'LIMIT '+req.query.limit:'';
        let offset = req.query.offset?'OFFSET '+req.query.offset:'';
        let where = `WHERE merchant = '${req.body.from__c}'`;
        let sql = `SELECT pid as id, operation, object, created_date, api_version, content_type, state, job_id as gw_job_id, sf_error, number_records_processed, number_records_failed  FROM ${process.env.PG_SCHEMA}.gw_jobs ${where} ORDER BY created_at DESC ${limit} ${offset}`;
        let data = await pgsql.query(sql);
        return response.success(req, res, data.rows);
    }catch(e){
        return response.fail(req, res, {
            message: e + '',
            errorCode: statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
}

exports.successfulResults = async (req, res, next) => {
    try{
        let jobId = req.params.jobId;
        let url = `${req.user.instance_url}/services/data/v46.0/jobs/ingest/${jobId}/successfulResults/`;
        let data = await baseRepository.find(url, req);
        res.set('Content-Type', 'text/plain');
        return res.send(data.body).end();
    }catch(e){
        return response.fail(req, res, {
            message: e + '',
            errorCode: statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
}

exports.failedResults = async (req, res, next) => {
    try{
        let jobId = req.params.jobId;
        let url = `${req.user.instance_url}/services/data/v46.0/jobs/ingest/${jobId}/failedResults/`;
        let data = await baseRepository.find(url, req);
        res.set('Content-Type', 'text/plain');
        return res.send(data.body).end();
    }catch(e){
        return response.fail(req, res, {
            message: e + '',
            errorCode: statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
}

exports.getIngest = async (req, res, next) => {
    let url = `${instance_url}/services/data/v46.0/jobs/ingest`;
    let data = await baseRepository.find(url, req);
    if(data.statusCode != statusCode.SUCCESS)
        return response.fail(req, res, data.body, data.statusCode);
    return response.success(req, res, data.body, data.statusCode);
}

exports.postIngest = async (req, res, next) => {
	let url = `${instance_url}/services/data/v46.0/jobs/ingest`;
    let object = req.body.object || 'Performance__c';
    let operation = req.body.operation || 'insert';
    let params = {
        object,
        contentType: "CSV",
        operation,
        lineEnding: "CRLF"
    };
    let data = await baseRepository.create(url, req);
    if(data.statusCode != statusCode.SUCCESS)
        return response.fail(req, res, data.body, data.statusCode);
    return response.success(req, res, data.body.data, data.statusCode);
}

exports.putBatches = async (req, res, next) => {
    let jobId = req.params.jobId;
    let url = `${instance_url}/services/data/v46.0/jobs/ingest/${jobId}/batches`;
    let data = await baseRepository.put(url, req.body, req);
    if(data.statusCode != statusCode.SUCCESS)
        return response.fail(req, res, data.body, data.statusCode);
    return response.success(req, res, data.body.data, data.statusCode);
}

exports.getIngestDetail = async (req, res, next) => {
    let jobId = req.params.jobId;
    let url = `${instance_url}/services/data/v46.0/jobs/ingest/${jobId}`;
    let data = await baseRepository.find(url, req);
    if(data.statusCode != statusCode.SUCCESS)
        return response.fail(req, res, data.body, data.statusCode);
    return response.success(req, res, data.body.data, data.statusCode);
}

exports.patchIngestDetail = async (req, res, next) => {
    let jobId = req.params.jobId;
    let url = `${instance_url}/services/data/v46.0/jobs/ingest/${jobId}`;
    let data = await baseRepository.update(url, req.body, req);
    if(data.statusCode != statusCode.SUCCESS)
        return response.fail(req, res, data.body, data.statusCode);
    return response.success(req, res, data.body.data, data.statusCode);
}