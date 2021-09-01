const express = require('express');
const router = express.Router();
const objectController = require('../controllers/object');

router.get('/accounts', objectController.getAccountList);
router.post('/leads', objectController.createLead);

module.exports = router;