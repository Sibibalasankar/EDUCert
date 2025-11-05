import express from 'express';
import {
  getStats,
  getPendingApprovals,
  bulkApproveStudents
} from '../controllers/adminController.js';

const router = express.Router();

// Admin routes
router.get('/stats', getStats);
router.get('/pending-approvals', getPendingApprovals);
router.post('/bulk-approve', bulkApproveStudents);

export default router;