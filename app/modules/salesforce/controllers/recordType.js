const baseRepository = require('../../../services/repository'),
	response = require('../../../libs/response'),
	statusCode = require('../../../consts/statusCode'),
    consts = require('../../../consts');

const object = 'RecordType';
var fields = 'BusinessProcessId,CreatedById,CreatedDate,Description,DeveloperName,Id,IsActive,LastModifiedById,LastModifiedDate,Name,NamespacePrefix,SobjectType,SystemModstamp';

// list
exports.list = async (req, res, next) => {
    let field = req.query.f?req.query.f:fields;
    let limit = req.query.limit?req.query.limit:consts.LIMIT;
    let offset = req.query.offset?req.query.offset:consts.OFFSET;
    let orderBy = req.query.orderBy?req.query.orderBy:'CreatedDate DESC NULLS FIRST';
    let condition = req.query.q?req.query.q:'';
    
    let obj = await baseRepository.query(req, object, field, condition, orderBy, limit, offset);

    if(obj.statusCode != statusCode.SUCCESS)
        return response.fail(req, res, obj.body, obj.statusCode);

    let counts = await baseRepository.query(req,object,'count()',condition);
    if(counts.statusCode != statusCode.SUCCESS)
        return response.fail(req, res, counts.body, counts.statusCode);

    return response.successPaginate(req, res, obj.body.records, limit, offset, counts.body.totalSize);
}
// detail
exports.detail = async (req, res, next) => {
	const id = req.params.id;
    let condition = `Id='${id}'`;

    let result = await baseRepository.detail(req, object, fields, condition);

    if(result.statusCode != statusCode.SUCCESS)
        return response.fail(req, res, result.body, result.statusCode);
    let data = result.body.records[0];
    if(data == undefined || data == ''){
        data = {
          "errorCode" : "NOT_FOUND",
          "message" : "The requested resource does not exist"
        };
        result.statusCode = statusCode.INVALID_PARAMS;
    }
	return response.success(req, res, data, result.statusCode);
}