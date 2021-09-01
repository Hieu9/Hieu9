exports.SCHEDULE_JOB = "*/5 * * * *"; // job run batch
exports.SCHEDULE_LOGS = "00 10 00 * * 1-7"; // job save log to db
// exports.SCHEDULE_LOGS = "*/1 * * * *"; // job save log to db
exports.SCHEDULE_PULL_CASE = "*/5 * * * *";
exports.SCHEDULE_UPDATE_FAILED = "*/59 * * * *";
exports.DELAY_JOBS_RESULT = 1*60*1000;
const DEFAULT_NUM_RECORD = 5000;
const DEFAULT_TOTAL_RECORD = 50000;

// MPITS MyVNPost Bccp PackAndSend SalePortal GateWay

exports.jobs = [
	{ "object": "Account", "operation": "insert", "step": 1, 
		"totalRecord": DEFAULT_TOTAL_RECORD, "numRecord": DEFAULT_NUM_RECORD, 
		"merchant": ['myvnpost','gateway','suitecrm'] 
	},
	{ "object": "Account", "operation": "update", "step": 1, 
		"totalRecord": DEFAULT_TOTAL_RECORD, "numRecord": DEFAULT_NUM_RECORD, 
		"merchant": ['myvnpost','gateway','suitecrm'] 
	},
	{ "object": "Case", "operation": "insert", "step": 1, 
		"totalRecord": DEFAULT_TOTAL_RECORD, "numRecord": DEFAULT_NUM_RECORD, "merchant": ['gateway','mpits','myvnpost','ctel','vht','suitecrm'] 
	},
	{ "object": "Case", "operation": "update", "step": 1, "totalRecord": DEFAULT_TOTAL_RECORD, 
		"numRecord": DEFAULT_NUM_RECORD, "merchant": ['gateway','mpits','myvnpost','ctel','vht','suitecrm'] 
	},
	{ "object": "Case", "operation": "upsert", "step": 1, "totalRecord": DEFAULT_TOTAL_RECORD, 
		"numRecord": DEFAULT_NUM_RECORD, "merchant": ['gateway','mpits','myvnpost','ctel','vht','suitecrm'],
		"externalIdFieldName": "UUID__c" 
	},
	{ "object": "Contact", "operation": "insert", "step": 1, "totalRecord": DEFAULT_TOTAL_RECORD, 
		"numRecord": DEFAULT_NUM_RECORD, "merchant": ['myvnpost','gateway','suitecrm'] 
	},
	{ "object": "Contact", "operation": "update", "step": 1, "totalRecord": DEFAULT_TOTAL_RECORD, 
		"numRecord": DEFAULT_NUM_RECORD, "merchant": ['myvnpost','gateway','suitecrm'] 
	},
	{ "object": "Lead", "operation": "insert", "step": 1, "totalRecord": DEFAULT_TOTAL_RECORD, 
		"numRecord": DEFAULT_NUM_RECORD, "merchant": ['myvnpost','gateway','suitecrm'] 
	},
	{ "object": "Lead", "operation": "update", "step": 1, "totalRecord": DEFAULT_TOTAL_RECORD, 
		"numRecord": DEFAULT_NUM_RECORD, "merchant": ['myvnpost','gateway','suitecrm'] 
	},
	{ "object": "Tien_trinh_xu_li__c", "operation": "insert", "step": 1, "totalRecord": DEFAULT_TOTAL_RECORD, 
		"numRecord": DEFAULT_NUM_RECORD, "merchant": ['gateway','mpits','suitecrm'] 
	},
	{ "object": "Tien_trinh_xu_li__c", "operation": "update", "step": 1, "totalRecord": DEFAULT_TOTAL_RECORD, 
		"numRecord": DEFAULT_NUM_RECORD, "merchant": ['gateway','mpits','suitecrm'] 
	},
	{ "object": "Vi_pham__c", "operation": "insert", "step": 1, "totalRecord": DEFAULT_TOTAL_RECORD, 
		"numRecord": DEFAULT_NUM_RECORD, "merchant": ['gateway','mpits','suitecrm'] 
	},
	{ "object": "Vi_pham__c", "operation": "update", "step": 1, "totalRecord": DEFAULT_TOTAL_RECORD, 
		"numRecord": DEFAULT_NUM_RECORD, "merchant": ['gateway','mpits','suitecrm']
	},
	{ "object": "Ho_tro__c", "operation": "insert", "step": 1, "totalRecord": DEFAULT_TOTAL_RECORD, 
		"numRecord": DEFAULT_NUM_RECORD, "merchant": ['gateway','myvnpost','suitecrm'] 
	},
	{ "object": "Ho_tro__c", "operation": "update", "step": 1, "totalRecord": DEFAULT_TOTAL_RECORD, 
		"numRecord": DEFAULT_NUM_RECORD, "merchant": ['gateway','myvnpost','suitecrm'] 
	},
	// { "object": "Ho_tro__c", "operation": "upsert", "step": 2, "object_ref": "Case", 
	// 	"key_sf_ref": "Case_Number__c", "key_ref": "F_UUID__c", "externalIdFieldName": "UUID__c", 
	// 	"schedule": "*/5 * * * *", "totalRecord": DEFAULT_TOTAL_RECORD, "numRecord": DEFAULT_NUM_RECORD, 
	// 	"merchant": ['myvnpost'] 
	// },
	{ "object": "SalesOrder__c", "operation": "upsert", "step": 1,
		"totalRecord": DEFAULT_TOTAL_RECORD, "numRecord": DEFAULT_NUM_RECORD,
		"merchant": ['gateway','myvnpost','bccp','suitecrm'],
		"externalIdFieldName": "SalesOrder_Number__c"
	},
	{ "object": "Batch__c", "operation": "upsert", "step": 1, 
		"totalRecord": DEFAULT_TOTAL_RECORD, "numRecord": DEFAULT_NUM_RECORD, 
		"merchant": ['gateway','bccp','myvnpost','suitecrm'],
		"externalIdFieldName": "Batch_Number__c"
	},
	{ "object": "Package__c", "operation": "upsert", "step": 1,
		"schedule": "*/5 * * * *",
		"totalRecord": DEFAULT_TOTAL_RECORD, "numRecord": DEFAULT_NUM_RECORD,
		"merchant": ['gateway','myvnpost','bccp','suitecrm'],
		"externalIdFieldName": "Package_Number__c"
	},
	{ "object": "Item__c", "operation": "upsert", "step": 1,
		"totalRecord": DEFAULT_TOTAL_RECORD, "numRecord": DEFAULT_NUM_RECORD,
		"merchant": ['gateway','myvnpost','bccp','suitecrm'],
		"externalIdFieldName": "External_Item_Id__c"
	},
	{ "object": "Receipt__c", "operation": "upsert", "step": 1,
		"totalRecord": DEFAULT_TOTAL_RECORD, "numRecord": DEFAULT_NUM_RECORD,
		"merchant": ['gateway','myvnpost','bccp','suitecrm'],
		"externalIdFieldName": "External_Receipt_Id__c"
	},
	{ "object": "Status__c", "operation": "upsert", "step": 1,
		"totalRecord": DEFAULT_TOTAL_RECORD, "numRecord": DEFAULT_NUM_RECORD,
		"merchant": ['gateway','myvnpost','bccp','suitecrm'],
		"externalIdFieldName": "External_Status_Id__c"
	},
	{ "object": "Added_Value_in_Package__c", "operation": "upsert", "step": 1, 
		"totalRecord": DEFAULT_TOTAL_RECORD, "numRecord": DEFAULT_NUM_RECORD,
		"merchant": ['gateway','myvnpost','bccp','suitecrm'],
		"externalIdFieldName": "External_AVP_Id__c"
	}
];