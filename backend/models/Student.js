import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  certificateType: {
    type: String,
    required: true,
    enum: ['Degree', 'Provisional', 'ConsolidatedMarksheet', 'CourseCompletion', 'Transcript', 'Diploma', 'RankCertificate', 'Participation', 'Merit', 'Character']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'minted', 'rejected'],
    default: 'pending'
  },
  transactionHash: String,
  ipfsHash: String,
  approvedBy: String,
  approvedAt: Date,
  mintedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

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
    required: true
  },
  department: {
    type: String,
    required: true
  },
  yearOfPassing: Number,
  walletAddress: String,
  phone: String,
  cgpa: String,
  degree: String,
  currentSemester: Number,
  
  // ✅ FIXED: Properly define certificates as an array of subdocuments
  certificates: [certificateSchema],
  
  eligibilityStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// ✅ ADD: Pre-save middleware to update updatedAt for certificates
studentSchema.pre('save', function(next) {
  if (this.certificates && this.isModified('certificates')) {
    this.certificates.forEach(cert => {
      if (cert.isModified()) {
        cert.updatedAt = new Date();
      }
    });
  }
  next();
});

const Student = mongoose.model('Student', studentSchema);

export default Student;