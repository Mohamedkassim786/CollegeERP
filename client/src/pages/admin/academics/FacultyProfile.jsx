import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, Edit3, Mail, Phone, MapPin, 
    Calendar, User, Droplets, Briefcase, 
    BookOpen, Clock, ClipboardCheck, GraduationCap,
    Shield, Award, Hash
} from 'lucide-react';
import { getFacultyById } from '../../../services/faculty.service';
import { handleApiError } from '../../../utils/errorHandler';

const FacultyProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [faculty, setFaculty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('personal');

    useEffect(() => {
        const fetchFaculty = async () => {
            try {
                setLoading(true);
                const response = await getFacultyById(id);
                setFaculty(response.data);
            } catch (error) {
                handleApiError(error, "Failed to fetch faculty profile");
            } finally {
                setLoading(false);
            }
        };
        fetchFaculty();
    }, [id]);

    const getPhotoUrl = (photo) => {
        if (!photo) return null;
        if (photo.startsWith('http')) return photo;
        const hostname = window.location.hostname;
        return `http://${hostname}:3000/uploads/faculty/${photo}`;
    };

    if (loading) return (
        <div className="h-96 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#003B73] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!faculty) return <div className="p-8 text-center font-bold text-gray-500 underline decoration-red-500">FACULTY ENTITY NOT FOUND</div>;

    const tabs = [
        { id: 'personal', label: 'Persona', icon: User },
        { id: 'subjects', label: 'Academic Load', icon: BookOpen },
        { id: 'timetable', label: 'Schedule', icon: Clock },
        { id: 'attendance', label: 'Track Record', icon: ClipboardCheck },
    ];

    return (
        <div className="max-w-[1400px] mx-auto space-y-12 animate-fadeIn pb-32 pt-4">
            {/* HERO SECTION */}
            <div className="relative group p-1 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] rounded-[60px] shadow-[0_50px_100px_rgba(0,0,0,0.1)] overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[100px] -ml-32 -mb-32"></div>

                <div className="relative bg-[#0F172A]/80 backdrop-blur-2xl p-12 lg:p-16 rounded-[58px] flex flex-col md:flex-row items-center gap-12 lg:gap-20">
                    {/* Back Toggle */}
                    <button 
                        onClick={() => navigate(-1)}
                        className="absolute top-10 left-10 p-4 bg-white/5 hover:bg-white/10 text-white rounded-[24px] border border-white/10 transition-all hover:scale-110 shadow-2xl"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    {/* Photo Evolution */}
                    <div className="relative shrink-0">
                        <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-[70px] overflow-hidden border-[8px] border-white/10 shadow-2xl transform rotate-2 group-hover:rotate-0 transition-all duration-700 ring-4 ring-blue-500/20">
                            {faculty.photo ? (
                                <img 
                                    src={getPhotoUrl(faculty.photo)} 
                                    alt={faculty.fullName}
                                    className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000"
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center font-black text-white text-7xl">
                                    {faculty.fullName?.charAt(0)}
                                </div>
                            )}
                        </div>
                        {faculty.role === 'HOD' && (
                            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-amber-400 rounded-[30px] flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                                <Award className="text-[#0F172A]" size={32} />
                            </div>
                        )}
                    </div>

                    {/* Meta Info */}
                    <div className="flex-1 text-center md:text-left space-y-6">
                        <div className="space-y-2">
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
                                <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none drop-shadow-2xl">
                                    {faculty.fullName}
                                </h1>
                                <span className="px-6 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md">
                                    {faculty.designation}
                                </span>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-6 pt-2">
                                <div className="flex items-center gap-3 text-slate-400 font-bold tracking-wide">
                                    <Shield size={18} className="text-amber-500" />
                                    <span className="text-lg uppercase">{faculty.department}</span>
                                </div>
                                <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-2xl font-mono text-xs text-blue-300">
                                    UID: {faculty.staffId}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <button className="px-10 py-5 bg-white text-[#0F172A] rounded-[28px] font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl hover:translate-y-[-2px] flex items-center gap-3">
                                <Edit3 size={16} /> Update Bio
                            </button>
                            <button className="p-5 bg-white/5 text-white rounded-[28px] border border-white/10 hover:bg-blue-600 transition-all shadow-xl">
                                <Mail size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* INTERACTIVE NAVIGATION */}
            <div className="flex justify-center">
                <div className="bg-white/50 backdrop-blur-xl p-2 rounded-[32px] border border-white/20 shadow-2xl flex flex-wrap gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-8 py-4 rounded-[24px] flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                                activeTab === tab.id 
                                ? 'bg-[#003B73] text-white shadow-[0_15px_30px_rgba(0,59,115,0.2)]' 
                                : 'text-slate-400 hover:text-[#003B73] hover:bg-white'
                            }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* TAB CONTENT ARCHITECTURE */}
            <div className="animate-fadeInUp">
                {activeTab === 'personal' && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                        {/* Essential Metrics */}
                        <div className="bg-white p-10 rounded-[50px] border border-gray-100 shadow-[0_15px_60px_rgba(0,0,0,0.03)] space-y-10">
                            <h3 className="text-xl font-black text-[#003B73] flex items-center gap-3">
                                <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                                Contact Nexus
                            </h3>
                            <div className="space-y-8">
                                <ModernInfoItem icon={Mail} label="Professional Email" value={faculty.email} color="text-indigo-500" />
                                <ModernInfoItem icon={Phone} label="Direct Line" value={faculty.phone} color="text-emerald-500" />
                                <ModernInfoItem icon={MapPin} label="Office/Address" value={faculty.address} color="text-rose-500" />
                            </div>
                        </div>

                        <div className="bg-white p-10 rounded-[50px] border border-gray-100 shadow-[0_15px_60px_rgba(0,0,0,0.03)] space-y-10">
                            <h3 className="text-xl font-black text-[#003B73] flex items-center gap-3">
                                <div className="w-2 h-8 bg-purple-500 rounded-full"></div>
                                Identity Profile
                            </h3>
                            <div className="space-y-8">
                                <ModernInfoItem icon={Calendar} label="Commemorative Birth" value={faculty.dateOfBirth} color="text-purple-500" />
                                <ModernInfoItem icon={User} label="Gender Identity" value={faculty.gender} color="text-blue-500" />
                                <ModernInfoItem icon={Droplets} label="Vital Blood Group" value={faculty.bloodGroup} color="text-red-500" />
                            </div>
                        </div>

                        <div className="bg-white p-10 rounded-[50px] border border-gray-100 shadow-[0_15px_60px_rgba(0,0,0,0.03)] space-y-10">
                            <h3 className="text-xl font-black text-[#003B73] flex items-center gap-3">
                                <div className="w-2 h-8 bg-amber-500 rounded-full"></div>
                                Academic Credentials
                            </h3>
                            <div className="space-y-8">
                                <ModernInfoItem icon={Hash} label="Institutional ID" value={faculty.staffId} color="text-slate-500" />
                                <ModernInfoItem icon={GraduationCap} label="Highest Qualification" value={faculty.qualification} color="text-[#003B73]" />
                                <ModernInfoItem icon={Award} label="Core Competency" value={faculty.designation} color="text-amber-600" />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'subjects' && (
                    <div className="group bg-white rounded-[60px] border border-gray-100 shadow-2xl overflow-hidden">
                        <div className="p-12 lg:p-16 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
                            <div>
                                <h2 className="text-3xl font-black text-[#003B73] tracking-tighter">Current Course Load</h2>
                                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Semester Cycle: Spring 2026</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="px-8 py-4 bg-blue-50 text-[#003B73] rounded-3xl font-black text-[10px] uppercase tracking-widest border border-blue-100">
                                    {faculty.assignments?.length || 0} Modules
                                </div>
                            </div>
                        </div>
                        <div className="p-4 lg:p-8">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                        <th className="px-10 py-8">Identity</th>
                                        <th className="px-10 py-8">Course Specification</th>
                                        <th className="px-10 py-8 text-center">Batch Period</th>
                                        <th className="px-10 py-8 text-center">Execution Site</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {faculty.assignments?.length > 0 ? (
                                        faculty.assignments.map((assignment, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/80 transition-all duration-300 group/row">
                                                <td className="px-10 py-8">
                                                    <span className="font-mono text-sm font-black text-slate-300 group-hover/row:text-blue-600 transition-colors">
                                                        #{assignment.subject?.code}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div>
                                                        <h4 className="font-black text-[#003B73] text-lg leading-tight">{assignment.subject?.name}</h4>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Core Requirement</p>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    <span className="px-5 py-2 bg-slate-100 rounded-2xl font-black text-xs text-slate-500">
                                                        Sem {assignment.subject?.semester}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    <span className="px-6 py-3 bg-[#003B73] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/10">
                                                        Sec {assignment.section}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="p-32 text-center">
                                                <div className="space-y-4 opacity-20">
                                                    <BookOpen size={64} className="mx-auto" />
                                                    <p className="font-black text-2xl uppercase tracking-tighter">No Active Assignments</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'timetable' && (
                    <div className="bg-white p-32 rounded-[60px] border border-gray-100 shadow-2xl text-center space-y-6">
                        <div className="w-24 h-24 bg-blue-50 rounded-[40px] flex items-center justify-center mx-auto mb-10 shadow-inner">
                            <Clock size={48} className="text-blue-500" />
                        </div>
                        <h3 className="text-4xl font-black text-[#003B73] tracking-tighter">Matrix Grid</h3>
                        <p className="text-gray-400 font-bold max-w-md mx-auto leading-relaxed">The multidimensional schedule grid is currently being synchronized with institutional resources.</p>
                        <button className="px-10 py-4 bg-gray-50 text-[#003B73] rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all">Request Refresh</button>
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="bg-white p-32 rounded-[60px] border border-gray-100 shadow-2xl text-center space-y-6">
                        <div className="w-24 h-24 bg-emerald-50 rounded-[40px] flex items-center justify-center mx-auto mb-10 shadow-inner">
                            <ClipboardCheck size={48} className="text-emerald-500" />
                        </div>
                        <h3 className="text-4xl font-black text-[#003B73] tracking-tighter">Traceability Analytics</h3>
                        <p className="text-gray-400 font-bold max-w-md mx-auto leading-relaxed">Presence data for the current cycle is undergoing final institutional audit.</p>
                        <div className="flex justify-center gap-4 pt-6">
                            {[85, 92, 78].map((n, i) => (
                                <div key={i} className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#003B73]" style={{ width: `${n}%` }}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ModernInfoItem = ({ icon: Icon, label, value, color }) => (
    <div className="flex items-start gap-6 group/info">
        <div className={`mt-1 w-14 h-14 rounded-2xl bg-gray-50 ${color} flex items-center justify-center border border-gray-100 shadow-inner transition-all group-hover/info:scale-110 group-hover/info:rotate-3`}>
            <Icon size={24} />
        </div>
        <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1">{label}</p>
            <p className="text-lg font-black text-slate-700 tracking-tight leading-tight">{value || 'N/A'}</p>
        </div>
    </div>
);

export default FacultyProfile;
