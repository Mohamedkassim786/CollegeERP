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
  return Math.round(internal100 || 0);
};

const calculateIntegratedInternal = (theory25, lab25) => {
  return (theory25 || 0) + (lab25 || 0);
};

const checkPassFail = (internal, external, subjectType, regulation = '2021') => {
  const total = (internal || 0) + (external || 0);

  if (subjectType === 'LAB') {
    const isExternalPass = external >= 16;   // 40% of 40
    const isTotalPass = total >= 50;
    if (!isExternalPass) return { passed: false, reason: 'Failed External (below 40% of 40)' };
    if (!isTotalPass) return { passed: false, reason: 'Failed Aggregate (below 50)' };
    return { passed: true, reason: '' };
  }

  if (subjectType === 'INTEGRATED') {
    const internalPass = internal >= 20;     // 40% of 50
    const externalPass = external >= 20;     // 40% of 50
    const isTotalPass = total >= 50;
    if (!internalPass) return { passed: false, reason: 'Failed Internal (below 40% of 50)' };
    if (!externalPass) return { passed: false, reason: 'Failed External (below 40% of 50)' };
    if (!isTotalPass) return { passed: false, reason: 'Failed Aggregate (below 50)' };
    return { passed: true, reason: '' };
  }

  // THEORY (default)
  const isExternalPass = external >= 21;     // 35% of 60
  const isTotalPass = total >= 50;
  if (!isExternalPass) return { passed: false, reason: 'Failed External (below 35% of 60)' };
  if (!isTotalPass) return { passed: false, reason: 'Failed Aggregate (below 50)' };
  return { passed: true, reason: '' };
};

const getFixedGrade = (total, grades = []) => {
  if (grades && grades.length > 0) {
    const matched = grades.find(g => total >= g.minPercentage && total <= g.maxPercentage);
    return matched ? { grade: matched.grade, points: matched.gradePoint } : { grade: 'RA', points: 0 };
  }

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

  allMarks.forEach(m => {
    const credits = m.subject.credits || 0;
    cumulativeCredits += credits; // Track ALL attempted credits for CGPA
    if (m.endSemMarks && m.endSemMarks.resultStatus === 'PASS') {
      const gradeInfo = grades.find(g => g.grade === m.endSemMarks.grade);
      const gp = gradeInfo ? gradeInfo.gradePoint : (GRADE_POINTS[m.endSemMarks.grade] || 0);
      cumulativePoints += gp * credits;
    }
  });

  clearedArrears.forEach(ar => {
    const credits = ar.subject.credits || 0;
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
