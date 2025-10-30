import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { academicPrograms, getAllPrograms, generateBatchYears } from '../utils/programData';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedDegree, setSelectedDegree] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    registerNumber: '',
    email: '',
    course: '',
    degree: '',
    cgpa: '',
    walletAddress: '',
    phone: '',
    department: '',
    program: '',
    yearOfAdmission: new Date().getFullYear(),
    yearOfPassing: new Date().getFullYear() + 4,
    currentSemester: 1
  });

  // Get unique values for filters
  const departments = [...new Set(getAllPrograms().map(p => p.department))];
  const degrees = [...new Set(getAllPrograms().map(p => p.degree))];
  const batches = generateBatchYears();
  const programs = getAllPrograms();


  // Fetch students from backend
  const fetchStudents = async () => {
    try {
      setLoading(true);
      console.log('📡 Fetching students from backend...');
      
      // For now, we'll use mock data but structure it for future backend integration
      // In Phase 3, we'll replace this with actual API calls
      setTimeout(() => {
        const mockStudents = [
          {
            _id: '1',
            name: 'Sibi B S',
            registerNumber: '21AI001',
            email: 'sibi@college.edu',
            course: 'B.TECH - ARTIFICIAL INTELLIGENCE AND DATA SCIENCE',
            degree: 'B.Tech',
            cgpa: '8.9',
            walletAddress: '0x742d35Cc6634C0532925a3b8D',
            phone: '+91 9876543210',
            department: 'AI & DS',
            program: 'ai_ds',
            yearOfAdmission: 2021,
            yearOfPassing: 2025,
            currentSemester: 7,
            batch: '2021-2025',
            createdAt: new Date().toISOString()
          },
          {
            _id: '2',
            name: 'John Doe',
            registerNumber: '21CS002',
            email: 'john@college.edu',
            course: 'B.E - COMPUTER SCIENCE AND ENGINEERING',
            degree: 'B.E',
            cgpa: '9.2',
            walletAddress: '0x892d35Cc6634C0532925a3b8E',
            phone: '+91 9876543211',
            department: 'CSE',
            program: 'cse',
            yearOfAdmission: 2021,
            yearOfPassing: 2025,
            currentSemester: 7,
            batch: '2021-2025',
            createdAt: new Date().toISOString()
          },
          {
            _id: '3',
            name: 'Alice Johnson',
            registerNumber: '23EC001',
            email: 'alice@college.edu',
            course: 'B.E - ELECTRONICS & COMMUNICATION ENGINEERING',
            degree: 'B.E',
            cgpa: '8.5',
            walletAddress: '0x992d35Cc6634C0532925a3b8F',
            phone: '+91 9876543212',
            department: 'ECE',
            program: 'ece',
            yearOfAdmission: 2023,
            yearOfPassing: 2027,
            currentSemester: 3,
            batch: '2023-2027',
            createdAt: new Date().toISOString()
          },
          {
            _id: '4',
            name: 'Bob Smith',
            registerNumber: '22ME001',
            email: 'bob@college.edu',
            course: 'B.E - MECHANICAL ENGINEERING',
            degree: 'B.E',
            cgpa: '8.1',
            walletAddress: '0x662d35Cc6634C0532925a3b8G',
            phone: '+91 9876543213',
            department: 'MECH',
            program: 'mech',
            yearOfAdmission: 2022,
            yearOfPassing: 2026,
            currentSemester: 5,
            batch: '2022-2026',
            createdAt: new Date().toISOString()
          },
          {
            _id: '5',
            name: 'Emma Wilson',
            registerNumber: '21IT001',
            email: 'emma@college.edu',
            course: 'B.TECH - INFORMATION TECHNOLOGY',
            degree: 'B.Tech',
            cgpa: '9.0',
            walletAddress: '0x772d35Cc6634C0532925a3b8H',
            phone: '+91 9876543214',
            department: 'IT',
            program: 'it',
            yearOfAdmission: 2021,
            yearOfPassing: 2025,
            currentSemester: 7,
            batch: '2021-2025',
            createdAt: new Date().toISOString()
          },
          {
            _id: '6',
            name: 'Michael Brown',
            registerNumber: '23CSBS001',
            email: 'michael@college.edu',
            course: 'B.TECH - COMPUTER SCIENCE AND BUSINESS SYSTEMS',
            degree: 'B.Tech',
            cgpa: '8.7',
            walletAddress: '0x882d35Cc6634C0532925a3b8I',
            phone: '+91 9876543215',
            department: 'CSBS',
            program: 'csbs',
            yearOfAdmission: 2023,
            yearOfPassing: 2027,
            currentSemester: 3,
            batch: '2023-2027',
            createdAt: new Date().toISOString()
          }
        ];
        setStudents(mockStudents);
        setLoading(false);
        console.log(`✅ Loaded ${mockStudents.length} students`);
      }, 1000);

    } catch (error) {
      console.error('❌ Error fetching students:', error);
      setLoading(false);
    }
  };

  // Save student to backend
  const saveStudentToBackend = async (studentData) => {
    try {
      // For Phase 2, we'll simulate backend save
      // In Phase 3, we'll implement actual API calls
      console.log('💾 Saving student to backend:', studentData);
      
      // Simulate API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            data: {
              ...studentData,
              _id: studentData._id || Date.now().toString(),
              createdAt: new Date().toISOString()
            }
          });
        }, 500);
      });
    } catch (error) {
      console.error('Error saving student:', error);
      throw error;
    }
  };

  // Delete student from backend
  const deleteStudentFromBackend = async (studentId) => {
    try {
      console.log('🗑️ Deleting student from backend:', studentId);
      
      // Simulate API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 300);
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter students based on all criteria
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.registerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || student.department === selectedDepartment;
    const matchesDegree = selectedDegree === 'all' || student.degree === selectedDegree;
    const matchesBatch = selectedBatch === 'all' || student.batch === selectedBatch;
    const matchesProgram = selectedProgram === 'all' || student.program === selectedProgram;

    return matchesSearch && matchesDepartment && matchesDegree && matchesBatch && matchesProgram;
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProgramChange = (programId) => {
    if (programId && programId !== 'all') {
      const program = programs.find(p => p.id === programId);
      if (program) {
        setFormData(prev => ({
          ...prev,
          program: program.id,
          course: program.name,
          degree: program.degree,
          department: program.department,
          yearOfPassing: prev.yearOfAdmission + (program.duration.includes('4') ? 4 : 2)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        program: '',
        course: '',
        degree: '',
        department: ''
      }));
    }
  };

  const handleYearChange = (year) => {
    const yearNum = parseInt(year);
    setFormData(prev => ({
      ...prev,
      yearOfAdmission: yearNum,
      yearOfPassing: yearNum + (prev.course.includes('4') ? 4 : 2),
      batch: `${yearNum}-${yearNum + 4}`
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const studentData = {
      ...formData,
      batch: `${formData.yearOfAdmission}-${formData.yearOfPassing}`
    };

    try {
      // Save to backend
      const result = await saveStudentToBackend(studentData);
      
      if (result.success) {
        if (editingStudent) {
          // Update existing student
          setStudents(prev => prev.map(student => 
            student._id === editingStudent._id 
              ? { ...student, ...result.data }
              : student
          ));
        } else {
          // Add new student
          setStudents(prev => [...prev, result.data]);
        }

        resetForm();
        setShowForm(false);
        
        console.log('✅ Student saved successfully');
      }
    } catch (error) {
      console.error('❌ Error saving student:', error);
      alert('Failed to save student. Please try again.');
    }
  };

  const handleEdit = (student) => {
    setFormData(student);
    setEditingStudent(student);
    setShowForm(true);
  };

  const handleDelete = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        // Delete from backend
        const result = await deleteStudentFromBackend(studentId);
        
        if (result.success) {
          setStudents(prev => prev.filter(student => student._id !== studentId));
          console.log('✅ Student deleted successfully');
        }
      } catch (error) {
        console.error('❌ Error deleting student:', error);
        alert('Failed to delete student. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      registerNumber: '',
      email: '',
      course: '',
      degree: '',
      cgpa: '',
      walletAddress: '',
      phone: '',
      department: '',
      program: '',
      yearOfAdmission: new Date().getFullYear(),
      yearOfPassing: new Date().getFullYear() + 4,
      currentSemester: 1
    });
    setEditingStudent(null);
  };

  // Refresh students from backend
  const refreshStudents = () => {
    fetchStudents();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="large" text="Loading students..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
            <p className="text-gray-600 mt-1">Manage student records and academic details</p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <button
              onClick={refreshStudents}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
            >
              Add New Student
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Students
            </label>
            <input
              type="text"
              placeholder="Search by name, register number, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Degree Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Degree
            </label>
            <select
              value={selectedDegree}
              onChange={(e) => setSelectedDegree(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Degrees</option>
              {degrees.map(degree => (
                <option key={degree} value={degree}>{degree}</option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Batches</option>
              {batches.map(batch => (
                <option key={batch.label} value={batch.label}>{batch.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Program Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Program
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Programs</option>
              <optgroup label="UG Programmes">
                {academicPrograms.ug.programs.map(program => (
                  <option key={program.id} value={program.id}>{program.name}</option>
                ))}
              </optgroup>
              <optgroup label="PG Programmes">
                {academicPrograms.pg.programs.map(program => (
                  <option key={program.id} value={program.id}>{program.name}</option>
                ))}
              </optgroup>
              <optgroup label="Ph.D Programmes">
                {academicPrograms.phd.programs.map(program => (
                  <option key={program.id} value={program.id}>{program.name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Showing {filteredStudents.length} of {students.length} students
            </div>
            {(selectedDepartment !== 'all' || selectedDegree !== 'all' || selectedBatch !== 'all' || selectedProgram !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedDepartment('all');
                  setSelectedDegree('all');
                  setSelectedBatch('all');
                  setSelectedProgram('all');
                  setSearchTerm('');
                }}
                className="ml-4 text-sm text-blue-600 hover:text-blue-800"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Student Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 px-6 py-4 rounded-t-lg">
              <h3 className="text-xl font-semibold text-white">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Program Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Program *
                  </label>
                  <select
                    value={formData.program}
                    onChange={(e) => handleProgramChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Program</option>
                    <optgroup label="UG Programmes">
                      {academicPrograms.ug.programs.map(program => (
                        <option key={program.id} value={program.id}>{program.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="PG Programmes">
                      {academicPrograms.pg.programs.map(program => (
                        <option key={program.id} value={program.id}>{program.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Ph.D Programmes">
                      {academicPrograms.phd.programs.map(program => (
                        <option key={program.id} value={program.id}>{program.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Auto-filled fields based on program selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course
                  </label>
                  <input
                    type="text"
                    value={formData.course}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Degree
                  </label>
                  <input
                    type="text"
                    value={formData.degree}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Semester
                  </label>
                  <select
                    name="currentSemester"
                    value={formData.currentSemester}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Register Number *
                  </label>
                  <input
                    type="text"
                    name="registerNumber"
                    value={formData.registerNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CGPA
                  </label>
                  <input
                    type="text"
                    name="cgpa"
                    value={formData.cgpa}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year of Admission
                  </label>
                  <select
                    name="yearOfAdmission"
                    value={formData.yearOfAdmission}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {batches.map(batch => (
                      <option key={batch.startYear} value={batch.startYear}>
                        {batch.startYear}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year of Passing
                  </label>
                  <input
                    type="text"
                    value={formData.yearOfPassing}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wallet Address
                  </label>
                  <input
                    type="text"
                    name="walletAddress"
                    value={formData.walletAddress}
                    onChange={handleInputChange}
                    placeholder="0x..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This address will receive the NFT certificate when minted
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingStudent ? 'Update Student' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Academic Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch & Semester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-500">{student.registerNumber}</div>
                      <div className="text-sm text-gray-500">{student.email}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {student.walletAddress ? 
                          `Wallet: ${student.walletAddress.slice(0, 8)}...${student.walletAddress.slice(-6)}` : 
                          'Wallet not set'
                        }
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{student.course}</div>
                    <div className="text-sm text-gray-500">{student.degree} • {student.department}</div>
                    <div className="text-sm text-gray-500">CGPA: {student.cgpa}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{student.batch}</div>
                    <div className="text-sm text-gray-500">Semester: {student.currentSemester}</div>
                    <div className="text-xs text-gray-400">
                      {student.yearOfAdmission} - {student.yearOfPassing}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(student)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(student._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedDepartment !== 'all' || selectedDegree !== 'all' || selectedBatch !== 'all' || selectedProgram !== 'all' 
                ? 'No students match your current filters.' 
                : 'Get started by adding your first student.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentManagement;