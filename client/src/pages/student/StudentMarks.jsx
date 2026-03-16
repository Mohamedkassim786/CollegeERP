import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Award, ChevronDown, ChevronUp, Lock, Unlock, AlertCircle, FileText } from 'lucide-react';

const StudentMarks = () => {
    const [marks, setMarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState([]);

    useEffect(() => {
        const fetchMarks = async () => {
            try {
                const res = await api.get('/student/marks');
                setMarks(res.data);
                // Expand first subject by default
                if (res.data.length > 0) setExpandedRows([res.data[0].id]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMarks();
    }, []);

    const toggleRow = (id) => {
        setExpandedRows(prev => 
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    if (loading) return (
        <div className="space-y-6 animate-fadeIn">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-white rounded-[24px] animate-pulse"></div>
            ))}
        </div>
    );

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-[#003B73] uppercase tracking-tighter">Academic Performance</h1>
                    <p className="text-gray-500 font-medium">Tracking Continuous Internal Assessments (CIA) and Final Results</p>
                </div>
                <div className="flex gap-4">
                    <div className="px-6 py-3 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#003B73]">
                            <Award size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">CIA Count</p>
                            <p className="text-lg font-black text-[#003B73]">{marks.length} Subjects</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* List Grouped by Subject */}
            <div className="space-y-4">
                {marks.map((record) => {
                    const isExpanded = expandedRows.includes(record.id);
                    const internalTotal = (record.cia1_total || 0) + (record.cia2_total || 0) + (record.cia3_total || 0);

                    return (
                        <div key={record.id} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                            {/* Subject Header Row */}
                            <button 
                                onClick={() => toggleRow(record.id)}
                                className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-[#003B73] text-white rounded-2xl flex items-center justify-center shadow-lg">
                                        <FileText size={20} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-black text-[#003B73] uppercase tracking-tight">{record.subject.name}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-black text-gray-400 font-mono tracking-widest uppercase">{record.subject.code}</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Sem {record.subject.semester}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="hidden md:block text-right">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Internal Projection</p>
                                        <p className="text-xl font-black text-[#003B73]">{internalTotal.toFixed(1)}/100</p>
                                    </div>
                                    {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                </div>
                            </button>

                            {/* Detailed Accordion */}
                            {isExpanded && (
                                <div className="px-8 pb-8 pt-2 animate-slideDown">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        {[
                                            { label: 'CIA 1', total: record.cia1_total, fields: [
                                                { k: 'Test', v: record.cia1_test, max: 60 },
                                                { k: 'Assignment', v: record.cia1_assignment, max: 20 },
                                                { k: 'Attendance', v: record.cia1_attendance, max: 20 }
                                            ], locked: record.isLocked_cia1 },
                                            { label: 'CIA 2', total: record.cia2_total, fields: [
                                                { k: 'Test', v: record.cia2_test, max: 60 },
                                                { k: 'Assignment', v: record.cia2_assignment, max: 20 },
                                                { k: 'Attendance', v: record.cia2_attendance, max: 20 }
                                            ], locked: record.isLocked_cia2 },
                                            { label: 'CIA 3', total: record.cia3_total, fields: [
                                                { k: 'Test', v: record.cia3_test, max: 60 },
                                                { k: 'Assignment', v: record.cia3_assignment, max: 20 },
                                                { k: 'Attendance', v: record.cia3_attendance, max: 20 }
                                            ], locked: record.isLocked_cia3 }
                                        ].map((cia, i) => (
                                            <div key={i} className="bg-gray-50 rounded-3xl p-5 border border-gray-100 flex flex-col justify-between">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="text-[11px] font-black text-[#003B73] uppercase tracking-[0.2em]">{cia.label}</h4>
                                                    {cia.locked ? 
                                                        <span className="bg-gray-200 p-1.5 rounded-lg text-gray-500 shadow-inner"><Lock size={12}/></span> : 
                                                        <span className="bg-blue-100 p-1.5 rounded-lg text-blue-600 shadow-inner"><Unlock size={12}/></span>
                                                    }
                                                </div>
                                                <div className="space-y-2 mb-4">
                                                    {cia.fields.map((f, j) => (
                                                        <div key={j} className="flex justify-between items-center">
                                                            <span className="text-[10px] font-bold text-gray-500 uppercase">{f.k}</span>
                                                            <span className="text-sm font-black text-[#003B73]">{f.v ?? '—'}<span className="text-[10px] text-gray-300 ml-1">/{f.max}</span></span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-gray-400 font-mono italic">WEIGHTED</span>
                                                    <span className="text-xl font-black text-blue-600">{cia.total?.toFixed(1) || '0.0'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Final Result Card */}
                                    {record.endSemMarks && (
                                        <div className="bg-gradient-to-br from-[#003B73] to-blue-900 rounded-[32px] p-6 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl border border-white/10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                                    <CheckCircle size={28} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">End Semester Examination</p>
                                                    <h4 className="text-xl font-black uppercase tracking-tight">Consolidated Ledger</h4>
                                                </div>
                                            </div>
                                            <div className="flex gap-10">
                                                <div className="text-center">
                                                    <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-1">External Marks</p>
                                                    <p className="text-2xl font-black">{record.endSemMarks.externalMarks || '—'}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-1">Grade</p>
                                                    <p className="text-2xl font-black text-amber-400">{record.endSemMarks.grade || 'NA'}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-1">Status</p>
                                                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${record.endSemMarks.resultStatus === 'PASS' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                                        {record.endSemMarks.resultStatus || 'PENDING'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {marks.length === 0 && (
                <div className="bg-white p-20 rounded-[40px] text-center shadow-sm border border-gray-100">
                    <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-black text-gray-400 tracking-widest uppercase">No Assessment Records</h3>
                    <p className="text-gray-400 mt-2">Internal assessments haven't been initiated for your courses yet.</p>
                </div>
            )}
        </div>
    );
};

export default StudentMarks;
