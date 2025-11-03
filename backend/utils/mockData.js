/**
 * Mock data utility for development when blockchain is not available
 */

const generateMockCertificates = (count = 5) => {
  const certificates = [];
  
  for (let i = 1; i <= count; i++) {
    certificates.push({
      tokenId: i,
      studentName: `Student ${i}`,
      registerNumber: `REG${100000 + i}`,
      course: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering'][i % 3],
      degree: ['B.Tech', 'M.Tech', 'PhD'][i % 3],
      cgpa: (Math.random() * 3 + 7).toFixed(2),
      certificateType: ['Degree', 'Diploma', 'Certificate'][i % 3],
      issueDate: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      ipfsHash: `QmMock${i}${Math.random().toString(36).substring(2, 15)}`,
      department: ['Computer Science', 'Electrical', 'Mechanical'][i % 3],
      batch: `202${i % 3}`,
      yearOfPassing: 2020 + (i % 5),
      isRevoked: i % 7 === 0,
      status: i % 7 === 0 ? 'Revoked' : 'Active'
    });
  }
  
  return certificates;
};

const getMockCertificateById = (id) => {
  const certificates = generateMockCertificates(10);
  return certificates.find(cert => cert.tokenId === parseInt(id)) || null;
};

const getMockCertificateByRegisterNumber = (registerNumber) => {
  const certificates = generateMockCertificates(10);
  return certificates.find(cert => cert.registerNumber === registerNumber) || null;
};

const getMockCertificateByTransactionHash = (transactionHash) => {
  // In a real scenario, this would search by transaction hash
  // For mock data, we'll just return a random certificate
  const certificates = generateMockCertificates(10);
  return certificates[Math.floor(Math.random() * certificates.length)] || null;
};

module.exports = {
  generateMockCertificates,
  getMockCertificateById,
  getMockCertificateByRegisterNumber,
  getMockCertificateByTransactionHash
};