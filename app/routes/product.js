const express = require('express');
const router = express.Router();
const productController = require('../controllers/product');
const checkAuth = require('../middlewares');
const validate = require('../middlewares/validate');
const countRequest = require('../middlewares/countRequest');
const cache = require('../libs/cache_request');
const {CACHED_EXPIRATION} = require('../consts');

router.get('/', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'product'}).route(Object.assign(CACHED_EXPIRATION,{200: 60*60*24}))], productController.list);
router.get('/:id', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'product'}).route(Object.assign(CACHED_EXPIRATION,{200: 60*60*24}))], productController.detail);
// router.post('/', [checkAuth,validate,countRequest], productController.create);
// router.post('/batch', checkAuth, productController.createBatch);
// router.patch('/:id', [checkAuth,validate,countRequest], productController.update);

module.exports = router;