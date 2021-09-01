const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task');
const checkAuth = require('../middlewares');
const validate = require('../middlewares/validate');
const countRequest = require('../middlewares/countRequest');

router.get('/', [checkAuth,countRequest], taskController.list);
router.get('/:id', [checkAuth,countRequest], taskController.detail);
router.post('/', [checkAuth,validate,countRequest], taskController.create);
router.post('/create', [checkAuth,countRequest], taskController.createSF);
// router.post('/batch', checkAuth, taskController.createBatch);
router.patch('/:id', [checkAuth,validate,countRequest], taskController.update);
router.delete('/:id', [checkAuth,countRequest], taskController.delete);

module.exports = router;