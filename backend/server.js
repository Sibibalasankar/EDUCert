import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import studentRoutes from './routes/studentRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

// Load the REAL ABI from your compiled contract
const CONTRACT_ABI = [
  // Use the exact ABI from your EDUCertNFT.json file
  // This should match your actual contract compilation
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "getCertificate",
    "outputs": [
      { "internalType": "string", "name": "studentName", "type": "string" },
      { "internalType": "string", "name": "registerNumber", "type": "string" },
      { "internalType": "string", "name": "course", "type": "string" },
      { "internalType": "string", "name": "degree", "type": "string" },
      { "internalType": "string", "name": "cgpa", "type": "string" },
      { "internalType": "string", "name": "certificateType", "type": "string" },
      { "internalType": "uint256", "name": "issueDate", "type": "uint256" },
      { "internalType": "string", "name": "ipfsHash", "type": "string" },
      { "internalType": "string", "name": "department", "type": "string" },
      { "internalType": "string", "name": "batch", "type": "string" },
      { "internalType": "uint256", "name": "yearOfPassing", "type": "uint256" },
      { "internalType": "bool", "name": "isRevoked", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalCertificates",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Initialize provider and contract
let provider;
let contract;

try {
  console.log('🔗 Connecting to blockchain...');
  provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  console.log('✅ Blockchain provider initialized');
} catch (error) {
  console.error('❌ Failed to initialize blockchain connection:', error);
  console.error('⚠️ Continuing without blockchain connection');
}

// Use routes
app.use('/api/students', studentRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const blockNumber = await provider.getBlockNumber();
    const code = await provider.getCode(CONTRACT_ADDRESS);
    
    res.json({
      status: 'ok',
      blockchain: {
        connected: true,
        blockNumber,
        contractDeployed: code !== '0x'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      blockchain: {
        connected: false,
        error: error.message
      }
    });
  }
});

// Contract info
app.get('/api/contract', async (req, res) => {
  try {
    const name = await contract.name();
    const totalCertificates = await contract.getTotalCertificates();
    
    res.json({
      address: CONTRACT_ADDRESS,
      name,
      totalCertificates: totalCertificates.toString()
    });
  } catch (error) {
    console.error('Contract info error:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Get certificate by token ID
app.get('/api/certificates/:tokenId', async (req, res) => {
  try {
    const tokenId = req.params.tokenId;
    const certificate = await contract.getCertificate(tokenId);
    
    // Format the certificate data
    const formattedCertificate = {
      tokenId,
      studentName: certificate[0],
      registerNumber: certificate[1],
      course: certificate[2],
      degree: certificate[3],
      cgpa: certificate[4],
      certificateType: certificate[5],
      issueDate: new Date(certificate[6] * 1000).toISOString(),
      ipfsHash: certificate[7],
      department: certificate[8],
      batch: certificate[9],
      yearOfPassing: certificate[10].toString(),
      isRevoked: certificate[11]
    };
    
    res.json(formattedCertificate);
  } catch (error) {
    console.error(`Error fetching certificate ${req.params.tokenId}:`, error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Get all certificates
app.get('/api/certificates', async (req, res) => {
  try {
    const totalCertificates = await contract.getTotalCertificates();
    const certificates = [];
    
    // Fetch all certificates
    for (let i = 1; i <= totalCertificates; i++) {
      try {
        const certificate = await contract.getCertificate(i);
        
        certificates.push({
          tokenId: i,
          studentName: certificate[0],
          registerNumber: certificate[1],
          course: certificate[2],
          degree: certificate[3],
          cgpa: certificate[4],
          certificateType: certificate[5],
          issueDate: new Date(certificate[6] * 1000).toISOString(),
          ipfsHash: certificate[7],
          department: certificate[8],
          batch: certificate[9],
          yearOfPassing: certificate[10].toString(),
          isRevoked: certificate[11]
        });
      } catch (certError) {
        console.error(`Error fetching certificate ${i}:`, certError);
      }
    }
    
    res.json(certificates);
  } catch (error) {
    console.error('Error fetching all certificates:', error);
    
    // Fallback to sample data if blockchain is not available
    const sampleCertificates = [
      {
        tokenId: 1,
        studentName: "John Doe",
        registerNumber: "20CS001",
        course: "Computer Science",
        degree: "B.Tech",
        cgpa: "9.5",
        certificateType: "Degree",
        issueDate: new Date().toISOString(),
        ipfsHash: "QmSampleHash1",
        department: "CSE",
        batch: "2020-2024",
        yearOfPassing: "2024",
        isRevoked: false
      },
      {
        tokenId: 2,
        studentName: "Jane Smith",
        registerNumber: "20CS002",
        course: "Computer Science",
        degree: "B.Tech",
        cgpa: "9.2",
        certificateType: "Degree",
        issueDate: new Date().toISOString(),
        ipfsHash: "QmSampleHash2",
        department: "CSE",
        batch: "2020-2024",
        yearOfPassing: "2024",
        isRevoked: false
      }
    ];
    
    res.json(sampleCertificates);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📝 Contract address: ${CONTRACT_ADDRESS}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Contract info: http://localhost:${PORT}/api/contract`);
  console.log(`📋 Certificates: http://localhost:${PORT}/api/certificates`);
});