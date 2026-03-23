/**
 * sidebarConfig.js
 * Sidebar navigation configuration for all user roles.
 * Sidebar.jsx reads this file — never hardcode menu items there.
 *
 * Structure for each item:
 *   { key, label, path, icon }            — leaf link
 *   { key, label, icon, isGroup, children } — collapsible group
 */

import {
    LayoutDashboard, Users, BookOpen, Calendar, ClipboardList, TrendingUp,
    Book, Bell, FileText, GraduationCap, Building2, Award, CheckCircle,
    UserCheck, Layout, Settings as SettingsIcon, Activity, Send,
    ShieldCheck, Ticket, ClipboardCheck, AlertTriangle, User, BookOpen as BookIcon
} from 'lucide-react';

// ─── ADMIN MENU ───────────────────────────────────────────────────────────────
export const adminMenu = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        path: '/admin',
        icon: LayoutDashboard,
    },
    {
        key: 'academics',
        label: 'Academics',
        icon: GraduationCap,
        isGroup: true,
        children: [
            { key: 'students', label: 'Students', path: '/admin/students', icon: Users },
            { key: 'promote', label: 'Students Promotion', path: '/admin/students/promote', icon: TrendingUp },
            { key: 'depts', label: 'Departments', path: '/admin/departments', icon: Building2 },
            { key: 'subjects', label: 'Subjects', path: '/admin/subjects', icon: BookOpen },
            { key: 'faculty', label: 'Faculty', path: '/admin/faculty', icon: GraduationCap },
        ],
    },
    {
        key: 'schedule',
        label: 'Schedule',
        icon: Calendar,
        isGroup: true,
        children: [
            { key: 'timetable', label: 'Timetable', path: '/admin/timetable', icon: Calendar },
            { key: 'attendance', label: 'Attendance', path: '/admin/attendance', icon: FileText },
            { key: 'session-creation', label: 'Session Creation', path: '/admin/session-creation', icon: Calendar },
        ],
    },
    {
        key: 'examination',
        label: 'Examination Control',
        icon: ClipboardList,
        isGroup: true,
        children: [
            { key: 'hall-allocation', label: 'Hall Allocation', path: '/admin/hall-allocation', icon: Layout },
            { key: 'marks-approval', label: 'Marks Approval', path: '/admin/marks-approval', icon: CheckCircle },
            { key: 'attendance-eligibility', label: 'Attendance Eligibility', path: '/admin/attendance-eligibility', icon: AlertTriangle },
            { key: 'hall-ticket', label: 'Hall Ticket', path: '/admin/hall-ticket', icon: Ticket },
            { key: 'exam-attendance', label: 'Exam Attendance', path: '/admin/exam-attendance-sheet', icon: ClipboardCheck },
            { key: 'dispatch', label: 'Dispatch', path: '/admin/dispatch', icon: Send },
            { key: 'dummy-mapping', label: 'Dummy Mapping', path: '/admin/dummy-mapping', icon: Book },
            { key: 'external', label: 'External Staff', path: '/admin/external', icon: Users },
            { key: 'results-consolidation', label: 'Result Consolidation', path: '/admin/results-consolidation', icon: Award },
            { key: 'provisional-results', label: 'Provisional Results', path: '/admin/provisional-results', icon: TrendingUp },
            { key: 'session-results', label: 'Exam Session results', path: '/admin/session-results', icon: ClipboardList },
            { key: 'arrears', label: 'Arrear Management', path: '/admin/arrears', icon: ClipboardList },
        ],
    },
    {
        key: 'system',
        label: 'System',
        icon: SettingsIcon,
        isGroup: true,
        children: [
            { key: 'users', label: 'User Management', path: '/admin/users', icon: Users },
            { key: 'settings', label: 'Settings', path: '/admin/settings', icon: SettingsIcon },
        ],
    },
];

// ─── FACULTY MENU ─────────────────────────────────────────────────────────────
export const facultyMenu = [
    { key: 'dashboard', label: 'Dashboard', path: '/faculty', icon: LayoutDashboard },
    { key: 'timetable', label: 'My Timetable', path: '/faculty/timetable', icon: Calendar },
    { key: 'attendance', label: 'Attendance', path: '/faculty/attendance', icon: UserCheck },
    { key: 'marks', label: 'Enter CIA Marks', path: '/faculty/marks', icon: Award },
    { key: 'results', label: 'View Results', path: '/faculty/results', icon: CheckCircle },
    { key: 'classes', label: 'My Classes', path: '/faculty/classes', icon: Users },
    { key: 'materials', label: 'Materials', path: '/faculty/materials', icon: Book },
    { key: 'announcements', label: 'Announcements', path: '/faculty/announcements', icon: Bell },
    { key: 'settings', label: 'Settings', path: '/faculty/settings', icon: SettingsIcon },
];

export const hodMenu = [
    { key: 'hod-db', label: 'Dashboard', path: '/hod', icon: LayoutDashboard },
    {
        key: 'hod-dept', label: 'My Department', icon: Building2, isGroup: true, children: [
            { key: 'hod-fac', label: 'Faculty Overview', path: '/hod/faculty', icon: GraduationCap },
            { key: 'hod-stu', label: 'Student Overview', path: '/hod/students', icon: Users },
            { key: 'hod-att', label: 'Dept Attendance', path: '/hod/dept-attendance', icon: Activity },
            { key: 'hod-notif', label: 'Notifications', path: '/hod/notifications', icon: Bell },
            { key: 'hod-elig', label: 'Eligibility Check', path: '/hod/attendance-eligibility', icon: ShieldCheck },
        ]
    },
    { key: 'hod-ann', label: 'Announcements', path: '/hod/announcements', icon: Bell },
    { key: 'hod-set', label: 'Settings', path: '/hod/settings', icon: SettingsIcon },
];

export const hodWithSubjectsMenu = [
    { key: 'hod-db', label: 'Dashboard', path: '/hod', icon: LayoutDashboard },
    {
        key: 'hod-dept', label: 'My Department', icon: Building2, isGroup: true, children: [
            { key: 'hod-fac', label: 'Faculty Overview', path: '/hod/faculty', icon: GraduationCap },
            { key: 'hod-stu', label: 'Student Overview', path: '/hod/students', icon: Users },
            { key: 'hod-att', label: 'Dept Attendance', path: '/hod/dept-attendance', icon: Activity },
            { key: 'hod-notif', label: 'Notifications', path: '/hod/notifications', icon: Bell },
            { key: 'hod-elig', label: 'Eligibility Check', path: '/hod/attendance-eligibility', icon: ShieldCheck },
        ]
    },
    {
        key: 'hod-teach', label: 'My Teaching', icon: BookOpen, isGroup: true, children: [
            { key: 'hod-tt', label: 'My Timetable', path: '/hod/timetable', icon: Calendar },
            { key: 'hod-at', label: 'Attendance', path: '/hod/attendance', icon: UserCheck },
            { key: 'hod-mk', label: 'Enter CIA Marks', path: '/hod/marks', icon: Award },
            { key: 'hod-rs', label: 'View Results', path: '/hod/results', icon: CheckCircle },
            { key: 'hod-cl', label: 'My Classes', path: '/hod/classes', icon: Users },
            { key: 'hod-mt', label: 'Materials', path: '/hod/materials', icon: Book },
        ]
    },
    { key: 'hod-ann', label: 'Announcements', path: '/hod/announcements', icon: Bell },
    { key: 'hod-set', label: 'Settings', path: '/hod/settings', icon: SettingsIcon },
];

// ─── PRINCIPAL MENU ───────────────────────────────────────────────────────────
export const principalMenu = [
    { key: 'dashboard', label: 'Dashboard', path: '/principal', icon: LayoutDashboard },
    {
        key: 'institutional',
        label: 'Institutional',
        icon: Building2,
        isGroup: true,
        children: [
            { key: 'students', label: 'Students Overview', path: '/principal/students', icon: Users },
            { key: 'faculty', label: 'Faculty Overview', path: '/principal/faculty', icon: GraduationCap },
        ],
    },
    { key: 'attendance', label: 'Attendance Summary', path: '/principal/attendance', icon: Activity },
    { key: 'results', label: 'Result Status', path: '/principal/results', icon: Award },
    { key: 'settings', label: 'Settings', path: '/principal/settings', icon: SettingsIcon },
];


// ─── CHIEF SECRETARY MENU ─────────────────────────────────────────────────────
export const chiefSecretaryMenu = [
    { key: 'dashboard', label: 'Overwatch', path: '/chief-secretary', icon: LayoutDashboard },
    {
        key: 'institutional', label: 'Institutional Intel', icon: Building2, isGroup: true, children: [
            { key: 'students', label: 'Student Metrics', path: '/chief-secretary/students', icon: Users },
            { key: 'faculty', label: 'Faculty Analytics', path: '/chief-secretary/faculty', icon: GraduationCap },
        ]
    },
    {
        key: 'compliance', label: 'Compliance', icon: ShieldCheck, isGroup: true, children: [
            { key: 'eligibility', label: 'SA Eligibility', path: '/chief-secretary/eligibility', icon: CheckCircle },
            { key: 'approvals', label: 'Admin Approvals', path: '/chief-secretary/approvals', icon: ClipboardCheck },
        ]
    },
    { key: 'results', label: 'Results & Trends', path: '/chief-secretary/results', icon: TrendingUp },
    { key: 'settings', label: 'Account', path: '/chief-secretary/settings', icon: SettingsIcon },
];

// ─── STUDENT MENU ─────────────────────────────────────────────────────────────
export const studentMenu = [
    { key: 'dashboard', label: 'Dashboard', path: '/student', icon: LayoutDashboard },
    { key: 'attendance', label: 'My Attendance', path: '/student/attendance', icon: UserCheck },
    { key: 'marks', label: 'CIA Marks', path: '/student/marks', icon: Award },
    { key: 'results', label: 'Results', path: '/student/results', icon: CheckCircle },
    { key: 'timetable', label: 'Timetable', path: '/student/timetable', icon: Calendar },
    { key: 'announcements', label: 'Announcements', path: '/student/announcements', icon: Bell },
    { key: 'profile', label: 'My Profile', path: '/student/profile', icon: User },
];

// ─── EXTERNAL STAFF MENU ─────────────────────────────────────────────────────
export const externalStaffMenu = [
    { key: 'dashboard', label: 'Dashboard', path: '/external', icon: LayoutDashboard },
];

// ─── FIRST YEAR COORDINATOR MENU ─────────────────────────────────────────────
export const firstYearCoordinatorMenu = [
    { key: 'hod-db', label: 'Dashboard', path: '/hod', icon: LayoutDashboard },
    {
        key: 'hod-dept', label: 'My Department', icon: Building2, isGroup: true, children: [
            { key: 'hod-fac', label: 'Faculty Overview', path: '/hod/faculty', icon: GraduationCap },
            { key: 'hod-stu', label: 'Student Overview', path: '/hod/students', icon: Users },
            { key: 'hod-att', label: 'Dept Attendance', path: '/hod/dept-attendance', icon: Activity },
            { key: 'hod-notif', label: 'Notifications', path: '/hod/notifications', icon: Bell },
            { key: 'hod-elig', label: 'Eligibility Check', path: '/hod/attendance-eligibility', icon: ShieldCheck },
        ]
    },
    {
        key: 'hod-teach', label: 'My Teaching', icon: BookOpen, isGroup: true, children: [
            { key: 'hod-tt', label: 'My Timetable', path: '/hod/timetable', icon: Calendar },
            { key: 'hod-at', label: 'Attendance', path: '/hod/attendance', icon: UserCheck },
            { key: 'hod-mk', label: 'Enter CIA Marks', path: '/hod/marks', icon: Award },
            { key: 'hod-rs', label: 'View Results', path: '/hod/results', icon: CheckCircle },
            { key: 'hod-cl', label: 'My Classes', path: '/hod/classes', icon: Users },
            { key: 'hod-mt', label: 'Materials', path: '/hod/materials', icon: Book },
        ]
    },
    { key: 'hod-ann', label: 'Announcements', path: '/hod/announcements', icon: Bell },
    { key: 'hod-set', label: 'Settings', path: '/hod/settings', icon: SettingsIcon },
];

// ─── MENU SELECTOR MAP ────────────────────────────────────────────────────────
export const MENUS_BY_ROLE = {
    ADMIN: adminMenu,
    FACULTY: facultyMenu,
    HOD: hodMenu,
    HOD_WITH_SUBJECTS: hodWithSubjectsMenu,
    PRINCIPAL: principalMenu,
    CHIEF_SECRETARY: chiefSecretaryMenu,
    STUDENT: studentMenu,
    EXTERNAL_STAFF: externalStaffMenu,
    EXTERNAL: externalStaffMenu,
    FIRST_YEAR_COORDINATOR: firstYearCoordinatorMenu,
};
