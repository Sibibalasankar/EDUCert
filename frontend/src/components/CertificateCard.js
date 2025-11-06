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

  const getCertificateColor = (type) => {
    const colors = {
      graduation: 'from-purple-600 to-indigo-700',
      course: 'from-green-600 to-teal-700',
      achievement: 'from-orange-500 to-red-600',
      degree: 'from-blue-600 to-cyan-600',
      diploma: 'from-pink-600 to-rose-600',
      default: 'from-blue-600 to-blue-700'
    };
    return colors[type?.toLowerCase()] || colors.default;
  };

  // Safe data extraction with fallbacks
  const getCourseInfo = () => {
    const course = certificate.course || studentInfo?.course;
    if (!course || course.trim() === '') {
      return {
        display: 'Not Specified',
        isEmpty: true
      };
    }
    return {
      display: course,
      isEmpty: false
    };
  };

  const getCGPAInfo = () => {
    const cgpa = certificate.cgpa || studentInfo?.cgpa;
    if (!cgpa || cgpa.toString().trim() === '') {
      return {
        display: 'N/A',
        isEmpty: true
      };
    }
    return {
      display: cgpa,
      isEmpty: false
    };
  };

  const getStudentName = () => {
    const name = certificate.studentName || studentInfo?.name;
    return name || 'Student Name Not Available';
  };

  const getRegisterNumber = () => {
    return studentInfo?.registerNumber || 'N/A';
  };

  const courseInfo = getCourseInfo();
  const cgpaInfo = getCGPAInfo();

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Enhanced Header with Gradient */}
      <div className={`bg-gradient-to-r ${getCertificateColor(certificate.certificateType)} px-6 py-4 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">
                  {certificate.certificateType || 'Academic'} Certificate
                </h3>
                <p className="text-blue-100 text-sm">Digital Credential</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white/20 px-3 py-1 rounded-full">
                <span className="text-white text-sm font-semibold">
                  {certificate.tokenId ? `#${certificate.tokenId}` : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Student Info Section */}
        <div className="text-center mb-6">
          <div className="mb-4">
            <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {getStudentName()}
            </h2>
            <p className="text-gray-600 mt-1">{getRegisterNumber()}</p>
          </div>
        </div>

        {/* Certificate Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Course Information */}
          <div className={`p-4 rounded-xl border ${
            courseInfo.isEmpty 
              ? 'bg-amber-50 border-amber-200' 
              : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                courseInfo.isEmpty ? 'bg-amber-100' : 'bg-blue-100'
              }`}>
                <svg className={`w-4 h-4 ${
                  courseInfo.isEmpty ? 'text-amber-600' : 'text-blue-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-gray-700 font-semibold">Course</span>
            </div>
            <div className="flex items-center justify-between">
              <p className={`text-lg font-bold ${
                courseInfo.isEmpty ? 'text-amber-700' : 'text-gray-900'
              }`}>
                {courseInfo.display}
              </p>
              {courseInfo.isEmpty && (
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
            </div>
            {courseInfo.isEmpty && (
              <p className="text-amber-600 text-xs mt-1">Course information not available</p>
            )}
          </div>

          {/* CGPA Information */}
          <div className={`p-4 rounded-xl border ${
            cgpaInfo.isEmpty 
              ? 'bg-amber-50 border-amber-200' 
              : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                cgpaInfo.isEmpty ? 'bg-amber-100' : 'bg-green-100'
              }`}>
                <svg className={`w-4 h-4 ${
                  cgpaInfo.isEmpty ? 'text-amber-600' : 'text-green-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-gray-700 font-semibold">CGPA</span>
            </div>
            <div className="flex items-center justify-between">
              <p className={`text-lg font-bold ${
                cgpaInfo.isEmpty ? 'text-amber-700' : 'text-gray-900'
              }`}>
                {cgpaInfo.display}
              </p>
              {cgpaInfo.isEmpty && (
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
            </div>
            {cgpaInfo.isEmpty && (
              <p className="text-amber-600 text-xs mt-1">CGPA not available</p>
            )}
          </div>

          {/* Issued Date */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-gray-700 font-semibold">Issued Date</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{formatDate(certificate.mintedAt)}</p>
          </div>

          {/* Status */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-gray-700 font-semibold">Status</span>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
              certificate.blockchainConfirmed 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            }`}>
              {certificate.blockchainConfirmed ? (
                <>
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  BLOCKCHAIN CONFIRMED
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  MINTING IN PROGRESS
                </>
              )}
            </span>
          </div>
        </div>

        {/* Blockchain Information */}
        {(certificate.transactionHash || certificate.blockNumber) && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Blockchain Information
            </h4>
            
            <div className="space-y-3">
              {certificate.transactionHash && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Transaction:</span>
                  <button 
                    onClick={viewOnEtherscan}
                    className="font-mono text-sm text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center"
                    title="View on Etherscan"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {certificate.transactionHash.slice(0, 8)}...{certificate.transactionHash.slice(-6)}
                  </button>
                </div>
              )}
              
              {certificate.blockNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Block Number:</span>
                  <span className="font-mono text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg">
                    #{certificate.blockNumber}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button 
            onClick={verifyCertificate}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verify Certificate Authenticity
          </button>
          
          {certificate.transactionHash && (
            <button 
              onClick={viewOnEtherscan}
              className="w-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 py-2.5 px-4 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-300 font-medium flex items-center justify-center border border-gray-300"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Blockchain Transaction
            </button>
          )}
        </div>

        {/* Enhanced Blockchain Confirmation Badge */}
        {certificate.blockchainConfirmed && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
            <div className="flex items-center justify-center space-x-2 text-green-800 font-semibold">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Certificate permanently verified and stored on Ethereum Blockchain</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateCard;