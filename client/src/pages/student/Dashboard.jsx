import React, { useState, useEffect } from 'react';
import { 
    User, BookOpen, Clock, Activity, Award, 
    ArrowRight, Star, ShieldCheck, Mail, Phone, MapPin
} from 'lucide-react';
import { getStudentDashboard } from '../../services/dashboard.service';

const StudentDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await getStudentDashboard();
            setData(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#003B73] border-t-transparent rounded-full animate-spin"></div></div>;

    const name = data?.profile?.name || '';
    const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'ST';

    return (
        <div className="space-y-8 animate-fadeIn max-w-[1400px] mx-auto">
            {/* Student Welcome Banner */}
            <div className="bg-[#003B73] rounded-[48px] p-12 text-white relative overflow-hidden shadow-2xl shadow-blue-200">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-32 -translate-y-32"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8 text-center md:text-left">
                        <div className="w-32 h-32 bg-white rounded-[40px] border-[6px] border-white/20 shadow-2xl flex items-center justify-center text-5xl font-black text-[#003B73]">
                            {initials}
                        </div>
                        <div>
                            <p className="text-blue-200 font-black uppercase tracking-[0.2em] mb-2 text-xs">Academic Workspace</p>
                            <h2 className="text-4xl font-black tracking-tight mb-2">Welcome Back, {name.split(' ')[0]}!</h2>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                <span className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 font-bold text-sm backdrop-blur-md flex items-center gap-2"><Star size={16} fill="white"/> {data?.profile?.rollNo}</span>
                                <span className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 font-bold text-sm backdrop-blur-md">{data?.profile?.department || 'COMPUTER SCIENCE'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-8">
                         <div className="text-center">
                            <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Attendance</p>
                            <h3 className="text-4xl font-black">{data?.stats?.attendancePercentage}%</h3>
                         </div>
                         <div className="w-px h-16 bg-white/10 self-center"></div>
                         <div className="text-center">
                            <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Current CGPA</p>
                            <h3 className="text-4xl font-black">{data?.stats?.cgpa || '0.00'}</h3>
                         </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Quick Info */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
                         <h3 className="text-xl font-black text-[#003B73] mb-8 flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Activity size={20}/></div>
                            Performance Index
                         </h3>
                         <div className="space-y-6">
                            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Active Arrears</p>
                                <div className="flex justify-between items-end">
                                    <h4 className={`text-4xl font-black ${data?.stats?.arrearsCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{data?.stats?.arrearsCount || 0}</h4>
                                    <span className="text-[10px] font-black text-gray-300 uppercase">Subjects to clear</span>
                                </div>
                            </div>
                            <div className="p-6 bg-[#003B73]/5 rounded-3xl border border-[#003B73]/10">
                                <p className="text-[10px] font-black text-[#003B73]/60 uppercase tracking-widest mb-2">Latest Result Status</p>
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="text-emerald-500" size={24}/>
                                    <h4 className="text-xl font-black text-[#003B73] uppercase">{data?.recentResults?.[0]?.resultStatus || 'N/A'}</h4>
                                </div>
                            </div>
                         </div>
                    </div>

                    <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
                         <h3 className="text-xl font-black text-[#003B73] mb-8 flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Mail size={20}/></div>
                            Profile Sync
                         </h3>
                         <div className="space-y-4">
                             <div className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer group">
                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-[#003B73] group-hover:text-white transition-all"><Mail size={18}/></div>
                                <span className="font-bold text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">{data?.profile?.email || 'N/A'}</span>
                             </div>
                             <div className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer group">
                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-[#003B73] group-hover:text-white transition-all"><Phone size={18}/></div>
                                <span className="font-bold text-gray-600">{data?.profile?.phoneNumber || 'N/A'}</span>
                             </div>
                             <div className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer group">
                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-[#003B73] group-hover:text-white transition-all"><MapPin size={18}/></div>
                                <span className="font-bold text-gray-600">{data?.profile?.city || 'N/A'}</span>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Right: Academic Content */}
                <div className="lg:col-span-2 space-y-8">
                     <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-2xl font-black text-[#003B73] flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Award size={24}/></div>
                                Semester Performance
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    <tr>
                                        <th className="px-8 py-4">Semester</th>
                                        <th className="px-8 py-4 text-center">GPA</th>
                                        <th className="px-8 py-4 text-center">CGPA</th>
                                        <th className="px-8 py-4 text-right">Result</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {data?.recentResults?.map(res => (
                                        <tr key={res.id} className="group hover:bg-gray-50/100 transition-all">
                                            <td className="px-8 py-6 font-black text-[#003B73]">SEM {res.semester}</td>
                                            <td className="px-8 py-6 text-center text-lg font-black text-gray-700">{res.gpa.toFixed(2)}</td>
                                            <td className="px-8 py-6 text-center text-lg font-black text-gray-400">{res.cgpa.toFixed(2)}</td>
                                            <td className="px-8 py-6 text-right">
                                                <span className={`px-4 py-1.5 rounded-full font-black text-[10px] border ${res.resultStatus === 'PASS' || res.resultStatus === 'P' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                    {res.resultStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>

                     <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
                        <h3 className="text-2xl font-black text-[#003B73] mb-10 flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center"><BookOpen size={24}/></div>
                            Recent Marks Entry
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {data?.recentMarks?.map(m => (
                                <div key={m.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:border-[#003B73] transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{m.subject.code}</p>
                                            <p className="font-extrabold text-gray-800 line-clamp-1">{m.subject.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-[#003B73]">{m.internal || '0'}</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase">CIA / 25</p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-[#003B73] h-full transition-all duration-1000" style={{ width: `${(m.internal / 25) * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
