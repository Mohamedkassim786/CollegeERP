import React, { useState, useEffect } from 'react';
import { 
    Users, GraduationCap, AlertCircle, TrendingUp, 
    BarChart3, PieChart, Activity, Globe, Award
} from 'lucide-react';
import api from '../../api/axios';

const PrincipalDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/dashboard/principal');
            setStats(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="h-96 flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#003B73] border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-[#003B73] tracking-tight">Institutional Overview</h2>
                    <p className="text-gray-500 font-bold text-sm mt-1 uppercase tracking-widest">Real-time Performance Analytics</p>
                </div>
                <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest">
                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        Live System
                    </span>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 group hover:scale-[1.02] transition-all duration-500">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Users size={28}/></div>
                        <TrendingUp size={20} className="text-emerald-500"/>
                    </div>
                    <h3 className="text-4xl font-black text-[#003B73] mb-1">{stats?.overallStats?.totalStudents || 0}</h3>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Active Enrolment</p>
                </div>
                <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 group hover:scale-[1.02] transition-all duration-500">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center"><AlertCircle size={28}/></div>
                        <Activity size={20} className="text-red-400"/>
                    </div>
                    <h3 className="text-4xl font-black text-red-500 mb-1">{stats?.overallStats?.totalArrears || 0}</h3>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Ongoing Arrear Items</p>
                </div>
                <div className="bg-[#003B73] rounded-[40px] p-8 shadow-2xl shadow-blue-200 border border-blue-900 group hover:scale-[1.02] transition-all duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10"></div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center"><Award size={28}/></div>
                    </div>
                    <h3 className="text-4xl font-black text-white mb-1">84.2%</h3>
                    <p className="text-xs font-black text-blue-200 uppercase tracking-widest relative z-10">Institutional Pass Rate</p>
                </div>
            </div>

            {/* Department Comparison */}
            <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-black text-[#003B73] flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><BarChart3 size={24}/></div>
                        Departmental Efficacy
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stats?.deptStats?.map((dept, idx) => (
                        <div key={idx} className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 group hover:border-[#003B73] transition-all duration-500 relative overflow-hidden">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="text-xl font-black text-gray-800 uppercase tracking-tight">{dept.code}</h4>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{dept.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-[#003B73]">{dept.passPercentage}%</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SUCCESS</p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div 
                                    className="bg-[#003B73] h-full transition-all duration-1000" 
                                    style={{ width: `${dept.passPercentage}%` }}
                                ></div>
                            </div>
                            <div className="mt-4 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <span>{dept.studentCount} Students</span>
                                <span>Target: 95%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PrincipalDashboard;
