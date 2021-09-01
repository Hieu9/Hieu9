const express = require('express');
const router = express.Router();
const queryLogs = require('../controllers/queryLogs');
const checkAuth = require('../../../middlewares');

router.get('/', checkAuth, queryLogs.getLogs);

module.exports = router;