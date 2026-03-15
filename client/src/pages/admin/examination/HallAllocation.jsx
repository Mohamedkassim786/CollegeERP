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
  Save,
  RefreshCcw,
  Grid,
  Layers,
} from "lucide-react";
import { 
  getHallSessions, 
  getHalls, 
  createHallSession, 
  createHall, 
  generateAllocation, 
  getHallAllocations, 
  lockHallSession, 
  deleteHallSession, 
  deleteHall, 
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
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form States
  const [newSession, setNewSession] = useState({
    examName: "",
    examDate: "",
    session: "FN",
    examMode: "CIA",
    subjectIds: [],
  });

  const [newHall, setNewHall] = useState({
    hallName: "",
    blockName: "",
    numColumns: 1,
    columns: [{ label: "A", benches: "", benchData: [] }],
  });

  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedHalls, setSelectedHalls] = useState([]);
  const [allocations, setAllocations] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, hallsRes, subjectsRes] = await Promise.all([
        getHallSessions(),
        getHalls(),
        getSubjects(),
      ]);
      setSessions(Array.isArray(sessionsRes.data) ? sessionsRes.data : []);
      setHalls(Array.isArray(hallsRes.data) ? hallsRes.data : []);
      setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
    } catch (error) {
      toast.error("Failed to load hall allocation data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const res = await createHallSession(newSession);
      toast.success("Exam session created");
      fetchInitialData();
      setSelectedSession(res.data);
      setCurrentStep(2);
    } catch (error) {
      toast.error("Failed to create session");
    }
  };

  const handleAddHall = async (e) => {
    e.preventDefault();
    try {
      await createHall({
        hallName: newHall.hallName,
        blockName: newHall.blockName,
        columns: newHall.columns,
      });
      toast.success("Hall added");
      setNewHall({
        hallName: "",
        blockName: "",
        numColumns: 1,
        columns: [{ label: "A", benches: "" }],
      });
      fetchInitialData();
    } catch (error) {
      toast.error("Failed to add hall");
    }
  };

  const handleColumnNumChange = (num) => {
    let count = num === "" ? "" : parseInt(num);
    if (count !== "" && isNaN(count)) return;

    const effectiveCount = count === "" ? 0 : count;
    const newCols = Array.from({ length: effectiveCount }, (_, i) => {
      const existingCol = newHall.columns[i];
      return {
        label: String.fromCharCode(65 + i),
        benches: existingCol?.benches || "",
        benchData: existingCol?.benchData || [],
      };
    });
    setNewHall({ ...newHall, numColumns: count, columns: newCols });
  };

  const handleBenchChange = (idx, val) => {
    const newCols = [...newHall.columns];
    const numBenches = parseInt(val) || 0;
    newCols[idx].benches = val;

    // Initialize benchData if needed
    const newBenchData = Array.from({ length: numBenches }, (_, i) => ({
      benchNumber: i + 1,
      capacity: newCols[idx].benchData?.[i]?.capacity || 2,
    }));
    newCols[idx].benchData = newBenchData;

    setNewHall({ ...newHall, columns: newCols });
  };

  const handleBenchCapacityToggle = (colIdx, benchIdx) => {
    const newCols = [...newHall.columns];
    const bench = newCols[colIdx].benchData?.[benchIdx];
    if (!bench) return;
    const currentCapacity = bench.capacity;
    newCols[colIdx].benchData[benchIdx].capacity =
      currentCapacity === 2 ? 1 : 2;
    setNewHall({ ...newHall, columns: newCols });
  };

  const handleGenerate = async () => {
    if (selectedHalls.length === 0) {
      toast.error("Select at least one hall");
      return;
    }
    setGenerating(true);
    try {
      const res = await generateAllocation({
        sessionId: selectedSession.id,
        hallIds: selectedHalls,
      });
      toast.success(res.data.message);
      const allocRes = await getHallAllocations(selectedSession.id);
      setAllocations(allocRes.data);
      setCurrentStep(4);
    } catch (error) {
      toast.error(error.response?.data?.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const toggleLock = async (session) => {
    try {
      await lockHallSession(session.id, {
        isLocked: !session.isLocked,
      });
      toast.success(
        session.isLocked ? "Session Unlocked" : "Session Locked Permanently",
      );
      fetchInitialData();
    } catch (error) {
      toast.error("Failed to update lock status");
    }
  };

  const handleDeleteSession = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this session and all its allocations?",
      )
    )
      return;
    try {
      await deleteHallSession(id);
      toast.success("Session deleted successfully");
      fetchInitialData();
    } catch (error) {
      toast.error("Failed to delete session");
    }
  };

  const handleDeleteHall = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this hall? This will remove all its column and bench configurations.",
      )
    )
      return;
    try {
      await deleteHall(id);
      toast.success("Hall deleted successfully");
      fetchInitialData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete hall");
    }
  };

  const handleExportPDF = async () => {
    if (!selectedSession) return;
    try {
      const response = await exportHallAllocationPDF(selectedSession.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Consolidated_Plan_${selectedSession.examName}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Failed to export Consolidated Plan");
    }
  };

  const handleExportGridPDF = async () => {
    if (!selectedSession) return;
    try {
      const response = await exportHallGridPDF(selectedSession.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Seating_Grid_${selectedSession.examName}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Failed to export Seating Grid");
    }
  };

  const previewAllocations = async (session) => {
    try {
      const res = await getHallAllocations(session.id);
      setAllocations(res.data);
      setSelectedSession(session);
      setCurrentStep(4);
    } catch (error) {
      toast.error("Failed to load allocations");
    }
  };

  const handleSaveSubjects = async () => {
    console.log("handleSaveSubjects triggered");
    console.log("Selected Session:", selectedSession);
    console.log("Subject IDs to save:", newSession.subjectIds);

    if (!selectedSession) {
      toast.error("No session selected");
      return;
    }
    if (newSession.subjectIds.length === 0) {
      toast.error("Select at least one subject");
      return;
    }
    try {
      const res = await updateHallSessionSubjects(selectedSession.id, {
          subjectIds: newSession.subjectIds,
      });
      console.log("Save response:", res.data);
      setCurrentStep(3);
    } catch (error) {
      console.error(
        "Save error details:",
        error.response?.data || error.message,
      );
      toast.error("Failed to save subjects");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen animate-pulse text-[#003B73] font-black">
        INITIALIZING INTELLIGENCE...
      </div>
    );

  return (
    <div className="flex flex-col animate-fadeIn">
      <div className="flex flex-col items-center text-center mb-12 gap-6">
        <div className="animate-slideUp">
          <h1 className="text-4xl font-black text-[#003B73] tracking-tight">
            Hall Allocation Control
          </h1>
          <p className="text-gray-500 font-medium mt-2">
            Automated exam seating management with balanced distribution.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-4 bg-white p-2 rounded-full shadow-lg border border-gray-100">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${currentStep === step ? "bg-[#003B73] text-white" : "text-gray-400"}`}
            >
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-black text-xs">
                {step}
              </span>
              <span className="text-xs font-black uppercase tracking-widest">
                {step === 1
                  ? "Session"
                  : step === 2
                    ? "Subject"
                    : step === 3
                      ? "Halls"
                      : "Preview"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto w-full px-4 lg:px-8 pb-20">
        {currentStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <section className="lg:col-span-5 bg-white p-12 rounded-[48px] shadow-2xl shadow-blue-900/5 border border-gray-100 flex flex-col relative overflow-hidden group/form">
              {/* Decorative Background Element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#003B73]/5 rounded-full -mr-16 -mt-16 blur-3xl transition-colors group-hover:bg-[#003B73]/10"></div>

              <h2 className="text-2xl font-black text-[#003B73] mb-8 flex items-center gap-3">
                <Calendar className="text-blue-500" /> Create Exam Session
              </h2>
              <form onSubmit={handleCreateSession} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                    Exam Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CIA-I April 2024"
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#003B73] outline-none font-bold transition-all"
                    value={newSession.examName}
                    onChange={(e) =>
                      setNewSession({ ...newSession, examName: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                      Exam Date
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#003B73] outline-none font-bold transition-all"
                      value={newSession.examDate}
                      onChange={(e) =>
                        setNewSession({
                          ...newSession,
                          examDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                        Session
                      </label>
                      <CustomSelect
                        className="w-full"
                        value={newSession.session}
                        onChange={(e) =>
                          setNewSession({
                            ...newSession,
                            session: e.target.value,
                          })
                        }
                      >
                        <option value="FN">FN</option>
                        <option value="AN">AN</option>
                      </CustomSelect>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                        Exam Mode
                      </label>
                      <CustomSelect
                        className="w-full"
                        value={newSession.examMode}
                        onChange={(e) =>
                          setNewSession({
                            ...newSession,
                            examMode: e.target.value,
                          })
                        }
                      >
                        <option value="CIA">CIA (2x)</option>
                        <option value="END_SEM">END SEM (1x)</option>
                      </CustomSelect>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-5 bg-[#003B73] text-white rounded-3xl font-black shadow-xl shadow-blue-900/20 hover:bg-[#002850] transition-all flex items-center justify-center gap-3"
                >
                  <Save size={20} /> Initialize Session
                </button>
              </form>
            </section>

            <section className="lg:col-span-7 space-y-8">
              <div className="flex items-center justify-between px-6">
                <h3 className="text-2xl font-black text-[#003B73]">
                  Session Archive
                </h3>
                <span className="px-4 py-2 bg-blue-50 text-[#003B73] rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
                  {sessions.length} Active Rounds
                </span>
              </div>
              <div className="space-y-4">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center justify-between hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 group/card relative"
                  >
                    <div className="flex items-center gap-8">
                      <div className="w-20 h-20 bg-gray-50 text-[#003B73] rounded-[30px] flex flex-col items-center justify-center border border-gray-100 shadow-inner group-hover/card:bg-[#003B73] group-hover/card:text-white group-hover/card:scale-105 transition-all duration-500">
                        <span className="text-[10px] font-black opacity-40 uppercase tracking-tighter mb-0.5">Session</span>
                        <span className="text-2xl font-black leading-none">{s.session}</span>
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-[#003B73] group-hover/card:translate-x-1 transition-transform">
                          {s.examName}
                        </h4>
                        <div className="flex items-center gap-4 mt-2">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={14} className="text-blue-500" /> {new Date(s.examDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-200"></span>
                          <p className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-lg border ${s.examMode === 'END_SEM' ? 'bg-indigo-50 text-indigo-500 border-indigo-100' : 'bg-amber-50 text-amber-500 border-amber-100'}`}>
                            {s.examMode === 'END_SEM' ? 'End Sem' : 'CIA (2x)'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                      <button
                        onClick={() => previewAllocations(s)}
                        className="px-8 py-4 bg-[#003B73] text-white rounded-[24px] hover:bg-[#002850] transition-all duration-300 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/10 active:scale-95"
                      >
                        Launch
                      </button>
                      <div className="flex items-center bg-gray-50 p-2 rounded-[24px] border border-gray-100">
                        <button
                          onClick={() => toggleLock(s)}
                          className={`p-3 rounded-2xl transition-all ${s.isLocked ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-green-50 text-green-500 hover:bg-green-100"}`}
                          title={s.isLocked ? "Unlock Session" : "Lock Session"}
                        >
                          {s.isLocked ? <Lock size={20} /> : <Unlock size={20} />}
                        </button>
                        <button
                          onClick={() => handleDeleteSession(s.id)}
                          className="p-3 text-gray-300 hover:text-red-500 transition-all ml-1"
                          title="Delete Session"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {currentStep === 2 && (
          <div className="bg-white p-12 rounded-[48px] shadow-2xl shadow-blue-900/5 border border-gray-100 animate-slideIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8 px-4">
              <div className="flex items-center gap-8">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="w-16 h-16 bg-gray-50 text-gray-400 rounded-[28px] flex items-center justify-center hover:bg-[#003B73] hover:text-white transition-all duration-500 shadow-sm border border-gray-100 group"
                >
                  <ChevronLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                  <h2 className="text-4xl font-black text-[#003B73] tracking-tight flex items-center gap-4">
                    <Layers className="text-blue-500" size={40} /> Selection Phase
                  </h2>
                  <p className="text-gray-400 font-black mt-2 uppercase text-[10px] tracking-widest flex items-center gap-2">
                    Active Session <span className="text-blue-600">●</span> {selectedSession?.examName}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSaveSubjects}
                className="px-12 py-6 bg-blue-600 text-white rounded-[32px] font-black shadow-2xl shadow-blue-900/20 flex items-center gap-4 hover:bg-blue-700 transition-all transform active:scale-95 group overflow-hidden relative"
              >
                <span className="relative z-10">Proceed to Halls</span>
                <ChevronRight size={24} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[600px] overflow-y-auto p-4 custom-scrollbar bg-gray-50/30 rounded-[40px] border border-gray-50">
              {subjects.map((sub) => {
                const isSelected = newSession.subjectIds.includes(sub.id);
                return (
                  <div
                    key={sub.id}
                    onClick={() => {
                      const newIds = isSelected
                        ? newSession.subjectIds.filter((id) => id !== sub.id)
                        : [...newSession.subjectIds, sub.id];
                      setNewSession({ ...newSession, subjectIds: newIds });
                    }}
                    className={`p-8 rounded-[32px] border-2 transition-all duration-300 cursor-pointer flex items-center justify-between group/sub relative overflow-hidden ${isSelected ? "border-blue-500 bg-white shadow-xl shadow-blue-900/5 translate-y-[-4px]" : "border-gray-50 hover:border-blue-200 bg-white hover:bg-gray-50/30"}`}
                  >
                    <div className="flex-1 relative z-10">
                      <h4
                        className={`text-lg font-black tracking-tight transition-colors ${isSelected ? "text-[#003B73]" : "text-gray-700 group-hover/sub:text-[#003B73]"}`}
                      >
                        {sub.name}
                      </h4>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${isSelected ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                          {sub.code}
                        </span>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">
                          {sub.department}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-8 h-8 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 relative z-10 ${isSelected ? "bg-blue-600 border-blue-600 text-white rotate-[360deg] shadow-lg shadow-blue-500/30" : "border-gray-200 group-hover/sub:border-blue-300 bg-white"}`}
                    >
                      {isSelected ? <CheckCircle2 size={18} /> : <Plus size={16} className="text-gray-300 group-hover/sub:text-blue-400" />}
                    </div>
                    {isSelected && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-slideIn items-start">
            {/* Left Column: Register New Hall */}
            <section className="lg:col-span-4 bg-white p-10 rounded-[40px] shadow-2xl shadow-blue-900/5 border border-gray-100 flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full -ml-16 -mt-16 blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
              <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-14 h-14 bg-emerald-50 rounded-[22px] flex items-center justify-center text-emerald-600 shadow-inner">
                  <PlusSquare size={26} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#003B73] tracking-tight">
                    New Hall
                  </h3>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Registration Box</p>
                </div>
              </div>
              <form onSubmit={handleAddHall} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Identity</label>
                    <input
                      type="text"
                      required
                      placeholder="Hall Name (e.g. 101)"
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none font-bold text-gray-700 transition-all shadow-sm"
                      value={newHall.hallName}
                      onChange={(e) =>
                        setNewHall({ ...newHall, hallName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Location</label>
                    <input
                      type="text"
                      required
                      placeholder="Block Name"
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 focus:bg-white outline-none font-bold text-gray-700 transition-all shadow-sm"
                      value={newHall.blockName}
                      onChange={(e) =>
                        setNewHall({ ...newHall, blockName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100/50 space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                      Configuration
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-600/60 uppercase">Columns</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        required
                        className="w-16 px-3 py-1 bg-white rounded-lg border border-emerald-200 outline-none font-black text-emerald-700 text-center"
                        value={newHall.numColumns}
                        onChange={(e) => handleColumnNumChange(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {newHall.columns.map((col, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white/80 rounded-2xl border border-emerald-100 shadow-sm space-y-3 group/col"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-emerald-200">
                            {col.label}
                          </div>
                          <div className="flex-1 relative">
                            <input
                              type="number"
                              placeholder="Benches"
                              required
                              className="w-full pl-4 pr-10 py-2.5 bg-gray-50 rounded-xl border border-transparent focus:border-emerald-400 outline-none font-bold text-sm"
                              value={col.benches}
                              onChange={(e) =>
                                handleBenchChange(idx, e.target.value)
                              }
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 font-black text-[10px] uppercase">Qty</div>
                          </div>
                        </div>

                        {/* Individual Benches */}
                        {col.benchData?.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-2 pl-4 border-l-2 border-emerald-100">
                            {col.benchData.map((bench, bIdx) => (
                              <div
                                key={bIdx}
                                className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-50 hover:border-emerald-200 transition-colors"
                              >
                                <span className="text-[10px] font-black text-gray-400">
                                  {col.label}
                                  {bench.benchNumber}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleBenchCapacityToggle(idx, bIdx)
                                  }
                                  className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${bench.capacity === 2
                                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                    }`}
                                >
                                  {bench.capacity} P
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-emerald-700 shadow-xl shadow-emerald-900/20 transition-all flex items-center justify-center gap-3 transform active:scale-95 group"
                >
                  <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Register Hall
                </button>
              </form>
            </section>

            <div className="lg:col-span-8 bg-white p-12 rounded-[48px] shadow-2xl shadow-blue-900/5 border border-gray-100 flex flex-col relative overflow-hidden h-full min-h-[850px]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-[100px] pointer-events-none"></div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8 relative z-10">
                <div className="flex items-center gap-8">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="w-16 h-16 bg-gray-50 text-gray-400 rounded-[28px] flex items-center justify-center hover:bg-[#003B73] hover:text-white transition-all duration-500 shadow-sm border border-gray-100 group"
                  >
                    <ChevronLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <div>
                    <h3 className="text-4xl font-black text-[#003B73] tracking-tight">
                      Hall Inventory
                    </h3>
                    <div className="flex items-center gap-6 mt-3">
                      <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span className="text-emerald-700 font-black text-xs uppercase tracking-widest">{selectedHalls.length} Selected</span>
                      </div>
                      <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
                        <Users size={16} className="text-blue-500" />
                        <span className="text-blue-700 font-black text-xs uppercase tracking-widest">
                          Capacity: <span className="font-mono">{halls
                            .filter((h) => selectedHalls.includes(h.id))
                            .reduce(
                              (a, b) =>
                                a +
                                (selectedSession?.examMode === "CIA"
                                  ? (b.capacityCIA || 0)
                                  : (b.capacityEND || 0)),
                              0,
                            )}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-12 py-6 bg-[#003B73] text-white rounded-[32px] font-black shadow-2xl shadow-blue-900/20 hover:bg-[#002850] disabled:bg-gray-300 transition-all flex items-center gap-4 transform active:scale-95 group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    {generating ? (
                      <RefreshCcw className="animate-spin" />
                    ) : (
                      <Grid size={24} />
                    )}
                    {generating
                      ? "Processing Logic..."
                      : "Begin Allocation"}
                  </span>
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-8 overflow-y-auto px-4 py-8 custom-scrollbar flex-1 bg-gray-50/20 rounded-[40px] border border-gray-100/50">
                {halls.map((hall) => {
                  const isSelected = selectedHalls.includes(hall.id);
                  return (
                    <div
                      key={hall.id}
                      onClick={() => {
                        const newIds = isSelected
                          ? selectedHalls.filter((id) => id !== hall.id)
                          : [...selectedHalls, hall.id];
                        setSelectedHalls(newIds);
                      }}
                      className={`group relative p-8 rounded-[36px] border-2 transition-all duration-500 cursor-pointer overflow-hidden ${isSelected
                        ? "bg-white border-[#003B73] shadow-2xl shadow-blue-900/10 -translate-y-2 opacity-100"
                        : "bg-white border-transparent shadow-xl shadow-gray-200/50 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 hover:border-blue-100 hover:-translate-y-1"
                        }`}
                    >
                      {/* Abstract Hall Pattern */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>

                      <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center font-black text-xl transition-all duration-500 ${isSelected
                          ? "bg-[#003B73] text-white rotate-3 shadow-lg shadow-blue-900/20"
                          : "bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500"
                          }`}>
                          {hall.hallName}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHall(hall.id);
                          }}
                          className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="relative z-10">
                        <h4 className="text-xl font-black text-[#003B73] mb-1">
                          {hall.blockName}
                        </h4>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Structural Unit</p>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 group-hover:bg-white group-hover:border-blue-50 transition-colors">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter mb-1">Benches</p>
                            <p className={`text-lg font-black ${isSelected ? "text-[#003B73]" : "text-gray-600"}`}>
                              {hall.totalBenches ?? (hall.numColumns * hall.benchesPerColumn) ?? 0}
                            </p>
                          </div>
                          <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50 group-hover:bg-blue-50 transition-colors">
                            <p className="text-[8px] font-black text-blue-400 uppercase tracking-tighter mb-1">Net Load</p>
                            <p className="text-lg font-black text-blue-700">
                              {selectedSession?.examMode === "CIA"
                                ? (hall.capacityCIA ?? 0)
                                : (hall.capacityEND ?? 0)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute bottom-4 right-4 animate-in zoom-in duration-300">
                          <div className="w-8 h-8 bg-[#003B73] rounded-full flex items-center justify-center text-white shadow-lg">
                            <Check size={16} strokeWidth={3} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="bg-white p-12 rounded-[48px] shadow-2xl shadow-blue-900/5 border border-gray-100 animate-slideUp">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-16 gap-10">
              <div className="flex items-center gap-8">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="w-16 h-16 bg-gray-50 text-gray-400 rounded-[28px] flex items-center justify-center hover:bg-[#003B73] hover:text-white transition-all duration-500 shadow-sm border border-gray-100 group"
                >
                  <ChevronLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                  <h2 className="text-5xl font-black text-[#003B73] tracking-tighter">
                    Allocation Map
                  </h2>
                  <p className="text-[#003B73]/40 font-black text-[10px] tracking-[0.4em] uppercase mt-3 flex items-center gap-3">
                    <span className="w-12 h-[1px] bg-[#003B73]/20"></span>
                    Operational Intelligence <span className="text-emerald-500 animate-pulse">●</span> {selectedSession?.examName}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 w-full xl:w-auto bg-gray-50/50 p-4 rounded-[32px] border border-gray-100">
                <button
                  onClick={handleExportPDF}
                  className="flex-1 xl:flex-none px-10 py-5 bg-emerald-600 text-white rounded-[24px] font-black flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/10 active:scale-95 group"
                >
                  <Download size={24} className="group-hover:translate-y-0.5 transition-transform" /> Consolidated
                </button>
                <button
                  onClick={handleExportGridPDF}
                  className="flex-1 xl:flex-none px-10 py-5 bg-blue-600 text-white rounded-[24px] font-black flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/10 active:scale-95 group"
                >
                  <Download size={24} className="group-hover:translate-y-0.5 transition-transform" /> Seating Grid
                </button>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="w-full xl:w-auto px-10 py-5 bg-white text-[#003B73] rounded-[24px] font-black border border-gray-100 hover:bg-gray-50 transition-all active:scale-95"
                >
                  Close Session
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {/* Group allocations by Hall for preview */}
              {Object.entries(
                allocations.reduce((acc, a) => {
                  const hallId = a.hall.hallName;
                  if (!acc[hallId]) acc[hallId] = [];
                  acc[hallId].push(a);
                  return acc;
                }, {}),
              ).map(([hallName, hallAllocations]) => (
                <div
                  key={hallName}
                  className="bg-gray-50/10 p-10 rounded-[48px] border border-gray-100 shadow-inner group/prev relative overflow-hidden flex flex-col min-h-[500px]"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover/prev:bg-blue-500/10 transition-colors duration-1000"></div>

                  <div className="flex justify-between items-start mb-10 relative z-10">
                    <div className="flex flex-col gap-4">
                      <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center text-[#003B73] font-black text-2xl shadow-xl shadow-blue-900/5 group-hover/prev:bg-[#003B73] group-hover/prev:text-white transition-all duration-700 group-hover/prev:scale-110">
                        {hallName}
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-[#003B73] tracking-tight">
                          Hall Map
                        </h4>
                        <p className="text-gray-400 font-black text-[9px] uppercase tracking-widest mt-1">
                          Nodal Distribution
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-5 py-2 bg-white text-[#003B73] rounded-2xl text-[10px] font-black shadow-sm tracking-widest uppercase border border-gray-100">
                        {hallAllocations.length} Cadets
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar relative z-10 flex-1">
                    {hallAllocations.map((a) => (
                      <div
                        key={a.id}
                        className="bg-white p-5 rounded-[24px] shadow-sm text-sm flex justify-between items-center border border-transparent hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 group/item"
                      >
                        <div className="flex gap-4 items-center">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                          <div>
                            <p className="font-black text-gray-800 group-hover/item:text-[#003B73] transition-colors">
                              {a.student.name}
                            </p>
                            <p className="text-[9px] font-bold text-gray-400 font-mono tracking-tighter uppercase mt-0.5">
                              {a.student.rollNo} • <span className="text-blue-500/60">{a.subject.code}</span>
                            </p>
                          </div>
                        </div>
                        <div className="bg-blue-50 text-[#003B73] px-4 py-2 rounded-xl font-black font-mono text-xs border border-blue-100 group-hover/item:bg-[#003B73] group-hover/item:text-white transition-all">
                          {a.seatNumber}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HallAllocation;
