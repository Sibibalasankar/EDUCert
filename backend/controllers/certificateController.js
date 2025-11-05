import Certificate from '../models/Certificate.js';
import Student from '../models/Student.js';

// Create a new certificate
export const createCertificate = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { certificateType, courseName, grade, issueDate } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const certificate = await Certificate.create({
      student: studentId,
      certificateType,
      courseName,
      grade,
      issueDate
    });

    student.certificates.push(certificate._id);
    await student.save();

    res.status(201).json({ success: true, certificate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all certificates for a student
export const getStudentCertificates = async (req, res) => {
  try {
    const { studentId } = req.params;
    const certificates = await Certificate.find({ student: studentId });
    res.json({ success: true, certificates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Approve a certificate
export const approveCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { approvedBy } = req.body;

    const certificate = await Certificate.findById(certificateId);
    if (!certificate) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }

    certificate.status = 'approved';
    certificate.approvedBy = approvedBy;
    certificate.approvedAt = new Date();
    await certificate.save();

    res.json({ success: true, certificate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mint a certificate
export const mintCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { transactionHash, tokenId, ipfsHash } = req.body;

    const certificate = await Certificate.findById(certificateId);
    if (!certificate) {
      return res.status(404).json({ success: false, error: 'Certificate not found' });
    }

    certificate.status = 'minted';
    certificate.transactionHash = transactionHash;
    certificate.tokenId = tokenId;
    certificate.ipfsHash = ipfsHash;
    certificate.mintedAt = new Date();
    await certificate.save();

    res.json({ success: true, certificate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};