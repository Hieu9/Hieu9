const express = require('express');
const router = express.Router();
const objController = require('../controllers/contract');
const checkAuth = require('../middlewares');
const validate = require('../middlewares/validate');
const countRequest = require('../middlewares/countRequest');
const cache = require('../libs/cache_request');

router.get('/', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'contract'}).route()], objController.list);
router.get('/:id', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'contract-detail'}).route()], objController.detail);
router.post('/create', [checkAuth,countRequest], objController.createSF);
router.patch('/update/:id', [checkAuth,countRequest], objController.updateSF);

module.exports = router;