const express = require('express');
const router = express.Router();
const queryController = require('../controllers/query');
const checkAuth = require('../../../middlewares');
const countRequest = require('../../../middlewares/countRequest');
const cache = require('../../../libs/cache_request');

router.get('/', [checkAuth,countRequest], queryController.getQuery);
router.get('/:id', [checkAuth,countRequest], queryController.getQueryId);
router.get('/statistic', [checkAuth,countRequest], queryController.getStatistic);
router.post('/listIds', [checkAuth,countRequest, cache.folk, cache.cacheRequest({prefix: 'query'}).route()], queryController.listIds);

module.exports = router;