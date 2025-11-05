import React from 'react';

const CertificateCard = ({ certificate, studentInfo }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const viewOnEtherscan = () => {
    if (certificate.transactionHash) {
      window.open(`https://sepolia.etherscan.io/tx/${certificate.transactionHash}`, '_blank');
    }
  };

  const verifyCertificate = () => {
    // Implement certificate verification
    console.log('Verifying certificate:', certificate._id);
    // You can open a verification modal or redirect to verification page
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
        <h3 className="text-white font-bold text-lg text-center">
          {certificate.certificateType} Certificate
        </h3>
      </div>
      
      <div className="p-4">
        {/* Student Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="font-semibold text-gray-900 text-center">
            {certificate.studentName || studentInfo?.name}
          </p>
          <p className="text-sm text-gray-600 text-center mt-1">
            {studentInfo?.registerNumber}
          </p>
        </div>
        
        {/* Certificate Details */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600 font-medium">Course:</span>
            <span className="font-semibold text-gray-900">{certificate.course || studentInfo?.course}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600 font-medium">CGPA:</span>
            <span className="font-semibold text-gray-900">{certificate.cgpa || studentInfo?.cgpa}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600 font-medium">Issued Date:</span>
            <span className="font-medium text-gray-900">{formatDate(certificate.mintedAt)}</span>
          </div>
          
          {/* Token ID */}
          {certificate.tokenId && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Token ID:</span>
              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                {certificate.tokenId}
              </span>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600 font-medium">Status:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              certificate.blockchainConfirmed 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            }`}>
              {certificate.blockchainConfirmed ? '✅ BLOCKCHAIN CONFIRMED' : '⏳ MINTED'}
            </span>
          </div>
          
          {/* Transaction Hash */}
          {certificate.transactionHash && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Transaction:</span>
              <button 
                onClick={viewOnEtherscan}
                className="font-mono text-xs text-blue-600 hover:text-blue-800 underline bg-blue-50 px-2 py-1 rounded"
                title="View on Etherscan"
              >
                {certificate.transactionHash.slice(0, 6)}...{certificate.transactionHash.slice(-4)}
              </button>
            </div>
          )}
          
          {/* Block Number */}
          {certificate.blockNumber && (
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600 font-medium">Block Number:</span>
              <span className="font-mono text-sm font-semibold text-gray-900">
                #{certificate.blockNumber}
              </span>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <button 
            onClick={verifyCertificate}
            className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verify Certificate
          </button>
          
          {certificate.transactionHash && (
            <button 
              onClick={viewOnEtherscan}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View on Etherscan
            </button>
          )}
        </div>
        
        {/* Blockchain Confirmation Badge */}
        {certificate.blockchainConfirmed && (
          <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-center text-green-700 text-sm font-medium">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Verified on Blockchain
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateCard;