const express = require('express');
const router = express.Router();
const leadController = require('../controllers/lead');
const checkAuth = require('../middlewares');
const validate = require('../middlewares/validate');
const countRequest = require('../middlewares/countRequest');
const cache = require('../libs/cache_request');

router.get('/', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'lead'}).route()], leadController.list);
router.get('/:id', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'lead-detail'}).route()], leadController.detail);
router.post('/', [checkAuth,validate,countRequest], leadController.create);
router.post('/convert', [checkAuth,countRequest], leadController.convert);
router.patch('/:id', [checkAuth,validate,countRequest], leadController.update);
router.post('/create', [checkAuth,countRequest], leadController.createSF);
router.patch('/update/:id', [checkAuth,countRequest], leadController.updateSF);

module.exports = router;