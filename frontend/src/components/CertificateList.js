import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { studentAPI, certificateAPI } from '../services/api';
import { getContract } from '../config/contractConfig';
import LoadingSpinner from '../components/LoadingSpinner';

const CertificateList = () => {
  const [allCertificates, setAllCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    minted: 0,
    pending: 0
  });
  const [filter, setFilter] = useState('all'); // all, approved, minted, pending
  const [searchTerm, setSearchTerm] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState('');

  // Connect wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        setCurrentAccount(accounts[0]);
        setWalletConnected(true);
        return accounts[0];
      } catch (error) {
        console.error('Error connecting wallet:', error);
        return null;
      }
    } else {
      alert('Please install MetaMask!');
      return null;
    }
  };

  // Check wallet connection
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          if (accounts.length > 0) {
            setCurrentAccount(accounts[0]);
            setWalletConnected(true);
          }
        } catch (error) {
          console.log('No wallet connection');
        }
      }
    };
    checkWalletConnection();
  }, []);

  // Fetch all certificates from backend
  const fetchAllCertificates = async () => {
    try {
      setLoading(true);
      
      // Fetch all students with their certificates
      const studentsResponse = await studentAPI.getAllStudents();
      
      if (studentsResponse.data && studentsResponse.data.success) {
        const students = studentsResponse.data.students;
        
        // Extract all certificates from all students
        const allCerts = [];
        
        students.forEach(student => {
          if (student.certificates && student.certificates.length > 0) {
            student.certificates.forEach(cert => {
              allCerts.push({
                ...cert,
                studentName: student.name,
                studentRegisterNumber: student.registerNumber || student.studentId,
                studentCourse: student.course,
                studentDepartment: student.department,
                studentCGPA: student.cgpa,
                studentEmail: student.email,
                studentWallet: student.walletAddress,
                studentId: student._id
              });
            });
          }
        });

        // Verify blockchain status for all certificates
        const verifiedCerts = await verifyBlockchainStatus(allCerts);
        setAllCertificates(verifiedCerts);
        updateStats(verifiedCerts);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verify blockchain status for certificates
  const verifyBlockchainStatus = async (certificates) => {
    try {
      const contract = await getContract();
      const updatedCerts = [];

      for (const cert of certificates) {
        try {
          // Check if certificate is minted on blockchain
          const hasMinted = await contract.hasStudentMinted(
            cert.studentRegisterNumber,
            cert.certificateType
          );

          // Get certificate details from blockchain if minted
          let blockchainData = null;
          if (hasMinted) {
            try {
              blockchainData = await contract.getCertificate(
                cert.studentRegisterNumber,
                cert.certificateType
              );
            } catch (e) {
              console.log('Could not fetch certificate details from blockchain:', e.message);
            }
          }

          updatedCerts.push({
            ...cert,
            blockchainConfirmed: hasMinted,
            blockchainData: blockchainData,
            // Update status based on blockchain confirmation
            effectiveStatus: hasMinted ? 'minted' : (cert.status === 'approved' ? 'approved' : 'pending')
          });
        } catch (error) {
          console.error(`Error verifying ${cert.certificateType} for ${cert.studentRegisterNumber}:`, error);
          updatedCerts.push({
            ...cert,
            blockchainConfirmed: false,
            effectiveStatus: cert.status
          });
        }
      }

      return updatedCerts;
    } catch (error) {
      console.error('Error in blockchain verification:', error);
      return certificates.map(cert => ({
        ...cert,
        blockchainConfirmed: false,
        effectiveStatus: cert.status
      }));
    }
  };

  // Update statistics
  const updateStats = (certificates) => {
    const total = certificates.length;
    const approved = certificates.filter(c => c.effectiveStatus === 'approved').length;
    const minted = certificates.filter(c => c.effectiveStatus === 'minted').length;
    const pending = certificates.filter(c => c.effectiveStatus === 'pending').length;

    setStats({ total, approved, minted, pending });
  };

  // Load data on component mount
  useEffect(() => {
    fetchAllCertificates();
  }, []);

  // Filter certificates based on selected filter and search term
  const filteredCertificates = allCertificates.filter(cert => {
    // Status filter
    if (filter !== 'all' && cert.effectiveStatus !== filter) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        cert.studentName?.toLowerCase().includes(term) ||
        cert.studentRegisterNumber?.toLowerCase().includes(term) ||
        cert.certificateType?.toLowerCase().includes(term) ||
        cert.studentCourse?.toLowerCase().includes(term)
      );
    }
    
    return true;
  });

  // Refresh data
  const refreshData = async () => {
    await fetchAllCertificates();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'minted': return 'bg-green-100 text-green-800 border-green-200';
      case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'minted': return '✅';
      case 'approved': return '⏳';
      case 'pending': return '⏰';
      default: return '❓';
    }
  };

  if (!walletConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
          <p className="text-gray-600 mb-6">Connect your admin wallet to view all certificates</p>
          <button
            onClick={connectWallet}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 font-medium"
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
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Manage and monitor all student certificates
                </p>
                
                <div className="mt-4 flex flex-wrap gap-4">
                  <div className="text-sm">
                    <span className="text-gray-500">Admin:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {currentAccount?.slice(0, 8)}...{currentAccount?.slice(-4)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Certificates:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {stats.total} total
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-0 flex flex-col space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Connected as Admin</span>
                </div>
                <button
                  onClick={refreshData}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Certificates</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Minted on Blockchain</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.minted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved (Not Minted)</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setFilter('minted')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'minted'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Minted ({stats.minted})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'approved'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Approved ({stats.approved})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending ({stats.pending})
              </button>
            </div>

            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by student name, register number, or certificate type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Certificates Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <LoadingSpinner size="large" text="Loading certificates..." />
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Certificates Found</h3>
              <p className="text-gray-600">
                {searchTerm || filter !== 'all'
                  ? 'No certificates match your current filters.'
                  : 'No certificates have been created yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student & Certificate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Blockchain
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCertificates.map((certificate) => (
                    <tr key={certificate._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {certificate.studentName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {certificate.studentRegisterNumber}
                          </div>
                          <div className="text-sm font-semibold text-blue-600 mt-1">
                            {certificate.certificateType}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{certificate.studentCourse}</div>
                        <div className="text-sm text-gray-500">{certificate.studentDepartment}</div>
                        <div className="text-sm text-gray-500">CGPA: {certificate.studentCGPA}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(certificate.effectiveStatus)}`}>
                          {getStatusIcon(certificate.effectiveStatus)} {certificate.effectiveStatus?.toUpperCase()}
                        </span>
                        {certificate.blockchainConfirmed && (
                          <div className="text-xs text-green-600 mt-1 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Blockchain Verified
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>Approved: {formatDate(certificate.approvedAt)}</div>
                        <div>Minted: {formatDate(certificate.mintedAt) || 'Not minted'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {certificate.transactionHash ? (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${certificate.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            View TX
                          </a>
                        ) : (
                          'No transaction'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {!loading && filteredCertificates.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredCertificates.length} of {allCertificates.length} certificates
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateList;