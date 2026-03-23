import React, { useState, useEffect, useContext } from 'react';
import { Shield, Lock, Search, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { getEligibility, calculateAndSaveEligibility, grantEligibilityException, lockEligibility } from '../../../services/eligibility.service';
import { getDepartments, getSections } from '../../../services/department.service';
import AuthContext from '../../../context/AuthProvider';
import CustomSelect from '../../../components/CustomSelect';
import { SEMESTER_OPTIONS } from '../../../utils/constants';

const statusBadge = (status) => {
    if (status === 'ELIGIBLE')    return <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={10} />Eligible</span>;
    if (status === 'CONDONATION') return <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold flex items-center gap-1"><AlertTriangle size={10} />Condonation</span>;
    return <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={10} />Detained</span>;
};

const AttendanceEligibility = () => {
    const { auth } = useContext(AuthContext);
    const [filters, setFilters] = useState({ department: auth?.department || '', semester: '', section: '' });
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [expandedStudent, setExpandedStudent] = useState(null);
    const [exceptionModal, setExceptionModal] = useState(null);
    const [exceptionReason, setExceptionReason] = useState('');
    const [departments, setDepartments] = useState([]);
    const [dbSections, setDbSections] = useState([]);

    useEffect(() => {
        const loadInfo = async () => {
            try {
                const [deptRes, secRes] = await Promise.all([
                    getDepartments(),
                    getSections()
                ]);
                setDepartments(deptRes.data || []);
                setDbSections(secRes.data || []);
            } catch (err) {
                console.error("Failed to load info", err);
            }
        };
        loadInfo();
    }, []);

    const isAdmin = auth?.role === 'ADMIN';
    const canCalculate = auth?.role === 'ADMIN' || auth?.role === 'HOD';
    const isFirstYear = filters.semester === '1' || filters.semester === '2';

    const fetchEligibility = async () => {
        if (!filters.department || !filters.semester) return;
        setLoading(true); setError('');
        try {
            const res = await getEligibility(filters);
            setData(res.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load eligibility data.');
        }
        setLoading(false);
    };

    const calculateAndSave = async () => {
        setSaving(true);
        try {
            await calculateAndSaveEligibility(filters);
            await fetchEligibility();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to calculate.');
        }
        setSaving(false);
    };

    const lockList = async () => {
        if (!window.confirm('Lock eligibility? This cannot be undone.')) return;
        try {
            await lockEligibility(filters);
            setError('');
            await fetchEligibility();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to lock.');
        }
    };

    const grantException = async (grant) => {
        try {
            await grantEligibilityException({
                eligibilityId: exceptionModal.eligibilityId,
                studentId: exceptionModal.studentId,
                subjectId: exceptionModal.subjectId,
                semester: parseInt(filters.semester),
                reason: exceptionReason,
                grant
            });
            setExceptionModal(null);
            setExceptionReason('');
            await fetchEligibility();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update exception.');
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <Shield className="text-blue-600" size={28} />
                    <div>
                        <h1 className="text-2xl font-black text-[#003B73]">Attendance Eligibility (SA Check)</h1>
                        <p className="text-gray-500 text-sm">Exam-eligibility based on attendance: Eligible ≥75% · Condonation 65–74% · Detained &lt;65%</p>
                    </div>
                </div>
                {canCalculate && data.length > 0 && (
                    <div className="flex gap-3">
                        <button onClick={calculateAndSave} disabled={saving}
                            className="px-4 py-2 bg-[#003B73] text-white rounded-xl text-sm font-bold hover:bg-[#002850] transition-all disabled:opacity-60">
                            {saving ? 'Saving...' : 'Recalculate & Save'}
                        </button>
                        <button onClick={lockList}
                            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-all flex items-center gap-2">
                            <Lock size={14} /> Lock List
                        </button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 mb-8 pointer-events-auto">
                <div className="flex flex-col md:flex-row gap-6 w-full items-end">
                    {isAdmin && !isFirstYear && (
                        <div className="flex-1 w-full space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-left block">Department</label>
                        <CustomSelect value={filters.department} onChange={e => setFilters(f => ({ ...f, department: e.target.value }))}>
                            <option value="">Select Dept</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.code || d.name}>
                                    {d.code || d.name}
                                </option>
                            ))}
                        </CustomSelect>
                    </div>
                )}
                    <div className="flex-1 w-full space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-left block">Semester</label>
                        <CustomSelect value={filters.semester} onChange={e => setFilters(f => ({ ...f, semester: e.target.value }))}>
                            <option value="">Select...</option>
                            {(() => {
                                const isFYC = auth?.computedRoles?.includes('FIRST_YEAR_COORDINATOR');
                                const dept = departments.find(d => (d.code || d.name) === filters.department);
                                const degree = dept?.degree || 'B.E.';
                                const options = isFYC ? [1, 2] : (SEMESTER_OPTIONS[degree] || [1, 2, 3, 4, 5, 6, 7, 8]);
                                return options.map(s => (
                                    <option key={s} value={s}>Sem {s}</option>
                                ));
                            })()}
                        </CustomSelect>
                    </div>
                    <div className="flex-1 w-full space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-left block">Section</label>
                        <CustomSelect value={filters.section} onChange={e => setFilters(f => ({ ...f, section: e.target.value }))}>
                            <option value="">All...</option>
                            {(() => {
                                const dept = departments.find(d => (d.code || d.name) === filters.department);
                                const filtered = dbSections.filter(s => {
                                    if (dept && !isFirstYear && s.departmentId !== dept.id) return false;
                                    if (filters.semester && s.semester !== parseInt(filters.semester)) return false;
                                    return true;
                                });
                                const names = [...new Set(filtered.map(s => s.name))];
                                if (names.length === 0) return ['A', 'B', 'C'].map(s => <option key={s} value={s}>{s}</option>);
                                return names.map(s => <option key={s} value={s}>{s}</option>);
                            })()}
                        </CustomSelect>
                    </div>
                    <button onClick={fetchEligibility}
                        className="bg-[#003B73] mt-4 md:mt-0 text-white px-10 h-[56px] rounded-[16px] font-black text-xs uppercase tracking-widest hover:bg-[#002850] transition-all flex items-center justify-center w-full md:w-auto gap-3 shadow-lg shadow-blue-900/10 active:scale-95">
                        <Search size={18} /> LOAD
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
            )}

            {/* Summary Counts */}
            {data.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Eligible', count: data.filter(s => s.overallStatus === 'ELIGIBLE').length, color: 'bg-green-50 text-green-700 border-green-200' },
                        { label: 'Condonation', count: data.filter(s => s.overallStatus === 'CONDONATION').length, color: 'bg-orange-50 text-orange-700 border-orange-200' },
                        { label: 'Detained', count: data.filter(s => s.overallStatus === 'DETAINED').length, color: 'bg-red-50 text-red-700 border-red-200' },
                    ].map(({ label, count, color }) => (
                        <div key={label} className={`rounded-2xl border p-5 text-center ${color}`}>
                            <p className="text-3xl font-black">{count}</p>
                            <p className="text-sm font-semibold mt-1">{label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Student List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-[#003B73] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : data.length > 0 ? (
                <div className="space-y-3">
                    {data.map(student => (
                        <div key={student.studentId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            {/* Student Header Row */}
                            <button
                                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                                onClick={() => setExpandedStudent(expandedStudent === student.studentId ? null : student.studentId)}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="font-mono text-sm text-[#003B73] font-black">{student.rollNo}</span>
                                    <span className="font-semibold text-gray-800">{student.name}</span>
                                    <span className="text-xs text-gray-400">Sec {student.section}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {statusBadge(student.overallStatus)}
                                    <span className="text-xs text-gray-400">{expandedStudent === student.studentId ? '▲' : '▼'}</span>
                                </div>
                            </button>

                            {/* Expanded Subject Details */}
                            {expandedStudent === student.studentId && (
                                <div className="px-6 pb-5 border-t border-gray-100">
                                    <table className="w-full text-sm mt-3">
                                        <thead>
                                            <tr className="text-xs text-gray-400 uppercase">
                                                <th className="text-left pb-2">Subject</th>
                                                <th className="text-center pb-2">Attended</th>
                                                <th className="text-center pb-2">Total</th>
                                                <th className="text-center pb-2">%</th>
                                                <th className="text-center pb-2">Status</th>
                                                {isAdmin && <th className="text-center pb-2">Exception</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {student.subjects.map(s => (
                                                <tr key={s.subjectId} className="hover:bg-gray-50 transition-all duration-150 hover:translate-x-1">
                                                    <td className="py-2">
                                                        <p className="font-semibold text-gray-800">{s.subjectCode}</p>
                                                        <p className="text-xs text-gray-400">{s.subjectName}</p>
                                                    </td>
                                                    <td className="text-center font-mono">{s.present}</td>
                                                    <td className="text-center font-mono">{s.totalClasses}</td>
                                                    <td className="text-center">
                                                        <span className={`font-bold ${s.percent >= 75 ? 'text-green-600' : s.percent >= 65 ? 'text-orange-500' : 'text-red-600'}`}>
                                                            {s.percent?.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="flex justify-center">
                                                            {s.isException
                                                                ? <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Exception ✓</span>
                                                                : statusBadge(s.status)
                                                            }
                                                        </div>
                                                    </td>
                                                    {isAdmin && (
                                                        <td className="text-center">
                                                            {(s.status === 'CONDONATION' || s.status === 'DETAINED') && !s.isLocked && (
                                                                <button
                                                                    onClick={() => setExceptionModal({ eligibilityId: s.eligibilityId, studentId: student.studentId, subjectId: s.subjectId, studentName: student.name, subjectName: s.subjectName })}
                                                                    className="px-3 py-1 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all">
                                                                    {s.isException ? 'Revoke' : 'Grant'}
                                                                </button>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : !loading && filters.semester && (
                <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-gray-200 text-gray-400">
                    <Shield className="mx-auto mb-3 opacity-20" size={48} />
                    <p>No eligibility data found. Click "Recalculate & Save" to generate.</p>
                </div>
            )}

            {/* Exception Modal */}
            {exceptionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-5">
                        <h3 className="text-lg font-black text-gray-800">Grant Attendance Exception</h3>
                        <p className="text-sm text-gray-600">
                            Student: <span className="font-bold">{exceptionModal.studentName}</span><br />
                            Subject: <span className="font-bold">{exceptionModal.subjectName}</span>
                        </p>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Reason *</label>
                            <textarea
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#003B73]"
                                rows={3}
                                placeholder="Enter reason for exception..."
                                value={exceptionReason}
                                onChange={e => setExceptionReason(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => grantException(true)}
                                disabled={!exceptionReason.trim()}
                                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all disabled:opacity-50">
                                ✓ Grant Exception
                            </button>
                            <button onClick={() => grantException(false)}
                                className="flex-1 py-3 bg-red-50 text-red-700 rounded-xl font-bold text-sm hover:bg-red-100 transition-all">
                                ✗ Reject
                            </button>
                            <button onClick={() => { setExceptionModal(null); setExceptionReason(''); }}
                                className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceEligibility;
