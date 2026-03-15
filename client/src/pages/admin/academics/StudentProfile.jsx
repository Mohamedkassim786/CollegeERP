import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    User, Mail, Phone, MapPin, Calendar, GraduationCap, 
    BookOpen, Award, AlertCircle, ArrowLeft, Download, Edit,
    Heart, Home, Upload, X, Fingerprint, ExternalLink, Search
} from 'lucide-react';
import { getStudent, updateStudent, getGradeSheet } from '../../../services/student.service';
import { getDepartments } from '../../../services/department.service';
import { handleApiError } from '../../../utils/errorHandler';
import toast from 'react-hot-toast';

const StudentProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPhotoZoom, setShowPhotoZoom] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [activeTab, setActiveTab] = useState('Profile');

    useEffect(() => {
        fetchStudentProfile();
        fetchDepartments();
    }, [id]);

    const fetchDepartments = async () => {
        try {
            const res = await getDepartments();
            setDepartments(res.data);
        } catch (err) {}
    };

    const fetchStudentProfile = async () => {
        try {
            setLoading(true);
            const response = await getStudent(id);
            setStudent(response.data);
        } catch (error) {
            handleApiError(error, "Failed to load student profile");
            navigate(`/${location.pathname.split('/')[1]}/students`);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = window.URL.createObjectURL(file);
            setEditingStudent({ ...editingStudent, photoFile: file, photo: previewUrl });
        }
    };

    const handleEditStudent = async (e) => {
        e.preventDefault();
        const t = toast.loading("Updating Profile...");
        try {
            const formData = new FormData();
            
            // Clean and append fields
            Object.keys(editingStudent).forEach(key => {
                const val = editingStudent[key];
                
                // Skip photo handling (done separately), stats, and nested objects/arrays
                if (key !== 'photo' && key !== 'photoFile' && key !== 'stats' && val !== null && val !== undefined) {
                    if (typeof val !== 'object') {
                        formData.append(key, val);
                    }
                }
            });

            if (editingStudent.photoFile) {
                formData.append('photo', editingStudent.photoFile);
            }
            
            await updateStudent(editingStudent.id, formData);
            toast.dismiss(t); 
            toast.success("Profile updated successfully!");
            setShowEditModal(false); 
            fetchStudentProfile();
        } catch (err) { 
            toast.dismiss(t); 
            handleApiError(err, "Failed to update profile");
            console.error("Profile update error:", err);
        }
    };

    const handleDownload = async () => {
        try {
            toast.loading("Generating...");
            const res = await getGradeSheet(id, student.semester);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const a = document.createElement('a'); a.href = url;
            a.setAttribute('download', `ID_Card_${student.rollNo}.pdf`);
            document.body.appendChild(a); a.click(); a.remove();
            window.URL.revokeObjectURL(url);
            toast.dismiss(); toast.success("Downloaded");
        } catch (err) { toast.dismiss(); handleApiError(err, "Download failed"); }
    };

    const getPhotoUrl = (p) => {
        if (!p) return null;
        if (p.startsWith('data:') || p.startsWith('http')) return p;
        return `http://localhost:3000/uploads/students/${p}`;
    };

    const goBack = () => navigate(`/${location.pathname.split('/')[1]}/students`);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]">
            <div className="w-12 h-12 border-4 border-[#003B73] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!student) return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <button onClick={goBack} className="flex items-center gap-2 text-white bg-[#003B73] px-6 py-3 rounded-2xl">
                <ArrowLeft size={16} /> Return to Students
            </button>
        </div>
    );

    const initials = (student.name || 'S').split(' ').map(n => n[0]).join('').toUpperCase();

    return (
        <div className="min-h-screen bg-[#F1F5F9]">

            {/* ══════════════════════ BLUE BANNER ══════════════════════ */}
            <div className="bg-[#003B73] relative overflow-hidden">
                {/* Subtle texture */}
                <div className="absolute inset-0 opacity-[0.07] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-700/20 via-transparent to-black/30"></div>
                <div className="absolute -right-40 top-0 w-[500px] h-full bg-blue-400/5 rounded-full blur-[120px]"></div>

                <div className="relative z-10 px-8 py-6">

                    {/* Row 1 — Back button */}
                    <button
                        onClick={goBack}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest border border-white/10 transition-all mb-6"
                    >
                        <ArrowLeft size={13} /> Back
                    </button>

                    {/* Row 2 — Profile identity */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        {/* Photo */}
                        <div className="relative shrink-0 cursor-pointer group" onClick={() => setShowPhotoZoom(true)}>
                            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-[6px] border-white/30 overflow-hidden shadow-2xl group-hover:border-white/60 group-hover:scale-105 transition-all duration-500">
                                {student.photo ? (
                                    <img src={getPhotoUrl(student.photo)} alt={student.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-white/10 flex items-center justify-center text-3xl font-black text-white/40">{initials}</div>
                                )}
                            </div>
                            <div className="absolute bottom-1 right-1 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-[#003B73] border border-gray-100">
                                <Upload size={16} />
                            </div>
                        </div>

                        {/* Identity text */}
                        <div className="flex-1 space-y-2.5">
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
                                {student.name}
                            </h1>
                            <p className="text-blue-200 text-sm font-semibold tracking-wide">
                                Reg No.&nbsp;<span className="text-white font-black">{student.registerNumber || student.rollNo}</span>
                            </p>
                            <p className="text-blue-100/80 text-sm font-medium">
                                {student.department || 'General'} Engineering &middot; Batch <span className="text-white/90 font-semibold">{student.batch || '—'}</span>
                            </p>
                            <p className="text-blue-100/60 text-sm font-medium">
                                {student.year ? `${student.year}${['st','nd','rd','th'][Math.min(student.year-1,3)]} Year` : ''}{student.semester ? ` / Semester ${student.semester}` : ''}{student.section ? ` · Section ${student.section}` : ''}
                            </p>
                            {student.phoneNumber && (
                                <div className="inline-flex items-center mt-1">
                                    <span className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-900/30">
                                        <Phone size={13} /> +91 {student.phoneNumber}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={() => { setEditingStudent({ ...student }); setShowEditModal(true); }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/15 transition-all"
                            >
                                <Edit size={13} /> Edit
                            </button>
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#003B73] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
                            >
                                <Download size={13} /> Download ID Card
                            </button>
                        </div>
                    </div>

                    {/* Row 3 — Tabs */}
                    <div className="flex gap-8 mt-6 border-t border-white/10 overflow-x-auto">
                        {['Profile', 'Academics', 'Attendance', 'Documents'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 text-[11px] font-black uppercase tracking-[0.25em] whitespace-nowrap border-b-2 transition-all ${
                                    activeTab === tab ? 'text-white border-white' : 'text-white/30 border-transparent hover:text-white/60'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {/* ══════════════════════ END BANNER ══════════════════════ */}

            {/* ══════════════════════ CONTENT BELOW ══════════════════════ */}
            <div className="px-8 py-8 w-full max-w-none">

                {activeTab === 'Profile' && (
                    <div className="space-y-6 animate-fadeIn">

                        {/* Stat Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Overall CGPA', value: student.stats?.cgpa || '0.00', icon: GraduationCap, color: 'from-blue-600 to-indigo-700' },
                                { label: 'Attendance', value: student.stats?.attendance || '—', icon: Calendar, color: 'from-emerald-500 to-teal-700' },
                                { label: 'Total Credits', value: student.stats?.totalCredits || '0', icon: BookOpen, color: 'from-purple-500 to-fuchsia-700' },
                                { label: 'Active Arrears', value: student.stats?.arrearCount || '0', icon: AlertCircle, color: 'from-rose-500 to-red-700' },
                            ].map((stat, i) => (
                                <div key={i} className={`bg-gradient-to-br ${stat.color} p-6 rounded-[32px] flex items-center gap-5 group hover:scale-[1.03] hover:shadow-2xl transition-all duration-500 relative overflow-hidden shadow-xl`}>
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:bg-white group-hover:text-[#003B73] transition-all shadow-inner">
                                        <stat.icon size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest">{stat.label}</p>
                                        <h3 className="text-2xl font-black text-white">{stat.value}</h3>
                                    </div>
                                    <ExternalLink size={13} className="text-white/15 ml-auto" />
                                </div>
                            ))}
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-7 gap-6">

                            {/* LEFT */}
                            <div className="xl:col-span-4 space-y-6">

                                {/* Contact */}
                                <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-[#003B73]"><Mail size={16}/></div>
                                        <div>
                                            <h3 className="text-xs font-black text-[#003B73] uppercase tracking-tight">Contact Information</h3>
                                            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Communication Channels</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <InfoField label="Email" value={student.email} />
                                        <InfoField label="Phone" value={student.phoneNumber} />
                                        <div className="sm:col-span-2">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Address</p>
                                            <div className="p-3.5 bg-gray-50 rounded-2xl text-sm font-semibold text-gray-600 flex items-start gap-2 border border-gray-100">
                                                <MapPin size={14} className="text-[#003B73] mt-0.5 shrink-0"/>
                                                <span>{[student.address, student.city, student.state, student.pincode].filter(Boolean).join(', ') || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Academic Details */}
                                <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#003B73] shadow-inner"><GraduationCap size={20}/></div>
                                        <div>
                                            <h3 className="text-sm font-black text-[#003B73] uppercase tracking-tight">Academic Profile</h3>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Institutional Registry Track</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                                        {[
                                            { label: 'Roll Number', value: student.rollNo },
                                            { label: 'Register Number', value: student.registerNumber || 'NO REG NO' },
                                            { label: 'Department', value: student.department ? `${student.department} Engineering` : null },
                                            { label: 'Year / Semester', value: student.year && student.semester ? `Year ${student.year} · Semester ${student.semester}` : null },
                                            { label: 'Section', value: student.section },
                                            { label: 'Regulation', value: student.regulation },
                                            { label: 'Year of Joining', value: student.yearOfJoining },
                                            { label: 'Status', value: <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase">{student.status || 'Active'}</span> },
                                        ].map((r, i) => (
                                            <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{r.label}</span>
                                                <span className="text-sm font-bold text-[#003B73]">{r.value || '—'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT */}
                            <div className="xl:col-span-3 space-y-6">

                                {/* Personal */}
                                <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-[#003B73]"><User size={16}/></div>
                                        <div>
                                            <h3 className="text-xs font-black text-[#003B73] uppercase tracking-tight">Personal Details</h3>
                                            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Demographic Info</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {[
                                            { label: 'Date of Birth', value: student.dateOfBirth, icon: Calendar },
                                            { label: 'Gender', value: student.gender, icon: User },
                                            { label: 'Blood Group', value: student.bloodGroup, icon: Heart },
                                            { label: 'Nationality', value: student.nationality, icon: Fingerprint },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-gray-50 transition-all group">
                                                <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-[#003B73] transition-colors shrink-0">
                                                    <item.icon size={14}/>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                                                    <p className="font-bold text-[#001D3D] text-sm">{item.value || '—'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Parent */}
                                <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-[#003B73]"><Home size={16}/></div>
                                        <div>
                                            <h3 className="text-xs font-black text-[#003B73] uppercase tracking-tight">Parent Details</h3>
                                            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Father & Mother</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <ParentCard name={student.fatherName} phone={student.fatherPhone} label="Father" color="bg-[#003B73]" />
                                        <ParentCard name={student.motherName} phone={student.motherPhone} label="Mother" color="bg-pink-500" />
                                        {student.guardianName && (
                                            <div className="p-4 bg-[#003B73] rounded-2xl flex justify-between items-center">
                                                <div>
                                                    <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest">Emergency Contact</p>
                                                    <p className="font-black text-white text-sm">{student.guardianName}</p>
                                                </div>
                                                <p className="text-white/60 text-xs font-bold">{student.guardianPhone}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab !== 'Profile' && (
                    <div className="h-72 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center animate-fadeIn">
                        <GraduationCap size={36} className="text-gray-200 mb-3" />
                        <h3 className="text-lg font-black text-[#003B73] uppercase tracking-tight">{activeTab}</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Coming soon</p>
                    </div>
                )}
            </div>

            {/* ══ Photo Zoom ══ */}
            {showPhotoZoom && (
                <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-fadeIn" onClick={() => setShowPhotoZoom(false)}>
                    <button className="absolute top-5 right-5 text-white/40 hover:text-white p-3 hover:bg-white/5 rounded-full transition-all"><X size={32}/></button>
                    <div className="max-w-xl w-full text-center" onClick={e => e.stopPropagation()}>
                        {student.photo
                            ? <img src={getPhotoUrl(student.photo)} alt={student.name} className="w-full max-h-[75vh] object-contain rounded-2xl border border-white/10"/>
                            : <div className="w-56 h-56 mx-auto rounded-full bg-white/5 flex items-center justify-center text-7xl font-black text-white/10">{initials}</div>
                        }
                        <h4 className="text-2xl font-black text-white mt-5">{student.name}</h4>
                        <p className="text-blue-400 font-mono text-sm mt-1">{student.registerNumber || student.rollNo}</p>
                    </div>
                </div>
            )}

            {/* ══ Edit Modal ══ */}
            {showEditModal && editingStudent && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-lg flex items-center justify-center p-4 z-[200] animate-fadeIn">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-3xl shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-7 pb-4 border-b border-gray-100">
                            <div>
                                <h3 className="text-xl font-black text-[#003B73]">Edit Student</h3>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Update information</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><X size={22}/></button>
                        </div>

                        <form onSubmit={handleEditStudent} className="space-y-7">
                            {/* Photo */}
                            <div className="flex flex-col items-center p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                {editingStudent.photo ? (
                                    <div className="relative w-28 h-28">
                                        <img src={getPhotoUrl(editingStudent.photo)} className="w-full h-full object-cover rounded-2xl border-4 border-white shadow-lg"/>
                                        <button type="button" onClick={() => setEditingStudent({...editingStudent, photo:''})} className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-xl border-2 border-white"><X size={12}/></button>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer flex flex-col items-center gap-2">
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-300 shadow-sm border border-gray-100"><Upload size={22}/></div>
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Upload Photo</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange}/>
                                    </label>
                                )}
                            </div>

                            {/* Academic */}
                            <Section title="Academic Info">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Roll No</label>
                                        <input 
                                            className="input-field"
                                            value={editingStudent.rollNo || ''} 
                                            onChange={e => setEditingStudent({...editingStudent, rollNo: e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase()})}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Register No</label>
                                        <input 
                                            className="input-field"
                                            value={editingStudent.registerNumber || ''} 
                                            onChange={e => setEditingStudent({...editingStudent, registerNumber: e.target.value.replace(/[^0-9]/g, "")})}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Year</label>
                                        <input 
                                            type="number"
                                            className="input-field"
                                            value={editingStudent.year || ''} 
                                            onChange={e => setEditingStudent({...editingStudent, year: parseInt(e.target.value) || ''})}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Semester</label>
                                        <input 
                                            type="number"
                                            className="input-field"
                                            value={editingStudent.semester || ''} 
                                            onChange={e => setEditingStudent({...editingStudent, semester: parseInt(e.target.value) || ''})}
                                            required
                                        />
                                    </div>
                                    <Field label="Section" k="section" state={editingStudent} set={setEditingStudent}/>
                                    <div className="space-y-1.5">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Department</label>
                                        <select className="input-field" value={editingStudent.department||''} onChange={e=>setEditingStudent({...editingStudent,department:e.target.value})} required>
                                            <option value="">Select...</option>
                                            {departments.map(d=><option key={d.id} value={d.code}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </Section>

                            {/* Personal */}
                            <Section title="Personal Info">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <div className="space-y-1.5">
                                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                                            <input 
                                                className="input-field"
                                                value={editingStudent.name || ''} 
                                                onChange={e => setEditingStudent({...editingStudent, name: e.target.value.replace(/[^a-zA-Z\s]/g, "")})}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <Field label="Date of Birth" k="dateOfBirth" type="date" state={editingStudent} set={setEditingStudent}/>
                                    <div className="space-y-1.5">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Phone</label>
                                        <input 
                                            className="input-field"
                                            value={editingStudent.phoneNumber || ''} 
                                            onChange={e => setEditingStudent({...editingStudent, phoneNumber: e.target.value.replace(/[^0-9]/g, "").slice(0, 10)})}
                                            required
                                        />
                                    </div>
                                    <Field label="Email" k="email" state={editingStudent} set={setEditingStudent}/>
                                    <div className="space-y-1.5">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Gender</label>
                                        <select className="input-field" value={editingStudent.gender||''} onChange={e=>setEditingStudent({...editingStudent,gender:e.target.value})} required>
                                            <option value="">Select...</option>
                                            <option value="MALE">Male</option>
                                            <option value="FEMALE">Female</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2"><Field label="Address" k="address" state={editingStudent} set={setEditingStudent}/></div>
                                </div>
                            </Section>

                            {/* Parent */}
                            <Section title="Parent Info">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Father's Name</label>
                                        <input 
                                            className="input-field"
                                            value={editingStudent.fatherName || ''} 
                                            onChange={e => setEditingStudent({...editingStudent, fatherName: e.target.value.replace(/[^a-zA-Z\s]/g, "")})}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Father's Phone</label>
                                        <input 
                                            className="input-field"
                                            value={editingStudent.fatherPhone || ''} 
                                            onChange={e => setEditingStudent({...editingStudent, fatherPhone: e.target.value.replace(/[^0-9]/g, "").slice(0, 10)})}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Mother's Name</label>
                                        <input 
                                            className="input-field"
                                            value={editingStudent.motherName || ''} 
                                            onChange={e => setEditingStudent({...editingStudent, motherName: e.target.value.replace(/[^a-zA-Z\s]/g, "")})}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Mother's Phone</label>
                                        <input 
                                            className="input-field"
                                            value={editingStudent.motherPhone || ''} 
                                            onChange={e => setEditingStudent({...editingStudent, motherPhone: e.target.value.replace(/[^0-9]/g, "").slice(0, 10)})}
                                            required
                                        />
                                    </div>
                                </div>
                            </Section>

                            <div className="flex gap-3">
                                <button type="button" onClick={()=>setShowEditModal(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-[#003B73] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#002B53] shadow-lg transition-all active:scale-95">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Helper sub-components ───
const InfoField = ({ label, value }) => (
    <div>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{label}</p>
        <div className="p-3.5 bg-gray-50 rounded-2xl text-sm font-semibold text-gray-700 border border-gray-100 truncate">{value || '—'}</div>
    </div>
);

const ParentCard = ({ name, phone, label, color }) => (
    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3 hover:bg-white hover:shadow-sm transition-all">
        <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0`}>
            {name?.charAt(0) || label[0]}
        </div>
        <div className="min-w-0">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
            <p className="font-black text-[#001D3D] text-sm truncate">{name || '—'}</p>
            {phone && <p className="text-xs font-bold text-gray-400 mt-0.5">{phone}</p>}
        </div>
    </div>
);

const Section = ({ title, children }) => (
    <div>
        <h4 className="text-[9px] font-black text-[#003B73] uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-4 h-0.5 bg-[#003B73]/30 rounded-full"></span>{title}
        </h4>
        {children}
    </div>
);

const Field = ({ label, k, type = 'text', state, set, required }) => (
    <div className="space-y-1.5">
        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
        <input
            type={type}
            required={required}
            className="input-field"
            value={state[k] || ''}
            onChange={e => set({ ...state, [k]: e.target.value })}
        />
    </div>
);

export default StudentProfile;
