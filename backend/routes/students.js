const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// Get student certificates by wallet address
router.get('/certificates/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const student = await Student.findOne({ walletAddress });
    
    if (!student) {
      return res.json({
        success: true,
        certificates: [],
        studentInfo: null
      });
    }

    const certificates = student.certificates.map(cert => ({
      _id: cert._id,
      tokenId: cert.tokenId,
      studentName: student.name,
      registerNumber: student.registerNumber,
      course: cert.course,
      degree: cert.degree,
      cgpa: cert.cgpa,
      certificateType: cert.certificateType,
      issueDate: cert.issueDate,
      transactionHash: cert.transactionHash,
      ipfsHash: cert.ipfsHash
    }));

    res.json({
      success: true,
      certificates,
      studentInfo: {
        name: student.name,
        registerNumber: student.registerNumber,
        email: student.email,
        course: student.course,
        degree: student.degree
      }
    });

  } catch (error) {
    console.error('Error fetching student certificates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student certificates'
    });
  }
});

module.exports = router;