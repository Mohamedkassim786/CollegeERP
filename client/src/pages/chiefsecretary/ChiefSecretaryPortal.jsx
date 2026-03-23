import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

// Shared and Executive components
import ChiefSecretaryDashboard from './Dashboard';
import StudentManager from '../admin/academics/StudentManager';
import StudentProfile from '../admin/academics/StudentProfile';
import FacultyManager from '../admin/academics/FacultyManager';
import FacultyProfile from '../admin/academics/FacultyProfile';
import AttendanceEligibility from '../admin/examination/AttendanceEligibility';
import AdminMarksApproval from '../admin/examination/AdminMarksApproval';
import ResultsConsolidation from '../admin/examination/ResultsConsolidation';
import Settings from '../shared/Settings';

const ComingSoon = ({ title }) => (
    <div className="bg-white p-32 rounded-[60px] border border-gray-100 shadow-2xl text-center space-y-6 animate-fadeIn">
        <div className="w-24 h-24 bg-blue-50 rounded-[40px] flex items-center justify-center mx-auto mb-10 shadow-inner">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="text-4xl font-black text-[#003B73] tracking-tighter">{title}</h3>
        <p className="text-gray-400 font-bold max-w-md mx-auto leading-relaxed">
            This module is undergoing an institutional compliance audit and will be available shortly.
        </p>
        <div className="flex justify-center gap-4 pt-6">
            <div className="w-16 h-1 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#003B73] animate-progress" style={{ width: '45%' }}></div>
            </div>
        </div>
    </div>
);

const ChiefSecretaryPortal = () => {
    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar role="CHIEF_SECRETARY" />
            <div className="flex-1 flex flex-col ml-64 transition-all duration-300">
                <Header title="Chief Secretary Portal" />
                <main className="flex-1 p-8 mt-24 overflow-y-auto animate-fadeIn">
                    <Routes>
                        <Route path="/" element={<ChiefSecretaryDashboard />} />
                        <Route path="/students" element={<StudentManager readOnly={true} />} />
                        <Route path="/students/profile/:id" element={<StudentProfile readOnly={true} />} />
                        <Route path="/faculty" element={<FacultyManager readOnly={true} />} />
                        <Route path="/faculty/:id" element={<FacultyProfile readOnly={true} />} />
                        <Route path="/eligibility" element={<AttendanceEligibility readOnly={true} />} />
                        <Route path="/approvals" element={<AdminMarksApproval readOnly={true} />} />
                        <Route path="/results" element={<ResultsConsolidation readOnly={true} />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<Navigate to="/chief-secretary" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default ChiefSecretaryPortal;
