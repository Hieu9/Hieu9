const express = require('express');
const router = express.Router();
const sobjectsController = require('../controllers/sobjects');
const checkAuth = require('../middlewares');
const countRequest = require('../middlewares/countRequest');
const cache = require('../libs/cache_request');

router.get('/:object/describe', [checkAuth,countRequest,cache.useCache,cache.cacheRequest({prefix: 'sobjects'}).route({ expire: 60*60  })], sobjectsController.describe);

module.exports = router;