import React, { useState, useEffect } from "react";
import { 
    Users, Building2, UserPlus, Upload, ChevronLeft, 
    MoreVertical, Edit3, Trash2, Eye, Shield, 
    CalendarX, RefreshCw, X, AlertCircle, Phone, 
    CheckCircle, Info, Download, FileText, GraduationCap,
    Mail, MapPin
} from "lucide-react";
import { 
    getFaculty, 
    createFaculty, 
    updateFaculty,
    deleteFaculty, 
    getFacultyAbsences, 
    markFacultyAbsent, 
    removeFacultyAbsence, 
    getSubstitutions, 
    assignSubstitution, 
    deleteSubstitution, 
    getTimetable,
    bulkUploadFaculty
} from "../../../services/faculty.service";
import { getDepartments } from "../../../services/department.service";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const FacultyManager = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('depts'); // 'depts' | 'stafflist'
    const [selectedDept, setSelectedDept] = useState(null);
    const [facultyList, setFacultyList] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [staffCountMap, setStaffCountMap] = useState({});

    // Modals
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [modalRole, setModalRole] = useState('FACULTY');
    const [editingStaff, setEditingStaff] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    
    // Absence State
    const [viewDate, setViewDate] = useState(() => {
        return sessionStorage.getItem("adminViewDate") || new Date().toISOString().split("T")[0];
    });
    const [absentFacultyIds, setAbsentFacultyIds] = useState([]);
    const [showAbsenceModal, setShowAbsenceModal] = useState(false);
    const [selectedStaffForAbsence, setSelectedStaffForAbsence] = useState(null);
    const [facultySchedule, setFacultySchedule] = useState([]);
    const [substituteSelection, setSubstituteSelection] = useState({});

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        sessionStorage.setItem("adminViewDate", viewDate);
        fetchAbsences();
    }, [viewDate]);

    const fetchAbsences = async () => {
        try {
            const res = await getFacultyAbsences({ date: viewDate });
            setAbsentFacultyIds(res.data.map((a) => a.facultyId));
        } catch (err) {
            console.error("Failed to fetch absences", err);
        }
    };

    const fetchDailySchedule = async (staffId, date) => {
        try {
            const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            const [y, m, d] = date.split("-").map(Number);
            const localDate = new Date(y, m - 1, d);
            const dayName = days[localDate.getDay()];

            const [timetableRes, subsRes] = await Promise.all([
                getTimetable({ facultyId: staffId, day: dayName }),
                getSubstitutions({ date, originalFacultyId: staffId }),
            ]);

            const schedule = timetableRes.data.map((slot) => {
                const sub = subsRes.data.find((s) => s.timetableId === slot.id);
                return { ...slot, substitution: sub || null };
            });
            setFacultySchedule(schedule);
        } catch (err) {
            console.error("Failed to fetch schedule", err);
        }
    };

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [fRes, dRes] = await Promise.all([
                getFaculty(),
                getDepartments()
            ]);
            setFacultyList(fRes.data);
            setDepartments(dRes.data);
            
            // Calculate staff counts per department
            const counts = {};
            fRes.data.forEach(f => {
                const dId = f.departmentId;
                if (dId) counts[dId] = (counts[dId] || 0) + 1;
            });
            setStaffCountMap(counts);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleBackToDepts = () => {
        setView('depts');
        setSelectedDept(null);
    };

    const handleViewStaff = (dept) => {
        setSelectedDept(dept);
        setView('stafflist');
    };

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

    return (
        <div className="space-y-8 animate-fadeIn">
            {view === 'depts' ? (
                <DepartmentView 
                    departments={departments} 
                    staffCountMap={staffCountMap}
                    onViewStaff={handleViewStaff}
                    onAddFaculty={() => { setModalRole('FACULTY'); setEditingStaff(null); setShowStaffModal(true); }}
                    onAddHOD={() => { setModalRole('HOD'); setEditingStaff(null); setShowStaffModal(true); }}
                    onBulkUpload={() => setShowBulkModal(true)}
                />
            ) : (
                <StaffListView 
                    dept={selectedDept}
                    viewDate={viewDate}
                    setViewDate={setViewDate}
                    absentFacultyIds={absentFacultyIds}
                    onBack={handleBackToDepts}
                    facultyList={facultyList.filter(f => f.departmentId === selectedDept.id)}
                    onAddFaculty={() => { setModalRole('FACULTY'); setEditingStaff(null); setShowStaffModal(true); }}
                    onAddHOD={() => { setModalRole('HOD'); setEditingStaff(null); setShowStaffModal(true); }}
                    onEdit={(staff) => { setEditingStaff(staff); setModalRole(staff.role); setShowStaffModal(true); }}
                    onDelete={async (id) => {
                        if (confirm("Deactivate this staff member?")) {
                            await deleteFaculty(id);
                            toast.success("Staff deactivated");
                            fetchInitialData();
                        }
                    }}
                    onViewProfile={(id) => navigate(`/admin/faculty/${id}`)}
                    onManageAbsence={(staff) => {
                        setSelectedStaffForAbsence(staff);
                        fetchDailySchedule(staff.id, viewDate);
                        setShowAbsenceModal(true);
                    }}
                />
            )}

            {/* Modals */}
            {showStaffModal && (
                <StaffModal 
                    role={modalRole}
                    editingStaff={editingStaff}
                    departments={departments}
                    onClose={() => setShowStaffModal(false)}
                    onSuccess={() => { setShowStaffModal(false); fetchInitialData(); }}
                />
            )}

            {showBulkModal && (
                <BulkUploadModal 
                    onClose={() => setShowBulkModal(false)}
                    onSuccess={() => { setShowBulkModal(false); fetchInitialData(); }}
                />
            )}

            {showAbsenceModal && (
                <AbsenceControlModal 
                    staff={selectedStaffForAbsence}
                    date={viewDate}
                    schedule={facultySchedule}
                    facultyList={facultyList}
                    absentFacultyIds={absentFacultyIds}
                    subSelection={substituteSelection}
                    setSubSelection={setSubstituteSelection}
                    onClose={() => setShowAbsenceModal(false)}
                    onUpdate={() => {
                        fetchAbsences();
                        fetchDailySchedule(selectedStaffForAbsence.id, viewDate);
                    }}
                />
            )}
        </div>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VIEW 1: DEPARTMENT CARDS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DepartmentView = ({ departments, staffCountMap, onViewStaff, onAddFaculty, onAddHOD, onBulkUpload }) => (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <h1 className="text-4xl font-black text-[#003B73] tracking-tighter">Personnel Hub</h1>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.3em] mt-1">MIET Administrative Control</p>
            </div>
            <div className="flex flex-wrap gap-3">
                <button onClick={onBulkUpload} className="px-6 py-3.5 bg-gray-50 text-[#003B73] rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-gray-100 transition-all border border-gray-100 shadow-sm">
                    <Upload size={18} /> Bulk Load
                </button>
                <div className="flex gap-2 bg-[#003B73] p-1.5 rounded-[22px] shadow-xl shadow-blue-900/10">
                    <button onClick={onAddHOD} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-[18px] font-black text-[10px] uppercase tracking-widest transition-all">
                        + HOD
                    </button>
                    <button onClick={onAddFaculty} className="px-6 py-2.5 bg-white text-[#003B73] rounded-[18px] font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all">
                        + Faculty
                    </button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {departments.map((dept) => (
                <DepartmentCard 
                    key={dept.id}
                    dept={dept}
                    onViewStaff={onViewStaff}
                    staffCount={staffCountMap[dept.id]}
                />
            ))}
        </div>
    </div>
);

const DepartmentCard = ({ dept, onViewStaff, staffCount }) => {
    const initials = dept.name.split(" ").map(n => n[0]).join("").slice(0, 2);
    return (
        <div className="group relative bg-white rounded-[40px] p-8 border border-gray-50 shadow-[0_15px_50px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_rgba(0,59,115,0.12)] transition-all duration-500 overflow-hidden cursor-pointer" onClick={() => onViewStaff(dept)}>
            {/* Ghost Background Icon */}
            <div className="absolute -right-6 -bottom-6 text-9xl font-black text-gray-50/70 select-none group-hover:text-blue-50 transition-colors duration-500">{initials}</div>
            
            <div className="relative z-10 flex flex-col h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-[#003B73] to-blue-600 rounded-3xl flex items-center justify-center text-white mb-8 shadow-xl shadow-blue-900/20 transform rotate-3 group-hover:rotate-6 transition-transform">
                    <Building2 size={28} />
                </div>
                
                <div className="mb-auto">
                    <h3 className="text-2xl font-black text-[#003B73] mb-1 leading-tight tracking-tight group-hover:text-blue-700 transition-colors">{dept.name}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{dept.code}</p>
                </div>

                <div className="mt-8 flex items-center gap-4">
                    <div className="flex -space-x-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-blue-50 flex items-center justify-center ring-4 ring-blue-50/30">
                                <Users size={12} className="text-[#003B73]" />
                            </div>
                        ))}
                    </div>
                    <span className="text-[10px] font-black text-[#003B73] uppercase tracking-widest bg-blue-50/50 px-3 py-1.5 rounded-full border border-blue-50">
                        {staffCount || 0} Staff
                    </span>
                </div>
            </div>
        </div>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VIEW 2: STAFF LIST
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const StaffListView = ({ dept, viewDate, setViewDate, absentFacultyIds, onBack, facultyList, onAddFaculty, onAddHOD, onEdit, onDelete, onViewProfile, onManageAbsence }) => {
    const hod = facultyList.find(f => f.role === 'HOD');
    const faculty = facultyList.filter(f => f.role !== 'HOD');

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 bg-white text-[#003B73] rounded-2xl border border-gray-100 shadow-lg hover:bg-blue-50 transition-all">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-[#003B73] tracking-tight">{dept.name} — Staff</h1>
                        <p className="text-gray-500 font-bold text-sm tracking-widest uppercase mt-1">{facultyList.length} staff members</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-[32px] shadow-sm border border-gray-100">
                    <div className="w-10 h-10 bg-blue-50 text-[#003B73] rounded-2xl flex items-center justify-center">
                        <CalendarX size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Status Date</span>
                        <input type="date" value={viewDate} onChange={(e) => setViewDate(e.target.value)} className="text-lg font-black text-[#003B73] bg-transparent outline-none cursor-pointer" />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={onAddHOD} className="px-5 py-3 bg-purple-50 text-purple-700 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 border border-purple-100">
                        <Shield size={18} /> Add HOD
                    </button>
                    <button onClick={onAddFaculty} className="px-5 py-3 bg-[#003B73] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                        <UserPlus size={18} /> Add Faculty
                    </button>
                </div>
            </div>

            {/* HOD BANNER */}
            {hod && (
                <div className={`p-1 bg-gradient-to-br ${absentFacultyIds.includes(hod.id) ? 'from-red-400 to-red-600' : 'from-[#0F172A] via-[#1E293B] to-[#334155]'} rounded-[48px] shadow-2xl shadow-slate-900/40 transform hover:scale-[1.01] transition-transform duration-500`}>
                    <div className="bg-[#0F172A]/90 backdrop-blur-xl p-10 rounded-[46px] flex flex-col lg:flex-row items-center gap-10 relative overflow-hidden">
                        {/* Status Badge */}
                        <div className={`absolute top-0 right-0 px-10 py-4 font-black text-[10px] uppercase tracking-[0.3em] rounded-bl-[40px] text-white shadow-xl ${absentFacultyIds.includes(hod.id) ? 'bg-red-600' : 'bg-gradient-to-r from-amber-500 to-orange-600 animate-shimmer'}`}>
                            {absentFacultyIds.includes(hod.id) ? '● Absent' : '★ HOD Spotlight'}
                        </div>

                        {/* Photo Section */}
                        <div className="relative group/photo">
                            <div className={`w-48 h-48 rounded-[56px] overflow-hidden border-[6px] ${absentFacultyIds.includes(hod.id) ? 'border-red-500/30' : 'border-white/10'} shadow-2xl transition-all duration-700 group-hover/photo:rounded-[40px]`}>
                                {hod.photo ? (
                                    <img src={`http://${window.location.hostname}:3000/uploads/faculty/${hod.photo}`} className="w-full h-full object-cover scale-110 group-hover/photo:scale-100 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center font-black text-white text-6xl">
                                        {hod.fullName.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-black/50 transform group-hover/photo:rotate-12 transition-transform">
                                <Shield className="text-[#0F172A]" size={24} />
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="flex-1 text-center lg:text-left space-y-6">
                            <div>
                                <h3 className="text-4xl font-black text-white mb-2 tracking-tight drop-shadow-sm">{hod.fullName}</h3>
                                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4">
                                    <span className="px-5 py-2 bg-white/5 text-amber-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 backdrop-blur-md">
                                        {hod.designation || 'Head of Department'}
                                    </span>
                                    <span className="text-xs font-mono text-slate-400 font-bold bg-white/5 px-4 py-2 rounded-2xl border border-white/5 tracking-widest">#{hod.staffId}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                                {[
                                    { icon: GraduationCap, text: hod.qualification || 'Doctorate Candidate', color: 'text-blue-400' },
                                    { icon: Mail, text: hod.email || 'No email provided', color: 'text-emerald-400' },
                                    { icon: Phone, text: hod.phone || 'No phone provided', color: 'text-amber-400' },
                                    { icon: MapPin, text: hod.address || 'MIET HQ, Administrative Block', color: 'text-rose-400' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-center lg:justify-start gap-4 animate-fadeIn" style={{ animationDelay: `${idx * 0.1}s` }}>
                                        <div className={`w-10 h-10 rounded-2xl bg-white/5 ${item.color} flex items-center justify-center border border-white/5 shadow-inner`}>
                                            <item.icon size={18} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-300 tracking-wide uppercase">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-4 min-w-[200px]">
                            <button 
                                onClick={() => onViewProfile(hod.id)}
                                className="w-full px-8 py-5 bg-white text-[#0F172A] rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-400 transition-all duration-300 shadow-xl shadow-white/5"
                            >
                                Profile
                            </button>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => onManageAbsence(hod)}
                                    className={`flex-1 p-5 rounded-3xl transition-all duration-300 ${absentFacultyIds.includes(hod.id) ? 'bg-red-500 text-white' : 'bg-white/5 text-white hover:bg-red-500'}`}
                                >
                                    <CalendarX size={20} className="mx-auto" />
                                </button>
                                <button 
                                    onClick={() => onEdit(hod)}
                                    className="flex-1 p-5 bg-white/5 text-white rounded-3xl hover:bg-blue-600 transition-all duration-300"
                                >
                                    <Edit3 size={20} className="mx-auto" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FACULTY SECTION */}
            <div className="space-y-8">
                <div className="relative py-10">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t-[3px] border-slate-100"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-[#f8faff] px-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">
                            Department Faculty Ecosystem ({faculty.length})
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {faculty.map((f, idx) => (
                        <div 
                            key={f.id}
                            className={`group relative bg-white rounded-[40px] p-8 border-2 ${absentFacultyIds.includes(f.id) ? 'border-red-100 shadow-xl shadow-red-900/5' : 'border-gray-50/50 shadow-[0_15px_60px_rgba(0,0,0,0.02)]'} hover:shadow-[0_45px_100px_rgba(0,59,115,0.1)] transition-all duration-500 overflow-hidden animate-fadeInUp`}
                            style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                            {/* Role Ribbon */}
                            <div className={`absolute top-0 right-0 px-8 py-3 rounded-bl-3xl font-black text-[8px] uppercase tracking-widest ${absentFacultyIds.includes(f.id) ? 'bg-red-600 text-white' : 'bg-[#003B73] text-white opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                                {absentFacultyIds.includes(f.id) ? 'Absent' : 'Faculty Member'}
                            </div>

                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-10">
                                {/* Photo Container */}
                                <div className="relative">
                                    <div className={`w-36 h-36 rounded-[44px] overflow-hidden border-[6px] border-white shadow-2xl transition-all duration-700 group-hover:rounded-[30px] group-hover:rotate-2 ${absentFacultyIds.includes(f.id) ? 'grayscale border-red-50' : ''}`}>
                                        {f.photo ? (
                                            <img src={`http://${window.location.hostname}:3000/uploads/faculty/${f.photo}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full bg-blue-50 flex items-center justify-center font-black text-[#003B73] text-5xl">
                                                {f.fullName.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`absolute -bottom-2 -center w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl transform ${absentFacultyIds.includes(f.id) ? 'bg-red-500' : 'bg-[#003B73]'} border-2 border-white translate-x-[100%]`}>
                                        <GraduationCap size={20} />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 text-center sm:text-left pt-2">
                                    <h4 className={`text-3xl font-black mb-1 tracking-tighter ${absentFacultyIds.includes(f.id) ? 'text-red-900' : 'text-[#003B73]'}`}>
                                        {f.fullName}
                                    </h4>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 italic">
                                        {f.designation} · <span className="text-blue-600">#{f.staffId}</span>
                                    </p>

                                    <div className="flex flex-wrap justify-center sm:justify-start gap-5 mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-blue-50/50 text-[#003B73] flex items-center justify-center border border-blue-50 italic font-black text-[9px]">
                                                {f.qualification?.split(' ')[0] || 'Ph.D'}
                                            </div>
                                            <span className="text-[11px] font-bold text-gray-500 tracking-tight">{f.qualification?.split(',')[0]}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-orange-50/50 text-orange-600 flex items-center justify-center border border-orange-50">
                                                <Phone size={14} />
                                            </div>
                                            <span className="text-[11px] font-bold text-gray-500 tracking-tight">{f.phone}</span>
                                        </div>
                                    </div>

                                    {/* Glass Action Bar */}
                                    <div className="flex items-center justify-center sm:justify-start gap-4">
                                        <button 
                                            onClick={() => onViewProfile(f.id)}
                                            className="px-8 py-3.5 bg-[#003B73] text-white rounded-[20px] font-black text-[9px] uppercase tracking-[0.2em] hover:bg-[#002850] transition-all shadow-xl shadow-blue-900/10 hover:translate-y-[-2px]"
                                        >
                                            View Full Profile
                                        </button>
                                        <div className="flex items-center bg-gray-50/50 p-1 rounded-2xl border border-gray-100">
                                            <button onClick={() => onEdit(f)} className="p-3 text-gray-400 hover:text-[#003B73] hover:bg-white rounded-xl transition-all"><Edit3 size={18} /></button>
                                            <button onClick={() => onManageAbsence(f)} className="p-3 text-gray-400 hover:text-amber-600 hover:bg-white rounded-xl transition-all"><CalendarX size={18} /></button>
                                            <button onClick={() => onDelete(f.id)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-white rounded-xl transition-all"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {faculty.length === 0 && !hod && (
                        <div className="text-center py-20 bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200">
                            <Users size={64} className="mx-auto mb-4 text-gray-200" />
                            <h5 className="text-xl font-bold text-gray-400 italic">No staff members assigned yet</h5>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODAL: ADD / EDIT STAFF
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const StaffModal = ({ role, editingStaff, departments, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(editingStaff?.photo ? `http://${window.location.hostname}:3000/uploads/faculty/${editingStaff.photo}` : null);
    const [formData, setFormData] = useState({
        staffId: editingStaff?.staffId || '',
        fullName: editingStaff?.fullName || '',
        departmentId: editingStaff?.departmentId || '',
        role: role || editingStaff?.role || 'FACULTY',
        designation: editingStaff?.designation || '',
        qualification: editingStaff?.qualification || '',
        dateOfBirth: editingStaff?.dateOfBirth || '',
        gender: editingStaff?.gender || 'Male',
        bloodGroup: editingStaff?.bloodGroup || 'A+',
        phone: editingStaff?.phone || '',
        email: editingStaff?.email || '',
        address: editingStaff?.address || '',
    });
    const [photoFile, setPhotoFile] = useState(null);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const data = new FormData();
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            if (photoFile) data.append('photo', photoFile);

            // Set department name based on ID
            const dept = departments.find(d => d.id === parseInt(formData.departmentId));
            if (dept) data.append('department', dept.name);

            if (editingStaff) {
                await updateFaculty(editingStaff.id, data);
            } else {
                await createFaculty(data);
            }
            toast.success(`${formData.fullName} ${editingStaff ? 'updated' : 'registered'} successfully`);
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[48px] w-full max-w-4xl shadow-2xl animate-scaleIn my-8">
                <div className="p-10">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-3xl font-black text-[#003B73] tracking-tight">
                                {editingStaff ? 'Edit Staff Profile' : `Register New ${formData.role}`}
                            </h3>
                            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Personnel Information Control</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* PHOTO UPLOAD */}
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div 
                                onClick={() => document.getElementById('photoInput').click()}
                                className="w-40 h-40 rounded-[40px] border-4 border-dashed border-gray-100 flex items-center justify-center cursor-pointer hover:border-[#003B73] transition-all overflow-hidden bg-gray-50 relative group"
                            >
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center group-hover:scale-110 transition-transform">
                                        <Upload className="mx-auto text-gray-300 mb-2" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Upload Photo</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-[#003B73]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Upload className="text-white" />
                                </div>
                            </div>
                            <input id="photoInput" type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Max 2MB (JPG, PNG)</p>
                        </div>

                        {/* FORM FIELDS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <InputField label="Staff Roll No *" value={formData.staffId} onChange={v => setFormData({...formData, staffId: v})} required placeholder="E.g. CSE001" />
                            <InputField label="Full Name *" value={formData.fullName} onChange={v => setFormData({...formData, fullName: v})} required placeholder="E.g. Dr. John Doe" />
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Department *</label>
                                <select 
                                    required 
                                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold appearance-none outline-none focus:ring-2 focus:ring-blue-100"
                                    value={formData.departmentId}
                                    onChange={e => setFormData({...formData, departmentId: e.target.value})}
                                >
                                    <option value="">Select Dept</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Role</label>
                                <div className="flex bg-gray-50 p-1 rounded-2xl">
                                    {['FACULTY', 'HOD'].map(r => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setFormData({...formData, role: r})}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.role === r ? 'bg-[#003B73] text-white shadow-lg' : 'text-gray-400'}`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <InputField label="Designation" value={formData.designation} onChange={v => setFormData({...formData, designation: v})} placeholder="E.g. Assistant Professor" />
                            <InputField label="Qualification" value={formData.qualification} onChange={v => setFormData({...formData, qualification: v})} placeholder="E.g. M.E., Ph.D." />
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Date of Birth</label>
                                <input type="date" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold outline-none" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Gender</label>
                                <select className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold outline-none" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                                    <option>Male</option>
                                    <option>Female</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Blood Group</label>
                                <select className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold outline-none" value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})}>
                                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg}>{bg}</option>)}
                                </select>
                            </div>
                            <InputField label="Phone Number" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} placeholder="+91 00000 00000" />
                            <div className="md:col-span-2">
                                <InputField label="Email Address" value={formData.email} onChange={v => setFormData({...formData, email: v})} placeholder="faculty@miet.edu" type="email" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Address</label>
                                <textarea rows="3" className="w-full px-5 py-5 bg-gray-50 border-none rounded-2xl font-bold outline-none resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                            </div>
                        </div>

                        {/* INFO BOXES */}
                        <div className="space-y-4">
                            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4">
                                <Info className="text-amber-600 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest leading-none mb-1">Default Password</p>
                                    <p className="text-xs text-amber-700 font-bold">All staff accounts are created with password: <span className="font-mono text-amber-900">password123</span>. Staff must change it after first login.</p>
                                </div>
                            </div>

                            {formData.role === 'HOD' && (
                                <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100 flex gap-4 animate-fadeIn">
                                    <Shield className="text-purple-600 flex-shrink-0" />
                                    <p className="text-xs text-purple-700 font-bold">This person will become HOD of the selected department. If another HOD exists they will be changed to Faculty role.</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 pt-4 pb-10">
                            <button type="button" onClick={onClose} className="flex-1 py-5 bg-gray-100 text-gray-400 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
                            <button disabled={loading} type="submit" className="flex-2 py-5 bg-[#003B73] text-white rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl shadow-blue-900/10">
                                {loading && <RefreshCw size={16} className="animate-spin" />}
                                {editingStaff ? 'Save Changes' : `Register ${formData.role}`}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const InputField = ({ label, value, onChange, placeholder, required = false, type = "text" }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
        <input 
            type={type}
            required={required}
            className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-100"
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
        />
    </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODAL: BULK UPLOAD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const BulkUploadModal = ({ onClose, onSuccess }) => {
    const [activeTab, setActiveTab] = useState('excel');
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [results, setResults] = useState(null);

    const downloadTemplate = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Staff Template');
        
        // Headers
        const headers = ['staffId', 'fullName', 'department', 'role', 'designation', 'qualification', 'phone', 'email', 'dateOfBirth', 'gender', 'bloodGroup', 'address'];
        const headerRow = worksheet.addRow(headers);
        
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003B73' } };
        });

        // Sample Row
        worksheet.addRow(['CSE001', 'Dr. John Doe', 'COMPUTER SCIENCE ENG', 'FACULTY', 'Associate Professor', 'Ph.D.', '9876543210', 'john@miet.edu', '1985-05-20', 'Male', 'O+', 'Address details here']);

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, 'Staff_Template.xlsx');
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;
        try {
            setLoading(true);
            const data = new FormData();
            data.append('file', file);
            const res = await bulkUploadFaculty(data);
            setResults(res.data);
            if (res.data.created > 0 && res.data.failed.length === 0) {
                toast.success(`${res.data.created} accounts created!`);
                onSuccess();
            }
        } catch (error) {
            toast.error("Upload failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[48px] w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleIn">
                <div className="p-10 border-b border-gray-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-3xl font-black text-[#003B73]">Bulk Staff Upload</h3>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Multi-account Processing</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="bg-gray-50 p-2 flex gap-2 mx-10 mt-6 rounded-2xl">
                    <button onClick={() => {setActiveTab('excel'); setFile(null); setResults(null);}} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'excel' ? 'bg-[#003B73] text-white shadow-lg' : 'text-gray-400'}`}>Excel Upload</button>
                    <button onClick={() => {setActiveTab('zip'); setFile(null); setResults(null);}} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'zip' ? 'bg-[#003B73] text-white shadow-lg' : 'text-gray-400'}`}>Photo ZIP Upload</button>
                </div>

                <div className="p-10">
                    {activeTab === 'excel' ? (
                        <div className="space-y-8">
                            <div className="bg-blue-50/50 p-6 rounded-[32px] border border-blue-100 flex items-center justify-between">
                                <div>
                                    <p className="font-black text-[#003B73]">Step 1: Download Template</p>
                                    <p className="text-xs text-gray-500 font-bold mt-1">Fill the Excel sheet with staff data.</p>
                                </div>
                                <button onClick={downloadTemplate} className="px-6 py-3 bg-[#003B73] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                    <Download size={16} /> Template
                                </button>
                            </div>

                            <div className="bg-gray-50 p-8 rounded-[40px] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center relative">
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFile(e.target.files[0])} accept=".xlsx" />
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <FileText size={32} className="text-gray-400" />
                                    </div>
                                    <p className="text-sm font-black text-gray-600">{file ? file.name : 'Select or drop .xlsx file'}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">Excel spreadsheets only</p>
                                </div>
                            </div>

                            {results && (
                                <div className="bg-white border border-gray-100 p-6 rounded-3xl space-y-4 animate-fadeIn">
                                    <div className="flex gap-4">
                                        <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black">✅ {results.created} Created</div>
                                        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-black">❌ {results.failed?.length} Failed</div>
                                    </div>
                                    {results.failed?.length > 0 && (
                                        <div className="max-h-32 overflow-y-auto space-y-2">
                                            {results.failed.map((f, i) => (
                                                <div key={i} className="text-[10px] font-bold text-red-400 bg-red-50/50 p-2 rounded-lg">
                                                    Row {f.row} • {f.staffId}: {f.reason}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <button onClick={handleUpload} disabled={!file || loading} className="w-full py-5 bg-[#003B73] text-white rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-30">
                                {loading && <RefreshCw size={16} className="animate-spin" />}
                                Upload & Create Accounts
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="bg-indigo-50/50 p-6 rounded-[32px] border border-indigo-100">
                                <p className="font-black text-indigo-900 mb-1">Photo Zip Instructions</p>
                                <ul className="text-xs text-indigo-700 font-bold list-disc ml-4 space-y-1">
                                    <li>Name each photo as the staff ROLL NUMBER (e.g. CSE001.jpg)</li>
                                    <li>Zip all photos into one file</li>
                                    <li>Upload the .zip file below</li>
                                </ul>
                            </div>
                            <div className="text-center py-20 text-gray-300">
                                <Upload size={48} className="mx-auto mb-4 opacity-30" />
                                <p className="font-bold">ZIP upload coming soon...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODAL: ABSENCE & SUBSTITUTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const AbsenceControlModal = ({ staff, date, schedule, facultyList, absentFacultyIds, subSelection, setSubSelection, onClose, onUpdate }) => {
    const isAbsent = absentFacultyIds.includes(staff.id);
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    const handleMarkAbsent = async () => {
        try {
            setLoading(true);
            await markFacultyAbsent({
                facultyId: staff.id,
                date: date,
                reason: reason
            });
            toast.success("Staff marked as absent");
            onUpdate();
        } catch (error) {
            toast.error("Action failed");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAbsence = async () => {
        if (!confirm("Restore full presence? All substitutions for today will be deleted.")) return;
        try {
            setLoading(true);
            await removeFacultyAbsence({
                facultyId: staff.id,
                date: date,
                cleanup: true
            });
            toast.success("Presence restored");
            onUpdate();
        } catch (error) {
            toast.error("Action failed");
        } finally {
            setLoading(false);
        }
    };

    const handleSubAssign = async (timetableId) => {
        const subId = subSelection[timetableId];
        if (!subId) return;
        try {
            await assignSubstitution({
                timetableId: timetableId,
                substituteFacultyId: subId,
                date: date,
            });
            toast.success("Substitute assigned");
            setSubSelection(prev => ({...prev, [timetableId]: ''}));
            onUpdate();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to assign");
        }
    };

    const handleSubDelete = async (subId) => {
        try {
            await deleteSubstitution(subId);
            toast.success("Substitution removed");
            onUpdate();
        } catch (error) {
            toast.error("Failed to remove");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-[48px] w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleIn">
                <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <div>
                        <h3 className="text-3xl font-black text-[#003B73]">{isAbsent ? 'Presence Control' : 'Mark Absence'}</h3>
                        <p className="text-gray-500 font-bold text-sm mt-1">{staff.fullName} • {date}</p>
                    </div>
                    <button onClick={onClose} className="p-3 text-gray-400 hover:text-red-500 rounded-2xl transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-10 space-y-8">
                    {!isAbsent ? (
                        <div className="space-y-6">
                            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex gap-4">
                                <AlertCircle className="text-orange-600 flex-shrink-0" />
                                <p className="text-xs text-orange-700 font-bold leading-relaxed">
                                    Marking a faculty as absent will open up their scheduled classes for substitution. 
                                    Attendance for these classes will be recorded by the assigned substitute.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Reason for Absence</label>
                                <textarea 
                                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold outline-none resize-none"
                                    placeholder="Leave reason..."
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    rows="3"
                                />
                            </div>
                            <button onClick={handleMarkAbsent} disabled={loading} className="w-full py-5 bg-orange-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-900/10 transition-all active:scale-95">
                                {loading ? 'Processing...' : 'Confirm Absence'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="bg-blue-50 p-8 rounded-[40px] border border-blue-100">
                                <h4 className="text-lg font-black text-[#003B73] mb-6 flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                                    Substitution Workflow
                                </h4>
                                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                    {schedule.map((slot) => (
                                        <div key={slot.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h5 className="font-extrabold text-gray-800 leading-tight truncate w-48">{slot.subjectName}</h5>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-lg">P{slot.period}</span>
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase italic">{slot.department}-{slot.year}-{slot.section}</span>
                                                    </div>
                                                </div>
                                                <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${slot.substitution ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                    {slot.substitution ? 'Assigned' : 'Open'}
                                                </span>
                                            </div>

                                            {slot.substitution ? (
                                                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl">
                                                    <div className="flex items-center gap-2">
                                                        <RefreshCw size={12} className="text-emerald-500" />
                                                        <span className="text-[10px] font-black text-emerald-800 truncate w-32">{slot.substitution.substituteFaculty.fullName}</span>
                                                    </div>
                                                    <button onClick={() => handleSubDelete(slot.substitution.id)} className="text-[9px] font-black text-red-600 hover:text-red-700 bg-white px-3 py-1.5 rounded-xl shadow-sm">Remove</button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <select 
                                                        className="flex-1 px-3 py-2 bg-gray-50 border-none rounded-xl font-bold text-xs outline-none"
                                                        value={subSelection[slot.id] || ''}
                                                        onChange={e => setSubSelection(prev => ({...prev, [slot.id]: e.target.value}))}
                                                    >
                                                        <option value="">Select Sub...</option>
                                                        {facultyList.filter(f => f.id !== staff.id && !absentFacultyIds.includes(f.id)).map(f => (
                                                            <option key={f.id} value={f.id}>{f.fullName}</option>
                                                        ))}
                                                    </select>
                                                    <button onClick={() => handleSubAssign(slot.id)} disabled={!subSelection[slot.id]} className="px-4 bg-[#003B73] text-white text-[10px] font-black rounded-xl disabled:opacity-30">Assign</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {schedule.length === 0 && <p className="text-center py-10 text-gray-400 font-bold">No classes today</p>}
                                </div>
                            </div>
                            <button onClick={handleRemoveAbsence} className="w-full py-6 bg-red-50 text-red-600 rounded-[32px] font-black hover:bg-red-600 hover:text-white transition-all border border-red-100 flex flex-col items-center justify-center gap-1 group">
                                <div className="flex items-center gap-2">
                                    <Trash2 size={20} />
                                    <span className="text-lg">Full Restoration</span>
                                </div>
                                <span className="text-[9px] opacity-80 uppercase tracking-widest">Mark as Present & Revoke Subs</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FacultyManager;
