import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

// Shared and Executive components
import ChiefSecretaryDashboard from './Dashboard';
import HallAllocation from '../admin/examination/HallAllocation';
import ExamAttendanceSheet from '../admin/examination/ExamAttendanceSheet';
import Dispatch from '../admin/examination/Dispatch';
import Settings from '../shared/Settings';

const ChiefSecretaryPortal = () => {
    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar role="CHIEF_SECRETARY" />
            <div className="flex-1 flex flex-col ml-64 transition-all duration-300">
                <Header title="Chief Superintendent Portal" />
                <main className="flex-1 p-8 mt-24 overflow-y-auto animate-fadeIn">
                    <Routes>
                        <Route path="/" element={<ChiefSecretaryDashboard />} />
                        <Route path="/hall-allocation" element={<HallAllocation />} />
                        <Route path="/exam-attendance" element={<ExamAttendanceSheet />} />
                        <Route path="/dispatch" element={<Dispatch />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<Navigate to="/chief-superintendent" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export default ChiefSecretaryPortal;
