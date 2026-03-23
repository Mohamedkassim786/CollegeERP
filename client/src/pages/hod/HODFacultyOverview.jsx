import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Eye } from 'lucide-react';
import api from '../../api/axios';
import AuthContext from '../../context/AuthProvider';
import { getPhotoUrl } from '../../utils/helpers';

const HODFacultyOverview = () => {
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();
    const [facultyList, setFacultyList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFaculty = async () => {
            try {
                const isFYC = auth?.computedRoles?.includes('FIRST_YEAR_COORDINATOR');
                const myDeptId = auth?.departmentId;
                
                let url = '/admin/faculty';
                if (isFYC) url += '?isFirstYear=true';
                else if (myDeptId) url += `?departmentId=${myDeptId}`;

                const res = await api.get(url);
                const myDept = auth?.department;

                let deptFaculty = res.data || [];

                if (!isFYC) {
                    deptFaculty = deptFaculty.filter(f => {
                        // Filter by ID if available (robust)
                        if (myDeptId && f.departmentId) {
                            return f.departmentId == myDeptId; // Loose equality for string/number mismatch
                        }
                        // Fallback to name-based filtering with trimming and case-insensitivity
                        const facultyDept = f.department?.trim().toLowerCase();
                        const userDept = myDept?.trim().toLowerCase();
                        return facultyDept === userDept;
                    });
                }
                setFacultyList(deptFaculty);
            } catch (err) {
                console.error('Failed to load faculty', err);
            } finally {
                setLoading(false);
            }
        };
        fetchFaculty();
    }, [auth?.department, auth?.departmentId, auth?.computedRoles]);


    if (loading) return (
        <div className="h-64 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#003B73] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-black text-[#003B73] tracking-tight">Faculty Overview</h2>
                <p className="text-gray-500 font-bold text-sm mt-1 uppercase tracking-widest">
                    {auth?.computedRoles?.includes('FIRST_YEAR_COORDINATOR') ? 'All 1st Year Teaching Staff' : `${auth?.department} Department`} — {facultyList.length} Staff Members
                </p>
            </div>

            {facultyList.length === 0 ? (
                <div className="bg-white rounded-[40px] p-20 text-center border border-gray-100 shadow-xl">
                    <GraduationCap size={64} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-xl font-black text-gray-300 uppercase tracking-widest">No Faculty Found</p>
                    <p className="text-gray-400 mt-2 font-medium">No faculty assigned to {auth?.computedRoles?.includes('FIRST_YEAR_COORDINATOR') ? '1st Year subjects' : auth?.department} yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {facultyList.map((faculty) => {
                        const photoUrl = getPhotoUrl(faculty.photo, 'faculty');
                        const initials = (faculty.fullName || 'F')
                            .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                        return (
                            <div key={faculty.id}
                                className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden hover:-translate-y-1 transition-all duration-300">
                                <div className="h-2 w-full bg-gradient-to-r from-[#003B73] to-blue-500" />
                                <div className="p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        {photoUrl ? (
                                            <img src={photoUrl} alt={faculty.fullName}
                                                className="w-14 h-14 rounded-2xl object-cover border-2 border-gray-100" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#003B73] to-blue-600 flex items-center justify-center text-white font-black text-lg">
                                                {initials}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-[#003B73] text-sm truncate">{faculty.fullName}</p>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest truncate">
                                                {faculty.designation || 'Faculty'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-1 bg-blue-50 text-[#003B73] rounded-lg font-black text-[10px] uppercase tracking-widest">
                                                {faculty.staffId}
                                            </span>
                                            <span className={`px-2 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest ${
                                                faculty.isActive !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                            }`}>
                                                {faculty.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        {faculty.email && (
                                            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium truncate">
                                                <Mail size={12} />
                                                <span className="truncate">{faculty.email}</span>
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-400 font-semibold">
                                            {faculty.assignments?.length || 0} Subject(s) Assigned
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/hod/faculty/${faculty.id}`)}
                                        className="w-full py-3 bg-[#003B73] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#002850] transition-all flex items-center justify-center gap-2">
                                        <Eye size={14} /> View Profile
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default HODFacultyOverview;
