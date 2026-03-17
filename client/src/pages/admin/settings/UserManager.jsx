import React, { useState, useEffect } from 'react';
import { 
    Users, Shield, RefreshCw, UserCheck, UserMinus, 
    Search, Plus, ShieldAlert, Mail, Phone, LayoutGrid,
    MoreVertical, Edit3, Trash2, Key, Activity
} from 'lucide-react';
import { 
    getSystemUsers, 
    createSystemUser, 
    toggleUserStatus, 
    resetSystemUserPassword,
    deleteSystemUser
} from '../../../services/settings.service';
import { handleApiError } from '../../../utils/errorHandler';
import { toast } from 'react-hot-toast';

const UserManager = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalMode, setModalMode] = useState('CREATE'); // CREATE | RESET_PASSWORD

    const ROLES = ['ADMIN', 'PRINCIPAL', 'CHIEF_SECRETARY'];

    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        phone: '',
        role: 'ADMIN',
        password: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await getSystemUsers();
            setUsers(response.data);
        } catch (error) {
            handleApiError(error, "Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (user) => {
        if (!window.confirm(`Are you sure you want to ${user.isDisabled ? 'ENABLE' : 'DISABLE'} this account?`)) return;
        try {
            await toggleUserStatus(user.id, { isDisabled: !user.isDisabled });
            toast.success(`Account ${user.isDisabled ? 'enabled' : 'disabled'}`);
            fetchUsers();
        } catch (error) {
            handleApiError(error, "Action failed");
        }
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Permanently delete account @${user.username}? This cannot be undone.`)) return;
        try {
            await deleteSystemUser(user.id);
            toast.success("User deleted");
            fetchUsers();
        } catch (error) {
            handleApiError(error, "Deletion failed");
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'CREATE') {
                await createSystemUser(formData);
                toast.success("User account created");
            } else if (modalMode === 'RESET_PASSWORD') {
                await resetSystemUserPassword(selectedUser.id, { password: formData.password });
                toast.success("Password reset successful");
            }
            setShowModal(false);
            fetchUsers();
            resetForm();
        } catch (error) {
            handleApiError(error, "Operation failed");
        }
    };

    const resetForm = () => {
        setFormData({
            username: '',
            fullName: '',
            email: '',
            phone: '',
            role: 'ADMIN',
            password: ''
        });
        setSelectedUser(null);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             user.username.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesRole = filterRole === 'ALL' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    if (loading) return <div className="h-96 flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#003B73] border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-[#003B73] tracking-tight text-left">System User Management</h2>
                    <p className="text-gray-500 font-bold text-sm mt-1 uppercase tracking-widest text-left">Administrative Accounts Control</p>
                </div>
                <button 
                    onClick={() => { setModalMode('CREATE'); resetForm(); setShowModal(true); }}
                    className="bg-[#003B73] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 flex items-center gap-2 hover:scale-105 transition-all active:scale-95"
                >
                    <Plus size={18} /> Add New Admin
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-[#003B73] transition-all"
                        placeholder="Search by name or username..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 bg-gray-50 p-1.5 rounded-2xl overflow-x-auto">
                    {['ALL', ...ROLES].map(role => (
                        <button
                            key={role}
                            onClick={() => setFilterRole(role)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterRole === role ? 'bg-[#003B73] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <tr>
                                <th className="px-8 py-5">User Account</th>
                                <th className="px-8 py-5">Role</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="group hover:bg-gray-50/50 transition-all">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-[#003B73] text-xl border border-white shadow-sm group-hover:bg-[#003B73] group-hover:text-white transition-all duration-500">
                                                {user.fullName ? user.fullName.charAt(0) : 'U'}
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-gray-800 text-base">{user.fullName || 'Unnamed User'}</p>
                                                <p className="text-xs font-mono text-gray-400">@{user.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border ${
                                            user.role === 'ADMIN' ? 'bg-red-50 text-red-600 border-red-100' :
                                            user.role === 'CHIEF_SECRETARY' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                            'bg-blue-50 text-blue-600 border-blue-100'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${user.isDisabled ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${user.isDisabled ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {user.isDisabled ? 'Disabled' : 'Active'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => { setSelectedUser(user); setModalMode('RESET_PASSWORD'); setShowModal(true); }}
                                                className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                                                title="Reset Password"
                                            >
                                                <Key size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleToggleStatus(user)}
                                                className={`p-3 rounded-xl transition-all ${user.isDisabled ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white'}`}
                                                title={user.isDisabled ? 'Enable' : 'Disable'}
                                            >
                                                {user.isDisabled ? <UserCheck size={16} /> : <UserMinus size={16} />}
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(user)}
                                                className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                                                title="Delete Account"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl animate-scaleIn">
                        <div className="p-10">
                            <h3 className="text-3xl font-black text-[#003B73] mb-2 uppercase tracking-tight">
                                {modalMode === 'CREATE' ? 'Create System Account' : 'Reset Password'}
                            </h3>
                            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-10">
                                {modalMode === 'CREATE' ? 'Add a new administrative user to the system' : `Changing access for ${selectedUser?.fullName}`}
                            </p>

                            <form onSubmit={handleFormSubmit} className="space-y-6">
                                {modalMode === 'CREATE' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name *</label>
                                                <input required className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl font-bold" placeholder="E.g. Admin User" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Username *</label>
                                                <input required className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl font-bold font-mono" placeholder="admin_username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Role *</label>
                                                <select className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl font-black text-[#003B73] uppercase text-xs tracking-widest" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                                                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                                                <input className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl font-bold" type="email" placeholder="admin@miet.edu" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                                            <input className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl font-bold font-mono" placeholder="+91 00000 00000" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                                        </div>
                                        
                                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Password Information</p>
                                            <p className="text-xs text-blue-500 font-bold">Default password: <span className="font-mono text-blue-700">password123</span>. User must change after first login.</p>
                                        </div>
                                    </>
                                )}

                                {modalMode === 'RESET_PASSWORD' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                                        <input required type="password" className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl font-bold" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <button 
                                        type="button"
                                        onClick={() => { setShowModal(false); resetForm(); }}
                                        className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-3xl font-black text-xs uppercase tracking-widest"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-4 bg-[#003B73] text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100"
                                    >
                                        {modalMode === 'CREATE' ? 'Create Account' : 'Reset Password'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManager;
