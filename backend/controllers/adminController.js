import Student from '../models/Student.js';
import Certificate from '../models/Certificate.js';

// Get admin dashboard stats
export const getStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalCertificates = await Certificate.countDocuments();
    const pendingApprovals = await Certificate.countDocuments({ status: 'pending' });
    const mintedCertificates = await Certificate.countDocuments({ status: 'minted' });

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalCertificates,
        pendingApprovals,
        mintedCertificates
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// Get pending certificate approvals
export const getPendingApprovals = async (req, res) => {
  try {
    const pendingCertificates = await Certificate.find({ status: 'pending' })
      .populate('studentId', 'name studentId email department')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      pendingApprovals: pendingCertificates
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ error: 'Failed to fetch pending approvals' });
  }
};

// Bulk approve students
export const bulkApproveStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ error: 'Student IDs must be an array' });
    }

    const result = await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: { eligibilityStatus: 'approved' } }
    );

    res.json({
      success: true,
      message: `Approved ${result.modifiedCount} students`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk approving students:', error);
    res.status(500).json({ error: 'Failed to bulk approve students' });
  }
};