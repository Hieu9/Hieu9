const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact');
const checkAuth = require('../middlewares');
const validate = require('../middlewares/validate');
const countRequest = require('../middlewares/countRequest');
const cache = require('../libs/cache_request');

router.get('/', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'contact'}).route()], contactController.list);
router.get('/:id', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'contact-detail'}).route()], contactController.detail);
router.post('/create', [checkAuth,countRequest], contactController.createSF);
router.patch('/update/:id', [checkAuth,countRequest], contactController.updateSF);

module.exports = router;