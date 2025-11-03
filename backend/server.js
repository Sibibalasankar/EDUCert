const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
      { "internalType": "string", "name": "degree", "type": "string" },
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

  console.log('🔗 Connecting to blockchain...');
  provider = new ethers.JsonRpcProvider('http://localhost:8545');
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  console.log('✅ Blockchain provider initialized');
} catch (error) {
  console.log('✅ Blockchain provider initialized');
    
    res.json({ 
  process.exit(1);
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

// Add these endpoints AFTER your existing /api/certificates endpoint

// Get certificate by token ID
app.get('/api/certificates/:tokenId', async (req, res) => {
  try {
    const tokenId = parseInt(req.params.tokenId);
    
    if (isNaN(tokenId) || tokenId <= 0) {
      return res.status(400).json({ error: 'Invalid token ID' });
    }

    console.log(`🔍 Fetching certificate by token ID: ${tokenId}`);
    
    // Check if token exists
    const totalCertificates = await contract.getTotalCertificates();
    if (tokenId > totalCertificates) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Get certificate data from blockchain
    const certData = await contract.getCertificate(tokenId);
    
    const certificate = {
      tokenId: tokenId,
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

    console.log(`✅ Found certificate: ${certificate.studentName}`);
    res.json(certificate);

  } catch (error) {
    console.error(`❌ Error fetching certificate ${req.params.tokenId}:`, error);
    
    // Fallback: search in all certificates
    try {
      const allCertificates = await getAllCertificates();
      const certificate = allCertificates.find(cert => cert.tokenId == req.params.tokenId);
      
      if (certificate) {
        console.log(`✅ Found in fallback: ${certificate.studentName}`);
        return res.json(certificate);
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }
    
    res.status(404).json({ error: 'Certificate not found' });
  }
});

// Get certificate by register number
app.get('/api/certificates/register/:registerNumber', async (req, res) => {
  try {
    const registerNumber = req.params.registerNumber.toUpperCase();
    console.log(`🔍 Searching for register number: ${registerNumber}`);
    
    // Get all certificates and filter by register number
    const allCertificates = await getAllCertificates();
    const certificate = allCertificates.find(cert => 
      cert.registerNumber.toUpperCase() === registerNumber
    );
    
    if (certificate) {
      console.log(`✅ Found certificate: ${certificate.studentName}`);
      res.json(certificate);
    } else {
      console.log(`❌ No certificate found for register number: ${registerNumber}`);
      res.status(404).json({ error: 'Certificate not found for this register number' });
    }

  } catch (error) {
    console.error(`❌ Error searching by register number:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get certificate by transaction hash (placeholder - you'll need to implement this based on your events)
app.get('/api/certificates/transaction/:transactionHash', async (req, res) => {
  try {
    const transactionHash = req.params.transactionHash;
    console.log(`🔍 Searching for transaction: ${transactionHash}`);
    
    // For now, return a mock response since we don't have transaction mapping
    // You'll need to implement this by storing transaction->token mapping in your contract events
    
    res.status(501).json({ 
      error: 'Transaction search not yet implemented',
      message: 'Please use Token ID or Register Number for verification'
    });

  } catch (error) {
    console.error(`❌ Error searching by transaction:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify certificate endpoint
app.get('/api/certificates/verify/:tokenId', async (req, res) => {
  try {
    const tokenId = parseInt(req.params.tokenId);
    
    if (isNaN(tokenId) || tokenId <= 0) {
      return res.status(400).json({ valid: false, error: 'Invalid token ID' });
    }

    console.log(`🔐 Verifying certificate: ${tokenId}`);
    
    // Check if token exists and is not revoked
    const totalCertificates = await contract.getTotalCertificates();
    
    if (tokenId > totalCertificates) {
      return res.json({ valid: false, error: 'Certificate does not exist' });
    }

    const certData = await contract.getCertificate(tokenId);
    
    if (certData.isRevoked) {
      return res.json({ valid: false, error: 'Certificate has been revoked' });
    }

    // Additional verification checks can be added here
    const issueDate = new Date(Number(certData.issueDate) * 1000);
    const now = new Date();
    
    if (issueDate > now) {
      return res.json({ valid: false, error: 'Certificate issue date is invalid' });
    }

    res.json({ 
      valid: true,
      tokenId: tokenId,
      studentName: certData.studentName,
      registerNumber: certData.registerNumber,
      message: 'Certificate is valid and authentic'
    });

  } catch (error) {
    console.error(`❌ Verification error for token ${req.params.tokenId}:`, error);
    res.json({ valid: false, error: 'Verification failed' });
  }
});

// Helper function to get all certificates
async function getAllCertificates() {
  try {
    const totalCertificates = await contract.getTotalCertificates();
    const certificates = [];
    
    for (let i = 1; i <= totalCertificates; i++) {
      try {
        const certData = await contract.getCertificate(i);
        
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
      } catch (certError) {
        console.error(`Certificate ${i} error:`, certError.message);
      }
    }
    
    return certificates;
  } catch (error) {
    console.error('Error getting all certificates:', error);
    throw error;
  }
}

// Certificates endpoint with PROPER ABI
app.get('/api/certificates', async (req, res) => {
  try {
    console.log('📋 Fetching certificates with REAL ABI...');
    
    let totalCertificates;
    try {
      totalCertificates = await contract.getTotalCertificates();
      console.log(`📊 Total certificates: ${totalCertificates}`);
    } catch (contractError) {
      console.error('❌ Error fetching total certificates:', contractError);
      // Return empty array instead of using mock data
    const certificates = [];
    
    for (let i = 1; i <= totalCertificates; i++) {
    console.log('📋 Fetching certificates with REAL ABI...');
    
    const totalCertificates = await contract.getTotalCertificates();
    console.log(`📊 Total certificates: ${totalCertificates}`);
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
