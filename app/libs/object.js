const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const Joi = require('@hapi/joi'),
    ignore_fields = require('../configs/ignore_fields'),
    ignore_validate = require('../configs/ignore_validate'),
    ignore_required_validate = require('../configs/ignore_required_validate');
var ignore_fields_val = _.mapKeys(ignore_fields, function (v, k) { return k.toLowerCase(); });
var ignore_validate_val = _.mapKeys(ignore_validate, function (v, k) { return k.toLowerCase(); });
var ignore_required_validate_val = _.mapKeys(ignore_required_validate, function (v, k) { return k.toLowerCase().trim(); });
module.exports = {
    funcMapFields: (dataRes, mapFields) => {
        try{
            let datas = [];
            // lấy ra các field trong field map
            for(let i = 0; i<dataRes.length; i++){
                let jsonValue = dataRes[i];
                _.each(jsonValue, function(value, key) {
                    key = mapFields[key] || key;
                    jsonValue[key] = value;
                });
                let item = _.pick(jsonValue, Object.keys(mapFields)); // oposite omit
                datas.push(item);
            }
        
            // lấy ra các field # trong field map
            let dataDone = [];
            for(let i = 0; i<datas.length; i++){
                let jsonValue = datas[i];
                _.each(jsonValue, function(value, key) {
                    key = mapFields[key] || key;
                    jsonValue[key] = value;
                });
                //console.log(Object.values(mapFields));
                let it = _.pick(jsonValue, Object.values(mapFields));
                dataDone.push(it);
            }
            return dataDone;
        }catch(e){
            console.log(e.stack);
        }
    },
    keyToLower: (object) => {
        var key, keys = Object.keys(object);
        var n = keys.length;
        var newobj = {};
        while (n--) {
            key = keys[n];
            newobj[key.toLowerCase()] = object[key];
        }
        return newobj;
    },
    cacheObjects: async (object) => {
        let data = {};
        let file = path.join('./', 'caches', `${object.toLowerCase()}.json`);
        let objects = await fs.readFileSync(file);
            objects = JSON.parse(objects);
        //let obj = objects.filter((item, index) => Object.keys(item)[0] == object);
        return objects;
    },
    cacheFields: async (object='Account') => {
        let obj = await module.exports.cacheObjects(object);
        let fields = obj.fields.map(function(item){
            return item.name;
        });
        let fields_ignore = ignore_fields_val[object.toLowerCase()];
        if(!_.isUndefined(fields_ignore)){
            fields = _.differenceWith(fields,fields_ignore,!_.isEqual);
        }
        // console.log(ignore_fields_val);
        return fields;
    },
    compareKeys : (a, b) => {
        var bKeys = Object.keys(b).sort();
        bKeys = bKeys.map(x=>{
            return x.toLowerCase();
        });
        a = a.map(x => {
            return x.toLowerCase();
        });

        var mKeys = _.union(a,bKeys).sort();
        var rKeys = _.differenceWith(mKeys,a,_.isEqual);
        return rKeys;
    },
    fieldsObject : async (objectReq) => {
        let objectSF = await module.exports.cacheObjects(objectReq);
        //<editor-fold desc="object reference">
        let object = objectSF.fields.filter(x => {
            return x.updateable == true;
        });

        let fields = object.map(function(item){
            let obj = {
                [item.name] : item.defaultValue
            };
            return obj;
        });

        let fields11 = object.map(function(item){
            return item.type;
        });
        // console.log('fields11: ',JSON.stringify([...new Set(fields11)]));
        var objectRef = [];
        object.forEach(x => {
            if(x.polymorphicForeignKey == false){
                x.referenceTo.forEach(i => {
                    objectRef.push({
                        ['object']: i,
                        ['relationshipName'] : x.relationshipName,
                        ['default']: x.defaultValue
                    });
                });
            }
        });
        objectRef = [...new Set(objectRef)];
        var refFields = [];
        if(objectRef.length > 0){
            await module.exports.asyncForEach(objectRef, async (item) => {
                var ref = await module.exports.cacheObjects(item['object']);
                ref.fields.forEach(f => {
                    if(f.idLookup == true) refFields.push({
                        [item['relationshipName'] + '.' + f.name] : f.defaultValue
                    });
                });
            });
        }
        var rFields = _.union(refFields, fields);
        rFields = [...new Set(rFields)];
        return rFields;
    },
    validateObject: async (objectSF, body) => {
        let objectBody = body;
        objectBody = _.mapKeys(objectBody, function (v, k) { return k.toLowerCase().trim(); });
        let objectReq = objectSF;
        //<editor-fold desc="ignore validate added object">
        let ignore = ignore_validate_val[objectReq.toLowerCase()];
        let objectAdd = {};
        let keysAdd = [];
        if(ignore!= undefined && ignore.length > 0){
            ignore.forEach(i => {
                if(!_.isUndefined(objectBody[i.toLowerCase()])) {
                    // objectAdd[i] = objectBody[i];
                    keysAdd.push(i);
                    delete objectBody[i.toLowerCase()];
                }
            })
        }
        _.mapKeys(body, function (v, k) {
            if(keysAdd.indexOf(k.toLowerCase()) >= 0){
                objectAdd[k] = body[k];
            }
        });
        //</editor-fold>
        let object = await module.exports.cacheObjects(objectReq);
        let rFields1 = await module.exports.fieldsObject(objectReq);
        let rFields = [];
        rFields1.forEach(x => {
            rFields.push(Object.keys(x)[0].toLowerCase().trim());
        });
        //<editor-fold desc="fields unnecessary">
        var rKeys = module.exports.compareKeys(rFields, objectBody);
        //</editor-fold>

        //<editor-fold desc="fields required">
        let fieldsRequired =  object.fields.filter(x => {
            return x.nillable == false && x.updateable == true && x.defaultedOnCreate == false
        });
        fieldsRequired = fieldsRequired.map(function (item) {
            return item.name.toLowerCase().trim();
        });
        let fieldsRequiredNecessary = [];

        let ignore_required = ignore_required_validate_val[objectReq.toLowerCase()];
        if(_.isArray(fieldsRequired) && fieldsRequired.length > 0){
            fieldsRequired.forEach(x => {
                if(_.isUndefined(objectBody[x]) && (_.isUndefined(ignore_required) || (!_.isUndefined() && _.indexOf(ignore_required,x) < 0))){
                    fieldsRequiredNecessary.push(x)
                }
            });
        }
        //</editor-fold>

        await module.exports.validateData(object,objectBody)

        if (_.isArray(rKeys) && rKeys.length == 0 && fieldsRequiredNecessary.length == 0) {
            //console.log(1,objectBody)

            objectBody = _.merge(objectBody,objectAdd);
            //console.log(2,objectAdd)
            return {
                'success': true,
                'body': objectBody
            }
        } else {
            let fieldsUnnecessary = rKeys;
            let bodyError = [
                {
                    results: {
                        'object': objectReq,
                        fieldsUnnecessary,
                        fieldsRequiredNecessary
                    }
                }
            ];
            return {
                'success': false,
                'body': bodyError
            }
        }
    },

    validateData: async (object, objeceBody) => {
        let fieldsValidate = await object.fields.map(function (item) {
            let type_field = '';
            switch (item.type) {
                case 'string':
                case 'picklist':
                case 'phone':
                case 'textarea':
                    type_field = 'string';
                    break;
                case 'email':
                    type_field = 'email';
                    break;
                case 'currency':
                case 'double':
                    type_field = 'double';
                    break;
                case 'int':
                    type_field = 'int';
                    break;
                case 'boolean':
                    type_field = 'boolean';
                    break;
                case 'id':
                    type_field = 'id';
                    break;
                case 'reference':
                    type_field = 'reference';
                    break;
                default:
                    type_field = 'string';
            }
            let obj = {
                'name': item.name.toLowerCase(),
                'type_field': type_field,
                'length_field': item.length,
                'precision': item.precision,
            };
            return obj;
        });
        let objectFieldValidate = {};
        fieldsValidate.forEach(x => {
            switch (x.type_field) {
                case "string":
                    objectFieldValidate[x.name] = Joi.string().allow('').allow(null);
                    if(x.length_field > 0) objectFieldValidate[x.name] = objectFieldValidate[x.name].max(x.length_field);
                    break;
                case "email":
                    objectFieldValidate[x.name] = Joi.string().email().allow('').allow(null);
                    if(x.length_field > 0) objectFieldValidate[x.name] = objectFieldValidate[x.name].max(x.length_field);
                    break;
                case "double":
                    objectFieldValidate[x.name] = Joi.number().allow('').allow(null);
                    if(x.precision > 0) objectFieldValidate[x.name] = objectFieldValidate[x.name].max(module.exports.generateMax(x.precision));
                    break;
                case "int":
                    objectFieldValidate[x.name] = Joi.number().allow('').allow(null);
                    if(x.precision > 0) objectFieldValidate[x.name] = objectFieldValidate[x.name].max(module.exports.generateMax(x.precision));
                    break;
                case "reference":
                case "id":
                    let pattern_id = new RegExp('^[A-Za-z0-9]{15}(?:[A-Za-z0-9]{3})?$','mi');
                    objectFieldValidate[x.name] = Joi.string().allow('').allow(null).pattern(pattern_id, 'id');
                    break;
                case "boolean":
                    objectFieldValidate[x.name] = Joi.boolean().allow('').allow(null);
                    break;
            }
        });
        //console.log(JSON.stringify(objectFieldValidate))
        const schJoi = Joi.object(objectFieldValidate).unknown(true);
        await schJoi.validateAsync(objeceBody);
    },

    generateMax: (n) => {
        let str = '';
        for (let i = 0;i < n; i++){
            str = str + 9;
        }
        return parseInt(str);
    },


    clean: (params) => {
        for(var key in params) {
            if(params[key] != null && (typeof params[key] == 'string' )) {
                //params[key] = params[key].replace(',', ';');
                params[key] = params[key].replace(/(\r\n|\n|\r)/gm,"");
            }
        }
        return params;
    },
    responseBodySuccess: (statusCode, body) => {
        if(!_.isArray(body) && !_.isObject(body)){
            body = {
                "content": body
            };
        }
        return body;
    },
    responseBodyFail: (statusCode, body) => {
        if(_.isArray(body)){
            if(body[0] != undefined){
                body = body[0];
            }
        }
        var bodyCustome = body;
        switch(statusCode) {
            case 503:
                bodyCustome = {
                    "message": body.message != undefined ? 'Error 503' : "Message from DB Error",
                    "errorCode": body.errorCode != undefined ? 503 : "DB_ERROR"
                };
                break;
            case 500:
                bodyCustome = {
                    "message": body.message != undefined ? 'Error 500' : "Invalid parameter value",
                    "errorCode": body.errorCode != undefined ? 500 : "UNKNOWN_EXCEPTION"
                };
                break;
            case 404:
                bodyCustome = {
                    "message": body.message != undefined ? body.message : "The requested resource does not exist",
                    "errorCode": body.errorCode != undefined ? body.errorCode : "NOT_FOUND"
                };
                break;
            case 403:
                bodyCustome = {
                    "message": body.message != undefined ? body.message : "The request has been refused",
                    "errorCode": body.errorCode != undefined ? body.errorCode : "REQUEST_LIMIT_EXCEEDED"
                };
                break;
            case 401:
                bodyCustome = {
                    "message": body.message != undefined ? body.message : "Session expired or invalid",
                    "errorCode": body.errorCode != undefined ? body.errorCode : "INVALID_SESSION_ID"
                };
                break;
            case 400:
                if(body.results != undefined){
                    bodyCustome = {
                        "message": body.message != undefined ? body.message : "Invalid parameter value",
                        "errorCode": body.errorCode != undefined ? body.errorCode : "Invalid_Params",
                        "results": body.results
                    };
                } else if (body.error != undefined && body.error_description != undefined){
                    bodyCustome = {
                        "message": body.error_description,
                        "errorCode": body.error
                    };
                } else {
                    bodyCustome = {
                        "message": body.message != undefined ? body.message : "Failure",
                        "errorCode": body.errorCode != undefined ? body.errorCode : "Invalid_Params"
                    };
                }                
                break;
            case 402:
                bodyCustome = {
                    "message": "Invalid username or password",
                    "errorCode": "Invalid_Login"
                };
                break;
            default:
                bodyCustome = {
                    "message": body.message != undefined ? body.message : "Invalid Code",
                    "errorCode": body.errorCode != undefined ? body.errorCode : statusCode
                };
                break;
        }
        return bodyCustome;
    },

    asyncForEach: async (array, callback) => {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    }
}