import Student from '../models/Student.js';

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

    // ✅ FIX: Case-insensitive check for existing student
    const existingStudent = await Student.findOne({ 
      $or: [
        { studentId: { $regex: new RegExp(`^${studentId}$`, 'i') } },
        { email: { $regex: new RegExp(`^${email}$`, 'i') } }
      ]
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        error: 'Student with this ID or email already exists'
      });
    }

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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all students
export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().populate('certificates');
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

// Get a single student
export const getStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId).populate('certificates');
    
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

// Update a student
export const updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const updateData = req.body;
    
    const student = await Student.findByIdAndUpdate(studentId, updateData, { new: true });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Student updated successfully',
      student
    });
    
  } catch (error) {
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
    
    const student = await Student.findByIdAndDelete(studentId);
    
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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Approve student for certificate minting
export const approveStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { certificateType, transactionHash, ipfsHash, approvedBy, approvedAt } = req.body;

    console.log('📝 Approving student:', { studentId, certificateType, transactionHash });

    // Find student by studentId (register number)
    const student = await Student.findOne({ 
      studentId: studentId 
    });

    if (!student) {
      console.log('❌ Student not found with studentId:', studentId);
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    console.log('✅ Found student:', student.name);

    const now = new Date();

    // Check if certificate type already exists
    const existingCertIndex = student.certificates.findIndex(
      cert => cert.certificateType === certificateType
    );

    if (existingCertIndex !== -1) {
      // Update existing certificate
      student.certificates[existingCertIndex].status = 'approved';
      student.certificates[existingCertIndex].transactionHash = transactionHash;
      student.certificates[existingCertIndex].ipfsHash = ipfsHash;
      student.certificates[existingCertIndex].approvedBy = approvedBy;
      student.certificates[existingCertIndex].approvedAt = approvedAt || now;
      student.certificates[existingCertIndex].updatedAt = now;
      
      console.log('✅ Updated existing certificate approval');
    } else {
      // Add new certificate approval
      student.certificates.push({
        certificateType,
        status: 'approved',
        transactionHash,
        ipfsHash,
        approvedBy,
        approvedAt: approvedAt || now,
        createdAt: now,
        updatedAt: now
      });
      console.log('✅ Added new certificate approval');
    }

    await student.save();
    console.log('✅ Student saved successfully');

    res.json({
      success: true,
      message: `Student approved for ${certificateType} certificate`,
      student: {
        _id: student._id,
        name: student.name,
        studentId: student.studentId,
        certificates: student.certificates
      }
    });

  } catch (error) {
    console.error('❌ Error approving student:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve student: ' + error.message
    });
  }
};
// Get student by register number
export const getStudentByRegisterNumber = async (req, res) => {
  try {
    const { registerNumber } = req.params;
    
    const student = await Student.findOne({ 
      $or: [
        { studentId: registerNumber },
        { registerNumber: registerNumber }
      ]
    });

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
    console.error('Error fetching student by register number:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student: ' + error.message
    });
  }
};

// Get student certificates
export const getStudentCertificates = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Find student by ID or studentId
    const student = await Student.findOne({
      $or: [
        { _id: studentId },
        { studentId: studentId }
      ]
    });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    res.json({
      success: true,
      certificates: student.certificates || []
    });
  } catch (error) {
    console.error('Error fetching student certificates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch student certificates: ' + error.message
    });
  }
};

// Bulk register students (optional)
export const bulkRegisterStudents = async (req, res) => {
  try {
    const { students } = req.body;
    
    if (!Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        error: 'Students data must be an array'
      });
    }

    // Validate each student has required fields
    for (const student of students) {
      if (!student.studentId || !student.name || !student.email || !student.department) {
        return res.status(400).json({
          success: false,
          error: 'Each student must have studentId, name, email, and department'
        });
      }
    }

    const results = await Student.insertMany(students, { ordered: false });
    
    res.json({
      success: true,
      message: `Successfully registered ${results.length} students`,
      students: results
    });
  } catch (error) {
    console.error('Error bulk registering students:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk register students: ' + error.message
    });
  }
};