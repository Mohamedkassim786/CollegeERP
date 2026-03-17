const express = require('express');
const multer = require('multer');
const {
    getTimetable, saveTimetable,
    getAbsences, markFacultyAbsent, removeFacultyAbsence,
    getSubstitutions, assignSubstitute, deleteSubstitution, getFacultyAvailability,
    getSystemUsers, createSystemUser, resetSystemUserPassword, toggleUserStatus, deleteUser,
    getAcademicYears, createAcademicYear, toggleAcademicYearStatus
} = require('../controllers/adminController');
const {
    getFaculties, createFaculty, deleteFaculty, updateFaculty, bulkUploadFaculty, getFacultyProfile
} = require('../controllers/facultyController');
const {
    createStudent, updateStudent, getStudents, deleteStudent, promoteStudents, bulkUploadStudents, batchAssignRegisterNumbers, passStudentsOut, getStudentProfile
} = require('../controllers/studentController');
const { promoteAll, promotePreview } = require('../controllers/promoteController');
const {
    createSubject, getSubjects, deleteSubject, assignFaculty, removeFacultyAssignment
} = require('../controllers/subjectController');
const {
    getSessions, createSession, deleteSession, updateSessionSubjects,
    toggleSessionLock, getSessionAllocations, getHalls, addHall, deleteHall,
    generateAllocations, exportConsolidatedPlan, exportSeatingGrid
} = require('../controllers/hallAllocationController');
const {
    getSubjectMarksForAdmin, updateMarksForAdmin, getPendingMarks, getMarksForApproval,
    approveMarks, approveAllMarks, unapproveMarks, unlockMarks, getAllSubjectMarksStatus
} = require('../controllers/markEntryController');
const {
    getDashboardStats, exportAttendanceExcel
} = require('../controllers/reportController');
const {
    getSettings, updateSetting
} = require('../controllers/settingsController');
const {
    getDepartments, getSections, createSection, deleteSection, createDepartment, updateDepartment, deleteDepartment
} = require('../controllers/departmentController');
const { getAttendanceReport, getDepartmentAttendanceReport } = require('../controllers/attendanceController');
const { verifyToken, isAdmin, isHod, isCOE, isChiefSecretary, isPrincipal } = require('../middleware/authMiddleware');
const { validateStudent, validateFaculty, validateSubject, validateMarks } = require('../middleware/validation');
const { uploadArrears, getArrears, deleteArrear, autoGenerateArrears, bulkUploadPassedOutArrears } = require('../controllers/arrearController');

const { getSubjectsForDispatch, getStudentsForDispatch, exportDispatchPDF } = require('../controllers/dispatchController');

const router = express.Router();
const uploadMemory = multer({ storage: multer.memoryStorage() });

router.use(verifyToken);
// Base access: Principal, COE, HOD, and Admin can access standard reports/stats
router.get('/stats', isPrincipal, getDashboardStats);

router.get('/timetable', isHod, getTimetable);
router.post('/timetable', isHod, saveTimetable);

// Faculty routes moved to section below

// System User Management
router.get('/users', isAdmin, getSystemUsers);
router.post('/users', isAdmin, createSystemUser);
router.patch('/users/:id/reset-password', isAdmin, resetSystemUserPassword);
router.patch('/users/:id/status', isAdmin, toggleUserStatus);
router.delete('/users/:id', isAdmin, deleteUser);

// Academic Year & System Settings
router.get('/academic-years', isAdmin, getAcademicYears);
router.post('/academic-years', isAdmin, createAcademicYear);
router.patch('/academic-years/:id/activate', isAdmin, toggleAcademicYearStatus);

router.get('/settings', isAdmin, getSettings);
router.post('/settings/update', isAdmin, updateSetting);

router.get('/departments', isHod, getDepartments);
router.get('/sections', isHod, getSections);
router.post('/sections', isCOE, createSection);
router.delete('/sections/:id', isHod, deleteSection);
router.post('/departments', isAdmin, createDepartment);
router.put('/departments/:id', isAdmin, updateDepartment);
router.delete('/departments/:id', isAdmin, deleteDepartment);

const { upload } = require('../utils/uploadConfig');

router.get('/students', isHod, getStudents);
router.get('/students/:id', isHod, getStudentProfile);
router.post('/students', isHod, upload.single('photo'), validateStudent, createStudent);
router.put('/students/:id', isHod, upload.single('photo'), validateStudent, updateStudent);
router.delete('/students/:id', isAdmin, deleteStudent); // Student deletion is SuperAdmin only

router.get('/subjects', isHod, getSubjects);
router.post('/subjects', isHod, validateSubject, createSubject);
router.delete('/subjects/:id', isAdmin, deleteSubject); // Subject deletion is SuperAdmin only

router.post('/assign-faculty', assignFaculty);
router.delete('/assign-faculty/:id', removeFacultyAssignment);

// Faculty Absence & Substitution Routes
router.get('/faculty-absences', getAbsences);
router.post('/faculty-absences', markFacultyAbsent);
router.options('/faculty-absences', (req, res) => res.sendStatus(200)); // Explicit OPTIONS handling
router.delete('/faculty-absences', removeFacultyAbsence); // Support query-based & cleanup deletion
router.delete('/faculty-absences/:id', removeFacultyAbsence);

router.get('/faculty/availability', getFacultyAvailability);
router.get('/substitutions', getSubstitutions);
router.post('/substitutions', assignSubstitute);
router.delete('/substitutions/:id', deleteSubstitution);

// Admin Faculty Management
router.get('/faculty', isHod, getFaculties);
router.post('/faculty/bulk-upload', isAdmin, upload.single('file'), bulkUploadFaculty);
router.get('/faculty/:id', isHod, getFacultyProfile);
router.post('/faculty', isAdmin, upload.single('photo'), createFaculty);
router.patch('/faculty/:id', isAdmin, upload.single('photo'), updateFaculty);
router.delete('/faculty/:id', isAdmin, deleteFaculty);

// Admin Marks Management
router.get('/marks/:subjectId', getSubjectMarksForAdmin);
router.post('/marks', validateMarks, updateMarksForAdmin);

// Marks Approval System
router.get('/marks-approval/pending', getPendingMarks);
router.get('/marks-approval/status', getAllSubjectMarksStatus);
router.get('/marks-approval/:subjectId', getMarksForApproval);
router.post('/marks-approval/approve', approveMarks);
router.post('/marks-approval/approve-all', approveAllMarks);
router.post('/marks-approval/unlock', unlockMarks);
router.post('/marks-approval/unapprove', unapproveMarks);

// Attendance Reports
router.get('/attendance/report', getAttendanceReport);
router.get('/attendance-report', isHod, getDepartmentAttendanceReport);
router.get('/attendance/export-excel', exportAttendanceExcel);

router.post('/students/promote', promoteStudents);
router.get('/promote-preview', promotePreview);
router.post('/promote-all', isAdmin, promoteAll);
router.post('/students/bulk', uploadMemory.fields([
    { name: 'file', maxCount: 1 },         // The Excel file (keeping original key for backwards compatibility if needed, or mapping)
    { name: 'photosZip', maxCount: 1 }     // The ZIP file
]), bulkUploadStudents);
router.post('/students/batch-assign-register', batchAssignRegisterNumbers);
router.post('/students/pass-out', isHod, passStudentsOut);

// Arrears
router.get('/arrears', getArrears);
router.post('/arrears/upload', uploadMemory.single('file'), uploadArrears);
router.post('/arrears/auto-generate', isAdmin, autoGenerateArrears);
router.post('/arrears/bulk-passedout', bulkUploadPassedOutArrears);
router.delete('/arrears/:id', deleteArrear);

// Hall Allocation Routes
router.get('/hall-allocation/sessions', isChiefSecretary, getSessions);
router.post('/hall-allocation/sessions', isCOE, createSession);
router.delete('/hall-allocation/sessions/:id', isCOE, deleteSession);
router.put('/hall-allocation/sessions/:id/subjects', isCOE, updateSessionSubjects);
router.patch('/hall-allocation/sessions/:id/lock', isCOE, toggleSessionLock);
router.get('/hall-allocation/sessions/:id/allocations', isChiefSecretary, getSessionAllocations);
router.get('/hall-allocation/halls', isChiefSecretary, getHalls);
router.post('/hall-allocation/halls', isCOE, addHall);
router.delete('/hall-allocation/halls/:id', isCOE, deleteHall);
router.post('/hall-allocation/generate', isCOE, generateAllocations);
router.get('/hall-allocation/sessions/:id/export', isChiefSecretary, exportConsolidatedPlan);
router.get('/hall-allocation/sessions/:id/export-grid', isChiefSecretary, exportSeatingGrid);

// Dispatch Routes
router.get('/dispatch/subjects', isChiefSecretary, getSubjectsForDispatch);
router.get('/dispatch/students', isChiefSecretary, getStudentsForDispatch);
router.post('/dispatch/export-pdf', isChiefSecretary, exportDispatchPDF);

module.exports = router;
