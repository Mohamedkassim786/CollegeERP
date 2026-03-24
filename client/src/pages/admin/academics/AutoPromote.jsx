import React, { useState, useEffect } from 'react';
import { ArrowRight, AlertTriangle, CheckCheck, AlertCircle, Settings2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { executeGlobalPromotion, promoteFirstYearBatch, getPromotionPreview } from '../../../services/student.service';
import { getDepartments } from '../../../services/department.service';
import CustomSelect from '../../../components/CustomSelect';

const AutoPromote = () => {
    const [activeTab, setActiveTab] = useState('GLOBAL'); // 'GLOBAL' or 'FIRST_YEAR'
    const [loading, setLoading] = useState(false);
    const [promoting, setPromoting] = useState(false);
    
    // Global State
    const [globalPreview, setGlobalPreview] = useState(null);
    const [unlockedCohorts, setUnlockedCohorts] = useState([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    
    // First Year State
    const [fyStudents, setFyStudents] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [assignments, setAssignments] = useState({}); // mapped by studentId
    const [fyConfirmModal, setFyConfirmModal] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        loadDepartments();
    }, []);

    useEffect(() => {
        loadPreview();
    }, [activeTab]);

    const loadDepartments = async () => {
        try {
            const res = await getDepartments();
            setDepartments(res.data || []);
        } catch (err) {
            toast.error("Failed to load departments.");
        }
    };

    const loadPreview = async () => {
        setLoading(true);
        setUnlockedCohorts([]);
        setResult(null);
        try {
            const res = await getPromotionPreview({ mode: activeTab });
            if (activeTab === 'GLOBAL') {
                setGlobalPreview(res.data);
            } else {
                const studentsData = res.data.students || [];
                setFyStudents(studentsData);
                
                // Pre-fill assignments with the student's current department and section!
                const initialAssignments = {};
                studentsData.forEach(s => {
                    initialAssignments[s.id] = {
                        departmentCode: s.department || '',
                        departmentId: s.departmentId || '',
                        section: s.section || ''
                    };
                });
                setAssignments(initialAssignments);
            }
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to load preview.');
        } finally {
            setLoading(false);
        }
    };

    // --- GLOBAL PROMOTION LOGIC ---
    const confirmGlobal = () => setShowConfirmModal(true);

    const executeGlobal = async () => {
        setShowConfirmModal(false);
        setPromoting(true);
        setUnlockedCohorts([]);
        
        const toastId = toast.loading("Executing Global Progression...");
        try {
            const res = await executeGlobalPromotion();
            setResult(res.data);
            toast.success(res.data.message, { id: toastId });
            loadPreview();
        } catch (e) {
            const data = e.response?.data;
            toast.error(data?.message || "Global Promotion failed.", { id: toastId });
            
            if (data?.unlockedCohorts?.length > 0) {
                setUnlockedCohorts(data.unlockedCohorts);
            }
        } finally {
            setPromoting(false);
        }
    };

    const [fyFilterSection, setFyFilterSection] = useState("");

    const handleAssignmentChange = (studentId, key, value) => {
        setAssignments(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [key]: value
            }
        }));
    };

    // Calculate displayed students based on filter
    const displayedStudents = fyFilterSection ? fyStudents.filter(s => s.section === fyFilterSection) : [];

    const handleMasterSectionChange = (sectionVal) => {
        const newAssignments = { ...assignments };
        displayedStudents.forEach(s => {
            if (newAssignments[s.id]) {
                newAssignments[s.id].section = sectionVal;
            }
        });
        setAssignments(newAssignments);
    };

    const confirmFirstYear = () => {
        if (!fyFilterSection) return toast.error("Please select a Current Section to evaluate students.");
        if (displayedStudents.length === 0) return toast.error("No students in this section to promote.");

        // Validate that all DISPLAYED students have assignments
        const missing = displayedStudents.some(s => !assignments[s.id]?.departmentCode || !assignments[s.id]?.section);
        if (missing) return toast.error("Please allocate a target Department and Section for ALL displayed students.");
        
        setFyConfirmModal(true);
    };

    const executeFirstYear = async () => {
        setFyConfirmModal(false);
        setPromoting(true);
        
        const toastId = toast.loading("Branching First Year Students...");
        
        // Assemble payload ONLY for displayed students
        const payload = Object.entries(assignments)
            .filter(([studentId]) => displayedStudents.some(s => s.id === parseInt(studentId)))
            .map(([studentId, data]) => ({
                studentId: parseInt(studentId),
                departmentCode: data.departmentCode,
                departmentId: data.departmentId,
                section: data.section
            }));

        try {
            const res = await promoteFirstYearBatch({ assignments: payload });
            setResult(res.data);
            toast.success(res.data.message, { id: toastId });
            setFyFilterSection(""); // reset filter after success
            loadPreview();
        } catch (e) {
            toast.error(e.response?.data?.message || "First Year Branching failed.", { id: toastId });
        } finally {
            setPromoting(false);
        }
    };

    // --- RENDERERS ---
    const renderGlobalPromotion = () => (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-gray-200/50 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 flex-1">
                    <h2 className="text-3xl font-black text-[#003B73]">Global Omni-Promotion</h2>
                    <p className="text-gray-500 font-medium">
                        This powerful engine automatically advances ALL active students (Semesters 1 and 3 through 7) to their next immediate semester, preserving their existing sections and departments. It will also automatically graduate Semester 8 students.
                    </p>
                    
                    {globalPreview && (
                        <div className="flex gap-6 mt-6">
                            <div className="bg-blue-50 px-6 py-4 rounded-2xl flex-1 border border-blue-100">
                                <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Ready for Advance</p>
                                <p className="text-3xl font-black text-[#003B73]">{globalPreview.totalPromoting}</p>
                            </div>
                            <div className="bg-purple-50 px-6 py-4 rounded-2xl flex-1 border border-purple-100">
                                <p className="text-[10px] font-black uppercase text-purple-500 tracking-widest">Graduating Out</p>
                                <p className="text-3xl font-black text-purple-900">{globalPreview.totalGraduating}</p>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="bg-[#003B73] p-10 rounded-[32px] w-full md:w-[350px] shadow-lg shadow-blue-900/20 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors pointer-events-none"></div>
                    <ArrowRight className="text-white/20 absolute -right-4 -bottom-4 w-32 h-32" />
                    
                    <p className="text-white/60 font-black text-[10px] uppercase tracking-widest mb-6 relative z-10">Master Control</p>
                    <button 
                        onClick={confirmGlobal}
                        disabled={loading || promoting || (globalPreview?.totalPromoting === 0 && globalPreview?.totalGraduating === 0)}
                        className="w-full bg-white text-[#003B73] hover:bg-gray-50 px-8 py-5 rounded-[20px] font-black text-sm uppercase tracking-widest transition-transform active:scale-95 disabled:opacity-50 relative z-10 flex items-center justify-center gap-3"
                    >
                        {promoting ? 'Executing...' : 'EXECUTE OMNI-PROMOTE'}
                    </button>
                    {!loading && globalPreview?.totalPromoting === 0 && globalPreview?.totalGraduating === 0 && (
                        <p className="text-red-300 text-[10px] uppercase tracking-wider font-bold mt-4">No eligible students detected.</p>
                    )}
                </div>
            </div>

            {unlockedCohorts.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-[32px] p-8 animate-fadeInUp shadow-xl shadow-red-900/5">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-red-900 tracking-tight">System Lock Violation Detected</h3>
                            <p className="text-red-700 text-sm font-semibold">The promotion engine was aborted because the following cohorts have not been officially locked by the examination controller.</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {unlockedCohorts.map((cohort, i) => (
                            <div key={i} className="bg-white border border-red-100 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                <span className="font-bold text-red-950 text-sm">{cohort}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderFirstYearPromotion = () => {
        const availableFySections = [...new Set(fyStudents.map(s => s.section))].filter(Boolean).sort();

        return (
            <div className="space-y-6 animate-fadeIn">
                <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-gray-200/50 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 flex-1">
                        <h2 className="text-3xl font-black text-[#003B73]">First Year Branching</h2>
                        <p className="text-gray-500 font-medium">
                            Semester 2 students must be explicitly assigned to their core academic departments and target sections as they transition into Year 2 (Semester 3).
                        </p>
                        <div className="flex flex-wrap items-center gap-4 mt-6">
                            <div className="bg-white px-6 py-4 rounded-2xl border-2 border-dashed border-gray-200 min-w-[200px] flex flex-col justify-center">
                                <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2">Filter Current Section</p>
                                <CustomSelect 
                                    value={fyFilterSection}
                                    onChange={(e) => setFyFilterSection(e.target.value)}
                                    className="w-full bg-gray-50 font-bold border-2 border-transparent focus:border-[#003B73]"
                                >
                                    <option value="">-- Choose Section --</option>
                                    {availableFySections.map(sec => <option key={sec} value={sec}>Current Sec {sec}</option>)}
                                </CustomSelect>
                            </div>
                            
                            <div className="bg-amber-50 px-6 py-4 rounded-2xl border border-amber-100 min-w-[150px]">
                                <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Pending in Sec {fyFilterSection || '?'}</p>
                                <p className="text-3xl font-black text-amber-900">{displayedStudents.length}</p>
                            </div>
                            
                            {displayedStudents.length > 0 && (
                                <div className="bg-blue-50 px-6 py-4 rounded-2xl border border-blue-100 flex-1 min-w-[200px] flex flex-col justify-center">
                                    <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-2">Master Target Sec (Optional)</p>
                                    <CustomSelect 
                                        onChange={(e) => handleMasterSectionChange(e.target.value)}
                                        className="w-full bg-white font-bold"
                                    >
                                        <option value="">-- Apply Sec to All Displayed --</option>
                                        {['A', 'B', 'C', 'D'].map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
                                    </CustomSelect>
                                </div>
                            )}
                        </div>
                    </div>
                
                <div className="bg-amber-500 p-10 rounded-[32px] w-full md:w-[350px] shadow-lg shadow-amber-900/20 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors pointer-events-none"></div>
                    <Users className="text-amber-900/20 absolute -left-4 -bottom-4 w-32 h-32" />
                    
                    <p className="text-amber-950/60 font-black text-[10px] uppercase tracking-widest mb-6 relative z-10">Department Allocation</p>
                    <button 
                        onClick={confirmFirstYear}
                        disabled={loading || promoting || fyStudents.length === 0}
                        className="w-full bg-amber-900 text-white hover:bg-amber-950 px-8 py-5 rounded-[20px] font-black text-sm uppercase tracking-widest transition-transform active:scale-95 disabled:opacity-50 relative z-10 flex items-center justify-center gap-3"
                    >
                        {promoting ? 'Executing...' : 'DEPLOY CADETS'}
                    </button>
                </div>
            </div>

            {fyStudents.length > 0 && (
                <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                                    <th className="px-8 py-5">Roll Number</th>
                                    <th className="px-8 py-5">Student Name</th>
                                    <th className="px-8 py-5 text-center w-64">Target Dept</th>
                                    <th className="px-8 py-5 text-center w-40">Target Sec</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {fyStudents.map(s => {
                                    const deptVal = assignments[s.id]?.departmentCode || "";
                                    const secVal = assignments[s.id]?.section || "";
                                    const selectedDept = departments.find(d => d.code === deptVal || d.name === deptVal);
                                    const availableSections = selectedDept?.sections ? selectedDept.sections.split(',') : ['A', 'B', 'C'];
                                    
                                    return (
                                        <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-8 py-5 font-mono text-sm text-[#003B73] font-bold">{s.rollNo}</td>
                                            <td className="px-8 py-5 font-bold text-gray-800 text-sm">{s.name}</td>
                                            <td className="px-8 py-3">
                                                <CustomSelect 
                                                    value={assignments[s.id]?.departmentId || ""}
                                                    onChange={(e) => {
                                                        const id = parseInt(e.target.value);
                                                        const dept = departments.find(d => d.id === id);
                                                        handleAssignmentChange(s.id, 'departmentId', id);
                                                        handleAssignmentChange(s.id, 'departmentCode', dept?.name || ""); // Standardize to Full Name
                                                        // reset section
                                                        handleAssignmentChange(s.id, 'section', '');
                                                    }}
                                                    className="w-full"
                                                >
                                                    <option value="">Select Dept</option>
                                                    {departments.filter(d => d.type !== 'Support' && d.name !== 'First Year' && d.code !== 'GEN1').map(d => (
                                                        <option key={d.id} value={d.id}>{d.code || d.name}</option>
                                                    ))}
                                                </CustomSelect>
                                            </td>
                                            <td className="px-8 py-3">
                                                <CustomSelect 
                                                    value={secVal}
                                                    onChange={e => handleAssignmentChange(s.id, 'section', e.target.value)}
                                                    className="w-full"
                                                    disabled={!deptVal}
                                                >
                                                    <option value="">Sec</option>
                                                    {availableSections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                                                </CustomSelect>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-blue-50 rounded-2xl text-[#003B73]">
                        <Settings2 size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[#003B73] tracking-tighter">Auto Promotion Engine</h1>
                        <p className="text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Mass Academic Progression System</p>
                    </div>
                </div>

                <div className="flex bg-gray-100/50 p-2 rounded-2xl">
                    <button 
                        onClick={() => setActiveTab('GLOBAL')}
                        className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'GLOBAL' ? 'bg-white text-[#003B73] shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Global Advance
                    </button>
                    <button 
                        onClick={() => setActiveTab('FIRST_YEAR')}
                        className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'FIRST_YEAR' ? 'bg-white text-[#003B73] shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        First Year Branching
                    </button>
                </div>
            </div>

            {loading && <div className="text-center py-20 animate-pulse font-black text-gray-300 uppercase tracking-widest text-sm">CALIBRATING SYSTEM DATA...</div>}

            {result && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-[32px] p-10 text-center shadow-xl shadow-emerald-900/5 animate-scaleIn mt-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10">
                        <CheckCheck className="text-emerald-600" size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-emerald-900 mb-2 relative z-10 tracking-tight">Operation Successful</h2>
                    <p className="text-emerald-700 font-bold max-w-lg mx-auto relative z-10 text-sm">{result.message}</p>
                    <button onClick={() => setResult(null)} className="mt-8 px-10 py-4 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 focus:outline-none">ACKNOWLEDGE</button>
                </div>
            )}

            {!loading && !result && activeTab === 'GLOBAL' && renderGlobalPromotion()}
            {!loading && !result && activeTab === 'FIRST_YEAR' && renderFirstYearPromotion()}

            {/* Global Confirm Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}></div>
                    <div className="bg-white rounded-[32px] w-[90%] max-w-md p-8 relative z-10 shadow-2xl animate-scaleIn border border-gray-100">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-[20px] flex items-center justify-center mb-6 mx-auto animate-pulse">
                            <AlertTriangle size={32} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-2xl font-black text-center text-gray-900 mb-2 tracking-tight">System Notice</h2>
                        <div className="bg-red-50 border border-red-100 p-5 rounded-[20px] mb-8 mt-6">
                            <p className="text-sm text-red-800 text-center font-black uppercase tracking-widest">Global Lock Validation</p>
                            <p className="text-xs text-red-600/80 text-center mt-3 font-semibold uppercase tracking-wider">
                                We are about to execute promotion on the entire university database. The system will first check if all semesters are firmly locked. If any are open, the operation will be aborted. Proceed?
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-4 font-black text-xs uppercase tracking-widest rounded-[20px] bg-gray-100 text-gray-600 hover:bg-gray-200">Cancel</button>
                            <button onClick={executeGlobal} className="flex-[1.5] py-4 font-black text-xs uppercase tracking-widest rounded-[20px] bg-red-500 hover:bg-red-600 text-white shadow-lg flex justify-center items-center">Engage Validation</button>
                        </div>
                    </div>
                </div>
            )}

            {/* First Year Confirm Modal */}
            {fyConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setFyConfirmModal(false)}></div>
                    <div className="bg-white rounded-[32px] w-[90%] max-w-md p-8 relative z-10 shadow-2xl animate-scaleIn border border-amber-100">
                        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-[20px] flex items-center justify-center mb-6 mx-auto">
                            <Users size={32} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-2xl font-black text-center text-amber-900 mb-2 tracking-tight">Final Authorization</h2>
                        <div className="bg-amber-50 border border-amber-100 p-5 rounded-[20px] mb-8 mt-6">
                            <p className="text-sm text-amber-800 text-center font-black uppercase tracking-widest">Execute Department Branching</p>
                            <p className="text-xs text-amber-700/80 text-center mt-3 font-semibold uppercase tracking-wider">
                                This will migrate all First Year Sem 2 students into Sem 3 inside their assigned core departments. Cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setFyConfirmModal(false)} className="flex-1 py-4 font-black text-xs uppercase tracking-widest rounded-[20px] bg-gray-100 text-gray-600 hover:bg-gray-200">Cancel</button>
                            <button onClick={executeFirstYear} className="flex-[1.5] py-4 font-black text-xs uppercase tracking-widest rounded-[20px] bg-amber-600 hover:bg-amber-700 text-white shadow-lg flex justify-center items-center">Allocate Cadets</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AutoPromote;
