const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const checkAuth = require('../middlewares');
const countRequest = require('../middlewares/countRequest');
const cache = require('../libs/cache_request');

router.post('/login', [countRequest, cache.folk, cache.cacheRequest({prefix: 'login'}).route({ expire: 30  })],authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/callback', authController.callback);
router.post('/authorize', authController.authorize);
router.get('/code', authController.code);
router.get('/delete-cache',[checkAuth], authController.deleteCache);

module.exports = router;


