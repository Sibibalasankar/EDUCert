import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
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

  // ✅ FIXED: Comprehensive debug logging
  useEffect(() => {
    console.log('🔍 [CERTIFICATE_FORM] Component mounted');
    console.log('📦 [CERTIFICATE_FORM] Students prop:', students);
    console.log('📊 [CERTIFICATE_FORM] Students count:', students.length);
    
    if (students.length > 0) {
      console.log('👤 [CERTIFICATE_FORM] First student:', students[0]);
      console.log('🔑 [CERTIFICATE_FORM] Student keys:', Object.keys(students[0]));
    }
  }, [students]);

  // ✅ FIXED: Separate search term from form data
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Also update the registerNumber in formData for consistency
    setFormData(prev => ({
      ...prev,
      registerNumber: value
    }));

    console.log('🔎 [SEARCH] Searching for:', value);

    if (value.length > 1) {
      const filtered = students.filter(student => {
        const registerMatch = student.registerNumber?.toLowerCase().includes(value.toLowerCase());
        const nameMatch = student.name?.toLowerCase().includes(value.toLowerCase());
        const studentIdMatch = student.studentId?.toLowerCase().includes(value.toLowerCase());
        
        return registerMatch || nameMatch || studentIdMatch;
      });
      
      console.log('✅ [SEARCH] Found students:', filtered.length);
      setFilteredStudents(filtered);
      setShowStudentDropdown(filtered.length > 0);
    } else {
      setFilteredStudents([]);
      setShowStudentDropdown(false);
    }
  };

  // ✅ FIXED: Proper student selection with detailed logging
  const handleStudentSelect = (student) => {
    console.log('🎯 [SELECT] Student selected:', student);
    console.log('📋 [SELECT] Full student data:', student);

    // Create new form data with ALL fields properly mapped
    const newFormData = {
      name: student.name || '',
      registerNumber: student.registerNumber || student.studentId || '',
      email: student.email || '',
      course: student.course || student.certificates?.[0]?.courseName || 'Not specified',
      degree: student.degree || 'B.Tech',
      cgpa: student.cgpa || '0.0',
      walletAddress: student.walletAddress || '',
      certificateType: 'Degree',
      department: student.department || '',
      batch: student.batch || (student.yearOfPassing ? `${student.yearOfPassing - 4}-${student.yearOfPassing}` : 'Unknown'),
      yearOfPassing: student.yearOfPassing || new Date().getFullYear(),
      ipfsHash: `Qm${student.registerNumber || student.studentId}${Date.now()}${Math.random().toString(36).substr(2, 6)}`
    };

    console.log('🔄 [SELECT] New form data to be set:', newFormData);
    
    // Set the form data
    setFormData(newFormData);
    setSearchTerm(student.registerNumber || student.studentId || '');
    setShowStudentDropdown(false);
    
    // Force a re-render and log the updated state
    setTimeout(() => {
      console.log('✅ [SELECT] Form data after update:', formData);
    }, 100);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`✏️ [CHANGE] Field ${name}: ${value}`);
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

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

      const ipfsHash = `Qm${formData.registerNumber}${formData.certificateType}${Date.now()}`;

      const tx = await contract.allowStudentToMint(
        formData.registerNumber,
        formData.name,
        `${formData.course} - ${formData.certificateType}`,
        `CGPA: ${formData.cgpa} | ${formData.certificateType}`,
        ipfsHash
      );

      console.log('⏳ Approval transaction sent:', tx.hash);
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
      console.log('📋 Form data being submitted:', formData);

      if (!formData.name || !formData.registerNumber || !formData.course || !formData.degree || !formData.cgpa) {
        throw new Error('Please fill in all required fields');
      }

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

      console.log('🔍 Checking current student eligibility...');
      const eligibility = await checkStudentEligibility(formData.registerNumber);
      
      if (eligibility && eligibility.canMint) {
        throw new Error('Student is already approved for minting. They can now mint their own certificate.');
      }

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
      setSearchTerm('');

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
          {/* Debug Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Debug Information</h4>
                <p className="text-sm text-yellow-700">
                  Students: {students.length} | Filtered: {filteredStudents.length} | Search: "{searchTerm}"
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Form Data - Name: "{formData.name}", Reg: "{formData.registerNumber}"
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  console.log('🔍 [MANUAL_DEBUG] All students:', students);
                  console.log('📋 [MANUAL_DEBUG] Form data:', formData);
                  console.log('🎯 [MANUAL_DEBUG] Filtered students:', filteredStudents);
                  console.log('🔎 [MANUAL_DEBUG] Search term:', searchTerm);
                }}
                className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
              >
                Debug Console
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-800">How to Use</h4>
                <p className="text-sm text-blue-700 mt-1">
                  <strong>Step 1:</strong> Type register number or name to search students<br/>
                  <strong>Step 2:</strong> Click on student from dropdown (auto-fills ALL fields)<br/>
                  <strong>Step 3:</strong> Select certificate type and approve
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Register Number with Auto-complete - FIXED */}
            <div className="relative md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Student by Register Number or Name *
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="Start typing register number (21AI001) or name (Sibi)..."
              />
              
              {/* Student Dropdown - FIXED */}
              {showStudentDropdown && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-md shadow-xl max-h-80 overflow-y-auto">
                  {filteredStudents.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-500 text-center">
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        No students found matching "{searchTerm}"
                      </div>
                    </div>
                  ) : (
                    filteredStudents.map((student) => (
                      <button
                        key={student._id || student.registerNumber}
                        type="button"
                        onClick={() => handleStudentSelect(student)}
                        className="w-full text-left px-4 py-4 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <div className="font-bold text-gray-900 text-lg">{student.name}</div>
                              <span className="ml-3 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                {student.eligibilityStatus || 'eligible'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-2 space-y-1">
                              <div><span className="font-semibold">Register No:</span> {student.registerNumber || student.studentId}</div>
                              <div><span className="font-semibold">Course:</span> {student.course}</div>
                              <div><span className="font-semibold">CGPA:</span> {student.cgpa} | <span className="font-semibold">Dept:</span> {student.department}</div>
                            </div>
                            <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-3">
                              <span>📧 {student.email}</span>
                              <span>📱 {student.phone}</span>
                              <span>🎓 {student.batch}</span>
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
              <p className="text-xs text-gray-500 mt-2">
                💡 Start typing to search students. Click on a student to auto-fill all fields.
              </p>
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
            </div>

            {/* Auto-filled fields - These should populate when student is selected */}
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
                placeholder="Will auto-fill when student is selected"
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
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                placeholder="Will auto-fill when student is selected"
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
                placeholder="Will auto-fill when student is selected"
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
                placeholder="Will auto-fill when student is selected"
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
                placeholder="Will auto-fill when student is selected"
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
                placeholder="Will auto-fill when student is selected"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                placeholder="Will auto-fill when student is selected"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                name="walletAddress"
                value={formData.walletAddress}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                placeholder="Will auto-fill when student is selected"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 font-mono text-sm"
                placeholder="Qm..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Unique identifier for certificate metadata (auto-generated when student is selected)
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-6 space-x-4 border-t border-gray-200">
            <button
              type="button"
              onClick={connectWallet}
              className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition-colors duration-200"
            >
              {walletConnected ? '🔄 Reconnect Wallet' : '🔗 Connect Wallet'}
            </button>

            <button
              type="submit"
              disabled={loading || !walletConnected}
              className="bg-green-600 text-white px-8 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors duration-200 flex items-center"
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