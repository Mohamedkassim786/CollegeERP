import React, { useState, useEffect } from 'react';
import { 
    Users, AlertCircle, TrendingUp, 
    BarChart3, Activity, Award, Building2, UserCheck, Shield
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
            const response = await api.get('/dashboard/principal');
            setStats(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="h-[80vh] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-[#003B73] border-t-transparent rounded-full animate-spin mb-4 shadow-lg"></div>
            <p className="text-[#003B73] font-black tracking-[0.2em] uppercase text-xs animate-pulse">Initializing Executive Overview...</p>
        </div>
    );

    const overall = stats?.overallStats || {};
    const depts = stats?.deptStats || [];
    
    const totalStudents = overall.totalStudents || 0;
    const totalFaculty = overall.totalFaculty || 0;
    const totalDepts = overall.totalDepartments || 0;
    const totalArrears = overall.totalArrears || 0;
    
    let avgPassRate = 0;
    if (depts.length > 0) {
        avgPassRate = (depts.reduce((acc, curr) => acc + parseFloat(curr.passPercentage), 0) / depts.length).toFixed(1);
    }

    return (
        <div className="space-y-10 animate-fadeIn min-h-screen pb-20">
            {/* HERO EXECUTIVE BANNER */}
            <div className="relative overflow-hidden bg-[#0A192F] rounded-[50px] shadow-[0_40px_80px_rgba(0,59,115,0.2)] p-12 lg:p-16 border border-blue-900/40">
                {/* Decorative Gradients */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] -ml-32 -mb-32"></div>
                
                {/* Content */}
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                    <div className="space-y-4 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <span className="px-4 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-blue-500/30 backdrop-blur-md flex items-center gap-2">
                                <Shield size={12} /> Executive Control Center
                            </span>
                            <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-emerald-500/30 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div> Live System
                            </span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[1.1] drop-shadow-2xl">
                            Institutional <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                                Overview & Efficacy
                            </span>
                        </h1>
                        <p className="text-blue-200/80 font-medium text-lg max-w-xl">
                            Real-time intelligence and holistic monitoring of academic operations, faculty allocation, and student performance metrics across the entire college ERP network.
                        </p>
                    </div>

                    {/* Overall Score */}
                    <div className="shrink-0 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[40px] flex flex-col items-center justify-center shadow-2xl">
                        <div className="text-center space-y-2">
                            <p className="text-blue-200 font-black uppercase tracking-[0.2em] text-[10px]">Avg Pass Rate</p>
                            <h2 className="text-6xl font-black text-white">{avgPassRate}<span className="text-3xl text-blue-400">%</span></h2>
                            <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-4 py-2 rounded-2xl">
                                <TrendingUp size={14} /> Global Excellence
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KEY METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: "Total Enrolment", value: totalStudents, icon: Users, color: "from-blue-500 to-blue-700", bg: "bg-blue-50", text: "text-blue-600", desc: "Active Students" },
                    { title: "Faculty Network", value: totalFaculty, icon: UserCheck, color: "from-emerald-500 to-emerald-700", bg: "bg-emerald-50", text: "text-emerald-600", desc: "Assigned Staff" },
                    { title: "Academic Units", value: totalDepts, icon: Building2, color: "from-purple-500 to-purple-700", bg: "bg-purple-50", text: "text-purple-600", desc: "Departments" },
                    { title: "Ongoing Arrears", value: totalArrears, icon: AlertCircle, color: "from-red-500 to-rose-700", bg: "bg-red-50", text: "text-red-500", desc: "Needs Attention" }
                ].map((kpi, idx) => (
                    <div key={idx} className="group relative bg-white p-8 rounded-[40px] shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_45px_100px_rgba(0,59,115,0.12)] hover:-translate-y-2 transition-all duration-500 overflow-hidden cursor-pointer">
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${kpi.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                        <div className="flex justify-between items-start mb-6">
                            <div className={`w-14 h-14 ${kpi.bg} ${kpi.text} rounded-3xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                                <kpi.icon size={26} strokeWidth={2.5}/>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-2xl text-gray-400 group-hover:bg-[#003B73] group-hover:text-white transition-colors">
                                <Activity size={18} />
                            </div>
                        </div>
                        <h3 className="text-4xl font-black text-[#003B73] mb-1 tracking-tighter">{kpi.value.toLocaleString()}</h3>
                        <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{kpi.title}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-2">{kpi.desc}</p>
                    </div>
                ))}
            </div>

            {/* DEPARTMENTAL EFFICACY SECTION */}
            <div className="bg-white rounded-[50px] p-10 lg:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h3 className="text-3xl font-black text-[#003B73] flex items-center gap-4 tracking-tighter">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-[20px] flex items-center justify-center shadow-inner"><BarChart3 size={24}/></div>
                            Departmental Efficacy Index
                        </h3>
                        <p className="text-gray-400 font-bold text-sm mt-3 lg:ml-16 uppercase tracking-widest">Comparative Academic Performance across Units</p>
                    </div>
                    <button className="px-8 py-4 bg-gray-50 text-gray-500 font-black text-[10px] uppercase tracking-widest rounded-3xl hover:bg-gray-100 transition-colors border border-gray-200">
                        Detailed Reports
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {depts.map((dept, idx) => {
                        const passRate = parseFloat(dept.passPercentage);
                        const isHigh = passRate >= 80;
                        const isMedium = passRate >= 50 && passRate < 80;
                        const isLow = passRate < 50;

                        let colorClass = 'from-blue-600 to-indigo-600';
                        let textClass = 'text-blue-600';
                        let bgClass = 'bg-blue-50';
                        
                        if (isHigh) { colorClass = 'from-emerald-500 to-emerald-600'; textClass = 'text-emerald-600'; bgClass = 'bg-emerald-50'; }
                        else if (isMedium) { colorClass = 'from-amber-400 to-amber-500'; textClass = 'text-amber-500'; bgClass = 'bg-amber-50'; }
                        else if (isLow && passRate > 0) { colorClass = 'from-red-500 to-red-600'; textClass = 'text-red-500'; bgClass = 'bg-red-50'; }
                        else if (passRate === 0) { colorClass = 'from-slate-400 to-slate-500'; textClass = 'text-slate-500'; bgClass = 'bg-slate-50'; }

                        return (
                            <div key={idx} className="group relative bg-[#F8FAFF] p-8 rounded-[40px] border border-blue-100/50 hover:bg-white hover:border-[#003B73]/20 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                                
                                {/* Background Accent */}
                                <div className={`absolute -right-16 -top-16 w-40 h-40 ${bgClass} rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>

                                <div className="relative z-10 flex justify-between items-start mb-10">
                                    <div>
                                        <h4 className="text-3xl font-black text-[#003B73] uppercase tracking-tight mb-2 group-hover:text-blue-700 transition-colors">{dept.code}</h4>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-snug max-w-[150px]">{dept.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-3xl font-black tracking-tighter ${textClass}`}>{dept.passPercentage}%</p>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">SUCCESS RATE</p>
                                    </div>
                                </div>

                                <div className="relative z-10 space-y-3">
                                    <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-gray-500">{dept.studentCount} enrolments</span>
                                        <span className={textClass}>{isHigh ? 'EXCELLENT' : isMedium ? 'FAIR' : passRate === 0 ? 'PENDING' : 'NEEDS FOCUS'}</span>
                                    </div>
                                    <div className="w-full bg-slate-200/50 h-3 rounded-full overflow-hidden shadow-inner">
                                        <div 
                                            className={`h-full bg-gradient-to-r ${colorClass} rounded-full relative group-hover:shadow-[0_0_15px_rgba(0,0,0,0.2)] transition-all duration-1000`} 
                                            style={{ width: `${passRate}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

        </div>
    );
};

export default PrincipalDashboard;
