import React, { useState, useEffect } from 'react';
import { 
    Activity, Clock, FileCheck, Search, Calendar, 
    ArrowRight, MapPin, ClipboardList, ShieldAlert
} from 'lucide-react';
import api from '../../api/axios';

const COEDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await api.get('/api/dashboard/coe');
            setData(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="h-96 flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-[#003B73] tracking-tight">Examination Control Center</h2>
                    <p className="text-gray-500 font-bold text-sm mt-1 uppercase tracking-widest">Controller of Examinations Panel</p>
                </div>
                <div className="flex gap-4">
                    <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Open New Session</button>
                    <button className="bg-white text-[#003B73] px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-gray-100 hover:bg-gray-50 transition-all">Export Gazettes</button>
                </div>
            </div>

            {/* COE Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-xl shadow-gray-200/50">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4"><ClipboardList size={24}/></div>
                    <h3 className="text-3xl font-black text-[#003B73] mb-1">{data?.stats?.pendingMarks || 0}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Evaluations</p>
                </div>
                <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-xl shadow-gray-200/50">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4"><Calendar size={24}/></div>
                    <h3 className="text-3xl font-black text-[#003B73] mb-1">{data?.activeSessions?.length || 0}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Exam Sessions</p>
                </div>
                <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-xl shadow-gray-200/50">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><FileCheck size={24}/></div>
                    <h3 className="text-3xl font-black text-[#003B73] mb-1">92.4%</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Results Accuracy Index</p>
                </div>
                <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-xl shadow-gray-200/50">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4"><ShieldAlert size={24}/></div>
                    <h3 className="text-3xl font-black text-red-500 mb-1">08</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">UFM Cases Reported</p>
                </div>
            </div>

            {/* Active Sessions Grid */}
            <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-xl shadow-gray-200/50">
                <h3 className="text-2xl font-black text-[#003B73] mb-10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Clock size={24}/></div>
                    Recent & Upcoming Sessions
                </h3>
                
                <div className="space-y-4">
                    {data?.activeSessions?.map(session => (
                         <div key={session.id} className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 hover:border-indigo-600/30 transition-all group flex items-center justify-between">
                            <div className="flex items-center gap-8">
                                <div className="text-center bg-white p-4 rounded-2xl border border-gray-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Month</p>
                                    <p className="text-xl font-black">{new Date(session.examDate).toLocaleString('default', { month: 'short' })}</p>
                                    <p className="text-xs font-bold">{new Date(session.examDate).getDate()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">SESSION #{session.id}</p>
                                    <h4 className="text-xl font-black text-gray-800 uppercase group-hover:text-indigo-600 transition-all">NOV-DEC 2023 EXAMS</h4>
                                    <div className="flex items-center gap-4 mt-2 text-xs font-bold text-gray-400">
                                        <span className="flex items-center gap-1.5"><MapPin size={14}/> Exam Hall 01-12</span>
                                        <span className="flex items-center gap-1.5"><Activity size={14}/> {session.subjects.length} Subjects Active</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest ${session.isLocked ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white'}`}>
                                        {session.isLocked ? 'LOCKED' : 'ONGOING'}
                                    </span>
                                    <p className="text-[9px] font-black text-gray-400 mt-2 uppercase tracking-widest">Status Tracking</p>
                                </div>
                                <button className="p-4 bg-white text-gray-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                    <ArrowRight size={24}/>
                                </button>
                            </div>
                         </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default COEDashboard;
