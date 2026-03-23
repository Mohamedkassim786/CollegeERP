import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthProvider';
import { 
    Users, BookOpen, Clock, Activity, FileCheck, 
    ArrowRight, UserCheck, ShieldCheck
} from 'lucide-react';
import { getHODDashboard } from '../../services/dashboard.service';
import useCountUp from '../../hooks/useCountUp';
import SkeletonLoader from '../../components/SkeletonLoader';

const AnimatedValue = ({ value }) => {
  const animated = useCountUp(value);
  return <>{animated}</>;
};

const HODDashboard = () => {
    const navigate = useNavigate();
    const { auth } = useContext(AuthContext);
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
            console.error('HOD Dashboard error:', error.response?.data || error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <SkeletonLoader type="dashboard" />;

    const isFYC = auth?.computedRoles?.includes('FIRST_YEAR_COORDINATOR');

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-[#003B73] tracking-tight">{isFYC ? '1st Year Portal' : 'Department Portal'}</h2>
                    <p className="text-gray-500 font-bold text-sm mt-1 uppercase tracking-widest">{isFYC ? 'First Year Coordinator Panel' : 'Head of Department Panel'}</p>
                </div>
                <div className="flex gap-4">
                    <button className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100">Dept Reports</button>
                </div>
            </div>

            {/* HOD Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-xl shadow-gray-200/50 group hover:border-[#003B73] transition-all duration-500">
                    <div className="w-12 h-12 bg-blue-50 text-[#003B73] rounded-xl flex items-center justify-center mb-4"><Users size={24}/></div>
                    <h3 className="text-3xl font-black text-[#003B73] mb-1"><AnimatedValue value={data?.studentCount || 0} /></h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Students</p>
                </div>
                <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-xl shadow-gray-200/50 group hover:border-[#003B73] transition-all duration-500">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4"><UserCheck size={24}/></div>
                    <h3 className="text-3xl font-black text-[#003B73] mb-1"><AnimatedValue value={data?.facultyCount || 0} /></h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Faculty Members</p>
                </div>
                <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-xl shadow-gray-200/50 group hover:border-[#003B73] transition-all duration-500">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4"><ShieldCheck size={24}/></div>
                    <h3 className="text-3xl font-black text-[#003B73] mb-1"><AnimatedValue value={data?.avgAttendance || 0} />%</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dept. Avg Attendance</p>
                </div>
                <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-xl shadow-gray-200/50 group hover:border-[#003B73] transition-all duration-500">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4"><FileCheck size={24}/></div>
                    <h3 className="text-3xl font-black text-[#003B73] mb-1"><AnimatedValue value={data?.pendingApprovals || 0} /></h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Approvals</p>
                </div>
            </div>

            {/* Department Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Year-wise Attendance */}
                <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-xl shadow-gray-200/50">
                    <h3 className="text-xl font-black text-[#003B73] mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Activity size={20}/></div>
                        Attendance by Year
                    </h3>
                    <div className="space-y-6">
                        {data?.attendanceByYear?.map((item) => (
                            <div key={item.year} className="space-y-2">
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                    <span className="text-gray-400">{item.year} Year</span>
                                    <span className="text-[#003B73]">{item.rate}%</span>
                                </div>
                                <div className="h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                                    <div 
                                        className="h-full bg-gradient-to-r from-[#003B73] to-indigo-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${item.rate}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Faculty Workload */}
                <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-xl shadow-gray-200/50">
                    <h3 className="text-xl font-black text-[#003B73] mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><BookOpen size={20}/></div>
                        Faculty Workload
                    </h3>
                    <div className="space-y-4">
                        {data?.facultyWorkload?.map((fac) => (
                            <div key={fac.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-[#003B73] transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white rounded-lg border border-gray-100 flex items-center justify-center text-[10px] font-black text-[#003B73]">
                                        {fac.name.charAt(0)}
                                    </div>
                                    <span className="font-bold text-gray-700">{fac.name}</span>
                                </div>
                                <div className="text-xs font-black text-gray-400 uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-gray-100 group-hover:bg-[#003B73] group-hover:text-white group-hover:border-[#003B73] transition-all">
                                    {fac.count} Subjects
                                </div>
                            </div>
                        ))}
                        <button 
                            onClick={() => navigate('/hod/faculty')}
                            className="w-full py-3 mt-2 text-xs font-black text-[#003B73] uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            View All Faculty <ArrowRight size={14}/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HODDashboard;
