import express from 'express';
import {
  registerStudent,
  getAllStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  approveStudent, // ✅ ADD THIS
  getStudentByRegisterNumber, // ✅ ADD THIS
  bulkRegisterStudents, // ✅ ADD THIS (optional)
  getStudentCertificates // ✅ ADD THIS
} from '../controllers/studentController.js';

const router = express.Router();

// Student routes
router.post('/register', registerStudent);
router.get('/all', getAllStudents);
router.get('/:studentId', getStudent);
router.put('/:studentId', updateStudent);
router.delete('/:studentId', deleteStudent);

// ✅ ADD THESE NEW ROUTES:
router.post('/:studentId/approve', approveStudent);
router.get('/register/:registerNumber', getStudentByRegisterNumber);
router.post('/bulk-register', bulkRegisterStudents); // Optional
router.get('/:studentId/certificates', getStudentCertificates);

export default router;