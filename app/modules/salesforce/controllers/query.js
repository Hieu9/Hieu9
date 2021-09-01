const baseRepository = require('../../../services/repository'),
	response = require('../../../libs/response'),
	statusCode = require('../../../consts/statusCode'),
    consts = require('../../../consts'),
    Joi = require('@hapi/joi');

exports.getQueryId = async (req, res, next) => {
    let id = req.params.id;
    let url = `${req.user.instance_url}/services/data/${req.query.ver}/query/${id}`;
    let data = await baseRepository.find(url, req);
    if(data.statusCode != statusCode.SUCCESS)
        return response.fail(req, res, data.body, data.statusCode);
    //nextRecordsUrl
    if(data.body.nextRecordsUrl){
        let arrUrl = data.body.nextRecordsUrl.split(/[\s/]+/);
        data.body.nextRecordsUrl = `/query/${arrUrl[arrUrl.length-1]}`;
    };
    //get files
    await baseRepository.getFiles(data.body.records, req.user.instance_url, req.user.token);
    return response.success(req, res, data.body, data.statusCode);
}

exports.getQuery = async (req, res, next) => {
    let q = req.query.q;
    let url = `${req.user.instance_url}/services/data/${req.query.ver}/query?q=${q}`;
    let data = await baseRepository.find(url, req);
    if(data.statusCode != statusCode.SUCCESS)
        return response.fail(req, res, data.body, data.statusCode);
    return response.success(req, res, data.body, data.statusCode);
}

exports.getStatistic = async (req, res, next) => {
	let q = req.query.q;
	if(q == null || q == undefined){
		q = 'Lead:CreatedDate=THIS_MONTH,Contact:CreatedDate=THIS_MONTH,Account:CreatedDate=THIS_MONTH,Opportunity:CreatedDate=THIS_MONTH';
	}
    let url = `${req.user.instance_url}/services/apexrest/Dashboard/statistic?q=${q}`;
    let data = await baseRepository.find(url, req);
    if(data.statusCode != statusCode.SUCCESS)
        return response.fail(req, res, data.body, data.statusCode);
    return response.success(req, res, data.body.data, data.statusCode);
}

exports.listIds = async(req, res, next) => {
    try{
        let params = req.body;
        let fields = params.Fields?params.Fields:'Id, UUID__c';
        let externalId = params.ExternalId;
        let limit = consts.LIMITMAX;
        let offset = consts.OFFSET;
        // validate params
        const schJoi = Joi.object({ 
            Object: Joi.string().required(),
            ExternalId: Joi.string().required(),
            Ids: Joi.array().required()
        }).unknown(true);
        await schJoi.validateAsync(params);

        let arrParams = []
        for(let i = 0; i < params.Ids.length; i++){
            arrParams.push(`'${params.Ids[i]}'`);
        }
        let data = await baseRepository.query(req, params.Object, fields, `${externalId} IN (${arrParams.join(',')})`, '', limit, offset);
        if(data.statusCode != statusCode.SUCCESS)
            return response.fail(req, res, data.body, data.statusCode);
        return response.success(req, res, data.body, data.statusCode);
    }catch(e){
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
}