const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// Verify by token ID
router.get('/token/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    const student = await Student.findOne({
      'certificates.tokenId': parseInt(tokenId)
    });

    if (!student) {
      return res.json({
        success: true,
        isValid: false,
        message: 'Certificate not found'
      });
    }

    const certificate = student.certificates.find(cert => cert.tokenId === parseInt(tokenId));
    
    res.json({
      success: true,
      isValid: true,
      message: 'Certificate verified successfully',
      certificate: {
        studentName: student.name,
        registerNumber: student.registerNumber,
        course: certificate.course,
        degree: certificate.degree,
        cgpa: certificate.cgpa,
        issueDate: certificate.issueDate,
        tokenId: certificate.tokenId,
        transactionHash: certificate.transactionHash,
        ipfsHash: certificate.ipfsHash,
        certificateType: certificate.certificateType
      }
    });

  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
});

// Verify by register number
router.get('/register/:registerNumber', async (req, res) => {
  try {
    const { registerNumber } = req.params;
    
    const student = await Student.findOne({ registerNumber });

    if (!student || student.certificates.length === 0) {
      return res.json({
        success: true,
        isValid: false,
        message: 'No certificates found for this student'
      });
    }

    // Return the latest certificate
    const latestCertificate = student.certificates.sort((a, b) => 
      new Date(b.issueDate) - new Date(a.issueDate)
    )[0];

    res.json({
      success: true,
      isValid: true,
      message: 'Certificate verified successfully',
      certificate: {
        studentName: student.name,
        registerNumber: student.registerNumber,
        course: latestCertificate.course,
        degree: latestCertificate.degree,
        cgpa: latestCertificate.cgpa,
        issueDate: latestCertificate.issueDate,
        tokenId: latestCertificate.tokenId,
        transactionHash: latestCertificate.transactionHash,
        ipfsHash: latestCertificate.ipfsHash,
        certificateType: latestCertificate.certificateType
      }
    });

  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
});

module.exports = router;