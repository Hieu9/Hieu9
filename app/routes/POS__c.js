const express = require('express');
const router = express.Router();
const objectController = require('../controllers/POS__c');
const checkAuth = require('../middlewares');
const validate = require('../middlewares/validate');
const countRequest = require('../middlewares/countRequest');
const cache = require('../libs/cache_request');
const {CACHED_EXPIRATION} = require('../consts');

router.get('/', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'pos'}).route(Object.assign(CACHED_EXPIRATION,{200: 60*60*24}))], objectController.list);
router.get('/:id', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'pos-detail'}).route(Object.assign(CACHED_EXPIRATION,{200: 60*60*24}))], objectController.detail);
router.post('/', [checkAuth,validate,countRequest], objectController.create);
router.patch('/:id', [checkAuth,validate,countRequest], objectController.update);

module.exports = router;