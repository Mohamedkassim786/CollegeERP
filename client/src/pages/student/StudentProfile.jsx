import React, { useContext, useEffect, useState, useRef } from 'react';
import { User, Camera, Mail, Phone, MapPin, Calendar, Award, BookOpen } from 'lucide-react';
import { getMyProfile, uploadProfilePhoto } from '../../services/profile.service';
import AuthContext from '../../context/AuthProvider';

const StudentProfile = () => {
    const { auth } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const fileRef = useRef();

    useEffect(() => {
        getMyProfile()
            .then(res => setProfile(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const uploadPhoto = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const form = new FormData();
        form.append('photo', file);
        try {
            const res = await uploadProfilePhoto(form);
            setProfile(p => ({ ...p, photoUrl: res.data.photoUrl }));
            setMsg('Photo updated. Refresh if needed.');
            setTimeout(() => setMsg(''), 3000);
        } catch (e) {
            setMsg('Photo upload failed.');
        }
    };

    if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#003B73] border-t-transparent rounded-full animate-spin" /></div>;

    const p = profile || {};

    return (
        <div className="w-full space-y-8 animate-fadeIn">
            {msg && <div className="p-4 bg-blue-50 text-blue-700 text-sm rounded-2xl font-black text-center shadow-sm border border-blue-100">{msg}</div>}

            {/* Banner Area - Enhanced visual hierarchy and full width */}
            <div className="relative bg-[#003B73] rounded-[40px] shadow-2xl border border-white/10 overflow-hidden pt-16 pb-12 px-10 flex flex-col md:flex-row items-center gap-10">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px] -mr-64 -mt-64"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
                
                <div className="relative z-10 flex-shrink-0">
                    <div className="w-48 h-48 rounded-[3rem] overflow-hidden bg-white/10 border-[6px] border-white/20 shadow-2xl flex items-center justify-center relative group">
                        {p.photoUrl
                            ? <img src={`http://localhost:3000${p.photoUrl}`} alt="Profile" className="w-full h-full object-cover" />
                            : <User size={72} className="text-white/20" />
                        }
                    </div>
                </div>

                <div className="relative z-10 text-center md:text-left flex-1 space-y-4">
                    <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 backdrop-blur-md text-blue-100 text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-white/10">
                        <Award size={14} className="text-amber-400" /> B.TECH &middot; {p.department || 'ENGINEERING'} STUDENT
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg">
                        {p.name || p.fullName || auth?.username}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-blue-100/70 font-bold text-sm">
                        <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                            Reg No: <span className="text-white">{p.registerNumber || p.rollNo || 'N/A'}</span>
                        </span>
                        <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 uppercase tracking-widest text-[10px]">
                            <Calendar size={16} className="text-blue-300" /> Sem {p.semester || 'N/A'} &middot; Sec {p.section || 'A'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Detailed Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Academic Profile */}
                <div className="bg-white rounded-[32px] p-10 shadow-xl border border-gray-100 space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                        <BookOpen size={120} />
                    </div>
                    <h3 className="font-black text-[#003B73] text-xs uppercase tracking-[0.3em] flex items-center gap-3">
                        <div className="w-8 h-1 bg-[#003B73] rounded-full"></div> Academic Profile
                    </h3>
                    <div className="space-y-6">
                        {[
                            { label: 'Roll Number', value: p.rollNo },
                            { label: 'Register Number', value: p.registerNumber || '-' },
                            { label: 'Current Year', value: p.year ? `Year ${p.year}` : '-' },
                            { label: 'Batch Code', value: p.batch || p.batchCode || '-' },
                            { label: 'Regulation', value: p.regulation || '2021' },
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center group/item hover:translate-x-1 transition-transform">
                                <span className="text-gray-400 text-xs font-black uppercase tracking-wider">{item.label}</span>
                                <span className="font-black text-gray-900 text-sm bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">{item.value}</span>
                            </div>
                        ))}
                        <div className="pt-4 flex justify-between items-center">
                            <span className="text-gray-400 text-xs font-black uppercase tracking-wider">Status</span>
                            <span className={`px-5 py-2 rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-sm ${
                                p.status === 'ACTIVE' 
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                    : 'bg-gray-50 text-gray-500 border border-gray-100'
                            }`}>
                                {p.status || 'ACTIVE'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Family & Personal Info */}
                <div className="bg-white rounded-[32px] p-10 shadow-xl border border-gray-100 space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                        <User size={120} />
                    </div>
                    <h3 className="font-black text-[#003B73] text-xs uppercase tracking-[0.3em] flex items-center gap-3">
                        <div className="w-8 h-1 bg-[#003B73] rounded-full"></div> Personal Background
                    </h3>
                    <div className="space-y-6">
                        {[
                            { label: "Father's Name", value: p.fatherName || 'N/A' },
                            { label: "Mother's Name", value: p.motherName || 'N/A' },
                            { label: 'Date of Birth', value: p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : 'N/A' },
                            { label: 'Blood Group', value: p.bloodGroup || 'N/A' },
                            { label: 'Gender', value: p.gender || 'N/A' },
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center group/item hover:translate-x-1 transition-transform">
                                <span className="text-gray-400 text-xs font-black uppercase tracking-wider">{item.label}</span>
                                <span className="font-black text-gray-900 text-sm bg-blue-50/50 px-3 py-1.5 rounded-xl border border-blue-50">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-[#0F172A] rounded-[32px] p-10 shadow-2xl space-y-8 relative overflow-hidden group text-white">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Phone size={120} className="text-blue-400" />
                    </div>
                    <h3 className="font-black text-blue-400 text-xs uppercase tracking-[0.3em] flex items-center gap-3">
                        <div className="w-8 h-1 bg-blue-400 rounded-full"></div> Communication
                    </h3>
                    <div className="space-y-8">
                        <div className="space-y-2">
                            <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Mail size={12} className="text-blue-400" /> Official Email
                            </span>
                            <p className="font-bold text-lg text-blue-50 break-all">{p.email || 'Not provided'}</p>
                        </div>
                        <div className="space-y-2">
                            <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Phone size={12} className="text-blue-400" /> Primary Contact
                            </span>
                            <p className="font-bold text-lg text-blue-50">{p.phoneNumber || 'Not provided'}</p>
                        </div>
                        <div className="space-y-2">
                            <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <MapPin size={12} className="text-blue-400" /> Residential Address
                            </span>
                            <p className="font-bold text-sm text-gray-300 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                                {p.address || 'Address details not provided in system.'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="pt-4 text-center">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-white/5 py-3 rounded-2xl border border-white/5">
                            Information is Locked &middot; Contact Admin to Update
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;
