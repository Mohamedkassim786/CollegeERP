import React, { useState, useEffect } from 'react';
import { Download, Users } from 'lucide-react';
import { getExamAttendanceSessions, getHalls, generateExamAttendanceSheet } from '../../../services/examination.service';
import CustomSelect from '../../../components/CustomSelect';

const ExamAttendanceSheet = () => {
    const [sessions, setSessions] = useState([]);
    const [form, setForm] = useState({ examSessionId: '', hallId: '', subjectId: '' });
    const [halls, setHalls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [initLoading, setInitLoading] = useState(true);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    useEffect(() => {
        Promise.all([
            getExamAttendanceSessions(),
            getHalls()
        ]).then(([sRes, hRes]) => {
            setSessions(sRes.data);
            setHalls(hRes.data);
        }).finally(() => setInitLoading(false));
    }, []);

    const selectedSession = sessions.find(s => s.id === parseInt(form.examSessionId));
    const sessionSubjects = selectedSession?.subjects?.map(s => s.subject) || [];

    const handleDownload = async () => {
        if (!form.examSessionId || !form.hallId || !form.subjectId) {
            setError('Please select Session, Hall, and Subject.');
            return;
        }
        setLoading(true); setError('');
        try {
            const res = await generateExamAttendanceSheet(form);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `attendance_sheet_hall_${form.hallId}_sub_${form.subjectId}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            setError('Failed to generate. Make sure allocations exist for this Hall & Subject.');
        }
        setLoading(false);
    };

    if (initLoading) return <div className="p-10 animate-pulse bg-gray-100 h-32 rounded-2xl w-full" />;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3">
                <Users className="text-blue-600" size={28} />
                <div>
                    <h1 className="text-2xl font-black text-[#003B73]">Exam Attendance Sheet</h1>
                    <p className="text-gray-500 text-sm">Download per-hall attendance signature sheets for invigilators.</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Exam Session *</label>
                        <CustomSelect value={form.examSessionId} onChange={e => { set('examSessionId', e.target.value); set('subjectId', ''); }}>
                            <option value="">Select Session...</option>
                            {sessions.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({new Date(s.date).toLocaleDateString()} {s.session})</option>
                            ))}
                        </CustomSelect>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Hall *</label>
                        <CustomSelect value={form.hallId} onChange={e => set('hallId', e.target.value)}>
                            <option value="">Select Hall...</option>
                            {halls.map(h => <option key={h.id} value={h.id}>{h.name} (Cap: {h.capacity})</option>)}
                        </CustomSelect>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Subject *</label>
                        <CustomSelect value={form.subjectId} onChange={e => set('subjectId', e.target.value)} disabled={!form.examSessionId}>
                            <option value="">Select Subject...</option>
                            {sessionSubjects.map(sub => (
                                <option key={sub.id} value={sub.id}>{sub.code} - {sub.name}</option>
                            ))}
                        </CustomSelect>
                    </div>
                </div>

                <div className="pt-2">
                    <button onClick={handleDownload} disabled={loading || !form.examSessionId || !form.hallId || !form.subjectId}
                        className="w-full md:w-auto px-8 py-3 bg-[#003B73] text-white rounded-xl font-black text-sm hover:bg-[#002850] transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                        <Download size={18} /> {loading ? 'Generating PDF...' : 'Download Attendance Sheet'}
                    </button>
                    {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default ExamAttendanceSheet;
