import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { UserCheck, BookOpen, AlertCircle, CheckCircle, Search } from 'lucide-react';

const StudentAttendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSubject, setExpandedSubject] = useState(null);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const res = await api.get('/student/attendance');
                setAttendance(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, []);

    const overallPercentage = attendance.length > 0 
        ? (attendance.reduce((acc, curr) => acc + parseFloat(curr.percentage), 0) / attendance.length).toFixed(1)
        : '0.0';

    const getStatusColor = (percentage) => {
        const p = parseFloat(percentage);
        if (p >= 75) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        if (p >= 65) return 'text-amber-600 bg-amber-50 border-amber-100';
        return 'text-rose-600 bg-rose-50 border-rose-100';
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (loading) return (
        <div className="animate-fadeIn">
            <div className="h-48 bg-gray-100 rounded-[32px] mb-8 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-64 bg-gray-100 rounded-[32px] animate-pulse"></div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Overall Header */}
            <div className="bg-[#003B73] p-10 rounded-[40px] text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <h1 className="text-4xl font-black mb-2 uppercase tracking-tighter">Attendance Overview</h1>
                        <p className="text-blue-200 font-medium">Keep track of your subject-wise presence and eligibility</p>
                    </div>
                    <div className="flex items-center gap-6 bg-white/10 p-6 rounded-[32px] backdrop-blur-sm border border-white/10">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Aggregate Percentage</p>
                            <p className="text-5xl font-black">{overallPercentage}%</p>
                        </div>
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                            <UserCheck size={32} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Subject Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attendance.map((sub, idx) => (
                    <div key={idx} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#003B73] group-hover:bg-[#003B73] group-hover:text-white transition-colors duration-300">
                                <BookOpen size={20} />
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(sub.percentage)}`}>
                                {sub.status}
                            </span>
                        </div>
                        
                        <div className="mb-6">
                            <h3 className="text-lg font-black text-[#003B73] mb-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate">
                                {sub.subject.name}
                            </h3>
                            <p className="text-xs font-bold text-gray-400 font-mono tracking-tighter mb-1">{sub.subject.code}</p>
                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide italic">Prof. {sub.faculty}</p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-4 grid grid-cols-3 gap-2">
                            <div className="text-center">
                                <p className="text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Total</p>
                                <p className="text-lg font-black text-[#003B73]">{sub.total}</p>
                            </div>
                            <div className="text-center border-x border-gray-200">
                                <p className="text-[9px] font-black text-emerald-500 mb-1 uppercase tracking-widest">Present</p>
                                <p className="text-lg font-black text-emerald-600">{sub.present}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-black text-rose-500 mb-1 uppercase tracking-widest">Absent</p>
                                <p className="text-lg font-black text-rose-600">{sub.absent}</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button 
                                onClick={() => setExpandedSubject(expandedSubject === idx ? null : idx)}
                                className="w-full py-3 bg-[#003B73]/5 hover:bg-[#003B73]/10 text-[#003B73] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mb-4"
                            >
                                {expandedSubject === idx ? 'Hide History' : 'View Period History'}
                            </button>

                            {expandedSubject === idx && (
                                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                    {sub.details?.length > 0 ? sub.details.map((rec, rIdx) => (
                                        <div key={rIdx} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-600 uppercase">{formatDate(rec.date)}</p>
                                                <p className="text-[8px] font-bold text-gray-400">Period {rec.period}</p>
                                            </div>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${rec.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700' : rec.status === 'OD' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {rec.status}
                                            </span>
                                        </div>
                                    )) : (
                                        <p className="text-[9px] text-gray-400 text-center py-4">No individual records found.</p>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendance Range</span>
                                <span className="text-xl font-black text-[#003B73]">{sub.percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${
                                        parseFloat(sub.percentage) >= 75 ? 'bg-emerald-500' : 
                                        parseFloat(sub.percentage) >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${sub.percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {attendance.length === 0 && (
                <div className="bg-white p-20 rounded-[40px] text-center shadow-sm border border-gray-100">
                    <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-black text-gray-400 tracking-widest uppercase">No Attendance Records Data</h3>
                    <p className="text-gray-400 mt-2">Attendances haven't been compiled for your current semester yet.</p>
                </div>
            )}
        </div>
    );
};

export default StudentAttendance;
