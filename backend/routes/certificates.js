const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');

// Issue new certificate
router.post('/issue', certificateController.issueCertificate);

// Get all certificates
router.get('/', certificateController.getAllCertificates);

module.exports = router;