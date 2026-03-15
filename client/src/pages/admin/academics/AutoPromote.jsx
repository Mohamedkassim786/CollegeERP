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
            setLoading(true);
            try {
                const [deptRes, secRes] = await Promise.all([
                    getDepartments(),
                    getSections()
                ]);
                setDepartments(deptRes.data || []);
                setDbSections(secRes.data || []);
            } catch (err) {
                console.error("Failed to load info", err);
                setError("Failed to load department structure. Please refresh.");
            } finally {
                setLoading(false);
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
            if (!res.data.students || res.data.students.length === 0) {
                setError("No students found matching these criteria for promotion.");
            }
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

    // Derived options
    const filteredSections = (() => {
        const dept = departments.find(d => (d.code || d.name) === form.department);
        const filtered = dbSections.filter(s => {
            if (dept && s.departmentId !== dept.id) return false;
            // Removed semester filter for section to show all sections of the dept
            return true;
        });
        return [...new Set(filtered.map(s => s.name))];
    })();

    const semesterOptions = (() => {
        const dept = departments.find(d => (d.code || d.name) === form.department);
        const degree = dept?.degree || 'B.E. (Default)';
        return SEMESTER_OPTIONS[dept?.degree] || [1, 2, 3, 4, 5, 6, 7, 8];
    })();

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-blue-50 rounded-2xl text-[#003B73]">
                        <ArrowRight size={32} strokeWidth={3} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[#003B73] tracking-tighter text-left">Auto Promote Base</h1>
                        <p className="text-gray-500 font-bold text-sm uppercase tracking-widest text-left">Mass Student Progression Engine</p>
                    </div>
                </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-50/50 backdrop-blur-sm border-2 border-amber-100/50 rounded-[32px] p-8 flex gap-6 shadow-xl shadow-amber-900/5 items-center">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse">
                    <AlertTriangle className="text-amber-600" size={32} />
                </div>
                <div className="space-y-1">
                    <h3 className="font-black text-amber-900 text-lg uppercase tracking-tight text-left">Critical Migration Check</h3>
                    <div className="text-amber-800/80 text-sm font-bold flex flex-wrap gap-x-6 gap-y-2 text-left">
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> Approved Marks</span>
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> Generated GPA</span>
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> Arrear Sync</span>
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> Final Year Exit</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-2xl shadow-gray-200/50">
                <div className="mb-6 flex gap-4">
                    <button
                        onClick={() => setForm({ department: 'FIRST_YEAR', year: 1, semester: '', section: '' })}
                        className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${form.department === 'FIRST_YEAR' ? 'bg-[#003B73] text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                    >
                        First Year
                    </button>
                    <button
                        onClick={() => setForm({ department: '', year: '', semester: '', section: '' })}
                        className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${form.department !== 'FIRST_YEAR' ? 'bg-[#003B73] text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                    >
                        Higher Semesters
                    </button>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 w-full">
                    {form.department !== 'FIRST_YEAR' && (
                        <div className="space-y-2 flex-1 w-full">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-left block">Select Department</label>
                            <CustomSelect value={form.department} onChange={e => set('department', e.target.value)}>
                                <option value="">Choose Department...</option>
                                {departments.filter(d => d.type !== 'Support' && d.name !== 'First Year' && d.code !== 'GEN1').map(d => (
                                    <option key={d.id} value={d.code || d.name}>
                                        {d.code || d.name}
                                    </option>
                                ))}
                            </CustomSelect>
                        </div>
                    )}
                    
                    {form.department !== 'FIRST_YEAR' && (
                        <div className="space-y-2 flex-1 w-full">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-left block">Academic Year</label>
                            <CustomSelect value={form.year} onChange={e => set('year', e.target.value)}>
                                <option value="">Current Years...</option>
                                {[2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                            </CustomSelect>
                        </div>
                    )}

                    <div className="space-y-2 flex-1 w-full">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-left block">Target Semester</label>
                        <CustomSelect value={form.semester} onChange={e => set('semester', e.target.value)}>
                            <option value="">Select Semester...</option>
                            {form.department === 'FIRST_YEAR' ? (
                                [1, 2].map(s => <option key={s} value={s}>Semester {s}</option>)
                            ) : (
                                semesterOptions.filter(s => s > 2).map(s => (
                                    <option key={s} value={s}>Semester {s}</option>
                                ))
                            )}
                        </CustomSelect>
                    </div>

                    <div className="space-y-2 flex-1 w-full">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-left block">Section Filter</label>
                        <CustomSelect value={form.section} onChange={e => set('section', e.target.value)}>
                            <option value="">All Sections</option>
                            {form.department === 'FIRST_YEAR' 
                                ? dbSections.filter(s => s.type === 'COMMON' && s.semester == (form.semester || 1)).map(s => <option key={s.id} value={s.name}>{s.name}</option>)
                                : filteredSections.map(s => <option key={s} value={s}>{s}</option>)
                            }
                        </CustomSelect>
                    </div>
                </div>
                
                <div className="mt-8 flex justify-end gap-4 border-t border-gray-50 pt-8">
                    <button 
                        onClick={loadPreview} 
                        disabled={loading || !form.semester || (form.department !== 'FIRST_YEAR' && !form.department)}
                        className="bg-blue-50 text-[#003B73] px-10 h-[56px] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 w-full md:w-auto"
                    >
                        {loading ? 'Initializing...' : <><Eye size={18} /> Run Preview Analysis</>}
                    </button>
                </div>
            </div>

            {error && <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">{error}</div>}

            {/* Result */}
            {result && (
                <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[32px] p-10 text-center shadow-xl shadow-emerald-900/5 animate-scaleIn">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCheck className="text-emerald-600" size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-emerald-900 mb-2">Operation Successful</h2>
                    <p className="text-emerald-700 font-medium max-w-md mx-auto">{result.message}</p>
                    <button onClick={() => setResult(null)} className="mt-8 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all">DISMISS</button>
                </div>
            )}

            {/* Preview Table */}
            {preview && !result && (
                <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden animate-fadeInUp">
                    <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-gray-50/50 to-transparent">
                        <div className="space-y-1">
                            <p className="font-black text-gray-900 text-2xl tracking-tight text-left">
                                {preview.totalStudents} Students Detected
                            </p>
                            <p className="font-bold text-sm text-gray-400 uppercase tracking-widest flex items-center gap-2 text-left">
                                {preview.isGraduating ? (
                                    <><span className="text-purple-600">Action: Final Graduation (Passed Out)</span></>
                                ) : (
                                    <><span>Target: Progression to</span> <span className="text-blue-600">Semester {preview.nextSemester}</span></>
                                )}
                            </p>
                        </div>
                        <button 
                            onClick={doPromote} 
                            disabled={promoting}
                            className="px-10 h-[60px] bg-[#003B73] text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-[#002850] transition-all disabled:opacity-60 flex items-center justify-center gap-3 shadow-xl shadow-blue-900/20 active:scale-95"
                        >
                            {promoting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><ArrowRight size={18} /> {preview.isGraduating ? 'CONFIRM GRADUATION' : 'EXECUTE PROMOTION'}</>
                            )}
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                                    <th className="px-8 py-5">Roll Number</th>
                                    <th className="px-8 py-5 text-left">Student Name</th>
                                    <th className="px-8 py-5 text-center">Section</th>
                                    <th className="px-8 py-5 text-center font-black text-blue-600">Current Sem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {preview.students.slice(0, 50).map((s, i) => (
                                    <tr key={s.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-8 py-5 font-mono text-sm text-[#003B73] font-bold group-hover:scale-105 transition-transform origin-left">{s.rollNo}</td>
                                        <td className="px-8 py-5 font-bold text-gray-800 text-sm">{s.name}</td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600 font-bold text-xs">
                                                {s.section}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="font-black text-gray-900 bg-gray-50 px-3 py-1 rounded-md border border-gray-100 italic">
                                                {s.semester}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {preview.students.length > 50 && (
                        <div className="p-6 bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center border-t border-gray-100">
                            + {preview.students.length - 50} more students in queue
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AutoPromote;
