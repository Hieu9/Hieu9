const express = require('express');
const router = express.Router();
const objController = require('../controllers/object-info');
const checkAuth = require('../../../middlewares');

router.get('/writeObject', checkAuth, objController.writeObject);
router.get('/:objectApiName', checkAuth, objController.list);
router.get('/:object/describe', checkAuth, objController.readObject);
router.get('/:objectApiName/picklist-values/:recordTypeId', checkAuth, objController.picklistValuesList);
router.get('/:objectApiName/picklist-values/:recordTypeId/:fieldApiName', checkAuth, objController.picklistValuesDetail);

module.exports = router;