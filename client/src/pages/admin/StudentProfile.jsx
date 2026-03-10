import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    User, Mail, Phone, MapPin, Calendar, Hash, GraduationCap, 
    BookOpen, Award, AlertCircle, ArrowLeft, Download, Edit,
    Shield, Briefcase, Heart, Globe, Home, Upload, X
} from 'lucide-react';
import api from '../../api/axios';
import { handleApiError } from '../../utils/errorHandler';
import toast from 'react-hot-toast';

const StudentProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        fetchStudentProfile();
        fetchDepartments();
    }, [id]);

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/admin/departments');
            setDepartments(res.data);
        } catch (err) {
            console.error("Failed to load departments", err);
        }
    };

    const fetchStudentProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/students/${id}`);
            setStudent(response.data);
        } catch (error) {
            handleApiError(error, "Failed to load student profile");
            const basePath = location.pathname.split('/')[1];
            navigate(`/${basePath}/students`);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Photo size must be less than 2MB");
                return;
            }
            const previewUrl = window.URL.createObjectURL(file);
            setEditingStudent({ ...editingStudent, photoFile: file, photo: previewUrl });
        }
    };

    const handleEditStudent = async (e) => {
        e.preventDefault();
        try {
            toast.loading("Updating Profile...");
            
            const formData = new FormData();
            
            // Clean payload to match validation expectations
            const plainFields = {
                rollNo: editingStudent.rollNo,
                registerNumber: editingStudent.registerNumber || "",
                name: editingStudent.name,
                department: editingStudent.department,
                year: parseInt(editingStudent.year) || "",
                section: editingStudent.section,
                semester: parseInt(editingStudent.semester) || "",
                regulation: editingStudent.regulation,
                batch: editingStudent.batch,
                dateOfBirth: editingStudent.dateOfBirth,
                gender: editingStudent.gender,
                bloodGroup: editingStudent.bloodGroup,
                phoneNumber: editingStudent.phoneNumber,
                email: editingStudent.email,
                address: editingStudent.address,
                fatherName: editingStudent.fatherName,
                fatherPhone: editingStudent.fatherPhone,
                motherName: editingStudent.motherName,
                motherPhone: editingStudent.motherPhone
            };

            Object.keys(plainFields).forEach(key => {
                if (plainFields[key] !== null && plainFields[key] !== undefined) {
                     formData.append(key, plainFields[key]);
                }
            });

            if (editingStudent.photoFile) {
                formData.append("photo", editingStudent.photoFile);
            }

            await api.put(`/admin/students/${editingStudent.id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            toast.dismiss();
            toast.success("Profile updated successfully");
            setShowEditModal(false);
            fetchStudentProfile();
        } catch (err) {
            toast.dismiss();
            const errorMsg = err.response?.data?.errors?.map(e => `${e.path}: ${e.msg}`).join(" | ");
            if (errorMsg) {
                toast.error("Validation failed: " + errorMsg, { duration: 6000 });
                console.error("Validation details:", err.response.data.errors);
            } else {
                handleApiError(err, "Failed to update profile");
            }
        }
    };

    const handleDownloadReportCard = async (semester) => {
        try {
            toast.loading("Generating Report Card...");
            const res = await api.get(`/exams/grade-sheet?studentId=${id}&semester=${semester}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `GradeSheet_${student.rollNo}_SEM_${semester}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.dismiss();
            toast.success("Downloaded Successfully");
        } catch (error) {
            toast.dismiss();
            handleApiError(error, "Failed to download report card");
        }
    };

    const getPhotoUrl = (photoData) => {
        if (!photoData) return `http://localhost:3000/uploads/students/default-avatar.png`;
        if (photoData.startsWith('data:') || photoData.startsWith('http')) return photoData;
        return `http://localhost:3000/uploads/students/${photoData}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-16 h-16 border-4 border-[#003B73] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
                <div className="w-24 h-24 mb-6 rounded-full bg-red-50 flex items-center justify-center animate-bounce">
                    <User size={48} className="text-red-400" />
                </div>
                <h2 className="text-3xl font-black text-[#003B73] mb-3">Profile Not Found</h2>
                <p className="text-gray-500 font-medium mb-8 max-w-md">
                    The student record you're looking for doesn't exist or you might not have permission to view it.
                </p>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-8 py-3.5 bg-white text-[#003B73] font-black rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all"
                >
                    <ArrowLeft size={18} />
                    Go Back
                </button>
            </div>
        );
    }

    const name = student.name || 'Student';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 animate-fadeIn">
            {/* Header / Banner */}
            <div className="h-64 bg-gradient-to-r from-[#003B73] to-[#0056b3] relative">
                <button 
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 z-20 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md transition-all flex items-center gap-2 font-bold text-sm"
                >
                    <ArrowLeft size={18} /> BACK
                </button>

                <div className="absolute inset-0 opacity-10 overflow-hidden">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
                </div>
                
                <div className="max-w-7xl mx-auto px-6 h-full flex flex-col justify-end pb-8 relative z-10">
                    <div className="flex items-center gap-8">
                        <div className="relative group shrink-0">
                            {student.photo ? (
                                <img src={getPhotoUrl(student.photo)} alt={student.name} className="w-40 h-40 rounded-[40px] border-[6px] border-white/20 shadow-2xl object-cover" />
                            ) : (
                                <div className="w-40 h-40 rounded-[40px] border-[6px] border-white/20 shadow-2xl bg-white flex items-center justify-center text-5xl font-black text-[#003B73]">
                                    {initials}
                                </div>
                            )}
                        </div>
                        
                        <div>
                            <div className="flex items-center gap-4">
                                <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-sm">{student.name}</h1>
                                <button 
                                    onClick={() => {
                                        setEditingStudent(student);
                                        setShowEditModal(true);
                                    }}
                                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md transition-all flex items-center gap-2"
                                    title="Edit Profile"
                                >
                                    <Edit size={18}/>
                                </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 mt-4 text-white font-black tracking-widest uppercase text-sm drop-shadow-md">
                                <span className="flex items-center gap-2 bg-white/20 px-4 py-2 hover:bg-white/30 transition-all cursor-default rounded-xl backdrop-blur-md border border-white/10 shadow-lg"><Hash size={18}/> {student.rollNo}</span>
                                <span className="flex items-center gap-2 bg-white/20 px-4 py-2 hover:bg-white/30 transition-all cursor-default rounded-xl backdrop-blur-md border border-white/10 shadow-lg"><GraduationCap size={18}/> {student.department || student.departmentRef?.name}</span>
                                <span className="flex items-center gap-2 bg-white/20 px-4 py-2 hover:bg-white/30 transition-all cursor-default rounded-xl backdrop-blur-md border border-white/10 shadow-lg"><Briefcase size={18}/> BATCH {student.batch}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Essential Info & Stats */}
                <div className="space-y-8">
                    {/* Academic Stat Card */}
                    <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 flex justify-between items-center overflow-hidden relative">
                         <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full translate-x-8 -translate-y-8"></div>
                         <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Current CGPA</p>
                            <h2 className="text-5xl font-black text-[#003B73]">{student.stats?.cgpa || '0.00'}</h2>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Arrears</p>
                            <h2 className={`text-5xl font-black ${student.stats?.arrearSubjects > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                {student.stats?.arrearSubjects || 0}
                            </h2>
                         </div>
                    </div>

                    {/* Quick Contact */}
                    <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
                        <h3 className="text-lg font-black text-[#003B73] mb-8 flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Phone size={20}/></div>
                            Contact Channels
                        </h3>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-[#003B73] group-hover:text-white transition-all"><Mail size={20}/></div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Personal Email</p>
                                    <p className="font-bold text-gray-800">{student.email || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-[#003B73] group-hover:text-white transition-all"><Phone size={20}/></div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile Number</p>
                                    <p className="font-bold text-gray-800">{student.phoneNumber || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Personal Details */}
                    <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
                        <h3 className="text-lg font-black text-[#003B73] mb-8 flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><User size={20}/></div>
                            Identity Meta
                        </h3>
                        <div className="grid grid-cols-2 gap-y-6">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gender</p>
                                <p className="font-bold text-gray-800">{student.gender || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Blood Group</p>
                                <p className="font-bold text-red-500 flex items-center gap-1"><Heart size={14} fill="currentColor"/> {student.bloodGroup || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">DOB</p>
                                <p className="font-bold text-gray-800 uppercase">{student.dateOfBirth || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nationality</p>
                                <p className="font-bold text-gray-800">{student.nationality || 'Indian'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Main Content (Tabs) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Family & Address Section */}
                    <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-2xl font-black text-[#003B73] flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><Home size={24}/></div>
                                Bio & Domestic Details
                            </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Father's Information</p>
                                    <p className="text-xl font-black text-gray-800 uppercase">{student.fatherName || 'N/A'}</p>
                                    <p className="text-sm font-bold text-gray-500 mt-1 flex items-center gap-2"><Phone size={14}/> {student.fatherPhone || 'N/A'}</p>
                                </div>
                                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Mother's Information</p>
                                    <p className="text-xl font-black text-gray-800 uppercase">{student.motherName || 'N/A'}</p>
                                    <p className="text-sm font-bold text-gray-500 mt-1 flex items-center gap-2"><Phone size={14}/> {student.motherPhone || 'N/A'}</p>
                                </div>
                            </div>
                            
                            <div className="p-8 bg-[#003B73]/5 rounded-[40px] flex flex-col justify-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><MapPin size={14} className="text-[#003B73]"/> Permanent Residence</p>
                                <p className="text-lg font-extrabold text-[#003B73] leading-relaxed">
                                    {student.address}<br/>
                                    {student.city}, {student.district}<br/>
                                    {student.state} - {student.pincode}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Academic Performance / Exam History */}
                    <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-2xl font-black text-[#003B73] flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Award size={24}/></div>
                                Academic Performance
                            </h3>
                            <button 
                                onClick={() => {
                                    const latestSem = student.results?.length > 0 ? Math.max(...student.results.map(r => r.semester)) : student.semester;
                                    handleDownloadReportCard(latestSem);
                                }}
                                className="flex items-center gap-2 text-xs font-black text-[#003B73] uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 hover:bg-gray-100 transition-all"
                            >
                                <Download size={16}/> Report Card
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Semester</th>
                                        <th className="px-6 py-4 text-center">GPA</th>
                                        <th className="px-6 py-4 text-center">CGPA</th>
                                        <th className="px-6 py-4 text-center">Arrears</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {student.results?.length > 0 ? (
                                        student.results.sort((a,b) => b.semester - a.semester).map(res => (
                                            <tr key={res.id} className="group hover:bg-gray-50/50 transition-all">
                                                <td className="px-6 py-6 font-black text-[#003B73]">SEM {res.semester}</td>
                                                <td className="px-6 py-6 text-center text-lg font-black text-gray-700">{res.gpa.toFixed(2)}</td>
                                                <td className="px-6 py-6 text-center text-lg font-black text-gray-400">{res.cgpa.toFixed(2)}</td>
                                                <td className="px-6 py-6 text-center">
                                                    <span className={`px-4 py-1.5 rounded-full font-black text-[10px] ${res.arrearCount > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        {res.arrearCount || 0} ITEMS
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <span className={`px-4 py-1.5 rounded-full font-black text-[10px] border shadow-sm ${res.resultStatus === 'PASS' || res.resultStatus === 'P' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-red-500 text-white border-red-400'}`}>
                                                        {res.resultStatus || 'N/A'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="py-20 text-center text-gray-300 font-black uppercase tracking-widest">No results published yet</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Subject Breakdown / Recent Marks */}
                    <div className="bg-white rounded-[40px] p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
                        <h3 className="text-2xl font-black text-[#003B73] mb-10 flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center"><BookOpen size={24}/></div>
                            Current Semester Coursework
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {student.marks?.filter(m => m.subject.semester === student.semester).map(m => (
                                <div key={m.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 group hover:border-[#003B73] transition-all relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-16 h-16 bg-[#003B73] opacity-0 group-hover:opacity-5 translate-x-8 -translate-y-8 rounded-full transition-all"></div>
                                     <div className="flex justify-between items-start mb-4">
                                        <div className="max-w-[70%]">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{m.subject.code}</p>
                                            <p className="font-extrabold text-gray-800 leading-tight">{m.subject.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-[#003B73]">{m.internal || '0'}</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase">INTERNAL / 25</p>
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

            {/* Edit Student Modal */}
            {showEditModal && editingStudent && (
                <div className="fixed inset-0 bg-[#003B73]/20 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fadeIn">
                    <div className="bg-white rounded-[48px] p-10 w-full max-w-2xl shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-3xl font-black text-[#003B73] tracking-tight">Edit Profile</h3>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="p-4 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-3xl transition-all">
                                <X size={32} />
                            </button>
                        </div>

                        <form onSubmit={handleEditStudent} className="space-y-6">
                            {/* Photo Upload Section */}
                            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 hover:border-[#003B73] transition-all group relative overflow-hidden">
                                {editingStudent.photo ? (
                                    <div className="relative w-32 h-32">
                                        <img src={getPhotoUrl(editingStudent.photo)} alt="Preview" className="w-full h-full object-cover rounded-[24px] shadow-lg" />
                                        <button
                                            type="button"
                                            onClick={() => setEditingStudent({ ...editingStudent, photo: '' })}
                                            className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer flex flex-col items-center">
                                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-500 mb-4">
                                            <Upload className="w-8 h-8 text-[#003B73]" />
                                        </div>
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Update Photo</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                                    </label>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Roll Number</label>
                                    <input className="input-field w-full font-mono" value={editingStudent.rollNo} onChange={(e) => setEditingStudent({ ...editingStudent, rollNo: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Register Number</label>
                                    <input className="input-field w-full font-mono" value={editingStudent.registerNumber || ""} onChange={(e) => setEditingStudent({ ...editingStudent, registerNumber: e.target.value })} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Full Name</label>
                                    <input className="input-field w-full" value={editingStudent.name} onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Department</label>
                                    <select className="input-field w-full" value={editingStudent.department || ""} onChange={(e) => setEditingStudent({ ...editingStudent, department: e.target.value })} required>
                                        <option value="">Select Dept</option>
                                        {departments.map((d) => (
                                            <option key={d.id} value={d.code}>{d.name} ({d.code})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Batch (e.g., 2022-2026)</label>
                                    <input className="input-field w-full" value={editingStudent.batch || ""} onChange={(e) => setEditingStudent({ ...editingStudent, batch: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Date of Birth</label>
                                    <input type="date" className="input-field w-full" value={editingStudent.dateOfBirth || ""} onChange={(e) => setEditingStudent({ ...editingStudent, dateOfBirth: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Gender</label>
                                    <select className="input-field w-full" value={editingStudent.gender || ""} onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value })}>
                                        <option value="">Select Gender</option>
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Phone Number</label>
                                    <input className="input-field w-full" value={editingStudent.phoneNumber || ""} onChange={(e) => setEditingStudent({ ...editingStudent, phoneNumber: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Email</label>
                                    <input className="input-field w-full" value={editingStudent.email || ""} onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Address</label>
                                    <input className="input-field w-full" value={editingStudent.address || ""} onChange={(e) => setEditingStudent({ ...editingStudent, address: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Father's Name</label>
                                    <input className="input-field w-full" value={editingStudent.fatherName || ""} onChange={(e) => setEditingStudent({ ...editingStudent, fatherName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Father's Phone</label>
                                    <input className="input-field w-full" value={editingStudent.fatherPhone || ""} onChange={(e) => setEditingStudent({ ...editingStudent, fatherPhone: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Mother's Name</label>
                                    <input className="input-field w-full" value={editingStudent.motherName || ""} onChange={(e) => setEditingStudent({ ...editingStudent, motherName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Mother's Phone</label>
                                    <input className="input-field w-full" value={editingStudent.motherPhone || ""} onChange={(e) => setEditingStudent({ ...editingStudent, motherPhone: e.target.value })} />
                                </div>
                            </div>
                            
                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-[24px] font-black transition-all transform active:scale-95">Cancel</button>
                                <button type="submit" className="flex-1 py-5 bg-[#003B73] text-white rounded-[24px] font-black hover:bg-[#002850] shadow-xl shadow-blue-900/10 transition-all transform active:scale-95">Save Profile</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentProfile;
