const express = require('express');
const router = express.Router();
const connectedAppController = require('../controllers/connected-app');
const checkAuth = require('../../../middlewares');


router.post('/', checkAuth, connectedAppController.addConnectedApp);

module.exports = router;