import React from 'react';

const StudentHeader = ({ studentInfo, account, approvedCount, mintedCount, onRefresh, onSync }) => {
  return (
    <div className="mb-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Manage your blockchain certificates
            </p>
            {studentInfo ? (
              <div className="mt-3 flex flex-wrap gap-4">
                <div className="text-sm">
                  <span className="text-gray-500">Name:</span>
                  <span className="ml-2 font-medium text-gray-900">{studentInfo.name}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Register No:</span>
                  <span className="ml-2 font-medium text-gray-900">{studentInfo.registerNumber}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Course:</span>
                  <span className="ml-2 font-medium text-gray-900">{studentInfo.course}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Certificates:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {approvedCount} ready to mint, {mintedCount} minted
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-yellow-600">
                ⚠️ No student record found for this wallet address ({account?.slice(0, 8)}...{account?.slice(-6)}).
                <br />
                Please make sure your wallet address is registered with your student account.
              </div>
            )}
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Connected: {account?.slice(0, 8)}...{account?.slice(-6)}</span>
            </div>
            <button
              onClick={onRefresh}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
            <button
              onClick={onSync}
              className="text-sm text-purple-600 hover:text-purple-800 flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync with Blockchain
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHeader;