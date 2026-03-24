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
    createStudent, updateStudent, getStudents, deleteStudent, bulkUploadStudents,
    batchAssignRegisterNumbers, passStudentsOut, getStudentProfile, resetStudentPasswordToDOB,
    getGradeSheet, getIDCard
} = require('../controllers/studentController');
const { executeGlobalPromotion, promoteFirstYears, promotePreview } = require('../controllers/promoteController');
const {
    createSubject, getSubjects, deleteSubject, assignFaculty, removeFacultyAssignment
} = require('../controllers/subjectController');
const {
    getSessions, createSession, deleteSession, updateSessionSubjects,
    toggleSessionLock, getSessionAllocations, getHalls, addHall, updateHall, deleteHall,
    generateAllocations, deleteAllocationByDate, exportConsolidatedPlan, exportSeatingGrid
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
const { verifyToken, isAdmin, isHod, isPrincipal, canReadAdminData, isExamAdmin } = require('../middleware/authMiddleware');
const { validateStudent, validateFaculty, validateSubject, validateMarks } = require('../middleware/validation');
const { validateZod, studentSchema, markEntrySchema } = require('../middleware/zodValidation');
const { uploadArrears, getArrears, deleteArrear, autoGenerateArrears, bulkUploadPassedOutArrears } = require('../controllers/arrearController');
const { getSubjectsForDispatch, getStudentsForDispatch, exportDispatchPDF, exportAbsenteesPDF, saveDispatchAbsentees, getAllocationDates, getSubjectsByAllocation } = require('../controllers/dispatchController');

const router = express.Router();
const uploadMemory = multer({ storage: multer.memoryStorage() });
const { upload } = require('../utils/uploadConfig');

router.use(verifyToken);

// Base access: Principal, Admin, HOD
router.get('/stats', isPrincipal, getDashboardStats);

// Timetable
router.get('/timetable', isHod, getTimetable);
router.post('/timetable', isHod, saveTimetable);

// System User Management
router.get('/users', isAdmin, getSystemUsers);
router.post('/users', isAdmin, createSystemUser);
router.patch('/users/:id/reset-password', isAdmin, resetSystemUserPassword);
router.patch('/users/:id/status', isAdmin, toggleUserStatus);
router.delete('/users/:id', isAdmin, deleteUser);

// Academic Year & System Settings
router.get('/academic-years', canReadAdminData, getAcademicYears);
router.post('/academic-years', isAdmin, createAcademicYear);
router.patch('/academic-years/:id/activate', isAdmin, toggleAcademicYearStatus);

router.get('/settings', isAdmin, getSettings);
router.post('/settings/update', isAdmin, updateSetting);

// Departments & Sections
router.get('/departments', canReadAdminData, getDepartments);
router.get('/sections', canReadAdminData, getSections);
router.post('/sections', isAdmin, createSection);
router.delete('/sections/:id', isHod, deleteSection);
router.post('/departments', isAdmin, createDepartment);
router.put('/departments/:id', isAdmin, updateDepartment);
router.delete('/departments/:id', isAdmin, deleteDepartment);

// Students
router.get('/students', canReadAdminData, getStudents);
router.get('/students/:id', canReadAdminData, getStudentProfile);
router.post('/students', isHod, upload.single('photo'), validateZod(studentSchema), createStudent);
router.put('/students/:id', isHod, upload.single('photo'), validateZod(studentSchema), updateStudent);
router.delete('/students/:id', isAdmin, deleteStudent);
router.patch('/students/:id/reset-password', isAdmin, resetStudentPasswordToDOB);
router.get('/students/:id/gradesheet', canReadAdminData, getGradeSheet);
router.get('/students/:id/idcard', canReadAdminData, getIDCard);
router.post('/students/bulk', uploadMemory.fields([
    { name: 'file', maxCount: 1 },
    { name: 'photosZip', maxCount: 1 }
]), bulkUploadStudents);
router.post('/students/batch-assign-register', batchAssignRegisterNumbers);
router.post('/students/pass-out', isHod, passStudentsOut);

// Subjects
router.get('/subjects', canReadAdminData, getSubjects);
router.post('/subjects', isHod, validateSubject, createSubject);
router.delete('/subjects/:id', isAdmin, deleteSubject);
router.post('/assign-faculty', assignFaculty);
router.delete('/assign-faculty/:id', removeFacultyAssignment);

// Faculty Absence & Substitution
router.get('/faculty-absences', getAbsences);
router.post('/faculty-absences', markFacultyAbsent);
router.options('/faculty-absences', (req, res) => res.sendStatus(200));
router.delete('/faculty-absences', removeFacultyAbsence);
router.delete('/faculty-absences/:id', removeFacultyAbsence);
router.get('/faculty/availability', getFacultyAvailability);
router.get('/substitutions', getSubstitutions);
router.post('/substitutions', assignSubstitute);
router.delete('/substitutions/:id', deleteSubstitution);

// Faculty Management
router.get('/faculty', canReadAdminData, getFaculties);
router.post('/faculty/bulk-upload', isAdmin, uploadMemory.fields([
    { name: 'file', maxCount: 1 },
    { name: 'photosZip', maxCount: 1 }
]), bulkUploadFaculty);
router.get('/faculty/:id', canReadAdminData, getFacultyProfile);
router.post('/faculty', isAdmin, upload.single('photo'), createFaculty);
router.patch('/faculty/:id', isAdmin, upload.single('photo'), updateFaculty);
router.delete('/faculty/:id', isAdmin, deleteFaculty);

// Marks
router.get('/marks/:subjectId', getSubjectMarksForAdmin);
router.post('/marks', validateZod(markEntrySchema), updateMarksForAdmin);
router.get('/marks-approval/pending', getPendingMarks);
router.get('/marks-approval/status', getAllSubjectMarksStatus);
router.get('/marks-approval/:subjectId', getMarksForApproval);
router.post('/marks-approval/approve', approveMarks);
router.post('/marks-approval/approve-all', approveAllMarks);
router.post('/marks-approval/unlock', unlockMarks);
router.post('/marks-approval/unapprove', unapproveMarks);

// Attendance
router.get('/attendance/report', getAttendanceReport);
router.get('/attendance-report', canReadAdminData, getDepartmentAttendanceReport);
router.get('/attendance/export-excel', exportAttendanceExcel);

// Promotion
router.get('/promote-preview', isAdmin, promotePreview);
router.post('/promote-global', isAdmin, executeGlobalPromotion);
router.post('/promote-first-years', isAdmin, promoteFirstYears);

// Arrears
router.get('/arrears', getArrears);
router.post('/arrears/upload', uploadMemory.single('file'), uploadArrears);
router.post('/arrears/auto-generate', isAdmin, autoGenerateArrears);
router.post('/arrears/bulk-passedout', bulkUploadPassedOutArrears);
router.delete('/arrears/:id', deleteArrear);

// Hall Allocation Routes (isExamAdmin allowed)
router.get('/hall-allocation/sessions', isExamAdmin, getSessions);
router.post('/hall-allocation/sessions', isExamAdmin, createSession);
router.delete('/hall-allocation/sessions/:id', isExamAdmin, deleteSession);
router.put('/hall-allocation/sessions/:id/subjects', isExamAdmin, updateSessionSubjects);
router.patch('/hall-allocation/sessions/:id/lock', isExamAdmin, toggleSessionLock);
router.get('/hall-allocation/sessions/:id/allocations', isExamAdmin, getSessionAllocations);
router.get('/hall-allocation/halls', isExamAdmin, getHalls);
router.post('/hall-allocation/halls', isExamAdmin, addHall);
router.put('/hall-allocation/halls/:id', isExamAdmin, updateHall);
router.delete('/hall-allocation/halls/:id', isExamAdmin, deleteHall);
router.post('/hall-allocation/generate', isExamAdmin, generateAllocations);
router.post('/hall-allocation/delete-date', isExamAdmin, deleteAllocationByDate);
router.get('/hall-allocation/sessions/:id/export', isExamAdmin, exportConsolidatedPlan);
router.get('/hall-allocation/sessions/:id/export-grid', isExamAdmin, exportSeatingGrid);

// Dispatch Routes (isExamAdmin allowed)
router.get('/dispatch/subjects', isExamAdmin, getSubjectsForDispatch);
router.get('/dispatch/allocation-dates', isExamAdmin, getAllocationDates);
router.get('/dispatch/allocation-subjects', isExamAdmin, getSubjectsByAllocation);
router.get('/dispatch/students', isExamAdmin, getStudentsForDispatch);
router.post('/dispatch/export-pdf', isExamAdmin, exportDispatchPDF);
router.post('/dispatch/absentees-report', isExamAdmin, exportAbsenteesPDF);
router.post('/dispatch/save-absentees', isExamAdmin, saveDispatchAbsentees);

module.exports = router;
