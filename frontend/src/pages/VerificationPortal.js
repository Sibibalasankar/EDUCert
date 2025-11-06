import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import QRCodeGenerator from '../components/QRCodeGenerator';
import LoadingSpinner from '../components/LoadingSpinner';
import { ethers } from 'ethers';
import { contractConfig } from '../config/contractConfig';

const VerificationPortal = () => {
  const { studentId, certificateType } = useParams();
  const [verificationMethod, setVerificationMethod] = useState('studentId');
  const [inputValue, setInputValue] = useState(studentId || '');
  const [certificateTypeInput, setCertificateTypeInput] = useState(certificateType || 'Degree');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [certificateData, setCertificateData] = useState(null);

  const CONTRACT_ADDRESS = contractConfig.address;
  const CONTRACT_ABI = contractConfig.abi;

  // Multiple RPC providers for fallback
  const RPC_PROVIDERS = [
    'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // Your current Infura
    'https://eth-sepolia.g.alchemy.com/v2/demo', // Alchemy demo (free)
    'https://rpc.sepolia.org', // Public Sepolia RPC
    'https://sepolia.drpc.org' // Another public RPC
  ];

  // Get contract instance with fallback providers
  const getContract = async () => {
    let lastError = null;
    
    for (const rpcUrl of RPC_PROVIDERS) {
      try {
        console.log(`🔗 Trying RPC: ${rpcUrl}`);
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // Test the connection
        await provider.getNetwork();
        console.log(`✅ Connected to ${rpcUrl}`);
        
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        return contract;
      } catch (error) {
        console.warn(`❌ Failed to connect to ${rpcUrl}:`, error.message);
        lastError = error;
        continue; // Try next provider
      }
    }
    
    throw new Error(`All RPC providers failed. Last error: ${lastError?.message}`);
  };

  // Function to verify certificate on blockchain
  const verifyCertificateOnBlockchain = async (studentId, certificateType) => {
    try {
      console.log(`🔍 Verifying certificate on blockchain:`, { studentId, certificateType });

      const contract = await getContract();

      // Use verifyCertificate function from your contract
      const verification = await contract.verifyCertificate(studentId, certificateType);
      
      console.log('📊 Blockchain verification result:', verification);

      const [
        exists,
        studentName,
        courseName,
        grade,
        ipfsHash,
        issueDate,
        mintedBy
      ] = verification;

      if (!exists) {
        throw new Error('Certificate not found on blockchain');
      }

      return {
        exists,
        studentName,
        courseName,
        grade,
        ipfsHash,
        issueDate: Number(issueDate),
        mintedBy,
        isValid: exists,
        message: 'Certificate verified successfully on blockchain!'
      };

    } catch (error) {
      console.error('❌ Blockchain verification error:', error);
      
      if (error.message.includes('Certificate not found')) {
        throw new Error('Certificate not found on blockchain');
      } else if (error.message.includes('call revert')) {
        throw new Error('Certificate does not exist or is not minted');
      } else if (error.message.includes('All RPC providers failed')) {
        throw new Error('Unable to connect to blockchain network. Please try again later.');
      } else {
        throw new Error(`Blockchain verification failed: ${error.message}`);
      }
    }
  };

  // Function to get student eligibility info
  const getStudentEligibility = async (studentId, certificateType) => {
    try {
      const contract = await getContract();
      const eligibility = await contract.getStudentEligibility(studentId, certificateType);
      
      const [
        isEligible,
        studentName,
        courseName,
        grade,
        hasMinted
      ] = eligibility;

      return {
        isEligible,
        studentName,
        courseName,
        grade,
        hasMinted
      };
    } catch (error) {
      console.error('Error fetching eligibility:', error);
      return null;
    }
  };

  // Function to check if student has minted
  const hasStudentMinted = async (studentId, certificateType) => {
    try {
      const contract = await getContract();
      const hasMinted = await contract.hasStudentMinted(studentId, certificateType);
      return hasMinted;
    } catch (error) {
      console.error('Error checking mint status:', error);
      return false;
    }
  };

  const handleVerification = async () => {
    if (!inputValue.trim()) {
      setVerificationResult({
        isValid: false,
        message: 'Please enter a Student ID to verify'
      });
      return;
    }

    if (!certificateTypeInput.trim()) {
      setVerificationResult({
        isValid: false,
        message: 'Please select a certificate type'
      });
      return;
    }

    setLoading(true);
    setVerificationResult(null);
    setCertificateData(null);

    try {
      const studentId = inputValue.trim();
      const certificateType = certificateTypeInput;

      console.log(`🔍 Starting verification for:`, { studentId, certificateType });

      // First, check if student has minted this certificate
      const hasMinted = await hasStudentMinted(studentId, certificateType);
      
      if (!hasMinted) {
        // Check if student is eligible but hasn't minted
        const eligibility = await getStudentEligibility(studentId, certificateType);
        
        if (eligibility && eligibility.isEligible) {
          setVerificationResult({
            isValid: false,
            message: `Certificate is approved but not yet minted by student. Student can mint their ${certificateType} certificate.`
          });
        } else {
          setVerificationResult({
            isValid: false,
            message: `No ${certificateType} certificate found for student ${studentId}. Certificate may not be approved or minted.`
          });
        }
        return;
      }

      // If minted, verify on blockchain
      const blockchainData = await verifyCertificateOnBlockchain(studentId, certificateType);

      if (blockchainData.exists) {
        // Transform blockchain data to frontend format
        const transformedData = {
          studentName: blockchainData.studentName,
          registerNumber: studentId,
          course: blockchainData.courseName,
          degree: 'B.Tech', // You might want to store this differently
          cgpa: blockchainData.grade,
          certificateType: certificateType,
          issueDate: blockchainData.issueDate,
          tokenId: `cert-${studentId}-${certificateType}`, // Create deterministic token ID
          transactionHash: 'Blockchain Verified', // Your contract doesn't store TX hash
          ipfsHash: blockchainData.ipfsHash,
          department: 'Computer Science', // You might want to store this
          batch: '2024',
          yearOfPassing: new Date(blockchainData.issueDate * 1000).getFullYear(),
          mintedBy: blockchainData.mintedBy,
          isRevoked: false
        };
        
        setCertificateData(transformedData);
        setVerificationResult({
          isValid: true,
          message: 'Certificate verified successfully on blockchain!'
        });
      } else {
        setVerificationResult({
          isValid: false,
          message: 'Certificate not found on blockchain'
        });
      }

    } catch (error) {
      console.error('❌ Verification error:', error);
      
      if (error.message.includes('Certificate not found') || error.message.includes('does not exist')) {
        setVerificationResult({
          isValid: false,
          message: `No ${certificateTypeInput} certificate found for student ${inputValue}. Certificate may not be minted yet.`
        });
      } else if (error.message.includes('Unable to connect to blockchain')) {
        setVerificationResult({
          isValid: false,
          message: 'Unable to connect to blockchain network. Please check your internet connection and try again.'
        });
      } else {
        setVerificationResult({
          isValid: false,
          message: `Verification failed: ${error.message}`
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle URL parameters for direct verification
  useEffect(() => {
    if (studentId && certificateType) {
      setInputValue(studentId);
      setCertificateTypeInput(certificateType);
      // Auto-verify if both parameters are provided
      setTimeout(() => {
        handleVerification();
      }, 500);
    }
  }, [studentId, certificateType]);

  const certificateTypes = [
    { value: 'Degree', label: 'Degree Certificate' },
    { value: 'Provisional', label: 'Provisional Certificate' },
    { value: 'ConsolidatedMarksheet', label: 'Consolidated Marksheet' },
    { value: 'CourseCompletion', label: 'Course Completion Certificate' },
    { value: 'Transcript', label: 'Academic Transcript' },
    { value: 'Diploma', label: 'Diploma Certificate' },
    { value: 'RankCertificate', label: 'Rank Certificate' },
    { value: 'Participation', label: 'Participation Certificate' },
    { value: 'Merit', label: 'Merit Certificate' },
    { value: 'Character', label: 'Character Certificate' }
  ];

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    // Clear previous results when input changes
    if (verificationResult) {
      setVerificationResult(null);
      setCertificateData(null);
    }
  };

  const handleCertificateTypeChange = (e) => {
    setCertificateTypeInput(e.target.value);
    // Clear previous results when certificate type changes
    if (verificationResult) {
      setVerificationResult(null);
      setCertificateData(null);
    }
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = new Date(timestamp * 1000);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Blockchain Certificate Verification</h1>
          <p className="text-lg text-gray-600">
            Verify the authenticity of academic certificates on the blockchain
          </p>
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            No Wallet Required - Public Verification
          </div>
        </div>

        {/* Verification Input */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Register Number *
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Enter Student Register Number (e.g., 23AIB67, 21CS001)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleVerification()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificate Type *
              </label>
              <select
                value={certificateTypeInput}
                onChange={handleCertificateTypeChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {certificateTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleVerification}
              disabled={loading || !inputValue.trim() || !certificateTypeInput.trim()}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Verifying on Blockchain...
                </div>
              ) : (
                'Verify Certificate'
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <LoadingSpinner size="large" text="Verifying certificate on blockchain..." />
          </div>
        )}

        {verificationResult && !loading && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className={`p-4 rounded-lg mb-6 ${
              verificationResult.isValid
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center">
                <div className={`flex-shrink-0 w-5 h-5 ${
                  verificationResult.isValid ? 'text-green-400' : 'text-red-400'
                }`}>
                  {verificationResult.isValid ? '✓' : '✗'}
                </div>
                <div className="ml-3">
                  <h3 className={`text-lg font-medium ${
                    verificationResult.isValid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {verificationResult.isValid ? 'Certificate Verified' : 'Verification Failed'}
                  </h3>
                  <p className={`mt-1 text-sm ${
                    verificationResult.isValid ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {verificationResult.message}
                  </p>
                </div>
              </div>
            </div>

            {certificateData && verificationResult.isValid && (
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Certificate Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Student Name</label>
                      <p className="text-lg font-semibold text-gray-900">{certificateData.studentName}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Register Number</label>
                      <p className="text-lg font-semibold text-gray-900">{certificateData.registerNumber}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Course</label>
                      <p className="text-gray-900">{certificateData.course}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">CGPA/Grade</label>
                      <p className="text-lg font-semibold text-gray-900">{certificateData.cgpa}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Certificate Type</label>
                      <p className="text-gray-900">{certificateData.certificateType}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Issue Date</label>
                      <p className="text-gray-900">
                        {formatDate(certificateData.issueDate)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Minted By</label>
                      <p className="text-gray-900 font-mono text-sm">
                        {formatAddress(certificateData.mintedBy)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Verification QR</label>
                      <div className="mt-2">
                        <QRCodeGenerator 
                          data={`${window.location.origin}/verify/${certificateData.registerNumber}/${certificateData.certificateType}`}
                          size={100}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Blockchain Information */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Blockchain Verification</h4>
                  <div className="flex flex-wrap gap-4">
                    <div className="inline-flex items-center px-3 py-2 border border-green-300 text-sm font-medium rounded text-green-700 bg-green-50">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Verified on Blockchain
                    </div>
                    <div className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white">
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Student ID: {certificateData.registerNumber}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/verify/${certificateData.registerNumber}/${certificateData.certificateType}`);
                        alert('Verification link copied to clipboard!');
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Verification Link
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* How it works */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How Blockchain Verification Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Enter Details</h4>
              <p className="text-sm text-gray-600">
                Provide Student Register Number and Certificate Type
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Blockchain Query</h4>
              <p className="text-sm text-gray-600">
                System queries the Sepolia blockchain for certificate data
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Instant Result</h4>
              <p className="text-sm text-gray-600">
                Get verified certificate details directly from blockchain
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-800">Note</h4>
                <p className="text-sm text-blue-700 mt-1">
                  This portal only verifies certificates that have been <strong>minted on the blockchain</strong>. 
                  Approved but not-yet-minted certificates will show as not found. Students need to mint their approved certificates to make them publicly verifiable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPortal;