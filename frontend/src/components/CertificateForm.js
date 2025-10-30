import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const CertificateForm = ({ onSubmit, students, onCertificateMinted }) => {
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
  const [showGasInfo, setShowGasInfo] = useState(false);

  // Contract configuration
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const CONTRACT_ABI = [
    "function mintCertificate(address studentAddress, string studentName, string registerNumber, string course, string degree, string cgpa, string certificateType, string ipfsHash, string department, string batch, uint256 yearOfPassing) external returns (uint256)",
    "function collegeAuthorities(address) view returns (bool)",
    "event CertificateMinted(uint256 indexed tokenId, address indexed studentAddress, string registerNumber, string ipfsHash)"
  ];

  // Connect to MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        console.log('🔗 Connecting to MetaMask...');
        
       
        
        // Create provider and signer
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        console.log('✅ Connected to:', address);
        
        setCurrentAccount(address);
        setWalletConnected(true);
        setSigner(signer);
        
        // Check if connected account is authorized to mint
        try {
          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
          const isAuthorized = await contract.collegeAuthorities(address);
          console.log('🔐 Authorization check:', isAuthorized);
          
          if (!isAuthorized) {
            setResult({
              type: 'warning',
              message: 'Note: Connected wallet may not be authorized to mint certificates. Only college authorities can mint.'
            });
          }
        } catch (authError) {
          console.warn('Authorization check failed:', authError);
        }
        
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
        message: 'Please install MetaMask to mint certificates on the blockchain.'
      });
      return null;
    }
  };

  // Auto-connect wallet on component mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
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

  // Filter students based on register number input
  useEffect(() => {
    if (formData.registerNumber.length > 2) {
      const filtered = students.filter(student =>
        student.registerNumber.toLowerCase().includes(formData.registerNumber.toLowerCase()) ||
        student.name.toLowerCase().includes(formData.registerNumber.toLowerCase())
      );
      setFilteredStudents(filtered);
      setShowStudentDropdown(filtered.length > 0);
    } else {
      setFilteredStudents([]);
      setShowStudentDropdown(false);
    }
  }, [formData.registerNumber, students]);

  const handleStudentSelect = (student) => {
    setFormData({
      ...formData,
      name: student.name,
      registerNumber: student.registerNumber,
      email: student.email,
      course: student.course,
      degree: student.degree,
      cgpa: student.cgpa,
      walletAddress: student.walletAddress || '',
      department: student.department || '',
      batch: student.batch || '',
      yearOfPassing: student.yearOfPassing || new Date().getFullYear()
    });
    setShowStudentDropdown(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Real blockchain minting function
  const mintCertificateOnBlockchain = async (signer) => {
    console.log('🎯 Starting minting process...');
    
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    
    // Use provided wallet address or fallback to connected account
    const studentAddress = formData.walletAddress || currentAccount;
    
    console.log('📝 Minting certificate for:', {
      studentAddress,
      name: formData.name,
      registerNumber: formData.registerNumber,
      course: formData.course
    });

    // Show gas fee info
    setShowGasInfo(true);
    
    const tx = await contract.mintCertificate(
      studentAddress,
      formData.name,
      formData.registerNumber,
      formData.course,
      formData.degree,
      formData.cgpa,
      formData.certificateType,
      formData.ipfsHash,
      formData.department,
      formData.batch,
      formData.yearOfPassing
    );

    console.log('⏳ Transaction sent:', tx.hash);
    console.log('🔄 Waiting for confirmation...');

    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed:', receipt.hash);
    
    // Hide gas info after successful transaction
    setShowGasInfo(false);
    
    // Find the CertificateMinted event
    let tokenId = '1'; // Default fallback
    
    try {
      const event = receipt.logs?.map(log => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      }).find(parsed => parsed?.name === 'CertificateMinted');
      
      tokenId = event?.args?.tokenId?.toString() || '1';
      console.log('🎫 Certificate minted with Token ID:', tokenId);
    } catch (eventError) {
      console.warn('Could not parse mint event, using default token ID');
    }
    
    return {
      transactionHash: receipt.hash,
      tokenId: tokenId,
      ipfsHash: formData.ipfsHash
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setShowGasInfo(false);

    try {
      console.log('🚀 Starting certificate issuance...');

      // Validate form data
      if (!formData.name || !formData.registerNumber || !formData.course || !formData.degree) {
        throw new Error('Please fill in all required fields');
      }

      // Ensure wallet is connected
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

      // Mint certificate on blockchain
      const result = await mintCertificateOnBlockchain(currentSigner);

      setResult({
        type: 'success',
        message: 'Certificate successfully minted on blockchain!',
        data: {
          tokenId: result.tokenId,
          transactionHash: result.transactionHash,
          ipfsHash: result.ipfsHash,
          studentName: formData.name,
          registerNumber: formData.registerNumber
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
      if (onCertificateMinted) {
        onCertificateMinted(result);
      }

      console.log('🎉 Certificate minting completed successfully!');

    } catch (error) {
      console.error('❌ Error minting certificate:', error);
      setShowGasInfo(false);
      
      if (error.code === 'ACTION_REJECTED') {
        setResult({
          type: 'error',
          message: 'Transaction was rejected. Please confirm the transaction in MetaMask to mint the certificate.'
        });
      } else {
        setResult({
          type: 'error',
          message: `Failed to mint certificate: ${error.message}`
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Gas Fee Info Modal */}
      {showGasInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Transaction</h3>
              <p className="text-gray-600 mb-4">
                Please check MetaMask and confirm the transaction to mint the certificate.
                <br />
                <span className="text-sm text-gray-500">
                  Gas fees on local network are minimal.
                </span>
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="text-sm text-gray-700">
                  <div className="flex justify-between mb-1">
                    <span>Network:</span>
                    <span className="font-medium">Localhost 8545</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Action:</span>
                    <span className="font-medium">Mint Certificate NFT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Student:</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                </div>
              </div>
              <div className="animate-pulse text-sm text-blue-600">
                ⏳ Waiting for confirmation...
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Issue New Certificate</h2>
          <p className="text-blue-100 text-sm mt-1">
            Mint certificates directly on the blockchain
          </p>
          
          {/* Wallet Connection Status */}
          <div className="mt-2 flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${walletConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-blue-100 text-xs">
              {walletConnected 
                ? `Connected: ${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}` 
                : 'Wallet not connected'
              }
            </span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Gas Fee Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Gas Fee Required</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Minting certificates requires a small gas fee. On local network, this is minimal.
                  You'll need to confirm the transaction in MetaMask.
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
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredStudents.map((student) => (
                    <button
                      key={student._id}
                      type="button"
                      onClick={() => handleStudentSelect(student)}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-600">
                        {student.registerNumber} • {student.course} • CGPA: {student.cgpa}
                      </div>
                    </button>
                  ))}
                </div>
              )}
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
                Leave empty to use the connected wallet address: {currentAccount}
              </p>
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
                Certificate Type *
              </label>
              <select
                name="certificateType"
                value={formData.certificateType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Degree">Degree Certificate</option>
                <option value="Provisional">Provisional Certificate</option>
                <option value="CourseCompletion">Course Completion</option>
                <option value="Diploma">Diploma</option>
                <option value="Transcript">Transcript</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IPFS Hash
              </label>
              <input
                type="text"
                name="ipfsHash"
                value={formData.ipfsHash}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Qm..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Unique identifier for certificate metadata on IPFS
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 space-x-4">
            <button
              type="button"
              onClick={connectWallet}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium transition-colors duration-200"
            >
              {walletConnected ? 'Reconnect Wallet' : 'Connect Wallet'}
            </button>
            
            <button
              type="submit"
              disabled={loading || !walletConnected}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Minting on Blockchain...
                </div>
              ) : (
                'Mint Certificate'
              )}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className={`mt-6 p-4 rounded-md border ${
          result.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : result.type === 'warning'
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-start">
            <div className={`flex-shrink-0 w-5 h-5 mt-0.5 ${
              result.type === 'success' ? 'text-green-400' 
              : result.type === 'warning' ? 'text-yellow-400' 
              : 'text-red-400'
            }`}>
              {result.type === 'success' ? '✓' : result.type === 'warning' ? '⚠' : '✗'}
            </div>
            <div className="ml-3">
              <p className="font-medium">{result.message}</p>
              {result.data && (
                <div className="mt-2 text-sm space-y-1">
                  <p><strong>Token ID:</strong> {result.data.tokenId}</p>
                  <p><strong>Transaction:</strong> 
                    <span className="text-blue-600 ml-1 font-mono">
                      {result.data.transactionHash.slice(0, 10)}...{result.data.transactionHash.slice(-8)}
                    </span>
                  </p>
                  <p><strong>IPFS Hash:</strong> {result.data.ipfsHash}</p>
                  <p><strong>Student:</strong> {result.data.studentName} ({result.data.registerNumber})</p>
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