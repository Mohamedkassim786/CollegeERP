import React, { useContext, useEffect, useState } from 'react';
import { BarChart2, Users, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';
import { getDepartmentAttendanceReport, exportAttendanceExcel } from '../../services/attendance.service';
import AuthContext from '../../context/AuthProvider';
import CustomSelect from '../../components/CustomSelect';
import { getDepartments, getSections } from '../../services/department.service';
import { SEMESTER_OPTIONS } from '../../utils/constants';

const HODAttendanceReport = () => {
    const { auth } = useContext(AuthContext);
    const [semester, setSemester] = useState('');
    const [section, setSection] = useState('');
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [deptInfo, setDeptInfo] = useState(null);
    const [sections, setSections] = useState([]);
    const dept = auth?.department;

    useEffect(() => {
        const loadDeptInfo = async () => {
            try {
                const [deptRes, secRes] = await Promise.all([
                    getDepartments(),
                    getSections()
                ]);
                const dInfo = deptRes.data?.find(d => d.code === dept || d.name === dept);
                setDeptInfo(dInfo);
                
                const sList = secRes.data?.filter(s => s.departmentId === dInfo?.id).map(s => s.name) || [];
                setSections([...new Set(sList)]);
            } catch (err) {
                console.error("Failed to load department info", err);
            }
        };
        if (dept) loadDeptInfo();
    }, [dept]);

    const fetchReport = async () => {
        if (!semester) return;
        setLoading(true);
        setError('');
        try {
            const res = await getDepartmentAttendanceReport({ 
                department: dept, 
                semester: parseInt(semester), 
                section: section || undefined 
            });
            setReport(Array.isArray(res.data) ? res.data : res.data.students || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load report.');
        }
        setLoading(false);
    };

    const handleExport = async () => {
        try {
            const res = await exportAttendanceExcel({ department: dept, semester: parseInt(semester), section: section || undefined });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Attendance_${dept}_Sem${semester}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError('Export failed. Please try again.');
        }
    };

    const getColor = (pct) => {
        if (pct >= 75) return 'text-green-600 bg-green-50';
        if (pct >= 65) return 'text-orange-600 bg-orange-50';
        return 'text-red-600 bg-red-50';
    };

    const getOverall = (avg) => {
        if (avg >= 75) return { label: 'Eligible', icon: CheckCircle, cls: 'text-green-600' };
        if (avg >= 65) return { label: 'Condonation', icon: AlertTriangle, cls: 'text-orange-500' };
        return { label: 'Detained', icon: XCircle, cls: 'text-red-600' };
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3">
                <BarChart2 className="text-blue-600" size={28} />
                <div>
                    <h1 className="text-2xl font-black text-[#003B73]">Department Attendance Report</h1>
                    <p className="text-gray-500 text-sm">{dept} — Consolidated subject-wise attendance</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Semester</label>
                    <CustomSelect value={semester} onChange={e => setSemester(e.target.value)}>
                        <option value="">Select Semester</option>
                        {(SEMESTER_OPTIONS[deptInfo?.degree || 'B.E.'] || [1, 2, 3, 4, 5, 6, 7, 8]).map(s => (
                            <option key={s} value={s}>Semester {s}</option>
                        ))}
                    </CustomSelect>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Section (optional)</label>
                    <CustomSelect value={section} onChange={e => setSection(e.target.value)}>
                        <option value="">All Sections</option>
                        {(sections.length > 0 ? sections : ['A', 'B', 'C']).map(s => (
                            <option key={s} value={s}>Section {s}</option>
                        ))}
                    </CustomSelect>
                </div>
                <button onClick={fetchReport}
                    className="bg-[#003B73] text-white px-8 h-[52px] rounded-[14px] font-black text-sm hover:bg-[#002850] transition-all shadow-lg shadow-blue-900/10 flex items-center gap-2">
                    <Users size={18} /> LOAD REPORT
                </button>

                {report.length > 0 && (
                    <button onClick={handleExport}
                        className="bg-white border border-[#003B73] text-[#003B73] px-6 h-[52px] rounded-[14px] font-black text-sm hover:bg-blue-50 transition-all flex items-center gap-2">
                        <Download size={18} /> EXPORT
                    </button>
                )}
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-[#003B73] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : report.length > 0 ? (
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#003B73] text-white text-xs uppercase">
                            <tr>
                                <th className="px-4 py-3">Roll No</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3 text-center">Avg %</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                {report[0]?.subjects?.map(s => (
                                    <th key={s.subjectId} className="px-3 py-3 text-center">{s.subjectCode}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {report.map(row => {
                                const avg = row.subjects?.length > 0
                                    ? (row.subjects.reduce((acc, s) => acc + (s.percent || 0), 0) / row.subjects.length).toFixed(1)
                                    : 0;
                                const { label, icon: Icon, cls } = getOverall(parseFloat(avg));
                                return (
                                    <tr key={row.studentId} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-mono text-[#003B73] font-bold">{row.rollNo}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{row.name}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getColor(parseFloat(avg))}`}>{avg}%</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className={`flex items-center justify-center gap-1 text-xs font-bold ${cls}`}>
                                                <Icon size={14} /> {label}
                                            </div>
                                        </td>
                                        {row.subjects?.map(s => (
                                            <td key={s.subjectId} className="px-3 py-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getColor(s.percent)}`}>
                                                    {s.percent?.toFixed(1)}%
                                                </span>
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : !loading && semester && (
                <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-gray-200 text-gray-400">
                    <BarChart2 className="mx-auto mb-3 opacity-20" size={48} />
                    <p>No data found for the selected filters.</p>
                </div>
            )}
        </div>
    );
};

export default HODAttendanceReport;
