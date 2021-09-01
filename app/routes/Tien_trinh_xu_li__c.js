const express = require('express');
const router = express.Router();
const objectController = require('../controllers/Tien_trinh_xu_li__c');
const checkAuth = require('../middlewares');
const validate = require('../middlewares/validate');
const countRequest = require('../middlewares/countRequest');
const cache = require('../libs/cache_request');

router.get('/', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'tien_trinh_xu_li'}).route()], objectController.list);
router.get('/:id', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'tien_trinh_xu_li-detail'}).route()], objectController.detail);
router.post('/', [checkAuth, validate,countRequest], objectController.create);
router.patch('/:id', [checkAuth, validate,countRequest], objectController.update);

module.exports = router;