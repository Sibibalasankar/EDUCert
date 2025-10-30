import React, { useState, useEffect } from 'react';

const CertificateForm = ({ onSubmit, students }) => {
  const [formData, setFormData] = useState({
    name: '',
    registerNumber: '',
    email: '',
    course: '',
    degree: '',
    cgpa: '',
    walletAddress: '',
    certificateType: 'Degree'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState([]);

  // Filter students based on register number input
  useEffect(() => {
    if (formData.registerNumber.length > 2) {
      const filtered = students.filter(student =>
        student.registerNumber.toLowerCase().includes(formData.registerNumber.toLowerCase()) ||
        student.name.toLowerCase().includes(formData.registerNumber.toLowerCase())
      );
      setFilteredStudents(filtered);
      setShowStudentDropdown(filtered.length > 0);
    } else {
      setFilteredStudents([]);
      setShowStudentDropdown(false);
    }
  }, [formData.registerNumber, students]);

  const handleStudentSelect = (student) => {
    setFormData({
      name: student.name,
      registerNumber: student.registerNumber,
      email: student.email,
      course: student.course,
      degree: student.degree,
      cgpa: student.cgpa,
      walletAddress: student.walletAddress,
      certificateType: 'Degree'
    });
    setShowStudentDropdown(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Mock API call for Phase 1
      setTimeout(() => {
        const mockCertificate = {
          tokenId: Math.floor(Math.random() * 1000) + 1,
          transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
          ipfsHash: 'Qm' + Math.random().toString(36).substr(2, 44),
          studentName: formData.name,
          registerNumber: formData.registerNumber
        };

        setResult({
          type: 'success',
          message: 'Certificate issued successfully! (Mock Data - Backend coming in Phase 2)',
          data: mockCertificate
        });
        
        setFormData({
          name: '',
          registerNumber: '',
          email: '',
          course: '',
          degree: '',
          cgpa: '',
          walletAddress: '',
          certificateType: 'Degree'
        });
        
        if (onSubmit) onSubmit(mockCertificate);
        setLoading(false);
      }, 2000);

    } catch (error) {
      setResult({
        type: 'error',
        message: 'Failed to issue certificate. Please try again.'
      });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Issue New Certificate</h2>
          <p className="text-blue-100 text-sm mt-1">
            Start typing register number to auto-fill student details
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Register Number with Auto-complete */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Register Number *
              </label>
              <input
                type="text"
                name="registerNumber"
                value={formData.registerNumber}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type to search students..."
              />
              
              {/* Student Dropdown */}
              {showStudentDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredStudents.map((student) => (
                    <button
                      key={student._id}
                      type="button"
                      onClick={() => handleStudentSelect(student)}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-600">
                        {student.registerNumber} • {student.course} • CGPA: {student.cgpa}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Will auto-fill from student record"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address *
              </label>
              <input
                type="text"
                name="walletAddress"
                value={formData.walletAddress}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0x..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course *
              </label>
              <input
                type="text"
                name="course"
                value={formData.course}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Degree *
              </label>
              <input
                type="text"
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CGPA/GPA *
              </label>
              <input
                type="text"
                name="cgpa"
                value={formData.cgpa}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificate Type *
              </label>
              <select
                name="certificateType"
                value={formData.certificateType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Degree">Degree Certificate</option>
                <option value="Provisional">Provisional Certificate</option>
                <option value="CourseCompletion">Course Completion</option>
                <option value="Diploma">Diploma</option>
                <option value="Transcript">Transcript</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Issuing Certificate...
                </div>
              ) : (
                'Issue Certificate'
              )}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className={`mt-6 p-4 rounded-md border ${
          result.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-start">
            <div className={`flex-shrink-0 w-5 h-5 mt-0.5 ${
              result.type === 'success' ? 'text-green-400' : 'text-red-400'
            }`}>
              {result.type === 'success' ? '✓' : '✗'}
            </div>
            <div className="ml-3">
              <p className="font-medium">{result.message}</p>
              {result.data && (
                <div className="mt-2 text-sm space-y-1">
                  <p><strong>Token ID:</strong> {result.data.tokenId}</p>
                  <p><strong>Transaction:</strong> {result.data.transactionHash}</p>
                  <p><strong>IPFS Hash:</strong> {result.data.ipfsHash}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateForm;