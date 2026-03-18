import CustomSelect from "../../../components/CustomSelect";
import React, { useState, useEffect } from "react";
import {
  Calendar, Building2, Layout, Lock, Unlock, Download,
  Plus, Trash2, CheckCircle2, Check, PlusSquare, ChevronLeft,
  Layers, Save, RefreshCcw, Grid, Eye, ArrowRight, ArrowLeft,
  X, Pencil,
} from "lucide-react";
import {
  getHallSessions, getHalls, createHallSession, createHall, updateHall,
  generateAllocation, getHallAllocations, lockHallSession, deleteHallSession,
  deleteHall, deleteAllocationByDate, exportHallAllocationPDF, exportHallGridPDF,
  updateHallSessionSubjects,
} from "../../../services/examination.service";
import { getSubjects } from "../../../services/subject.service";
import Header from "../../../components/Header";
import toast from "react-hot-toast";

const HallAllocation = () => {
  const [sessions, setSessions] = useState([]);
  const [halls, setHalls] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [editingHallId, setEditingHallId] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [allocationMode, setAllocationMode] = useState('DASHBOARD');
  const [wizardStep, setWizardStep] = useState(1);
  const [allAllocationsForSession, setAllAllocationsForSession] = useState([]);

  const [newSession, setNewSession] = useState({ examName: '', month: '', year: '', examMode: 'CIA' });
  const [wizardData, setWizardData] = useState({ date: '', session: 'FN', subjectIds: [], hallIds: [] });
  const [newHall, setNewHall] = useState({
    hallName: '', blockName: '', numColumns: 1, regMode: 'CIA',
    columns: [{ label: 'A', benches: '', benchData: [] }],
  });
  const [showHallModal, setShowHallModal] = useState(false);
  // Preview state
  const [previewKey, setPreviewKey] = useState('');

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, subjectsRes] = await Promise.all([getHallSessions(), getSubjects()]);
      setSessions(Array.isArray(sessionsRes.data) ? sessionsRes.data : []);
      setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetails = async (session) => {
    try {
      setLoading(true);
      const [allocsRes, hallsRes] = await Promise.all([
        getHallAllocations(session.id),
        getHalls({ sessionId: session.id }),
      ]);
      setAllAllocationsForSession(Array.isArray(allocsRes.data) ? allocsRes.data : []);
      setHalls(Array.isArray(hallsRes.data) ? hallsRes.data : []);
      setSelectedSession(session);
      setAllocationMode('DASHBOARD');
    } catch {
      toast.error("Failed to load session details");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const res = await createHallSession(newSession);
      toast.success("Session created!");
      setNewSession({ examName: '', month: '', year: '', examMode: 'CIA' });
      await fetchInitialData();
      loadSessionDetails(res.data);
    } catch {
      toast.error("Failed to create session");
    }
  };

  const handleDeleteSession = async (id) => {
    if (!window.confirm("Delete this session and all its allocations?")) return;
    try {
      await deleteHallSession(id);
      toast.success("Session deleted");
      fetchInitialData();
    } catch {
      toast.error("Failed to delete session");
    }
  };

  const startWizard = () => {
    setWizardData({ date: '', session: 'FN', subjectIds: [], hallIds: [] });
    setWizardStep(1);
    setAllocationMode('WIZARD');
  };

  const handleGenerate = async () => {
    if (wizardData.hallIds.length === 0) return toast.error("Select at least one hall");
    if (wizardData.subjectIds.length === 0) return toast.error("Select at least one subject");
    if (!wizardData.date) return toast.error("Select an exam date");
    setGenerating(true);
    try {
      const res = await generateAllocation({
        sessionId: selectedSession.id,
        hallIds: wizardData.hallIds,
        subjectIds: wizardData.subjectIds,
        date: wizardData.date,
        session: wizardData.session,
      });
      toast.success(res.data.message || "Allocation generated!");
      loadSessionDetails(selectedSession);
      setAllocationMode('DASHBOARD');
    } catch (error) {
      toast.error(error.response?.data?.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  // Group allocations by "DD/MM/YYYY - SESSION"
  const getAllocationsByDate = () => {
    const groups = {};
    allAllocationsForSession.forEach(a => {
      if (!a.examDate) return;
      const dateStr = new Date(a.examDate).toLocaleDateString('en-IN');
      const key = `${dateStr} - ${a.session || 'N/A'}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    });
    return groups;
  };

  // Delete all allocations for a date+session group
  const handleDeleteGroup = async (compositeKey) => {
    if (!window.confirm(`Delete all allocations for "${compositeKey}"?`)) return;
    try {
      const [dateStr, session] = compositeKey.split(' - ');
      const [d, m, y] = dateStr.split('/');
      const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      await deleteAllocationByDate({
        sessionId: selectedSession.id,
        date: dateObj.toISOString(),
        session,
      });
      toast.success("Allocations deleted");
      loadSessionDetails(selectedSession);
    } catch {
      toast.error("Failed to delete");
    }
  };

  // Export consolidated PDF for a date+session group
  const handleExportPDF = async (compositeKey) => {
    try {
      const [dateStr, session] = compositeKey.split(' - ');
      const [d, m, y] = dateStr.split('/');
      const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      const response = await exportHallAllocationPDF(selectedSession.id, { 
        date: dateObj.toISOString(),
        session 
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Allocation_${compositeKey.replace(' - ', '_').replace(/\//g, '-')}.pdf`;
      link.click();
    } catch {
      toast.error("Export failed");
    }
  };

  const handleExportGridPDF = async () => {
    try {
      const response = await exportHallGridPDF(selectedSession.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Seating_Grid.pdf`;
      link.click();
    } catch {
      toast.error("Grid export failed");
    }
  };

  // Get subjects already allocated in this session for the SAME date+session
  const getUsedSubjectIds = () => {
    if (!wizardData.date || !wizardData.session) return [];
    return allAllocationsForSession
      .filter(a => {
        if (!a.examDate) return false;
        const d = new Date(a.examDate).toISOString().slice(0, 10);
        return d === wizardData.date && a.session === wizardData.session;
      })
      .map(a => a.subjectId);
  };

  // Hall management
  const handleAddHall = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newHall, sessionId: selectedSession?.id };
      if (editingHallId) {
        await updateHall(editingHallId, payload);
        toast.success("Hall updated");
      } else {
        await createHall(payload);
        toast.success("Hall registered");
      }
      setNewHall({ hallName: '', blockName: '', numColumns: 1, regMode: 'CIA', columns: [{ label: 'A', benches: '', benchData: [] }] });
      setShowHallModal(false);
      setEditingHallId(null);
      if (selectedSession) {
        const hallsRes = await getHalls({ sessionId: selectedSession.id });
        setHalls(Array.isArray(hallsRes.data) ? hallsRes.data : []);
      }
    } catch {
      toast.error("Failed to save hall");
    }
  };

  const handleEditHall = (hall) => {
    setEditingHallId(hall.id);
    setNewHall({
      hallName: hall.hallName, blockName: hall.blockName,
      numColumns: hall.columns?.length || 1,
      regMode: hall.capacityCIA > 0 ? 'CIA' : 'END_SEM',
      columns: hall.columns?.map(c => ({ label: c.label, benches: c.benches, benchData: c.benchData || [] })) || [],
    });
    setShowHallModal(true);
  };

  const handleDeleteHall = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this hall?")) return;
    try {
      await deleteHall(id);
      toast.success("Hall deleted");
      const hallsRes = await getHalls({ sessionId: selectedSession.id });
      setHalls(Array.isArray(hallsRes.data) ? hallsRes.data : []);
      setWizardData(prev => ({ ...prev, hallIds: prev.hallIds.filter(hId => hId !== id) }));
    } catch {
      toast.error("Failed to delete hall");
    }
  };

  const handleColumnNumChange = (num) => {
    const count = num === '' ? '' : parseInt(num);
    const effectiveCount = count === '' ? 0 : count;
    const newCols = Array.from({ length: effectiveCount }, (_, i) => {
      const existing = newHall.columns[i];
      return { label: String.fromCharCode(65 + i), benches: existing?.benches || '', benchData: existing?.benchData || [] };
    });
    setNewHall({ ...newHall, numColumns: count, columns: newCols });
  };

  const handleBenchChange = (idx, val) => {
    const cols = [...newHall.columns];
    const n = parseInt(val) || 0;
    cols[idx].benches = val;
    cols[idx].benchData = Array.from({ length: n }, (_, i) => ({ benchNumber: i + 1, capacity: 2 }));
    setNewHall({ ...newHall, columns: cols });
  };

  const toggleBenchCapacity = (colIdx, benchIdx) => {
    const cols = [...newHall.columns];
    const bench = cols[colIdx].benchData[benchIdx];
    bench.capacity = bench.capacity === 2 ? 1 : 2;
    setNewHall({ ...newHall, columns: cols });
  };

  const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  const WIZARD_TITLES = ['', 'Register Halls', 'Date & Session', 'Select Subjects', 'Select Halls', 'Review & Generate'];

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-[#003B73] font-black uppercase tracking-widest animate-pulse">
      Loading...
    </div>
  );

  return (
    <div className="flex flex-col animate-fadeIn px-4 lg:px-12 pb-20">
      {/* Page Header */}
      <div className="flex flex-col items-center mb-12 gap-6">
        {!selectedSession ? (
          <h1 className="text-4xl font-black text-[#003B73] tracking-tight text-center">Hall Allocation</h1>
        ) : (
          <div className="flex items-center gap-5 bg-white p-4 rounded-2xl shadow-lg border border-gray-100 animate-slideDown">
            <button onClick={() => { setSelectedSession(null); setAllocationMode('DASHBOARD'); }}
              className="w-12 h-12 bg-gray-50 text-[#003B73] rounded-xl flex items-center justify-center hover:bg-[#003B73] hover:text-white transition-all">
              <ArrowLeft size={20} />
            </button>
            <div className="pr-6">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Session</p>
              <h2 className="text-xl font-black text-[#003B73]">{selectedSession.examName}</h2>
              <p className="text-xs text-gray-400 font-bold">{selectedSession.month} {selectedSession.year} — {selectedSession.examMode}</p>
            </div>
          </div>
        )}
      </div>

      <main className="max-w-[1400px] mx-auto w-full">
        {/* ═══════════════ SESSION LIST ═══════════════ */}
        {!selectedSession ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Create Session Form */}
            <section className="lg:col-span-4 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-xl font-black text-[#003B73] mb-6 flex items-center gap-3">
                <PlusSquare className="text-blue-500" size={22} /> Create Session
              </h2>
              <form onSubmit={handleCreateSession} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Session Name</label>
                  <input type="text" required placeholder="e.g. END SEMESTER NOV 2025"
                    className="w-full px-5 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#003B73] outline-none font-semibold"
                    value={newSession.examName} onChange={e => setNewSession({ ...newSession, examName: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Month</label>
                    <CustomSelect value={newSession.month} onChange={e => setNewSession({ ...newSession, month: e.target.value })}>
                      <option value="">Select Month</option>
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </CustomSelect>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Year</label>
                    <input type="text" placeholder="2025"
                      className="w-full px-5 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#003B73] outline-none font-semibold"
                      value={newSession.year} onChange={e => setNewSession({ ...newSession, year: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Exam Mode</label>
                  <CustomSelect value={newSession.examMode} onChange={e => setNewSession({ ...newSession, examMode: e.target.value })}>
                    <option value="CIA">CIA</option>
                    <option value="END_SEM">End Semester</option>
                  </CustomSelect>
                </div>
                <button type="submit" className="w-full py-4 bg-[#003B73] text-white rounded-xl font-black text-sm hover:bg-[#002850] transition-all flex items-center justify-center gap-2">
                  <Save size={18} /> Create Session
                </button>
              </form>
            </section>

            {/* Sessions List */}
            <section className="lg:col-span-8 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-[#003B73]">Exam Sessions</h3>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{sessions.length} sessions</span>
              </div>
              {sessions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                  <p className="text-gray-400 font-bold">No sessions yet. Create one to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map(s => (
                    <div key={s.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-blue-50 text-[#003B73] rounded-xl flex flex-col items-center justify-center">
                          <span className="text-[9px] font-black uppercase tracking-tighter opacity-60">{s.examMode}</span>
                          <span className="text-2xl font-black leading-none">{s.year ? s.year.slice(-2) : '--'}</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-[#003B73]">{s.examName}</h4>
                          <p className="text-xs text-gray-400 font-bold mt-1">{s.month} {s.year}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => loadSessionDetails(s)}
                          className="px-6 py-3 bg-[#003B73] text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-[#002850] transition-all active:scale-95">
                          Open
                        </button>
                        <button onClick={() => handleDeleteSession(s.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

        ) : allocationMode === 'PREVIEW' ? (
          /* ═══════════════ PREVIEW MODE ═══════════════ */
          <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-100 animate-slideUp">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <button onClick={() => setAllocationMode('DASHBOARD')}
                  className="w-12 h-12 bg-gray-50 text-[#003B73] rounded-xl flex items-center justify-center hover:bg-[#003B73] hover:text-white transition-all">
                  <ChevronLeft size={24} />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-[#003B73]">Inspection: {previewKey}</h2>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">Seat allocation view</p>
                </div>
              </div>
              <button onClick={handleExportGridPDF}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95">
                <Grid size={18} /> Seating Grid
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Object.entries(
                allAllocationsForSession
                  .filter(a => {
                    if (!a.examDate) return false;
                    const [dateStr, sess] = previewKey.split(' - ');
                    const [d, m, y] = dateStr.split('/');
                    const keyDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toDateString();
                    return new Date(a.examDate).toDateString() === keyDate && a.session === sess;
                  })
                  .reduce((acc, a) => {
                    const hName = a.hall?.hallName || 'Unknown';
                    if (!acc[hName]) acc[hName] = [];
                    acc[hName].push(a);
                    return acc;
                  }, {})
              ).map(([hallName, entries]) => (
                <div key={hallName} className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-black text-[#003B73]">{hallName}</h4>
                    <span className="text-xs font-bold bg-[#003B73] text-white px-3 py-1 rounded-full">{entries.length}</span>
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {entries.map(e => (
                      <div key={e.id} className="bg-white p-3 rounded-xl flex justify-between items-center shadow-sm">
                        <div>
                          <p className="text-xs font-bold text-gray-800">{e.student?.name}</p>
                          <p className="text-[10px] text-gray-400">{e.student?.rollNo}</p>
                        </div>
                        <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{e.seatNumber}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        ) : allocationMode === 'WIZARD' ? (
          /* ═══════════════ WIZARD MODE ═══════════════ */
          <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-100 animate-slideUp">
            {/* Wizard Header */}
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-5">
                <button onClick={() => setAllocationMode('DASHBOARD')}
                  className="w-12 h-12 bg-gray-50 text-[#003B73] rounded-xl flex items-center justify-center hover:bg-[#003B73] hover:text-white transition-all">
                  <ChevronLeft size={24} />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-[#003B73]">Step {wizardStep} — {WIZARD_TITLES[wizardStep]}</h2>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1">Generate Exam Day Allocation</p>
                </div>
              </div>
              {/* Step indicators */}
              <div className="flex gap-2 items-center">
                {[1, 2, 3, 4, 5].map(s => (
                  <div key={s} className={`rounded-full transition-all duration-500 ${wizardStep === s ? 'w-8 h-4 bg-[#003B73]' : wizardStep > s ? 'w-4 h-4 bg-emerald-400' : 'w-4 h-4 bg-gray-200'}`} />
                ))}
              </div>
            </div>

            <div className="min-h-[500px]">

              {/* ─── STEP 1: Register Halls ─── */}
              {wizardStep === 1 && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-black text-[#003B73]">Register Halls</h3>
                      <p className="text-gray-400 text-sm mt-1">Add, edit, or remove halls for this session</p>
                    </div>
                    <button onClick={() => { setEditingHallId(null); setNewHall({ hallName: '', blockName: '', numColumns: 1, regMode: selectedSession.examMode === 'CIA' ? 'CIA' : 'END_SEM', columns: [{ label: 'A', benches: '', benchData: [] }] }); setShowHallModal(true); }}
                      className="px-5 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2">
                      <Plus size={18} /> Add Hall
                    </button>
                  </div>

                  {halls.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                      <Building2 className="mx-auto text-gray-300 mb-4" size={48} />
                      <p className="text-gray-400 font-bold">No halls registered yet</p>
                      <p className="text-gray-300 text-sm mt-1">Click "Add Hall" to begin</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {halls.map(hall => {
                        const capacity = selectedSession.examMode === 'CIA' ? hall.capacityCIA : hall.capacityEND;
                        return (
                          <div key={hall.id} className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col items-center gap-3 group relative text-center hover:border-blue-300 transition-all">
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEditHall(hall)} className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600"><Pencil size={12} /></button>
                              <button onClick={(e) => handleDeleteHall(e, hall.id)} className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"><Trash2 size={12} /></button>
                            </div>
                            <Building2 className="text-[#003B73]" size={28} />
                            <p className="font-black text-[#003B73] text-lg leading-none">{hall.hallName}</p>
                            <p className="text-xs text-gray-400 font-bold">{capacity} seats</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <button disabled={halls.length === 0} onClick={() => setWizardStep(2)}
                      className="px-10 py-4 bg-[#003B73] text-white rounded-xl font-black text-sm uppercase tracking-wide disabled:opacity-30 flex items-center gap-2 hover:bg-[#002850] transition-all active:scale-95">
                      Next: Date & Session <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* ─── STEP 2: Choose Date & Session ─── */}
              {wizardStep === 2 && (
                <div className="max-w-lg mx-auto space-y-8 animate-fadeIn">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-50 text-[#003B73] rounded-2xl flex items-center justify-center mx-auto mb-4"><Calendar size={40} /></div>
                    <h3 className="text-2xl font-black text-[#003B73]">Choose Date & Session</h3>
                    <p className="text-gray-400 text-sm mt-2">Select the exam day and time slot</p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Exam Date</label>
                      <input type="date"
                        className="w-full px-6 py-4 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#003B73] outline-none font-bold text-xl text-center"
                        value={wizardData.date} onChange={e => setWizardData({ ...wizardData, date: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Time Session</label>
                      <div className="flex gap-3">
                        {['FN', 'AN'].map(s => (
                          <button key={s} onClick={() => setWizardData({ ...wizardData, session: s })}
                            className={`flex-1 py-4 rounded-xl font-black text-base transition-all border-2 ${wizardData.session === s ? 'bg-[#003B73] text-white border-[#003B73]' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-[#003B73]'}`}>
                            {s === 'FN' ? '🌅 Forenoon (FN)' : '🌞 Afternoon (AN)'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setWizardStep(1)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-all">Back</button>
                    <button disabled={!wizardData.date} onClick={() => setWizardStep(3)}
                      className="flex-[2] py-4 bg-[#003B73] text-white rounded-xl font-black text-sm uppercase tracking-wide disabled:opacity-30 flex items-center justify-center gap-2 hover:bg-[#002850] transition-all active:scale-95">
                      Next: Subjects <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* ─── STEP 3: Choose Subjects ─── */}
              {wizardStep === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-black text-[#003B73]">Select Subjects</h3>
                      <p className="text-gray-400 text-sm mt-1">Choose subjects for this exam day</p>
                    </div>
                    <span className="px-4 py-2 bg-[#003B73] text-white rounded-xl text-xs font-bold uppercase tracking-wider">{wizardData.subjectIds.length} selected</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[500px] overflow-y-auto pb-2">
                    {subjects
                      .filter(sub => !getUsedSubjectIds().includes(sub.id))
                      .map(sub => {
                        const isSelected = wizardData.subjectIds.includes(sub.id);
                        return (
                          <div key={sub.id} onClick={() => {
                            const ids = isSelected ? wizardData.subjectIds.filter(id => id !== sub.id) : [...wizardData.subjectIds, sub.id];
                            setWizardData({ ...wizardData, subjectIds: ids });
                          }} className={`p-5 rounded-xl border-2 cursor-pointer transition-all relative ${isSelected ? 'bg-[#003B73] border-[#003B73] text-white' : 'bg-white border-gray-200 hover:border-blue-300'}`}>
                            {isSelected && <CheckCircle2 size={18} className="absolute top-3 right-3 text-emerald-400" />}
                            <Layers size={22} className={`mb-3 ${isSelected ? 'text-white/60' : 'text-gray-400'}`} />
                            <p className={`text-sm font-black leading-tight ${isSelected ? 'text-white' : 'text-gray-800'}`}>{sub.name}</p>
                            <p className={`text-[10px] mt-1 font-bold uppercase ${isSelected ? 'text-white/50' : 'text-gray-400'}`}>{sub.code}</p>
                            <p className={`text-[10px] mt-1 font-bold uppercase truncate ${isSelected ? 'text-white/40' : 'text-gray-300'}`}>{sub.department}</p>
                          </div>
                        );
                      })}
                    {subjects.filter(sub => !getUsedSubjectIds().includes(sub.id)).length === 0 && (
                      <div className="col-span-full py-16 text-center text-gray-300">
                        <p className="font-bold text-lg">All subjects already allocated for this date and session.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setWizardStep(2)} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-all">Back</button>
                    <button disabled={wizardData.subjectIds.length === 0} onClick={() => setWizardStep(4)}
                      className="flex-1 py-4 bg-[#003B73] text-white rounded-xl font-black text-sm uppercase tracking-wide disabled:opacity-30 flex items-center justify-center gap-2 hover:bg-[#002850] transition-all active:scale-95">
                      Next: Select Halls <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* ─── STEP 4: Choose Halls ─── */}
              {wizardStep === 4 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-black text-[#003B73]">Select Halls</h3>
                      <p className="text-gray-400 text-sm mt-1">Choose halls for seating allocation</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-2 bg-[#003B73] text-white rounded-xl text-xs font-bold">{wizardData.hallIds.length} selected</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 max-h-[450px] overflow-y-auto pb-2">
                    {halls.map(hall => {
                      const isSelected = wizardData.hallIds.includes(hall.id);
                      const capacity = selectedSession.examMode === 'CIA' ? hall.capacityCIA : hall.capacityEND;
                      return (
                        <div key={hall.id} onClick={() => {
                          const ids = isSelected ? wizardData.hallIds.filter(id => id !== hall.id) : [...wizardData.hallIds, hall.id];
                          setWizardData({ ...wizardData, hallIds: ids });
                        }} className={`p-5 rounded-xl border-2 cursor-pointer transition-all relative flex flex-col items-center gap-3 text-center ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-200 hover:border-emerald-300'}`}>
                          {isSelected && <Check size={16} className="absolute top-3 right-3 text-white" />}
                          <Building2 size={28} className={isSelected ? 'text-white/80' : 'text-gray-400'} />
                          <p className={`font-black text-lg leading-none ${isSelected ? 'text-white' : 'text-[#003B73]'}`}>{hall.hallName}</p>
                          <p className={`text-xs font-bold ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>{capacity} seats</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setWizardStep(3)} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-all">Back</button>
                    <button disabled={wizardData.hallIds.length === 0} onClick={() => setWizardStep(5)}
                      className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-black text-sm uppercase tracking-wide disabled:opacity-30 flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95">
                      Review & Confirm <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* ─── STEP 5: Review & Generate ─── */}
              {wizardStep === 5 && (
                <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                      <Check size={40} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-black text-[#003B73]">Review & Generate</h3>
                    <p className="text-gray-400 text-sm mt-2">Confirm details and generate seat allocation</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    {[
                      { label: 'Date', val: wizardData.date ? new Date(wizardData.date + 'T00:00:00').toLocaleDateString('en-IN') : '—', icon: <Calendar size={18} /> },
                      { label: 'Session', val: wizardData.session === 'FN' ? 'Forenoon (FN)' : 'Afternoon (AN)', icon: <Layout size={18} /> },
                      { label: 'Subjects', val: `${wizardData.subjectIds.length} selected`, icon: <Layers size={18} /> },
                      { label: 'Halls', val: `${wizardData.hallIds.length} selected`, icon: <Building2 size={18} /> },
                    ].map((info, i) => (
                      <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm">
                        <div className="w-10 h-10 bg-gray-50 text-[#003B73]/40 rounded-lg flex items-center justify-center">{info.icon}</div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{info.label}</p>
                          <p className="text-base font-black text-[#003B73]">{info.val}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <button onClick={handleGenerate} disabled={generating}
                      className="w-full py-5 bg-[#003B73] text-white rounded-xl font-black text-sm uppercase tracking-wide flex items-center justify-center gap-3 hover:bg-[#002850] transition-all active:scale-[0.99] disabled:opacity-60 shadow-xl shadow-blue-900/20">
                      {generating ? <><RefreshCcw className="animate-spin" size={20} /> Generating...</> : <><Grid size={22} /> Generate Allocation</>}
                    </button>
                    <button onClick={() => setWizardStep(4)} className="w-full py-3 text-gray-400 font-bold text-sm hover:text-[#003B73] transition-colors">
                      ← Back to Halls
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        ) : (
          /* ═══════════════ DASHBOARD MODE ═══════════════ */
          <div className="space-y-8 animate-slideUp">
            {/* Session Info + Generate Button */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-2xl font-black text-[#003B73]">{selectedSession.examName}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">{selectedSession.examMode}</span>
                    <span className="text-xs font-bold text-emerald-600">{selectedSession.month} {selectedSession.year}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={startWizard}
                    className="px-6 py-3 bg-[#003B73] text-white rounded-xl font-black text-sm flex items-center gap-2 hover:bg-[#002850] transition-all active:scale-95 shadow-lg">
                    <Plus size={18} /> New Exam Day
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-8 pt-8 border-t border-gray-50">
                {[
                  { label: 'Exam Days', val: Object.keys(getAllocationsByDate()).length },
                  { label: 'Total Seats', val: allAllocationsForSession.length },
                  { label: 'Subjects', val: new Set(allAllocationsForSession.map(a => a.subjectId)).size },
                  { label: 'Halls Used', val: new Set(allAllocationsForSession.map(a => a.hallId)).size },
                ].map((s, i) => (
                  <div key={i}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
                    <p className="text-3xl font-black text-[#003B73]">{s.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Exam Day Cards */}
            {Object.keys(getAllocationsByDate()).length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
                <Calendar className="mx-auto text-gray-200 mb-4" size={56} />
                <p className="text-lg font-black text-gray-400">No allocations yet</p>
                <p className="text-gray-300 text-sm mt-1">Click "New Exam Day" to generate one</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Object.entries(getAllocationsByDate()).map(([key, items]) => {
                  const [dateDisplay, session] = key.split(' - ');
                  return (
                    <div key={key} className="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-5">
                        <div className="w-14 h-14 bg-blue-50 text-[#003B73] rounded-xl flex items-center justify-center">
                          <Calendar size={26} />
                        </div>
                        <button onClick={() => handleDeleteGroup(key)} className="text-gray-200 hover:text-red-500 transition-colors p-1">
                          <Trash2 size={20} />
                        </button>
                      </div>
                      <h3 className="text-2xl font-black text-[#003B73] leading-none">{dateDisplay}</h3>
                      <p className="text-sm font-black text-blue-500 uppercase tracking-wider mt-1">{session === 'FN' ? 'Forenoon' : 'Afternoon'}</p>
                      <p className="text-xs text-gray-400 font-bold mt-3">{items.length} students · {new Set(items.map(a => a.hallId)).size} halls</p>

                      <div className="flex gap-2 mt-5">
                        <button onClick={() => { setPreviewKey(key); setAllocationMode('PREVIEW'); }}
                          className="flex-1 py-3 bg-[#003B73] text-white rounded-xl font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-[#002850] transition-all active:scale-95">
                          <Eye size={15} /> Inspect
                        </button>
                        <button onClick={() => handleExportPDF(key)}
                          className="w-11 h-11 bg-gray-50 text-gray-500 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-all border border-gray-200">
                          <Download size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ═══════════════ HALL MODAL ═══════════════ */}
      {showHallModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-xl w-full border border-gray-100 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-[#003B73]">{editingHallId ? 'Edit Hall' : 'Add New Hall'}</h3>
              <button onClick={() => { setShowHallModal(false); setEditingHallId(null); }}
                className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddHall} className="space-y-5">
              {/* CIA / END SEM toggle */}
              <div className="flex bg-gray-100 p-1 rounded-xl">
                {['CIA', 'END_SEM'].map(mode => (
                  <button key={mode} type="button" onClick={() => setNewHall({ ...newHall, regMode: mode })}
                    className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${newHall.regMode === mode ? 'bg-white text-[#003B73] shadow' : 'text-gray-400'}`}>
                    {mode === 'CIA' ? 'CIA (2 per bench)' : 'End Sem (1 per bench)'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hall Name</label>
                  <input required placeholder="e.g. LAB 1"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#003B73] outline-none font-bold"
                    value={newHall.hallName} onChange={e => setNewHall({ ...newHall, hallName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Block</label>
                  <input required placeholder="A-Block"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#003B73] outline-none font-bold"
                    value={newHall.blockName} onChange={e => setNewHall({ ...newHall, blockName: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Number of Columns</label>
                <input type="number" min="1" required
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-[#003B73] outline-none font-bold"
                  value={newHall.numColumns} onChange={e => handleColumnNumChange(e.target.value)} />
              </div>

              <div className="space-y-4">
                {newHall.columns.map((col, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
                      <div className="w-10 h-10 bg-[#003B73] text-white rounded-lg flex items-center justify-center font-black">{col.label}</div>
                      <input type="number" required placeholder="Number of benches"
                        className="flex-1 bg-transparent border-b-2 border-gray-200 focus:border-[#003B73] outline-none font-bold py-1"
                        value={col.benches} onChange={e => handleBenchChange(idx, e.target.value)} />
                    </div>
                    {newHall.regMode === 'CIA' && col.benchData.length > 0 && (
                      <div className="grid grid-cols-6 md:grid-cols-10 gap-1.5 px-3">
                        {col.benchData.map((bench, bIdx) => (
                          <button key={bIdx} type="button" onClick={() => toggleBenchCapacity(idx, bIdx)}
                            className={`py-2 rounded-lg text-[10px] font-black transition-all border ${bench.capacity === 2 ? 'bg-blue-50 border-blue-200 text-[#003B73]' : 'bg-orange-50 border-orange-200 text-orange-600'}`}>
                            {col.label}{bench.benchNumber}<br />{bench.capacity}P
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button type="submit" className="w-full py-4 bg-[#003B73] text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-[#002850] transition-all active:scale-[0.99]">
                <Save size={18} /> {editingHallId ? 'Update Hall' : 'Save Hall'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HallAllocation;
