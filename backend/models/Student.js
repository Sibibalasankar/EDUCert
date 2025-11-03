import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  yearOfPassing: {
    type: Number,
    required: [true, 'Year of passing is required'],
    min: [2000, 'Year must be after 2000'],
    max: [2030, 'Year must be before 2030']
  },
  walletAddress: {
    type: String,
    default: '',
    trim: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  cgpa: {
    type: String,
    default: '',
    trim: true
  },
  degree: {
    type: String,
    default: '',
    trim: true
  },
  currentSemester: {
    type: Number,
    default: 1,
    min: [1, 'Semester must be at least 1'],
    max: [8, 'Semester cannot exceed 8']
  },
  eligibilityStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  certificates: [{
    certificateId: {
      type: String,
      trim: true
    },
    ipfsHash: {
      type: String,
      trim: true
    },
    courseName: {
      type: String,
      trim: true
    },
    grade: {
      type: String,
      trim: true
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    transactionHash: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['minted', 'pending'],
      default: 'pending'
    }
  }],
  approvedBy: {
    type: String,
    default: null,
    trim: true
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

// Add index for better performance
studentSchema.index({ studentId: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ department: 1 });
studentSchema.index({ eligibilityStatus: 1 });

export default mongoose.model('Student', studentSchema);