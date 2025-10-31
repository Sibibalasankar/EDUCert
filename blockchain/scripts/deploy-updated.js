const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying UPDATED CertificateNFT contract...");
  
  // Get the contract factory
  const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
  
  // Deploy the contract
  console.log("📦 Deploying...");
  const certificateNFT = await CertificateNFT.deploy();
  
  // Wait for deployment to complete - ethers v6 syntax
  await certificateNFT.deployed();
  
  // Get the contract address
  const address = certificateNFT.address;
  
  console.log("✅ UPDATED CertificateNFT deployed to:", address);
  console.log("📝 Update your backend with this new address!");
  
  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });