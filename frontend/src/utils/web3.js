import { ethers } from 'ethers';


const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // SAME NEW ADDRESS
// Contract ABI (we'll create this next)
const CONTRACT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function owner() view returns (address)",
  "function getCertificate(uint256 tokenId) view returns (tuple(string studentName, string registerNumber, string course, string degree, string cgpa, string certificateType, uint256 issueDate, string ipfsHash, string department, string batch, uint256 yearOfPassing, bool isRevoked))",
  "function getCertificateByRegisterNumber(string registerNumber) view returns (tuple(string studentName, string registerNumber, string course, string degree, string cgpa, string certificateType, uint256 issueDate, string ipfsHash, string department, string batch, uint256 yearOfPassing, bool isRevoked))",
  "function verifyCertificate(uint256 tokenId) view returns (bool)",
  "function getTotalCertificates() view returns (uint256)",
  "function collegeAuthorities(address) view returns (bool)",
  "function mintCertificate(address studentAddress, string studentName, string registerNumber, string course, string degree, string cgpa, string certificateType, string ipfsHash, string department, string batch, uint256 yearOfPassing) external",
  "event CertificateMinted(uint256 indexed tokenId, address indexed studentAddress, string registerNumber, string ipfsHash)"
];

export const connectWallet = async () => {
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      return { provider, signer, address };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  } else {
    throw new Error('Please install MetaMask!');
  }
};

export const getCertificateContract = (signerOrProvider) => {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
};

export const verifyCertificateOnChain = async (tokenId) => {
  try {
    const { provider } = await connectWallet();
    const contract = getCertificateContract(provider);
    return await contract.verifyCertificate(tokenId);
  } catch (error) {
    console.error('Verification error:', error);
    throw error;
  }
};

export const getCertificateDetails = async (tokenId) => {
  try {
    const { provider } = await connectWallet();
    const contract = getCertificateContract(provider);
    return await contract.getCertificate(tokenId);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    throw error;
  }
};

export const getTotalCertificates = async () => {
  try {
    const { provider } = await connectWallet();
    const contract = getCertificateContract(provider);
    return await contract.getTotalCertificates();
  } catch (error) {
    console.error('Error fetching total certificates:', error);
    throw error;
  }
};