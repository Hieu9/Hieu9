const response = require('../../../libs/response'),
	joi = require('@hapi/joi'),
    stream = require('stream'),
    statusCode = require('../../../consts/statusCode'),
    baseRepository = require('../../../services/repository'),
    fs = require('fs')
    path = require('path');
// detail
exports.download = async (req, res, next) => {
    let contentDocId = req.params.id;
    try {
        let pattern_id = new RegExp('^[A-Za-z0-9]{15}(?:[A-Za-z0-9]{3})?$','mi');
        if(pattern_id.test(contentDocId)){
            let url = process.env.INSTANCE_URL + '/services/apexrest/link-document?ContentDocId=' + contentDocId;
            let data = await baseRepository.find(url,req);
            var fileContents = Buffer.from(data.body.version_data, "base64");
            var readStream = new stream.PassThrough();
            readStream.end(fileContents);
            data.body.file_name = data.body.file_name.replace(' ', '_');
            res.set('Content-disposition', `attachment; filename=${data.body.file_name}`);
            // res.set('Content-Type', 'text/plain');
            readStream.pipe(res);
        }else {
            return response.fail(req, res, {}, 404);
        }
    }catch (e) {
        console.log(e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};

exports.content = async (req, res, next) => {
    let contentDocId = req.params.id;
    try {
        let pattern_id = new RegExp('^[A-Za-z0-9]{15}(?:[A-Za-z0-9]{3})?$','mi');
        if(pattern_id.test(contentDocId)){
            let url = process.env.INSTANCE_URL + '/services/apexrest/link-document?ContentDocId=' + contentDocId;
            let data = await baseRepository.find(url,req);
            if(data.statusCode != statusCode.SUCCESS)
                return response.fail(req, res, data.body, data.statusCode);
            return response.success(req, res, data.body, data.statusCode);
        }else {
            return response.fail(req, res, {}, 404);
        }
    }catch (e) {
        console.log(e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};

exports.attachment = async (req, res, next) => {
    let contentDocId = req.params.id;
    try {
        let pattern_id = new RegExp('^[A-Za-z0-9]{15}(?:[A-Za-z0-9]{3})?$','mi');
        if(pattern_id.test(contentDocId)){
            let orderBy = req.query.orderBy?req.query.orderBy:'CreatedDate DESC NULLS FIRST';
            let condition = req.query.q?req.query.q:'';
            let data = await baseRepository.query(req,'Attachment','BodyLength,ContentType,CreatedById,CreatedDate,Description,Id,IsDeleted,IsPrivate,LastModifiedById,LastModifiedDate,Name,OwnerId,ParentId', '', condition, orderBy);
            if(data.statusCode != statusCode.SUCCESS)
                return response.fail(req, res, data.body, data.statusCode);
            return response.success(req, res, data.body, data.statusCode);
        }else {
            return response.fail(req, res, {}, 404);
        }
    }catch (e) {
        console.log(e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};

exports.attachmentBody = async (req, res, next) => {
    let id = req.params.id;
    try {
        let pattern_id = new RegExp('^[A-Za-z0-9]{15}(?:[A-Za-z0-9]{3})?$','mi');
        if(pattern_id.test(id)){
            let url = `${req.user.instance_url}/services/data/${req.query.ver}/sobjects/Attachment/${id}/Body`;
            let data = await baseRepository.find(url, req);
            if(data.statusCode != statusCode.SUCCESS)
                return response.fail(req, res, data.body, data.statusCode);
            return response.success(req, res, data.body, data.statusCode);
        }else {
            return response.fail(req, res, {}, 404);
        }
    }catch (e) {
        console.log(e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};

exports.uploadAttachment = async (req, res, next) => {
    try {
        let url = process.env.INSTANCE_URL + '/services/data/'+req.query.ver+'/sobjects/Attachment';
        let obj = await baseRepository.uploadFiles(url, req);
        if(obj.statusCode != statusCode.POST_SUCCESS)
            return response.fail(req, res, obj.body, obj.statusCode);
        return response.success(req, res, obj.body, obj.statusCode);
    }catch (e) {
        console.log(e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};

exports.uploadFile = async (req, res, next) => {
    try {
        if(req.body.FirstPublishLocationId == undefined && !req.body.FirstPublishLocationId){
            return response.fail(req, res, {
                message: 'FirstPublishLocationId is require',
                errorCode: statusCode.INVALID_PARAMS
            }, statusCode.INVALID_PARAMS);
        }
        let url = process.env.INSTANCE_URL + '/services/data/'+req.query.ver+'/sobjects/ContentVersion';
        let file = req.file;
        var bitmap = fs.readFileSync(file.path);
        let base64File = Buffer.from(bitmap).toString('base64');

        let params = {
            Description: req.body.Description?req.body.Description:null,
            VersionData: base64File,
            FirstPublishLocationId: req.body.FirstPublishLocationId,
            PathOnClient: file.originalname,
            Title: file.originalname.split('.').slice(0, -1).join('.')
        }
        let obj = await baseRepository.create(url, params, req);
        if(obj.statusCode != statusCode.POST_SUCCESS)
            return response.fail(req, res, obj.body, obj.statusCode);
        return response.success(req, res, obj.body, obj.statusCode);
    }catch (e) {
        console.log(e);
        return response.fail(req, res, {
            message: e + '',
            errorCode: e.name?e.name:statusCode.INVALID_PARAMS
        }, statusCode.INVALID_PARAMS);
    }
};