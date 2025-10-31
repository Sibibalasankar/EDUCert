// scripts/deploy-persistent.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// File to store deployment info
const DEPLOYMENT_FILE = path.join(__dirname, "../deployment-info.json");

async function main() {
  console.log("🚀 Starting persistent deployment...");
  
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log("👤 Deployer address:", deployer.address);
  
  // FIXED: Use ethers.utils.formatEther for v5
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", ethers.utils.formatEther(balance), "ETH");

  // Check if we already have a deployment
  if (fs.existsSync(DEPLOYMENT_FILE)) {
    const existingDeployment = JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, "utf8"));
    
    // Verify the contract still exists at that address
    const code = await ethers.provider.getCode(existingDeployment.contractAddress);
    
    if (code !== '0x') {
      console.log("✅ Contract already deployed at:", existingDeployment.contractAddress);
      console.log("📝 Using existing deployment...");
      return existingDeployment.contractAddress;
    } else {
      console.log("⚠️ Previous deployment not found, deploying new contract...");
    }
  }

  // Deploy new contract
  console.log("📦 Deploying new CertificateNFT contract...");

  const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
  const certificateNFT = await CertificateNFT.deploy();
  
  console.log("⏳ Waiting for deployment transaction...");
  await certificateNFT.deployed(); // Wait for deployment to complete
  
  const contractAddress = certificateNFT.address;
  
  console.log("✅ CertificateNFT deployed to:", contractAddress);

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployer: deployer.address,
    network: {
      chainId: network.chainId,
      name: network.name
    },
    timestamp: new Date().toISOString(),
    transactionHash: certificateNFT.deployTransaction.hash
  };

  fs.writeFileSync(DEPLOYMENT_FILE, JSON.stringify(deploymentInfo, null, 2));
  
  // Also update backend and frontend configs
  updateConfigFiles(deploymentInfo);
  
  console.log("📝 Deployment info saved to:");
  console.log("   -", DEPLOYMENT_FILE);
  
  return contractAddress;
}

function updateConfigFiles(deploymentInfo) {
  const backendConfig = path.join(__dirname, "../backend/contract-address.json");
  const frontendConfig = path.join(__dirname, "../frontend/src/contracts/contract-address.json");
  
  // Create directories if they don't exist
  const backendDir = path.dirname(backendConfig);
  const frontendDir = path.dirname(frontendConfig);
  
  if (!fs.existsSync(backendDir)) {
    fs.mkdirSync(backendDir, { recursive: true });
  }
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }
  
  fs.writeFileSync(backendConfig, JSON.stringify(deploymentInfo, null, 2));
  fs.writeFileSync(frontendConfig, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("   -", backendConfig);
  console.log("   -", frontendConfig);
}

main()
  .then(() => {
    console.log("🎉 Deployment process completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });