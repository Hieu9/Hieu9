const express = require('express');
const router = express.Router();
const paypostController = require('../controllers/paypost');
const checkAuth = require('../middlewares');
const validate = require('../middlewares/validate');
const countRequest = require('../middlewares/countRequest');
const cache = require('../libs/cache_request');

router.post('/', [checkAuth], paypostController.create);

module.exports = router;