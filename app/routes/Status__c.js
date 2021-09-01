const express = require('express');
const router = express.Router();
const objectController = require('../controllers/Status__c');
const checkAuth = require('../middlewares');
const validate = require('../middlewares/validate');
const countRequest = require('../middlewares/countRequest');
const cache = require('../libs/cache_request');

router.get('/', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'status'}).route()], objectController.list);
router.get('/:id', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'status-detail'}).route()], objectController.detail);
router.post('/upsert', [checkAuth,validate,countRequest], objectController.upsert);

module.exports = router;