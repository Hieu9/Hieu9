const express = require('express');
const router = express.Router();
const addValueController = require('../controllers/added_value_service__c');
const checkAuth = require('../middlewares');
const validate = require('../middlewares/validate');
const countRequest = require('../middlewares/countRequest');
const cache = require('../libs/cache_request');
const {CACHED_EXPIRATION} = require('../consts');

router.get('/', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'added_value_service'}).route()], addValueController.list);

router.get('/:id', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'added_value_service-detail'}).route(Object.assign(CACHED_EXPIRATION,{200: 60*5}))], addValueController.detail);

module.exports = router;