import express from 'express';
import { 
  registerStudent,
  approveStudent,
  getStudentStatus,
  getAllStudents,
  revokeApproval
} from '../controllers/studentController.js';

import {
  mintCertificate,
  verifyCertificate,
  getCertificateStatus
} from '../controllers/certificateController.js';

const router = express.Router();

router.post('/register', registerStudent);
router.get('/all', getAllStudents);
router.get('/:studentId', getStudentStatus);
router.post('/:studentId/approve', approveStudent);
router.post('/:studentId/revoke', revokeApproval);
router.post('/:studentId/mint', mintCertificate);
router.get('/:studentId/verify', verifyCertificate);
router.get('/:studentId/certificate-status', getCertificateStatus);

export default router;