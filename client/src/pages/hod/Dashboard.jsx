import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, BookOpen, Clock, Activity, FileCheck, 
    ArrowRight, UserCheck, ShieldCheck
} from 'lucide-react';
import { getHODDashboard } from '../../services/dashboard.service';

const HODDashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await getHODDashboard();
            setData(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="h-96 flex items-center justify-center"><div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-[#003B73] tracking-tight">Department Portal</h2>
                    <p className="text-gray-500 font-bold text-sm mt-1 uppercase tracking-widest">Head of Department Panel</p>
                </div>
                <div className="flex gap-4">
                    <button className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100">Dept Reports</button>
                </div>
            </div>

            {/* HOD Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-xl shadow-gray-200/50 group hover:border-emerald-500 transition-all duration-500">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4"><Users size={24}/></div>
                    <h3 className="text-3xl font-black text-[#003B73] mb-1">{data?.studentCount || 0}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enrolled Students</p>
                </div>
                <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-xl shadow-gray-200/50 group hover:border-emerald-500 transition-all duration-500">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><UserCheck size={24}/></div>
                    <h3 className="text-3xl font-black text-[#003B73] mb-1">{data?.activeStudents || 0}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Attendance</p>
                </div>
                <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-xl shadow-gray-200/50 group hover:border-emerald-500 transition-all duration-500">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4"><ShieldCheck size={24}/></div>
                    <h3 className="text-3xl font-black text-[#003B73] mb-1">{data?.avgAttendance || 0}%</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Daily Average %</p>
                </div>
                <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-xl shadow-gray-200/50 group hover:border-emerald-500 transition-all duration-500">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4"><FileCheck size={24}/></div>
                    <h3 className="text-3xl font-black text-[#003B73] mb-1">{data?.pendingApprovals || 0}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Approvals</p>
                </div>
            </div>

            {/* Department Roster / Quick View */}
            <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-black text-[#003B73] flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><BookOpen size={24}/></div>
                        Recent Student Activity
                    </h3>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <tr>
                                <th className="px-8 py-4">Student</th>
                                <th className="px-8 py-4">Roll No</th>
                                <th className="px-8 py-4">Year/Sec</th>
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4 text-right">Activity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data?.students?.map(student => (
                                <tr key={student.id} className="group hover:bg-gray-50/50 transition-all">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center font-black text-[#003B73] shadow-sm">{(student.name || 'S').charAt(0)}</div>
                                            <span className="font-extrabold text-gray-800">{student.name || 'Student'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 font-mono font-bold text-gray-500">{student.rollNo}</td>
                                    <td className="px-8 py-6 font-bold text-gray-400 uppercase text-xs">{student.year} Year / {student.section}</td>
                                    <td className="px-8 py-6">
                                        <span className="px-4 py-1.5 bg-green-50 text-green-600 rounded-full font-black text-[10px] uppercase tracking-widest border border-green-100">
                                            {student.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button 
                                            onClick={() => navigate(`/hod/students/profile/${student.id}`)}
                                            className="text-emerald-600 hover:text-emerald-800 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 ml-auto"
                                        >
                                            View Profile <ArrowRight size={14}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HODDashboard;
