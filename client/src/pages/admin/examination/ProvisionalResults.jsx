import { getDepartments } from '../../../services/department.service';
import { SEMESTER_OPTIONS } from '../../../utils/constants';

const ProvisionalResults = () => {
    const [form, setForm] = useState({ department: '', semester: '', regulation: '2021' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [departments, setDepartments] = useState([]);

    React.useEffect(() => {
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

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

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
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3">
                <Printer className="text-blue-600" size={28} />
                <div>
                    <h1 className="text-2xl font-black text-[#003B73]">Provisional Results Export</h1>
                    <p className="text-gray-500 text-sm">Download official provisional result sheets for notice boards or records.</p>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Department</label>
                        <CustomSelect value={form.department} onChange={e => set('department', e.target.value)}>
                            <option value="">Select Dept...</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.code || d.name}>
                                    {d.code || d.name}
                                </option>
                            ))}
                        </CustomSelect>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Semester</label>
                        <CustomSelect value={form.semester} onChange={e => set('semester', e.target.value)}>
                            <option value="">Select Sem...</option>
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
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Regulation</label>
                        <input type="text" value={form.regulation} onChange={e => set('regulation', e.target.value)}
                               className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#003B73]" />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-gray-50">
                    <button onClick={() => handleExport('portrait')} disabled={loading}
                        className="flex-1 px-8 py-4 bg-[#003B73] text-white rounded-2xl font-black text-sm hover:bg-[#002850] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                        <FileText size={20} /> {loading ? 'Processing...' : 'Export Portrait (A4)'}
                    </button>
                    <button onClick={() => handleExport('landscape')} disabled={loading}
                        className="flex-1 px-8 py-4 bg-white text-[#003B73] border-2 border-[#003B73] rounded-2xl font-black text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                        <Download size={20} /> {loading ? 'Processing...' : 'Export Landscape (A3 T-Sheet)'}
                    </button>
                </div>

                {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2"><AlertCircle size={18} /> {error}</div>}
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
