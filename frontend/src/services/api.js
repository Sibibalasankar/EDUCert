import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Student API endpoints
export const studentAPI = {
  getAllStudents: () => api.get('/students/all'),
  getStudent: (studentId) => api.get(`/students/${studentId}`),
  registerStudent: (studentData) => api.post('/students/register', studentData),
  updateStudent: (studentId, studentData) => api.put(`/students/${studentId}`, studentData),
  deleteStudent: (studentId) => api.delete(`/students/${studentId}`),
  approveStudent: (studentId, certificateData) => 
    api.post(`/students/${studentId}/approve`, certificateData),
  getCertificateStatus: (studentId) => 
    api.get(`/students/${studentId}/certificate-status`),
  verifyCertificate: (studentId) => 
    api.get(`/students/${studentId}/verify`),
};

export default api;