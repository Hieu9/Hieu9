exports.SCHEDULE_JOB_SF = "*/1 * * * *";
exports.SCHEDULE_UPDATE_FAILED = "*/59 * * * *";

const DEFAULT_NUM_RECORD = 5000;
const DEFAULT_TOTAL_RECORD = 50000;


exports.jobs_sf = [
	{ 
		"object": "Order", "operation": "upsert", "merchant": "PAYPOST", "step": 0,
		"totalRecord": DEFAULT_TOTAL_RECORD, "numRecord": DEFAULT_NUM_RECORD, "externalIdFieldName": "SalesOrderNumber__c"
	},
	{ 
		"object": "Account", "operation": "upsert", "merchant": "PAYPOST", "step": 0,
		"totalRecord": DEFAULT_TOTAL_RECORD, "numRecord": DEFAULT_NUM_RECORD, "externalIdFieldName": "Ma_khach_hang__c"
	},
	{ 
		"object": "Receipt__c", "operation": "upsert", "merchant": "PAYPOST", "step": 0,
		"totalRecord": DEFAULT_TOTAL_RECORD, "numRecord": DEFAULT_NUM_RECORD, "externalIdFieldName": "External_Receipt_Id__c"
	}
];