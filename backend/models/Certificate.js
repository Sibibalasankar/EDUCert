import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  certificateType: {
    type: String,
    required: true,
    enum: ['Degree', 'Diploma', 'Provisional', 'Transcript', 'CourseCompletion', 'ConsolidatedMarksheet', 'RankCertificate', 'Participation', 'Merit', 'Character']
  },
  studentName: String,
  course: String,
  cgpa: String,
  degree: String,
  department: String,
  ipfsHash: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'minted'],
    default: 'pending'
  },
  transactionHash: String,
  tokenId: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  approvedAt: Date,
  mintedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  mintedAt: Date,
  blockchainConfirmed: {
    type: Boolean,
    default: false
  },
  blockNumber: Number,
  activityLog: [{
    action: String,
    timestamp: Date,
    transactionHash: String,
    blockNumber: Number,
    updatedBy: mongoose.Schema.Types.ObjectId
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

export default mongoose.model('Certificate', certificateSchema);