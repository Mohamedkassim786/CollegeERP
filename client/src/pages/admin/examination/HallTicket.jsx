import React, { useState, useEffect } from 'react';
import { FileText, Download } from 'lucide-react';
import { generateHallTickets } from '../../../services/examination.service';
import { getDepartments, getSections } from '../../../services/department.service';
import CustomSelect from '../../../components/CustomSelect';
import { SEMESTER_OPTIONS } from '../../../utils/constants';

const HallTicket = () => {
    const [form, setForm] = useState({ department: '', semester: '', section: '', examSessionId: '1' }); // default examSessionId 1 for now
    const [loading, setLoading] = useState(false);
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

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3">
                <FileText className="text-blue-600" size={28} />
                <div>
                    <h1 className="text-2xl font-black text-[#003B73]">Hall Ticket Generation</h1>
                    <p className="text-gray-500 text-sm">Download Hall Tickets as PDF (2 per page) for a specific Department/Semester.</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Exam Session ID *</label>
                        <input type="number" 
                               value={form.examSessionId} 
                               onChange={e => set('examSessionId', e.target.value)}
                               className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#003B73] transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Department</label>
                        <CustomSelect value={form.department} onChange={e => set('department', e.target.value)}>
                            <option value="">All Departments</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.code || d.name}>
                                    {d.code || d.name}
                                </option>
                            ))}
                        </CustomSelect>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Semester</label>
                        <CustomSelect value={form.semester} onChange={e => set('semester', e.target.value)}>
                            <option value="">All Semesters</option>
                            {(() => {
                                const dept = departments.find(d => (d.code || d.name) === form.department);
                                const degree = dept?.degree || 'B.E.';
                                return (SEMESTER_OPTIONS[degree] || [1, 2, 3, 4, 5, 6, 7, 8]).map(s => (
                                    <option key={s} value={s}>Sem {s}</option>
                                ));
                            })()}
                        </CustomSelect>
                    </div>
                </div>

                <div className="pt-2">
                    <button onClick={handleDownload} disabled={loading || !form.examSessionId}
                        className="w-full md:w-auto px-8 py-3 bg-[#003B73] text-white rounded-xl font-black text-sm hover:bg-[#002850] transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                        <Download size={18} /> {loading ? 'Generating PDF...' : 'Download Hall Tickets'}
                    </button>
                    {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default HallTicket;
