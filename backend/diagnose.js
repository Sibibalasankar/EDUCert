// diagnose.js
const { ethers } = require('ethers');

const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const CONTRACT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)", 
  "function owner() view returns (address)",
  "function getTotalCertificates() view returns (uint256)",
  "function getCertificate(uint256) view returns (tuple(string,string,string,string,string,string,uint256,string,string,string,uint256,bool))",
  "function certificateCounter() view returns (uint256)",
  "function tokenCounter() view returns (uint256)",
  "function totalSupply() view returns (uint256)"
];

async function diagnose() {
  console.log('🔍 Starting diagnosis...');
  
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  
  // Check contract existence
  const code = await provider.getCode(CONTRACT_ADDRESS);
  console.log('✅ Contract code length:', code.length);
  console.log('📝 Contract deployed:', code !== '0x');
  
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  
  try {
    // Test basic functions
    const name = await contract.name();
    const symbol = await contract.symbol();
    const owner = await contract.owner();
    
    console.log('✅ Basic functions work:');
    console.log('   Name:', name);
    console.log('   Symbol:', symbol);
    console.log('   Owner:', owner);
  } catch (e) {
    console.log('❌ Basic functions failed:', e.message);
  }
  
  // Try different ways to get certificate count
  console.log('\n🔢 Checking certificate counts...');
  
  const methods = ['getTotalCertificates', 'certificateCounter', 'tokenCounter', 'totalSupply'];
  
  for (const method of methods) {
    try {
      if (contract[method]) {
        const result = await contract[method]();
        console.log(`✅ ${method}(): ${result.toString()}`);
      }
    } catch (e) {
      console.log(`❌ ${method}(): ${e.message}`);
    }
  }
  
  // Try to find certificates from token ID 0 to 10
  console.log('\n🔍 Searching for certificates...');
  
  for (let i = 0; i <= 10; i++) {
    try {
      const cert = await contract.getCertificate(i);
      console.log(`✅ Certificate ${i} FOUND:`, {
        studentName: cert.studentName,
        registerNumber: cert.registerNumber,
        course: cert.course
      });
    } catch (e) {
      if (e.message.includes('revert') || e.message.includes('nonexistent token')) {
        console.log(`❌ Certificate ${i}: Not found`);
      } else {
        console.log(`❌ Certificate ${i}: ${e.message}`);
      }
    }
  }
  
  // Check events to see minting history
  console.log('\n📜 Checking minting events...');
  try {
    const filter = contract.filters.CertificateMinted();
    const events = await contract.queryFilter(filter, 0, 'latest');
    console.log(`✅ Found ${events.length} mint events`);
    
    events.forEach((event, index) => {
      console.log(`   Event ${index + 1}:`, {
        tokenId: event.args.tokenId.toString(),
        student: event.args.studentAddress,
        registerNumber: event.args.registerNumber
      });
    });
  } catch (e) {
    console.log('❌ Events check failed:', e.message);
  }
}

diagnose().catch(console.error);