import React, { useContext, useEffect, useState, useRef } from 'react';
import { User, Camera, Mail, Phone, MapPin, Calendar, Award } from 'lucide-react';
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
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            {msg && <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-xl font-medium text-center">{msg}</div>}

            {/* Banner Area - As per conversation prompt for "larger profile picture and visual hierarchy" */}
            <div className="relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden pt-12 pb-8 px-8 flex flex-col md:flex-row items-center gap-8">
                {/* Background graphic touch */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-[#003B73] to-[#00509E] opacity-10"></div>
                
                <div className="relative z-10 flex-shrink-0">
                    <div className="w-40 h-40 rounded-[2rem] overflow-hidden bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center relative group">
                        {p.photoUrl
                            ? <img src={`http://localhost:3000${p.photoUrl}`} alt="Profile" className="w-full h-full object-cover" />
                            : <User size={56} className="text-gray-300" />
                        }
                        <div onClick={() => fileRef.current?.click()} className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Camera className="text-white" size={28} />
                        </div>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
                </div>

                <div className="relative z-10 text-center md:text-left flex-1">
                    <div className="inline-block px-3 py-1 bg-blue-50 text-[#003B73] text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                        B.E / B.Tech Student
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 mb-2">{p.name || p.fullName || auth?.username}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5"><Award size={18} className="text-amber-500" /> {p.registerNumber || p.rollNo || auth?.username}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 hidden md:block"></span>
                        <span className="flex items-center gap-1.5 text-[#003B73]"><Calendar size={18} /> Sem {p.semester || 'N/A'}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 hidden md:block"></span>
                        <span>{p.department || 'Department'} · Sec {p.section || 'A'}</span>
                    </div>
                </div>
            </div>

            {/* Academic & Personal Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
                    <h3 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3">Academic Info</h3>
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between items-center"><span className="text-gray-500">Roll No</span> <span className="font-bold font-mono">{p.rollNo}</span></div>
                        <div className="flex justify-between items-center"><span className="text-gray-500">Register No</span> <span className="font-bold font-mono">{p.registerNumber || '-'}</span></div>
                        <div className="flex justify-between items-center"><span className="text-gray-500">Admitted Year</span> <span className="font-bold">{p.year ? `Year ${p.year}` : '-'}</span></div>
                        <div className="flex justify-between items-center"><span className="text-gray-500">Batch Code</span> <span className="font-bold">{p.batchCode || '-'}</span></div>
                        <div className="flex justify-between items-center"><span className="text-gray-500">Status</span> 
                            <span className={`px-2.5 py-1 rounded text-xs font-bold ${p.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {p.status || 'ACTIVE'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
                    <h3 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-3">Contact Info</h3>
                    <div className="space-y-4 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-gray-500"><Mail size={16} /> Email</span> 
                            <span className="font-medium text-gray-800">{p.email || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-gray-500"><Phone size={16} /> Phone</span> 
                            <span className="font-medium text-gray-800">{p.phoneNumber || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-gray-500"><MapPin size={16} /> Address</span> 
                            <span className="font-medium text-gray-800 text-right w-1/2 truncate">{p.address || 'Not provided'}</span>
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
                        Contact administration to update locked personal details.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;
