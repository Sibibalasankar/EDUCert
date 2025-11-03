import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    if (config.data) {
      console.log('📦 Request Data:', config.data);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    
    if (error.response?.status === 404) {
      console.error('❌ Endpoint not found:', error.config.url);
    } else if (error.response?.status === 500) {
      console.error('❌ Server error:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to server. Is the backend running?');
    }
    
    return Promise.reject(error);
  }
);

// ✅ UPDATE THIS in services/api.js
export const studentAPI = {
  getAllStudents: () => api.get('/students/all'),
  getStudent: (studentId) => api.get(`/students/${studentId}`),
  registerStudent: (studentData) => api.post('/students/register', studentData),
  updateStudent: (studentId, studentData) => api.put(`/students/${studentId}`, studentData), // ✅ CHANGED
  deleteStudent: (studentId) => api.delete(`/students/${studentId}`),
  approveStudent: (studentId, certificateData) => 
    api.post(`/students/${studentId}/approve`, certificateData),
  getCertificateStatus: (studentId) => 
    api.get(`/students/${studentId}/certificate-status`),
  verifyCertificate: (studentId) => 
    api.get(`/students/${studentId}/verify`),
};