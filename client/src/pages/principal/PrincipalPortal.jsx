import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

// Shared and Executive components
import PrincipalDashboard from './Dashboard';
import StudentManager from '../admin/academics/StudentManager';
import StudentProfile from '../admin/academics/StudentProfile';
import Settings from '../shared/Settings';

const ComingSoon = ({ title }) => (
    <div className="bg-white p-32 rounded-[60px] border border-gray-100 shadow-2xl text-center space-y-6 animate-fadeIn">
        <div className="w-24 h-24 bg-blue-50 rounded-[40px] flex items-center justify-center mx-auto mb-10 shadow-inner">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="text-4xl font-black text-[#003B73] tracking-tighter">{title}</h3>
        <p className="text-gray-400 font-bold max-w-md mx-auto leading-relaxed">
            We are currently synchronizing the institutional intelligence for this module.
        </p>
        <div className="flex justify-center gap-4 pt-6">
            <div className="w-16 h-1 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#003B73] animate-progress" style={{ width: '60%' }}></div>
            </div>
        </div>
    </div>
);

const PrincipalPortal = () => {
    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar role="PRINCIPAL" />
            <div className="flex-1 flex flex-col ml-64 transition-all duration-300">
                <Header title="Principal Portal" />
                <main className="flex-1 p-8 mt-24 overflow-y-auto animate-fadeIn">
                    <Routes>
                        <Route path="/" element={<PrincipalDashboard />} />
                        <Route path="/students" element={<StudentManager readOnly={true} />} />
                        <Route path="/students/profile/:id" element={<StudentProfile readOnly={true} />} />
                        <Route path="/attendance" element={<ComingSoon title="Attendance Summary" />} />
                        <Route path="/results" element={<ComingSoon title="Results Analysis" />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<Navigate to="/principal" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default PrincipalPortal;
