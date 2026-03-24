import React, { useState, useEffect } from "react";
import { PlusSquare, Save, Trash2, Calendar } from "lucide-react";
import { getHallSessions, createHallSession, deleteHallSession } from "../../../services/examination.service";
import CustomSelect from "../../../components/CustomSelect";
import toast from "react-hot-toast";

const SessionCreation = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSession, setNewSession] = useState({ examName: '', month: '', year: '', examMode: 'CIA 1' });

  const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await getHallSessions();
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await createHallSession(newSession);
      toast.success("Session created successfully!");
      setNewSession({ examName: '', month: '', year: '', examMode: 'CIA 1' });
      fetchSessions();
    } catch {
      toast.error("Failed to create session. Please try again.");
    }
  };

  const handleDeleteSession = async (id) => {
    if (!window.confirm("Are you sure you want to delete this session and all its allocations?")) return;
    try {
      await deleteHallSession(id);
      toast.success("Session deleted successfully");
      fetchSessions();
    } catch {
      toast.error("Failed to delete session");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[70vh] text-[#003B73] font-black uppercase tracking-widest animate-pulse">
      Loading Sessions...
    </div>
  );

  return (
    <div className="animate-fadeIn px-4 lg:px-8 pb-20">
      <div className="flex flex-col items-center mb-10 gap-4">
        <h1 className="text-4xl font-black text-[#003B73] tracking-tight text-center">Session Creation</h1>
        <p className="text-gray-500 font-bold">Manage academic examination sessions</p>
      </div>

      <main className="mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Create Session Form */}
        <section className="lg:col-span-5 bg-white p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#003B73] mb-8 flex items-center gap-3">
              <PlusSquare className="text-blue-500" size={26} /> Create Session
            </h2>
            <form onSubmit={handleCreateSession} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Session / Exam Name</label>
                <input type="text" required placeholder="e.g. CIA 1 - SEP 2025"
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#003B73] outline-none font-bold placeholder:text-gray-300 transition-all shadow-inner"
                  value={newSession.examName} onChange={e => setNewSession({ ...newSession, examName: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Month</label>
                  <CustomSelect 
                    className="w-full h-full"
                    value={newSession.month} onChange={e => setNewSession({ ...newSession, month: e.target.value })}>
                    <option value="">Select Month</option>
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </CustomSelect>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Year</label>
                  <input type="text" placeholder="2025" required
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#003B73] outline-none font-bold placeholder:text-gray-300 transition-all shadow-inner"
                    value={newSession.year} onChange={e => setNewSession({ ...newSession, year: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Exam Mode / Type</label>
                <CustomSelect 
                  className="w-full h-full"
                  value={newSession.examMode} onChange={e => setNewSession({ ...newSession, examMode: e.target.value })}>
                  <option value="CIA 1">CIA 1</option>
                  <option value="CIA 2">CIA 2</option>
                  <option value="CIA 3">CIA 3</option>
                  <option value="END_SEM">End Semester</option>
                  <option value="LAB">Lab Exams</option>
                </CustomSelect>
              </div>

              <button type="submit" className="w-full py-5 mt-4 bg-[#003B73] text-white rounded-2xl font-black text-[15px] uppercase tracking-widest hover:bg-[#002850] transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg shadow-blue-900/20">
                <Save size={20} /> Register Session
              </button>
            </form>
          </div>
        </section>

        {/* Sessions List */}
        <section className="lg:col-span-7 space-y-5">
          <div className="flex justify-between items-end mb-2 px-2">
            <div>
              <h3 className="text-2xl font-black text-[#003B73]">Active Sessions</h3>
              <p className="text-gray-400 font-bold text-sm mt-1">Select these sessions in other modules</p>
            </div>
            <span className="text-xs font-black text-[#003B73] bg-blue-50 px-4 py-2 rounded-full uppercase tracking-widest border border-blue-100">{sessions.length} sessions Total</span>
          </div>

          {sessions.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-20 text-center flex flex-col items-center justify-center shadow-sm">
              <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-5">
                <Calendar size={32} />
              </div>
              <p className="text-gray-400 font-black text-xl uppercase tracking-widest">No Sessions Available</p>
              <p className="text-gray-400 font-medium text-sm mt-2">Use the form to create the first examination session.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {sessions.map(s => (
                <div key={s.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-lg hover:border-blue-100 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100/50 text-[#003B73] rounded-2xl flex flex-col items-center justify-center shadow-inner border border-blue-50/50 relative overflow-hidden">
                      <div className="absolute top-0 w-full h-1 bg-[#003B73]/20"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-70 mt-1 truncate w-[90%] text-center">{s.examMode.replace('_', ' ')}</span>
                      <span className="text-3xl font-black leading-none">{s.year ? s.year.slice(-2) : '--'}</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-gray-800 group-hover:text-[#003B73] transition-colors">{s.examName}</h4>
                      <div className="flex items-center gap-3 mt-1.5">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{s.month} {s.year}</p>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{s._count?.allocations || 0} Allocations</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteSession(s.id)} className="w-12 h-12 flex items-center justify-center text-gray-300 bg-gray-50 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-90">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default SessionCreation;
