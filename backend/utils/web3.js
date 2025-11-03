import { ethers } from 'ethers';
import { contractConfig } from '../config/contractConfig.js';
import dotenv from 'dotenv';

dotenv.config();

// Check if private key exists
if (!process.env.ADMIN_PRIVATE_KEY) {
  throw new Error('ADMIN_PRIVATE_KEY is missing from .env file');
}

const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, wallet);

export const getContract = () => contract;
export const getProvider = () => provider;
export const getWallet = () => wallet;