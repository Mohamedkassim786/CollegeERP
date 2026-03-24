import React, { useState, useEffect } from 'react';
import { 
    Users, ClipboardCheck, Layout, Send,
    Activity, ShieldCheck, AlertCircle, Clock
} from 'lucide-react';
import api from '../../api/axios';

const ChiefSuperintendentDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/dashboard/chief-secretary');
                setStats(response.data);
            } catch (error) {
                console.error("Failed to fetch Chief Superintendent stats", error);
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

    const oStats = stats?.overallStats || {};

    return (
        <div className="p-8 space-y-10 animate-fadeIn bg-[#F8FAFC]">
            {/* Premium Header */}
            <div className="flex justify-between items-end border-b border-gray-200 pb-8">
                <div>
                    <h1 className="text-4xl font-extrabold text-[#003B73] tracking-tighter mb-2">Examination Console</h1>
                    <p className="text-gray-500 font-bold text-sm uppercase tracking-[0.3em]">Chief Superintendent Dashboard</p>
                </div>
                <div className="flex gap-4 text-right">
                    <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Date</p>
                        <p className="text-sm font-bold text-[#003B73]">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                    { label: "Today's Allocations", value: oStats.totalAllocations || 0, icon: Users, color: 'blue', desc: 'Total scheduled students' },
                    { label: "Today's Absentees", value: oStats.totalAbsentees || 0, icon: AlertCircle, color: 'red', desc: 'Marked as absent' },
                    { label: "Active Halls", value: oStats.activeHalls || 0, icon: Layout, color: 'emerald', desc: 'In-use examination halls' },
                    { label: "Dispatch Progress", value: oStats.dispatchProgress || 0, icon: Send, color: 'amber', desc: 'Subjects processed' }
                ].map((item, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[40px] shadow-xl shadow-gray-200/40 border border-gray-100 group hover:-translate-y-2 transition-all duration-500">
                        <div className={`w-14 h-14 bg-${item.color}-50 text-${item.color}-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                            <item.icon size={28} />
                        </div>
                        <h3 className="text-4xl font-black text-[#003B73] mb-1">{item.value}</h3>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.label}</p>
                        <p className="text-[9px] text-gray-300 mt-2 font-medium">{item.desc}</p>
                    </div>
                ))}
            </div>

            {/* Examination Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#003B73] rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-125 transition-transform duration-700"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8"><ShieldCheck size={32}/></div>
                        <h2 className="text-3xl font-black mb-4">Command & Control</h2>
                        <p className="text-blue-200 text-sm font-medium max-w-sm mb-10 leading-relaxed">
                            Full operational access to hall allocations, student attendance tracking, and answer booklet dispatching for all university examinations.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <span className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">End Sem Theory</span>
                            <span className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">Integrated Exams</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-xl flex flex-col justify-center">
                    <h3 className="text-xl font-black text-[#003B73] mb-8 flex items-center gap-3">
                        <Clock className="text-emerald-500" size={24}/>
                        Operations Live Status
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl">
                            <div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Allocation Status</p>
                                <p className="text-sm font-bold text-gray-700 mt-1">Halls mapped for today</p>
                            </div>
                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl">
                            <div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Attendance Feed</p>
                                <p className="text-sm font-bold text-gray-700 mt-1">Real-time absentee tracking</p>
                            </div>
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChiefSuperintendentDashboard;
