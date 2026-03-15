/**
 * Seating Service - Specialized logic for hall allocation algorithms
 */

const calculateSeatingCIA = (students, halls) => {
    // 1. Group students by subject
    const subjectPools = {};
    students.forEach(s => {
        if (!subjectPools[s.currentSubjectId]) subjectPools[s.currentSubjectId] = [];
        subjectPools[s.currentSubjectId].push(s);
    });

    const pools = Object.values(subjectPools).sort((a, b) => b.length - a.length);

    // 2. Interleave subjects to ensure diversity
    const interleaved = [];
    let total = students.length;
    while (interleaved.length < total) {
        for (let i = 0; i < pools.length; i++) {
            if (pools[i].length > 0) {
                interleaved.push(pools[i].shift());
            }
        }
    }

    const allocations = [];
    let studentIdx = 0;

    for (const hall of halls) {
        for (const col of hall.columns) {
            const benchCount = col.benches || 0;
            const benchData = col.benchData || [];

            if (benchData.length === 0 && benchCount > 0) {
                // Fallback for old halls: assumes all benches are 2-person
                for (let b = 1; b <= benchCount; b++) {
                    for (let pos = 1; pos <= 2; pos++) {
                        if (studentIdx >= interleaved.length) break;
                        let student = interleaved[studentIdx];
                        if (pos === 2 && allocations.length > 0) {
                            const prev = allocations[allocations.length - 1];
                            if (prev.benchIndex === b && prev.columnLabel === col.label && prev.hallId === hall.id) {
                                if (prev.subjectId === student.currentSubjectId) {
                                    let swapIdx = studentIdx + 1;
                                    while (swapIdx < interleaved.length && interleaved[swapIdx].currentSubjectId === student.currentSubjectId) swapIdx++;
                                    if (swapIdx < interleaved.length) [interleaved[studentIdx], interleaved[swapIdx]] = [interleaved[swapIdx], interleaved[studentIdx]];
                                }
                            }
                        }
                        const currentStudent = interleaved[studentIdx];
                        allocations.push({
                            hallId: hall.id, studentId: currentStudent.id, subjectId: currentStudent.currentSubjectId,
                            department: currentStudent.department, year: currentStudent.year,
                            seatNumber: `${col.label}${b}${pos === 1 ? 'A' : 'B'}`,
                            benchIndex: b, columnLabel: col.label
                        });
                        studentIdx++;
                    }
                    if (studentIdx >= interleaved.length) break;
                }
            } else {
                const sortedBenches = [...benchData].sort((a, b) => a.benchNumber - b.benchNumber);
                for (const bench of sortedBenches) {
                    const b = bench.benchNumber;
                    const capacity = bench.capacity;
                    for (let pos = 1; pos <= capacity; pos++) {
                        if (studentIdx >= interleaved.length) break;
                        let student = interleaved[studentIdx];
                        if (pos === 2 && allocations.length > 0) {
                            const prev = allocations[allocations.length - 1];
                            if (prev.benchIndex === b && prev.columnLabel === col.label && prev.hallId === hall.id) {
                                if (prev.subjectId === student.currentSubjectId) {
                                    let swapIdx = studentIdx + 1;
                                    while (swapIdx < interleaved.length && interleaved[swapIdx].currentSubjectId === student.currentSubjectId) swapIdx++;
                                    if (swapIdx < interleaved.length) [interleaved[studentIdx], interleaved[swapIdx]] = [interleaved[swapIdx], interleaved[studentIdx]];
                                }
                            }
                        }
                        const currentStudent = interleaved[studentIdx];
                        allocations.push({
                            hallId: hall.id, studentId: currentStudent.id, subjectId: currentStudent.currentSubjectId,
                            department: currentStudent.department, year: currentStudent.year,
                            seatNumber: `${col.label}${b}${capacity === 1 ? '' : (pos === 1 ? 'A' : 'B')}`,
                            benchIndex: b, columnLabel: col.label
                        });
                        studentIdx++;
                    }
                    if (studentIdx >= interleaved.length) break;
                }
            }
            if (studentIdx >= interleaved.length) break;
        }
        if (studentIdx >= interleaved.length) break;
    }

    return { allocations, remaining: interleaved.slice(studentIdx) };
};

const calculateSeatingENDSEM = (students, halls) => {
    const subjectPools = {};
    students.forEach(s => {
        if (!subjectPools[s.currentSubjectId]) subjectPools[s.currentSubjectId] = [];
        subjectPools[s.currentSubjectId].push(s);
    });

    const pools = Object.values(subjectPools).sort((a, b) => b.length - a.length);

    const interleaved = [];
    let total = students.length;
    while (interleaved.length < total) {
        for (let i = 0; i < pools.length; i++) {
            if (pools[i].length > 0) {
                interleaved.push(pools[i].shift());
            }
        }
    }

    const allocations = [];
    let studentIdx = 0;

    for (const hall of halls) {
        for (const col of hall.columns) {
            let lastSubjectId = null;
            const benchCount = col.benches || 0;
            const benchData = col.benchData || [];

            if (benchData.length === 0 && benchCount > 0) {
                for (let b = 1; b <= benchCount; b++) {
                    if (studentIdx >= interleaved.length) break;
                    let student = interleaved[studentIdx];
                    if (student.currentSubjectId === lastSubjectId) {
                        let swapIdx = studentIdx + 1;
                        while (swapIdx < interleaved.length && interleaved[swapIdx].currentSubjectId === lastSubjectId) swapIdx++;
                        if (swapIdx < interleaved.length) {
                            [interleaved[studentIdx], interleaved[swapIdx]] = [interleaved[swapIdx], interleaved[studentIdx]];
                            student = interleaved[studentIdx];
                        }
                    }
                    allocations.push({
                        hallId: hall.id, studentId: student.id, subjectId: student.currentSubjectId,
                        department: student.department, year: student.year,
                        seatNumber: `${col.label}${b}`, benchIndex: b, columnLabel: col.label
                    });
                    lastSubjectId = student.currentSubjectId;
                    studentIdx++;
                }
            } else {
                const sortedBenches = [...benchData].sort((a, b) => a.benchNumber - b.benchNumber);
                for (const bench of sortedBenches) {
                    if (studentIdx >= interleaved.length) break;
                    const b = bench.benchNumber;
                    let student = interleaved[studentIdx];
                    if (student.currentSubjectId === lastSubjectId) {
                        let swapIdx = studentIdx + 1;
                        while (swapIdx < interleaved.length && interleaved[swapIdx].currentSubjectId === lastSubjectId) swapIdx++;
                        if (swapIdx < interleaved.length) {
                            [interleaved[studentIdx], interleaved[swapIdx]] = [interleaved[swapIdx], interleaved[studentIdx]];
                            student = interleaved[studentIdx];
                        }
                    }
                    allocations.push({
                        hallId: hall.id, studentId: student.id, subjectId: student.currentSubjectId,
                        department: student.department, year: student.year,
                        seatNumber: `${col.label}${b}`, benchIndex: b, columnLabel: col.label
                    });
                    lastSubjectId = student.currentSubjectId;
                    studentIdx++;
                }
            }
            if (studentIdx >= interleaved.length) break;
        }
        if (studentIdx >= interleaved.length) break;
    }

    return { allocations, remaining: interleaved.slice(studentIdx) };
};

module.exports = {
    calculateSeatingCIA,
    calculateSeatingENDSEM
};
