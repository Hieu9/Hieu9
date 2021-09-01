const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobs');
const checkAuth = require('../../../middlewares');

router.get('/', checkAuth, jobsController.getList);

router.get('/ingest/:jobId/failedResults', checkAuth, jobsController.failedResults);

router.get('/ingest/:jobId/successfulResults', checkAuth, jobsController.successfulResults);
// router.get('/ingest', checkAuth, jobsController.getIngest);
// // create job
// router.post('/ingest', checkAuth, jobsController.postIngest);
// // get detail job
// router.get('/ingest/:jobId', checkAuth, jobsController.getIngestDetail); // /successfulResults || /failedResults 
// { "state" : "UploadComplete" }
// router.patch('/ingest/:jobId', checkAuth, jobsController.patchIngestDetail);
// // run batch with data csv
// router.put('/ingest/:jobId/batches', checkAuth, jobsController.batches);

module.exports = router;