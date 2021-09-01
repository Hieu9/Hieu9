const general = ['IsDeleted','SystemModstamp','LastReferencedDate','attributes'];

const Sales_Order__c = [...new Set(['SystemModstamp'].concat(general))];
const Shipment__c = [...new Set(['SystemModstamp'].concat(general))];
const Account = [...new Set(['BillingStreet','BillingCity','BillingState','BillingPostalCode',
	'BillingCountry','BillingLatitude','BillingLongitude','BillingGeocodeAccuracy','BillingAddress',
	'ShippingStreet','ShippingCity','ShippingState','ShippingPostalCode','ShippingCountry','ShippingLatitude',
	'ShippingLongitude','ShippingGeocodeAccuracy','ShippingAddress','Jigsaw','JigsawCompanyId','SicDesc',
	'MasterRecordId','Rating','AccountSource'
].concat(general))];

const Case = [...new Set(['SystemModstamp'].concat(general))];

const Contact = [...new Set(['MasterRecordId','Jigsaw', 'JigsawContactId'].concat(general))];

const Contract = [...new Set(['BillingStreet','BillingCity','BillingState','BillingPostalCode',
	'BillingCountry','BillingLatitude','BillingLongitude','BillingGeocodeAccuracy','BillingAddress',
	'ShippingStreet','ShippingCity','ShippingState','ShippingPostalCode','ShippingCountry','ShippingLatitude',
	'ShippingLongitude','ShippingGeocodeAccuracy','ShippingAddress','Pricebook2Id','OwnerExpirationNotice'
].concat(general))];

const Employee__c = [...new Set(['CurrencyIsoCode'].concat(general))];

const Batch__c = [...new Set(['SystemModstamp'].concat(general))];

const Item__c = [...new Set(['SystemModstamp', 'CurrencyIsoCode'].concat(general))];

const Receipt__c = [...new Set(['SystemModstamp'].concat(general))];

const Package__c = [...new Set(['SystemModstamp'].concat(general))];

const Status__c = [...new Set(['SystemModstamp'].concat(general))];
const Refered_Status__c = [...new Set(['SystemModstamp','OwnerId','CurrencyIsoCode','LastModifiedById','LastViewedDate'].concat(general))];

const Lead = [...new Set(['MasterRecordId','Jigsaw', 'JigsawContactId'].concat(general))];

module.exports = {
	Account,Batch__c,Contact,Contract,Sales_Order__c,Case,Employee__c,Shipment__c,Lead,Item__c,Receipt__c,Package__c,Status__c,Refered_Status__c
};
