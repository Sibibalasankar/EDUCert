const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');

const app = express();
app.use(cors());
app.use(express.json());

// Contract configuration
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const CONTRACT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function owner() view returns (address)",
  "function getCertificate(uint256 tokenId) view returns (tuple(string studentName, string registerNumber, string course, string degree, string cgpa, string certificateType, uint256 issueDate, string ipfsHash, string department, string batch, uint256 yearOfPassing, bool isRevoked))",
  "function getCertificateByRegisterNumber(string registerNumber) view returns (tuple(string studentName, string registerNumber, string course, string degree, string cgpa, string certificateType, uint256 issueDate, string ipfsHash, string department, string batch, uint256 yearOfPassing, bool isRevoked))",
  "function verifyCertificate(uint256 tokenId) view returns (bool)",
  "function getTotalCertificates() view returns (uint256)",
  "function collegeAuthorities(address) view returns (bool)",
  "function mintCertificate(address studentAddress, string studentName, string registerNumber, string course, string degree, string cgpa, string certificateType, string ipfsHash, string department, string batch, uint256 yearOfPassing) external",
  "event CertificateMinted(uint256 indexed tokenId, address indexed studentAddress, string registerNumber, string ipfsHash)"
];

// Use JsonRpcProvider from ethers directly (v6 syntax)
const provider = new ethers.JsonRpcProvider('http://localhost:8545');
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Backend is running', 
    contract: CONTRACT_ADDRESS,
    network: 'localhost:8545'
  });
});

app.get('/api/certificates/verify/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const isValid = await contract.verifyCertificate(tokenId);
    const certificate = await contract.getCertificate(tokenId);
    
    res.json({
      valid: isValid,
      certificate: certificate,
      tokenId: parseInt(tokenId)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/certificates/verify-register/:registerNumber', async (req, res) => {
  try {
    const { registerNumber } = req.params;
    const certificate = await contract.getCertificateByRegisterNumber(registerNumber);
    const isValid = !certificate.isRevoked;
    
    res.json({
      valid: isValid,
      certificate: certificate,
      registerNumber: registerNumber
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/certificates', async (req, res) => {
  try {
    const totalCertificates = await contract.getTotalCertificates();
    const certificates = [];
    
    console.log(`Found ${totalCertificates} certificates on blockchain`);
    
    // Fetch all certificates
    for (let i = 1; i <= totalCertificates; i++) {
      try {
        const cert = await contract.getCertificate(i);
        certificates.push({
          tokenId: i,
          studentName: cert.studentName,
          registerNumber: cert.registerNumber,
          course: cert.course,
          degree: cert.degree,
          cgpa: cert.cgpa,
          certificateType: cert.certificateType,
          issueDate: new Date(Number(cert.issueDate) * 1000).toISOString(),
          ipfsHash: cert.ipfsHash,
          department: cert.department,
          batch: cert.batch,
          yearOfPassing: Number(cert.yearOfPassing),
          isRevoked: cert.isRevoked,
          status: cert.isRevoked ? 'Revoked' : 'Active'
        });
      } catch (error) {
        console.log(`Skipping token ${i}: ${error.message}`);
        continue;
      }
    }
    
    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get contract info
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📝 Contract address: ${CONTRACT_ADDRESS}`);
  console.log(`🔗 Blockchain: http://localhost:8545`);
});