const Student = require('../models/Student');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const ipfsUtil = require('../utils/ipfs');

class CertificateController {
  constructor() {
    // Read contract details from deployment info
    const deploymentInfoPath = path.join(__dirname, '../../blockchain/deployment-info.json');
    const contractABIPath = path.join(__dirname, '../../blockchain/artifacts/contracts/CertificateNFT.sol/CertificateNFT.json');
    
    let contractAddress;
    let contractABI;
    
    try {
      const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, 'utf8'));
      contractAddress = deploymentInfo.contractAddress;
      
      const contractData = JSON.parse(fs.readFileSync(contractABIPath, 'utf8'));
      contractABI = contractData.abi;
    } catch (error) {
      console.error('Error loading contract details:', error);
    }
    
    // Initialize with contract details
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', this.provider);
    this.contract = new ethers.Contract(contractAddress, contractABI, this.wallet);
  }

  // Issue new certificate
  async issueCertificate(req, res) {
    try {
      const {
        name,
        registerNumber,
        email,
        course,
        degree,
        cgpa,
        walletAddress,
        certificateType,
        department,
        batch,
        yearOfPassing
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

      // Create certificate metadata
      const metadata = {
        name: `${name}'s ${certificateType} Certificate`,
        description: `${certificateType} Certificate for ${course} - ${degree}`,
        attributes: {
          studentName: name,
          registerNumber,
          course,
          degree,
          cgpa,
          certificateType: certificateType || 'Degree',
          department: department || 'Computer Science',
          batch: batch || '2022-2026',
          yearOfPassing: yearOfPassing || 2026
        }
      };

      // Upload to IPFS
      const ipfsHash = await ipfsUtil.uploadToIPFS(metadata);

      // Mint certificate on blockchain
      const tx = await this.contract.mintCertificate(
        walletAddress,
        name,
        registerNumber,
        course,
        degree,
        cgpa,
        certificateType || 'Degree',
        ipfsHash,
        department || 'Computer Science',
        batch || '2022-2026',
        yearOfPassing || 2026
      );

      const receipt = await tx.wait();
      
      // Get token ID from event logs
      const event = receipt.logs.find(log => 
        log.topics[0] === ethers.id("CertificateMinted(uint256,address,string,string)")
      );
      
      const tokenId = parseInt(event.topics[1], 16);

      // Create certificate record
      const certificate = {
        tokenId,
        transactionHash: receipt.hash,
        ipfsHash,
        issueDate: new Date(),
        certificateType: certificateType || 'Degree',
        course,
        degree,
        cgpa,
        department: department || 'Computer Science',
        batch: batch || '2022-2026',
        yearOfPassing: yearOfPassing || 2026
      };

      // Add certificate to student
      student.certificates.push(certificate);
      await student.save();

      res.json({
        success: true,
        message: 'Certificate issued successfully',
        certificate,
        student: {
          name: student.name,
          registerNumber: student.registerNumber
        }
      });

    } catch (error) {
      console.error('Error issuing certificate:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to issue certificate: ' + error.message
      });
    }
  }

  // Get all certificates
  async getAllCertificates(req, res) {
    try {
      // Check for filter parameters
      const { registerNumber, transactionHash } = req.query;
      
      // Get total certificates from blockchain
      const totalCertificates = await this.contract.getTotalCertificates();
      const certificatesArray = [];
      
      // Fetch certificate details from blockchain and database
      for (let i = 1; i <= totalCertificates; i++) {
        try {
          const certData = await this.contract.getCertificate(i);
          
          // Find student in database
          const student = await Student.findOne({ registerNumber: certData.registerNumber });
          
          if (student) {
            // Find matching certificate in student record
            const dbCert = student.certificates.find(c => c.tokenId === i);
            
            // Apply filters if provided
            if (registerNumber && certData.registerNumber !== registerNumber) {
              continue;
            }
            
            if (transactionHash && dbCert && dbCert.transactionHash !== transactionHash) {
              continue;
            }
            
            certificatesArray.push({
              _id: dbCert ? dbCert._id : null,
              tokenId: i,
              studentName: certData.studentName,
              registerNumber: certData.registerNumber,
              course: certData.course,
              degree: certData.degree,
              cgpa: certData.cgpa,
              certificateType: certData.certificateType,
              issueDate: new Date(certData.issueDate * 1000), // Convert from Unix timestamp
              department: certData.department,
              batch: certData.batch,
              yearOfPassing: certData.yearOfPassing,
              isRevoked: certData.isRevoked,
              transactionHash: dbCert ? dbCert.transactionHash : null,
              ipfsHash: certData.ipfsHash
            });
          }
        } catch (err) {
          console.error(`Error fetching certificate ${i}:`, err);
          // Continue to next certificate if one fails
          continue;
        }
      }
      
      // If filtering by registerNumber or transactionHash and no results, return 404
      if ((registerNumber || transactionHash) && certificatesArray.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No certificates found matching the criteria'
        });
      }

      res.json({
        success: true,
        certificates: certificatesArray
      });
    } catch (error) {
      console.error('Error fetching certificates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch certificates: ' + error.message
      });
    }
  }
  
  // Get certificate by token ID
  async getCertificateById(req, res) {
    try {
      const { tokenId } = req.params;
      
      // Get certificate from blockchain
      const certData = await this.contract.getCertificate(tokenId);
      
      // Find student in database
      const student = await Student.findOne({ registerNumber: certData.registerNumber });
      
      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'Student not found'
        });
      }
      
      // Find matching certificate in student record
      const dbCert = student.certificates.find(c => c.tokenId === parseInt(tokenId));
      
      if (!dbCert) {
        return res.status(404).json({
          success: false,
          error: 'Certificate not found in database'
        });
      }
      
      const certificate = {
        _id: dbCert._id,
        tokenId: parseInt(tokenId),
        studentName: certData.studentName,
        registerNumber: certData.registerNumber,
        course: certData.course,
        degree: certData.degree,
        cgpa: certData.cgpa,
        certificateType: certData.certificateType,
        issueDate: new Date(certData.issueDate * 1000), // Convert from Unix timestamp
        department: certData.department,
        batch: certData.batch,
        yearOfPassing: certData.yearOfPassing,
        isRevoked: certData.isRevoked,
        transactionHash: dbCert.transactionHash,
        ipfsHash: certData.ipfsHash
      };
      
      res.json({
        success: true,
        certificate
      });
    } catch (error) {
      console.error('Error fetching certificate:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch certificate: ' + error.message
      });
    }
  }
  
  // Verify certificate on blockchain
  async verifyCertificate(req, res) {
    try {
      const { tokenId } = req.params;
      
      // Check if token exists by trying to get certificate data
      const certData = await this.contract.getCertificate(tokenId).catch(() => null);
      
      if (!certData) {
        return res.status(404).json({
          success: false,
          valid: false,
          error: 'Certificate does not exist on the blockchain'
        });
      }
      
      // Find student in database
      const student = await Student.findOne({ registerNumber: certData.registerNumber });
      
      if (!student) {
        return res.status(404).json({
          success: false,
          valid: false,
          error: 'Student not found in database'
        });
      }
      
      // Find matching certificate in student record
      const dbCert = student.certificates.find(c => c.tokenId === parseInt(tokenId));
      
      if (!dbCert) {
        return res.status(404).json({
          success: false,
          valid: false,
          error: 'Certificate exists on blockchain but not in database'
        });
      }
      
      if (certData.isRevoked) {
        return res.json({
          success: true,
          valid: false,
          message: 'Certificate has been revoked',
          certificate: {
            tokenId: parseInt(tokenId),
            studentName: certData.studentName,
            registerNumber: certData.registerNumber,
            course: certData.course,
            degree: certData.degree,
            certificateType: certData.certificateType
          }
        });
      }
      
      // Certificate is valid
      res.json({
        success: true,
        valid: true,
        message: 'Certificate is valid and verified on blockchain',
        certificate: {
          tokenId: parseInt(tokenId),
          studentName: certData.studentName,
          registerNumber: certData.registerNumber,
          course: certData.course,
          degree: certData.degree,
          cgpa: certData.cgpa,
          certificateType: certData.certificateType,
          issueDate: new Date(certData.issueDate * 1000),
          department: certData.department,
          batch: certData.batch,
          yearOfPassing: certData.yearOfPassing,
          ipfsHash: certData.ipfsHash
        }
      });
    } catch (error) {
      console.error('Error verifying certificate:', error);
      res.status(500).json({
        success: false,
        valid: false,
        error: 'Failed to verify certificate: ' + error.message
      });
    }
  }
}

module.exports = new CertificateController();