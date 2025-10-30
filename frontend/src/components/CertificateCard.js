import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import QRCodeGenerator from './QRCodeGenerator';

const CertificateCard = ({ certificate, viewMode = 'grid' }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getCertificateColor = (type) => {
    const colors = {
      Degree: 'bg-blue-100 text-blue-800',
      Provisional: 'bg-yellow-100 text-yellow-800',
      CourseCompletion: 'bg-green-100 text-green-800',
      Diploma: 'bg-purple-100 text-purple-800',
      Transcript: 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Grid View - Minimal
  if (viewMode === 'grid') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {certificate.studentName}
              </h3>
              <p className="text-sm text-gray-600">{certificate.registerNumber}</p>
            </div>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCertificateColor(certificate.certificateType)}`}>
              {certificate.certificateType}
            </span>
          </div>

          {/* Quick Info */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Course:</span>
              <span className="text-gray-900 font-medium truncate ml-2 max-w-[120px]">
                {certificate.course}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">CGPA:</span>
              <span className="text-gray-900 font-medium">{certificate.cgpa}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Issued:</span>
              <span className="text-gray-900">{formatDate(certificate.issueDate)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-between items-center">
            <span className="text-xs text-gray-500 font-mono">
              Token #{certificate.tokenId}
            </span>
            <div className="flex space-x-2">
              <Link
                to={`/verify/${certificate.tokenId}`}
                target="_blank"
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Verify
              </Link>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-gray-600 hover:text-gray-800 font-medium"
              >
                {showDetails ? 'Less' : 'More'}
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Details */}
        {showDetails && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Transaction:</span>
                <span className="text-gray-900 font-mono text-xs truncate max-w-[140px]">
                  {certificate.transactionHash}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">QR Code:</span>
                <QRCodeGenerator
                  data={`${window.location.origin}/verify/${certificate.tokenId}`}
                  size={60}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List View - Even more minimal
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        {/* Left Section - Basic Info */}
        <div className="flex items-center space-x-4 flex-1">
          <div className="flex-shrink-0">
            <QRCodeGenerator
              data={`${window.location.origin}/verify/${certificate.tokenId}`}
              size={50}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {certificate.studentName}
              </h3>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCertificateColor(certificate.certificateType)}`}>
                {certificate.certificateType}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{certificate.registerNumber}</span>
              <span>•</span>
              <span className="truncate flex-1">{certificate.course}</span>
              <span>•</span>
              <span>CGPA: {certificate.cgpa}</span>
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-3 ml-4">
          <span className="text-xs text-gray-500 font-mono">
            #{certificate.tokenId}
          </span>
          <Link
            to={`/certificate/${certificate.tokenId}`}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CertificateCard;