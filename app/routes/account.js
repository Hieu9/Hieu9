const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account');
const checkAuth = require('../middlewares');
const validate = require('../middlewares/validate');
const mapFields = require('../middlewares/mapFields');
const countRequest = require('../middlewares/countRequest');
const cache = require('../libs/cache_request');
const {CACHED_EXPIRATION} = require('../consts');

router.get('/', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'account'}).route(Object.assign(CACHED_EXPIRATION,{200: 60*5}))], accountController.list);
router.get('/:id', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'account-detail'}).route()], accountController.detail);
router.post('/create', [checkAuth,countRequest], accountController.createSF);
router.patch('/update/:id', [checkAuth,countRequest], accountController.updateSF);
router.post('/', [checkAuth,validate,countRequest], accountController.create);
router.patch('/:id', [checkAuth,validate,countRequest], accountController.update);

module.exports = router;
