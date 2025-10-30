import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import CertificateForm from '../components/CertificateForm';
import CertificateList from '../components/CertificateList';
import StudentManagement from '../components/StudentManagement';

const AdminDashboard = () => {
  const { isConnected, connectWallet, account } = useWeb3();
  const [activeTab, setActiveTab] = useState('students');
  const [recentCertificate, setRecentCertificate] = useState(null);
  const [students, setStudents] = useState([]);

  // Mock students data - will be replaced with backend data
  useEffect(() => {
    const mockStudents = [
      {
        _id: '1',
        name: 'Sibi B S',
        registerNumber: '21AI001',
        email: 'sibi@college.edu',
        course: 'Artificial Intelligence & Data Science',
        degree: 'B.Tech',
        cgpa: '8.9',
        walletAddress: '0x742d35Cc6634C0532925a3b8D',
        phone: '+91 9876543210',
        department: 'AI & DS',
        yearOfAdmission: 2021,
        yearOfPassing: 2025,
        createdAt: new Date().toISOString()
      },
      {
        _id: '2',
        name: 'John Doe',
        registerNumber: '21CS002',
        email: 'john@college.edu',
        course: 'Computer Science',
        degree: 'B.Tech',
        cgpa: '9.2',
        walletAddress: '0x892d35Cc6634C0532925a3b8E',
        phone: '+91 9876543211',
        department: 'CSE',
        yearOfAdmission: 2021,
        yearOfPassing: 2025,
        createdAt: new Date().toISOString()
      }
    ];
    setStudents(mockStudents);
  }, []);

  const handleCertificateIssue = (certificateData) => {
    setRecentCertificate(certificateData);
    setActiveTab('certificates');
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
          <p className="text-gray-600 mb-6">Please connect your admin wallet to access the dashboard</p>
          <button
            onClick={connectWallet}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
          >
            Connect Admin Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage students and issue academic certificates</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Connected: {account?.slice(0, 8)}...{account?.slice(-6)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('students')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'students'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span>Student Management</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('issue')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'issue'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Issue Certificate</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('certificates')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'certificates'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Manage Certificates</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'students' && <StudentManagement />}
          {activeTab === 'issue' && <CertificateForm onSubmit={handleCertificateIssue} students={students} />}
          {activeTab === 'certificates' && <CertificateList />}
        </div>

        {/* Recent Certificate Success Alert */}
        {recentCertificate && (
          <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Certificate Issued Successfully!</h3>
                <p className="mt-1 text-sm text-green-700">
                  Token ID: {recentCertificate.tokenId}
                </p>
              </div>
              <button
                onClick={() => setRecentCertificate(null)}
                className="ml-auto flex-shrink-0 text-green-400 hover:text-green-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;