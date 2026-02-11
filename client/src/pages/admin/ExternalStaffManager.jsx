import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Mail, X, Calendar, BookOpen, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import toast from 'react-hot-toast';

const ExternalStaffManager = () => {
    const [tasks, setTasks] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [showWizard, setShowWizard] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        staffId: '',
        subjectId: '',
        deadline: ''
    });

    const [newStaff, setNewStaff] = useState({
        username: '',
        password: '',
        fullName: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tasksRes, subjectsRes, staffRes] = await Promise.all([
                api.get('external/admin/tasks'),
                api.get('admin/subjects'),
                api.get('external/admin/staff')
            ]);

            setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
            setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
            setStaffList(Array.isArray(staffRes.data) ? staffRes.data : []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load external staff data');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignTask = async (e) => {
        e.preventDefault();

        if (!formData.staffId) {
            toast.error('Please select an external staff');
            return;
        }
        if (!formData.subjectId) {
            toast.error('Please select a subject');
            return;
        }
        if (!formData.deadline) {
            toast.error('Please select a deadline');
            return;
        }

        try {
            await api.post('external/admin/assign-task', formData);
            toast.success('Task assigned successfully');
            setShowWizard(false);
            setFormData({ staffId: '', subjectId: '', deadline: '' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign task');
        }
    };

    const updateStatus = async (taskId, status) => {
        try {
            await api.post('external/admin/update-status', { taskId, status });
            toast.success(`Status updated to ${status}`);
            fetchData();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        try {
            await api.post('external/admin/staff', newStaff);
            toast.success('External staff created successfully');
            setShowCreateModal(false);
            setNewStaff({ username: '', password: '', fullName: '' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create staff');
        }
    };

    const handleDeleteStaff = async (id) => {
        if (!window.confirm('Are you sure you want to delete this external staff member? This will also remove all their assigned tasks.')) return;
        try {
            await api.delete(`external/admin/staff/${id}`);
            toast.success('Staff member removed');
            fetchData();
        } catch (error) {
            console.error('Delete staff error:', error);
            toast.error('Failed to remove staff');
        }
    };

    const handleDeleteTask = async (id) => {
        if (!window.confirm('Are you sure you want to remove this assigned task?')) return;
        try {
            await api.delete(`external/admin/tasks/${id}`);
            toast.success('Task removed successfully');
            fetchData();
        } catch (error) {
            console.error('Delete task error:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to remove task';
            toast.error(msg);
        }
    };

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar role="ADMIN" />
            <div className="flex-1 ml-64 p-8 animate-fadeIn pb-24">
                <Header title="External Staff Management" />
                <div className="max-w-6xl mx-auto mt-24">
                    <div className="flex flex-col items-center text-center mb-12 gap-6 pt-4">
                        <div className="animate-slideUp">
                            <h1 className="text-4xl font-black text-[#003B73] flex items-center justify-center gap-3">
                                <Users size={40} className="text-blue-600" /> External Staff Management
                            </h1>
                            <p className="text-gray-500 font-medium mt-3 text-lg">Register external experts and manage their question setting assignments</p>
                        </div>
                        <div className="flex gap-4 w-full max-w-sm justify-center">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95"
                            >
                                <UserPlus size={20} /> Register Staff
                            </button>
                            <button
                                onClick={() => setShowWizard(true)}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all hover:scale-105 active:scale-95"
                            >
                                <Calendar size={20} /> Assign Task
                            </button>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group hover:shadow-xl transition-shadow text-center">
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Staff</p>
                                <p className="text-4xl font-black text-[#003B73]">{staffList.length}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group hover:shadow-xl transition-shadow text-center">
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Tasks</p>
                                <p className="text-4xl font-black text-gray-800">{tasks.length}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group hover:shadow-xl transition-shadow text-center">
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Pending Papers</p>
                                <p className="text-4xl font-black text-orange-500">{tasks.filter(t => t.status === 'ASSIGNED').length}</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group hover:shadow-xl transition-shadow border-l-4 border-l-green-500 text-center">
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Approved</p>
                                <p className="text-4xl font-black text-green-500">{tasks.filter(t => t.status === 'APPROVED').length}</p>
                            </div>
                        </div>

                        {/* Staff Table */}
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                            <div className="p-5 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                                <h3 className="font-bold text-[#003B73] flex items-center gap-2">
                                    <Users size={20} className="text-indigo-500" /> Registered External Staff
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-center">
                                    <thead className="bg-[#003B73] text-white text-xs">
                                        <tr>
                                            <th className="px-6 py-4 font-bold uppercase tracking-widest">Full Name</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-widest">Username</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-widest">Registered</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {staffList.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic font-medium">
                                                    No external staff members registered yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            staffList.map((staff, idx) => (
                                                <tr key={staff.id} className="hover:bg-blue-50/30 transition-colors animate-fadeIn" style={{ animationDelay: `${idx * 50}ms` }}>
                                                    <td className="px-6 py-4 font-bold text-gray-800">{staff.fullName}</td>
                                                    <td className="px-6 py-4 font-mono text-sm text-[#003B73]">{staff.username}</td>
                                                    <td className="px-6 py-4 text-xs font-bold text-gray-400">
                                                        {new Date(staff.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleDeleteStaff(staff.id)}
                                                            className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all"
                                                            title="Delete Staff"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Tasks Table */}
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                            <div className="p-5 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                                <h3 className="font-bold text-[#003B73] flex items-center gap-2">
                                    <Mail size={20} className="text-blue-500" /> Active Question Setter Tasks
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-center">
                                    <thead className="bg-[#003B73] text-white text-xs">
                                        <tr>
                                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-left">Staff Name</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-left">Subject Details</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-center">Deadline</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-center">Status</th>
                                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-sm">
                                        {tasks.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-24 text-center text-gray-400 italic font-medium">
                                                    No paper setting tasks assigned yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            tasks.map((task, idx) => (
                                                <tr key={task.id} className="hover:bg-blue-50/30 transition-colors animate-fadeIn" style={{ animationDelay: `${idx * 50}ms` }}>
                                                    <td className="px-6 py-4 font-bold text-gray-800">{task.staff?.fullName}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-[#003B73]">{task.subject?.name}</div>
                                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{task.subject?.code}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-medium text-gray-600">
                                                        {new Date(task.deadline).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${task.status === 'ASSIGNED' ? 'bg-blue-50 text-blue-600' :
                                                            task.status === 'SUBMITTED' ? 'bg-orange-50 text-orange-600' :
                                                                task.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                                                                    'bg-gray-50 text-gray-400'
                                                            }`}>
                                                            {task.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                                                        {task.status === 'SUBMITTED' && (
                                                            <button
                                                                onClick={() => updateStatus(task.id, 'APPROVED')}
                                                                className="text-[10px] font-black uppercase bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                                                            >
                                                                Approve
                                                            </button>
                                                        )}
                                                        {task.questionPaperUrl && (
                                                            <a
                                                                href={task.questionPaperUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-blue-500 hover:text-blue-700 transition-colors p-2 rounded-lg hover:bg-blue-50"
                                                                title="View Question Paper"
                                                            >
                                                                <BookOpen size={18} />
                                                            </a>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteTask(task.id)}
                                                            className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all"
                                                            title="Delete Task"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Assignment Wizard Modal */}
                    {showWizard && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slideIn">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-600">
                                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                        <UserPlus size={20} /> Assign External Staff
                                    </h3>
                                    <button onClick={() => setShowWizard(false)} className="text-white hover:rotate-90 transition-all duration-300">
                                        <X size={24} />
                                    </button>
                                </div>
                                <form onSubmit={handleAssignTask} className="p-6 space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <Users size={16} className="text-blue-500" /> Select External Staff
                                        </label>
                                        <select
                                            required
                                            value={formData.staffId}
                                            onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        >
                                            <option value="">Choose Staff...</option>
                                            {staffList.map(staff => (
                                                <option key={staff.id} value={staff.id}>{staff.fullName} ({staff.username})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <BookOpen size={16} className="text-blue-500" /> Select Subject
                                        </label>
                                        <select
                                            required
                                            value={formData.subjectId}
                                            onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        >
                                            <option value="">Choose Subject...</option>
                                            {subjects.map(sub => (
                                                <option key={sub.id} value={sub.id}>{sub.code} - {sub.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <Calendar size={16} className="text-blue-500" /> Submission Deadline
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.deadline}
                                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            Confirm Assignment
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Register New Staff Modal */}
                    {showCreateModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slideIn">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-600">
                                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                        <UserPlus size={20} /> Register External Staff
                                    </h3>
                                    <button onClick={() => setShowCreateModal(false)} className="text-white hover:rotate-90 transition-all duration-300">
                                        <X size={24} />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateStaff} className="p-6 space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={newStaff.fullName}
                                            onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="e.g. Dr. Jane Smith"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={newStaff.username}
                                            onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="e.g. jsmith_ext"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={newStaff.password}
                                            onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            Register Staff Member
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExternalStaffManager;
