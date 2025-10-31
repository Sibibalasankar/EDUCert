const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Testing contract functions...");
  
  const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // ← NEW ADDRESS
  const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
  const contract = await CertificateNFT.attach(contractAddress);
  
  console.log("✅ Contract attached to:", contractAddress);
  
  // Test basic functions
  try {
    const total = await contract.getTotalCertificates();
    console.log("✅ getTotalCertificates():", total.toString());
  } catch (e) { console.log("❌ getTotalCertificates() failed:", e.message); }
  
  try {
    const cert = await contract.getCertificate(1);
    console.log("✅ getCertificate(1):", cert);
  } catch (e) { console.log("❌ getCertificate(1) failed:", e.message); }
  
  try {
    const name = await contract.name();
    console.log("✅ name():", name);
  } catch (e) { console.log("❌ name() failed:", e.message); }
}

main().catch(console.error);