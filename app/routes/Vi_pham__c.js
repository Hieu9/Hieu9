const express = require('express');
const router = express.Router();
const objectController = require('../controllers/Vi_pham__c');
const checkAuth = require('../middlewares');
const validate = require('../middlewares/validate');
const countRequest = require('../middlewares/countRequest');
const cache = require('../libs/cache_request');

router.get('/', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'vi_pham'}).route()], objectController.list);
router.get('/:id', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'vi_pham-detail'}).route()], objectController.detail);
router.post('/', [checkAuth,validate,countRequest], objectController.create);
router.patch('/:id', [checkAuth,validate,countRequest], objectController.update);

module.exports = router;