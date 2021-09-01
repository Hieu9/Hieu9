const express = require('express');
const router = express.Router();
const objController = require('../controllers/index');
const checkAuth = require('../../../middlewares');

router.post('/', [checkAuth], objController.create);

module.exports = router;