import React, { useState } from 'react';
import { getContract } from '../config/contractConfig';
import { ethers } from 'ethers';
import { certificateAPI } from '../services/api';

const CertificateMinter = ({ approvedCertificates, studentInfo, onMintResult, onCertificateMinted }) => {
  const [minting, setMinting] = useState({});

  // Check if certificate is already minted
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

  // Update certificate status
  const updateCertificateStatus = async (certificateId, transactionHash, blockNumber, tokenId, blockchainIssueDate = null) => {
    try {
      const mintedAt = blockchainIssueDate || new Date().toISOString();
      
      const updateData = {
        status: 'minted',
        transactionHash: transactionHash,
        blockNumber: blockNumber,
        blockchainConfirmed: true,
        tokenId: tokenId,
        mintedAt: mintedAt
      };

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

  // Get gas prices
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

  // Get token ID
  const getTokenIdForCertificate = async (certificate) => {
    if (!studentInfo?.registerNumber) {
      return `cert-${certificate._id}`;
    }

    try {
      const contract = await getContract();
      const tokenId = `cert-${studentInfo.registerNumber}-${certificate.certificateType}`;

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

  // Main mint function
  const mintCertificate = async (certificate) => {
    if (!studentInfo?.registerNumber) {
      onMintResult({
        type: "error",
        message: "Student information not available",
        details: "Please refresh the page and try again."
      });
      return;
    }

    try {
      setMinting((prev) => ({ ...prev, [certificate._id]: true }));
      onMintResult(null);

      // Check if already minted
      const alreadyMinted = await checkIfAlreadyMinted(certificate);
      if (alreadyMinted) {
        const tokenId = await getTokenIdForCertificate(certificate);
        throw new Error(`Certificate type already minted on blockchain. Token ID: ${tokenId}`);
      }

      await switchToSepoliaNetwork();
      const contract = await getContract();

      // Get stored student data
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

      // Get gas prices
      const gasPrices = await getGasPrices();

      // Prepare transaction
      const txParams = {
        gasLimit: 500000n,
      };

      if (gasPrices.supportsEIP1559) {
        txParams.maxFeePerGas = gasPrices.maxFeePerGas;
        txParams.maxPriorityFeePerGas = gasPrices.maxPriorityFeePerGas;
      } else {
        txParams.gasPrice = gasPrices.gasPrice;
      }

      // Check wallet balance
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(studentInfo.walletAddress);
      const estimatedGasCost = txParams.gasLimit * (txParams.maxFeePerGas || txParams.gasPrice || ethers.parseUnits("20", "gwei"));

      if (balance < estimatedGasCost) {
        throw new Error(`Insufficient funds. Need ~${ethers.formatEther(estimatedGasCost)} ETH but have ${ethers.formatEther(balance)} ETH`);
      }

      // Send transaction
      const tx = await contract.mintCertificate(
        studentInfo.registerNumber,
        studentInfo.name,
        storedCourseName,
        storedGrade,
        certificate.ipfsHash || "QmDefaultIPFSHashPlaceholder123456789",
        certificate.certificateType,
        txParams
      );

      onMintResult({
        type: "info",
        message: "Minting certificate... This may take a few moments.",
        transactionHash: tx.hash,
      });

      // Wait for confirmation
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        let blockchainIssueDate = null;
        let tokenId;

        try {
          const certificateData = await contract.getCertificate(
            studentInfo.registerNumber,
            certificate.certificateType
          );

          if (certificateData && certificateData.issueDate) {
            blockchainIssueDate = new Date(Number(certificateData.issueDate) * 1000).toISOString();
            console.log(`📅 Blockchain issue date: ${blockchainIssueDate}`);
          }

          tokenId = await getTokenIdForCertificate(certificate);
        } catch (tokenError) {
          console.error('Error fetching certificate data:', tokenError);
          tokenId = `cert-${studentInfo.registerNumber}-${certificate.certificateType}-${receipt.blockNumber}`;
          blockchainIssueDate = new Date().toISOString();
        }

        // Create minted data
        const mintedData = {
          ...certificate,
          status: "minted",
          mintedAt: blockchainIssueDate || new Date().toISOString(),
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          blockchainConfirmed: true,
          tokenId: tokenId,
        };

        // Update parent component
        onCertificateMinted(certificate._id, mintedData);

        onMintResult({
          type: "success",
          message: `🎉 ${certificate.certificateType} Certificate Minted Successfully!`,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          tokenId: tokenId,
          issuedDate: blockchainIssueDate || new Date().toISOString()
        });

        // Update backend
        await updateCertificateStatus(
          certificate._id, 
          tx.hash, 
          receipt.blockNumber, 
          tokenId, 
          blockchainIssueDate
        );

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

        // Move to minted section
        onCertificateMinted(certificate._id, {
          ...certificate,
          status: "minted",
          blockchainConfirmed: true,
          mintedAt: new Date().toISOString(),
          tokenId: tokenId,
        });

        // Update backend
        updateCertificateStatus(certificate._id, null, null, tokenId);
      }

      onMintResult({
        type: "error",
        message: userMessage,
        details: details
      });
    } finally {
      setMinting((prev) => ({ ...prev, [certificate._id]: false }));
    }
  };

  return (
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
  );
};

export default CertificateMinter;