export const academicPrograms = {
  ug: {
    title: "UG Programmes",
    programs: [
      {
        id: "cse",
        name: "B.E - COMPUTER SCIENCE AND ENGINEERING",
        duration: "4 Years",
        intake: 120,
        semesters: 8,
        degree: "B.E",
        department: "CSE",
        category: "Engineering"
      },
      {
        id: "ece",
        name: "B.E - ELECTRONICS & COMMUNICATION ENGINEERING",
        duration: "4 Years",
        intake: 120,
        semesters: 8,
        degree: "B.E",
        department: "ECE",
        category: "Engineering"
      },
      {
        id: "mech",
        name: "B.E - MECHANICAL ENGINEERING",
        duration: "4 Years",
        intake: 60,
        semesters: 8,
        degree: "B.E",
        department: "MECH",
        category: "Engineering"
      },
      {
        id: "ai_ds",
        name: "B.TECH - ARTIFICIAL INTELLIGENCE AND DATA SCIENCE",
        duration: "4 Years",
        intake: 120,
        semesters: 8,
        degree: "B.Tech",
        department: "AI & DS",
        category: "Engineering"
      },
      {
        id: "csbs",
        name: "B.TECH - COMPUTER SCIENCE AND BUSINESS SYSTEMS",
        duration: "4 Years",
        intake: 60,
        semesters: 8,
        degree: "B.Tech",
        department: "CSBS",
        category: "Engineering"
      },
      {
        id: "it",
        name: "B.TECH - INFORMATION TECHNOLOGY",
        duration: "4 Years",
        intake: 120,
        semesters: 8,
        degree: "B.Tech",
        department: "IT",
        category: "Engineering"
      },
      {
        id: "cse_cyber",
        name: "B.E CSE (Cyber Security)",
        duration: "4 Years",
        intake: 60,
        semesters: 8,
        degree: "B.E",
        department: "CSE Cyber",
        category: "Engineering"
      },
      {
        id: "cse_ai_ml",
        name: "B.E CSE (AI & ML)",
        duration: "4 Years",
        intake: 120,
        semesters: 8,
        degree: "B.E",
        department: "CSE AI&ML",
        category: "Engineering"
      },
      {
        id: "robotics",
        name: "B.E - Robotics and Automation",
        duration: "4 Years",
        intake: 60,
        semesters: 8,
        degree: "B.E",
        department: "Robotics",
        category: "Engineering"
      }
    ]
  },
  pg: {
    title: "PG Programmes",
    programs: [
      {
        id: "applied_electronics",
        name: "M.E - APPLIED ELECTRONICS",
        duration: "2 Years",
        intake: 9,
        semesters: 4,
        degree: "M.E",
        department: "ECE",
        category: "Engineering"
      },
      {
        id: "mtech_cse",
        name: "M.E - COMPUTER SCIENCE AND ENGINEERING",
        duration: "2 Years",
        intake: 9,
        semesters: 4,
        degree: "M.E",
        department: "CSE",
        category: "Engineering"
      },
      {
        id: "mba",
        name: "MASTER OF BUSINESS ADMINISTRATION",
        duration: "2 Years",
        intake: 60,
        semesters: 4,
        degree: "MBA",
        department: "Management",
        category: "Management"
      }
    ]
  },
  phd: {
    title: "Ph.D Programmes",
    programs: [
      {
        id: "phd_cse",
        name: "Ph.D - Computer Science and Engineering",
        duration: "Variable",
        intake: null,
        semesters: null,
        degree: "Ph.D",
        department: "CSE",
        category: "Research"
      },
      {
        id: "phd_ece",
        name: "Ph.D - Electronics and Communication Engineering",
        duration: "Variable",
        intake: null,
        semesters: null,
        degree: "Ph.D",
        department: "ECE",
        category: "Research"
      }
    ]
  }
};

// Helper functions
export const getAllPrograms = () => {
  return [
    ...academicPrograms.ug.programs,
    ...academicPrograms.pg.programs,
    ...academicPrograms.phd.programs
  ];
};

export const getProgramsByDegree = (degree) => {
  return getAllPrograms().filter(program => program.degree === degree);
};

export const getProgramsByDepartment = (department) => {
  return getAllPrograms().filter(program => program.department === department);
};

export const getProgramsByCategory = (category) => {
  return getAllPrograms().filter(program => program.category === category);
};

export const generateBatchYears = () => {
  const currentYear = new Date().getFullYear();
  const batches = [];
  for (let year = 2018; year <= currentYear; year++) {
    batches.push({
      label: `${year}-${year + 4}`,
      startYear: year,
      endYear: year + 4
    });
  }
  return batches.reverse();
};