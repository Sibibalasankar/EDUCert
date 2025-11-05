// ✅ Load environment variables FIRST - before any other imports
import dotenv from 'dotenv';
dotenv.config();

// ✅ Debug: Check if environment variables are loaded immediately
console.log('🔧 Environment Variables Check:');
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Loaded' : '❌ Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Loaded' : '❌ Missing');
console.log('SEPOLIA_RPC_URL:', process.env.SEPOLIA_RPC_URL ? '✅ Loaded' : '❌ Missing');

// ✅ Now import other modules after .env is loaded
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import studentRoutes from './routes/studentRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/admin', adminRoutes);

// ✅ ADD HEALTH CHECK ENDPOINT
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    env: {
      port: process.env.PORT,
      node_env: process.env.NODE_ENV,
      jwt_secret_loaded: !!process.env.JWT_SECRET,
      mongodb_loaded: !!process.env.MONGODB_URI
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'EduCert Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      students: '/api/students',
      certificates: '/api/certificates',
      admin: '/api/admin'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});