const express = require('express');
const router = express.Router();
const recordController = require('../controllers/recordType');
const checkAuth = require('../../../middlewares');

router.get('/', checkAuth, recordController.list);
router.get('/:id', checkAuth, recordController.detail);

module.exports = router;