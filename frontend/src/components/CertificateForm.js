import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { contractConfig } from '../config/contractConfig';
import { studentAPI } from '../services/api';

// ✅ SIMPLIFIED ABI for production - Only essential functions
const SIMPLIFIED_ABI = [
  // ADMIN_ROLE function
  {
    "inputs": [],
    "name": "ADMIN_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  },
  // DEFAULT_ADMIN_ROLE function
  {
    "inputs": [],
    "name": "DEFAULT_ADMIN_ROLE",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  },
  // hasRole function
  {
    "inputs": [
      {"internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"internalType": "address", "name": "account", "type": "address"}
    ],
    "name": "hasRole",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  // canIMint function
  {
    "inputs": [
      {"internalType": "string", "name": "_studentId", "type": "string"},
      {"internalType": "string", "name": "_certificateType", "type": "string"}
    ],
    "name": "canIMint",
    "outputs": [
      {"internalType": "bool", "name": "", "type": "bool"},
      {"internalType": "string", "name": "", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // allowStudentToMint function
  {
    "inputs": [
      {"internalType": "string", "name": "_studentId", "type": "string"},
      {"internalType": "string", "name": "_studentName", "type": "string"},
      {"internalType": "string", "name": "_courseName", "type": "string"},
      {"internalType": "string", "name": "_grade", "type": "string"},
      {"internalType": "string", "name": "_ipfsHash", "type": "string"},
      {"internalType": "string", "name": "_certificateType", "type": "string"}
    ],
    "name": "allowStudentToMint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

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

  // ✅ ENVIRONMENT DETECTION
  const isProduction = process.env.NODE_ENV === 'production';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // ✅ USE SIMPLIFIED ABI IN PRODUCTION, FULL ABI IN DEVELOPMENT
  const CONTRACT_ABI = (isProduction && !isLocalhost) ? SIMPLIFIED_ABI : contractConfig.abi;

  console.log('🌍 Environment:', { isProduction, isLocalhost, usingSimpleABI: (isProduction && !isLocalhost) });

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

  // ✅ FIXED: Improved student filtering
  useEffect(() => {
    if (searchTerm.length > 1) {
      const filtered = students.filter(student => {
        if (!student) return false;

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

  // ✅ FIXED: Student selection
  const handleStudentSelect = (student) => {
    console.log('🎯 Selected student from StudentManagement:', student);

    if (!student) {
      console.error('❌ No student data provided');
      return;
    }

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

  // ✅ FIXED: Enhanced wallet connection
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        console.log('🔗 Connecting wallet...');
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        const address = accounts[0];
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        setCurrentAccount(address);
        setWalletConnected(true);
        setSigner(signer);

        console.log('✅ Wallet connected:', address);
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
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = accounts[0];

            setCurrentAccount(address);
            setWalletConnected(true);
            setSigner(signer);
            console.log('🔗 Wallet auto-connected:', address);
          }
        } catch (error) {
          console.log('No auto-connection available');
        }
      }
    };

    checkWalletConnection();
  }, []);

  // ✅ FIXED: Enhanced contract creation with fallback
  const getContract = async (signerOrProvider) => {
    try {
      console.log('🔄 Creating contract instance...');
      
      // Try with selected ABI first
      try {
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
        console.log('✅ Contract created successfully');
        return contract;
      } catch (error) {
        console.warn('⚠️ Primary ABI failed, trying simplified ABI:', error.message);
        
        // Fallback to simplified ABI
        const contract = new ethers.Contract(CONTRACT_ADDRESS, SIMPLIFIED_ABI, signerOrProvider);
        console.log('✅ Contract created with simplified ABI');
        return contract;
      }
    } catch (error) {
      console.error('❌ All contract creation attempts failed:', error);
      throw new Error(`Contract connection failed: ${error.message}`);
    }
  };

  // ✅ FIXED: Enhanced admin role check with fallbacks
  const checkAdminRole = async (signer) => {
    try {
      console.log('🔐 Checking admin role...');
      const contract = await getContract(signer);
      
      let adminRole;
      const userAddress = await signer.getAddress();
      
      // Try ADMIN_ROLE first
      try {
        adminRole = await contract.ADMIN_ROLE();
        console.log('📋 ADMIN_ROLE bytes:', adminRole);
      } catch (adminError) {
        console.warn('⚠️ ADMIN_ROLE call failed, trying DEFAULT_ADMIN_ROLE:', adminError.message);
        
        // Try DEFAULT_ADMIN_ROLE as fallback
        try {
          adminRole = await contract.DEFAULT_ADMIN_ROLE();
          console.log('📋 DEFAULT_ADMIN_ROLE bytes:', adminRole);
        } catch (defaultError) {
          console.error('❌ Both ADMIN_ROLE and DEFAULT_ADMIN_ROLE failed');
          
          // Last resort: try to calculate ADMIN_ROLE manually
          adminRole = ethers.keccak256(ethers.toUtf8Bytes("ADMIN"));
          console.log('📋 Using calculated ADMIN_ROLE:', adminRole);
        }
      }

      // Check if we have a valid admin role
      if (!adminRole || adminRole === '0x') {
        console.error('❌ Invalid admin role received');
        return false;
      }

      const hasRole = await contract.hasRole(adminRole, userAddress);
      console.log('👤 Admin role check result:', { hasRole, address: userAddress });
      
      return hasRole;
    } catch (error) {
      console.error('❌ Error in admin role check:', error);
      return false;
    }
  };

  // ✅ FIXED: Enhanced eligibility check with production fallbacks
  const checkStudentEligibility = async (studentId, certificateType) => {
    try {
      console.log('🔍 Checking eligibility for:', { studentId, certificateType });
      
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = await getContract(provider);

      try {
        // Try direct call first
        const result = await contract.canIMint(studentId, certificateType);
        console.log('✅ Eligibility check result:', result);
        
        return { canMint: result[0], message: result[1] };
      } catch (callError) {
        console.warn('⚠️ Direct canIMint call failed, trying staticCall:', callError.message);
        
        // Try staticCall as fallback
        const result = await contract.canIMint.staticCall(studentId, certificateType);
        console.log('✅ Eligibility check result (staticCall):', result);
        
        return { canMint: result[0], message: result[1] };
      }
    } catch (error) {
      console.error('❌ All eligibility checks failed:', error);
      
      // Don't block the process - return a safe default
      return { 
        canMint: false, 
        message: 'Eligibility check unavailable - proceeding with manual approval' 
      };
    }
  };

  // ✅ FIXED: Enhanced approval function with comprehensive error handling
  const approveStudentForMinting = async (signer) => {
    console.log('🎯 Approving student for minting:', formData.registerNumber);

    try {
      const contract = await getContract(signer);

      // Check admin role (but don't block if it fails completely)
      const hasAdminRole = await checkAdminRole(signer);
      if (!hasAdminRole) {
        // Give user option to proceed anyway (transaction will fail naturally if not admin)
        const shouldProceed = window.confirm(
          'Admin role verification failed. The transaction will fail if your wallet is not an admin. Do you want to proceed anyway?'
        );
        
        if (!shouldProceed) {
          throw new Error('Transaction cancelled by user');
        }
        
        console.warn('⚠️ Proceeding with transaction despite admin role verification failure');
      }

      // Generate IPFS hash
      const ipfsHash = formData.ipfsHash || `Qm${Date.now()}${formData.registerNumber}`;

      console.log('📋 Calling allowStudentToMint with:', {
        studentId: formData.registerNumber,
        studentName: formData.name,
        courseName: formData.course,
        grade: formData.cgpa,
        ipfsHash: ipfsHash,
        certificateType: formData.certificateType
      });

      // Call the contract function
      const tx = await contract.allowStudentToMint(
        formData.registerNumber,
        formData.name,
        formData.course, 
        formData.cgpa,
        ipfsHash,
        formData.certificateType
      );

      console.log('⏳ Transaction sent:', tx.hash);
      setResult({
        type: 'info',
        message: `Transaction submitted... Waiting for confirmation`,
        data: { transactionHash: tx.hash }
      });

      const receipt = await tx.wait();
      console.log('✅ Approval confirmed:', receipt);

      return {
        transactionHash: receipt.hash,
        studentId: formData.registerNumber,
        studentName: formData.name,
        certificateType: formData.certificateType,
        ipfsHash
      };

    } catch (error) {
      console.error('❌ Blockchain approval error:', error);
      
      // Enhanced error handling
      if (error.message.includes('AccessControlUnauthorizedAccount')) {
        throw new Error('Your wallet does not have admin privileges. Please use an admin wallet.');
      } else if (error.message.includes('user rejected')) {
        throw new Error('Transaction was rejected by user. Please approve the transaction in MetaMask.');
      } else if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient funds for transaction. Please add ETH to your wallet.');
      } else if (error.message.includes('nonce')) {
        throw new Error('Transaction nonce error. Please reset your MetaMask account.');
      } else {
        throw new Error(`Blockchain transaction failed: ${error.reason || error.message}`);
      }
    }
  };

  // ✅ FIXED: Main submit handler with enhanced error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      console.log('🚀 Starting certificate approval process...');

      // Validate required fields
      if (!formData.name || !formData.registerNumber || !formData.course || !formData.degree || !formData.cgpa) {
        throw new Error('Please fill in all required fields (Name, Register Number, Course, Degree, CGPA)');
      }

      // Check if student already has this certificate in backend
      const student = students.find(s => s.registerNumber === formData.registerNumber);
      if (student && checkIfCertificateExists(student, formData.certificateType)) {
        throw new Error(`Student ${formData.registerNumber} already has a ${formData.certificateType} certificate. Cannot approve again.`);
      }

      // Connect wallet if not connected
      let currentSigner = signer;
      if (!currentSigner || !walletConnected) {
        const connection = await connectWallet();
        if (!connection) {
          throw new Error('Wallet connection failed. Please connect your MetaMask wallet.');
        }
        currentSigner = connection.signer;
      }

      // Check eligibility (but don't block if it fails)
      console.log('🔍 Checking student eligibility...');
      try {
        const eligibility = await checkStudentEligibility(formData.registerNumber, formData.certificateType);
        
        if (eligibility && eligibility.canMint) {
          throw new Error(`Student ${formData.registerNumber} is already approved for ${formData.certificateType} certificate. They can mint their certificate now.`);
        }
      } catch (eligibilityError) {
        console.warn('⚠️ Eligibility check failed, proceeding with approval:', eligibilityError.message);
        // Continue with approval even if eligibility check fails
      }

      // Approve student on blockchain
      const blockchainResult = await approveStudentForMinting(currentSigner);

      // Update backend after successful blockchain approval
      try {
        console.log('🔄 Updating backend with approval status...');
        const backendResponse = await studentAPI.approveStudent(formData.registerNumber, {
          certificateType: formData.certificateType,
          transactionHash: blockchainResult.transactionHash,
          ipfsHash: blockchainResult.ipfsHash,
          approvedBy: currentAccount,
          approvedAt: new Date().toISOString(),
          status: 'approved'
        });

        if (backendResponse.data.success) {
          console.log('✅ Backend updated successfully');
        }
      } catch (backendError) {
        console.error('⚠️ Backend update failed:', backendError);
        // Don't throw error - blockchain transaction succeeded
        setResult({
          type: 'warning',
          message: `Student approved on blockchain but backend update failed: ${backendError.response?.data?.error || backendError.message}`,
          data: {
            studentId: blockchainResult.studentId,
            studentName: blockchainResult.studentName,
            certificateType: blockchainResult.certificateType,
            transactionHash: blockchainResult.transactionHash,
            note: 'Student can mint certificate, but backend record may be incomplete.'
          }
        });
        return;
      }

      // Success result
      setResult({
        type: 'success',
        message: `Student ${formData.registerNumber} successfully approved for ${formData.certificateType} certificate minting!`,
        data: {
          studentId: blockchainResult.studentId,
          studentName: blockchainResult.studentName,
          certificateType: blockchainResult.certificateType,
          transactionHash: blockchainResult.transactionHash,
          ipfsHash: blockchainResult.ipfsHash,
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

      // Call callback if provided
      if (onCertificateApproved) {
        onCertificateApproved(blockchainResult);
      }

      console.log('🎉 Student approval completed successfully!');

    } catch (error) {
      console.error('❌ Error approving student:', error);
      setResult({
        type: 'error',
        message: error.message || 'Failed to approve student. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Debug: Log students data
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

          {/* Environment Indicator */}
          <div className="mt-2">
            <span className="text-green-100 text-xs">
              Environment: {isProduction ? 'Production' : 'Development'} | 
              ABI: {(isProduction && !isLocalhost) ? 'Simplified' : 'Full'}
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
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
            : 'bg-red-50 border-red-200 text-red-800'
          }`}>
          <div className="flex items-start">
            <div className={`flex-shrink-0 w-5 h-5 mt-0.5 ${result.type === 'success' ? 'text-green-400'
              : result.type === 'warning' ? 'text-yellow-400'
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