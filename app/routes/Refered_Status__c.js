const express = require('express');
const router = express.Router();
const objController = require('../controllers/Refered_Status__c');
const checkAuth = require('../middlewares');
const countRequest = require('../middlewares/countRequest');
const cache = require('../libs/cache_request');
const {CACHED_EXPIRATION} = require('../consts');

router.get('/', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'refered_status'}).route(Object.assign(CACHED_EXPIRATION,{200: 60*60*24}))], objController.list);

module.exports = router;