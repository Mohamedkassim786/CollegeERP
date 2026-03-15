const { PASS_MARKS, GRADE_POINTS } = require('../utils/constants.js');

/**
 * calculation.service.js
 * Centralised business logic for marks, grades, GPA and CGPA.
 */

const calculateTheoryInternal = (internal100) => {
  // THEORY: internal is /100, convert to /40
  return Math.round((internal100 || 0) * 0.4);
};

const calculateLabInternal = (internal100) => {
  // markService already stores LAB internal as scaled if needed, 
  // but here we ensure consistency if it comes as raw 100
  return Math.round(internal100 || 0);
};

const calculateIntegratedInternal = (theory25, lab25) => {
  // Theory CIA (max 25) + Lab CIA (max 25) = Total 50
  return (theory25 || 0) + (lab25 || 0);
};

const checkPassFail = (internal, external, subjectType, regulation = '2021') => {
  // Note: 'external' here is the processed external mark (e.g. /60 for Theory, /40 for Lab, /50 for Integrated)
  
  if (subjectType === 'LAB') {
    const isExternalPass = external >= 16; // 40% of 40
    return { passed: isExternalPass, reason: isExternalPass ? '' : 'Failed External' };
  }
  
  if (subjectType === 'INTEGRATED') {
    const internalPass = internal >= 20;   // 40% of 50
    const theoryExtPass = external >= 21.25; // 35% of 25 Theory + 50% of 25 Lab = 8.75 + 12.5 = 21.25
    // Note: The specific breakdown is usually handled in the controller, but this is the aggregate
    const isPass = internalPass && theoryExtPass;
    return { passed: isPass, reason: isPass ? '' : 'Failed component criteria' };
  }
  
  // THEORY
  const isExternalPass = external >= 21; // 35% of 60
  return { passed: isExternalPass, reason: isExternalPass ? '' : 'Failed External' };
};

const getFixedGrade = (total, grades = []) => {
  // If grades array is provided (from DB), use it. Otherwise fallback to constants logic.
  if (grades && grades.length > 0) {
    const matched = grades.find(g => total >= g.minPercentage && total <= g.maxPercentage);
    return matched ? { grade: matched.grade, points: matched.gradePoint } : { grade: 'RA', points: 0 };
  }

  // Fallback to basic constants if no DB settings
  if (total >= 90) return { grade: 'O', points: 10 };
  if (total >= 80) return { grade: 'A+', points: 9 };
  if (total >= 70) return { grade: 'A', points: 8 };
  if (total >= 60) return { grade: 'B+', points: 7 };
  if (total >= 55) return { grade: 'B', points: 6 };
  if (total >= 50) return { grade: 'C', points: 5 };
  return { grade: 'RA', points: 0 };
};

const calculateGPA = (subjectsWithMarks, grades) => {
  let totalPoints = 0;
  let totalCredits = 0;
  let earnedCredits = 0;
  let semesterPass = true;

  subjectsWithMarks.forEach(m => {
    const credits = m.subject.credits || 0;
    if (!m.endSemMarks || m.endSemMarks.resultStatus !== 'PASS') {
      semesterPass = false;
      totalCredits += credits;
    } else {
      const gradeInfo = grades.find(g => g.grade === m.endSemMarks.grade);
      const gp = gradeInfo ? gradeInfo.gradePoint : (GRADE_POINTS[m.endSemMarks.grade] || 0);
      totalPoints += gp * credits;
      totalCredits += credits;
      earnedCredits += credits;
    }
  });

  const gpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
  return { gpa, totalCredits, earnedCredits, semesterPass };
};

const calculateCGPA = (allMarks, clearedArrears, grades) => {
  let cumulativePoints = 0;
  let cumulativeCredits = 0;

  // Regular passing marks
  allMarks.forEach(m => {
    const credits = m.subject.credits || 0;
    if (m.endSemMarks && m.endSemMarks.resultStatus === 'PASS') {
      const gradeInfo = grades.find(g => g.grade === m.endSemMarks.grade);
      const gp = gradeInfo ? gradeInfo.gradePoint : (GRADE_POINTS[m.endSemMarks.grade] || 0);
      cumulativePoints += gp * credits;
      cumulativeCredits += credits;
    }
  });

  // Add cleared arrears points
  clearedArrears.forEach(ar => {
    const credits = ar.subject.credits || 0;
    // Note: The caller provides the attempt result
    const gradeInfo = grades.find(g => g.grade === ar.passedGrade);
    const gp = gradeInfo ? gradeInfo.gradePoint : (GRADE_POINTS[ar.passedGrade] || 0);
    cumulativePoints += gp * credits;
    cumulativeCredits += credits;
  });

  return cumulativeCredits > 0 ? (cumulativePoints / cumulativeCredits) : 0;
};

const getDegreeClass = (cgpa, clearedFirstAttempt, hasAnySA, yearsToComplete) => {
  if (cgpa >= 8.5 && clearedFirstAttempt && !hasAnySA && yearsToComplete <= 4) {
    return 'First Class with Distinction';
  }
  if (cgpa >= 6.5) {
    return 'First Class';
  }
  return 'Second Class';
};

module.exports = {
  calculateTheoryInternal,
  calculateLabInternal,
  calculateIntegratedInternal,
  checkPassFail,
  getFixedGrade,
  calculateGPA,
  calculateCGPA,
  getDegreeClass
};
