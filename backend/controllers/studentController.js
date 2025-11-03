import Student from '../models/Student.js';
import { getContract } from '../utils/web3.js';

export const registerStudent = async (req, res) => {
  try {
    const { studentId, name, email, department, yearOfPassing } = req.body;

    const student = new Student({
      studentId,
      name,
      email,
      department,
      yearOfPassing
    });

    await student.save();

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      student
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

export const approveStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseName, grade, ipfsHash } = req.body;

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ 
        success: false,
        error: 'Student not found' 
      });
    }

    const contract = getContract();
    const tx = await contract.allowStudentToMint(
      studentId,
      student.name,
      courseName,
      grade,
      ipfsHash
    );
    
    await tx.wait();

    student.eligibilityStatus = 'approved';
    student.approvedAt = new Date();
    student.certificates.push({
      courseName,
      grade,
      ipfsHash,
      status: 'pending'
    });

    await student.save();

    res.json({
      success: true,
      message: 'Student approved for certificate minting',
      transactionHash: tx.hash,
      student
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

export const getStudentStatus = async (req, res) => {
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
    const eligibility = await contract.getStudentEligibility(studentId);

    res.json({
      success: true,
      student,
      blockchainStatus: {
        canMint,
        message,
        eligibility
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

export const revokeApproval = async (req, res) => {
  try {
    const { studentId } = req.params;

    const contract = getContract();
    const tx = await contract.revokeStudentEligibility(studentId);
    await tx.wait();

    const student = await Student.findOne({ studentId });
    if (student) {
      student.eligibilityStatus = 'rejected';
      await student.save();
    }

    res.json({
      success: true,
      message: 'Student approval revoked',
      transactionHash: tx.hash
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};