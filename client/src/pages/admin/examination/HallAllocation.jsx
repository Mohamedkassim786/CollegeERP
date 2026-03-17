import CustomSelect from "../../../components/CustomSelect";
import React, { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  Building2,
  Layout,
  Shield,
  Lock,
  Unlock,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  Check,
  PlusSquare,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Layers,
  Save,
  RefreshCcw,
  Grid,
  Eye,
  ArrowRight,
  CalendarDays,
  ArrowLeft,
  MoreVertical,
  X,
  Pencil,
} from "lucide-react";
import { 
  getHallSessions, 
  getHalls, 
  createHallSession, 
  createHall, 
  updateHall,
  generateAllocation, 
  getHallAllocations, 
  lockHallSession, 
  deleteHallSession, 
  deleteHall, 
  deleteAllocationByDate,
  exportHallAllocationPDF, 
  exportHallGridPDF, 
  updateHallSessionSubjects 
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

  // Layout State
  const [activeTab, setActiveTab] = useState('SESSIONS'); // 'SESSIONS' or 'INVENTORY'
  const [editingHallId, setEditingHallId] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [allocationMode, setAllocationMode] = useState('DASHBOARD'); // 'DASHBOARD' or 'WIZARD' or 'PREVIEW'
  const [wizardStep, setWizardStep] = useState(1);
  const [allAllocationsForSession, setAllAllocationsForSession] = useState([]);

  // Form States
  const [newSession, setNewSession] = useState({
    examName: "",
    month: "",
    year: "",
    session: "FN",
    examMode: "CIA",
  });

  const [wizardData, setWizardData] = useState({
    date: "",
    subjectIds: [],
    hallIds: [],
  });

  const [newHall, setNewHall] = useState({
    hallName: "",
    blockName: "",
    numColumns: 1,
    regMode: "CIA", // 'CIA' or 'END_SEM'
    columns: [{ label: "A", benches: "", benchData: [] }],
  });

  const [showAddHallModal, setShowAddHallModal] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, subjectsRes] = await Promise.all([
        getHallSessions(),
        getSubjects(),
      ]);
      setSessions(Array.isArray(sessionsRes.data) ? sessionsRes.data : []);
      setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
      setHalls([]); // Halls are now session-local
    } catch (error) {
      toast.error("Failed to load platform data");
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetails = async (session) => {
    try {
      setLoading(true);
      const [allocsRes, hallsRes] = await Promise.all([
        getHallAllocations(session.id),
        getHalls({ sessionId: session.id })
      ]);
      setAllAllocationsForSession(allocsRes.data);
      setHalls(Array.isArray(hallsRes.data) ? hallsRes.data : []);
      setSelectedSession(session);
      setAllocationMode('DASHBOARD');
    } catch (error) {
      toast.error("Failed to load session intelligence");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const res = await createHallSession(newSession);
      toast.success("Exam session initialized");
      fetchInitialData();
      loadSessionDetails(res.data);
    } catch (error) {
      toast.error("Failed to create session");
    }
  };

  const startNewAllocation = () => {
    setWizardData({ date: "", subjectIds: [], hallIds: [] });
    setWizardStep(1);
    setAllocationMode('WIZARD');
  };

  const handleGenerate = async () => {
    if (wizardData.hallIds.length === 0) return toast.error("Select at least one hall");
    setGenerating(true);
    try {
      const res = await generateAllocation({
        sessionId: selectedSession.id,
        hallIds: wizardData.hallIds,
        subjectIds: wizardData.subjectIds,
        date: wizardData.date
      });
      toast.success(res.data.message);
      loadSessionDetails(selectedSession);
    } catch (error) {
      toast.error(error.response?.data?.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteAllocationDate = async (date) => {
    if (!window.confirm(`Permanently delete all allocations for ${new Date(date).toLocaleDateString()}?`)) return;
    try {
        await deleteAllocationByDate({ sessionId: selectedSession.id, date });
        toast.success("Temporal allocations cleared");
        loadSessionDetails(selectedSession);
    } catch (err) {
        toast.error("Failed to delete allocations");
    }
  };

  const getAllocationsByDate = () => {
    const groups = {};
    allAllocationsForSession.forEach(a => {
        const d = a.examDate || 'Legacy/Unset';
        if (!groups[d]) groups[d] = [];
        groups[d].push(a);
    });
    return groups;
  };

  const getUsedSubjectIdsInSession = () => Array.from(new Set(allAllocationsForSession.map(a => a.subjectId)));

  const handleDeleteSession = async (id) => {
    if (!window.confirm("Nuclear Option: Delete this session and all linked data?")) return;
    try {
      await deleteHallSession(id);
      toast.success("Session decommissioned");
      fetchInitialData();
      if (selectedSession?.id === id) setSelectedSession(null);
    } catch (error) {
      toast.error("Failed to delete session");
    }
  };

  const handleExportPDF = async (date = null) => {
    if (!selectedSession) return;
    try {
      const response = await exportHallAllocationPDF(selectedSession.id, { date });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const dateStr = date ? `_${new Date(date).toLocaleDateString().replace(/\//g, '-')}` : '';
      link.download = `Consolidated_Allocation_${selectedSession.examName}${dateStr}.pdf`;
      link.click();
    } catch (error) {
      toast.error("Consolidated PDF export failed");
    }
  };

  const handleExportGridPDF = async (sessionId = selectedSession?.id) => {
    if (!sessionId) return;
    try {
      const response = await exportHallGridPDF(sessionId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `Seating_Matrix_Grid.pdf`;
      link.click();
    } catch (error) {
      toast.error("Seating Grid export failed");
    }
  };

  const handleAddHall = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newHall, sessionId: selectedSession?.id };
      
      if (editingHallId) {
        await updateHall(editingHallId, payload);
        toast.success("Infrastructure configuration updated");
      } else {
        await createHall(payload);
        toast.success("Structural unit registered to session");
      }

      setNewHall({ hallName: "", blockName: "", numColumns: 1, regMode: "CIA", columns: [{ label: "A", benches: "", benchData: [] }] });
      setShowAddHallModal(false);
      setEditingHallId(null);
      
      // Refresh halls for this session
      if (selectedSession) {
        const hallsRes = await getHalls({ sessionId: selectedSession.id });
        setHalls(Array.isArray(hallsRes.data) ? hallsRes.data : []);
      } else {
        fetchInitialData();
      }
    } catch (error) {
      toast.error(editingHallId ? "Failed to update configuration" : "Failed to register hall");
    }
  };

  const handleEditHall = (hall) => {
    setEditingHallId(hall.id);
    setNewHall({
      hallName: hall.hallName,
      blockName: hall.blockName,
      numColumns: hall.columns.length,
      regMode: hall.capacityCIA === (hall.columns.reduce((acc, c) => acc + parseInt(c.benches || 0), 0) * 1) ? 'END_SEM' : 'CIA',
      columns: hall.columns.map(c => ({
        label: c.label,
        benches: c.benches,
        benchData: c.benchData || []
      }))
    });
    setShowAddHallModal(true);
  };

  const handleDeleteHallFromWizard = async (e, id) => {
    e.stopPropagation();
    if(!window.confirm("Remove this unit from session inventory?")) return;
    try {
        await deleteHall(id);
        toast.success("Hall removed");
        if (selectedSession) {
          const hallsRes = await getHalls({ sessionId: selectedSession.id });
          setHalls(Array.isArray(hallsRes.data) ? hallsRes.data : []);
        }
        setWizardData(prev => ({
            ...prev,
            hallIds: prev.hallIds.filter(hId => hId !== id)
        }));
    } catch (err) {
        toast.error("Failed to remove hall");
    }
  };


  const handleColumnNumChange = (num) => {
    let count = num === "" ? "" : parseInt(num);
    const effectiveCount = count === "" ? 0 : count;
    const newCols = Array.from({ length: effectiveCount }, (_, i) => {
      const existingCol = newHall.columns[i];
      return { label: String.fromCharCode(65 + i), benches: existingCol?.benches || "", benchData: existingCol?.benchData || [] };
    });
    setNewHall({ ...newHall, numColumns: count, columns: newCols });
  };

  const handleBenchChange = (idx, val) => {
    const newCols = [...newHall.columns];
    const numBenches = parseInt(val) || 0;
    newCols[idx].benches = val;
    newCols[idx].benchData = Array.from({ length: numBenches }, (_, i) => ({
      benchNumber: i + 1,
      capacity: 2, // Always default to 2
    }));
    setNewHall({ ...newHall, columns: newCols });
  };

  const toggleBenchCapacity = (colIdx, benchIdx) => {
    const newCols = [...newHall.columns];
    const bench = newCols[colIdx].benchData[benchIdx];
    bench.capacity = bench.capacity === 2 ? 1 : 2;
    setNewHall({ ...newHall, columns: newCols });
  };

  if (loading) return <div className="flex items-center justify-center h-screen animate-pulse text-[#003B73] font-black uppercase tracking-[0.2em]">Neural Sync in Progress...</div>;

  return (
    <div className="flex flex-col animate-fadeIn px-4 lg:px-12 pb-20">
      {/* Dynamic Header */}
      <div className="flex flex-col items-center mb-16 gap-8">
        {!selectedSession ? (
          <>
        <h1 className="text-5xl font-black text-[#003B73] tracking-tight text-center">Protocol Architecture</h1>
          </>
        ) : (
            <div className="flex items-center gap-6 bg-white p-4 rounded-[32px] shadow-2xl shadow-blue-900/5 border border-gray-100 animate-slideDown">
                <button onClick={() => setSelectedSession(null)} className="w-14 h-14 bg-gray-50 text-[#003B73] rounded-2xl flex items-center justify-center hover:bg-[#003B73] hover:text-white transition-all shadow-sm group">
                    <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <div className="pr-10">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Authenticated Session</p>
                    <h2 className="text-2xl font-black text-[#003B73]">{selectedSession.examName}</h2>
                </div>
            </div>
        )}
      </div>

      <main className="max-w-[1600px] mx-auto w-full">
        {!selectedSession ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Create Session Section */}
                <section className="lg:col-span-5 bg-white p-12 rounded-[56px] shadow-2xl shadow-blue-900/5 border border-gray-100 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                    <h2 className="text-2xl font-black text-[#003B73] mb-10 flex items-center gap-4"><PlusSquare className="text-blue-500" /> Initialize Session</h2>
                    <form onSubmit={handleCreateSession} className="space-y-8">
                        <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Branding Identity</label>
                        <input type="text" required placeholder="e.g. END SEMESTER NOV 2025" className="w-full px-8 py-5 bg-gray-50 rounded-[24px] border-2 border-transparent focus:border-[#003B73] outline-none font-bold text-lg shadow-inner" value={newSession.examName} onChange={e => setNewSession({ ...newSession, examName: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Temporal Month</label>
                            <CustomSelect value={newSession.month} onChange={e => setNewSession({ ...newSession, month: e.target.value })}>
                            <option value="">Select Month</option>
                            {["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"].map(m => <option key={m} value={m}>{m}</option>)}
                            </CustomSelect>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Temporal Year</label>
                            <input type="text" placeholder="2026" className="w-full px-8 py-5 bg-gray-50 rounded-[24px] border-2 border-transparent focus:border-[#003B73] outline-none font-bold shadow-inner" value={newSession.year} onChange={e => setNewSession({ ...newSession, year: e.target.value })} />
                        </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <CustomSelect value={newSession.session} onChange={e => setNewSession({ ...newSession, session: e.target.value })}>
                                <option value="FN">Forenoon (FN)</option>
                                <option value="AN">Afternoon (AN)</option>
                            </CustomSelect>
                            <CustomSelect value={newSession.examMode} onChange={e => setNewSession({ ...newSession, examMode: e.target.value })}>
                                <option value="CIA">CIA Mode</option>
                                <option value="END_SEM">End Sem Mode</option>
                            </CustomSelect>
                        </div>
                        <button type="submit" className="w-full py-6 bg-[#003B73] text-white rounded-[28px] font-black shadow-2xl hover:bg-[#002850] transition-all flex items-center justify-center gap-4 text-sm uppercase tracking-widest"><Save size={20} /> Create Matrix Anchor</button>
                    </form>
                </section>

                {/* Session Archive */}
                <section className="lg:col-span-7 space-y-8">
                    <div className="flex justify-between items-center px-8">
                        <h3 className="text-2xl font-black text-[#003B73]">Session Vault</h3>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-4 py-1 rounded-full">{sessions.length} Anchors</span>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        {sessions.map(s => (
                        <div key={s.id} className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm flex items-center justify-between hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-700 group relative overflow-hidden">
                            <div className="flex items-center gap-10">
                            <div className="w-24 h-24 bg-gray-50 text-[#003B73] rounded-[36px] flex flex-col items-center justify-center border border-gray-100 group-hover:bg-[#003B73] group-hover:text-white transition-all shadow-inner">
                                <span className="text-[10px] font-black uppercase tracking-tighter opacity-40 mb-1">{s.session}</span>
                                <span className="text-3xl font-black leading-none">{s.year ? s.year.slice(-2) : '??'}</span>
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-[#003B73] tracking-tight">{s.examName}</h4>
                                <div className="flex items-center gap-4 mt-2">
                                     <span className="text-[9px] font-black tracking-widest text-[#003B73]/40 uppercase bg-blue-50/50 px-3 py-1 rounded-lg">{s.examMode}</span>
                                     <span className="text-[9px] font-black tracking-widest text-emerald-500 uppercase">{s.month} {s.year}</span>
                                </div>
                            </div>
                            </div>
                            <div className="flex items-center gap-6">
                            <button onClick={() => loadSessionDetails(s)} className="px-10 py-5 bg-[#003B73] text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 hover:bg-[#002850] transition-all">Launch</button>
                            <button onClick={() => handleDeleteSession(s.id)} className="p-4 text-gray-200 hover:text-red-500 transition-colors"><Trash2 size={24} /></button>
                            </div>
                        </div>
                        ))}
                    </div>
                </section>
            </div>
           ) : (
          /* SESSION ACTIVE AREA (Day-wise Management) */
          <div className="animate-slideUp">
            {allocationMode === 'DASHBOARD' ? (
                <div className="space-y-12">
                   {/* Centered Content Container */}
                   <div className="bg-white p-12 rounded-[56px] shadow-2xl shadow-blue-900/5 border border-gray-100 overflow-hidden relative group/dash">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full -mr-40 -mt-40 blur-3xl group-hover/dash:bg-blue-500/10 transition-all duration-1000"></div>
                        
                        <div className="flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
                            <div>
                                <h2 className="text-5xl font-black text-[#003B73] tracking-tight">Session Protocol</h2>
                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.5em] mt-3 flex items-center gap-3">
                                   <span className="w-16 h-[1px] bg-gray-200"></span> Management Hub
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-6">
                                <button onClick={startNewAllocation} className="px-12 py-6 bg-[#003B73] text-white rounded-[32px] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-4 hover:translate-y-[-4px] active:scale-95 transition-all group/add">
                                    <Plus size={24} className="group-hover/add:rotate-90 transition-transform duration-500"/> Generate Exam Day
                                </button>
                            </div>
                        </div>

                        {/* Stats mini-row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-gray-50 relative z-10">
                            {[
                                {label: 'Temporal Nodes', val: Object.keys(getAllocationsByDate()).length, color: 'text-blue-500'},
                                {label: 'Total Capacity', val: allAllocationsForSession.length, color: 'text-[#003B73]'},
                                {label: 'Matrix Mode', val: selectedSession.examMode, color: 'text-emerald-500'},
                                {label: 'Department Units', val: new Set(allAllocationsForSession.map(a => a.department)).size, color: 'text-purple-500'},
                            ].map((s, i) => (
                                <div key={i} className="text-center md:text-left">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{s.label}</p>
                                    <p className={`text-2xl font-black ${s.color} tracking-tighter`}>{s.val}</p>
                                </div>
                            ))}
                        </div>
                   </div>

                   {/* Vertical Grid for Dates */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {Object.entries(getAllocationsByDate()).map(([date, items]) => (
                            <div key={date} className="bg-white p-10 rounded-[52px] border border-gray-100 shadow-xl relative group overflow-hidden hover:border-blue-200 transition-all duration-700">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-500/10 transition-colors"></div>
                                <div className="flex justify-between items-start mb-10 relative z-10">
                                    <div className="w-20 h-20 bg-blue-50 text-[#003B73] rounded-[32px] flex items-center justify-center transform group-hover:rotate-6 transition-all duration-700 shadow-inner">
                                        <Calendar size={32} />
                                    </div>
                                    <button onClick={() => handleDeleteAllocationDate(date)} className="text-gray-200 hover:text-red-500 p-3 transition-colors"><Trash2 size={24}/></button>
                                </div>
                                <h3 className="text-3xl font-black text-[#003B73] relative z-10 tracking-tight leading-none mb-2">
                                    {date === 'Legacy/Unset' ? date : new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                </h3>
                                <p className="text-xs font-black text-gray-300 uppercase tracking-widest relative z-10 mb-8">{new Date(date).getFullYear()}</p>
                                
                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center gap-2 pt-4">
                                        <button 
                                            onClick={() => {
                                                setWizardData({ date, subjectIds: Array.from(new Set(items.map(a => a.subjectId))), hallIds: Array.from(new Set(items.map(a => a.hallId))) });
                                                setAllocationMode('PREVIEW');
                                            }}
                                            className="flex-1 py-5 bg-[#003B73] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#002850] transition-all flex items-center justify-center gap-2 shadow-lg"
                                        >
                                            <Eye size={16}/> Inspect
                                        </button>
                                        <button 
                                            onClick={() => handleExportPDF(date)}
                                            className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm"
                                            title="Consolidated PDF"
                                        >
                                            <Download size={20}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                   </div>
                </div>
            ) : allocationMode === 'PREVIEW' ? (
                /* ALLOCATION PREVIEW MODE */
                <div className="bg-white p-12 rounded-[56px] shadow-2xl border border-gray-100 animate-slideUp">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-16 gap-10">
                         <div className="flex items-center gap-10">
                            <button onClick={() => setAllocationMode('DASHBOARD')} className="w-16 h-16 bg-gray-50 text-[#003B73] rounded-[28px] flex items-center justify-center hover:bg-[#003B73] hover:text-white transition-all shadow-sm border border-gray-100 group">
                                <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div>
                                <h2 className="text-4xl font-black text-[#003B73] tracking-tighter">Temporal Insight</h2>
                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-2 border-l-2 border-blue-500 pl-4">Inspection: {new Date(wizardData.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-5 w-full xl:w-auto bg-gray-50/50 p-4 rounded-[40px] border border-gray-100">
                             <button onClick={() => handleExportGridPDF()} className="flex-1 xl:flex-none px-10 py-6 bg-blue-600 text-white rounded-[28px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/10 active:scale-95 group">
                                <Grid size={22} className="group-hover:rotate-6 transition-transform"/> Matrix Grid
                             </button>
                             <button onClick={() => setAllocationMode('DASHBOARD')} className="flex-1 xl:flex-none px-10 py-6 bg-white text-[#003B73] rounded-[28px] font-black text-xs uppercase tracking-widest border border-gray-100 hover:bg-gray-100 shadow-sm transition-all uppercase">Back to Hub</button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                        {Object.entries(
                            allAllocationsForSession
                                .filter(a => (a.examDate === wizardData.date || (!a.examDate && wizardData.date === 'Legacy/Unset')))
                                .reduce((acc, a) => {
                                    const hName = a.hall.hallName;
                                    if(!acc[hName]) acc[hName] = [];
                                    acc[hName].push(a);
                                    return acc;
                                }, {})
                        ).map(([hallName, entries]) => (
                            <div key={hallName} className="bg-gray-50/30 p-10 rounded-[48px] border border-gray-100 shadow-inner group/prev relative overflow-hidden flex flex-col min-h-[500px]">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover/prev:bg-blue-500/10 transition-colors"></div>
                                
                                <div className="flex justify-between items-start mb-10 relative z-10">
                                    <div className="flex flex-col gap-4">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#003B73] font-black text-2xl shadow-xl shadow-blue-900/5 group-hover/prev:bg-[#003B73] group-hover/prev:text-white transition-all duration-500">
                                            {hallName}
                                        </div>
                                        <h4 className="text-xl font-black text-[#003B73] tracking-tighter">Hall Matrix</h4>
                                    </div>
                                    <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                                        <span className="text-[10px] font-black text-blue-500">{entries.length} Cadets</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar relative z-10 flex-1">
                                    {entries.map(e => (
                                        <div key={e.id} className="bg-white p-5 rounded-[28px] flex justify-between items-center shadow-sm border border-transparent hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                                            <div>
                                                <p className="text-xs font-black text-gray-800">{e.student.name}</p>
                                                <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{e.student.rollNo}</p>
                                            </div>
                                            <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">{e.seatNumber}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* WIZARD MODE: Add Exam Day */
                <div className="bg-white p-16 rounded-[64px] shadow-2xl border border-gray-100 animate-slideUp relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/[0.02] rounded-full -mr-48 -mt-48 blur-3xl"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-10">
                        <div className="flex items-center gap-10">
                            <button onClick={() => setAllocationMode('DASHBOARD')} className="w-16 h-16 bg-gray-50 text-[#003B73] rounded-[28px] flex items-center justify-center hover:bg-[#003B73] hover:text-white transition-all shadow-sm border border-gray-100 group">
                                <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div>
                                <h2 className="text-5xl font-black text-[#003B73] tracking-tighter">Phase 0{wizardStep}</h2>
                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.5em] mt-3 border-l-2 border-blue-500 pl-5">
                                    {wizardStep === 1 ? 'Configure Temporal Node' : wizardStep === 2 ? 'Subject Data Selection' : wizardStep === 3 ? 'Hardware Map Inventory' : 'Final Matrix Validation'}
                                </p>
                            </div>
                        </div>
                        {/* Internal Wizard Steps */}
                        <div className="flex gap-4 bg-gray-50/50 p-4 rounded-[28px] border border-gray-100">
                            {[1,2,3,4].map(s => <div key={s} className={`w-4 h-4 rounded-full transition-all duration-700 ${wizardStep === s ? 'bg-[#003B73] scale-150 shadow-lg shadow-blue-200' : wizardStep > s ? 'bg-emerald-400' : 'bg-gray-200'}`} />)}
                        </div>
                    </div>

                    <div className="min-h-[550px]">
                        {wizardStep === 1 && (
                            <div className="max-w-xl mx-auto space-y-12 animate-slideIn">
                                <div className="text-center space-y-6">
                                    <div className="w-28 h-28 bg-blue-50 text-[#003B73] rounded-[48px] flex items-center justify-center mx-auto shadow-inner transform rotate-3"><Calendar size={48}/></div>
                                    <h3 className="text-3xl font-black text-[#003B73]">Temporal Synchronization</h3>
                                    <p className="text-gray-400 font-medium leading-relaxed">Select the precise date when this examination matrix <br/> will be executed in the environment.</p>
                                </div>
                                <div className="relative group/input">
                                    <div className="absolute inset-x-0 bottom-0 h-2 bg-blue-500/10 rounded-full"></div>
                                    <input 
                                        type="date" 
                                        className="w-full px-10 py-8 bg-gray-50 rounded-[36px] border-2 border-transparent focus:border-[#003B73] outline-none font-black text-3xl text-center shadow-inner relative z-10 transition-all focus:scale-[1.02]" 
                                        value={wizardData.date} 
                                        onChange={e => setWizardData({...wizardData, date: e.target.value})}
                                    />
                                </div>
                                <button disabled={!wizardData.date} onClick={() => setWizardStep(2)} className="w-full py-7 bg-[#003B73] text-white rounded-[36px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-[#002850] transition-all disabled:opacity-20 active:scale-[0.98] flex items-center justify-center gap-4 group/btn">
                                    Proceed to Neural Map <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform" />
                                </button>
                            </div>
                        )}

                        {wizardStep === 2 && (
                            <div className="space-y-12 animate-slideIn">
                                <div className="flex justify-between items-center px-6">
                                    <div>
                                         <h3 className="text-3xl font-black text-[#003B73]">Filtered Subject Engine</h3>
                                         <p className="text-gray-400 font-bold text-[9px] uppercase tracking-widest mt-2">Excluding previously scheduled data blocks</p>
                                    </div>
                                    <span className="px-6 py-3 bg-[#003B73] text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-xl">{wizardData.subjectIds.length} Selected</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 max-h-[500px] overflow-y-auto px-4 py-4 custom-scrollbar">
                                    {subjects
                                      .filter(sub => !getUsedSubjectIdsInSession().includes(sub.id))
                                      .map(sub => {
                                        const isSelected = wizardData.subjectIds.includes(sub.id);
                                        return (
                                            <div key={sub.id} onClick={() => {
                                                const ids = isSelected ? wizardData.subjectIds.filter(id => id !== sub.id) : [...wizardData.subjectIds, sub.id];
                                                setWizardData({...wizardData, subjectIds: ids});
                                            }} className={`p-10 rounded-[48px] border-2 transition-all duration-700 cursor-pointer flex flex-col justify-between group h-72 relative overflow-hidden ${isSelected ? 'bg-[#003B73] border-[#003B73] text-white shadow-2xl scale-[1.02]' : 'bg-white border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-xl'}`}>
                                                {isSelected && <div className="absolute top-4 right-4 animate-bounce"><CheckCircle2 size={24} className="text-emerald-400"/></div>}
                                                <div>
                                                    <div className={`w-14 h-14 rounded-[24px] flex items-center justify-center mb-10 transition-all ${isSelected ? 'bg-white/20 text-white shadow-lg' : 'bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}><Layers size={24}/></div>
                                                    <p className={`text-sm font-black tracking-tight leading-tight ${isSelected ? 'text-white' : 'text-gray-800'}`}>{sub.name}</p>
                                                    <p className={`text-[10px] mt-2 font-black uppercase tracking-widest ${isSelected ? 'text-white/40' : 'text-gray-300'}`}>{sub.code}</p>
                                                </div>
                                                <div className={`mt-auto pt-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white/60' : 'text-[#003B73]/40'}`}>
                                                    <span className="w-5 h-[1px] bg-current"></span> {sub.department}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-center pt-8">
                                    <button disabled={wizardData.subjectIds.length === 0} onClick={() => setWizardStep(3)} className="px-20 py-7 bg-[#003B73] text-white rounded-[36px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-[#002850] transition-all disabled:opacity-20 flex items-center gap-4 group/btn">
                                        Map Hardware Unit <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {wizardStep === 3 && (
                            <div className="space-y-12 animate-slideIn">
                                <div className="flex justify-between items-center px-6">
                                     <div>
                                         <h3 className="text-3xl font-black text-[#003B73]">Infrastructure Deployment</h3>
                                         <p className="text-gray-400 font-bold text-[9px] uppercase tracking-widest mt-2">Selecting structural hardware nodes</p>
                                     </div>
                                     <div className="flex items-center gap-6">
                                          <div className="text-right">
                                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Matrix Mode</p>
                                              <p className="text-sm font-black text-blue-600">{selectedSession.examMode}</p>
                                          </div>
                                          <button 
                                              onClick={() => {
                                                  // Reset hall form specifically for the session mode
                                                  setNewHall({ 
                                                      ...newHall, 
                                                      regMode: selectedSession.examMode === 'CIA' ? 'CIA' : 'END_SEM',
                                                      hallName: "", 
                                                      blockName: "" 
                                                  });
                                                  setShowAddHallModal(true);
                                              }}
                                              className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100 group"
                                              title="Register New Hall"
                                          >
                                              <Plus size={24} className="group-hover:rotate-90 transition-transform duration-500" />
                                          </button>
                                          <div className="w-14 h-14 bg-blue-50 text-[#003B73] rounded-2xl flex items-center justify-center font-black shadow-inner">{wizardData.hallIds.length}</div>
                                     </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8 px-4 overflow-y-auto max-h-[450px] custom-scrollbar">
                                    {halls.map(hall => {
                                        const isSelected = wizardData.hallIds.includes(hall.id);
                                        const capacity = selectedSession?.examMode === 'CIA' ? hall.capacityCIA : hall.capacityEND;
                                        return (
                                             <div key={hall.id} onClick={() => {
                                                 const ids = isSelected ? wizardData.hallIds.filter(id => id !== hall.id) : [...wizardData.hallIds, hall.id];
                                                 setWizardData({...wizardData, hallIds: ids});
                                             }} className={`p-8 rounded-[40px] border-2 transition-all duration-700 cursor-pointer flex flex-col items-center gap-6 text-center group relative overflow-hidden ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xl scale-[1.05]' : 'bg-white border-gray-100 hover:border-emerald-200 shadow-sm opacity-60 hover:opacity-100'}`}>
                                                 {isSelected && <div className="absolute top-3 right-3"><Check size={20} className="text-white"/></div>}
                                                 
                                                 {/* Edit/Delete Overlay */}
                                                 <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                     <button 
                                                        onClick={(e) => { e.stopPropagation(); handleEditHall(hall); }}
                                                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-lg active:scale-95 transition-all"
                                                        title="Edit Configuration"
                                                     >
                                                        <Pencil size={12} />
                                                     </button>
                                                     <button 
                                                        onClick={(e) => handleDeleteHallFromWizard(e, hall.id)}
                                                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-lg active:scale-95 transition-all"
                                                        title="Delete Unit"
                                                     >
                                                        <Trash2 size={12} />
                                                     </button>
                                                 </div>

                                                 <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all ${isSelected ? 'bg-white/20' : 'bg-gray-50 text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-500'}`}><Building2 size={28}/></div>
                                                 <div>
                                                     <p className="font-black text-xl leading-none tracking-tighter">{hall.hallName}</p>
                                                     <p className={`text-[9px] font-black uppercase tracking-widest mt-3 px-3 py-1 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-50 text-gray-400 group-hover:text-emerald-600'}`}>{capacity} Seats</p>
                                                 </div>
                                             </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-center pt-10">
                                     <button disabled={wizardData.hallIds.length === 0} onClick={() => setWizardStep(4)} className="px-20 py-7 bg-emerald-600 text-white rounded-[36px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-700 transition-all disabled:opacity-20 flex items-center gap-4 group/btn">
                                        Phase Validation <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform" />
                                     </button>
                                </div>
                            </div>
                        )}

                        {wizardStep === 4 && (
                            <div className="max-w-3xl mx-auto space-y-16 animate-slideIn">
                                <div className="bg-gray-50/50 p-12 rounded-[64px] border border-gray-100 space-y-12 shadow-inner relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/[0.03] rounded-full -mr-32 -mt-32 blur-3xl"></div>
                                    <div className="text-center space-y-6 relative z-10">
                                        <div className="w-24 h-24 bg-emerald-500 text-white rounded-[36px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-900/30 animate-pulse"><Check size={48} strokeWidth={3}/></div>
                                        <h3 className="text-4xl font-black text-[#003B73] tracking-tighter">Protocol Confirmation</h3>
                                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.4em]">Integrated Intelligence Summary</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 relative z-10">
                                        {[
                                            {label: 'Temporal Anchor', val: new Date(wizardData.date).toLocaleDateString(), icon: <Calendar size={16}/>},
                                            {label: 'Neural Payload', val: `${wizardData.subjectIds.length} Subjects`, icon: <Layers size={16}/>},
                                            {label: 'Hardware Units', val: `${wizardData.hallIds.length} Stations`, icon: <Building2 size={16}/>},
                                            {label: 'Execution Mode', val: selectedSession.examMode, icon: <Layout size={16}/>},
                                        ].map((info, i) => (
                                            <div key={i} className="bg-white p-8 rounded-[36px] border border-gray-50 shadow-sm flex items-center gap-6">
                                                <div className="w-12 h-12 bg-gray-50 text-[#003B73]/30 rounded-2xl flex items-center justify-center">{info.icon}</div>
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">{info.label}</p>
                                                    <p className="text-xl font-black text-[#003B73] tracking-tight">{info.val}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-6">
                                     <button onClick={handleGenerate} disabled={generating} className="w-full py-8 bg-[#003B73] text-white rounded-[40px] font-black text-xs uppercase tracking-[0.5em] shadow-2xl hover:bg-[#002850] transition-all flex items-center justify-center gap-6 group/btn">
                                        {generating ? <><RefreshCcw className="animate-spin"/> Synchronizing Matrix...</> : <><Grid size={28} className="group-hover/btn:rotate-12 transition-transform"/> Execute Neural Allocation</>}
                                     </button>
                                     <button onClick={() => setWizardStep(1)} className="text-center text-gray-400 font-black text-[10px] uppercase tracking-[0.3em] hover:text-[#003B73] transition-colors">Re-Configure Phase Vectors</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
          </div>
        )}

        {/* Modal for Adding Hall - Re-integrated for session use */}
        {showAddHallModal && (
            <div className="fixed inset-0 bg-[#003B73]/20 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                 <div className="bg-white p-12 rounded-[56px] shadow-2xl max-w-2xl w-full border border-gray-100 animate-zoomIn overflow-y-auto max-h-[90vh] custom-scrollbar">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-3xl font-black text-[#003B73]">{editingHallId ? 'Edit Hardware Configuration' : 'New Unit Registration'}</h3>
                        <button onClick={() => { setShowAddHallModal(false); setEditingHallId(null); }} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all"><X size={24}/></button>
                    </div>
                    <form onSubmit={handleAddHall} className="space-y-8">
                        <div className="flex bg-gray-100 p-1 rounded-2xl mb-8">
                            <button type="button" onClick={() => setNewHall({...newHall, regMode: 'CIA'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newHall.regMode === 'CIA' ? 'bg-white text-[#003B73] shadow-md' : 'text-gray-400'}`}>CIA Mode (Detailed)</button>
                            <button type="button" onClick={() => setNewHall({...newHall, regMode: 'END_SEM'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newHall.regMode === 'END_SEM' ? 'bg-white text-[#003B73] shadow-md' : 'text-gray-400'}`}>End Sem Mode (Standard)</button>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Unit Label</label>
                                <input type="text" required placeholder="e.g. LAB 1" className="w-full px-8 py-5 bg-gray-50 rounded-[24px] border-2 border-transparent focus:border-[#003B73] outline-none font-bold shadow-inner" value={newHall.hallName} onChange={e => setNewHall({...newHall, hallName: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Structural Block</label>
                                <input type="text" required placeholder="A-Block" className="w-full px-8 py-5 bg-gray-50 rounded-[24px] border-2 border-transparent focus:border-[#003B73] outline-none font-bold shadow-inner" value={newHall.blockName} onChange={e => setNewHall({...newHall, blockName: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Neural Matrix Columns</label>
                            <input type="number" min="1" required className="w-full px-8 py-5 bg-gray-50 rounded-[24px] border-2 border-transparent focus:border-[#003B73] outline-none font-bold shadow-inner" value={newHall.numColumns} onChange={e => handleColumnNumChange(e.target.value)} />
                        </div>
                        <div className="space-y-6">
                            {newHall.columns.map((col, idx) => (
                                <div key={idx} className="space-y-4">
                                    <div className="flex items-center gap-6 bg-gray-50 p-6 rounded-[28px] border border-gray-100 shadow-inner">
                                        <div className="w-12 h-12 bg-[#003B73] text-white rounded-xl flex items-center justify-center font-black shadow-lg">{col.label}</div>
                                        <input type="number" required placeholder="Number of Benches" className="flex-1 bg-transparent border-b-2 border-gray-200 focus:border-[#003B73] outline-none font-black py-2 px-4" value={col.benches} onChange={e => handleBenchChange(idx, e.target.value)} />
                                        {newHall.regMode === 'CIA' && <Layers className="text-blue-500 opacity-50" size={20}/>}
                                    </div>

                                    {newHall.regMode === 'CIA' && col.benchData.length > 0 && (
                                        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 px-4 animate-fadeIn">
                                            {col.benchData.map((bench, bIdx) => (
                                                <button 
                                                    key={bIdx}
                                                    type="button"
                                                    onClick={() => toggleBenchCapacity(idx, bIdx)}
                                                    className={`h-10 rounded-xl font-black text-[10px] transition-all border-2 flex flex-col items-center justify-center gap-0.5 ${bench.capacity === 2 ? 'bg-blue-50 border-blue-200 text-[#003B73]' : 'bg-orange-50 border-orange-200 text-orange-600'}`}
                                                >
                                                    <span className="opacity-40">{col.label}{bench.benchNumber}</span>
                                                    <span className="leading-none">{bench.capacity}P</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button type="submit" className="w-full py-7 bg-[#003B73] text-white rounded-[32px] font-black shadow-2xl hover:bg-[#002850] transition-all uppercase tracking-[0.3em] text-xs">Authorize Infrastructure</button>
                    </form>
                 </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default HallAllocation;
