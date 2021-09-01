const baseRepository = require('../services/repository'),
    response = require('../libs/response'),
    statusCode = require('../consts/statusCode'),
    consts = require('../consts'),
    pgRepository = require('../services/pgRepository'),
    objectLibs = require('../libs/object'),
    Joi = require('@hapi/joi');

const object = 'Account';
// var fields = 'Id,Name,OwnerId,Owner.Name,Owner.Id,ParentId,Parent.Name,AnnualRevenue,TaxCode__c,Type,Industry,Phone,Mobile__c,Website,BillingAddress,ShippingAddress,Description,Customer_s_Service__c,Referent_account__c,Ownership,Post_Office__c,Post_Office__r.Id,Post_Office__r.Name,Post_Office_Name__c,Employee__r.Id,Employee__r.Employee_Code__c,Employee__r.Name,CreatedDate';
// var fields = 'AccountSource,AnnualRevenue,BillingAddress,BillingCity,BillingCountry,BillingGeocodeAccuracy,BillingLatitude,BillingLongitude,BillingPostalCode,BillingState,BillingStreet,BusinessClass__c,BusinessID__c,Ca_nh_n_T_ch_c__c,CreatedById,CreatedDate,CurrencyIsoCode,Customer_s_Service__c,Description,Email__c,Employee__c,External_Name__c,Facebook__c,from__c,Id,ID_he_thong_cu__c,Industry,IsDeleted,Jigsaw,JigsawCompanyId,LastActivityDate,LastModifiedById,LastModifiedDate,LastReferencedDate,LastViewedDate,MasterRecordId,Ma_dang_ki_kinh_doanh__c,Ma_khach_hang__c,Mobile__c,Name,Nga_y_tha_nh_l_p__c,NumberOfEmployees,OwnerId,OwnerPay__c,Ownership,ParentId,Phone,PhotoUrl,Post_Office_Name__c,Post_Office__c,ShippingAddress,ShippingCity,ShippingCountry,ShippingGeocodeAccuracy,ShippingLatitude,ShippingLongitude,ShippingPostalCode,ShippingState,ShippingStreet,SicDesc,So_tai_khoan_ngan_hang__c,Status__c,SystemModstamp,TaxCode__c,Ten_chu_tai_khoan__c,Ten_ngan_hang__c,Type,UUID__c,Website,Zalo__c';
const schema = process.env.PG_SCHEMA;
// list
exports.list = async (req, res, next) => {

};

