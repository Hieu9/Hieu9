const express = require('express');
const router = express.Router();
const caseController = require('../controllers/case');
const checkAuth = require('../middlewares');
const validate = require('../middlewares/validate');
const mapFields = require('../middlewares/mapFields');
const countRequest = require('../middlewares/countRequest');
const cache = require('../libs/cache_request');

router.get('/', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'case'}).route()], caseController.list);
router.get('/:id', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'case-detail'}).route()], caseController.detail);
router.post('/', [checkAuth,validate,countRequest], caseController.create);
router.patch('/:id', [checkAuth,validate,countRequest], caseController.update);

module.exports = router;