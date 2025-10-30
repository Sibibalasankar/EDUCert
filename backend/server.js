const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection with your credentials
const MONGODB_URI = 'mongodb://dbuser:dbuserpass@localhost:27017/educert?authSource=admin';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('✅ Connected to MongoDB successfully!');
  console.log('📊 Database: educert');
});

// MongoDB Schemas
const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  registerNumber: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  degree: {
    type: String,
    required: true
  },
  cgpa: {
    type: String,
    required: true
  },
  walletAddress: {
    type: String
  },
  certificates: [{
    tokenId: Number,
    transactionHash: String,
    ipfsHash: String,
    issueDate: Date,
    certificateType: String,
    course: String,
    degree: String,
    cgpa: String
  }]
}, {
  timestamps: true
});

const Student = mongoose.model('Student', studentSchema);

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'EDUCert Backend API is running!',
    database: 'Connected to MongoDB',
    endpoints: [
      'POST /api/certificates/issue',
      'GET  /api/certificates',
      'GET  /api/students/certificates/:walletAddress',
      'GET  /api/verification/token/:tokenId',
      'GET  /api/verification/register/:registerNumber'
    ]
  });
});

// Issue certificate
app.post('/api/certificates/issue', async (req, res) => {
  try {
    const {
      name,
      registerNumber,
      email,
      course,
      degree,
      cgpa,
      walletAddress,
      certificateType
    } = req.body;

    // Check if student exists
    let student = await Student.findOne({ registerNumber });
    
    if (!student) {
      // Create new student
      student = new Student({
        name,
        registerNumber,
        email,
        course,
        degree,
        cgpa,
        walletAddress
      });
    }

    // Generate certificate data
    const certificate = {
      tokenId: Math.floor(Math.random() * 1000) + 1,
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
      ipfsHash: 'Qm' + Math.random().toString(36).substr(2, 44),
      issueDate: new Date(),
      certificateType: certificateType || 'Degree',
      course,
      degree,
      cgpa
    };

    // Add certificate to student
    student.certificates.push(certificate);
    await student.save();

    console.log(`✅ Certificate issued for ${name} (${registerNumber})`);

    res.json({
      success: true,
      message: 'Certificate issued successfully',
      certificate: {
        _id: certificate._id,
        ...certificate,
        studentName: student.name,
        registerNumber: student.registerNumber
      },
      student: {
        name: student.name,
        registerNumber: student.registerNumber
      }
    });

  } catch (error) {
    console.error('❌ Error issuing certificate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to issue certificate: ' + error.message
    });
  }
});

// Get all certificates
app.get('/api/certificates', async (req, res) => {
  try {
    const students = await Student.find({}, 'name registerNumber certificates');
    
    const certificates = students.flatMap(student => 
      student.certificates.map(cert => ({
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
      }))
    );

    console.log(`📊 Retrieved ${certificates.length} certificates from database`);

    res.json({
      success: true,
      certificates
    });
  } catch (error) {
    console.error('❌ Error fetching certificates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch certificates'
    });
  }
});

// Get student certificates by wallet address
app.get('/api/students/certificates/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const student = await Student.findOne({ walletAddress });
    
    if (!student) {
      console.log(`ℹ️ No student found for wallet: ${walletAddress}`);
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

    console.log(`📚 Found ${certificates.length} certificates for ${student.name}`);

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
    console.error('❌ Error fetching student certificates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student certificates'
    });
  }
});

// Verify by token ID
app.get('/api/verification/token/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    const student = await Student.findOne({
      'certificates.tokenId': parseInt(tokenId)
    });

    if (!student) {
      console.log(`❌ Certificate not found for token ID: ${tokenId}`);
      return res.json({
        success: true,
        isValid: false,
        message: 'Certificate not found'
      });
    }

    const certificate = student.certificates.find(cert => cert.tokenId === parseInt(tokenId));
    
    console.log(`✅ Certificate verified for token ID: ${tokenId}`);

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
    console.error('❌ Error verifying certificate:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
});

// Verify by register number
app.get('/api/verification/register/:registerNumber', async (req, res) => {
  try {
    const { registerNumber } = req.params;
    
    const student = await Student.findOne({ registerNumber });

    if (!student || student.certificates.length === 0) {
      console.log(`❌ No certificates found for register number: ${registerNumber}`);
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

    console.log(`✅ Certificate verified for register number: ${registerNumber}`);

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
    console.error('❌ Error verifying certificate:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 MongoDB: dbuser@localhost:27017/educert`);
  console.log(`📝 API endpoints:`);
  console.log(`   POST /api/certificates/issue`);
  console.log(`   GET  /api/certificates`);
  console.log(`   GET  /api/students/certificates/:walletAddress`);
  console.log(`   GET  /api/verification/token/:tokenId`);
  console.log(`   GET  /api/verification/register/:registerNumber`);
});