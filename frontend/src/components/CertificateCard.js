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
    console.log('Verifying certificate:', certificate._id);
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Header with gradient and decorative elements */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-5 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-center mb-1">
            <svg className="w-6 h-6 text-yellow-300 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-yellow-300 text-xs font-semibold tracking-wider uppercase">Official Certificate</span>
          </div>
          <h3 className="text-white font-bold text-xl text-center tracking-wide">
            {certificate.certificateType} Certificate
          </h3>
        </div>
      </div>

      <div className="p-6">
        {/* Student Info with avatar placeholder */}
        <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm">
          <div className="flex items-center justify-center mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
              {(certificate.studentName || studentInfo?.name || 'S').charAt(0).toUpperCase()}
            </div>
          </div>
          <p className="font-bold text-gray-900 text-center text-lg">
            {certificate.studentName || studentInfo?.name}
          </p>
          <p className="text-sm text-gray-600 text-center mt-1 font-medium">
            {studentInfo?.registerNumber}
          </p>
        </div>

        {/* Certificate Details with enhanced styling */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="text-gray-600 font-medium flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Course
            </span>
            <span className="font-bold text-gray-900 text-right">
              {certificate.course
                || (studentInfo?.degree && studentInfo?.department
                  ? `${studentInfo.degree} - ${studentInfo.department}`
                  : studentInfo?.degree
                  || studentInfo?.department
                  || "Not specified"
                )
              }
            </span>

          </div>

          {/* <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="text-gray-600 font-medium flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              CGPA
            </span>
            <span className="font-bold text-gray-900 bg-green-100 px-3 py-1 rounded-lg">{certificate.cgpa || studentInfo?.cgpa}</span>
          </div> */}

          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="text-gray-600 font-medium flex items-center">
              <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Issued Date
            </span>
            <span className="font-semibold text-gray-900">{formatDate(certificate.mintedAt)}</span>
          </div>

          {/* Token ID */}
          {certificate.tokenId && (
            <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
              <span className="text-gray-600 font-medium flex items-center">
                <svg className="w-4 h-4 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Token ID
              </span>
              <span className="font-mono text-sm font-bold bg-white px-3 py-1 rounded-lg shadow-sm border border-amber-300 text-amber-900">
                #{certificate.tokenId}
              </span>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600 font-medium flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Status
            </span>
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${certificate.blockchainConfirmed
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
              : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white'
              }`}>
              {certificate.blockchainConfirmed ? '✅ CONFIRMED' : '⏳ PENDING'}
            </span>
          </div>

          {/* Transaction Hash */}
          {certificate.transactionHash && (
            <div className="flex justify-between items-center py-3 px-4 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-gray-600 font-medium flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Transaction
              </span>
              <button
                onClick={viewOnEtherscan}
                className="font-mono text-xs font-bold text-blue-700 hover:text-blue-900 underline bg-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all border border-blue-300"
                title="View on Etherscan"
              >
                {certificate.transactionHash.slice(0, 6)}...{certificate.transactionHash.slice(-4)}
              </button>
            </div>
          )}

          {/* Block Number */}
          {certificate.blockNumber && (
            <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="text-gray-600 font-medium flex items-center">
                <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Block Number
              </span>
              <span className="font-mono text-sm font-bold text-indigo-900 bg-indigo-100 px-3 py-1 rounded-lg">
                #{certificate.blockNumber}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons with enhanced styling */}
        <div className="space-y-3 mb-4">
          <button
            onClick={verifyCertificate}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-bold flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verify Certificate
          </button>

          {certificate.transactionHash && (
            <button
              onClick={viewOnEtherscan}
              className="w-full bg-gradient-to-r from-gray-700 to-gray-800 text-white py-3 px-4 rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all font-semibold flex items-center justify-center shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View on Etherscan
            </button>
          )}
        </div>

        {/* Blockchain Confirmation Badge */}
        {certificate.blockchainConfirmed && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-md">
            <div className="flex items-center justify-center text-green-800 font-bold">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">Verified on Blockchain</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateCard;