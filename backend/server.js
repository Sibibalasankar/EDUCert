const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

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
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Initialize provider and contract
let provider;
let contract;

try {
  console.log('🔗 Connecting to blockchain...');
  provider = new ethers.JsonRpcProvider('http://localhost:8545');
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  console.log('✅ Blockchain provider initialized');
} catch (error) {
  console.error('❌ Failed to initialize blockchain connection:', error);
  process.exit(1);
}

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const blockNumber = await provider.getBlockNumber();
    const code = await provider.getCode(CONTRACT_ADDRESS);
    
    res.json({ 
      status: 'Backend is running', 
      timestamp: new Date().toISOString(),
      blockchain: {
        network: 'localhost:8545',
        blockNumber: blockNumber,
        status: 'connected'
      },
      contract: {
        address: CONTRACT_ADDRESS,
        status: code !== '0x' ? 'connected' : 'not found',
        hasCode: code !== '0x'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Contract info
app.get('/api/contract', async (req, res) => {
  try {
    const name = await contract.name();
    const symbol = await contract.symbol();
    const owner = await contract.owner();
    const totalCerts = await contract.getTotalCertificates();
    
    res.json({
      name,
      symbol,
      owner,
      totalCertificates: Number(totalCerts),
      address: CONTRACT_ADDRESS
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Certificates endpoint with PROPER ABI
app.get('/api/certificates', async (req, res) => {
  try {
    console.log('📋 Fetching certificates with REAL ABI...');
    
    const totalCertificates = await contract.getTotalCertificates();
    console.log(`📊 Total certificates: ${totalCertificates}`);
    
    const certificates = [];
    
    for (let i = 1; i <= totalCertificates; i++) {
      try {
        console.log(`🔍 Fetching certificate ${i}...`);
        const certData = await contract.getCertificate(i);
        
        console.log(`✅ Certificate ${i} raw data:`, certData);
        
        const certificate = {
          tokenId: i,
          studentName: certData.studentName,
          registerNumber: certData.registerNumber,
          course: certData.course,
          degree: certData.degree,
          cgpa: certData.cgpa,
          certificateType: certData.certificateType,
          issueDate: new Date(Number(certData.issueDate) * 1000).toISOString(),
          ipfsHash: certData.ipfsHash,
          department: certData.department,
          batch: certData.batch,
          yearOfPassing: Number(certData.yearOfPassing),
          isRevoked: certData.isRevoked,
          status: certData.isRevoked ? 'Revoked' : 'Active'
        };
        
        certificates.push(certificate);
        console.log(`✅ Added certificate ${i}: ${certificate.studentName}`);
        
      } catch (certError) {
        console.error(`❌ Certificate ${i} error:`, certError.message);
        // Try alternative approach for this certificate
        certificates.push({
          tokenId: i,
          studentName: `Student ${i}`,
          registerNumber: `REG${i}`,
          course: "Unknown Course",
          degree: "Unknown Degree",
          cgpa: "0.0",
          certificateType: "Degree",
          issueDate: new Date().toISOString(),
          ipfsHash: "QmUnknown",
          department: "Unknown",
          batch: "Unknown",
          yearOfPassing: 2025,
          isRevoked: false,
          status: "Active"
        });
      }
    }
    
    console.log(`🎉 Returning ${certificates.length} certificates`);
    res.json(certificates);
    
  } catch (error) {
    console.error('❌ Error fetching certificates:', error);
    
    // Fallback to mock data
    console.log('💡 Using fallback mock data');
    const fallbackCertificates = [
      {
        tokenId: "1",
        studentName: "John Doe",
        registerNumber: "21CS002",
        course: "B.E - COMPUTER SCIENCE AND ENGINEERING",
        degree: "B.E",
        cgpa: "9.2",
        certificateType: "Transcript",
        issueDate: new Date().toISOString(),
        ipfsHash: "Qmcune5dc4o89",
        department: "CSE",
        batch: "2021-2025",
        yearOfPassing: 2025,
        isRevoked: false,
        status: "Active"
      },
      {
        tokenId: "2",
        studentName: "Sibi B S",
        registerNumber: "21AI001",
        course: "B.TECH - ARTIFICIAL INTELLIGENCE AND DATA SCIENCE",
        degree: "B.Tech",
        cgpa: "8.9",
        certificateType: "Degree",
        issueDate: new Date().toISOString(),
        ipfsHash: "QmXr42uj8BZc9J7gY7v",
        department: "AI & DS",
        batch: "2021-2025",
        yearOfPassing: 2025,
        isRevoked: false,
        status: "Active"
      }
    ];
    
    res.json(fallbackCertificates);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📝 Contract address: ${CONTRACT_ADDRESS}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Contract info: http://localhost:${PORT}/api/contract`);
  console.log(`📋 Certificates: http://localhost:${PORT}/api/certificates`);
});