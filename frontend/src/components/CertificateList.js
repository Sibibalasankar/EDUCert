import React, { useState, useEffect } from 'react';
import CertificateCard from './CertificateCard';
import LoadingSpinner from './LoadingSpinner';
import { getAllPrograms, generateBatchYears } from '../utils/programData';

const CertificateList = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  
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

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        // Mock data for Phase 1 with enhanced information
        setTimeout(() => {
          const mockCertificates = [
            {
              _id: '1',
              tokenId: 1,
              studentName: 'Sibi B S',
              registerNumber: '21AI001',
              email: 'sibi@college.edu',
              course: 'B.TECH - ARTIFICIAL INTELLIGENCE AND DATA SCIENCE',
              degree: 'B.Tech',
              cgpa: '8.9',
              certificateType: 'Degree',
              issueDate: new Date().toISOString(),
              transactionHash: '0x4af1234567890abcdef1234567890abcdef1234567890abcdef1234567891d3',
              ipfsHash: 'QmRjD1234567890K7xF',
              status: 'Active',
              department: 'AI & DS',
              batch: '2021-2025',
              yearOfPassing: 2025
            },
            {
              _id: '2',
              tokenId: 2,
              studentName: 'John Doe',
              registerNumber: '21CS002',
              email: 'john@college.edu',
              course: 'B.E - COMPUTER SCIENCE AND ENGINEERING',
              degree: 'B.E',
              cgpa: '9.2',
              certificateType: 'Transcript',
              issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              transactionHash: '0x4af1234567890abcdef1234567890abcdef1234567890abcdef1234567892e4',
              ipfsHash: 'QmRjD1234567890K8yG',
              status: 'Active',
              department: 'CSE',
              batch: '2021-2025',
              yearOfPassing: 2025
            },
            // ... other certificate objects
          ];
          
          setCertificates(mockCertificates);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching certificates:', error);
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
      cert.email.toLowerCase().includes(searchTerm.toLowerCase());
    
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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Digital Certificates
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Browse and manage all issued digital certificates
        </p>
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
          Showing {filteredCertificates.length} of {certificates.length} certificates
          {searchTerm && ` for "${searchTerm}"`}
        </p>
      </div>

      {/* Certificates Grid/List */}
      {filteredCertificates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="max-w-md mx-auto">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No certificates found</h3>
            <p className="text-gray-600">Try adjusting your search or filters to find what you're looking for.</p>
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