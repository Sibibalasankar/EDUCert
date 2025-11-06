import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import CertificateCard from '../components/CertificateCard';
import LoadingSpinner from '../components/LoadingSpinner';
import CertificateMinter from '../components/CertificateMinter';
import StudentHeader from '../components/StudentHeader';
import { studentAPI, certificateAPI } from '../services/api';
import { getContract } from '../config/contractConfig';

const StudentDashboard = () => {
  const { isConnected, connectWallet, account } = useWeb3();
  const [mintedCertificates, setMintedCertificates] = useState([]);
  const [approvedCertificates, setApprovedCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);
  const [mintResult, setMintResult] = useState(null);

  // Blockchain status check
  const checkBlockchainStatus = useCallback(async (certificates, registerNumber) => {
    if (!registerNumber) {
      console.log('No register number available for blockchain check');
      return certificates;
    }

    try {
      const contract = await getContract();
      const updatedCertificates = [];

      for (const certificate of certificates) {
        try {
          const hasMinted = await contract.hasStudentMinted(
            registerNumber,
            certificate.certificateType
          );

          if (hasMinted) {
            try {
              const certificateData = await contract.getCertificate(
                registerNumber,
                certificate.certificateType
              );

              const issueDate = certificateData.issueDate ? 
                new Date(Number(certificateData.issueDate) * 1000).toISOString() : 
                new Date().toISOString();

              const tokenId = `cert-${registerNumber}-${certificate.certificateType}`;

              updatedCertificates.push({
                ...certificate,
                status: 'minted',
                blockchainConfirmed: true,
                tokenId: tokenId,
                mintedAt: issueDate,
                blockNumber: certificateData.issueDate ? Number(certificateData.issueDate) : null,
                studentName: certificateData.studentName || certificate.studentName,
                courseName: certificateData.courseName || certificate.courseName,
                grade: certificateData.grade || certificate.grade,
                ipfsHash: certificateData.ipfsHash || certificate.ipfsHash
              });
            } catch (certError) {
              console.log(`Could not fetch certificate details for ${certificate.certificateType}:`, certError.message);
              updatedCertificates.push({
                ...certificate,
                status: 'minted',
                blockchainConfirmed: true,
                tokenId: `cert-${registerNumber}-${certificate.certificateType}`,
                mintedAt: new Date().toISOString()
              });
            }
          } else {
            updatedCertificates.push(certificate);
          }
        } catch (error) {
          console.error(`Error checking blockchain status for ${certificate.certificateType}:`, error);
          updatedCertificates.push(certificate);
        }
      }

      return updatedCertificates;
    } catch (error) {
      console.error('Error checking blockchain status:', error);
      return certificates;
    }
  }, []);

  // Sync backend with blockchain
  const syncBackendWithBlockchain = useCallback(async (certificates) => {
    try {
      for (const certificate of certificates) {
        if (certificate.blockchainConfirmed && certificate.status !== 'minted') {
          try {
            const updateData = {
              status: 'minted',
              blockchainConfirmed: true,
              tokenId: certificate.tokenId,
              mintedAt: certificate.mintedAt || new Date().toISOString(),
              blockNumber: certificate.blockNumber,
              transactionHash: certificate.transactionHash
            };

            Object.keys(updateData).forEach(key => 
              updateData[key] === undefined && delete updateData[key]
            );

            await certificateAPI.updateCertificate(certificate._id, updateData);
            console.log(`✅ Updated backend for ${certificate.certificateType}`);
          } catch (updateError) {
            console.log(`Failed to update backend for ${certificate.certificateType}:`, updateError.message);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing backend with blockchain:', error);
    }
  }, []);

  // Process certificates
  const processStudentCertificates = useCallback(async (student) => {
    try {
      const studentCerts = student.certificates || [];
      let certificatesWithBlockchainStatus = studentCerts;
      
      if (student.studentId) {
        certificatesWithBlockchainStatus = await checkBlockchainStatus(studentCerts, student.studentId);
      }

      const approved = certificatesWithBlockchainStatus.filter(c =>
        c && c.status === 'approved' && !c.blockchainConfirmed
      );

      const minted = certificatesWithBlockchainStatus.filter(c =>
        c && (c.status === 'minted' || c.blockchainConfirmed === true)
      );

      setApprovedCertificates(approved);
      setMintedCertificates(minted);

      if (student.studentId) {
        await syncBackendWithBlockchain(certificatesWithBlockchainStatus);
      }
    } catch (error) {
      console.error('Error processing certificates:', error);
    }
  }, [checkBlockchainStatus, syncBackendWithBlockchain]);

  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        if (!account) {
          setLoading(false);
          return;
        }

        const allStudentsResponse = await studentAPI.getAllStudents();

        if (allStudentsResponse.data && allStudentsResponse.data.success) {
          const allStudents = allStudentsResponse.data.students;
          const student = allStudents.find(s =>
            s.walletAddress && s.walletAddress.toLowerCase() === account.toLowerCase()
          );

          if (student) {
            const studentData = {
              name: student.name,
              registerNumber: student.studentId,
              email: student.email,
              course: student.course || `${student.degree} in ${student.department}`,
              degree: student.degree,
              department: student.department,
              cgpa: student.cgpa,
              walletAddress: student.walletAddress,
              _id: student._id
            };

            setStudentInfo(studentData);
            await processStudentCertificates(student);
          } else {
            setStudentInfo(null);
            setApprovedCertificates([]);
            setMintedCertificates([]);
          }
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isConnected && account) {
      fetchStudentData();
    } else {
      setLoading(false);
    }
  }, [isConnected, account, processStudentCertificates]);

  // Refresh data
  const refreshData = async () => {
    if (studentInfo) {
      try {
        setLoading(true);
        const allStudentsResponse = await studentAPI.getAllStudents();
        if (allStudentsResponse.data && allStudentsResponse.data.success) {
          const allStudents = allStudentsResponse.data.students;
          const student = allStudents.find(s =>
            s.walletAddress && s.walletAddress.toLowerCase() === account.toLowerCase()
          );
          if (student) {
            await processStudentCertificates(student);
          }
        }
      } catch (error) {
        console.error('Error refreshing data:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Force sync
  const forceSyncWithBlockchain = async () => {
    if (studentInfo) {
      try {
        setLoading(true);
        await refreshData();
        setMintResult({
          type: "info",
          message: "Synced with blockchain state successfully!",
        });
      } catch (error) {
        setMintResult({
          type: "error",
          message: "Sync failed",
          details: error.message
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle certificate verification
  const handleVerifyCertificate = (certificate) => {
    console.log('Verifying certificate:', certificate._id);
    alert(`Verifying certificate: ${certificate.certificateType}\nToken ID: ${certificate.tokenId}\nIssued: ${certificate.mintedAt ? new Date(certificate.mintedAt).toLocaleDateString() : 'Unknown'}`);
  };

  // Handle mint result
  const handleMintResult = (result) => {
    setMintResult(result);
  };

  // Update certificates after minting
  const handleCertificateMinted = (certificateId, mintedData) => {
    setApprovedCertificates(prev =>
      prev.filter(c => c._id !== certificateId)
    );
    setMintedCertificates(prev => [...prev, mintedData]);
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
        <StudentHeader
          studentInfo={studentInfo}
          account={account}
          approvedCount={approvedCertificates.length}
          mintedCount={mintedCertificates.length}
          onRefresh={refreshData}
          onSync={forceSyncWithBlockchain}
        />

        {/* Mint Result */}
        {mintResult && (
          <div className={`mb-6 p-4 rounded-md border ${
            mintResult.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            mintResult.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-start">
              <div className={`flex-shrink-0 w-5 h-5 mt-0.5 ${
                mintResult.type === 'success' ? 'text-green-400' :
                mintResult.type === 'error' ? 'text-red-400' : 'text-blue-400'
              }`}>
                {mintResult.type === 'success' ? '✓' : mintResult.type === 'error' ? '✗' : '⏳'}
              </div>
              <div className="ml-3 flex-1">
                <p className="font-medium">{mintResult.message}</p>
                {mintResult.details && (
                  <p className="text-sm mt-1 opacity-75">{mintResult.details}</p>
                )}
                {mintResult.tokenId && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Token ID:</span>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {mintResult.tokenId}
                    </span>
                  </div>
                )}
                {mintResult.transactionHash && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Transaction:</span>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {mintResult.transactionHash.slice(0, 10)}...{mintResult.transactionHash.slice(-8)}
                    </span>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${mintResult.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      View on Etherscan
                    </a>
                  </div>
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

        {/* Approved Certificates */}
        {approvedCertificates.length > 0 && (
          <CertificateMinter
            approvedCertificates={approvedCertificates}
            studentInfo={studentInfo}
            onMintResult={handleMintResult}
            onCertificateMinted={handleCertificateMinted}
          />
        )}

        {/* Minted Certificates */}
        {mintedCertificates.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                My Minted Certificates ({mintedCertificates.length})
              </h2>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                ON BLOCKCHAIN
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mintedCertificates.map((certificate) => (
                <CertificateCard
                  key={certificate._id}
                  certificate={certificate}
                  studentInfo={studentInfo}
                  onVerify={() => handleVerifyCertificate(certificate)}
                />
              ))}
            </div>
          </div>
        )}

        {/* No Certificates State */}
        {!loading && approvedCertificates.length === 0 && mintedCertificates.length === 0 && studentInfo && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Certificates Available Yet</h3>
              <p className="text-gray-600 mb-4">
                Your certificates are pending admin approval. Once approved by the administration,
                they will appear here ready for minting.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Status:</strong> Waiting for certificate approval from admin
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No Student Record */}
        {!loading && !studentInfo && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Student Record Not Found</h3>
              <p className="text-gray-600 mb-4">
                No student record found for wallet address:
                <code className="block font-mono text-sm bg-gray-100 p-2 rounded mt-2">
                  {account}
                </code>
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">
                  Please contact administration to register your wallet address with your student account.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <LoadingSpinner size="large" text="Loading your certificates..." />
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;