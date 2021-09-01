exports.SCHEDULE_JOB = "*/2 * * * *";
exports.SCHEDULE_JOB_SF = "*/2 * * * *";
exports.SCHEDULE_UPDATE_FAILED = "*/59 * * * *";

const DEFAULT_NUM_RECORD = 5000;
const DEFAULT_TOTAL_RECORD = 50000;

exports.jobs = [
	{ 
		"object": "Batch__c", "operation": "upsert", "merchant": "BCCP"
	},
	{ 
		"object": "Package__c", "operation": "upsert", "merchant": "BCCP"
	},
	// { 
	// 	"object": "Item__c", "operation": "upsert", "merchant": "BCCP"
	// },
	{ 
		"object": "Receipt__c", "operation": "upsert", "merchant": "BCCP"
	},
	{ 
		"object": "Added_Value_in_Package__c", "operation": "upsert", "merchant": "BCCP"
	}
];

exports.jobs_sf = [
	{ 
		"object": "Order", "operation": "upsert", "merchant": "BCCP", "step": 0,
		"totalRecord": DEFAULT_TOTAL_RECORD, "numRecord": DEFAULT_NUM_RECORD, "externalIdFieldName": "SalesOrderNumber__c"
	},
	{ 
		"object": "Batch__c", "operation": "upsert", "merchant": "BCCP", "step": 1,
		"totalRecord": DEFAULT_TOTAL_RECORD, "numRecord": DEFAULT_NUM_RECORD, "externalIdFieldName": "Batch_Number__c",
		objectRef: 'bccp.order', keyRef: 'SalesOrderNumber__c', whereJoin: "CONCAT ('B', first.value ->> 'Batch_Number__c')"
	},
	{ 
		"object": "Package__c", "operation": "upsert", "merchant": "BCCP", "step": 1,
		"totalRecord": DEFAULT_TOTAL_RECORD, "numRecord": DEFAULT_NUM_RECORD, "externalIdFieldName": "Package_Number__c",
		objectRef: 'bccp.order', keyRef: 'SalesOrderNumber__c', whereJoin: "CONCAT ('P', first.value ->> 'Package_Number__c')"
	},
	// { 
	// 	"object": "Item__c", "operation": "upsert", "merchant": "BCCP", "step": 1,
	// 	"totalRecord": DEFAULT_TOTAL_RECORD, "numRecord": DEFAULT_NUM_RECORD, "externalIdFieldName": "External_Item_Id__c",
	// 	objectRef: 'bccp.package__c', keyRef: 'Package_Number__c', whereJoin: "first.value ->> 'Package_Number__c'"
	// },
	{ 
		"object": "Receipt__c", "operation": "upsert", "merchant": "BCCP", "step": 1,
		"totalRecord": DEFAULT_TOTAL_RECORD, "numRecord": DEFAULT_NUM_RECORD, "externalIdFieldName": "External_Receipt_Id__c",
		objectRef: 'bccp.package__c', keyRef: 'Package_Number__c', whereJoin: "first.value ->> 'Package_Number__c'"
	},
	{ 
		"object": "Added_Value_in_Package__c", "operation": "upsert", "merchant": "BCCP", "step": 1,
		"totalRecord": DEFAULT_TOTAL_RECORD, "numRecord": DEFAULT_NUM_RECORD, "externalIdFieldName": "External_AVP_Id__c",
		objectRef: 'bccp.package__c', keyRef: 'Package_Number__c', whereJoin: "first.value ->> 'Package_Number__c'"
	}
];