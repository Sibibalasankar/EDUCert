import Student from '../models/Student.js';
import { getContract } from '../utils/web3.js';

export const mintCertificate = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ 
        success: false,
        error: 'Student not found' 
      });
    }

    const contract = getContract();
    const [canMint, message] = await contract.canIMint(studentId);
    
    if (!canMint) {
      return res.status(400).json({
        success: false,
        error: message
      });
    }

    res.json({
      success: true,
      message: 'You are eligible to mint. Please connect your wallet in the frontend to proceed.',
      canMint: true
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

export const verifyCertificate = async (req, res) => {
  try {
    const { studentId } = req.params;

    const contract = getContract();
    const certificate = await contract.verifyCertificate(studentId);

    res.json({
      success: true,
      verified: certificate.exists,
      certificate: {
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        grade: certificate.grade,
        ipfsHash: certificate.ipfsHash,
        issueDate: new Date(Number(certificate.issueDate) * 1000),
        mintedBy: certificate.mintedBy,
        exists: certificate.exists
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

export const getCertificateStatus = async (req, res) => {
  try {
    const { studentId } = req.params;

    const contract = getContract();
    const [canMint, message] = await contract.canIMint(studentId);
    const certificate = await contract.getCertificate(studentId);
    const eligibility = await contract.getStudentEligibility(studentId);

    res.json({
      success: true,
      canMint,
      message,
      certificate: {
        isMinted: certificate.isMinted,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        issueDate: certificate.issueDate
      },
      eligibility
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};