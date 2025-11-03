import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: true
  },
  yearOfPassing: {
    type: Number,
    required: true
  },
  walletAddress: {
    type: String,
    default: '' // Change from null to empty string
  },
  phone: {
    type: String,
    default: '' // Add this field with default
  },
  cgpa: {
    type: String,
    default: '' // Add this field with default
  },
  degree: {
    type: String,
    default: '' // Add this field with default
  },
  currentSemester: {
    type: Number,
    default: 1 // Add this field with default
  },
  eligibilityStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  certificates: [{
    certificateId: String,
    ipfsHash: String,
    courseName: String,
    grade: String,
    issueDate: Date,
    transactionHash: String,
    status: {
      type: String,
      enum: ['minted', 'pending'],
      default: 'pending'
    }
  }],
  approvedBy: {
    type: String,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Student', studentSchema);