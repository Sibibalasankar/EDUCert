const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deployer address:", deployer.address);
  
  const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
  const certificateNFT = await CertificateNFT.attach("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 ");

  console.log("Minting sample certificates...");

  try {
    // Mint sample certificate 1
    const tx1 = await certificateNFT.mintCertificate(
      deployer.address,
      "Sibi B S",
      "21AI001",
      "B.TECH - ARTIFICIAL INTELLIGENCE AND DATA SCIENCE",
      "B.Tech",
      "8.9",
      "Degree",
      "QmRjD1234567890K7xF",
      "AI & DS",
      "2021-2025",
      2025
    );
    await tx1.wait();
    console.log("✅ Certificate 1 minted for Sibi B S");

    // Mint sample certificate 2
    const tx2 = await certificateNFT.mintCertificate(
      deployer.address,
      "John Doe",
      "21CS002",
      "B.E - COMPUTER SCIENCE AND ENGINEERING",
      "B.E",
      "9.2",
      "Transcript",
      "QmRjD1234567890K8yG",
      "CSE",
      "2021-2025",
      2025
    );
    await tx2.wait();
    console.log("✅ Certificate 2 minted for John Doe");

    // Mint sample certificate 3
    const tx3 = await certificateNFT.mintCertificate(
      deployer.address,
      "Alice Johnson",
      "23EC001",
      "B.E - ELECTRONICS & COMMUNICATION ENGINEERING",
      "B.E",
      "8.5",
      "Degree",
      "QmRjD1234567890L9zH",
      "ECE",
      "2023-2027",
      2027
    );
    await tx3.wait();
    console.log("✅ Certificate 3 minted for Alice Johnson");

    // Check total certificates
    const total = await certificateNFT.getTotalCertificates();
    console.log("📊 Total certificates on blockchain:", total.toString());

    // Verify each certificate
    for (let i = 1; i <= total; i++) {
      const cert = await certificateNFT.getCertificate(i);
      console.log(`📄 Certificate ${i}:`, cert.studentName, "-", cert.registerNumber);
    }

  } catch (error) {
    console.error("❌ Error minting certificates:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script error:", error);
    process.exit(1);
  });