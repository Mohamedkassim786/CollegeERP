import CustomSelect from "../../../components/CustomSelect";
import React, { useState, useEffect } from "react";
import {
    Award,
    RefreshCw,
    Filter,
    Download,
    CheckCircle,
    XCircle,
    Ban,
    AlertTriangle,
} from "lucide-react";
import { getEndSemConsolidatedMarks, calculateConsolidatedGrades } from "../../../services/results.service";
import { approveExternalMarks, rejectExternalMarks } from "../../../services/dummy.service";
import { getDepartments } from "../../../services/department.service";
import { getSubjects } from "../../../services/subject.service";
import toast from "react-hot-toast";
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const EndSemMarksEntry = () => {
    const [filters, setFilters] = useState({
        department: "",
        year: "",
        semester: "",
        section: "",
        subjectId: "",
    });

    const [subjects, setSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [batchStatus, setBatchStatus] = useState(null); // 'PENDING', 'APPROVED', 'REJECTED', 'NOT_SUBMITTED'
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [consolidating, setConsolidating] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const deptsRes = await getDepartments();
            setDepartments(deptsRes.data);
        } catch (error) {
            toast.error("Failed to load initial data");
        }
    };

    // Fetch subjects whenever semester changes
    useEffect(() => {
        const fetchSubjects = async () => {
            if (!filters.semester) return;
            try {
                const res = await getSubjects({ semester: filters.semester });
                setSubjects(res.data);
            } catch (error) {
                toast.error("Failed to load subjects");
            }
        };
        fetchSubjects();
    }, [filters.semester]);

    // Track selected subject object for category info
    useEffect(() => {
        if (filters.subjectId && subjects.length > 0) {
            const sub = subjects.find(s => String(s.id) === String(filters.subjectId));
            setSelectedSubject(sub || null);
        } else {
            setSelectedSubject(null);
        }
    }, [filters.subjectId, subjects]);

    const handleSearch = async () => {
        const isYear1 = parseInt(filters.semester) <= 2;
        if (
            !filters.semester ||
            !filters.section ||
            !filters.subjectId ||
            (!isYear1 && !filters.department)
        ) {
            toast.error("Please fill all filters");
            return;
        }

        const searchParams = { ...filters };
        if (isYear1) searchParams.department = "GEN";

        setLoading(true);
        try {
            const res = await getEndSemConsolidatedMarks(searchParams);
            setStudents(res.data.students || []);
            setBatchStatus(res.data.batchStatus || 'NOT_SUBMITTED');
        } catch (error) {
            toast.error("Failed to load results");
        } finally {
            setLoading(false);
        }
    };

    const getMaxExternal = () => {
        const cat = selectedSubject?.subjectCategory || 'THEORY';
        if (cat === 'LAB') return 40;
        if (cat === 'INTEGRATED') return 25;
        return 60;
    };

    const getInternalLabel = () => {
        const cat = selectedSubject?.subjectCategory || 'THEORY';
        if (cat === 'LAB') return 'Internal (60)';
        if (cat === 'INTEGRATED') return 'Internal (50)';
        return 'Internal (40)';
    };

    const getExternalLabel = () => {
        const cat = selectedSubject?.subjectCategory || 'THEORY';
        if (cat === 'LAB') return 'External (/40)';
        if (cat === 'INTEGRATED') return 'External (/50)';
        return 'External (/60)';
    };

    // Workflow: Approve External Marks
    const handleApproveMarks = async () => {
        if (!window.confirm("Are you sure you want to APPROVE these marks? This will lock them for grade generation.")) return;
        setActionLoading(true);
        try {
            await approveExternalMarks({
                subjectId: filters.subjectId,
            });
            toast.success("External marks approved successfully");
            handleSearch(); // Refresh status
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to approve external marks");
        } finally {
            setActionLoading(false);
        }
    };

    // Workflow: Reject External Marks
    const handleRejectMarks = async () => {
        const reason = window.prompt("Enter rejection reason for the staff:");
        if (reason === null) return;
        setActionLoading(true);
        try {
            await rejectExternalMarks({
                subjectId: filters.subjectId,
                reason
            });
            toast.success("External marks rejected. Staff can now resubmit.");
            handleSearch();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reject external marks");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCalculateGrades = async () => {
        setConsolidating(true);
        try {
            await calculateConsolidatedGrades({
                subjectId: filters.subjectId,
                semester: filters.semester,
                regulation: "2021",
            });
            toast.success("Grades calculated and results consolidated");
            handleSearch();
        } catch (error) {
            toast.error(error.response?.data?.message || "Error calculating grades");
        } finally {
            setConsolidating(false);
        }
    };

    const exportResults = async () => {
        if (students.length === 0) {
            toast.error("Search for results first.");
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Consolidated Results");

        worksheet.columns = [
            { header: "Reg No", key: "registerNumber", width: 20 },
            { header: "Name", key: "name", width: 30 },
            { header: getInternalLabel(), key: "internal", width: 15 },
            { header: getExternalLabel(), key: "external", width: 15 },
            { header: "Total (100)", key: "total", width: 15 },
            { header: "Grade", key: "grade", width: 10 },
        ];

        students.forEach((s) => {
            worksheet.addRow({
                registerNumber: s.registerNumber,
                name: s.name,
                internal: s.internal40,
                external: s.external60,
                total: s.total100,
                grade: s.grade,
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `Results_${filters.section}_${filters.subjectId}.xlsx`);
    };

    const isYear1 = parseInt(filters.semester) <= 2;

    const filteredSubjects = subjects.filter((s) => {
        if (parseInt(s.semester) !== parseInt(filters.semester)) return false;
        if (isYear1) return s.type === 'COMMON' || !s.department;
        if (!filters.department) return true;
        
        const selectedDept = departments.find(d => d.code === filters.department || d.name === filters.department);
        const isMatch = s.department === filters.department || 
                        (selectedDept && s.department === selectedDept.name) ||
                        (selectedDept && s.department === selectedDept.code);
                        
        return isMatch || s.type === 'COMMON';
    });

    const catLabel = selectedSubject?.subjectCategory
        ? { THEORY: 'Theory', LAB: 'Lab', INTEGRATED: 'Integrated' }[selectedSubject.subjectCategory] || ''
        : '';

    const maxExternal = getMaxExternal();

    return (
        <div className="w-full animate-fadeIn pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-[#003B73] tracking-tight flex items-center gap-3">
                        <Award className="text-blue-600" size={32} /> Results Consolidation
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">
                        Consolidate internal and external marks to generate final results and grades.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 items-center justify-end">
                    <button
                        onClick={exportResults}
                        className="flex items-center gap-2 px-6 py-4 bg-white text-gray-700 border-2 border-gray-100 rounded-[24px] hover:border-blue-200 hover:bg-blue-50/30 transition-all font-bold shadow-sm"
                    >
                        <Download size={20} /> Export Excel
                    </button>

                    {batchStatus === 'PENDING' && (
                        <>
                            <button
                                onClick={handleRejectMarks}
                                disabled={actionLoading}
                                className="flex items-center gap-2 px-8 py-4 bg-orange-50 text-orange-700 border-2 border-orange-100 rounded-[24px] hover:bg-orange-100 transition-all font-black"
                            >
                                <XCircle size={20} /> REJECT
                            </button>
                            <button
                                onClick={handleApproveMarks}
                                disabled={actionLoading}
                                className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-[24px] hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all font-black"
                            >
                                <CheckCircle size={20} /> APPROVE MARKS
                            </button>
                        </>
                    )}

                    {batchStatus === 'APPROVED' && (
                        <button
                            onClick={handleCalculateGrades}
                            disabled={consolidating}
                            className={`flex items-center gap-2 px-8 py-4 rounded-[24px] shadow-xl shadow-indigo-900/20 transition-all font-black bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1`}
                        >
                            <RefreshCw size={20} className={consolidating ? "animate-spin" : ""} />
                            {consolidating ? "CALCULATING..." : "GENERATE GRADES"}
                        </button>
                    )}

                    {batchStatus === 'NOT_SUBMITTED' && filters.subjectId && (
                        <div className="flex items-center gap-2 px-8 py-4 bg-gray-50 text-gray-400 border-2 border-gray-100 rounded-[24px] font-black cursor-not-allowed">
                            <Ban size={20} /> AWAITING SUBMISSION
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Card */}
            <div className="bg-white p-8 rounded-[40px] shadow-xl shadow-blue-900/5 border border-gray-100 mb-8 relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100 transition-colors pointer-events-none"></div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-[50]">
                    {!isYear1 && (
                        <div className="z-50 relative">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                                Department
                            </label>
                            <CustomSelect
                                className="w-full"
                                value={filters.department}
                                onChange={(e) =>
                                    setFilters({ ...filters, department: e.target.value, subjectId: "" })
                                }
                            >
                                <option value="">Select Dept...</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.code || d.name}>
                                        {d.code || d.name}
                                    </option>
                                ))}
                            </CustomSelect>
                        </div>
                    )}
                    <div className="relative z-40">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                            Semester
                        </label>
                        <CustomSelect
                            className="w-full"
                            value={filters.semester}
                            onChange={(e) => {
                                const sem = parseInt(e.target.value);
                                const year = Math.ceil(sem / 2);
                                setFilters({
                                    ...filters,
                                    semester: e.target.value,
                                    year: year.toString(),
                                    subjectId: "",
                                });
                            }}
                        >
                            <option value="">Choose...</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                <option key={s} value={s}>Sem {s}</option>
                            ))}
                        </CustomSelect>
                    </div>
                    <div className="relative z-30">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                            Section
                        </label>
                        <CustomSelect
                            className="w-full"
                            value={filters.section}
                            onChange={(e) =>
                                setFilters({ ...filters, section: e.target.value })
                            }
                        >
                            <option value="">Choose...</option>
                            {["A", "B", "C", "D"].map((s) => (
                                <option key={s} value={s}>Section {s}</option>
                            ))}
                        </CustomSelect>
                    </div>
                    <div className="md:col-span-1 relative z-20">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                            Subject
                        </label>
                        <CustomSelect
                            className="w-full"
                            value={filters.subjectId}
                            onChange={(e) =>
                                setFilters({ ...filters, subjectId: e.target.value })
                            }
                        >
                            <option value="">Search Subject...</option>
                            {filteredSubjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.code} - {s.name}
                                </option>
                            ))}
                        </CustomSelect>
                    </div>
                    <div className="flex flex-col justify-end">
                        <button
                            onClick={handleSearch}
                            className="w-full bg-[#003B73] text-white py-4 rounded-2xl hover:bg-blue-800 transition-all font-black shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 h-[52px]"
                        >
                            <Filter size={20} /> LOAD RESULTS
                        </button>
                    </div>
                </div>

                {/* Selected subject info */}
                {selectedSubject && (
                    <div className="mt-8 pt-8 border-t border-gray-50 flex items-center gap-6 flex-wrap relative z-0 animate-slideIn">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Target Module</span>
                            <div className="flex items-center gap-3">
                                <span className="font-black text-[#003B73] text-lg">{selectedSubject.name}</span>
                                <span className="text-xs font-black text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">{selectedSubject.code}</span>
                            </div>
                        </div>

                        <div className="h-10 w-px bg-gray-100"></div>

                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Type</span>
                            <span className={`text-xs font-black px-4 py-1.5 rounded-xl uppercase tracking-wider ${selectedSubject.subjectCategory === 'LAB' ? 'bg-emerald-50 text-emerald-700' :
                                selectedSubject.subjectCategory === 'INTEGRATED' ? 'bg-indigo-50 text-indigo-700' :
                                    'bg-blue-50 text-blue-700'
                                }`}>
                                {catLabel}
                            </span>
                        </div>

                        <div className="ml-auto flex flex-col items-end">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Maximum Scale</span>
                            <span className="text-xl font-black text-[#003B73] font-mono">/{maxExternal} <span className="text-xs text-gray-400">RAW</span></span>
                        </div>
                    </div>
                )}
            </div>

            {students.length > 0 && (
                <div className={`rounded-[24px] p-6 mb-8 text-white relative overflow-hidden group shadow-xl ${
                    batchStatus === 'APPROVED' ? 'bg-emerald-600' : 
                    batchStatus === 'PENDING' ? 'bg-blue-600' :
                    batchStatus === 'REJECTED' ? 'bg-orange-600' : 'bg-gray-600'
                }`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                            {batchStatus === 'APPROVED' ? <CheckCircle size={24}/> : <Award size={24} />}
                        </div>
                        <div>
                            <p className="font-bold text-sm">
                                {batchStatus === 'APPROVED' ? 'Workflow Blocked: Approved' :
                                 batchStatus === 'PENDING' ? 'Action Required: Approval Hub' :
                                 batchStatus === 'REJECTED' ? 'Status: Marks Rejected' : 'Status: Data Entry Phase'}
                            </p>
                            <p className="text-xs text-blue-50 mt-0.5">
                                {batchStatus === 'APPROVED' ? 'Grades can now be securely generated. Marks are locked from external modification.' :
                                 batchStatus === 'PENDING' ? 'External staff have submitted their evaluative batches. Verify the scaled figures below to Approve or Reject.' :
                                 batchStatus === 'REJECTED' ? 'Awaiting resubmission from external staff after administrative rejection.' : 'The Subject is still under the data-entry phase by external staff.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Marks Table */}
            <div className="bg-white rounded-[40px] shadow-sm overflow-hidden border border-gray-100 mb-10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Student Identifier</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">{getInternalLabel()}</th>
                                {selectedSubject?.subjectCategory === 'INTEGRATED' ? (
                                    <>
                                        <th className="px-8 py-6 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] text-center italic opacity-60">Th (/100)</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] text-center">Theory (/25)</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] text-center italic opacity-60">Lab (/100)</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] text-center">Lab (/25)</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Ext. Total (/50)</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-8 py-6 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] text-center italic opacity-60">Ext (/100)</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] text-center">{getExternalLabel()}</th>
                                    </>
                                )}
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Consolidated</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center whitespace-nowrap">Grade Record</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="11" className="px-8 py-32 text-center text-gray-400">
                                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                                        <p className="font-black uppercase tracking-widest text-sm">Polling Results...</p>
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td className="px-8 py-32 text-center text-gray-300" colSpan="11">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center opacity-40">
                                                <Award size={48} className="text-gray-300" />
                                            </div>
                                            <p className="font-black text-xl text-gray-300 uppercase tracking-widest">Awaiting Command</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                students.map((s) => {
                                    return (
                                        <tr
                                            key={s.id}
                                            className="hover:bg-blue-50/20 transition-all group border-b border-gray-50"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-[#003B73]">{s.name}</span>
                                                    <span className="font-mono text-[10px] uppercase text-gray-400 font-bold tracking-widest">
                                                        {s.rollNo} • {s.registerNumber}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-[#003B73] rounded-2xl font-black text-sm">
                                                    {s.internal40}
                                                </span>
                                            </td>

                                            {selectedSubject?.subjectCategory === 'INTEGRATED' ? (
                                                <>
                                                    <td className="px-8 py-6 text-center">
                                                        <span className="font-bold text-blue-400 text-sm font-mono italic opacity-60">
                                                            {s.theoryRaw100 != null ? s.theoryRaw100 : '--'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        {s.external60 === 'AB' ? (
                                                            <span className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase">ABSENT</span>
                                                        ) : (
                                                            <span className="font-black text-indigo-600 text-lg font-mono">
                                                                {s.theoryExt25 != null ? s.theoryExt25 : '--'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <span className="font-bold text-emerald-400 text-sm font-mono italic opacity-60">
                                                            {s.labRaw100 != null ? s.labRaw100 : '--'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <span className="font-black text-emerald-600 text-lg font-mono">
                                                            {s.labExt25 != null ? s.labExt25 : '--'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <span className="inline-flex items-center justify-center px-4 py-2 bg-gray-50 text-[#003B73] rounded-xl font-black text-sm border border-gray-100 font-mono">
                                                            {(s.theoryExt25 != null && s.labExt25 != null) ? (s.theoryExt25 + s.labExt25) : '--'}
                                                        </span>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-8 py-6 text-center font-mono font-bold text-blue-400 italic opacity-60">
                                                        {s.external60 === 'AB' ? '--' : (s.rawExternal100 != null ? s.rawExternal100 : '--')}
                                                    </td>
                                                    <td className="px-8 py-6 text-center font-mono font-black text-blue-600 text-lg">
                                                        {s.external60 === 'AB' ? (
                                                            <span className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase font-sans">ABSENT</span>
                                                        ) : (
                                                            s.external60 != null ? s.external60 : '--'
                                                        )}
                                                    </td>
                                                </>
                                            )}

                                            <td className="px-8 py-6 text-center relative">
                                                <span className={`inline-flex items-center justify-center px-6 py-2 rounded-2xl font-black text-lg shadow-sm border ${s.total100 === 'AB' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-[#003B73] text-white border-transparent'
                                                    }`}>
                                                    {s.total100 !== 'AB' ? s.total100 : 'AB'}
                                                </span>
                                                {s.total100 > 100 && (
                                                    <div className="absolute top-2 right-2 text-red-500 animate-pulse">
                                                        <AlertTriangle size={14} />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className={`inline-block px-4 py-2 rounded-2xl font-black text-xs shadow-inner tracking-widest ${s.grade === "RA" || s.grade === "N/A" || s.grade === 'AB'
                                                    ? "bg-red-50 text-red-700"
                                                    : "bg-emerald-50 text-emerald-700"
                                                    }`}>
                                                    {s.grade || 'PENDING'}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EndSemMarksEntry;
