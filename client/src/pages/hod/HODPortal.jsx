import React, { useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import AuthContext from '../../context/AuthProvider';
import { getFacultyAssignments } from '../../services/faculty.service';

import EnterMarks from "../faculty/EnterMarks";
import FacultyTimetable from "../faculty/FacultyTimetable";
import AttendanceManager from "../faculty/AttendanceManager";
import MyClasses from "../faculty/MyClasses";
import ClassDetails from "../faculty/ClassDetails";
import PublishedResults from "../faculty/PublishedResults";
import Announcements from "../shared/Announcements";
import Materials from "../shared/Materials";
import Settings from "../shared/Settings";

import HODHome from './Dashboard';
import HODAttendanceReport from './HODAttendanceReport';
import HODNotifications from './HODNotifications';
import HODFacultyOverview from './HODFacultyOverview';
import HODStudentOverview from './HODStudentOverview';
import StudentProfile from '../admin/academics/StudentProfile';
import FacultyProfile from '../admin/academics/FacultyProfile';
import AttendanceEligibility from '../admin/examination/AttendanceEligibility';

const HODPortal = () => {
    const { auth } = useContext(AuthContext);
    const [assignedSubjects, setAssignedSubjects] = useState([]);
    const [loadingAssignments, setLoadingAssignments] = useState(true);

    useEffect(() => {
        getFacultyAssignments()
            .then(res => setAssignedSubjects(res.data || []))
            .catch(() => setAssignedSubjects([]))
            .finally(() => setLoadingAssignments(false));
    }, []);

    // Wait for assignments to load before rendering sidebar
    const hasAssignments = assignedSubjects.length > 0;
    const isFYC = auth?.computedRoles?.includes('FIRST_YEAR_COORDINATOR');
    const sidebarRole = isFYC ? 'FIRST_YEAR_COORDINATOR' : (loadingAssignments ? 'HOD' : (hasAssignments ? 'HOD_WITH_SUBJECTS' : 'HOD'));

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar role={sidebarRole} />
            <div className="flex-1 flex flex-col ml-64 transition-all duration-300">
                <Header title="HOD Portal" />
                <main className="flex-1 p-8 mt-24 overflow-y-auto animate-fadeIn">
                    <Routes>
                        {/* HOD Dashboard */}
                        <Route path="/" element={<HODHome />} />

                        {/* My Department */}
                        <Route path="/faculty" element={<HODFacultyOverview />} />
                        <Route path="/faculty/:id" element={<FacultyProfile />} />
                        <Route path="/students" element={<HODStudentOverview />} />
                        <Route path="/students/profile/:id" element={<StudentProfile />} />
                        <Route path="/dept-attendance" element={<HODAttendanceReport />} />
                        <Route path="/notifications" element={<HODNotifications />} />
                        <Route path="/attendance-eligibility" element={<AttendanceEligibility />} />

                        {/* My Teaching (only shown in sidebar when assigned, but routes always registered) */}
                        <Route path="/marks" element={<EnterMarks />} />
                        <Route path="/results" element={<PublishedResults />} />
                        <Route path="/timetable" element={<FacultyTimetable />} />
                        <Route path="/attendance" element={<AttendanceManager />} />
                        <Route path="/classes" element={<MyClasses />} />
                        <Route path="/class/:subjectId" element={<ClassDetails />} />
                        <Route path="/materials" element={<Materials role="HOD" />} />

                        {/* Common */}
                        <Route path="/announcements" element={<Announcements role="HOD" />} />
                        <Route path="/settings" element={<Settings />} />

                        <Route path="*" element={<Navigate to="/hod" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default HODPortal;
