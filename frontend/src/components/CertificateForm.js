import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Import from frontend config
import { contractConfig } from '../config/contractConfig';

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

  // ✅ USE THE IMPORTED CONTRACT CONFIG
  const CONTRACT_ADDRESS = contractConfig.address;
  const CONTRACT_ABI = contractConfig.abi;

  // Certificate types for admin to select
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

  // ✅ ADD COMPREHENSIVE DEBUG LOGS
  useEffect(() => {
    console.log('🔍 [DEBUG] CertificateForm mounted');
    console.log('📦 [DEBUG] Students prop received:', students);
    console.log('📊 [DEBUG] Number of students:', students.length);
    if (students.length > 0) {
      console.log('👤 [DEBUG] First student structure:', students[0]);
      console.log('🔑 [DEBUG] First student keys:', Object.keys(students[0]));
    }
  }, [students]);

  // Connect to MetaMask (Admin wallet)
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        console.log('🔗 Connecting to MetaMask...');

        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        const address = accounts[0];

        const provider = new ethers.BrowserProvider(window.ethereum, "any");
        const signer = await provider.getSigner();

        console.log('✅ Connected to:', address);

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

  // Auto-connect wallet on component mount
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
            console.log('🔄 Auto-connected to:', address);
          }
        } catch (error) {
          console.log('No auto-connection available');
        }
      }
    };

    checkWalletConnection();
  }, []);

  // ✅ IMPROVED: Filter students based on register number input
  useEffect(() => {
    console.log('🎯 [DEBUG] Search triggered with:', formData.registerNumber);
    console.log('📚 [DEBUG] Total students available:', students.length);
    
    if (formData.registerNumber.length > 1) { // Reduced from 2 to 1 for better UX
      const filtered = students.filter(student => {
        const registerMatch = student.registerNumber?.toLowerCase().includes(formData.registerNumber.toLowerCase());
        const nameMatch = student.name?.toLowerCase().includes(formData.registerNumber.toLowerCase());
        const studentIdMatch = student.studentId?.toLowerCase().includes(formData.registerNumber.toLowerCase());
        
        console.log('🔎 [DEBUG] Student:', student.name, {
          registerNumber: student.registerNumber,
          studentId: student.studentId,
          registerMatch,
          nameMatch,
          studentIdMatch
        });
        
        return registerMatch || nameMatch || studentIdMatch;
      });
      
      console.log('✅ [DEBUG] Filtered students found:', filtered.length);
      console.log('📋 [DEBUG] Filtered students:', filtered);
      
      setFilteredStudents(filtered);
      setShowStudentDropdown(filtered.length > 0);
    } else {
      setFilteredStudents([]);
      setShowStudentDropdown(false);
    }
  }, [formData.registerNumber, students]);

  // ✅ IMPROVED: Better student selection with fallbacks
  const handleStudentSelect = (student) => {
    console.log('🎯 [DEBUG] Student selected:', student);
    console.log('📊 [DEBUG] Selected student data:', {
      name: student.name,
      registerNumber: student.registerNumber,
      studentId: student.studentId,
      email: student.email,
      course: student.course,
      department: student.department,
      cgpa: student.cgpa
    });

    // Use fallbacks for all fields
    setFormData({
      name: student.name || '',
      registerNumber: student.registerNumber || student.studentId || '',
      email: student.email || '',
      course: student.course || student.certificates?.[0]?.courseName || 'Not specified',
      degree: student.degree || 'B.Tech',
      cgpa: student.cgpa || student.cgpa || '0.0',
      walletAddress: student.walletAddress || '',
      certificateType: 'Degree',
      department: student.department || student.department || '',
      batch: student.batch || (student.yearOfPassing ? `${student.yearOfPassing - 4}-${student.yearOfPassing}` : 'Unknown'),
      yearOfPassing: student.yearOfPassing || new Date().getFullYear(),
      ipfsHash: `Qm${student.registerNumber || student.studentId}${Date.now()}${Math.random().toString(36).substr(2, 6)}`
    });
    
    setShowStudentDropdown(false);
    console.log('✅ [DEBUG] Form auto-filled successfully');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // ✅ NEW: Approve student for self-minting
  const approveStudentForMinting = async (signer) => {
    console.log('🎯 Starting approval process...');

    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      console.log('📝 Approving student for minting:', {
        studentId: formData.registerNumber,
        name: formData.name,
        course: formData.course,
        grade: formData.cgpa,
        certificateType: formData.certificateType
      });

      // Generate IPFS hash based on certificate type and student data
      const ipfsHash = `Qm${formData.registerNumber}${formData.certificateType}${Date.now()}`;

      // Call allowStudentToMint function
      const tx = await contract.allowStudentToMint(
        formData.registerNumber, // studentId
        formData.name,           // studentName
        `${formData.course} - ${formData.certificateType}`, // courseName + certificate type
        `CGPA: ${formData.cgpa} | ${formData.certificateType}`, // grade + certificate type
        ipfsHash                 // ipfsHash
      );

      console.log('⏳ Approval transaction sent:', tx.hash);
      console.log('🔄 Waiting for confirmation...');

      const receipt = await tx.wait();
      console.log('✅ Approval confirmed:', receipt.hash);

      return {
        transactionHash: receipt.hash,
        studentId: formData.registerNumber,
        studentName: formData.name,
        certificateType: formData.certificateType,
        ipfsHash: ipfsHash
      };
    } catch (error) {
      console.error('❌ Error approving student:', error);
      throw error;
    }
  };

  // ✅ NEW: Check if student can mint
  const checkStudentEligibility = async (studentId) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum, "any");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      const [canMint, message] = await contract.canIMint(studentId);
      const eligibility = await contract.getStudentEligibility(studentId);
      
      return {
        canMint,
        message,
        eligibility
      };
    } catch (error) {
      console.error('Error checking eligibility:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      console.log('🚀 Starting certificate approval...');

      // Validate form data
      if (!formData.name || !formData.registerNumber || !formData.course || !formData.degree || !formData.cgpa) {
        throw new Error('Please fill in all required fields');
      }

      // Ensure wallet is connected (Admin wallet)
      let currentSigner = signer;
      if (!currentSigner) {
        console.log('🔗 No signer found, connecting wallet...');
        const connection = await connectWallet();
        if (!connection) {
          throw new Error('Wallet connection failed');
        }
        currentSigner = connection.signer;
      }

      if (!currentSigner) {
        throw new Error('No signer available for transaction');
      }

      // First, check if student is already approved
      console.log('🔍 Checking current student eligibility...');
      const eligibility = await checkStudentEligibility(formData.registerNumber);
      
      if (eligibility && eligibility.canMint) {
        throw new Error('Student is already approved for minting. They can now mint their own certificate.');
      }

      // Approve student for self-minting
      const result = await approveStudentForMinting(currentSigner);

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

      // Callback to parent component
      if (onCertificateApproved) {
        onCertificateApproved(result);
      }

      console.log('🎉 Student approval completed successfully!');

    } catch (error) {
      console.error('❌ Error approving student:', error);

      if (error.code === 'ACTION_REJECTED') {
        setResult({
          type: 'error',
          message: 'Transaction was rejected. Please confirm the transaction in MetaMask to approve the student.'
        });
      } else {
        setResult({
          type: 'error',
          message: `Failed to approve student: ${error.message}`
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-green-600 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Approve Student for Certificate</h2>
          <p className="text-green-100 text-sm mt-1">
            Approve students to mint their own certificates
          </p>

          {/* Wallet Connection Status */}
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
          {/* Debug Info Section */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Debug Info</h4>
                <p className="text-sm text-yellow-700">
                  Students loaded: {students.length} | Filtered: {filteredStudents.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  console.log('🔍 [MANUAL DEBUG] All students:', students);
                  console.log('🎯 [MANUAL DEBUG] Form data:', formData);
                  console.log('🔎 [MANUAL DEBUG] Filtered students:', filteredStudents);
                }}
                className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
              >
                Debug Data
              </button>
            </div>
          </div>

          {/* Flow Explanation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-800">How to Use</h4>
                <p className="text-sm text-blue-700 mt-1">
                  <strong>Step 1:</strong> Type register number to search and select student (auto-fills all fields)<br/>
                  <strong>Step 2:</strong> Select certificate type from dropdown<br/>
                  <strong>Step 3:</strong> Approve student for minting
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Register Number with Auto-complete */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Register Number *
              </label>
              <input
                type="text"
                name="registerNumber"
                value={formData.registerNumber}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type to search students..."
              />

              {/* Student Dropdown */}
              {showStudentDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredStudents.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No students found matching "{formData.registerNumber}"
                    </div>
                  ) : (
                    filteredStudents.map((student) => (
                      <button
                        key={student._id || student.registerNumber}
                        type="button"
                        onClick={() => handleStudentSelect(student)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-base">{student.name}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="font-semibold">Reg No:</span> {student.registerNumber || student.studentId} • 
                              <span className="font-semibold ml-2">Course:</span> {student.course} • 
                              <span className="font-semibold ml-2">CGPA:</span> {student.cgpa}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                              <span>{student.department}</span>
                              <span>•</span>
                              <span>{student.batch}</span>
                              <span>•</span>
                              <span>{student.email}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Certificate Type Selection */}
            <div>
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
            </div>

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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch *
              </label>
              <input
                type="text"
                name="batch"
                value={formData.batch}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 2021-2025"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year of Passing *
              </label>
              <input
                type="number"
                name="yearOfPassing"
                value={formData.yearOfPassing}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="2000"
                max="2030"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                name="walletAddress"
                value={formData.walletAddress}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0x... (optional - will use connected wallet)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Student's wallet address for receiving the certificate
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IPFS Hash (Auto-generated)
              </label>
              <input
                type="text"
                name="ipfsHash"
                value={formData.ipfsHash}
                onChange={handleChange}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                placeholder="Qm..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Unique identifier for certificate metadata (auto-generated)
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 space-x-4">
            <button
              type="button"
              onClick={connectWallet}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition-colors duration-200"
            >
              {walletConnected ? 'Reconnect Admin Wallet' : 'Connect Admin Wallet'}
            </button>

            <button
              type="submit"
              disabled={loading || !walletConnected}
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Approving Student...
                </div>
              ) : (
                `Approve for ${formData.certificateType}`
              )}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className={`mt-6 p-4 rounded-md border ${result.type === 'success'
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'
          }`}>
          <div className="flex items-start">
            <div className={`flex-shrink-0 w-5 h-5 mt-0.5 ${result.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {result.type === 'success' ? '✓' : '✗'}
            </div>
            <div className="ml-3">
              <p className="font-medium">{result.message}</p>
              {result.data && (
                <div className="mt-2 text-sm space-y-1">
                  <p><strong>Student ID:</strong> {result.data.studentId}</p>
                  <p><strong>Student Name:</strong> {result.data.studentName}</p>
                  <p><strong>Certificate Type:</strong> {result.data.certificateType}</p>
                  <p><strong>Transaction:</strong>
                    <span className="text-blue-600 ml-1 font-mono">
                      {result.data.transactionHash?.slice(0, 10)}...{result.data.transactionHash?.slice(-8)}
                    </span>
                  </p>
                  <p><strong>IPFS Hash:</strong> {result.data.ipfsHash}</p>
                  {result.data.note && (
                    <p className="text-green-700 font-medium">{result.data.note}</p>
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