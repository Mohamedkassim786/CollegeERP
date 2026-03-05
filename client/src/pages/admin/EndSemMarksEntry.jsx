import CustomSelect from "../../components/CustomSelect";
import React, { useState, useEffect } from "react";
import {
    Award,
    Save,
    RefreshCw,
    Filter,
    Download,
} from "lucide-react";
import api from "../../api/axios";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
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
    const [externalEdits, setExternalEdits] = useState({}); // { [studentId]: externalMark }
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [consolidating, setConsolidating] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const deptsRes = await api.get("/admin/departments");
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
                const res = await api.get(`/admin/subjects?semester=${filters.semester}`);
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
            const res = await api.get("/exam/end-sem-marks", { params: searchParams });
            setStudents(res.data);
            // Pre-fill external edits with existing values
            const edits = {};
            res.data.forEach(s => {
                if (s.external60 !== 'AB' && s.external60 !== null && s.external60 !== 0) {
                    edits[s.id] = s.external60;
                }
            });
            setExternalEdits(edits);
        } catch (error) {
            toast.error("Failed to load results");
        } finally {
            setLoading(false);
        }
    };

    const getMaxExternal = () => {
        const cat = selectedSubject?.subjectCategory || 'THEORY';
        if (cat === 'LAB') return 40;
        if (cat === 'INTEGRATED') return 50;
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
        if (cat === 'LAB') return 'External (40)';
        if (cat === 'INTEGRATED') return 'External (50)';
        return 'External (60)';
    };

    const handleExternalChange = (studentId, value) => {
        if (value === '') {
            setExternalEdits(prev => ({ ...prev, [studentId]: '' }));
            return;
        }
        const intVal = parseInt(value, 10);
        const max = getMaxExternal();
        if (!isNaN(intVal) && intVal >= 0 && intVal <= max) {
            setExternalEdits(prev => ({ ...prev, [studentId]: intVal }));
        }
    };

    // Save external marks directly via externalMark API using register number as dummyNumber key
    const handleSaveExternalMarks = async () => {
        if (!filters.subjectId || students.length === 0) {
            toast.error("Load students first");
            return;
        }

        const cat = selectedSubject?.subjectCategory || 'THEORY';
        const marksArray = [];

        students.forEach(s => {
            const val = externalEdits[s.id];
            if (val !== undefined && val !== '') {
                marksArray.push({
                    dummyNumber: s.dummyNumber || s.registerNumber,
                    rawMark: parseInt(val, 10),
                });
            }
        });

        if (marksArray.length === 0) {
            toast.error("No external marks entered");
            return;
        }

        setSaving(true);
        try {
            await api.post("/external/marks/submit-admin", {
                subjectId: filters.subjectId,
                marks: marksArray,
            });
            toast.success(`External marks saved for ${marksArray.length} students`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save external marks");
        } finally {
            setSaving(false);
        }
    };

    const handleCalculateGrades = async () => {
        setConsolidating(true);
        try {
            await api.post("/exam/end-sem-marks", {
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
        return s.department === filters.department || s.type === 'COMMON';
    });

    const catLabel = selectedSubject?.subjectCategory
        ? { THEORY: 'Theory', LAB: 'Lab', INTEGRATED: 'Integrated' }[selectedSubject.subjectCategory] || ''
        : '';

    const maxExternal = getMaxExternal();

    return (
        <div className="w-full animate-fadeIn">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-black text-[#003B73] tracking-tight flex items-center gap-3">
                        <Award className="text-blue-600" size={32} /> End Semester Marks
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">
                        Enter external marks and consolidate end-semester results
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={exportResults}
                        className="flex items-center gap-2 px-5 py-3 bg-white text-gray-700 border border-gray-200 rounded-2xl hover:bg-gray-50 shadow-sm transition-all font-bold"
                    >
                        <Download size={18} /> Export
                    </button>
                    <button
                        onClick={handleSaveExternalMarks}
                        disabled={saving || students.length === 0}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl shadow-lg transition-all font-black ${saving || students.length === 0 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700 hover:-translate-y-0.5 shadow-green-900/10"}`}
                    >
                        <Save size={18} className={saving ? "animate-pulse" : ""} />
                        {saving ? "Saving..." : "Save External Marks"}
                    </button>
                    <button
                        onClick={handleCalculateGrades}
                        disabled={consolidating || students.length === 0}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl shadow-xl transition-all font-black ${consolidating || students.length === 0 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700 hover:-translate-y-0.5 shadow-red-900/10"}`}
                    >
                        <RefreshCw size={18} className={consolidating ? "animate-spin" : ""} />
                        {consolidating ? "Calculating..." : "Calculate Grades"}
                    </button>
                </div>
            </div>

            {/* Filter Card */}
            <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-blue-900/5 border border-gray-100 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {!isYear1 && (
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                                Department
                            </label>
                            <CustomSelect
                                className="w-full"
                                value={filters.department}
                                onChange={(e) =>
                                    setFilters({ ...filters, department: e.target.value, subjectId: "" })
                                }
                            >
                                <option value="">Select...</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.code || d.name}>
                                        {d.code || d.name}
                                    </option>
                                ))}
                            </CustomSelect>
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
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
                                    department: "",
                                });
                            }}
                        >
                            <option value="">Select...</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                <option key={s} value={s}>Sem {s}</option>
                            ))}
                        </CustomSelect>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                            Section
                        </label>
                        <CustomSelect
                            className="w-full"
                            value={filters.section}
                            onChange={(e) =>
                                setFilters({ ...filters, section: e.target.value })
                            }
                        >
                            <option value="">Select...</option>
                            {["A", "B", "C", "D"].map((s) => (
                                <option key={s} value={s}>Section {s}</option>
                            ))}
                        </CustomSelect>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                            Subject
                        </label>
                        <CustomSelect
                            className="w-full"
                            value={filters.subjectId}
                            onChange={(e) =>
                                setFilters({ ...filters, subjectId: e.target.value })
                            }
                        >
                            <option value="">Select...</option>
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
                            className="w-full bg-[#003B73] text-white py-4 rounded-2xl hover:bg-blue-800 transition-all font-black shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                        >
                            <Filter size={20} /> Load Students
                        </button>
                    </div>
                </div>

                {/* Selected subject info */}
                {selectedSubject && (
                    <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-4 flex-wrap">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Selected:</span>
                        <span className="font-black text-[#003B73]">{selectedSubject.name}</span>
                        <span className="text-xs font-black text-gray-500 font-mono">{selectedSubject.code}</span>
                        {catLabel && (
                            <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${selectedSubject.subjectCategory === 'LAB' ? 'bg-green-100 text-green-700' :
                                selectedSubject.subjectCategory === 'INTEGRATED' ? 'bg-purple-100 text-purple-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                {catLabel}
                            </span>
                        )}
                        <span className="ml-auto text-xs text-gray-400 font-bold">
                            External marks: max /{maxExternal}
                        </span>
                    </div>
                )}
            </div>

            {/* Workflow hint */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 text-sm text-blue-700 font-medium">
                <strong>How to use:</strong> Enter external marks in the column below → <strong>Save External Marks</strong> → then <strong>Calculate Grades</strong> to consolidate.
            </div>

            {/* Marks Table */}
            <div className="bg-white rounded-[32px] shadow-xl shadow-blue-900/5 overflow-hidden border border-gray-100">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Reg No</th>
                            <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Student Name</th>
                            <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center">{getInternalLabel()}</th>
                            {selectedSubject?.subjectCategory === 'INTEGRATED' && (
                                <>
                                    <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center">CIA 1</th>
                                    <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center">CIA 2</th>
                                    <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center">CIA 3</th>
                                    <th className="px-6 py-5 text-xs font-black text-blue-400 uppercase tracking-widest text-center">Theory (25)</th>
                                    <th className="px-6 py-5 text-xs font-black text-purple-400 uppercase tracking-widest text-center">Lab (25)</th>
                                </>
                            )}
                            <th className="px-6 py-5 text-xs font-black text-blue-600 uppercase tracking-widest text-center">{getExternalLabel()} ✏️</th>
                            <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Total (100)</th>
                            <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Grade</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-8 py-32 text-center text-gray-400">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003B73] mx-auto mb-6"></div>
                                    <p className="font-bold text-lg">Fetching data...</p>
                                </td>
                            </tr>
                        ) : students.length === 0 ? (
                            <tr>
                                <td className="px-8 py-32 text-center text-gray-300" colSpan="6">
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                                            <Award size={48} className="text-gray-100" />
                                        </div>
                                        <p className="font-black text-2xl text-gray-400">Select filters and click Load Students</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            students.map((s) => {
                                const editVal = externalEdits[s.id];
                                const displayExternal = editVal !== undefined && editVal !== '' ? editVal : (s.external60 !== 'AB' ? s.external60 : '');
                                const previewTotal = s.internal40 + (parseInt(editVal) || 0);

                                return (
                                    <tr
                                        key={s.id}
                                        className="hover:bg-gray-50/50 transition-colors group"
                                    >
                                        <td className="px-6 py-5 font-mono text-sm uppercase text-[#003B73] font-bold">
                                            {s.registerNumber}
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="font-bold text-[#003B73]">{s.name}</p>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="bg-blue-50 text-[#003B73] px-4 py-2 rounded-xl font-black">
                                                {s.internal40}
                                            </span>
                                        </td>
                                        {selectedSubject?.subjectCategory === 'INTEGRATED' && (
                                            <>
                                                <td className="px-6 py-5 text-center font-mono text-xs text-gray-400">{s.cia1?.toFixed(1) || '0.0'}</td>
                                                <td className="px-6 py-5 text-center font-mono text-xs text-gray-400">{s.cia2?.toFixed(1) || '0.0'}</td>
                                                <td className="px-6 py-5 text-center font-mono text-xs text-gray-400">{s.cia3?.toFixed(1) || '0.0'}</td>
                                                <td className="px-6 py-5 text-center font-mono text-sm font-bold text-blue-600 bg-blue-50/20">
                                                    {(() => {
                                                        const totals = [s.cia1 || 0, s.cia2 || 0, s.cia3 || 0].sort((a, b) => b - a);
                                                        const theoryRaw = totals.length >= 2 ? (totals[0] + totals[1]) / 2 : (totals[0] || 0);
                                                        return ((theoryRaw / 100) * 25).toFixed(1);
                                                    })()}
                                                </td>
                                                <td className="px-6 py-5 text-center font-mono text-sm font-bold text-purple-600 bg-purple-50/20">
                                                    {((s.lab || 0) / 100 * 25).toFixed(1)}
                                                </td>
                                            </>
                                        )}
                                        <td className="px-6 py-5 text-center">
                                            {s.external60 === 'AB' ? (
                                                <span className="bg-red-100 text-red-600 px-4 py-2 rounded-xl font-black text-sm">
                                                    ABSENT
                                                </span>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={maxExternal}
                                                        value={displayExternal ?? ''}
                                                        onChange={(e) => handleExternalChange(s.id, e.target.value)}
                                                        className="w-20 p-2 bg-blue-50 border-2 border-transparent focus:border-blue-500 rounded-xl outline-none font-black text-center text-[#003B73] transition-all"
                                                        placeholder="0"
                                                    />
                                                    <span className="text-gray-400 font-bold text-xs">/{maxExternal}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="bg-[#003B73] text-white px-5 py-2 rounded-2xl font-black shadow-lg text-lg">
                                                {s.total100 !== 'AB' && s.total100 !== 0
                                                    ? s.total100
                                                    : (editVal !== undefined && editVal !== '' ? previewTotal : '-')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className={`inline-block px-4 py-2 rounded-2xl font-black text-sm shadow-sm ${s.grade === "RA" || s.grade === "N/A" || s.grade === 'AB'
                                                ? "bg-red-100 text-red-700"
                                                : "bg-emerald-100 text-emerald-700"
                                                }`}>
                                                {s.grade}
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
    );
};

export default EndSemMarksEntry;
