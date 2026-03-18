import React, { useState, useEffect } from 'react';
import { FileText, Download } from 'lucide-react';
import { generateHallTickets, generateHallApplication, getHallSessions } from '../../../services/examination.service';
import { getDepartments, getSections } from '../../../services/department.service';
import CustomSelect from '../../../components/CustomSelect';
import { SEMESTER_OPTIONS, REGULATIONS } from '../../../utils/constants';

const HallTicket = () => {
    const [mode, setMode] = useState('hall_ticket'); // 'hall_ticket' or 'application'
    const [form, setForm] = useState({ department: '', semester: '', section: '', examSessionId: '', regulation: '2021' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [departments, setDepartments] = useState([]);
    const [dbSections, setDbSections] = useState([]);
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        const loadInfo = async () => {
            try {
                const [deptRes, secRes, sessionRes] = await Promise.all([
                    getDepartments(),
                    getSections(),
                    getHallSessions()
                ]);
                setDepartments(deptRes.data || []);
                setDbSections(secRes.data || []);
                setSessions(sessionRes.data || []);
                if (sessionRes.data?.length > 0) {
                    setForm(p => ({ ...p, examSessionId: sessionRes.data[0].id }));
                }
            } catch (err) {
                console.error("Failed to load info", err);
            }
        };
        loadInfo();
    }, []);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleDownload = async () => {
        if (!form.examSessionId) {
            setError('Exam Session ID is required to generate Hall Tickets.');
            return;
        }
        setLoading(true); setError('');
        try {
            const res = await generateHallTickets(form);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `hall_tickets_sem${form.semester || 'ALL'}_${form.department || 'ALL'}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            setError('Failed to generate Hall Tickets. Make sure Hall Allocations exist for this session.');
        }
        setLoading(false);
    };

    const handleDownloadApplication = async () => {
        setLoading(true); setError('');
        try {
            const res = await generateHallApplication(form);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = `hall_application_sem${form.semester || 'ALL'}_${form.department || 'ALL'}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            setError('Failed to generate Application Form. Make sure students exist.');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-50 text-[#003B73] rounded-2xl flex items-center justify-center shadow-inner text-2xl">
                    {mode === 'hall_ticket' ? <Download size={28} /> : <FileText size={28} />}
                </div>
                <div>
                    <h1 className="text-3xl font-black text-[#003B73] tracking-tight">Examination Control</h1>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Generate official documents for the upcoming session.</p>
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-2xl shadow-blue-900/5 border border-gray-100">
                {/* Modern Mode Switcher */}
                <div className="flex p-3 bg-gray-50/50">
                    <button 
                        onClick={() => { setMode('hall_ticket'); setError(''); }}
                        className={`flex-1 py-5 rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 ${mode === 'hall_ticket' ? 'bg-[#003B73] text-white shadow-xl shadow-blue-900/20' : 'text-gray-400 hover:text-gray-600 hover:bg-white'}`}
                    >
                        <Download size={18} /> Hall Ticket Mode
                    </button>
                    <button 
                        onClick={() => { setMode('application'); setError(''); }}
                        className={`flex-1 py-5 rounded-[28px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 ${mode === 'application' ? 'bg-[#003B73] text-white shadow-xl shadow-blue-900/20' : 'text-gray-400 hover:text-gray-600 hover:bg-white'}`}
                    >
                        <FileText size={18} /> Application Mode
                    </button>
                </div>

                <div className="p-10 space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {mode === 'hall_ticket' && (
                            <div className="animate-slideIn">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Active Exam Session *</label>
                                <CustomSelect value={form.examSessionId} onChange={e => set('examSessionId', e.target.value)}>
                                    <option value="">Select an active session...</option>
                                    {sessions.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.examName} ({s.session})
                                        </option>
                                    ))}
                                </CustomSelect>
                            </div>
                        )}
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Academic Regulation</label>
                            <CustomSelect value={form.regulation} onChange={e => set('regulation', e.target.value)}>
                                {(REGULATIONS || ['2017', '2021', '2023']).map(r => (
                                    <option key={r} value={r}>{r} Regulation</option>
                                ))}
                            </CustomSelect>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Target Department</label>
                            <CustomSelect value={form.department} onChange={e => set('department', e.target.value)}>
                                <option value="">Global (All Departments)</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.code || d.name}>
                                        {d.code || d.name}
                                    </option>
                                ))}
                            </CustomSelect>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Target Semester</label>
                            <CustomSelect value={form.semester} onChange={e => set('semester', e.target.value)}>
                                <option value="">Global (All Semesters)</option>
                                {(() => {
                                    const dept = departments.find(d => (d.code || d.name) === form.department);
                                    const degree = dept?.degree || 'B.E.';
                                    return (SEMESTER_OPTIONS[degree] || [1, 2, 3, 4, 5, 6, 7, 8]).map(s => (
                                        <option key={s} value={s}>Semester {s}</option>
                                    ));
                                })()}
                            </CustomSelect>
                        </div>
                    </div>

                    <div className="pt-8 flex justify-center">
                        {mode === 'hall_ticket' ? (
                            <button 
                                onClick={handleDownload} 
                                disabled={loading || !form.examSessionId}
                                className="px-16 py-6 bg-[#003B73] text-white rounded-[32px] font-black text-xs uppercase tracking-widest hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-blue-900/30 transition-all flex items-center gap-4 shadow-xl shadow-blue-900/10 disabled:opacity-30 disabled:translate-y-0 disabled:shadow-none active:scale-95 group"
                            >
                                <Download size={22} className="group-hover:rotate-12 transition-transform" /> 
                                {loading ? 'Executing Engine...' : 'Pull Official Hall Tickets'}
                            </button>
                        ) : (
                            <button 
                                onClick={handleDownloadApplication} 
                                disabled={loading}
                                className="px-16 py-6 bg-white border-2 border-[#003B73] text-[#003B73] rounded-[32px] font-black text-xs uppercase tracking-widest hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-blue-900/10 transition-all flex items-center gap-4 shadow-xl shadow-blue-900/5 disabled:opacity-30 disabled:translate-y-0 disabled:shadow-none active:scale-95 group"
                            >
                                <FileText size={22} className="group-hover:scale-110 transition-transform" /> 
                                {loading ? 'Executing Engine...' : 'Pull Official Application Forms'}
                            </button>
                        )}
                    </div>
                    {error && (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl animate-shake mt-8 max-w-md mx-auto text-center">
                            <p className="text-red-600 text-[10px] font-black uppercase tracking-[0.2em]">{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HallTicket;
