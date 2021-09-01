const express = require('express');
const router = express.Router();
const noteController = require('../controllers/note');
const checkAuth = require('../middlewares');
const validate = require('../middlewares/validate');
const countRequest = require('../middlewares/countRequest');

router.get('/', [checkAuth,countRequest], noteController.list);
router.post('/', [checkAuth,validate,countRequest], noteController.create);
router.patch('/:id', [checkAuth,validate,countRequest], noteController.update);
router.delete('/:id', [checkAuth,countRequest], noteController.delete);
// router.post('/batch', checkAuth, noteController.batch);
router.get('/count', [checkAuth,countRequest], noteController.count);
router.get('/:id', [checkAuth,countRequest], noteController.detail);
router.get('/:id/content', [checkAuth,countRequest], noteController.content);
// router.post('/multiple/contentDocumentLink', checkAuth, noteController.createMultipleCDL);

module.exports = router;