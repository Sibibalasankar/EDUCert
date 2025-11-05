import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('studentToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const studentAPI = {
  getAllStudents: () => api.get('/students/all'),
  getStudent: (studentId) => api.get(`/students/${studentId}`),
  registerStudent: (studentData) => api.post('/students/register', studentData),
  updateStudent: (studentId, studentData) => api.put(`/students/${studentId}`, studentData),
  deleteStudent: (studentId) => api.delete(`/students/${studentId}`),
  approveStudent: (studentId, approvalData) => api.post(`/students/${studentId}/approve`, approvalData),
  getStudentByRegisterNumber: (registerNumber) => api.get(`/students/register/${registerNumber}`),
  bulkRegisterStudents: (studentsData) => api.post('/students/bulk-register', studentsData),
  getStudentCertificates: (studentId) => api.get(`/students/${studentId}/certificates`),
};

export const certificateAPI = {
  // ✅ FIXED: Match backend routes exactly
  createCertificate: (certificateData) => api.post('/certificates/create', certificateData),
  getStudentCertificates: (studentId) => api.get(`/certificates/student/${studentId}`),
  approveCertificate: (certificateId, approvalData) => api.put(`/certificates/approve/${certificateId}`, approvalData),
  mintCertificate: (certificateId, mintData) => api.post(`/certificates/mint/${certificateId}`, mintData),
  getAllCertificates: () => api.get('/certificates/all'),
  
  // ✅ FIXED: This matches your backend route
  updateCertificate: (certificateId, updateData) => 
    api.put(`/certificates/${certificateId}/mint-status`, updateData),
  
  verifyCertificate: (certificateId) => api.get(`/certificates/verify/${certificateId}`),
  getCertificateByTxHash: (txHash) => api.get(`/certificates/tx/${txHash}`),
  getCertificateById: (certificateId) => api.get(`/certificates/${certificateId}`),
  deleteCertificate: (certificateId) => api.delete(`/certificates/${certificateId}`),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getPendingApprovals: () => api.get('/admin/pending-approvals'),
  bulkApproveStudents: (studentIds) => api.post('/admin/bulk-approve', { studentIds }),
  getAdminProfile: () => api.get('/admin/profile'),
  updateAdminProfile: (profileData) => api.put('/admin/profile', profileData),
  getSystemLogs: () => api.get('/admin/system-logs'),
};

export default api;