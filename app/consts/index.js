exports.LIMIT = 10;
exports.LIMITMAX = 2000;
exports.OFFSET = 0;
exports.JOB_OPERATION_INSERT = 'insert';
exports.JOB_OPERATION_UPDATE = 'update';
exports.JOB_OPERATION_DELETE = 'delete';
exports.JOB_OPERATION_UPSERT = 'upsert';
exports.CACHED_EXPIRATION = {
	400: 60,
	401: 5,
	402: 5,
	403: 1,
	500: 1,
	xxx: 60
};