// controllers/studentController.js
import Student from '../models/Student.js';

// Add approveStudent function
export const approveStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }
    
    student.eligibilityStatus = 'approved';
    await student.save();
    
    res.json({
      success: true,
      message: `Student ${studentId} has been approved`,
      student
    });
  } catch (error) {
    console.error('Error approving student:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get student status
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
    
    res.json({
      success: true,
      student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all students
export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
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

// Revoke student approval
export const revokeApproval = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findOne({ studentId });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }
    
    student.eligibilityStatus = 'rejected';
    await student.save();
    
    res.json({
      success: true,
      message: `Student ${studentId} approval has been revoked`,
      student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update certificate status
export const updateCertificateStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { certificateType, status, transactionHash, tokenId, ipfsHash } = req.body;

    console.log('🔄 Updating certificate status:', { studentId, certificateType, status });

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Find the certificate or create if doesn't exist
    let certificate = student.certificates.find(cert => 
      cert.certificateType === certificateType
    );

    if (certificate) {
      // Update existing certificate
      certificate.status = status;
      if (transactionHash) certificate.transactionHash = transactionHash;
      if (tokenId) certificate.tokenId = tokenId;
      if (ipfsHash) certificate.ipfsHash = ipfsHash;
      
      if (status === 'minted') {
        certificate.mintedAt = new Date();
      }
    } else {
      // Create new certificate entry
      student.certificates.push({
        certificateType,
        status,
        transactionHash,
        tokenId,
        ipfsHash,
        ...(status === 'minted' && { mintedAt: new Date() })
      });
    }

    await student.save();

    res.json({
      success: true,
      message: `Certificate status updated to ${status}`,
      student
    });
  } catch (error) {
    console.error('❌ Error updating certificate status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Mint certificate
export const mintCertificate = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { certificateType } = req.body;
    
    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }
    
    // Add certificate to student's certificates array
    student.certificates.push({
      certificateType,
      issueDate: new Date(),
      status: 'issued'
    });
    
    await student.save();
    
    res.json({
      success: true,
      message: `Certificate minted for student ${studentId}`,
      student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get student certificates
export const getStudentCertificates = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    console.log(`🔍 Fetching certificates for student: ${studentId}`);
    
    // Find student with the given ID
    const student = await Student.findOne({ studentId });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }
    
    // Return student details and certificates
    res.json({
      success: true,
      student: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        department: student.department,
        yearOfPassing: student.yearOfPassing,
        eligibilityStatus: student.eligibilityStatus,
        walletAddress: student.walletAddress,
        phone: student.phone,
        cgpa: student.cgpa,
        degree: student.degree,
        currentSemester: student.currentSemester
      },
      certificates: student.certificates || []
    });
    
  } catch (error) {
    console.error('❌ Error fetching student certificates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Register a new student
export const registerStudent = async (req, res) => {
  try {
    const { 
      studentId, 
      name, 
      email, 
      department, 
      yearOfPassing,
      walletAddress,
      phone,
      cgpa,
      degree,
      currentSemester
    } = req.body;

    console.log('📝 Registering new student:', { studentId, name });

    // Check if student already exists
    const existingStudent = await Student.findOne({ 
      $or: [{ studentId }, { email }] 
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        error: 'Student with this ID or email already exists'
      });
    }

    // Create new student with all fields
    const student = await Student.create({
      studentId,
      name,
      email,
      department,
      yearOfPassing,
      walletAddress: walletAddress || '',
      phone: phone || '',
      cgpa: cgpa || '',
      degree: degree || '',
      currentSemester: currentSemester || 1,
      eligibilityStatus: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      student
    });

  } catch (error) {
    console.error('❌ Error registering student:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update student
export const updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const updateData = req.body;
    
    console.log('🔄 Updating student:', studentId);
    
    const student = await Student.findOne({ studentId });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }
    
    // Update only provided fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== '') {
        student[key] = updateData[key];
      }
    });
    
    await student.save();
    
    res.json({
      success: true,
      message: 'Student updated successfully',
      student
    });
    
  } catch (error) {
    console.error('❌ Error updating student:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update student profile
export const updateStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { walletAddress, phone, cgpa, degree, currentSemester } = req.body;
    
    console.log('🔄 Updating student profile:', studentId);
    
    const student = await Student.findOne({ studentId });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Update profile fields - explicitly set even if empty string
    student.walletAddress = walletAddress;
    student.phone = phone;
    student.cgpa = cgpa;
    student.degree = degree;
    if (currentSemester) student.currentSemester = currentSemester;

    await student.save();

    res.json({
      success: true,
      message: 'Student profile updated successfully',
      student
    });

  } catch (error) {
    console.error('❌ Error updating student profile:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete a student
export const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    console.log('🗑️ Deleting student:', studentId);
    
    const student = await Student.findOneAndDelete({ studentId });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting student:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};