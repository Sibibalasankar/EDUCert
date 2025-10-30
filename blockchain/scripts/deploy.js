const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying CertificateNFT contract...");

  const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
  const certificateNFT = await CertificateNFT.deploy();

  await certificateNFT.deployed();

  console.log("CertificateNFT deployed to:", certificateNFT.address);
  
  // Save deployment info to a file
  const fs = require("fs");
  const deploymentInfo = {
    contractAddress: certificateNFT.address,
    deployer: await ethers.provider.getSigner().getAddress(),
    network: await ethers.provider.getNetwork(),
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });