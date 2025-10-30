const Student = require('../models/Student');
const { ethers } = require('ethers');

class CertificateController {
  constructor() {
    // Initialize with your contract details
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    // this.contract = new ethers.Contract(contractAddress, contractABI, this.wallet);
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

      // Generate mock certificate data (replace with actual blockchain call)
      const mockCertificate = {
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
      student.certificates.push(mockCertificate);
      await student.save();

      res.json({
        success: true,
        message: 'Certificate issued successfully',
        certificate: mockCertificate,
        student: {
          name: student.name,
          registerNumber: student.registerNumber
        }
      });

    } catch (error) {
      console.error('Error issuing certificate:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to issue certificate'
      });
    }
  }

  // Get all certificates
  async getAllCertificates(req, res) {
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

      res.json({
        success: true,
        certificates
      });
    } catch (error) {
      console.error('Error fetching certificates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch certificates'
      });
    }
  }
}

module.exports = new CertificateController();