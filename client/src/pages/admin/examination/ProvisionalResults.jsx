import React, { useState, useEffect } from 'react';
import { Printer, FileText, Download, AlertCircle } from 'lucide-react';
import { exportProvisionalPortrait, exportProvisionalLandscape, getPublishStatus, publishResult, unpublishResult } from '../../../services/results.service';
import { getDepartments } from '../../../services/department.service';
import CustomSelect from '../../../components/CustomSelect';
import { SEMESTER_OPTIONS } from '../../../utils/constants';
import toast from 'react-hot-toast';

const ProvisionalResults = () => {
    const [form, setForm] = useState({ 
        department: '', 
        semester: '', 
        regulation: '2021',
        year: new Date().getFullYear(),
        section: 'A'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [departments, setDepartments] = useState([]);
    const [isPublished, setIsPublished] = useState(false);

    useEffect(() => {
        const loadDepts = async () => {
            try {
                const res = await getDepartments();
                setDepartments(res.data || []);
            } catch (err) {
                console.error("Failed to load departments", err);
            }
        };
        loadDepts();
    }, []);

    const checkPublishStatus = async (currentForm) => {
        if (!currentForm.department || !currentForm.semester) return;
        try {
            const res = await getPublishStatus({
                department: currentForm.department,
                semester: currentForm.semester,
                year: currentForm.year,
                section: currentForm.section
            });
            setIsPublished(res.data.isPublished);
        } catch (error) {
            console.error("Status check failed", error);
        }
    };

    const set = (k, v) => {
        const newForm = { ...form, [k]: v };
        setForm(newForm);
        if (['department', 'semester', 'year', 'section'].includes(k)) {
            checkPublishStatus(newForm);
        }
    };

    const handlePublishToggle = async () => {
        if (!form.department || !form.semester) {
            setError('Please select criteria first');
            return;
        }

        const action = isPublished ? 'unpublish' : 'publish';
        const confirmMsg = isPublished 
          ? "Are you sure you want to UNPUBLISH these results? Students will no longer be able to see them."
          : "Are you sure you want to PUBLISH these results? They will be visible to students.";
        
        if (!window.confirm(confirmMsg)) return;

        setLoading(true); setError('');
        const toastId = toast.loading(`${isPublished ? 'Unpublishing' : 'Publishing'} results...`);
        try {
            if (isPublished) {
                await unpublishResult(form);
                setIsPublished(false);
                toast.success("Results unpublished successfully", { id: toastId });
            } else {
                await publishResult(form);
                setIsPublished(true);
                toast.success("Results published successfully", { id: toastId });
            }
        } catch (error) {
            console.error(error);
            setError(`Failed to ${action} results`);
            toast.error(`Failed to ${action} results`, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (type) => {
        if (!form.department || !form.semester) {
            setError('Please select Department and Semester.');
            return;
        }
        setLoading(true); setError('');
        
        try {
            const res = type === 'portrait' 
                ? await exportProvisionalPortrait(form)
                : await exportProvisionalLandscape(form);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            const filename = `Provisional_Results_${form.department}_Sem${form.semester}_${new Date().getTime()}.pdf`;
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            setError('Failed to generate results PDF. Ensure marks are published and GPA is calculated.');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Printer className="text-blue-600" size={28} />
                    <div>
                        <h1 className="text-2xl font-black text-[#003B73]">
                            Provisional Results Export
                            {isPublished && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-widest font-black ml-3 border border-emerald-200 animate-pulse">
                                    Published
                                </span>
                            )}
                        </h1>
                        <p className="text-gray-500 text-sm">Download official provisional result sheets for notice boards or records.</p>
                    </div>
                </div>

                <button
                    onClick={handlePublishToggle}
                    disabled={loading || !form.department || !form.semester}
                    className={`px-8 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg ${
                        isPublished 
                            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 shadow-red-900/10' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/20'
                    }`}
                >
                    {isPublished ? <CheckCircle size={14} className="opacity-50" /> : <AlertCircle size={14} />}
                    {isPublished ? 'Unpublish Results' : 'Publish Results Live'}
                </button>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Department</label>
                        <CustomSelect value={form.department} onChange={e => set('department', e.target.value)}>
                            <option value="">Select Dept...</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.code || d.name}>
                                    {d.code || d.name}
                                </option>
                            ))}
                        </CustomSelect>
                    </div>
                    <div className="w-28">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Semester</label>
                        <CustomSelect value={form.semester} onChange={e => set('semester', e.target.value)}>
                            <option value="">Choose...</option>
                            {(() => {
                                const dept = departments.find(d => (d.code || d.name) === form.department);
                                const degree = dept?.degree || 'B.E. / B.Tech';
                                // Unified semester list for simpler UI
                                return [1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                    <option key={s} value={s}>Sem {s}</option>
                                ));
                            })()}
                        </CustomSelect>
                    </div>
                    <div className="w-28">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Section</label>
                        <CustomSelect value={form.section} onChange={e => set('section', e.target.value)}>
                            {['A', 'B', 'C', 'D'].map(sec => (
                                <option key={sec} value={sec}>Sec {sec}</option>
                            ))}
                        </CustomSelect>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Year / Regulation</label>
                        <div className="flex gap-2">
                             <input type="number" value={form.year} onChange={e => set('year', e.target.value)}
                                className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-[#003B73]" />
                             <input type="text" value={form.regulation} onChange={e => set('regulation', e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-[#003B73]" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-gray-100">
                    <button onClick={() => handleExport('portrait')} disabled={loading || !form.department || !form.semester}
                        className="flex-1 px-8 py-4 bg-[#003B73] text-white rounded-2xl font-black text-sm hover:bg-[#002850] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-blue-900/10">
                        <FileText size={20} /> {loading ? 'Processing...' : 'Export Portrait (A4)'}
                    </button>
                    <button onClick={() => handleExport('landscape')} disabled={loading || !form.department || !form.semester}
                        className="flex-1 px-8 py-4 bg-white text-[#003B73] border-2 border-[#003B73] rounded-2xl font-black text-sm hover:bg-blue-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                        <Download size={20} /> {loading ? 'Processing...' : 'Export Landscape (A3 T-Sheet)'}
                    </button>
                </div>

                {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2 border border-red-100 animate-shake">
                    <AlertCircle size={18} /> {error}
                </div>}
            </div>

            <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex items-start gap-4">
                <div className="p-3 bg-white rounded-2xl text-amber-600 shadow-sm">
                    <AlertCircle size={20} />
                </div>
                <div>
                    <h4 className="font-black text-amber-900">Important Checklist</h4>
                    <ul className="text-xs text-amber-700 mt-2 space-y-1 list-disc ml-4">
                        <li>Ensure all CI and External marks are entered.</li>
                        <li>Verify GPA and CGPA have been calculated for the batch.</li>
                        <li>Provisional results should only be printed after "Publishing" via results consolidation.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ProvisionalResults;
