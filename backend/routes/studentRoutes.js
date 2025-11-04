// routes/students.js - Add these routes
import express from 'express';
import { 
  registerStudent,
  approveStudent,
  getStudentStatus,
  getAllStudents,
  revokeApproval,
  updateCertificateStatus, // ✅ ADD THIS
  mintCertificate, // ✅ ADD THIS
  getStudentCertificates, // ✅ ADD THIS
  updateStudent,
  deleteStudent,
  updateStudentProfile // ✅ NEW: Added for profile updates
} from '../controllers/studentController.js';

import {
  mintCertificate as mintBlockchainCertificate,
  verifyCertificate,
  getCertificateStatus
} from '../controllers/certificateController.js';

const router = express.Router();

// Student routes
router.post('/register', registerStudent);
router.get('/all', getAllStudents);
router.get('/:studentId', getStudentStatus);
router.put('/:studentId', updateStudent); 
router.delete('/:studentId', deleteStudent);
router.put('/:studentId/profile', updateStudentProfile); // ✅ NEW: Profile update endpoint

// ✅ NEW: Certificate management routes
router.post('/:studentId/approve', approveStudent);
router.put('/:studentId/certificate-status', updateCertificateStatus); // ✅ ADD THIS
router.post('/:studentId/mint', mintCertificate); // ✅ ADD THIS
router.get('/:studentId/certificates', getStudentCertificates); // ✅ ADD THIS
router.delete('/:studentId/revoke', revokeApproval);

// Certificate routes  
router.post('/:studentId/mint-blockchain', mintBlockchainCertificate);
router.get('/:studentId/verify', verifyCertificate);
router.get('/:studentId/certificate-status', getCertificateStatus);

export default router;