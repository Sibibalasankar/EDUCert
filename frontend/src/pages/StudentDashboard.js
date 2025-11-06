import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import CertificateCard from '../components/CertificateCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { studentAPI, certificateAPI } from '../services/api';
import { getContract } from '../config/contractConfig';
import { ethers } from 'ethers';

const StudentDashboard = () => {
  const { isConnected, connectWallet, account } = useWeb3();
  const [mintedCertificates, setMintedCertificates] = useState([]);
  const [approvedCertificates, setApprovedCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);
  const [minting, setMinting] = useState({});
  const [mintResult, setMintResult] = useState(null);

  // ✅ FIXED: Check blockchain status for all certificates
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
          // Check if certificate is already minted on blockchain
          const hasMinted = await contract.hasStudentMinted(
            registerNumber,
            certificate.certificateType
          );

          if (hasMinted) {
            try {
              // ✅ FIXED: Get actual minting details from blockchain
              const certificateData = await contract.getCertificate(
                registerNumber,
                certificate.certificateType
              );

              // Convert BigInt timestamp to Date
              const issueDate = certificateData.issueDate ? 
                new Date(Number(certificateData.issueDate) * 1000).toISOString() : 
                new Date().toISOString();

              const tokenId = `cert-${registerNumber}-${certificate.certificateType}`;

              updatedCertificates.push({
                ...certificate,
                status: 'minted',
                blockchainConfirmed: true,
                tokenId: tokenId,
                // ✅ FIXED: Use blockchain issue date if available
                mintedAt: issueDate,
                blockNumber: certificateData.issueDate ? Number(certificateData.issueDate) : null,
                // Update from blockchain data
                studentName: certificateData.studentName || certificate.studentName,
                courseName: certificateData.courseName || certificate.courseName,
                grade: certificateData.grade || certificate.grade,
                ipfsHash: certificateData.ipfsHash || certificate.ipfsHash
              });
            } catch (certError) {
              console.log(`Could not fetch certificate details for ${certificate.certificateType}:`, certError.message);
              // Fallback if we can't get certificate details
              updatedCertificates.push({
                ...certificate,
                status: 'minted',
                blockchainConfirmed: true,
                tokenId: `cert-${registerNumber}-${certificate.certificateType}`,
                mintedAt: new Date().toISOString() // Fallback date
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

  // ✅ FIXED: Sync backend with blockchain state
  const syncBackendWithBlockchain = useCallback(async (certificates) => {
    try {
      for (const certificate of certificates) {
        // If certificate is minted on blockchain but backend doesn't know it
        if (certificate.blockchainConfirmed && certificate.status !== 'minted') {
          try {
            const updateData = {
              status: 'minted',
              blockchainConfirmed: true,
              tokenId: certificate.tokenId,
              // ✅ FIXED: Ensure mintedAt is properly set
              mintedAt: certificate.mintedAt || new Date().toISOString(),
              blockNumber: certificate.blockNumber,
              transactionHash: certificate.transactionHash
            };

            // Remove undefined values
            Object.keys(updateData).forEach(key => 
              updateData[key] === undefined && delete updateData[key]
            );

            await certificateAPI.updateCertificate(certificate._id, updateData);
            console.log(`✅ Updated backend for ${certificate.certificateType} with mintedAt: ${updateData.mintedAt}`);
          } catch (updateError) {
            console.log(`Failed to update backend for ${certificate.certificateType}:`, updateError.message);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing backend with blockchain:', error);
    }
  }, []);

  // Process certificates from student data with blockchain verification
  const processStudentCertificates = useCallback(async (student) => {
    try {
      const studentCerts = student.certificates || [];

      // First, check blockchain status for all certificates if we have register number
      let certificatesWithBlockchainStatus = studentCerts;
      if (student.studentId) {
        certificatesWithBlockchainStatus = await checkBlockchainStatus(studentCerts, student.studentId);
      }

      // Filter approved certificates that haven't been minted on blockchain
      const approved = certificatesWithBlockchainStatus.filter(c =>
        c && c.status === 'approved' && !c.blockchainConfirmed
      );

      // Filter minted certificates (either status is minted OR blockchainConfirmed is true)
      const minted = certificatesWithBlockchainStatus.filter(c =>
        c && (c.status === 'minted' || c.blockchainConfirmed === true)
      );

      setApprovedCertificates(approved);
      setMintedCertificates(minted);

      // Update backend if there are discrepancies between backend and blockchain
      if (student.studentId) {
        await syncBackendWithBlockchain(certificatesWithBlockchainStatus);
      }
    } catch (error) {
      console.error('Error processing certificates:', error);
    }
  }, [checkBlockchainStatus, syncBackendWithBlockchain]);

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

  // Check if certificate is already minted on blockchain
  const checkIfAlreadyMinted = async (certificate) => {
    if (!studentInfo?.registerNumber) {
      return false;
    }

    try {
      const contract = await getContract();
      const hasMinted = await contract.hasStudentMinted(
        studentInfo.registerNumber,
        certificate.certificateType
      );
      return hasMinted;
    } catch (error) {
      console.error('Error checking mint status:', error);
      return false;
    }
  };

  // ✅ FIXED: Update certificate status with proper issued date
  const updateCertificateStatus = async (certificateId, transactionHash, blockNumber, tokenId, blockchainIssueDate = null) => {
    try {
      // ✅ FIXED: Use blockchain issue date if available, otherwise use current time
      const mintedAt = blockchainIssueDate || new Date().toISOString();
      
      const updateData = {
        status: 'minted',
        transactionHash: transactionHash,
        blockNumber: blockNumber,
        blockchainConfirmed: true,
        tokenId: tokenId,
        mintedAt: mintedAt // ✅ This ensures issued date is set
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      );

      console.log(`🔄 Updating backend certificate ${certificateId} with:`, updateData);
      
      const response = await certificateAPI.updateCertificate(certificateId, updateData);
      
      if (response.data) {
        console.log(`✅ Backend updated successfully with mintedAt: ${mintedAt}`);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Certificate status update failed:', error.message);
      return null;
    }
  };

  // Switch to Sepolia network
  const switchToSepoliaNetwork = async () => {
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });

      if (chainId !== '0xaa36a7') {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          });
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0xaa36a7',
                  chainName: 'Sepolia Test Network',
                  rpcUrls: ['https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
                  nativeCurrency: {
                    name: 'Sepolia ETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  blockExplorerUrls: ['https://sepolia.etherscan.io']
                }
              ]
            });
          } else {
            throw switchError;
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to switch to Sepolia network: ${error.message}`);
    }
  };

  // Get gas prices with fallback for networks that don't support EIP-1559
  const getGasPrices = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      try {
        const feeData = await provider.getFeeData();
        return {
          maxFeePerGas: feeData.maxFeePerGas || ethers.parseUnits("25", "gwei"),
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || ethers.parseUnits("1", "gwei"),
          supportsEIP1559: true
        };
      } catch (e) {
        const gasPrice = await provider.getGasPrice();
        return {
          gasPrice: gasPrice,
          supportsEIP1559: false
        };
      }
    } catch (error) {
      return {
        gasPrice: ethers.parseUnits("20", "gwei"),
        supportsEIP1559: false
      };
    }
  };

  // ✅ FIXED: Main mint certificate function with proper issued date handling
  const mintCertificate = async (certificate) => {
    if (!studentInfo?.registerNumber) {
      setMintResult({
        type: "error",
        message: "Student information not available",
        details: "Please refresh the page and try again."
      });
      return;
    }

    try {
      setMinting((prev) => ({ ...prev, [certificate._id]: true }));
      setMintResult(null);

      // First check if already minted on blockchain
      const alreadyMinted = await checkIfAlreadyMinted(certificate);
      if (alreadyMinted) {
        // Get the actual token ID from blockchain
        const tokenId = await getTokenIdForCertificate(certificate);
        throw new Error(`Certificate type already minted on blockchain. Token ID: ${tokenId}`);
      }

      await switchToSepoliaNetwork();
      const contract = await getContract();

      // Get stored student data from contract
      const eligibility = await contract.getStudentEligibility(
        studentInfo.registerNumber,
        certificate.certificateType
      );

      const storedCourseName = eligibility[2];
      const storedGrade = eligibility[3];

      // Check if student can mint
      const [canMint, reason] = await contract.canIMint(
        studentInfo.registerNumber,
        certificate.certificateType
      );

      if (!canMint) {
        throw new Error(`Cannot mint: ${reason}`);
      }

      // Get gas prices with proper fallback
      const gasPrices = await getGasPrices();

      // Prepare transaction parameters based on network support
      const txParams = {
        gasLimit: 500000n,
      };

      // Add appropriate gas pricing based on network support
      if (gasPrices.supportsEIP1559) {
        txParams.maxFeePerGas = gasPrices.maxFeePerGas;
        txParams.maxPriorityFeePerGas = gasPrices.maxPriorityFeePerGas;
      } else {
        txParams.gasPrice = gasPrices.gasPrice;
      }

      // Check wallet balance
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(account);
      const estimatedGasCost = txParams.gasLimit * (txParams.maxFeePerGas || txParams.gasPrice || ethers.parseUnits("20", "gwei"));

      if (balance < estimatedGasCost) {
        throw new Error(`Insufficient funds. Need ~${ethers.formatEther(estimatedGasCost)} ETH but have ${ethers.formatEther(balance)} ETH`);
      }

      // Send actual transaction
      const tx = await contract.mintCertificate(
        studentInfo.registerNumber,
        studentInfo.name,
        storedCourseName,
        storedGrade,
        certificate.ipfsHash || "QmDefaultIPFSHashPlaceholder123456789",
        certificate.certificateType,
        txParams
      );

      setMintResult({
        type: "info",
        message: "Minting certificate... This may take a few moments.",
        transactionHash: tx.hash,
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        // ✅ FIXED: Get the actual blockchain issue date
        let blockchainIssueDate = null;
        let tokenId;

        try {
          // Get certificate data from blockchain to get the actual issue date
          const certificateData = await contract.getCertificate(
            studentInfo.registerNumber,
            certificate.certificateType
          );

          if (certificateData && certificateData.issueDate) {
            // Convert blockchain timestamp to ISO string
            blockchainIssueDate = new Date(Number(certificateData.issueDate) * 1000).toISOString();
            console.log(`📅 Blockchain issue date: ${blockchainIssueDate}`);
          }

          tokenId = await getTokenIdForCertificate(certificate);
        } catch (tokenError) {
          console.error('Error fetching certificate data:', tokenError);
          tokenId = `cert-${studentInfo.registerNumber}-${certificate.certificateType}-${receipt.blockNumber}`;
          blockchainIssueDate = new Date().toISOString(); // Fallback to current time
        }

        // ✅ FIXED: Create minted data with proper issued date
        const mintedData = {
          ...certificate,
          status: "minted",
          mintedAt: blockchainIssueDate || new Date().toISOString(), // Use blockchain date first
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          blockchainConfirmed: true,
          tokenId: tokenId,
        };

        // Update UI immediately - remove from approved and add to minted
        setApprovedCertificates(prev =>
          prev.filter(c => c._id !== certificate._id)
        );

        setMintedCertificates(prev => [...prev, mintedData]);

        setMintResult({
          type: "success",
          message: `🎉 ${certificate.certificateType} Certificate Minted Successfully!`,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          tokenId: tokenId,
          issuedDate: blockchainIssueDate || new Date().toISOString()
        });

        // ✅ FIXED: Update backend with proper issued date
        await updateCertificateStatus(
          certificate._id, 
          tx.hash, 
          receipt.blockNumber, 
          tokenId, 
          blockchainIssueDate // Pass blockchain issue date
        );

        // Refresh data to sync with backend
        setTimeout(() => {
          refreshData();
        }, 2000);

      } else {
        throw new Error("Transaction failed in block");
      }

    } catch (error) {
      let userMessage = "Minting failed";
      let details = error.message;

      if (error.message?.includes('insufficient funds')) {
        userMessage = "Insufficient ETH for gas fees";
        details = "You need test ETH on Sepolia network. Get free test ETH from Sepolia faucets.";
      } else if (error.message?.includes('Cannot mint')) {
        userMessage = "Not eligible to mint";
      } else if (error.message?.includes('user rejected')) {
        userMessage = "Transaction cancelled";
        details = "You rejected the transaction in MetaMask.";
      } else if (error.message?.includes('already minted')) {
        userMessage = "Certificate already minted";
        const tokenIdMatch = error.message.match(/Token ID: (.+)$/);
        const tokenId = tokenIdMatch ? tokenIdMatch[1] : 'Unknown';
        details = `This certificate type has already been minted on the blockchain. Token ID: ${tokenId}`;

        // If already minted, move it to minted section
        setApprovedCertificates(prev =>
          prev.filter(c => c._id !== certificate._id)
        );

        const alreadyMintedData = {
          ...certificate,
          status: "minted",
          blockchainConfirmed: true,
          mintedAt: new Date().toISOString(), // Set issued date
          tokenId: tokenId,
        };

        setMintedCertificates(prev => [...prev, alreadyMintedData]);

        // Also update backend with issued date
        updateCertificateStatus(certificate._id, null, null, tokenId);
      }

      setMintResult({
        type: "error",
        message: userMessage,
        details: details
      });
    } finally {
      setMinting((prev) => ({ ...prev, [certificate._id]: false }));
    }
  };

  // Get token ID for a minted certificate
  const getTokenIdForCertificate = async (certificate) => {
    if (!studentInfo?.registerNumber) {
      return `cert-${certificate._id}`;
    }

    try {
      const contract = await getContract();
      const tokenId = `cert-${studentInfo.registerNumber}-${certificate.certificateType}`;

      // Verify the certificate actually exists on blockchain
      try {
        const certificateData = await contract.getCertificate(
          studentInfo.registerNumber,
          certificate.certificateType
        );

        if (certificateData && certificateData.isMinted) {
          console.log(`✅ Certificate found on blockchain: ${tokenId}`);
          return tokenId;
        }
      } catch (certError) {
        console.log(`Certificate data not available for ${certificate.certificateType}:`, certError.message);
      }

      // Alternative check using hasStudentMinted
      const hasMinted = await contract.hasStudentMinted(
        studentInfo.registerNumber,
        certificate.certificateType
      );

      if (hasMinted) {
        console.log(`✅ Student has minted ${certificate.certificateType}: ${tokenId}`);
        return tokenId;
      }

      console.log(`⚠️ Certificate not found on blockchain, using fallback ID: ${tokenId}`);
      return tokenId;

    } catch (error) {
      console.error('Error in getTokenIdForCertificate:', error);
      return `cert-${studentInfo.registerNumber}-${certificate.certificateType}-fallback`;
    }
  };

  // Enhanced refresh data function
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

  // Add a force sync button for debugging
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
              <div className="flex-1">
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
                    ⚠️ No student record found for this wallet address ({account?.slice(0, 8)}...{account?.slice(-6)}).
                    <br />
                    Please make sure your wallet address is registered with your student account.
                  </div>
                )}
              </div>
              <div className="mt-4 sm:mt-0 flex flex-col space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Connected: {account?.slice(0, 8)}...{account?.slice(-6)}</span>
                </div>
                <button
                  onClick={refreshData}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Data
                </button>
                <button
                  onClick={forceSyncWithBlockchain}
                  className="text-sm text-purple-600 hover:text-purple-800 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync with Blockchain
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mint Result */}
        {mintResult && (
          <div className={`mb-6 p-4 rounded-md border ${mintResult.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            mintResult.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
            <div className="flex items-start">
              <div className={`flex-shrink-0 w-5 h-5 mt-0.5 ${mintResult.type === 'success' ? 'text-green-400' :
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

        {/* Approved Certificates - Ready to Mint */}
        {approvedCertificates.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h2 className="text-xl font-bold">Certificates Ready to Mint</h2>
                    <p className="text-green-100 mt-1">
                      You have {approvedCertificates.length} certificate(s) approved and ready to be minted as NFTs
                    </p>
                  </div>
                </div>
                <span className="bg-white text-green-600 text-sm font-bold px-3 py-1 rounded-full">
                  {approvedCertificates.length} PENDING MINT
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedCertificates.map((certificate) => (
                <div key={certificate._id} className="bg-white rounded-lg shadow-md border-2 border-green-200 hover:border-green-400 transition-all duration-200">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900 text-lg">{certificate.certificateType} Certificate</h3>
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                        APPROVED
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Student:</span>
                        <span className="font-medium">{studentInfo?.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Register No:</span>
                        <span className="font-medium">{studentInfo?.registerNumber}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Course:</span>
                        <span className="font-medium text-right">{studentInfo?.course}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">CGPA:</span>
                        <span className="font-medium">{studentInfo?.cgpa}</span>
                      </div>
                      {certificate.approvedAt && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Approved:</span>
                          <span className="font-medium">
                            {new Date(certificate.approvedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-green-700 text-sm">
                          This certificate is approved and ready to be minted as an NFT on the blockchain.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => mintCertificate(certificate)}
                      disabled={minting[certificate._id] || certificate.blockchainConfirmed}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 flex items-center justify-center"
                    >
                      {minting[certificate._id] ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Minting on Blockchain...
                        </>
                      ) : certificate.blockchainConfirmed ? (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Already Minted
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Mint on Blockchain
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
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