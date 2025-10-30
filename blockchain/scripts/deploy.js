// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying EDUCertNFT contract...");

  const EDUCertNFT = await ethers.getContractFactory("EDUCertNFT");
  const educert = await EDUCertNFT.deploy();

  await educert.waitForDeployment();

  const address = await educert.getAddress();
  console.log("EDUCertNFT deployed to:", address);

  // Save contract address to frontend
  const fs = require('fs');
  const contractAddress = {
    address: address
  };
  
  fs.writeFileSync(
    '../frontend/src/contracts/contract-address.json',
    JSON.stringify(contractAddress, null, 2)
  );

  // Copy ABI to frontend
  const contractArtifact = artifacts.readArtifactSync("EDUCertNFT");
  
  fs.writeFileSync(
    '../frontend/src/contracts/EDUCertNFT.json',
    JSON.stringify(contractArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });