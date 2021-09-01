const express = require('express');
const router = express.Router();
const downloadController = require('../controllers/download-document');
const checkAuth = require('../../../middlewares');
const countRequest = require('../../../middlewares/countRequest');
const multer  = require('multer')
let upload = multer({ dest: '/csvs/uploads/' });
router.get('/download/:id', [checkAuth,countRequest], downloadController.download);
router.get('/content/:id', [checkAuth,countRequest], downloadController.content);
router.get('/attachment/:id/body', [checkAuth,countRequest], downloadController.attachmentBody);
router.get('/attachment/:id', [checkAuth,countRequest], downloadController.attachment);
router.post('/upload-attachment', [checkAuth,upload.single('FileUpload')], downloadController.uploadAttachment);
router.post('/upload-file', [checkAuth,upload.single('FileUpload')], downloadController.uploadFile);
module.exports = router;