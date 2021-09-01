const express = require('express');
const router = express.Router();
const objController = require('../controllers/log');
const checkAuth = require('../../../middlewares');

router.get('/list', [checkAuth], objController.list);

module.exports = router;