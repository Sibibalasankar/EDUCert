import express from 'express';
import { 
  registerStudent,
  approveStudent,
  getStudentStatus,
  getAllStudents,
  revokeApproval,
  updateStudent // ✅ ADD THIS IMPORT
} from '../controllers/studentController.js';

import {
  mintCertificate,
  verifyCertificate,
  getCertificateStatus
} from '../controllers/certificateController.js';

const router = express.Router();

// Student routes
router.post('/register', registerStudent);
router.get('/all', getAllStudents);
router.get('/:studentId', getStudentStatus);
router.put('/:studentId', updateStudent); // ✅ ADD THIS ROUTE
router.post('/:studentId/approve', approveStudent);
router.post('/:studentId/revoke', revokeApproval);

// Certificate routes  
router.post('/:studentId/mint', mintCertificate);
router.get('/:studentId/verify', verifyCertificate);
router.get('/:studentId/certificate-status', getCertificateStatus);

export default router;