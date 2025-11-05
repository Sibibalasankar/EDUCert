import jwt from 'jsonwebtoken';

// Use your existing JWT secret from .env
const JWT_SECRET = process.env.JWT_SECRET;

// More robust JWT secret check - don't throw error during import
let jwtSecretAvailable = false;

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET is not defined in environment variables');
  console.error('💡 Make sure your .env file is loaded before middleware imports');
  jwtSecretAvailable = false;
} else {
  console.log('✅ JWT Secret loaded successfully');
  jwtSecretAvailable = true;
}

// Admin authentication middleware
export const auth = async (req, res, next) => {
  try {
    if (!jwtSecretAvailable) {
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error: JWT secret not available' 
      });
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'No token provided, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Import models inside function to avoid circular dependencies
    const Admin = (await import('../models/Admin.js')).default;
    const Student = (await import('../models/Student.js')).default;
    
    // Check if it's an admin token
    if (decoded.role === 'admin') {
      const admin = await Admin.findById(decoded.id).select('-password');
      if (!admin) {
        return res.status(401).json({ 
          success: false,
          error: 'Token is not valid for admin' 
        });
      }
      req.admin = admin;
      req.user = admin;
      req.userType = 'admin';
    } 
    // Check if it's a student token
    else if (decoded.role === 'student') {
      const student = await Student.findById(decoded.id).select('-password');
      if (!student) {
        return res.status(401).json({ 
          success: false,
          error: 'Token is not valid for student' 
        });
      }
      req.student = student;
      req.user = student;
      req.userType = 'student';
    } 
    else {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token role' 
      });
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token has expired' 
      });
    }
    
    res.status(401).json({ 
      success: false,
      error: 'Token is not valid' 
    });
  }
};

// Admin-only middleware
export const adminAuth = async (req, res, next) => {
  try {
    if (!jwtSecretAvailable) {
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error: JWT secret not available' 
      });
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'No token provided, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied. Admin privileges required.' 
      });
    }

    const Admin = (await import('../models/Admin.js')).default;
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(401).json({ 
        success: false,
        error: 'Token is not valid' 
      });
    }

    req.admin = admin;
    req.user = admin;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token has expired' 
      });
    }
    
    res.status(401).json({ 
      success: false,
      error: 'Token is not valid' 
    });
  }
};

// Generate JWT token
export const generateToken = (payload) => {
  if (!jwtSecretAvailable) {
    throw new Error('JWT secret not available');
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
};

// Generate admin token
export const generateAdminToken = (adminId) => {
  return generateToken({
    id: adminId,
    role: 'admin'
  });
};

// Generate student token
export const generateStudentToken = (studentId) => {
  return generateToken({
    id: studentId,
    role: 'student'
  });
};

// Verify token (utility function)
export const verifyToken = (token) => {
  if (!jwtSecretAvailable) {
    throw new Error('JWT secret not available');
  }
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export default {
  auth,
  adminAuth,
  generateToken,
  generateAdminToken,
  generateStudentToken,
  verifyToken
};