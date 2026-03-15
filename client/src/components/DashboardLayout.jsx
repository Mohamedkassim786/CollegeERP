import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = ({ children, role, title }) => {
    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar role={role} />
            <div className="flex-1 flex flex-col ml-64 transition-all duration-300">
                <Header title={title || "College ERP"} />
                <main className="flex-1 p-8 mt-24 overflow-y-auto animate-fadeIn">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
