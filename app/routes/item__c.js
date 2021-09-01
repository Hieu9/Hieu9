const express = require('express');
const router = express.Router();
const objectController = require('../controllers/item');
const checkAuth = require('../middlewares');
const validate = require('../middlewares/validate');
const mapFields = require('../middlewares/mapFields');
const countRequest = require('../middlewares/countRequest');
const cache = require('../libs/cache_request');

router.get('/', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'item'}).route()], objectController.list);
router.get('/:id', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'item-detail'}).route()], objectController.detail);
router.post('/upsert', [checkAuth,validate,countRequest], objectController.upsert);

module.exports = router;