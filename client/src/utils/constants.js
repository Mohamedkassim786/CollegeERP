/**
 * constants.js
 * Frontend mirror of backend constants.
 * Used throughout components and hooks — never hardcode these values.
 */

export const ROLES = {
    ADMIN: 'ADMIN',
    PRINCIPAL: 'PRINCIPAL',
    CHIEF_SECRETARY: 'CHIEF_SECRETARY',
    HOD: 'HOD',
    FACULTY: 'FACULTY',
    EXTERNAL: 'EXTERNAL',
    EXTERNAL_STAFF: 'EXTERNAL_STAFF',
    STUDENT: 'STUDENT',
    FIRST_YEAR_COORDINATOR: 'FIRST_YEAR_COORDINATOR',
};

export const SUBJECT_TYPES = {
    THEORY: 'THEORY',
    LAB: 'LAB',
    INTEGRATED: 'INTEGRATED',
};

/** Grade points per letter grade (Anna University R2021) */
export const GRADE_POINTS = {
    O: 10,
    'A+': 9,
    A: 8,
    'B+': 7,
    B: 6,
    C: 5,
    RA: 0,
    U: 0,
    SA: 0,
};

/** Fixed grade colours for badge display */
export const GRADE_COLORS = {
    O: 'bg-emerald-100 text-emerald-700',
    'A+': 'bg-green-100 text-green-700',
    A: 'bg-blue-100 text-blue-700',
    'B+': 'bg-cyan-100 text-cyan-700',
    B: 'bg-yellow-100 text-yellow-700',
    C: 'bg-orange-100 text-orange-700',
    U: 'bg-red-100 text-red-700',
    RA: 'bg-red-100 text-red-700',
    SA: 'bg-gray-100 text-gray-600',
};

/** Anna University attendance thresholds */
export const ATTENDANCE_THRESHOLDS = {
    ELIGIBLE: 75,
    CONDONATION_MIN: 65,
    CONDONATION_MAX: 74,
};

/** Eligibility status for colour coding */
export const ELIGIBILITY_STATUS = {
    ELIGIBLE: 'ELIGIBLE',
    CONDONATION: 'CONDONATION',
    DETAINED: 'DETAINED',
};

/** Route paths — centralised to avoid typos in navigation */
export const ROUTES = {
    LOGIN: '/',
    ADMIN: {
        ROOT: '/admin',
        STUDENTS: '/admin/students',
        PROMOTE: '/admin/students/promote',
        DEPARTMENTS: '/admin/departments',
        SUBJECTS: '/admin/subjects',
        FACULTY: '/admin/faculty',
        TIMETABLE: '/admin/timetable',
        ATTENDANCE: '/admin/attendance',
        MARKS_APPROVAL: '/admin/marks-approval',
        RESULTS_CONSOLIDATION: '/admin/results-consolidation',
        ATTENDANCE_ELIGIBILITY: '/admin/attendance-eligibility',
        DUMMY_MAPPING: '/admin/dummy-mapping',
        EXTERNAL: '/admin/external',
        HALL_ALLOCATION: '/admin/hall-allocation',
        HALL_TICKET: '/admin/hall-ticket',
        EXAM_ATTENDANCE_SHEET: '/admin/exam-attendance-sheet',
        DISPATCH: '/admin/dispatch',
        PROVISIONAL_RESULTS: '/admin/provisional-results',
        ARREAR_MANAGEMENT: '/admin/arrears',
        SETTINGS: '/admin/settings',
    },
    FACULTY: {
        ROOT: '/faculty',
        TIMETABLE: '/faculty/timetable',
        ATTENDANCE: '/faculty/attendance',
        MARKS: '/faculty/marks',
        RESULTS: '/faculty/results',
        CLASSES: '/faculty/classes',
        MATERIALS: '/faculty/materials',
        ANNOUNCEMENTS: '/faculty/announcements',
        SETTINGS: '/faculty/settings',
    },
    STUDENT: {
        ROOT: '/student',
        ATTENDANCE: '/student/attendance',
        MARKS: '/student/marks',
        RESULTS: '/student/results',
        MATERIALS: '/student/materials',
        ANNOUNCEMENTS: '/student/announcements',
    },
    HOD: {
        ROOT: '/hod',
        STUDENTS: '/hod/students',
        FACULTY: '/hod/faculty',
        TIMETABLE: '/hod/timetable',
        ATTENDANCE: '/hod/attendance',
        MARKS: '/hod/marks',
        NOTIFICATIONS: '/hod/notifications',
        ANNOUNCEMENTS: '/hod/announcements',
        SETTINGS: '/hod/settings',
        DEPT_ATTENDANCE: '/hod/dept-attendance',
        ATTENDANCE_ELIGIBILITY: '/hod/attendance-eligibility',
    },
};

/** Designation options for faculty form dropdowns */
export const DESIGNATIONS = [
    'Professor',
    'Associate Professor',
    'Assistant Professor',
    'Lecturer',
    'HOD',
];

/** Exam session options */
export const EXAM_SESSIONS = [
    { value: 'FN', label: 'Forenoon (FN)' },
    { value: 'AN', label: 'Afternoon (AN)' },
];

/** Regulation years */
export const REGULATIONS = ['2021', '2017', '2013'];
export const REGULATION_OPTIONS = REGULATIONS;

export const SEMESTER_OPTIONS = {
    'B.E.': [1, 2, 3, 4, 5, 6, 7, 8],
    'B.Tech': [1, 2, 3, 4, 5, 6, 7, 8],
    'M.E.': [1, 2, 3, 4],
    'M.Tech': [1, 2, 3, 4],
    'MBA': [1, 2, 3, 4],
    'MCA': [1, 2, 3, 4, 5, 6],
}

export const ALLOWED_DEGREES = ['B.E.', 'B.Tech', 'M.E.', 'M.Tech', 'MBA', 'MCA']
