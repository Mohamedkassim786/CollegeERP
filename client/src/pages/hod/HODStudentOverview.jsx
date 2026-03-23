import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, User } from 'lucide-react';
import api from '../../api/axios';
import AuthContext from '../../context/AuthProvider';

const HODStudentOverview = () => {
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await api.get('/admin/students');
                const myDept = auth?.department;
                const myDeptId = auth?.departmentId;
                const isFYC = auth?.computedRoles?.includes('FIRST_YEAR_COORDINATOR');

                let deptStudents = res.data || [];
                
                if (!isFYC) {
                    deptStudents = deptStudents.filter(s => {
                        if (myDeptId && s.departmentId) {
                            return s.departmentId == myDeptId; // Loose equality
                        }
                        const studentDept = s.department?.trim().toLowerCase();
                        const userDept = myDept?.trim().toLowerCase();
                        return studentDept === userDept;
                    });
                } else {
                    deptStudents = deptStudents.filter(s => s.year === 1);
                }
                setStudents(deptStudents);
                setFiltered(deptStudents);
            } catch (err) {
                console.error('Failed to load students', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [auth?.department, auth?.departmentId, auth?.computedRoles]);

    useEffect(() => {
        let result = students;
        if (search) {
            const s = search.toLowerCase();
            result = result.filter(st =>
                st.name?.toLowerCase().includes(s) ||
                st.rollNo?.toLowerCase().includes(s) ||
                st.registerNumber?.toLowerCase().includes(s)
            );
        }
        if (yearFilter) result = result.filter(st => String(st.year) === yearFilter);
        if (sectionFilter) result = result.filter(st => st.section === sectionFilter);
        setFiltered(result);
    }, [search, yearFilter, sectionFilter, students]);

    const years = [...new Set(students.map(s => s.year))].filter(Boolean).sort();
    const sections = [...new Set(students.map(s => s.section))].filter(Boolean).sort();

    if (loading) return (
        <div className="h-64 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#003B73] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-black text-[#003B73] tracking-tight">Student Overview</h2>
                <p className="text-gray-500 font-bold text-sm mt-1 uppercase tracking-widest">
                    {auth?.computedRoles?.includes('FIRST_YEAR_COORDINATOR') ? 'All 1st Year Students' : auth?.department} — {students.length} Students
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text"
                        placeholder="Search by name or roll number..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#003B73]/20"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="px-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold outline-none"
                    value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                    <option value="">All Years</option>
                    {years.map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
                <select className="px-4 py-3 bg-gray-50 rounded-2xl text-sm font-bold outline-none"
                    value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
                    <option value="">All Sections</option>
                    {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
                <div className="px-4 py-3 bg-blue-50 text-[#003B73] rounded-2xl font-black text-sm">
                    {filtered.length} Students
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="p-20 text-center">
                        <Users size={64} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-xl font-black text-gray-300 uppercase tracking-widest">No Students Found</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <tr>
                                <th className="px-8 py-5">Student</th>
                                <th className="px-8 py-5">Roll No</th>
                                <th className="px-8 py-5">Register No</th>
                                <th className="px-8 py-5">Year / Sem</th>
                                <th className="px-8 py-5">Section</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(student => (
                                <tr key={student.id} className="hover:bg-gray-50/50 transition-all duration-150 hover:translate-x-1">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-[#003B73] to-blue-500 rounded-xl flex items-center justify-center text-white font-black text-sm">
                                                {(student.name || 'S').charAt(0)}
                                            </div>
                                            <span className="font-bold text-gray-800">{student.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 font-mono font-bold text-[#003B73] text-sm">{student.rollNo}</td>
                                    <td className="px-8 py-5 font-mono text-sm text-gray-500">{student.registerNumber || '—'}</td>
                                    <td className="px-8 py-5 font-bold text-gray-500 text-sm">Y{student.year} / S{student.semester}</td>
                                    <td className="px-8 py-5">
                                        <span className="px-3 py-1 bg-blue-50 text-[#003B73] rounded-lg font-black text-[10px] uppercase tracking-widest">
                                            {student.section}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest ${
                                            student.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {student.status || 'ACTIVE'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => navigate(`/hod/students/profile/${student.id}`)}
                                            className="flex items-center gap-2 ml-auto px-4 py-2 bg-[#003B73] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#002850] transition-all">
                                            <User size={12} /> View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default HODStudentOverview;
