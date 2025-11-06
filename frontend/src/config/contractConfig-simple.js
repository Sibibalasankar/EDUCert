import { ethers } from 'ethers';

// ✅ SIMPLIFIED ABI - Only essential functions for production
export const simpleContractConfig = {
  address: "0x097B40DE741E4430eCF89920CD6e1f2B478ca944",
  abi: [
    // ADMIN_ROLE - Essential for role checking
    {
      "inputs": [],
      "name": "ADMIN_ROLE",
      "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
      "stateMutability": "view",
      "type": "function"
    },
    // DEFAULT_ADMIN_ROLE - Fallback for role checking
    {
      "inputs": [],
      "name": "DEFAULT_ADMIN_ROLE",
      "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
      "stateMutability": "view",
      "type": "function"
    },
    // hasRole - Essential for permission checking
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
    // canIMint - Essential for eligibility checking
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
    // allowStudentToMint - Essential for approval
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
  ],
  network: "sepolia",
  chainId: 11155111
};

// ✅ ENHANCED Contract connection with fallback
export const getRobustContract = async (useSimpleABI = false) => {
  try {
    console.log('🔄 Creating robust contract connection...');
    
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed.");
    }

    // Check connection
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length === 0) {
      throw new Error("Please connect your MetaMask wallet first.");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    let contract;
    
    if (useSimpleABI) {
      console.log('📋 Using simplified ABI for production');
      contract = new ethers.Contract(simpleContractConfig.address, simpleContractConfig.abi, signer);
    } else {
      console.log('📋 Using full ABI');
      contract = new ethers.Contract(contractConfig.address, contractConfig.abi, signer);
    }
    
    console.log('✅ Contract instance created');
    return contract;
  } catch (error) {
    console.error('❌ Error in getRobustContract:', error);
    throw error;
  }
};

// ✅ AUTO-DETECT environment and use appropriate ABI
export const getSmartContract = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
  
  // Use simple ABI in production, full ABI in development
  const useSimpleABI = isProduction && !isLocalhost;
  
  console.log('🌍 Environment detection:', {
    isProduction,
    isLocalhost,
    useSimpleABI
  });

  return await getRobustContract(useSimpleABI);
};