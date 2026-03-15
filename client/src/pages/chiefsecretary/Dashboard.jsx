import React, { useState, useEffect } from 'react';
import { 
    ShieldCheck, Users, GraduationCap, TrendingUp, 
    Activity, ClipboardCheck, BarChart3, AlertCircle,
    LayoutDashboard, Globe, Zap
} from 'lucide-react';
import api from '../../api/axios';

const ChiefSecretaryDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/api/dashboard/chief-secretary');
                setStats(response.data);
            } catch (error) {
                console.error("Failed to fetch Chief Secretary stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-[#003B73] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-10 animate-fadeIn bg-[#F8FAFC]">
            {/* Premium Header */}
            <div className="flex justify-between items-end border-b border-gray-200 pb-8">
                <div>
                    <h1 className="text-4xl font-extrabold text-[#003B73] tracking-tighter mb-2">Institutional Overwatch</h1>
                    <p className="text-gray-500 font-bold text-sm uppercase tracking-[0.3em]">Chief Secretary Management Console</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-black text-gray-700 uppercase tracking-widest">System Live</span>
                    </div>
                </div>
            </div>

            {/* Quick Intel Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                    { label: 'Total Enrolment', value: stats?.overallStats?.totalStudents || 0, icon: Users, color: 'blue' },
                    { label: 'Faculty Strength', value: stats?.overallStats?.totalFaculty || 0, icon: GraduationCap, color: 'indigo' },
                    { label: 'Pending Approvals', value: stats?.overallStats?.pendingApprovals || 0, icon: ShieldCheck, color: 'emerald' },
                    { label: 'System Uptime', value: '99.9%', icon: Zap, color: 'amber' }
                ].map((item, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 group hover:scale-[1.05] transition-all duration-500">
                        <div className={`w-14 h-14 bg-${item.color}-50 text-${item.color}-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform`}>
                            <item.icon size={28} />
                        </div>
                        <h3 className="text-4xl font-black text-[#003B73] mb-1">{item.value}</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                    </div>
                ))}
            </div>

            {/* Main Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Institutional Performance */}
                <div className="lg:col-span-2 bg-white rounded-[40px] p-10 shadow-2xl shadow-blue-900/5 border border-gray-100">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-2xl font-black text-[#003B73] flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><TrendingUp size={24}/></div>
                            Performance Analytics
                        </h3>
                        <div className="flex gap-2">
                             <span className="px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 border border-gray-100 transition-all hover:bg-gray-100 cursor-pointer">Semester View</span>
                        </div>
                    </div>
                    
                    <div className="h-64 flex items-end justify-between gap-4 px-4">
                        {[75, 82, 91, 84, 95, 88].map((height, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                <div 
                                    className="w-full bg-gradient-to-t from-[#003B73] to-blue-500 rounded-2xl transition-all duration-1000 group-hover:brightness-125 relative"
                                    style={{ height: `${height}%` }}
                                >
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#003B73] text-white text-[10px] font-black py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {height}%
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-gray-400 uppercase">Batch {2020 + i}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Compliance & Risk Cards */}
                <div className="space-y-8">
                    <div className="bg-[#003B73] rounded-[40px] p-8 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6"><ClipboardCheck size={28}/></div>
                            <h4 className="text-3xl font-black mb-1">124</h4>
                            <p className="text-xs font-black text-blue-200 uppercase tracking-widest">Pending Approvals</p>
                            <button className="mt-8 w-full py-4 bg-white text-[#003B73] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all">Review Pipeline</button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-xl shadow-gray-100">
                        <h4 className="text-xl font-black text-[#003B73] mb-6 flex items-center gap-3">
                            <AlertCircle className="text-red-500" size={20}/>
                            Risk Indicators
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-red-50 rounded-2xl border border-red-100">
                                <span className="text-[10px] font-black text-red-700 uppercase">Critical Attendance</span>
                                <span className="font-black text-red-700">12%</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                <span className="text-[10px] font-black text-amber-700 uppercase">Exam Eligibility</span>
                                <span className="font-black text-amber-700">08%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row - Institutional Intel */}
            <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-black text-[#003B73] flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><BarChart3 size={24}/></div>
                        Intel Roster
                    </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {(stats?.deptStats || []).map((dept, i) => (
                        <div key={i} className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 group hover:border-[#003B73] transition-all">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="text-xl font-black text-gray-800">{dept.code || dept.name}</h4>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{dept.studentCount} Students</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-[#003B73]">{dept.passPercentage}%</span>
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">PASS RATE</p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-[#003B73] h-full" style={{ width: `${dept.passPercentage}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChiefSecretaryDashboard;
