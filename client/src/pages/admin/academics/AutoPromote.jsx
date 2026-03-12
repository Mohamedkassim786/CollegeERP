import React, { useState, useEffect } from 'react';
import { ArrowRight, AlertTriangle, Eye, CheckCheck } from 'lucide-react';
import { getPromotionPreview, promoteAllStudents } from '../../../services/student.service';
import { getDepartments, getSections } from '../../../services/department.service';
import CustomSelect from '../../../components/CustomSelect';
import { SEMESTER_OPTIONS } from '../../../utils/constants';

const AutoPromote = () => {
    const [form, setForm] = useState({ department: '', year: '', semester: '', section: '' });
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [promoting, setPromoting] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
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

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const loadPreview = async () => {
        setLoading(true); setError(''); setPreview(null); setResult(null);
        try {
            const res = await getPromotionPreview(form);
            setPreview(res.data);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load preview.');
        }
        setLoading(false);
    };

    const doPromote = async () => {
        if (!window.confirm(`⚠️ This will promote ${preview?.totalStudents} students. This cannot be undone. Continue?`)) return;
        setPromoting(true); setError('');
        try {
            const res = await promoteAllStudents(form);
            setResult(res.data);
            setPreview(null);
        } catch (e) {
            setError(e.response?.data?.message || 'Promotion failed.');
        }
        setPromoting(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3">
                <ArrowRight className="text-blue-600" size={28} />
                <div>
                    <h1 className="text-2xl font-black text-[#003B73]">Auto Promote Students</h1>
                    <p className="text-gray-500 text-sm">Promote all active students to the next semester. Requires marks to be locked first.</p>
                </div>
            </div>

            {/* Warning */}
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex gap-4">
                <AlertTriangle className="text-orange-500 flex-shrink-0 mt-0.5" size={22} />
                <div className="text-sm text-orange-800">
                    <strong>Requirements before promoting:</strong>
                    <ul className="list-disc ml-4 mt-1 space-y-1">
                        <li>All faculty marks must be approved and locked in Semester Control.</li>
                        <li>Results must have been generated (GPA calculated).</li>
                        <li>Students with arrears will be promoted but arrear records are preserved.</li>
                        <li>Semester 8 students will be marked as <strong>Passed Out</strong>.</li>
                    </ul>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                    <CustomSelect value={form.department} onChange={e => set('department', e.target.value)}>
                        <option value="">All</option>
                        {departments.map(d => (
                            <option key={d.id} value={d.code || d.name}>
                                {d.code || d.name}
                            </option>
                        ))}
                    </CustomSelect>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Year</label>
                    <CustomSelect value={form.year} onChange={e => set('year', e.target.value)}>
                        <option value="">All</option>
                        {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </CustomSelect>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Semester</label>
                    <CustomSelect value={form.semester} onChange={e => set('semester', e.target.value)}>
                        <option value="">All</option>
                        {(() => {
                            const dept = departments.find(d => (d.code || d.name) === form.department);
                            const degree = dept?.degree || 'B.E.';
                            return (SEMESTER_OPTIONS[degree] || [1, 2, 3, 4, 5, 6, 7, 8]).map(s => (
                                <option key={s} value={s}>Sem {s}</option>
                            ));
                        })()}
                    </CustomSelect>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Section</label>
                    <CustomSelect value={form.section} onChange={e => set('section', e.target.value)}>
                        <option value="">All</option>
                        {(() => {
                            const dept = departments.find(d => (d.code || d.name) === form.department);
                            const filtered = dbSections.filter(s => {
                                if (dept && s.departmentId !== dept.id) return false;
                                if (form.semester && s.semester !== parseInt(form.semester)) return false;
                                return true;
                            });
                            const names = [...new Set(filtered.map(s => s.name))];
                            if (names.length === 0) return ['A', 'B', 'C'].map(s => <option key={s} value={s}>{s}</option>);
                            return names.map(s => <option key={s} value={s}>{s}</option>);
                        })()}
                    </CustomSelect>
                </div>
                <button onClick={loadPreview} disabled={loading || !form.department || !form.semester}
                    className="h-[52px] px-6 bg-blue-50 text-blue-700 border border-blue-200 rounded-[14px] font-black text-sm hover:bg-blue-100 transition-all flex items-center gap-2 disabled:opacity-50">
                    <Eye size={16} /> PREVIEW
                </button>
            </div>

            {error && <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">{error}</div>}

            {/* Result */}
            {result && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                    <CheckCheck className="mx-auto text-green-600 mb-3" size={36} />
                    <p className="text-lg font-black text-green-800">{result.message}</p>
                </div>
            )}

            {/* Preview Table */}
            {preview && !result && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="font-black text-gray-800 text-lg">
                                {preview.totalStudents} students will be
                                {preview.isGraduating ? <span className="text-purple-700"> graduated (Passed Out)</span> : <span className="text-blue-700"> promoted to Sem {preview.nextSemester}</span>}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Review before committing. This action cannot be undone.</p>
                        </div>
                        <button onClick={doPromote} disabled={promoting}
                            className="px-6 py-3 bg-[#003B73] text-white rounded-xl font-black text-sm hover:bg-[#002850] transition-all disabled:opacity-60 flex items-center gap-2">
                            {promoting ? 'Promoting...' : <><ArrowRight size={16} /> {preview.isGraduating ? 'GRADUATE ALL' : 'PROMOTE ALL'}</>}
                        </button>
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-3 text-left">#</th>
                                <th className="px-4 py-3 text-left">Roll No</th>
                                <th className="px-4 py-3 text-left">Name</th>
                                <th className="px-4 py-3 text-center">Section</th>
                                <th className="px-4 py-3 text-center">Current Sem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {preview.students.slice(0, 50).map((s, i) => (
                                <tr key={s.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                                    <td className="px-4 py-2.5 font-mono text-[#003B73] font-bold">{s.rollNo}</td>
                                    <td className="px-4 py-2.5 font-medium text-gray-800">{s.name}</td>
                                    <td className="px-4 py-2.5 text-center">{s.section}</td>
                                    <td className="px-4 py-2.5 text-center font-bold">{s.semester}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {preview.students.length > 50 && (
                        <div className="px-5 py-3 bg-gray-50 text-xs text-gray-400 text-center">
                            Showing first 50 of {preview.students.length} students.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AutoPromote;
