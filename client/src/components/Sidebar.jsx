import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, BookOpen, Calendar, ClipboardList, TrendingUp,
    Book, Bell, FileText, GraduationCap, Building2, Award, CheckCircle, UserCheck, Layout,
    Settings as SettingsIcon, ChevronDown, ChevronRight, Activity, Send
} from 'lucide-react';

const Sidebar = ({ role, activePath }) => {
    const location = useLocation();
    const currentPath = activePath || location.pathname;
    const [expandedGroup, setExpandedGroup] = useState(null);

    const adminMenu = [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        {
            label: 'Academics',
            icon: GraduationCap,
            isGroup: true,
            children: [
                { label: 'Students', path: '/admin/students', icon: Users },
                { label: 'Student Promotion', path: '/admin/students/promote', icon: TrendingUp },
                { label: 'Departments', path: '/admin/departments', icon: Building2 },
                { label: 'Subjects', path: '/admin/subjects', icon: BookOpen },
                { label: 'Faculty', path: '/admin/faculty', icon: GraduationCap },
            ]
        },
        {
            label: 'Schedule',
            icon: Calendar,
            isGroup: true,
            children: [
                { label: 'Timetable', path: '/admin/timetable', icon: Calendar },
                { label: 'Attendance', path: '/admin/attendance', icon: FileText },
            ]
        },
        {
            label: 'Examination Control',
            icon: ClipboardList,
            isGroup: true,
            children: [
                { label: 'Marks Approval', path: '/admin/marks-approval', icon: CheckCircle },
                { label: 'Exams & Results', path: '/admin/exams', icon: Award },
                { label: 'Arrear Management', path: '/admin/arrears/manage', icon: ClipboardList },
                { label: 'End Sem Marks', path: '/admin/end-sem-marks', icon: Award },
                { label: 'Dummy Mapping', path: '/admin/dummy-mapping', icon: Book },
                { label: 'External Staff', path: '/admin/external', icon: Users },
                { label: 'Hall Allocation', path: '/admin/hall-allocation', icon: Layout },
                { label: 'Dispatch', path: '/admin/dispatch', icon: Send },
            ]
        },
        {
            label: 'System',
            icon: SettingsIcon,
            isGroup: true,
            children: [
                { label: 'Settings', path: '/admin/settings', icon: SettingsIcon },
            ]
        },
    ];

    const facultyMenu = [
        { label: 'Dashboard', path: '/faculty', icon: LayoutDashboard },
        { label: 'My Timetable', path: '/faculty/timetable', icon: Calendar },
        { label: 'Attendance', path: '/faculty/attendance', icon: UserCheck },
        { label: 'Enter CIA Marks', path: '/faculty/marks', icon: Award },
        { label: 'View Results', path: '/faculty/results', icon: CheckCircle },
        { label: 'My Classes', path: '/faculty/classes', icon: Users },
        { label: 'Materials', path: '/faculty/materials', icon: Book },
        { label: 'Announcements', path: '/faculty/announcements', icon: Bell },
        { label: 'Settings', path: '/faculty/settings', icon: SettingsIcon },
    ];

    const externalStaffMenu = [
        { label: 'Dashboard', path: '/external', icon: LayoutDashboard },
    ];

    const principalMenu = [
        { label: 'Dashboard', path: '/principal', icon: LayoutDashboard },
        {
            label: 'Institutional',
            icon: Building2,
            isGroup: true,
            children: [
                { label: 'Departments', path: '/principal/departments', icon: Building2 },
                { label: 'Faculty Roster', path: '/principal/faculty', icon: GraduationCap },
                { label: 'Student Body', path: '/principal/students', icon: Users },
            ]
        },
        {
            label: 'Analytics',
            icon: TrendingUp,
            isGroup: true,
            children: [
                { label: 'Academic Performance', path: '/principal/performance', icon: Award },
                { label: 'Attendance Trends', path: '/principal/attendance', icon: Activity },
            ]
        },
        { label: 'Settings', path: '/principal/settings', icon: SettingsIcon },
    ];

    const coeMenu = [
        { label: 'Dashboard', path: '/coe', icon: LayoutDashboard },
        {
            label: 'Examination',
            icon: ClipboardList,
            isGroup: true,
            children: [
                { label: 'Exam Sessions', path: '/coe/sessions', icon: Calendar },
                { label: 'External Marks', path: '/coe/external-marks', icon: Award },
                { label: 'Dummy Numbers', path: '/coe/dummy-mapping', icon: Book },
                { label: 'Hall Allocation', path: '/coe/hall-allocation', icon: Layout },
            ]
        },
        {
            label: 'Results',
            icon: Award,
            isGroup: true,
            children: [
                { label: 'Marks Approval', path: '/coe/marks-approval', icon: CheckCircle },
                { label: 'Result Generation', path: '/coe/generate-results', icon: TrendingUp },
            ]
        },
        { label: 'Settings', path: '/coe/settings', icon: SettingsIcon },
    ];

    const hodMenu = [
        { label: 'Dashboard', path: '/hod', icon: LayoutDashboard },
        {
            label: 'Department',
            icon: Building2,
            isGroup: true,
            children: [
                { label: 'Our Students', path: '/hod/students', icon: Users },
                { label: 'Our Faculty', path: '/hod/faculty', icon: GraduationCap },
                { label: 'Dept Timetable', path: '/hod/timetable', icon: Calendar },
            ]
        },
        {
            label: 'Academic Ops',
            icon: ClipboardList,
            isGroup: true,
            children: [
                { label: 'Attendance Check', path: '/hod/attendance', icon: UserCheck },
                { label: 'Mark Entry Approval', path: '/hod/marks', icon: Award },
            ]
        },
        { label: 'Announcements', path: '/hod/announcements', icon: Bell },
        { label: 'Settings', path: '/hod/settings', icon: SettingsIcon },
    ];

    const studentMenu = [
        { label: 'Dashboard', path: '/student', icon: LayoutDashboard },
        { label: 'My Academic Profile', path: '/student/profile', icon: UserCheck },
        { label: 'Course Materials', path: '/student/materials', icon: Book },
        { label: 'My Attendance', path: '/student/attendance', icon: Activity },
        { label: 'Exam Results', path: '/student/results', icon: Award },
        { label: 'Announcements', path: '/student/announcements', icon: Bell },
        { label: 'Settings', path: '/student/settings', icon: SettingsIcon },
    ];

    const menuSelection = {
        ADMIN: adminMenu,
        FACULTY: facultyMenu,
        EXTERNAL_STAFF: externalStaffMenu,
        PRINCIPAL: principalMenu,
        COE: coeMenu,
        HOD: hodMenu,
        STUDENT: studentMenu
    };

    const menu = menuSelection[role] || facultyMenu;

    // Auto-expand group containing active route
    useEffect(() => {
        if (role === 'ADMIN') {
            adminMenu.forEach(item => {
                if (item.isGroup) {
                    const hasActiveChild = item.children.some(child =>
                        currentPath === child.path || currentPath.startsWith(child.path + '/')
                    );
                    if (hasActiveChild) {
                        setExpandedGroup(item.label);
                    }
                }
            });
        }
    }, [currentPath, role]);

    const toggleGroup = (label) => {
        setExpandedGroup(expandedGroup === label ? null : label);
    };

    const renderMenuItem = (item, idx, isChild = false) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');

        if (item.isGroup) {
            const isExpanded = expandedGroup === item.label;
            const hasActiveChild = item.children.some(child =>
                currentPath === child.path || currentPath.startsWith(child.path + '/')
            );

            return (
                <li key={idx} className="space-y-1">
                    <button
                        onClick={() => toggleGroup(item.label)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group
                            ${hasActiveChild && !isExpanded
                                ? 'bg-white/10 text-white'
                                : 'text-blue-100 hover:bg-[#0F2C59] hover:text-white'
                            }`}
                    >
                        <div className="flex items-center">
                            <Icon className={`w-5 h-5 mr-3 transition-transform duration-300 group-hover:scale-110`} />
                            {item.label}
                        </div>
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <ul className="mt-1 ml-4 space-y-1 border-l border-blue-800/50 pl-2">
                            {item.children.map((child, cIdx) => renderMenuItem(child, `${idx}-${cIdx}`, true))}
                        </ul>
                    </div>
                </li>
            );
        }

        return (
            <li key={idx} className="animate-fadeIn" style={{ animationDelay: `${idx * 50}ms` }}>
                <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden
                        ${isActive
                            ? 'bg-white text-[#003B73] shadow-xl shadow-blue-900/20'
                            : 'text-blue-100/90 hover:bg-white/10 hover:text-white'
                        } ${isChild ? 'py-2 px-3' : ''}`}
                >
                    <Icon className={`w-5 h-5 mr-3 transition-transform duration-300 ${isActive ? 'text-[#003B73]' : 'group-hover:scale-110 group-hover:text-white'}`} />
                    <span className="relative z-10">{item.label}</span>
                    {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#003B73] rounded-r-full"></div>
                    )}
                </Link>
            </li>
        );
    };

    return (
        <div className="w-64 bg-[#003B73] text-white min-h-screen flex flex-col shadow-2xl fixed left-0 top-0 bottom-0 z-50 overflow-hidden">
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#003B73] via-[#002850] to-[#001D3D] opacity-90"></div>

            {/* Logo Area */}
            <div className="h-24 flex items-center px-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white text-[#003B73] flex items-center justify-center shadow-xl font-black text-2xl group cursor-pointer hover:rotate-3 transition-transform">
                        M
                    </div>
                    <div className="leading-tight">
                        <span className="text-xl font-black tracking-tighter text-white">MIET ERP</span>
                        <p className="text-[9px] text-blue-300 font-bold uppercase tracking-[0.2em]">
                            {role.replace('_', ' ')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-4 px-4 custom-scrollbar relative z-10">
                <ul className="space-y-1.5">
                    {menu.map((item, idx) => renderMenuItem(item, idx))}
                </ul>
            </div>

            {/* Footer */}
            <div className="p-6 bg-black/10 backdrop-blur-sm relative z-10">
                <div className="text-[10px] text-blue-300 font-bold text-center space-y-1">
                    <p className="uppercase tracking-[0.2em] opacity-60">© 2026 MIET ERP</p>
                    <p className="text-white/40">Build Version 1.4.0</p>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
