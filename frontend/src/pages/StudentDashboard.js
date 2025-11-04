import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import CertificateCard from '../components/CertificateCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { studentAPI } from '../services/api';
import { contractConfig } from '../config/contractConfig';
import { ethers } from 'ethers';

const StudentDashboard = () => {
  const { isConnected, connectWallet, account, signer } = useWeb3();
  const [mintedCertificates, setMintedCertificates] = useState([]);
  const [approvedCertificates, setApprovedCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);
  const [minting, setMinting] = useState({});
  const [mintResult, setMintResult] = useState(null);

  const CONTRACT_ADDRESS = contractConfig.address;
  const CONTRACT_ABI = contractConfig.abi;

  // Certificate types matching the contract
  const certificateTypes = [
    'Degree',
    'Provisional',
    'ConsolidatedMarksheet',
    'CourseCompletion',
    'Transcript',
    'Diploma',
    'RankCertificate',
    'Participation',
    'Merit',
    'Character'
  ];

  // Fetch student data and certificates
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        
        if (!account) {
          setLoading(false);
          return;
        }

        console.log('📡 Fetching student data for wallet:', account);

        // Get all students and find the one matching the wallet
        const allStudentsResponse = await studentAPI.getAllStudents();
        
        if (allStudentsResponse.data.success) {
          const allStudents = allStudentsResponse.data.students;
          
          // Find student by wallet address
          const currentStudent = allStudents.find(
            student => student.walletAddress?.toLowerCase() === account.toLowerCase()
          );

          if (currentStudent) {
            console.log('✅ Found student:', currentStudent);
            
            setStudentInfo({
              name: currentStudent.name,
              registerNumber: currentStudent.studentId,
              email: currentStudent.email,
              course: currentStudent.certificates?.[0]?.courseName || `${currentStudent.degree} in ${currentStudent.department}`,
              degree: currentStudent.degree,
              department: currentStudent.department,
              cgpa: currentStudent.cgpa,
              eligibilityStatus: currentStudent.eligibilityStatus
            });

            // Check for approved and minted certificates
            await checkCertificateStatus(currentStudent.studentId);
          } else {
            console.log('❌ No student found for wallet:', account);
            setStudentInfo(null);
          }
        }

      } catch (error) {
        console.error('❌ Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isConnected && account) {
      fetchStudentData();
    } else {
      setLoading(false);
    }
  }, [isConnected, account]);

  // Check certificate status for all certificate types
// Check certificate status for all certificate types
const checkCertificateStatus = async (studentId) => {
  try {
    if (!signer) return;

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    const approvedCerts = [];
    const mintedCerts = [];

    // Also get student data from backend
    const backendStudentResponse = await studentAPI.getStudent(studentId);
    const backendStudent = backendStudentResponse.data.student;

    // Check each certificate type
    for (const certType of certificateTypes) {
      try {
        // Check blockchain eligibility
        const [canMint, message] = await contract.canIMint(studentId, certType);
        
        // Check backend status
        const backendCert = backendStudent?.certificates?.find(c => c.certificateType === certType);
        
        console.log(`🔍 ${certType} - Blockchain: ${canMint}, Backend: ${backendCert?.status}`);

        if (canMint) {
          // Student is approved but hasn't minted yet
          const eligibility = await contract.getStudentEligibility(studentId, certType);
          approvedCerts.push({
            studentId: studentId,
            studentName: studentInfo?.name || 'Student',
            course: studentInfo?.course || 'Course',
            degree: studentInfo?.degree || 'Degree',
            cgpa: studentInfo?.cgpa || '0.0',
            department: studentInfo?.department || 'Department',
            certificateType: certType,
            message: message,
            // Add backend status for reference
            backendStatus: backendCert?.status || 'not_found'
          });
        }

        // Check if already minted (check both blockchain and backend)
        const certData = await contract.getCertificate(studentId, certType);
        if (certData.isMinted || backendCert?.status === 'minted') {
          mintedCerts.push({
            _id: `${studentId}-${certType}`,
            tokenId: 1,
            studentName: certData.studentName || studentInfo?.name,
            registerNumber: studentId,
            course: certData.courseName || studentInfo?.course,
            degree: studentInfo?.degree || 'Degree',
            cgpa: studentInfo?.cgpa || '0.0',
            certificateType: certType,
            issueDate: certData.issueDate ? new Date(certData.issueDate * 1000).toISOString() : new Date().toISOString(),
            transactionHash: backendCert?.transactionHash || '0x...',
            ipfsHash: certData.ipfsHash || backendCert?.ipfsHash,
            status: 'minted',
            source: certData.isMinted ? 'blockchain' : 'backend'
          });
        }
      } catch (error) {
        console.log(`❌ Error checking ${certType}:`, error.message);
      }
    }

    setApprovedCertificates(approvedCerts);
    setMintedCertificates(mintedCerts);

  } catch (error) {
    console.error('❌ Error checking certificate status:', error);
  }
};

  // Mint certificate function for specific type
  const mintCertificate = async (certificateType) => {
    try {
      setMinting(prev => ({ ...prev, [certificateType]: true }));
      setMintResult(null);

      if (!studentInfo) {
        throw new Error('No student information found');
      }

      console.log('🎯 Starting certificate minting for:', studentInfo.registerNumber, certificateType);

      if (!signer) {
        throw new Error('No signer available. Please connect your wallet.');
      }

      // 1. Check if student can mint this certificate type
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      console.log('🔍 Checking mint eligibility...');
      const [canMint, message] = await contract.canIMint(studentInfo.registerNumber, certificateType);
      
      if (!canMint) {
        throw new Error(`Cannot mint ${certificateType}: ${message}`);
      }

      console.log('✅ Student can mint, proceeding...');

      // 2. Get eligibility data from contract
      const eligibility = await contract.getStudentEligibility(studentInfo.registerNumber, certificateType);
      
      if (!eligibility.isEligible) {
        throw new Error(`Not eligible to mint ${certificateType}`);
      }

      // 3. Call the mint function with all required parameters
      console.log('🪙 Minting certificate...');
      const tx = await contract.mintCertificate(
        studentInfo.registerNumber,
        eligibility.studentName,
        eligibility.courseName,
        eligibility.grade,
        eligibility.ipfsHash,
        certificateType
      );

      console.log('⏳ Transaction sent:', tx.hash);
      
      // 4. Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt.hash);

      // 5. Update backend with minting result (optional)
      try {
        const mintResponse = await studentAPI.mintCertificate(studentInfo.registerNumber, {
          transactionHash: receipt.hash,
          certificateType: certificateType,
          tokenId: '1' // You might want to track this differently
        });
        console.log('✅ Backend updated:', mintResponse.data);
      } catch (backendError) {
        console.log('⚠️ Backend update failed, but blockchain transaction succeeded:', backendError);
      }

      setMintResult({
        type: 'success',
        message: `${certificateType} Certificate minted successfully!`,
        transactionHash: receipt.hash,
        certificateType: certificateType
      });

      // Refresh certificate status
      await checkCertificateStatus(studentInfo.registerNumber);
      
      console.log('🎉 Certificate minting completed successfully!');

    } catch (error) {
      console.error('❌ Error minting certificate:', error);
      
      setMintResult({
        type: 'error',
        message: error.message || `Failed to mint ${certificateType} certificate`,
        certificateType: certificateType
      });
    } finally {
      setMinting(prev => ({ ...prev, [certificateType]: false }));
    }
  };

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
          <p className="text-gray-600 mb-6">Connect your wallet to view and mint your certificates</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Manage your blockchain certificates
                </p>
                {studentInfo ? (
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
                    <div className="text-sm">
                      <span className="text-gray-500">Certificates:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {approvedCertificates.length} ready to mint, {mintedCertificates.length} minted
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-yellow-600">
                    ⚠️ No student record found for this wallet address. 
                    Please make sure your wallet address is registered in the system.
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

        {/* Approved Certificates - Ready to Mint */}
        {approvedCertificates.length > 0 && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-lg font-semibold text-green-800">Certificates Ready to Mint ({approvedCertificates.length})</h2>
              </div>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Approved by Admin
              </span>
            </div>
            
            <div className="space-y-4">
              {approvedCertificates.map((certificate) => (
                <div key={`${certificate.studentId}-${certificate.certificateType}`} className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{certificate.certificateType} Certificate</h3>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {certificate.certificateType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {certificate.course} • {certificate.degree} • CGPA: {certificate.cgpa}
                      </p>
                      <p className="text-xs text-green-600 mt-2">
                        ✅ Ready to mint to your wallet
                      </p>
                    </div>
                    <button
                      onClick={() => mintCertificate(certificate.certificateType)}
                      disabled={minting[certificate.certificateType]}
                      className="ml-4 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors duration-200"
                    >
                      {minting[certificate.certificateType] ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Minting...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Mint {certificate.certificateType}
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mint Result */}
        {mintResult && (
          <div className={`mb-6 p-4 rounded-md border ${
            mintResult.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-start">
              <div className={`flex-shrink-0 w-5 h-5 mt-0.5 ${
                mintResult.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}>
                {mintResult.type === 'success' ? '✓' : '✗'}
              </div>
              <div className="ml-3">
                <p className="font-medium">{mintResult.message}</p>
                {mintResult.transactionHash && (
                  <p className="text-sm mt-1">
                    Transaction: 
                    <span className="font-mono ml-1">
                      {mintResult.transactionHash.slice(0, 10)}...{mintResult.transactionHash.slice(-8)}
                    </span>
                  </p>
                )}
              </div>
              <button
                onClick={() => setMintResult(null)}
                className="ml-auto flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Minted Certificates */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              My Certificates ({mintedCertificates.length})
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

          {loading ? (
            <div className="py-12">
              <LoadingSpinner size="large" text="Loading your certificates..." />
            </div>
          ) : mintedCertificates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {approvedCertificates.length > 0 ? 'No certificates minted yet' : 'No certificates available'}
              </h3>
              <p className="text-gray-500 mb-6">
                {approvedCertificates.length > 0 
                  ? 'Mint your approved certificates using the buttons above.'
                  : 'You don\'t have any certificates yet. Please wait for admin approval.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mintedCertificates.map((certificate) => (
                <CertificateCard 
                  key={certificate._id} 
                  certificate={certificate} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Pending Approval Notice */}
        {!loading && approvedCertificates.length === 0 && mintedCertificates.length === 0 && studentInfo && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">Waiting for Approval</h3>
                <p className="text-yellow-700 mt-1">
                  Your certificates are pending admin approval. Once approved, you'll be able to mint them here.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;