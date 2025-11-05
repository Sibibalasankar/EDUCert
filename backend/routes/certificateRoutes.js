import express from 'express';
import Certificate from '../models/Certificate.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all certificates for a student
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const certificates = await Certificate.find({ studentId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      certificates
    });
  } catch (error) {
    console.error('Error fetching student certificates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch certificates'
    });
  }
});

// Get all certificates (admin only)
router.get('/all', adminAuth, async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .populate('studentId', 'name studentId email course degree department')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      certificates
    });
  } catch (error) {
    console.error('Error fetching all certificates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch certificates'
    });
  }
});

// Create certificate (admin only)
router.post('/create', adminAuth, async (req, res) => {
  try {
    const {
      studentId,
      certificateType,
      studentName,
      course,
      cgpa,
      degree,
      department,
      ipfsHash
    } = req.body;

    // Validate required fields
    if (!studentId || !certificateType) {
      return res.status(400).json({
        success: false,
        error: 'Student ID and certificate type are required'
      });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      studentId,
      certificateType
    });

    if (existingCertificate) {
      return res.status(400).json({
        success: false,
        error: 'Certificate of this type already exists for this student'
      });
    }

    const certificate = new Certificate({
      studentId,
      certificateType,
      studentName,
      course,
      cgpa,
      degree,
      department,
      ipfsHash: ipfsHash || `Qm${studentId}${certificateType}${Date.now()}`,
      status: 'pending',
      createdBy: req.admin._id
    });

    await certificate.save();

    res.status(201).json({
      success: true,
      message: 'Certificate created successfully',
      certificate
    });
  } catch (error) {
    console.error('Error creating certificate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create certificate'
    });
  }
});

// Approve certificate (admin only)
router.put('/approve/:certificateId', adminAuth, async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findById(certificateId);
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found'
      });
    }

    certificate.status = 'approved';
    certificate.approvedAt = new Date();
    certificate.approvedBy = req.admin._id;
    certificate.transactionHash = req.body.transactionHash || `0x${Math.random().toString(16).substr(2, 64)}`;

    await certificate.save();

    res.json({
      success: true,
      message: 'Certificate approved successfully',
      certificate
    });
  } catch (error) {
    console.error('Error approving certificate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve certificate'
    });
  }
});

// Mint certificate
router.post('/mint/:certificateId', auth, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const {
      transactionHash,
      tokenId,
      studentId,
      certificateType,
      studentName,
      course,
      cgpa
    } = req.body;

    const certificate = await Certificate.findById(certificateId);
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found'
      });
    }

    // Update certificate with minting data
    certificate.status = 'minted';
    certificate.mintedAt = new Date();
    certificate.transactionHash = transactionHash;
    certificate.tokenId = tokenId;
    certificate.mintedBy = req.user._id;

    // Update student info if provided
    if (studentName) certificate.studentName = studentName;
    if (course) certificate.course = course;
    if (cgpa) certificate.cgpa = cgpa;

    await certificate.save();

    res.json({
      success: true,
      message: 'Certificate minted successfully',
      certificate
    });
  } catch (error) {
    console.error('Error minting certificate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mint certificate'
    });
  }
});

// Update certificate mint status
router.put('/:certificateId/mint-status', auth, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const {
      status,
      transactionHash,
      tokenId,
      mintedAt,
      blockchainConfirmed,
      blockNumber,
      mintedBy
    } = req.body;

    const certificate = await Certificate.findById(certificateId);
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found'
      });
    }

    // Update fields
    if (status) certificate.status = status;
    if (transactionHash) certificate.transactionHash = transactionHash;
    if (tokenId) certificate.tokenId = tokenId;
    if (mintedAt) certificate.mintedAt = mintedAt;
    if (blockchainConfirmed !== undefined) certificate.blockchainConfirmed = blockchainConfirmed;
    if (blockNumber) certificate.blockNumber = blockNumber;
    if (mintedBy) certificate.mintedBy = mintedBy;

    // Add to activity log
    certificate.activityLog.push({
      action: 'mint_status_updated',
      timestamp: new Date(),
      transactionHash,
      blockNumber,
      updatedBy: req.user._id
    });

    await certificate.save();

    res.json({
      success: true,
      message: 'Certificate mint status updated successfully',
      certificate
    });
  } catch (error) {
    console.error('Error updating certificate mint status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update certificate mint status'
    });
  }
});

// Verify certificate
router.get('/verify/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findById(certificateId)
      .populate('studentId', 'name studentId email course degree department');
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found'
      });
    }

    res.json({
      success: true,
      valid: true,
      certificate,
      verification: {
        verifiedAt: new Date().toISOString(),
        status: certificate.status,
        blockchainConfirmed: certificate.blockchainConfirmed
      }
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify certificate'
    });
  }
});

// Get certificate by transaction hash
router.get('/tx/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;

    const certificate = await Certificate.findOne({ transactionHash: txHash })
      .populate('studentId', 'name studentId email course degree department');
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found for this transaction'
      });
    }

    res.json({
      success: true,
      certificate
    });
  } catch (error) {
    console.error('Error fetching certificate by transaction hash:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch certificate'
    });
  }
});

export default router;