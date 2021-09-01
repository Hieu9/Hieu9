const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee');
const checkAuth = require('../middlewares');
const validate = require('../middlewares/validate');
const countRequest = require('../middlewares/countRequest');
const cache = require('../libs/cache_request');
const {CACHED_EXPIRATION} = require('../consts');

router.get('/', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'employee'}).route(Object.assign(CACHED_EXPIRATION,{200: 60*5}))], employeeController.list);
router.get('/:id', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'employee-detail'}).route(Object.assign(CACHED_EXPIRATION,{200: 60*5}))], employeeController.detail);
router.post('/', [checkAuth,validate,countRequest], employeeController.create);
// router.post('/batch', checkAuth, employeeController.createBatch);
router.patch('/:id', [checkAuth,validate,countRequest], employeeController.update);

module.exports = router;