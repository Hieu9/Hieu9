exports.SCHEDULE_JOB = "*/5 * * * *"; // job run batch
exports.SCHEDULE_LOGS = "00 10 00 * * 1-7"; // job save log to db
// exports.SCHEDULE_LOGS = "*/1 * * * *"; // job save log to db
exports.SCHEDULE_PULL_CASE = "*/1 * * * *";
exports.SCHEDULE_UPDATE_FAILED = "*/59 * * * *";
exports.DELAY_JOBS_RESULT = 1*60*1000;
const DEFAULT_NUM_RECORD = 5000;
const DEFAULT_TOTAL_RECORD = 50000;

// MPITS MyVNPost Bccp PackAndSend SalePortal GateWay

exports.jobs = [
	{ "object": "Case", "operation": "insert", "step": 1,
		"totalRecord": DEFAULT_TOTAL_RECORD, "numRecord": DEFAULT_NUM_RECORD, "merchant": ['gateway','mpits','myvnpost','ctel','vht','suitecrm']
	},
	{ "object": "Case", "operation": "update", "step": 1, "totalRecord": DEFAULT_TOTAL_RECORD,
		"numRecord": DEFAULT_NUM_RECORD, "merchant": ['gateway','mpits','myvnpost','ctel','vht','suitecrm']
	},
	{ "object": "Case", "operation": "upsert", "step": 1, "totalRecord": DEFAULT_TOTAL_RECORD,
		"numRecord": DEFAULT_NUM_RECORD, "merchant": ['gateway','mpits','myvnpost','ctel','vht','suitecrm'],
		"externalIdFieldName": "UUID__c"
	}
];
