import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../../../context/AuthProvider';
import { 
    ChevronLeft, Edit3, Mail, Phone, MapPin, 
    Calendar, User, Droplets, Briefcase, 
    BookOpen, Clock, ClipboardCheck, GraduationCap,
    Shield, Award, Hash
} from 'lucide-react';
import { getFacultyById } from '../../../services/faculty.service';
import { handleApiError } from '../../../utils/errorHandler';
import { getPhotoUrl } from '../../../utils/helpers';

const FacultyProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { auth } = useContext(AuthContext);
    const isAdmin = auth?.role === 'ADMIN';
    const [faculty, setFaculty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('personal');
    const [timetable, setTimetable] = useState(null);
    const [fetchingTimetable, setFetchingTimetable] = useState(false);
    const [attendanceReport, setAttendanceReport] = useState(null);
    const [fetchingAttendance, setFetchingAttendance] = useState(false);

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

    useEffect(() => {
        if (activeTab === 'timetable' && !timetable) {
            fetchTimetable();
        }
        if (activeTab === 'attendance' && !attendanceReport) {
            fetchAttendance();
        }
    }, [activeTab]);

    const fetchTimetable = async () => {
        try {
            setFetchingTimetable(true);
            const { getAdminTimetable } = await import('../../../services/timetable.service');
            const res = await getAdminTimetable({ facultyId: id });
            setTimetable(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setFetchingTimetable(false);
        }
    };

    const fetchAttendance = async () => {
        try {
            setFetchingAttendance(true);
            const { getAdminAttendanceReport } = await import('../../../services/attendance.service');
            const res = await getAdminAttendanceReport({ facultyId: id, role: 'faculty' });
            setAttendanceReport(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setFetchingAttendance(false);
        }
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
                                    src={getPhotoUrl(faculty.photo, 'faculty')} 
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
                            {isAdmin && (
                                <button className="px-10 py-5 bg-white text-[#003B73] rounded-[28px] font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl hover:translate-y-[-2px] flex items-center gap-3">
                                    <Edit3 size={16} /> Update Bio
                                </button>
                            )}
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
                    <div className="bg-white rounded-[60px] border border-gray-100 shadow-2xl overflow-hidden animate-fadeIn">
                        <div className="p-12 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-3xl font-black text-[#003B73] tracking-tighter uppercase">Faculty Matrix Grid</h3>
                                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Institutional Time Allocation</p>
                            </div>
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#003B73]">
                                <Clock size={24} />
                            </div>
                        </div>
                        <div className="p-8">
                            {fetchingTimetable ? (
                                <div className="py-20 text-center">
                                    <div className="w-10 h-10 border-4 border-[#003B73] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-400 uppercase font-black text-[10px] tracking-widest">Decoding schedule...</p>
                                </div>
                            ) : timetable ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr>
                                                <th className="p-4 bg-gray-50 border border-gray-100 font-black text-[10px] text-gray-400 uppercase tracking-widest">Day / Period</th>
                                                {[1, 2, 3, 4, 5, 6].map(p => (
                                                    <th key={p} className="p-4 bg-gray-50 border border-gray-100 font-black text-[10px] text-gray-400 uppercase tracking-widest">P{p}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[1, 2, 3, 4, 5, 6].map(dayId => {
                                                const dayName = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dayId - 1];
                                                return (
                                                    <tr key={dayId}>
                                                        <td className="p-4 bg-gray-50 border border-gray-100 font-black text-[10px] text-[#003B73] text-center">{dayName}</td>
                                                        {[1, 2, 3, 4, 5, 6].map(period => {
                                                            const entry = timetable.find(t => t.day === dayId && t.period === period);
                                                            return (
                                                                <td key={period} className="p-4 border border-gray-100 text-center group hover:bg-blue-50/50 transition-colors">
                                                                    {entry ? (
                                                                        <div>
                                                                            <p className="font-black text-[#003B73] text-[11px] leading-tight uppercase">{entry.subject.name}</p>
                                                                            <p className="font-bold text-blue-500 text-[9px] mt-1">SEC {entry.section}</p>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-gray-200 font-black text-xs">--</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-20 text-center opacity-30">
                                    <Clock size={64} className="mx-auto mb-4" />
                                    <p className="font-black text-xl uppercase tracking-tighter">No Schedule Recorded</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="bg-white rounded-[60px] border border-gray-100 shadow-2xl overflow-hidden animate-fadeIn">
                        <div className="p-12 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-3xl font-black text-[#003B73] tracking-tighter uppercase">Traceability Metrics</h3>
                                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Operational Performance Analysis</p>
                            </div>
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600">
                                <ClipboardCheck size={24} />
                            </div>
                        </div>
                        <div className="p-8">
                            {fetchingAttendance ? (
                                <div className="py-20 text-center">
                                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-400 uppercase font-black text-[10px] tracking-widest">Auditing logs...</p>
                                </div>
                            ) : attendanceReport?.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50/50">
                                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                <th className="px-8 py-6 text-left">Academic Unit</th>
                                                <th className="px-8 py-6 text-center">Scheduled</th>
                                                <th className="px-8 py-6 text-center">Submitted</th>
                                                <th className="px-8 py-6 text-right">Coverage %</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {attendanceReport.map((m, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <p className="font-black text-[#003B73] text-sm uppercase">{m.subject.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[9px] font-mono text-gray-400 font-black">{m.subject.code}</span>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Section {m.section}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center font-bold text-slate-500">{m.total}</td>
                                                    <td className="px-8 py-6 text-center font-black text-[#003B73]">{m.present + m.absent}</td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-[#003B73]" 
                                                                    style={{ width: `${(Math.min(100, (m.present + m.absent) / m.total * 100)) || 0}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="font-black text-[#003B73] text-sm">{((m.present + m.absent) / m.total * 100).toFixed(1)}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-20 text-center opacity-30">
                                    <ClipboardCheck size={64} className="mx-auto mb-4" />
                                    <p className="font-black text-xl uppercase tracking-tighter">Attendance tracking for faculty coming soon</p>
                                </div>
                            )}
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
