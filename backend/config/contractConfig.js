// src/config/contractConfig.js - FRONTEND VERSION
import { ethers } from 'ethers';

export const contractConfig = {
  address: "0x097B40DE741E4430eCF89920CD6e1f2B478ca944",
  abi: [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "AccessControlBadConfirmation",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "bytes32",
          "name": "neededRole",
          "type": "bytes32"
        }
      ],
      "name": "AccessControlUnauthorizedAccount",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_studentId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_studentName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_courseName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_grade",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_ipfsHash",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_certificateType",
          "type": "string"
        }
      ],
      "name": "allowStudentToMint",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "string",
          "name": "studentId",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "mintedBy",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "issueDate",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "ipfsHash",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "certificateType",
          "type": "string"
        }
      ],
      "name": "CertificateMinted",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "grantRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_studentId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_studentName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_courseName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_grade",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_ipfsHash",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_certificateType",
          "type": "string"
        }
      ],
      "name": "mintCertificate",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "callerConfirmation",
          "type": "address"
        }
      ],
      "name": "renounceRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "revokeRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_studentId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_certificateType",
          "type": "string"
        }
      ],
      "name": "revokeStudentEligibility",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "previousAdminRole",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "newAdminRole",
          "type": "bytes32"
        }
      ],
      "name": "RoleAdminChanged",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "RoleGranted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "RoleRevoked",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "string",
          "name": "studentId",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "studentName",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "courseName",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "grade",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "ipfsHash",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "certificateType",
          "type": "string"
        }
      ],
      "name": "StudentAllowed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "string",
          "name": "studentId",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "certificateType",
          "type": "string"
        }
      ],
      "name": "StudentRevoked",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "name": "addressToMintedCertificates",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "ADMIN_ROLE",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_studentId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_certificateType",
          "type": "string"
        }
      ],
      "name": "canIMint",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "name": "certificates",
      "outputs": [
        {
          "internalType": "string",
          "name": "studentId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "studentName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "courseName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "grade",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "ipfsHash",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "certificateType",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "issueDate",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "mintedBy",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "isMinted",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "certificateTypes",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "DEFAULT_ADMIN_ROLE",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getAllCertificateTypes",
      "outputs": [
        {
          "internalType": "string[]",
          "name": "",
          "type": "string[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_studentId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_certificateType",
          "type": "string"
        }
      ],
      "name": "getCertificate",
      "outputs": [
        {
          "internalType": "string",
          "name": "studentName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "courseName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "grade",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "ipfsHash",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "issueDate",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "mintedBy",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "isMinted",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        }
      ],
      "name": "getRoleAdmin",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_studentId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_certificateType",
          "type": "string"
        }
      ],
      "name": "getStudentEligibility",
      "outputs": [
        {
          "internalType": "bool",
          "name": "isEligible",
          "type": "bool"
        },
        {
          "internalType": "string",
          "name": "studentName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "courseName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "grade",
          "type": "string"
        },
        {
          "internalType": "bool",
          "name": "hasMinted",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_studentAddress",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "_certificateType",
          "type": "string"
        }
      ],
      "name": "hasAddressMinted",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "hasRole",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_studentId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_certificateType",
          "type": "string"
        }
      ],
      "name": "hasStudentMinted",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_certificateType",
          "type": "string"
        }
      ],
      "name": "isValidCertificateType",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "name": "studentEligibility",
      "outputs": [
        {
          "internalType": "bool",
          "name": "isEligible",
          "type": "bool"
        },
        {
          "internalType": "string",
          "name": "studentId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "studentName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "courseName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "grade",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "ipfsHash",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "certificateType",
          "type": "string"
        },
        {
          "internalType": "bool",
          "name": "hasMinted",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "interfaceId",
          "type": "bytes4"
        }
      ],
      "name": "supportsInterface",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_studentId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_certificateType",
          "type": "string"
        }
      ],
      "name": "verifyCertificate",
      "outputs": [
        {
          "internalType": "bool",
          "name": "exists",
          "type": "bool"
        },
        {
          "internalType": "string",
          "name": "studentName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "courseName",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "grade",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "ipfsHash",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "issueDate",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "mintedBy",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  network: "sepolia",
  chainId: 11155111
};

// FRONTEND CONTRACT CONNECTION (uses MetaMask)
export const getContract = async () => {
  try {
    console.log('🔄 Starting frontend contract connection...');
    
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
    }

    // Check if we're connected to MetaMask
    console.log('🔍 Checking MetaMask accounts...');
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    console.log('📝 Available accounts:', accounts);
    
    if (accounts.length === 0) {
      throw new Error("Please connect your MetaMask wallet first.");
    }

    // Use BrowserProvider for ethers v6
    console.log('🔗 Creating provider...');
    const provider = new ethers.BrowserProvider(window.ethereum);
    console.log('✅ Provider created');
    
    // Get signer
    console.log('🔑 Getting signer...');
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    console.log('✅ Signer obtained:', address);
    
    // Create contract instance
    console.log('📄 Creating contract instance...');
    const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer);
    console.log('✅ Contract instance created with address:', contractConfig.address);
    
    return contract;
  } catch (error) {
    console.error('❌ Error in getContract:', error);
    throw new Error(`Failed to connect to contract: ${error.message}`);
  }
};

// Alternative: Direct connection that requests account access
export const getDirectContract = async () => {
  try {
    console.log('🔄 Creating direct contract connection...');
    
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }
    
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(
      contractConfig.address,
      contractConfig.abi,
      signer
    );
    
    console.log('✅ Direct contract connection successful');
    return contract;
  } catch (error) {
    console.error('❌ Error in getDirectContract:', error);
    throw error;
  }
};