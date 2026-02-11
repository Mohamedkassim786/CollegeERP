import React, { useState, useEffect, useCallback } from 'react';
import { Award, Lock, Unlock, CheckCircle, Save, Filter, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import toast from 'react-hot-toast';

const ExamControlCenter = () => {
    const [status, setStatus] = useState({
        department: '',
        year: '',
        semester: '',
        section: '',
        markEntryOpen: false,
        isPublished: false,
        isLocked: false
    });

    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchInitialData = async () => {
        try {
            const deptsRes = await api.get('/admin/departments');
            setDepartments(deptsRes.data);
            if (deptsRes.data.length > 0) {
                setStatus(prev => ({ ...prev, department: deptsRes.data[0].name }));
            }
        } catch (error) {
            toast.error('Failed to load departments');
        }
    };

    const fetchCurrentStatus = useCallback(async () => {
        if (!status.department || !status.year || !status.semester || !status.section) return;

        setLoading(true);
        try {
            const res = await api.get('/exam/semester-control', {
                params: {
                    department: status.department,
                    year: status.year,
                    semester: status.semester,
                    section: status.section
                }
            });
            setStatus(prev => ({
                ...prev,
                markEntryOpen: res.data.markEntryOpen,
                isPublished: res.data.isPublished,
                isLocked: res.data.isLocked
            }));
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch status');
        } finally {
            setLoading(false);
        }
    }, [status.department, status.year, status.semester, status.section]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchCurrentStatus();
    }, [fetchCurrentStatus]);

    const toggleControl = async (field) => {
        if (!status.department || !status.year || !status.semester || !status.section) {
            toast.error('Please select all filters first');
            return;
        }

        try {
            const newValue = !status[field];
            await api.post('/exam/semester-control', {
                department: status.department,
                year: status.year,
                semester: status.semester,
                section: status.section,
                field,
                value: newValue
            });
            setStatus(prev => ({ ...prev, [field]: newValue }));
            toast.success(`Control updated successfully`);
        } catch (error) {
            toast.error('Failed to update control');
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar role="ADMIN" />
            <div className="flex-1 flex flex-col ml-64 transition-all duration-300">
                <Header title="Exam Control Center" />
                <main className="flex-1 p-8 mt-24 overflow-y-auto animate-fadeIn">
                    <div className="max-w-6xl mx-auto w-full">
                        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Award className="text-blue-600" /> Administrative Exam Controls
                        </h1>

                        {/* Filter Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Department</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={status.department}
                                        onChange={e => setStatus({ ...status, department: e.target.value })}
                                    >
                                        <option value="">Select...</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.name}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Semester</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={status.semester}
                                        onChange={e => {
                                            const sem = parseInt(e.target.value);
                                            const year = Math.ceil(sem / 2);
                                            setStatus({ ...status, semester: e.target.value, year: year.toString() });
                                        }}
                                    >
                                        <option value="">Select...</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Section</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={status.section}
                                        onChange={e => setStatus({ ...status, section: e.target.value })}
                                    >
                                        <option value="">Select...</option>
                                        {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>Section {s}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={fetchCurrentStatus}
                                        disabled={loading}
                                        className="w-full bg-[#003B73] text-white py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {loading ? <RefreshCw className="animate-spin" size={18} /> : <Filter size={18} />}
                                        Refresh Status
                                    </button>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <RefreshCw size={48} className="animate-spin mb-4" />
                                <p>Fetching control status...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="font-semibold mb-4 text-gray-700">Mark Entry Controls</h3>
                                    <p className="text-sm text-gray-500 mb-4">Enable or disable mark entry for faculty.</p>
                                    <button
                                        onClick={() => toggleControl('markEntryOpen')}
                                        className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${status.markEntryOpen ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                    >
                                        {status.markEntryOpen ? <Lock size={18} /> : <Unlock size={18} />}
                                        {status.markEntryOpen ? 'Close Mark Entry' : 'Open Mark Entry'}
                                    </button>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="font-semibold mb-4 text-gray-700">Result Management</h3>
                                    <p className="text-sm text-gray-500 mb-4">Make results visible to students and faculty.</p>
                                    <button
                                        onClick={() => toggleControl('isPublished')}
                                        className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${status.isPublished ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                    >
                                        <CheckCircle size={18} />
                                        {status.isPublished ? 'Unpublish Results' : 'Publish Results'}
                                    </button>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="font-semibold mb-4 text-gray-700">Permanent Lock</h3>
                                    <p className="text-sm text-gray-500 mb-4">Grant final approval and lock all records.</p>
                                    <button
                                        onClick={() => toggleControl('isLocked')}
                                        className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${status.isLocked ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        <Lock size={18} />
                                        {status.isLocked ? 'Semester Locked' : 'Lock Semester Permanently'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ExamControlCenter;
