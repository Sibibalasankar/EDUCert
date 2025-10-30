import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCodeGenerator from '../components/QRCodeGenerator';
import LoadingSpinner from '../components/LoadingSpinner';

const CertificateDetail = () => {
  const { tokenId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data fetch - will connect to backend in Phase 2
    setTimeout(() => {
      const mockCertificate = {
        _id: '1',
        tokenId: parseInt(tokenId),
        studentName: 'Sibi B S',
        registerNumber: '21AI001',
        email: 'sibi@college.edu',
        course: 'Artificial Intelligence & Data Science',
        degree: 'B.Tech',
        cgpa: '8.9',
        certificateType: 'Degree Certificate',
        issueDate: new Date().toISOString(),
        transactionHash: '0x4af1234567890abcdef1234567890abcdef1234567890abcdef1234567891d3',
        ipfsHash: 'QmRjD1234567890K7xF',
        department: 'AI & DS',
        yearOfAdmission: 2021,
        yearOfPassing: 2025,
        institution: 'Your College Name',
        issuer: 'College Administration',
        status: 'Active'
      };
      setCertificate(mockCertificate);
      setLoading(false);
    }, 1000);
  }, [tokenId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading certificate details..." />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Certificate Not Found</h1>
          <Link to="/admin" className="text-blue-600 hover:text-blue-800">
            Back to Certificates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            to="/admin" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Certificates
          </Link>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Certificate Details</h1>
                <p className="text-gray-600 mt-1">Complete information for certificate #{certificate.tokenId}</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {certificate.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-lg font-semibold text-gray-900">{certificate.studentName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Register Number</label>
                  <p className="text-lg font-semibold text-gray-900">{certificate.registerNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{certificate.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Course</label>
                  <p className="text-gray-900">{certificate.course}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Degree</label>
                  <p className="text-gray-900">{certificate.degree}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">CGPA</label>
                  <p className="text-lg font-semibold text-gray-900">{certificate.cgpa}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p className="text-gray-900">{certificate.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Years</label>
                  <p className="text-gray-900">{certificate.yearOfAdmission} - {certificate.yearOfPassing}</p>
                </div>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Certificate Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Certificate Type</label>
                  <p className="text-gray-900">{certificate.certificateType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Issue Date</label>
                  <p className="text-gray-900">
                    {new Date(certificate.issueDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Institution</label>
                  <p className="text-gray-900">{certificate.institution}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Issued By</label>
                  <p className="text-gray-900">{certificate.issuer}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code & Verification */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification</h3>
              <div className="text-center">
                <QRCodeGenerator 
                  data={`${window.location.origin}/verify/${certificate.tokenId}`}
                  size={180}
                />
                <p className="text-sm text-gray-600 mt-3">
                  Scan to verify this certificate
                </p>
                <Link
                  to={`/verify/${certificate.tokenId}`}
                  target="_blank"
                  className="inline-block mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Open Verification Page
                </Link>
              </div>
            </div>

            {/* Blockchain Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Blockchain Data</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Token ID</label>
                  <p className="text-sm font-mono text-gray-900">{certificate.tokenId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Transaction Hash</label>
                  <p className="text-xs font-mono text-gray-900 break-all">
                    {certificate.transactionHash}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">IPFS Hash</label>
                  <p className="text-xs font-mono text-gray-900 break-all">
                    {certificate.ipfsHash}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <a
                  href={`https://sepolia.etherscan.io/tx/${certificate.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-3 py-2 border border-gray-300 text-sm rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  View on Etherscan
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/verify/${certificate.tokenId}`);
                    alert('Verification link copied!');
                  }}
                  className="block w-full text-center px-3 py-2 border border-gray-300 text-sm rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  Copy Verification Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateDetail;