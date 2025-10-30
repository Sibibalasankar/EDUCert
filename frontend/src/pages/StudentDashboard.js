import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import CertificateCard from '../components/CertificateCard';
import LoadingSpinner from '../components/LoadingSpinner';

const StudentDashboard = () => {
  const { isConnected, connectWallet, account } = useWeb3();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);

  useEffect(() => {
    const fetchStudentCertificates = async () => {
      try {
        setLoading(true);
        
        // Mock data for Phase 1 - will connect to backend in Phase 2
        setTimeout(() => {
          const mockCertificates = [
            {
              _id: '1',
              tokenId: 1,
              studentName: 'Sibi B S',
              registerNumber: '21AI001',
              course: 'Artificial Intelligence & Data Science',
              degree: 'B.Tech',
              cgpa: '8.9',
              certificateType: 'Degree',
              issueDate: new Date().toISOString(),
              transactionHash: '0x4af1234567890abcdef1234567890abcdef1234567890abcdef1234567891d3',
              ipfsHash: 'QmRjD1234567890K7xF'
            },
            {
              _id: '2',
              tokenId: 2,
              studentName: 'Sibi B S',
              registerNumber: '21AI001',
              course: 'Artificial Intelligence & Data Science',
              degree: 'B.Tech',
              cgpa: '9.2',
              certificateType: 'Transcript',
              issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              transactionHash: '0x4af1234567890abcdef1234567890abcdef1234567890abcdef1234567892e4',
              ipfsHash: 'QmRjD1234567890K8yG'
            }
          ];
          
          setCertificates(mockCertificates);
          setStudentInfo({
            name: 'Sibi B S',
            registerNumber: '21AI001',
            email: 'sibi@student.edu',
            course: 'Artificial Intelligence & Data Science',
            degree: 'B.Tech'
          });
          setLoading(false);
        }, 1500);
        
      } catch (error) {
        console.error('Error fetching student certificates:', error);
        setLoading(false);
      }
    };

    if (isConnected && account) {
      fetchStudentCertificates();
    } else {
      setLoading(false);
    }
  }, [isConnected, account]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Access</h2>
          <p className="text-gray-600 mb-6">Connect your wallet to view your certificates</p>
          <button
            onClick={connectWallet}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
          >
            Connect Wallet
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
                <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
                <p className="text-gray-600 mt-1">
                  Your blockchain-verified academic credentials
                </p>
                {studentInfo && (
                  <div className="mt-3 flex flex-wrap gap-4">
                    <div className="text-sm">
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-2 font-medium text-gray-900">{studentInfo.name}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Register No:</span>
                      <span className="ml-2 font-medium text-gray-900">{studentInfo.registerNumber}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Course:</span>
                      <span className="ml-2 font-medium text-gray-900">{studentInfo.course}</span>
                    </div>
                  </div>
                )}
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

        {/* Certificates Grid */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {loading ? (
            <div className="py-12">
              <LoadingSpinner size="large" text="Loading your certificates..." />
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates found</h3>
              <p className="text-gray-500 mb-6">
                You don't have any certificates issued to your wallet address yet.
              </p>
              <div className="text-sm text-gray-400">
                Wallet: {account}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Your Certificate Collection ({certificates.length})
                </h2>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((certificate) => (
                  <CertificateCard 
                    key={certificate._id} 
                    certificate={certificate} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {certificates.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print All
              </button>
              <button
                onClick={() => {
                  const verificationLinks = certificates.map(cert => 
                    `${window.location.origin}/verify/${cert.tokenId}`
                  ).join('\n');
                  navigator.clipboard.writeText(verificationLinks);
                  alert('Verification links copied to clipboard!');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Verification Links
              </button>
              <button
                onClick={() => {
                  const certificateData = certificates.map(cert => 
                    `Name: ${cert.studentName}\nRegister No: ${cert.registerNumber}\nCourse: ${cert.course}\nDegree: ${cert.degree}\nCGPA: ${cert.cgpa}\nVerification: ${window.location.origin}/verify/${cert.tokenId}`
                  ).join('\n\n');
                  navigator.clipboard.writeText(certificateData);
                  alert('Certificate details copied to clipboard!');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Copy All Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;