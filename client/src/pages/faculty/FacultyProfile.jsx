import React, { useContext, useEffect, useState, useRef } from 'react';
import { User, Upload, Save, Camera, Lock, Key, Eye, EyeOff } from 'lucide-react';
import { getMyProfile, updateProfile, uploadProfilePhoto, changePassword } from '../../services/profile.service';
import AuthContext from '../../context/AuthProvider';

const FacultyProfile = () => {
    const { auth, login } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [tab, setTab] = useState('profile');
    const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
    const [showPw, setShowPw] = useState(false);
    const fileRef = useRef();

    useEffect(() => {
        getMyProfile()
            .then(r => setProfile(r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const save = async () => {
        setSaving(true); setMsg('');
        try {
            await updateProfile({
                fullName: profile.fullName,
                email: profile.email,
                phoneNumber: profile.phoneNumber,
                designation: profile.designation,
                employeeId: profile.employeeId,
            });
            setMsg('Profile updated successfully.');
        } catch (e) {
            setMsg(e.response?.data?.message || 'Update failed.');
        }
        setSaving(false);
    };

    const uploadPhoto = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const form = new FormData();
        form.append('photo', file);
        try {
            const res = await uploadProfilePhoto(form);
            setProfile(p => ({ ...p, photoUrl: res.data.photoUrl }));
            setMsg('Photo updated.');
        } catch (e) {
            setMsg('Photo upload failed.');
        }
    };

    const changePassword = async () => {
        if (pwForm.newPw !== pwForm.confirm) { setMsg('Passwords do not match.'); return; }
        if (pwForm.newPw.length < 6) { setMsg('Too short (min 6).'); return; }
        setSaving(true); setMsg('');
        try {
            await changePassword({ currentPassword: pwForm.current, newPassword: pwForm.newPw });
            setMsg('Password changed!');
            setPwForm({ current: '', newPw: '', confirm: '' });
        } catch (e) {
            setMsg(e.response?.data?.message || 'Failed.');
        }
        setSaving(false);
    };

    if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#003B73] border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            <h1 className="text-2xl font-black text-[#003B73] flex items-center gap-3"><User /> My Profile</h1>

            {/* Tabs */}
            <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl w-fit">
                {[['profile', 'Profile'], ['password', 'Change Password']].map(([k, l]) => (
                    <button key={k} onClick={() => { setTab(k); setMsg(''); }}
                        className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${tab === k ? 'bg-white shadow text-[#003B73]' : 'text-gray-500 hover:text-gray-700'}`}>
                        {l}
                    </button>
                ))}
            </div>

            {msg && <div className={`p-4 rounded-xl text-sm font-medium ${msg.includes('success') || msg.includes('changed') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}

            {tab === 'profile' && profile && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
                    {/* Photo */}
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                                {profile.photoUrl
                                    ? <img src={`http://localhost:3000${profile.photoUrl}`} alt="profile" className="w-full h-full object-cover" />
                                    : <User size={36} className="text-gray-400" />
                                }
                            </div>
                            <button onClick={() => fileRef.current?.click()}
                                className="absolute -bottom-2 -right-2 p-2 bg-[#003B73] text-white rounded-xl shadow-lg hover:bg-[#002850] transition-all">
                                <Camera size={14} />
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
                        </div>
                        <div>
                            <p className="text-xl font-black text-gray-800">{profile.fullName || auth?.username}</p>
                            <p className="text-sm text-gray-500">{profile.role} · {profile.department}</p>
                            {profile.employeeId && <p className="text-xs text-gray-400 mt-0.5">EMP: {profile.employeeId}</p>}
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Full Name', key: 'fullName', type: 'text' },
                            { label: 'Employee ID', key: 'employeeId', type: 'text' },
                            { label: 'Email', key: 'email', type: 'email' },
                            { label: 'Phone', key: 'phoneNumber', type: 'tel' },
                            { label: 'Designation', key: 'designation', type: 'text' },
                            { label: 'Department', key: 'department', type: 'text', readOnly: true },
                        ].map(({ label, key, type, readOnly }) => (
                            <div key={key}>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                                <input
                                    type={type}
                                    readOnly={readOnly}
                                    value={(profile[key] || '')}
                                    onChange={e => !readOnly && setProfile(p => ({ ...p, [key]: e.target.value }))}
                                    className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B73] ${readOnly ? 'bg-gray-50 text-gray-400' : 'bg-white'}`}
                                />
                            </div>
                        ))}
                    </div>

                    <button onClick={save} disabled={saving}
                        className="w-full py-3 bg-[#003B73] text-white rounded-xl font-black text-sm hover:bg-[#002850] transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                        <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            )}

            {tab === 'password' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
                    <div className="flex items-center gap-3 text-gray-700 mb-2">
                        <Key size={20} /> <span className="font-bold">Change Password</span>
                    </div>
                    {[
                        { label: 'Current Password', key: 'current' },
                        { label: 'New Password (min 6)', key: 'newPw' },
                        { label: 'Confirm New Password', key: 'confirm' },
                    ].map(({ label, key }) => (
                        <div key={key}>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={pwForm[key]}
                                    onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-[#003B73]"
                                />
                                <button onClick={() => setShowPw(v => !v)} className="absolute right-3 top-3 text-gray-400">
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    ))}
                    <button onClick={changePassword} disabled={saving}
                        className="w-full py-3 bg-[#003B73] text-white rounded-xl font-black text-sm hover:bg-[#002850] transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                        <Lock size={16} /> {saving ? 'Changing...' : 'Change Password'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default FacultyProfile;
