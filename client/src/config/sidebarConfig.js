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
    ShieldCheck, Ticket, ClipboardCheck, AlertTriangle
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
            { key: 'students',  label: 'Students',          path: '/admin/students',          icon: Users },
            { key: 'promote',   label: 'Student Promotion',  path: '/admin/students/promote',  icon: TrendingUp },
            { key: 'depts',     label: 'Departments',        path: '/admin/departments',        icon: Building2 },
            { key: 'subjects',  label: 'Subjects',           path: '/admin/subjects',           icon: BookOpen },
            { key: 'faculty',   label: 'Faculty',            path: '/admin/faculty',            icon: GraduationCap },
        ],
    },
    {
        key: 'schedule',
        label: 'Schedule',
        icon: Calendar,
        isGroup: true,
        children: [
            { key: 'timetable',  label: 'Timetable',  path: '/admin/timetable',   icon: Calendar },
            { key: 'attendance', label: 'Attendance',  path: '/admin/attendance',  icon: FileText },
        ],
    },
    {
        key: 'examination',
        label: 'Examination Control',
        icon: ClipboardList,
        isGroup: true,
        children: [
            // ↓ Exact order specified in the requirements
            { key: 'marks-approval',          label: 'Marks Approval',         path: '/admin/marks-approval',            icon: CheckCircle },
            { key: 'results-consolidation',   label: 'Results Consolidation',  path: '/admin/results-consolidation',     icon: Award },
            { key: 'attendance-eligibility',  label: 'Attendance Eligibility', path: '/admin/attendance-eligibility',    icon: AlertTriangle },
            { key: 'dummy-mapping',           label: 'Dummy Mapping',          path: '/admin/dummy-mapping',             icon: Book },
            { key: 'external',                label: 'External Staff',         path: '/admin/external',                  icon: Users },
            { key: 'hall-allocation',         label: 'Hall Allocation',        path: '/admin/hall-allocation',           icon: Layout },
            { key: 'hall-ticket',             label: 'Hall Ticket',            path: '/admin/hall-ticket',               icon: Ticket },
            { key: 'exam-attendance-sheet',   label: 'Exam Attendance Sheet',  path: '/admin/exam-attendance-sheet',     icon: ClipboardCheck },
            { key: 'dispatch',                label: 'Dispatch',               path: '/admin/dispatch',                  icon: Send },
            { key: 'provisional-results',     label: 'Provisional Results',    path: '/admin/provisional-results',       icon: TrendingUp },
            { key: 'arrears',                 label: 'Arrear Management',      path: '/admin/arrears',                   icon: ClipboardList },
        ],
    },
    {
        key: 'system',
        label: 'System',
        icon: SettingsIcon,
        isGroup: true,
        children: [
            { key: 'users',    label: 'User Management', path: '/admin/users',    icon: Users },
            { key: 'settings', label: 'Settings',        path: '/admin/settings', icon: SettingsIcon },
        ],
    },
];

// ─── FACULTY MENU ─────────────────────────────────────────────────────────────
export const facultyMenu = [
    { key: 'dashboard',      label: 'Dashboard',       path: '/faculty',                icon: LayoutDashboard },
    { key: 'timetable',      label: 'My Timetable',    path: '/faculty/timetable',      icon: Calendar },
    { key: 'attendance',     label: 'Attendance',       path: '/faculty/attendance',     icon: UserCheck },
    { key: 'marks',          label: 'Enter CIA Marks',  path: '/faculty/marks',          icon: Award },
    { key: 'results',        label: 'View Results',     path: '/faculty/results',        icon: CheckCircle },
    { key: 'classes',        label: 'My Classes',       path: '/faculty/classes',        icon: Users },
    { key: 'materials',      label: 'Materials',        path: '/faculty/materials',      icon: Book },
    { key: 'announcements',  label: 'Announcements',    path: '/faculty/announcements',  icon: Bell },
    { key: 'settings',       label: 'Settings',         path: '/faculty/settings',       icon: SettingsIcon },
];

// ─── HOD MENU ─────────────────────────────────────────────────────────────────
export const hodMenu = [
    { key: 'dashboard', label: 'Dashboard', path: '/hod', icon: LayoutDashboard },
    {
        key: 'department',
        label: 'My Department',
        icon: Building2,
        isGroup: true,
        children: [
            { key: 'faculty',        label: 'Faculty Overview',  path: '/hod/faculty',        icon: GraduationCap },
            { key: 'students',       label: 'Student Overview',  path: '/hod/students',       icon: Users },
            { key: 'notifications',  label: 'Notifications',     path: '/hod/notifications',  icon: Bell },
        ],
    },
    { key: 'classes',        label: 'My Classes',       path: '/faculty/classes',        icon: Users },
    { key: 'attendance',     label: 'Attendance',       path: '/faculty/attendance',     icon: UserCheck },
    { key: 'marks',          label: 'Enter CIA Marks',  path: '/faculty/marks',          icon: Award },
    { key: 'results',        label: 'View Results',     path: '/faculty/results',        icon: CheckCircle },
    { key: 'materials',      label: 'Materials',        path: '/faculty/materials',      icon: Book },
    { key: 'announcements',  label: 'Announcements',    path: '/hod/announcements',      icon: Bell },
    { key: 'settings',       label: 'Settings',         path: '/hod/settings',           icon: SettingsIcon },
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
            { key: 'students',  label: 'Students Overview',  path: '/principal/students',  icon: Users },
            { key: 'faculty',   label: 'Faculty Overview',   path: '/principal/faculty',   icon: GraduationCap },
        ],
    },
    { key: 'attendance',  label: 'Attendance Summary',  path: '/principal/attendance',  icon: Activity },
    { key: 'results',     label: 'Result Status',        path: '/principal/results',     icon: Award },
    { key: 'settings',    label: 'Settings',             path: '/principal/settings',    icon: SettingsIcon },
];


// ─── CHIEF SECRETARY MENU ─────────────────────────────────────────────────────
export const chiefSecretaryMenu = [
    { key: 'dashboard',       label: 'Overwatch',              path: '/chief-secretary',           icon: LayoutDashboard },
    { key: 'institutional',   label: 'Institutional Intel',    icon: Building2,                    isGroup: true, children: [
        { key: 'students',  label: 'Student Metrics',   path: '/chief-secretary/students',   icon: Users },
        { key: 'faculty',   label: 'Faculty Analytics', path: '/chief-secretary/faculty',    icon: GraduationCap },
    ]},
    { key: 'compliance',      label: 'Compliance',             icon: ShieldCheck,                  isGroup: true, children: [
        { key: 'eligibility', label: 'SA Eligibility', path: '/chief-secretary/eligibility', icon: CheckCircle },
        { key: 'approvals',   label: 'Admin Approvals', path: '/chief-secretary/approvals',   icon: ClipboardCheck },
    ]},
    { key: 'results',         label: 'Results & Trends',       path: '/chief-secretary/results',   icon: TrendingUp },
    { key: 'settings',        label: 'Account',                path: '/chief-secretary/settings',  icon: SettingsIcon },
];

// ─── STUDENT MENU ─────────────────────────────────────────────────────────────
export const studentMenu = [
    { key: 'dashboard',     label: 'Dashboard',      path: '/student',                icon: LayoutDashboard },
];

// ─── EXTERNAL STAFF MENU ─────────────────────────────────────────────────────
export const externalStaffMenu = [
    { key: 'dashboard', label: 'Dashboard', path: '/external', icon: LayoutDashboard },
];

// ─── MENU SELECTOR MAP ────────────────────────────────────────────────────────
export const MENUS_BY_ROLE = {
    ADMIN: adminMenu,
    FACULTY: facultyMenu,
    HOD: hodMenu,
    PRINCIPAL: principalMenu,
    CHIEF_SECRETARY: chiefSecretaryMenu,
    STUDENT: studentMenu,
    EXTERNAL_STAFF: externalStaffMenu,
    EXTERNAL: externalStaffMenu,
};
