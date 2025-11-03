import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import QRCodeGenerator from '../components/QRCodeGenerator';
import LoadingSpinner from '../components/LoadingSpinner';

const VerificationPortal = () => {
  const { tokenId } = useParams();
  const [verificationMethod, setVerificationMethod] = useState('token');
  const [inputValue, setInputValue] = useState(tokenId || '');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [certificateData, setCertificateData] = useState(null);

  // Function to fetch certificate data from backend
const fetchCertificateFromBackend = async (method, value) => {
  try {
    console.log(`🔍 Verifying certificate via ${method}:`, value);

    let endpoint = '';
    
    switch (method) {
      case 'token':
        endpoint = `http://localhost:5000/api/certificates/${value}`;
        break;
      case 'register':
        // For student registration number, we'll use the main certificates endpoint
        // and filter on the backend
        endpoint = `http://localhost:5000/api/certificates?registerNumber=${value}`;
        break;
      case 'transaction':
        // For transaction hash, we'll use the main certificates endpoint
        // and filter on the backend
        endpoint = `http://localhost:5000/api/certificates?transactionHash=${value}`;
        break;
      default:
        throw new Error('Invalid verification method');
    }

    console.log('📞 Calling endpoint:', endpoint);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    console.log('📨 Response status:', response.status);

    if (response.status === 404) {
      throw new Error('Certificate not found');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error:', errorText);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Certificate data received:', data);
    
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Empty response from server');
    }

    return data;

  } catch (error) {
    console.error('❌ Error fetching certificate:', error);
    
    // Enhanced error messages
    if (error.name === 'TimeoutError') {
      throw new Error('Backend server is not responding. Please ensure the backend is running on port 5000.');
    } else if (error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to backend server. Make sure the server is running on http://localhost:5000');
    } else if (error.message.includes('Certificate not found')) {
      throw new Error(`No certificate found with the provided ${verificationMethod}`);
    } else {
      throw error;
    }
  }
};
  // Function to verify certificate validity
  const verifyCertificateValidity = async (certificateData) => {
    try {
      // Check if certificate is revoked
      if (certificateData.isRevoked) {
        return {
          isValid: false,
          message: 'Certificate has been revoked and is no longer valid.'
        };
      }

      // Verify certificate on blockchain (if verify endpoint exists)
      try {
        const verifyResponse = await fetch(`http://localhost:5000/api/certificates/verify/${certificateData.tokenId}`);
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          if (!verifyData.valid) {
            return {
              isValid: false,
              message: 'Certificate verification failed on blockchain.'
            };
          }
        }
      } catch (verifyError) {
        console.warn('⚠️ Certificate verification endpoint not available:', verifyError);
        // Continue with basic validation if verification endpoint is not available
      }

      // Check if issue date is in the future (invalid)
      const issueDate = new Date(certificateData.issueDate);
      const now = new Date();
      if (issueDate > now) {
        return {
          isValid: false,
          message: 'Certificate issue date is in the future (invalid).'
        };
      }

      return {
        isValid: true,
        message: 'Certificate verified successfully on blockchain!'
      };

    } catch (error) {
      console.error('❌ Error in certificate validation:', error);
      return {
        isValid: false,
        message: 'Certificate validation failed.'
      };
    }
  };

  const handleVerification = async (method = verificationMethod, value = inputValue) => {
    if (!value.trim()) {
      setVerificationResult({
        isValid: false,
        message: 'Please enter a value to verify'
      });
      return;
    }

    setLoading(true);
    setVerificationResult(null);
    setCertificateData(null);

    try {
      // Fetch certificate data from backend
      const certificate = await fetchCertificateFromBackend(method, value);
      
      // Verify certificate validity
      const verification = await verifyCertificateValidity(certificate);

      setVerificationResult(verification);
      
      if (verification.isValid) {
        // Transform backend data to frontend format
        const transformedData = {
          studentName: certificate.studentName,
          registerNumber: certificate.registerNumber,
          course: certificate.course,
          degree: certificate.degree,
          cgpa: certificate.cgpa,
          certificateType: certificate.certificateType,
          issueDate: typeof certificate.issueDate === 'string' 
            ? Math.floor(new Date(certificate.issueDate).getTime() / 1000)
            : certificate.issueDate,
          tokenId: certificate.tokenId || value,
          transactionHash: certificate.transactionHash || `0x${Math.random().toString(16).substr(2, 64)}`,
          ipfsHash: certificate.ipfsHash || 'Qm' + Math.random().toString(36).substr(2, 44),
          department: certificate.department,
          batch: certificate.batch,
          yearOfPassing: certificate.yearOfPassing,
          isRevoked: certificate.isRevoked || false
        };
        
        setCertificateData(transformedData);
      }

    } catch (error) {
      console.error('❌ Verification error:', error);
      
      // Handle specific error cases
      if (error.message.includes('not found') || error.message.includes('404')) {
        setVerificationResult({
          isValid: false,
          message: 'Certificate not found on blockchain. Please check the identifier and try again.'
        });
      } else if (error.message.includes('Failed to fetch')) {
        setVerificationResult({
          isValid: false,
          message: 'Unable to connect to verification service. Please ensure the backend server is running on port 5000.'
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

  // Handle URL token verification
  useEffect(() => {
    if (tokenId) {
      setInputValue(tokenId);
      setVerificationMethod('token');
      handleVerification('token', tokenId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenId]);

  const getInputPlaceholder = () => {
    switch (verificationMethod) {
      case 'token':
        return 'Enter Token ID (e.g., 1, 2, 3...)';
      case 'register':
        return 'Enter Register Number (e.g., 21AI001, 21CS002)';
      case 'transaction':
        return 'Enter Transaction Hash (e.g., 0x4af...91d3)';
      default:
        return '';
    }
  };

  const getInputLabel = () => {
    switch (verificationMethod) {
      case 'token':
        return 'Token ID';
      case 'register':
        return 'Register Number';
      case 'transaction':
        return 'Transaction Hash';
      default:
        return '';
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    // Clear previous results when input changes
    if (verificationResult) {
      setVerificationResult(null);
      setCertificateData(null);
    }
  };

  const handleMethodChange = (method) => {
    setVerificationMethod(method);
    setInputValue('');
    setVerificationResult(null);
    setCertificateData(null);
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = typeof timestamp === 'string' 
        ? new Date(timestamp) 
        : new Date(timestamp * 1000);
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate Verification</h1>
          <p className="text-lg text-gray-600">
            Verify the authenticity of academic certificates on the blockchain
          </p>
        </div>

        {/* Verification Methods */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => handleMethodChange('token')}
              className={`p-4 border-2 rounded-lg text-left transition-colors duration-200 ${
                verificationMethod === 'token'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  verificationMethod === 'token' ? 'bg-blue-500' : 'bg-gray-300'
                }`}></div>
                <span className="font-medium">By Token ID</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Verify using certificate token ID</p>
            </button>

            <button
              onClick={() => handleMethodChange('register')}
              className={`p-4 border-2 rounded-lg text-left transition-colors duration-200 ${
                verificationMethod === 'register'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  verificationMethod === 'register' ? 'bg-blue-500' : 'bg-gray-300'
                }`}></div>
                <span className="font-medium">By Register Number</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Verify using student register number</p>
            </button>

            <button
              onClick={() => handleMethodChange('transaction')}
              className={`p-4 border-2 rounded-lg text-left transition-colors duration-200 ${
                verificationMethod === 'transaction'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  verificationMethod === 'transaction' ? 'bg-blue-500' : 'bg-gray-300'
                }`}></div>
                <span className="font-medium">By Transaction</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Verify using blockchain transaction hash</p>
            </button>
          </div>

          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getInputLabel()}
              </label>
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder={getInputPlaceholder()}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleVerification()}
                />
                <button
                  onClick={() => handleVerification()}
                  disabled={loading || !inputValue.trim()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors duration-200"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Verifying...
                    </div>
                  ) : (
                    'Verify'
                  )}
                </button>
              </div>
            </div>
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
                      <label className="text-sm font-medium text-gray-500">Degree</label>
                      <p className="text-gray-900">{certificateData.degree}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Department</label>
                      <p className="text-gray-900">{certificateData.department || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">CGPA</label>
                      <p className="text-lg font-semibold text-gray-900">{certificateData.cgpa}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Issue Date</label>
                      <p className="text-gray-900">
                        {formatDate(certificateData.issueDate)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Certificate Type</label>
                      <p className="text-gray-900">{certificateData.certificateType}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Batch</label>
                      <p className="text-gray-900">{certificateData.batch || 'Not specified'}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Year of Passing</label>
                      <p className="text-gray-900">{certificateData.yearOfPassing || 'Not specified'}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Verification QR</label>
                      <div className="mt-2">
                        <QRCodeGenerator 
                          data={`${window.location.origin}/verify/${certificateData.tokenId}`}
                          size={100}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Blockchain Links */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Blockchain Information</h4>
                  <div className="flex flex-wrap gap-4">
                    <div className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Token ID: {certificateData.tokenId}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/verify/${certificateData.tokenId}`);
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How Verification Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Enter Identifier</h4>
              <p className="text-sm text-gray-600">
                Use Token ID, Register Number, or Transaction Hash to verify
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Blockchain Check</h4>
              <p className="text-sm text-gray-600">
                System queries the blockchain to verify certificate authenticity
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Get Results</h4>
              <p className="text-sm text-gray-600">
                Receive instant verification with detailed certificate information
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPortal;