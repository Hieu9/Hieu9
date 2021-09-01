const baseRepository = require('../services/repository'),
	response = require('../libs/response'),
    stringLib = require('../libs/string'),
	statusCode = require('../consts/statusCode'),
    _ = require('lodash'),
    consts = require('../consts'),
    pgRepository = require('../services/pgRepository'),
    validator = require('validator'),
    objectLibs = require('../libs/object');

var fields = 'Body,CreatedById,CreatedDate,Id,IsDeleted,IsPrivate,LastModifiedById,LastModifiedDate,OwnerId,ParentId,SystemModstamp,Title';
// count
exports.count = async (req, res, next) => {
    let condition = `LinkedEntityId = '${req.query.objId}'`;
    let counts = await baseRepository.query(req,'ContentDocumentLink','count()',condition);
    if(counts.statusCode != statusCode.SUCCESS)
        return response.fail(req, res, counts.body, counts.statusCode);
    return response.success(req, res, counts.body);
}
// list
exports.list = async (req, res, next) => {
    try {
        let limit = req.query.limit?req.query.limit:10;
        let offset = req.query.offset?req.query.offset:0;

        let condition = `LinkedEntityId='${req.query.objId}'`;
        let listContentDocumentLink = await baseRepository.query(req, 'ContentDocumentLink', 'Id,LinkedEntityId,ContentDocumentId,IsDeleted,SystemModstamp,ShareType,Visibility', condition, '', limit, offset);

        if(listContentDocumentLink.statusCode != statusCode.SUCCESS)
            return response.fail(req, res, listContentDocumentLink.body, listContentDocumentLink.statusCode);
        // process content note
        if(!_.isEmpty(listContentDocumentLink.body.records)){
            var listContentDocumentNoteId = [];
            _.forEach(listContentDocumentLink.body.records, function(element, i) {
                listContentDocumentNoteId.push(element.ContentDocumentId);
            });
            listContentDocumentNoteId = listContentDocumentNoteId.join(',');
            let fields = 'Id,Title,CreatedById,CreatedDate,FileType,TextPreview,ContentSize,IsDeleted,OwnerId,IsReadOnly,Content';
            let url = req.user.instance_url + '/services/data/'+req.query.ver+'/composite/sobjects/ContentNote?ids='+listContentDocumentNoteId+"&fields="+fields;
            let listContentNote = await baseRepository.find(url, req);
            if(listContentNote.statusCode != statusCode.SUCCESS)
                return response.fail(req, res, listContentNote.body, listContentNote.statusCode);
            return response.successPaginate(req, res, listContentNote.body, limit, offset);
        }
        return response.successPaginate(req, res, [], limit, offset);
    }catch (e) {
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};

exports.detail = async (req, res, next) => {
    try {
        const id = req.params.id;
        let uri = req.user.instance_url+'/services/data/'+req.query.ver+'/sobjects/ContentNote/'+id;
        let data = await baseRepository.findFirst(uri, req);
        if(data.statusCode != statusCode.SUCCESS)
            return response.fail(req, res, data.body, data.statusCode);
        const contentNote = data.body;

        return response.success(req, res, contentNote, data.statusCode);
    }catch (e) {
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};

exports.content = async (req, res, next) => {
    try {
        const id = req.params.id;
        let url = `${req.user.instance_url}/services/data/${req.query.ver}/sobjects/ContentNote/${id}/Content`;

        let data = await baseRepository.findFirst(url, req);

        if(data.statusCode != statusCode.SUCCESS)
            return response.fail(req, res, data.body, data.statusCode);
        return response.success(req, res, data.body, data.statusCode);
    }catch (e) {
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};

// create
exports.create = async (req, res, next) => {
    try {
        let object = 'ContentNote';
        let url = `${req.user.instance_url}/services/data/${req.query.ver}/sobjects/${object}`;
        if(req.body.Content != undefined){
            req.body.Content = stringLib.base64Data(req.body.Content);
        }
        let contentNote = await baseRepository.create(url, req.body, req);
        if(contentNote.statusCode != statusCode.POST_SUCCESS){
            return response.fail(req, res, contentNote.body, contentNote.statusCode);
        }
        let contentDocument = {
            "ContentDocumentId": contentNote.body.id,
            "LinkedEntityId": req.query.objId,
            "ShareType":"V"
        }
        let uriContentDL = req.user.instance_url + '/services/data/'+req.query.ver+'/sobjects/ContentDocumentLink/';
        let resCDL = await baseRepository.create(uriContentDL, contentDocument, req);
        return response.success(req, res, contentNote.body, contentNote.statusCode);
    }catch (e) {
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};

exports.batch = async (req, res, next) => {
    try {
        let params = req.body;
        let object = 'ContentNote';
        let data = await baseRepository.tree(object, params, req);
        if(data.statusCode != statusCode.POST_SUCCESS)
            return response.fail(req, res, data.body, data.statusCode);
        return response.success(req, res, data.body, statusCode.SUCCESS);
    }catch (e) {
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};

exports.createMultipleCDL = async (req, res, next) => {
    try {
        let oIds = req.query.oIds;
        var type = "ContentDocumentLink";
        var shareType = "V";
        arrayOIds = oIds.split(",");
        var listCDL = [];
        _.forEach(arrayOIds, function(value, i) {
            listCDL.push({
                "attributes": {"type" : type, "referenceId" : "ref"+i},
                "ContentDocumentId": req.query.id,
                "LinkedEntityId": value,
                "ShareType": shareType
            });
        });
        let contentDocumentLink = { "records": listCDL };
        let urlContentDL = req.user.instance_url + '/services/data/'+req.query.ver+'/composite/tree/ContentDocumentLink/';
        let restCDL = await baseRepository.create(urlContentDL, contentDocumentLink, req);
        if(restCDL.statusCode != statusCode.POST_SUCCESS){
            return response.fail(req, res, restCDL.body, restCDL.statusCode);
        }
        return response.success(req, res, restCDL.body, restCDL.statusCode);
    } catch (err) {
        await response.logRedis(req,e);
        next(new Error(err.toString()));
    }
}

// put
exports.update = async (req, res, next) => {
    try {
        var params = req.body;
        let url =  req.user.instance_url + '/services/data/'+req.query.ver+'/sobjects/ContentNote/'+req.params.id;

        if(params.Content != undefined){
            params.Content = stringLib.base64Data(params.Content);
        }
        let contentNote = await baseRepository.update(url, params, req);
        if(contentNote.statusCode != statusCode.UPDATE_SUCCESS){
            return response.fail(req, res, contentNote.body, contentNote.statusCode);
        }
        return response.success(req, res, {
            "id": req.params.id,
            "success": true,
            "errors": []
        }, 200);
    } catch (err) {
        await response.logRedis(req,e);
        next(new Error(err.toString()));
    }
}
// delete
exports.delete = async (req, res, next) => {
    try {
        let url = `${req.user.instance_url}/services/data/${req.query.ver}/sobjects/ContentNote/${req.params.id}`;
        let contentNote = await baseRepository.delete(url, req);
        if(data.statusCode != statusCode.DELETE_SUCCESS)
            return response.fail(req, res, data.body, data.statusCode);
        return response.success(req, res, {
            "id": req.params.id,
            "success": true,
            "errors": []
        }, 200);
    }catch (e) {
        await response.logRedis(req,e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};
