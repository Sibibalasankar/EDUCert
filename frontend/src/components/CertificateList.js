import React, { useState, useEffect, useCallback } from 'react';
import { studentAPI } from '../services/api';
import { getContract } from '../config/contractConfig';
import LoadingSpinner from '../components/LoadingSpinner';
import CertificateCard from './CertificateCard';

const CertificateList = () => {
  const [allCertificates, setAllCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    minted: 0,
    pending: 0
  });
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState('');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);

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
        setError('Failed to connect wallet: ' + error.message);
        return null;
      }
    } else {
      setError('Please install MetaMask!');
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

  // ✅ FIXED: Enhanced blockchain status verification with proper minted date
  const verifyBlockchainStatus = async (certificates) => {
    try {
      const contract = await getContract();
      const updatedCerts = [];

      for (const cert of certificates) {
        try {
          console.log(`🔍 Checking blockchain status for ${cert.studentRegisterNumber} - ${cert.certificateType}`);
          
          let hasMinted = false;
          let blockchainData = null;
          let mintedDate = null;

          try {
            // Try to check if student has minted
            hasMinted = await contract.hasStudentMinted(
              cert.studentRegisterNumber,
              cert.certificateType
            );

            // If minted, try to get certificate details including issue date
            if (hasMinted) {
              try {
                blockchainData = await contract.getCertificate(
                  cert.studentRegisterNumber,
                  cert.certificateType
                );
                
                console.log(`✅ Found on blockchain: ${cert.certificateType} for ${cert.studentRegisterNumber}`, blockchainData);

                // Extract minted date from blockchain data
                if (blockchainData && blockchainData.issueDate) {
                  // Convert BigInt timestamp to JavaScript Date
                  const issueTimestamp = Number(blockchainData.issueDate) * 1000;
                  mintedDate = new Date(issueTimestamp).toISOString();
                  console.log(`📅 Blockchain minted date: ${mintedDate} (from timestamp: ${blockchainData.issueDate})`);
                }
                
              } catch (certError) {
                console.log(`Certificate data not available: ${certError.message}`);
              }
            }
          } catch (blockchainError) {
            console.warn(`Blockchain check failed for ${cert.certificateType}:`, blockchainError.message);
          }

          // Determine effective status
          let effectiveStatus = cert.status;
          if (hasMinted) {
            effectiveStatus = 'minted';
          } else if (cert.status === 'approved') {
            effectiveStatus = 'approved';
          } else {
            effectiveStatus = 'pending';
          }

          // Use blockchain minted date if available, otherwise use backend date
          const finalMintedDate = mintedDate || cert.mintedAt;

          updatedCerts.push({
            ...cert,
            blockchainConfirmed: hasMinted,
            blockchainData: blockchainData,
            effectiveStatus: effectiveStatus,
            mintedAt: finalMintedDate
          });

          console.log(`📋 Certificate ${cert.certificateType} - Status: ${effectiveStatus}, Minted: ${finalMintedDate || 'Not minted'}`);

        } catch (error) {
          console.error(`Error verifying ${cert.certificateType} for ${cert.studentRegisterNumber}:`, error);
          updatedCerts.push({
            ...cert,
            blockchainConfirmed: false,
            effectiveStatus: cert.status || 'pending',
            mintedAt: cert.mintedAt
          });
        }
      }

      return updatedCerts;
    } catch (error) {
      console.error('Error in blockchain verification:', error);
      return certificates.map(cert => ({
        ...cert,
        blockchainConfirmed: false,
        effectiveStatus: cert.status || 'pending',
        mintedAt: cert.mintedAt
      }));
    }
  };

  // Add this function to sync missing minted dates
  const syncMissingMintedDates = async (certificates) => {
    try {
      const contract = await getContract();
      const updatedCerts = [...certificates];

      for (let i = 0; i < updatedCerts.length; i++) {
        const cert = updatedCerts[i];
        
        // If certificate is minted on blockchain but missing minted date
        if (cert.blockchainConfirmed && (!cert.mintedAt || cert.mintedAt === 'N/A')) {
          try {
            const blockchainData = await contract.getCertificate(
              cert.studentRegisterNumber,
              cert.certificateType
            );

            if (blockchainData && blockchainData.issueDate) {
              const issueTimestamp = Number(blockchainData.issueDate) * 1000;
              const mintedDate = new Date(issueTimestamp).toISOString();
              
              updatedCerts[i] = {
                ...cert,
                mintedAt: mintedDate
              };

              console.log(`🔄 Synced minted date for ${cert.certificateType}: ${mintedDate}`);
            }
          } catch (error) {
            console.log(`❌ Could not fetch blockchain data for ${cert.certificateType}:`, error.message);
          }
        }
      }

      return updatedCerts;
    } catch (error) {
      console.error('Error syncing minted dates:', error);
      return certificates;
    }
  };

  // Update statistics
  const updateStats = (certificates) => {
    const total = certificates.length;
    const approved = certificates.filter(c => c.effectiveStatus === 'approved').length;
    const minted = certificates.filter(c => c.effectiveStatus === 'minted').length;
    const pending = certificates.filter(c => c.effectiveStatus === 'pending').length;

    setStats({ total, approved, minted, pending });
    console.log(`📊 Stats updated - Total: ${total}, Approved: ${approved}, Minted: ${minted}, Pending: ${pending}`);
  };

  // ✅ FIXED: Wrap fetchAllCertificates in useCallback to prevent infinite re-renders
  const fetchAllCertificates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Starting certificate fetch...');
      
      const studentsResponse = await studentAPI.getAllStudents();
      console.log('📊 Students response:', studentsResponse);

      if (studentsResponse.data && studentsResponse.data.success) {
        const students = studentsResponse.data.students;
        console.log(`👥 Found ${students.length} students`);

        const allCerts = [];
        
        students.forEach(student => {
          console.log(`📝 Processing student: ${student.name} (${student.registerNumber || student.studentId})`);
          
          if (student.certificates && student.certificates.length > 0) {
            console.log(`📜 Found ${student.certificates.length} certificates for ${student.name}`);
            
            student.certificates.forEach(cert => {
              console.log(`🎓 Certificate: ${cert.certificateType}, Status: ${cert.status}, Minted: ${cert.mintedAt || 'Not minted'}`);
              
              allCerts.push({
                ...cert,
                studentName: student.name,
                studentRegisterNumber: student.registerNumber || student.studentId,
                studentCourse: student.course,
                studentDepartment: student.department,
                studentCGPA: student.cgpa,
                studentEmail: student.email,
                studentWallet: student.walletAddress,
                studentId: student._id,
                studentInfo: {
                  name: student.name,
                  registerNumber: student.registerNumber || student.studentId,
                  course: student.course,
                  cgpa: student.cgpa,
                  department: student.department,
                  email: student.email,
                  walletAddress: student.walletAddress
                }
              });
            });
          } else {
            console.log(`❌ No certificates found for ${student.name}`);
          }
        });

        console.log(`📋 Total certificates collected: ${allCerts.length}`);

        if (allCerts.length > 0) {
          const verifiedCerts = await verifyBlockchainStatus(allCerts);
          console.log(`✅ Verified ${verifiedCerts.length} certificates with blockchain`);
          
          const syncedCerts = await syncMissingMintedDates(verifiedCerts);
          console.log(`🔄 Synced minted dates for certificates`);
          
          setAllCertificates(syncedCerts);
          updateStats(syncedCerts);
        } else {
          console.log('⚠️ No certificates found in any student records');
          setAllCertificates([]);
          updateStats([]);
        }
      } else {
        console.error('❌ Failed to fetch students:', studentsResponse);
        setError('Failed to load student data from server');
        setAllCertificates([]);
        updateStats([]);
      }
    } catch (error) {
      console.error('❌ Error fetching certificates:', error);
      setError('Failed to load certificates: ' + error.message);
      setAllCertificates([]);
      updateStats([]);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since we don't use any external variables

  // ✅ FIXED: Load data on component mount with proper dependencies
  useEffect(() => {
    if (walletConnected) {
      fetchAllCertificates();
    }
  }, [walletConnected, fetchAllCertificates]); // Include fetchAllCertificates in dependencies

  // ✅ FIXED: Auto-fetch when wallet connects with proper dependencies
  useEffect(() => {
    if (walletConnected && allCertificates.length === 0) {
      fetchAllCertificates();
    }
  }, [walletConnected, allCertificates.length, fetchAllCertificates]); // Proper dependencies

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
        (cert.studentName?.toLowerCase().includes(term)) ||
        (cert.studentRegisterNumber?.toLowerCase().includes(term)) ||
        (cert.certificateType?.toLowerCase().includes(term)) ||
        (cert.studentCourse?.toLowerCase().includes(term))
      );
    }
    
    return true;
  });

  // View certificate details
  const viewCertificate = (certificate) => {
    setSelectedCertificate(certificate);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCertificate(null);
  };

  // Refresh data
  const refreshData = async () => {
    await fetchAllCertificates();
  };

  // ✅ FIXED: Enhanced date formatting
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A' || dateString === 'Invalid Date') {
      return 'Not minted';
    }
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date string: ${dateString}`);
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Date error';
    }
  };

  // Add this function to manually sync all minted dates
  const syncAllMintedDates = async () => {
    try {
      setLoading(true);
      console.log('🔄 Starting manual minted date sync...');
      
      const syncedCerts = await syncMissingMintedDates(allCertificates);
      setAllCertificates(syncedCerts);
      updateStats(syncedCerts);
      
      console.log('✅ Manual minted date sync completed');
      setError(null);
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
      setError('Failed to sync minted dates: ' + error.message);
    } finally {
      setLoading(false);
    }
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
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
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
                <h1 className="text-2xl font-bold text-gray-900">Certificate Dashboard</h1>
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
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loading ? 'Refreshing...' : 'Refresh Data'}
                </button>
                <button
                  onClick={syncAllMintedDates}
                  disabled={loading}
                  className="text-sm text-purple-600 hover:text-purple-800 flex items-center justify-center disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {loading ? 'Syncing Dates...' : 'Sync Minted Dates'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-red-800 font-medium">Error Loading Data</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <button
                  onClick={refreshData}
                  className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

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
              <p className="text-gray-600 mb-4">
                {searchTerm || filter !== 'all'
                  ? 'No certificates match your current filters.'
                  : 'No certificates have been created yet.'}
              </p>
              <button
                onClick={refreshData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Refresh Data
              </button>
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCertificates.map((certificate) => (
                    <tr key={certificate._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {certificate.studentName || 'Unknown Student'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {certificate.studentRegisterNumber || 'No ID'}
                          </div>
                          <div className="text-sm font-semibold text-blue-600 mt-1">
                            {certificate.certificateType || 'Unknown Certificate'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{certificate.studentCourse || 'No Course'}</div>
                        <div className="text-sm text-gray-500">{certificate.studentDepartment || 'No Department'}</div>
                        <div className="text-sm text-gray-500">CGPA: {certificate.studentCGPA || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(certificate.effectiveStatus)}`}>
                          {getStatusIcon(certificate.effectiveStatus)} {certificate.effectiveStatus?.toUpperCase() || 'UNKNOWN'}
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
                        <div>Minted: {formatDate(certificate.mintedAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => viewCertificate(certificate)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                          View Details
                        </button>
                        {certificate.transactionHash && (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${certificate.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-green-600 hover:text-green-900 bg-green-50 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors inline-block"
                          >
                            Etherscan
                          </a>
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

      {/* Certificate Details Modal */}
      {isModalOpen && selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Certificate Details
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <CertificateCard 
                certificate={selectedCertificate}
                studentInfo={selectedCertificate.studentInfo}
              />
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateList;