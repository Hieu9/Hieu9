const express = require('express');
const router = express.Router();
const objectController = require('../controllers/User');
const checkAuth = require('../middlewares');
const countRequest = require('../middlewares/countRequest');
const cache = require('../libs/cache_request');
const {CACHED_EXPIRATION} = require('../consts');

router.get('/', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'user'}).route(Object.assign(CACHED_EXPIRATION,{200: 60*5}))], objectController.list);
router.get('/:id', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'user'}).route(Object.assign(CACHED_EXPIRATION,{200: 60*5}))], objectController.detail);
module.exports = router;