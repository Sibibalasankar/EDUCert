const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  registerNumber: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  degree: {
    type: String,
    required: true
  },
  cgpa: {
    type: String,
    required: true
  },
  walletAddress: {
    type: String
  },
  certificates: [{
    tokenId: Number,
    transactionHash: String,
    ipfsHash: String,
    issueDate: Date,
    certificateType: String,
    course: String,
    degree: String,
    cgpa: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);