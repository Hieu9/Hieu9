const express = require('express');
const router = express.Router();
const objectController = require('../controllers/Ho_tro__c');
const checkAuth = require('../middlewares');
const validate = require('../middlewares/validate');
const countRequest = require('../middlewares/countRequest');
const cache = require('../libs/cache_request');

router.get('/', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'ho_tro'}).route()], objectController.list);
router.get('/:id', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'ho_tro-detail'}).route()], objectController.detail);
router.post('/', [checkAuth,validate,countRequest], objectController.create);
router.patch('/:id', [checkAuth,validate,countRequest], objectController.update);

module.exports = router;