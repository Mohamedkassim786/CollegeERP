import React, { useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import AuthContext from '../../context/AuthProvider';
import { getFacultyAssignments } from '../../services/faculty.service';

// Shared pages (reuse faculty/admin pages HOD also has access to)
import FacultyHome from "../faculty/FacultyHome";
import EnterMarks from "../faculty/EnterMarks";
import FacultyTimetable from "../faculty/FacultyTimetable";
import AttendanceManager from "../faculty/AttendanceManager";
import MyClasses from "../faculty/MyClasses";
import ClassDetails from "../faculty/ClassDetails";
import PublishedResults from "../faculty/PublishedResults";
import Announcements from "../shared/Announcements";
import Materials from "../shared/Materials";
import Settings from "../shared/Settings";

// HOD-only pages
import HODHome from './Dashboard';
import HODAttendanceReport from './HODAttendanceReport';
import HODNotifications from './HODNotifications';
import AttendanceEligibility from '../admin/examination/AttendanceEligibility';

const HODPortal = () => {
    const { auth } = useContext(AuthContext);
    const [assignedSubjects, setAssignedSubjects] = useState([]);

    useEffect(() => {
        getFacultyAssignments()
            .then(res => setAssignedSubjects(res.data))
            .catch(() => {});
    }, []);

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar role="HOD" />
            <div className="flex-1 flex flex-col ml-64 transition-all duration-300">
                <Header title="HOD Portal" />
                <main className="flex-1 p-8 mt-24 overflow-y-auto animate-fadeIn">
                    <Routes>
                        {/* HOD Home (dept overview) */}
                        <Route path="/" element={<HODHome />} />

                        {/* Shared with Faculty */}
                        <Route path="/marks" element={<EnterMarks />} />
                        <Route path="/results" element={<PublishedResults />} />
                        <Route path="/timetable" element={<FacultyTimetable />} />
                        <Route path="/attendance" element={<AttendanceManager />} />
                        <Route path="/classes" element={<MyClasses />} />
                        <Route path="/class/:subjectId" element={<ClassDetails />} />
                        <Route path="/announcements" element={<Announcements role="HOD" />} />
                        <Route path="/materials" element={<Materials role="HOD" />} />
                        <Route path="/settings" element={<Settings />} />

                        {/* HOD-only */}
                        <Route path="/dept-attendance" element={<HODAttendanceReport />} />
                        <Route path="/notifications" element={<HODNotifications />} />
                        <Route path="/attendance-eligibility" element={<AttendanceEligibility />} />

                        <Route path="*" element={<Navigate to="/hod" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default HODPortal;
