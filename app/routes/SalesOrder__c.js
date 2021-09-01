const express = require('express');
const router = express.Router();
const objectController = require('../controllers/SalesOrder__c');
const checkAuth = require('../middlewares');
const validate = require('../middlewares/validate');
const mapFields = require('../middlewares/mapFields');
const countRequest = require('../middlewares/countRequest');
const cache = require('../libs/cache_request');

router.get('/', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'salesorder'}).route()], objectController.list);
router.get('/:id', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'salesorder-detail'}).route()], objectController.detail);
router.post('/', [checkAuth,validate,countRequest], objectController.create);
router.post('/upsert', [checkAuth,validate,countRequest], objectController.upsert);

module.exports = router;