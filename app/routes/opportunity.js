const express = require('express');
const router = express.Router();
const opportunityController = require('../controllers/opportunity');
const checkAuth = require('../middlewares');
const validate = require('../middlewares/validate');
const countRequest = require('../middlewares/countRequest');
const cache = require('../libs/cache_request');

router.get('/', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'opportunity'}).route()], opportunityController.list);
router.get('/:id', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'opportunity-detail'}).route()], opportunityController.detail);
router.post('/', [checkAuth,validate,countRequest], opportunityController.create);
// router.post('/batch', checkAuth, opportunityController.createBatch);
router.patch('/:id', [checkAuth,validate,countRequest], opportunityController.update);

module.exports = router;