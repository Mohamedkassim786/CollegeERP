import React, { useState, useEffect } from "react";
import { 
    User, BookOpen, Clock, Activity, Award, 
    ArrowRight, Star, ShieldCheck, Mail, Phone, MapPin,
    ArrowUpRight, Target, CalendarDays, RefreshCw
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, 
    AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { getStudentDashboard } from '../../services/dashboard.service';
import useCountUp from '../../hooks/useCountUp';
import SkeletonLoader from '../../components/SkeletonLoader';
import { Link } from 'react-router-dom';

const AnimatedValue = ({ value }) => {
  const animated = useCountUp(value);
  return <>{animated}</>;
};

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

    if (loading) return <SkeletonLoader type="dashboard" />;

    const name = data?.profile?.name || '';
    const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'ST';

    return (
        <div className="space-y-10 animate-fadeIn min-h-screen">
            {/* Student Premium Welcome Banner */}
            <div className="bg-gradient-to-br from-[#003B73] via-[#004b93] to-[#002a52] rounded-[48px] p-12 text-white relative overflow-hidden shadow-2xl shadow-blue-900/40 group">
                {/* Decorative mesh-glass layers */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl group-hover:bg-white/15 transition-all duration-1000"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-center gap-12">
                    <div className="flex flex-col md:flex-row items-center gap-10 text-center md:text-left">
                        <div className="relative">
                            <div className="w-36 h-36 bg-white rounded-[44px] border-[8px] border-white/10 shadow-3xl flex items-center justify-center text-6xl font-black text-[#003B73] transform hover:rotate-3 transition-transform duration-500">
                                {initials}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-emerald-500 rounded-2xl border-4 border-[#003B73] flex items-center justify-center shadow-lg animate-pulse">
                                <ShieldCheck size={20} className="text-white"/>
                            </div>
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/5 mb-4 backdrop-blur-sm">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                                <p className="text-blue-100 font-extrabold uppercase tracking-[0.25em] text-[10px]">Academic Workspace v2.0</p>
                            </div>
                            <h2 className="text-5xl font-black tracking-tight mb-4 leading-tight">Welcome Back,<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">{name}!</span></h2>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                <span className="bg-white/10 px-5 py-2.5 rounded-2xl border border-white/10 font-black text-sm backdrop-blur-xl flex items-center gap-3 hover:bg-white/15 transition-all cursor-default shadow-lg shadow-black/10"><Star size={18} fill="white" className="text-yellow-400"/> {data?.profile?.rollNo}</span>
                                <span className="bg-white/10 px-5 py-2.5 rounded-2xl border border-white/10 font-black text-sm backdrop-blur-xl flex items-center gap-3 hover:bg-white/15 transition-all cursor-default shadow-lg shadow-black/10">{data?.profile?.department || 'COMPUTER SCIENCE'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 w-full xl:w-auto">
                         <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-2xl hover:bg-white/10 transition-all text-center group/stat">
                            <p className="text-[11px] font-black text-blue-200 uppercase tracking-widest mb-3 opacity-60">Avg. Attendance</p>
                            <h3 className="text-5xl font-black group-hover:scale-110 transition-transform"><AnimatedValue value={data?.stats?.attendancePercentage || 0} />%</h3>
                         </div>
                         <div className="bg-white/10 p-8 rounded-[40px] border border-white/20 backdrop-blur-2xl hover:bg-white/15 transition-all text-center group/stat">
                            <p className="text-[11px] font-black text-blue-200 uppercase tracking-widest mb-3 opacity-60">Cumulative GPA</p>
                            <h3 className="text-5xl font-black group-hover:scale-110 transition-transform"><AnimatedValue value={data?.stats?.cgpa || '0.00'} /></h3>
                         </div>
                    </div>
                </div>
            </div>

            {/* Quick Action Dock */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'View Results', icon: Award, color: 'blue', link: '/student/results' },
                    { label: 'Attendance', icon: Activity, color: 'emerald', link: '/student/attendance' },
                    { label: 'Materials', icon: BookOpen, color: 'orange', link: '/student/materials' },
                    { label: 'Profile', icon: User, color: 'indigo', link: '/student/profile' },
                ].map((action, i) => (
                    <Link key={i} to={action.link} className="group relative bg-white p-6 rounded-[32px] shadow-lg shadow-gray-200/50 border border-gray-100 flex items-center gap-5 hover:border-[#003B73] hover:translate-y-[-4px] transition-all duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform"></div>
                        <div className={`w-14 h-14 bg-${action.color}-50 text-${action.color}-600 rounded-2xl flex items-center justify-center group-hover:bg-[#003B73] group-hover:text-white transition-all shadow-inner`}><action.icon size={24} strokeWidth={2.5}/></div>
                        <div className="relative z-10">
                            <p className="text-sm font-black text-gray-800 tracking-tight">{action.label}</p>
                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1 group-hover:text-[#003B73]">Navigate <ArrowRight size={10}/></span>
                        </div>
                    </Link>
                ))}
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
                                    <h4 className={`text-4xl font-black ${data?.stats?.arrearsCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}><AnimatedValue value={data?.stats?.arrearsCount || 0} /></h4>
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

                {/* GPA Trend Card */}
                <div className="lg:col-span-2 space-y-8">
                     <div className="bg-white rounded-[44px] p-10 shadow-2xl shadow-gray-200/50 border border-gray-100 group relative">
                        <div className="absolute top-10 right-10">
                            <button onClick={() => fetchData()} className="p-3 bg-gray-50 rounded-2xl text-[#003B73] hover:bg-[#003B73] hover:text-white transition-all active:rotate-180 duration-500 shadow-inner"><RefreshCw size={18}/></button>
                        </div>
                        <div className="flex justify-between items-center mb-10">
                             <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[20px] shadow-inner flex items-center justify-center group-hover:scale-110 transition-transform"><Activity size={26} strokeWidth={2.5}/></div>
                                <div>
                                    <h3 className="text-2xl font-black text-[#003B73]">Academic Progression</h3>
                                    <p className="text-sm font-bold text-gray-400">Track your GPA trend across semesters</p>
                                </div>
                             </div>
                        </div>
                        <div className="h-[280px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data?.recentResults ? [...data.recentResults].reverse() : []}>
                                    <defs>
                                        <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#003B73" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#003B73" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey="semester" 
                                        tickFormatter={(val) => `SEM ${val}`} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontWeight: 800, fontSize: 10}}
                                        dy={10}
                                    />
                                    <YAxis 
                                        domain={[0, 10]} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontWeight: 800, fontSize: 10}}
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 900 }}
                                        cursor={{ stroke: '#003B73', strokeWidth: 2, strokeDasharray: '5 5' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="gpa" 
                                        stroke="#003B73" 
                                        strokeWidth={4} 
                                        fillOpacity={1} 
                                        fill="url(#colorGpa)" 
                                        animationDuration={2000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                     </div>

                     <div className="bg-white rounded-[44px] p-10 shadow-2xl shadow-gray-200/50 border border-gray-100">
                        <h3 className="text-2xl font-black text-[#003B73] mb-10 flex items-center gap-5">
                            <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-[20px] shadow-inner flex items-center justify-center"><BookOpen size={26} strokeWidth={2.5}/></div>
                            <div>
                                Recent Marks Entry
                                <p className="text-sm font-bold text-gray-400">Your latest CIA assessment scores</p>
                            </div>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {data?.recentMarks?.map(m => (
                                <div key={m.id} className="p-8 bg-gray-50/50 rounded-[32px] border border-gray-100 hover:border-[#003B73] hover:bg-white transition-all group shadow-sm hover:shadow-xl">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{m.subject.code}</p>
                                            </div>
                                            <p className="text-lg font-black text-gray-800 line-clamp-2 leading-tight">{m.subject.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-3xl font-black text-[#003B73] leading-none mb-1">{m.internal || '0'}</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">CIA / 25</p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner border border-gray-50">
                                        <div className="bg-gradient-to-r from-[#003B73] to-blue-400 h-full transition-all duration-2000 ease-out shadow-[0_0_10px_rgba(0,59,115,0.3)]" style={{ width: `${(m.internal / 25) * 100}%` }}></div>
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
