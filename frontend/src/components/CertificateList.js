import React, { useState, useEffect } from 'react';
import CertificateCard from './CertificateCard';
import LoadingSpinner from './LoadingSpinner';
import { getAllPrograms, generateBatchYears } from '../utils/programData';

const CertificateList = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [error, setError] = useState(null);
  
  // Enhanced filter states
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedDegree, setSelectedDegree] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Get unique values for filters
  const departments = [...new Set(getAllPrograms().map(p => p.department))];
  const degrees = [...new Set(getAllPrograms().map(p => p.degree))];
  
  // Fixed batch generation - ensure we get proper string values
  const batches = generateBatchYears().map(batch => 
    typeof batch === 'object' ? batch.label : String(batch)
  );

  // Function to fetch certificates from backend
  const fetchCertificatesFromBackend = async () => {
    try {
      console.log('🔗 Fetching certificates from blockchain...');
      const response = await fetch('http://localhost:5000/api/certificates');
      
      if (!response.ok) {
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Received ${data.length} certificates from blockchain`);
      return data;
    } catch (error) {
      console.error('❌ Error fetching from backend:', error);
      throw error;
    }
  };

  // Transform backend data to frontend format
  const transformCertificateData = (backendCertificates) => {
    return backendCertificates.map(cert => ({
      _id: cert.tokenId.toString(),
      tokenId: cert.tokenId,
      studentName: cert.studentName,
      registerNumber: cert.registerNumber,
      email: `${cert.registerNumber.toLowerCase()}@college.edu`,
      course: cert.course,
      degree: cert.degree,
      cgpa: cert.cgpa,
      certificateType: cert.certificateType,
      issueDate: cert.issueDate,
      transactionHash: `0x${Math.random().toString(16).substr(2, 40)}...`, // Placeholder
      ipfsHash: cert.ipfsHash,
      status: cert.isRevoked ? 'Revoked' : 'Active',
      department: cert.department,
      batch: cert.batch,
      yearOfPassing: cert.yearOfPassing
    }));
  };

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const backendCertificates = await fetchCertificatesFromBackend();
        
        if (backendCertificates && backendCertificates.length > 0) {
          const transformedCertificates = transformCertificateData(backendCertificates);
          setCertificates(transformedCertificates);
        } else {
          // No certificates on blockchain yet
          setCertificates([]);
          setError('No certificates found on blockchain. Please mint some certificates first.');
        }
      } catch (error) {
        console.error('Error fetching certificates:', error);
        setError(`Failed to connect to blockchain: ${error.message}. Make sure the backend server is running on port 5000.`);
        setCertificates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  // Enhanced filtering
  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = 
      cert.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.registerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cert.email && cert.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filter === 'all' || cert.certificateType === filter;
    const matchesDepartment = selectedDepartment === 'all' || cert.department === selectedDepartment;
    const matchesDegree = selectedDegree === 'all' || cert.degree === selectedDegree;
    const matchesBatch = selectedBatch === 'all' || cert.batch === selectedBatch;

    return matchesSearch && matchesType && matchesDepartment && matchesDegree && matchesBatch;
  });

  const clearFilters = () => {
    setFilter('all');
    setSelectedDepartment('all');
    setSelectedDegree('all');
    setSelectedBatch('all');
    setSearchTerm('');
  };

  // Refresh certificates from blockchain
  const refreshCertificates = async () => {
    setLoading(true);
    setError(null);
    try {
      const backendCertificates = await fetchCertificatesFromBackend();
      if (backendCertificates && backendCertificates.length > 0) {
        const transformedCertificates = transformCertificateData(backendCertificates);
        setCertificates(transformedCertificates);
      } else {
        setCertificates([]);
        setError('No certificates found on blockchain.');
      }
    } catch (error) {
      console.error('Error refreshing certificates:', error);
      setError(`Failed to refresh: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSpinner />
        <p className="text-center text-gray-600 mt-4">Loading certificates from blockchain...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-2xl mx-auto">
            <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-red-800 mb-2">Connection Error</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-y-3">
              <p className="text-sm text-red-500">Please ensure:</p>
              <ul className="text-sm text-red-500 text-left max-w-md mx-auto">
                <li>• Backend server is running on port 5000</li>
                <li>• Hardhat node is running on port 8545</li>
                <li>• Certificates have been minted on the blockchain</li>
              </ul>
              <button
                onClick={refreshCertificates}
                className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Digital Certificates
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Real certificates stored on blockchain
        </p>
        
        {/* Refresh Button and Stats */}
        <div className="mt-4 flex justify-center items-center space-x-4">
          <button
            onClick={refreshCertificates}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition duration-200 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh from Blockchain</span>
          </button>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {certificates.length} certificates on chain
          </span>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="space-y-6 mb-8">
        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by name, register number, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
          />
        </div>

        {/* Filter Controls */}
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Certificate Type Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Certificate Type
              </label>
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              >
                <option value="all">All Types</option>
                <option value="Degree">Degree</option>
                <option value="Transcript">Transcript</option>
                <option value="Provisional">Provisional</option>
                <option value="CourseCompletion">Course Completion</option>
              </select>
            </div>

            {/* Department Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <select 
                value={selectedDepartment} 
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Degree Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Degree
              </label>
              <select 
                value={selectedDegree} 
                onChange={(e) => setSelectedDegree(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              >
                <option value="all">All Degrees</option>
                {degrees.map(degree => (
                  <option key={degree} value={degree}>{degree}</option>
                ))}
              </select>
            </div>

            {/* Batch Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Batch
              </label>
              <select 
                value={selectedBatch} 
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              >
                <option value="all">All Batches</option>
                {batches.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button 
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center space-x-4">
          <button 
            onClick={() => setViewMode('grid')} 
            className={`px-6 py-2 rounded-lg font-medium transition duration-200 ${
              viewMode === 'grid' 
                ? 'bg-blue-500 text-white shadow-lg transform -translate-y-0.5' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Grid View</span>
            </div>
          </button>
          <button 
            onClick={() => setViewMode('list')} 
            className={`px-6 py-2 rounded-lg font-medium transition duration-200 ${
              viewMode === 'list' 
                ? 'bg-blue-500 text-white shadow-lg transform -translate-y-0.5' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>List View</span>
            </div>
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <p className="text-blue-800 font-medium">
          Showing {filteredCertificates.length} of {certificates.length} certificates from blockchain
          {searchTerm && ` for "${searchTerm}"`}
        </p>
      </div>

      {/* Certificates Grid/List */}
      {filteredCertificates.length === 0 && certificates.length > 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="max-w-md mx-auto">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No certificates match your filters</h3>
            <p className="text-gray-600">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        </div>
      ) : filteredCertificates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="max-w-md mx-auto">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No certificates on blockchain yet</h3>
            <p className="text-gray-600">Mint some certificates to see them here.</p>
          </div>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
        }>
          {filteredCertificates.map(certificate => (
            <CertificateCard 
              key={certificate._id}
              certificate={certificate}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificateList;