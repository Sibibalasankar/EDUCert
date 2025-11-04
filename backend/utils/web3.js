import { ethers } from 'ethers';
import { contractConfig } from '../config/contractConfig.js';
import dotenv from 'dotenv';

dotenv.config();

// Check if private key exists
if (!process.env.ADMIN_PRIVATE_KEY) {
  throw new Error('ADMIN_PRIVATE_KEY is missing from .env file');
}

// Using ethers v5.8.0 syntax
const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/");
const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, wallet);

export const getContract = () => contract;
export const getProvider = () => provider;
export const getWallet = () => wallet;