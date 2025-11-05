import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { contractConfig } from '../config/contractConfig';
import { studentAPI } from '../services/api';

const CertificateForm = ({ onSubmit, students = [], onCertificateApproved }) => {
  const [formData, setFormData] = useState({
    name: '',
    registerNumber: '',
    email: '',
    course: '',
    degree: '',
    cgpa: '',
    walletAddress: '',
    certificateType: 'Degree',
    department: '',
    batch: '',
    yearOfPassing: new Date().getFullYear(),
    ipfsHash: 'Qm' + Math.random().toString(36).substr(2, 44)
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState('');
  const [signer, setSigner] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const CONTRACT_ADDRESS = contractConfig.address;
  const CONTRACT_ABI = contractConfig.abi;

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

  // ✅ IMPROVED: Check if certificate exists
  const checkIfCertificateExists = (student, certificateType) => {
    if (!student.certificates || student.certificates.length === 0) {
      return false;
    }

    const existingCert = student.certificates.find(cert =>
      cert.certificateType === certificateType &&
      (cert.status === 'minted' || cert.status === 'approved')
    );

    if (existingCert) {
      console.log(`⚠️ Student already has ${certificateType} certificate:`, existingCert);
      return true;
    }

    return false;
  };

  // ✅ FIXED: Improved student filtering - matches StudentManagement structure
  useEffect(() => {
    if (searchTerm.length > 1) {
      const filtered = students.filter(student => {
        if (!student) return false;

        // Match the field names from StudentManagement component
        const registerMatch = student.registerNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        const nameMatch = student.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const emailMatch = student.email?.toLowerCase().includes(searchTerm.toLowerCase());

        return registerMatch || nameMatch || emailMatch;
      });
      setFilteredStudents(filtered);
      setShowStudentDropdown(filtered.length > 0);
    } else {
      setFilteredStudents([]);
      setShowStudentDropdown(false);
    }
  }, [searchTerm, students]);

  // ✅ FIXED: Updated to match StudentManagement data structure
  const handleStudentSelect = (student) => {
    console.log('🎯 Selected student from StudentManagement:', student);

    if (!student) {
      console.error('❌ No student data provided');
      return;
    }

    // Map the student data from StudentManagement structure to CertificateForm structure
    const newFormData = {
      name: student.name || '',
      registerNumber: student.registerNumber || '',
      email: student.email || '',
      course: student.course || '',
      degree: student.degree || 'B.Tech',
      cgpa: student.cgpa || '0.0',
      walletAddress: student.walletAddress || '',
      certificateType: 'Degree',
      department: student.department || '',
      batch: student.batch || '',
      yearOfPassing: student.yearOfPassing || new Date().getFullYear(),
      ipfsHash: `Qm${student.registerNumber}${Date.now()}${Math.random().toString(36).substr(2, 6)}`
    };

    console.log('📝 Setting form data from StudentManagement:', newFormData);
    setFormData(newFormData);
    setSearchTerm(student.registerNumber);
    setShowStudentDropdown(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ✅ FIXED: Improved search input handler
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // If search is cleared, clear the form
    if (value === '') {
      setFormData({
        name: '',
        registerNumber: '',
        email: '',
        course: '',
        degree: '',
        cgpa: '',
        walletAddress: '',
        certificateType: 'Degree',
        department: '',
        batch: '',
        yearOfPassing: new Date().getFullYear(),
        ipfsHash: 'Qm' + Math.random().toString(36).substr(2, 44)
      });
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        const address = accounts[0];
        const provider = new ethers.BrowserProvider(window.ethereum, "any");
        const signer = await provider.getSigner();

        setCurrentAccount(address);
        setWalletConnected(true);
        setSigner(signer);

        return { provider, signer, address };
      } catch (error) {
        console.error('❌ Error connecting wallet:', error);
        setResult({
          type: 'error',
          message: `Failed to connect wallet: ${error.message}`
        });
        return null;
      }
    } else {
      setResult({
        type: 'error',
        message: 'Please install MetaMask to approve certificates.'
      });
      return null;
    }
  };

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          if (accounts.length > 0) {
            const provider = new ethers.BrowserProvider(window.ethereum, "any");
            const signer = await provider.getSigner();
            const address = accounts[0];

            setCurrentAccount(address);
            setWalletConnected(true);
            setSigner(signer);
          }
        } catch (error) {
          console.log('No auto-connection available');
        }
      }
    };

    checkWalletConnection();
  }, []);

  // ✅ IMPROVED: Better eligibility checking
  // In CertificateForm.js - Update the checkStudentEligibility function
  const checkStudentEligibility = async (studentId, certificateType) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum, "any");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // ✅ FIX: Check if canIMint function exists in ABI, if not skip this check
      const hasCanIMint = CONTRACT_ABI.some(item =>
        item.name === 'canIMint' && item.type === 'function'
      );

      if (!hasCanIMint) {
        console.log('⚠️ canIMint function not found in ABI, skipping eligibility check');
        return { canMint: false, message: 'Eligibility check not available' };
      }

      const [canMint, message] = await contract.canIMint(studentId);
      console.log('🔍 Eligibility check result:', { canMint, message, studentId, certificateType });

      // Also check if student already has this certificate type in backend
      const student = students.find(s => s.registerNumber === studentId);
      if (student && checkIfCertificateExists(student, certificateType)) {
        return {
          canMint: false,
          message: `Student already has a ${certificateType} certificate minted`
        };
      }

      return { canMint, message };
    } catch (error) {
      console.error('Error checking eligibility:', error);
      // ✅ FIX: Don't block approval if eligibility check fails
      return { canMint: false, message: 'Eligibility check failed' };
    }
  };

  const approveStudentForMinting = async (signer) => {
    console.log('🎯 Approving student for minting:', formData.registerNumber);

    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // 🔥 Set IPFS Hash (or use your stored IPFS link from backend/upload)
      const ipfsHash = formData.ipfsHash || `Qm${Date.now()}${formData.registerNumber}`;

      // ✅ CALL THE CORRECT FUNCTION
      const tx = await contract.approveCertificate(
        formData.walletAddress,            // Student wallet address
        formData.registerNumber,           // Student ID
        formData.certificateType,          // Certificate Type
        ipfsHash                           // IPFS Hash
      );

      console.log('⏳ Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ Approval confirmed:', receipt.hash);

      return {
        transactionHash: receipt.hash,
        studentId: formData.registerNumber,
        studentName: formData.name,
        certificateType: formData.certificateType,
        ipfsHash
      };

    } catch (error) {
      console.error('❌ Blockchain approval error:', error);
      throw new Error("Blockchain approval failed. Check wallet & contract state.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      console.log('🚀 Starting certificate approval...');

      if (!formData.name || !formData.registerNumber || !formData.course || !formData.degree || !formData.cgpa) {
        throw new Error('Please fill in all required fields');
      }

      // Check if student already has this certificate type in backend
      const student = students.find(s => s.registerNumber === formData.registerNumber);
      if (student && checkIfCertificateExists(student, formData.certificateType)) {
        throw new Error(`Student already has a ${formData.certificateType} certificate minted. Cannot approve again.`);
      }

      let currentSigner = signer;
      if (!currentSigner) {
        const connection = await connectWallet();
        if (!connection) {
          throw new Error('Wallet connection failed');
        }
        currentSigner = connection.signer;
      }

      // ✅ FIX: Skip eligibility check if it fails, don't block approval
      console.log('🔍 Checking current student eligibility...');
      try {
        const eligibility = await checkStudentEligibility(formData.registerNumber, formData.certificateType);

        if (eligibility && eligibility.canMint) {
          throw new Error(`Student is already approved for ${formData.certificateType} certificate minting. They can now mint their own certificate.`);
        }
      } catch (eligibilityError) {
        console.warn('⚠️ Eligibility check failed, proceeding with approval:', eligibilityError.message);
        // Continue with approval even if eligibility check fails
      }

      // If student is not eligible or eligibility check failed, proceed with approval
      const result = await approveStudentForMinting(currentSigner);

      // Update backend after successful blockchain approval
      try {
        console.log('🔄 Updating backend with approval status...');
        const backendResponse = await studentAPI.approveStudent(formData.registerNumber, {
          certificateType: formData.certificateType,
          transactionHash: result.transactionHash,
          ipfsHash: result.ipfsHash,
          approvedBy: currentAccount,
          approvedAt: new Date().toISOString()
        });

        if (backendResponse.data.success) {
          console.log('✅ Backend updated successfully');
        }
      } catch (backendError) {
        console.error('⚠️ Backend update failed:', backendError);
        // Don't throw error - blockchain transaction succeeded
        // Just show a warning to the user
        setResult({
          type: 'warning',
          message: `Student approved on blockchain but backend update failed: ${backendError.response?.data?.error || backendError.message}`,
          data: {
            studentId: result.studentId,
            studentName: result.studentName,
            certificateType: result.certificateType,
            transactionHash: result.transactionHash,
            note: 'Student can mint certificate, but backend record may be incomplete.'
          }
        });
        return; // Exit early to prevent form reset
      }

      setResult({
        type: 'success',
        message: `Student successfully approved for ${formData.certificateType} certificate minting!`,
        data: {
          studentId: result.studentId,
          studentName: result.studentName,
          certificateType: result.certificateType,
          transactionHash: result.transactionHash,
          ipfsHash: result.ipfsHash,
          note: 'Student can now mint their certificate using their own wallet.'
        }
      });

      // Reset form
      setFormData({
        name: '',
        registerNumber: '',
        email: '',
        course: '',
        degree: '',
        cgpa: '',
        walletAddress: '',
        certificateType: 'Degree',
        department: '',
        batch: '',
        yearOfPassing: new Date().getFullYear(),
        ipfsHash: 'Qm' + Math.random().toString(36).substr(2, 44)
      });
      setSearchTerm('');

      if (onCertificateApproved) {
        onCertificateApproved(result);
      }

      console.log('🎉 Student approval completed successfully!');

    } catch (error) {
      console.error('❌ Error approving student:', error);
      setResult({
        type: 'error',
        message: error.message || 'Failed to approve student'
      });
    } finally {
      setLoading(false);
    }
  };

  // Debug: Log students data to see the structure
  useEffect(() => {
    console.log('📊 Students data in CertificateForm:', students);
  }, [students]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-green-600 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Approve Student for Certificate</h2>
          <p className="text-green-100 text-sm mt-1">
            Approve students to mint their own certificates (One per certificate type)
          </p>

          <div className="mt-2 flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${walletConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-green-100 text-xs">
              {walletConnected
                ? `Admin Connected: ${currentAccount?.slice(0, 6)}...${currentAccount?.slice(-4)}`
                : 'Admin Wallet not connected'
              }
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-800">How to Use</h4>
                <p className="text-sm text-blue-700 mt-1">
                  <strong>Step 1:</strong> Search student by register number or name<br />
                  <strong>Step 2:</strong> Select student (auto-fills all fields)<br />
                  <strong>Step 3:</strong> Choose certificate type and approve<br />
                  <strong>Note:</strong> Each student can mint only one of each certificate type
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Search Student */}
            <div className="relative md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Student by Register Number or Name *
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="Start typing register number or name..."
              />

              {showStudentDropdown && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-md shadow-xl max-h-80 overflow-y-auto">
                  {filteredStudents.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-500 text-center">
                      No students found matching "{searchTerm}"
                    </div>
                  ) : (
                    filteredStudents.map((student) => (
                      <button
                        key={student._id || student.registerNumber}
                        type="button"
                        onClick={() => handleStudentSelect(student)}
                        className="w-full text-left px-4 py-4 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-bold text-gray-900 text-lg">
                              {student.name || 'Unknown Name'}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {student.registerNumber || 'No Reg No'} • {student.course || 'No Course'}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              CGPA: {student.cgpa || 'N/A'} • {student.department || 'No Dept'} • {student.batch || 'No Batch'}
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-4">
                            <div className="bg-blue-100 text-blue-800 p-2 rounded-lg">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Certificate Type */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificate Type *
              </label>
              <select
                name="certificateType"
                value={formData.certificateType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {certificateTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Each student can mint only one of each certificate type
              </p>
            </div>

            {/* Auto-filled fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Register Number *
              </label>
              <input
                type="text"
                name="registerNumber"
                value={formData.registerNumber}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course *
              </label>
              <input
                type="text"
                name="course"
                value={formData.course}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Degree *
              </label>
              <input
                type="text"
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CGPA/GPA *
              </label>
              <input
                type="text"
                name="cgpa"
                value={formData.cgpa}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                readOnly
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 space-x-4 border-t border-gray-200">
            <button
              type="button"
              onClick={connectWallet}
              className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium"
            >
              {walletConnected ? '🔄 Reconnect Wallet' : '🔗 Connect Wallet'}
            </button>

            <button
              type="submit"
              disabled={loading || !walletConnected}
              className="bg-green-600 text-white px-8 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Approving Student...
                </>
              ) : (
                `✅ Approve for ${formData.certificateType}`
              )}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className={`mt-6 p-4 rounded-md border ${result.type === 'success'
          ? 'bg-green-50 border-green-200 text-green-800'
          : result.type === 'warning'
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800' // ✅ ADD WARNING STYLE
            : 'bg-red-50 border-red-200 text-red-800'
          }`}>
          <div className="flex items-start">
            <div className={`flex-shrink-0 w-5 h-5 mt-0.5 ${result.type === 'success' ? 'text-green-400'
              : result.type === 'warning' ? 'text-yellow-400' // ✅ ADD WARNING ICON
                : 'text-red-400'
              }`}>
              {result.type === 'success' ? '✓' : result.type === 'warning' ? '⚠' : '✗'}
            </div>
            <div className="ml-3">
              <p className="font-medium">{result.message}</p>
              {result.data && (
                <div className="mt-2 text-sm space-y-1">
                  <p><strong>Student ID:</strong> {result.data.studentId}</p>
                  <p><strong>Student Name:</strong> {result.data.studentName}</p>
                  <p><strong>Certificate Type:</strong> {result.data.certificateType}</p>
                  <p><strong>Transaction:</strong> {result.data.transactionHash?.slice(0, 10)}...{result.data.transactionHash?.slice(-8)}</p>
                  {result.data.note && (
                    <p className={`font-medium ${result.type === 'success' ? 'text-green-700' : 'text-yellow-700'
                      }`}>{result.data.note}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateForm;