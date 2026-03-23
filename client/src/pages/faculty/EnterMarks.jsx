import CustomSelect from "../../components/CustomSelect";
import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import { getFacultyAssignments, getActiveSessions } from "../../services/faculty.service";
import { getFacultyMarks, submitFacultyMarks } from "../../services/marks.service";
import {
  Search,
  Save,
  FileSpreadsheet,
  Lock,
  Unlock,
  Download,
  AlertCircle,
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const EnterMarks = () => {
  const location = useLocation();
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [selectedExam, setSelectedExam] = useState("cia1");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);

  const [currentCategory, setCurrentCategory] = useState("THEORY");

  const maxMarks = {
    test: 60,
    assignment: 20,
    attendance: 20,
    lab_attendance: 25,
    lab_observation: 25,
    lab_record: 25,
    lab_model: 25,
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const [assignmentsRes, sessionsRes] = await Promise.all([
        getFacultyAssignments(),
        getActiveSessions()
      ]);
      setAssignments(assignmentsRes.data);
      setActiveSessions(sessionsRes.data || []);
      
      const res = assignmentsRes;
      if (res.data.length > 0) {
        setSelectedAssignmentId(res.data[0].id);
        const cat = res.data[0].subject.subjectCategory || "THEORY";
        setCurrentCategory(cat);
        // Auto-select correct exam type based on first subject's category
        if (cat === 'LAB') setSelectedExam('lab_marks');

        // Handle pre-selected subject from navigation state
        if (location.state?.preSelectSubjectId && res.data.length > 0) {
          const matchingAssignment = res.data.find(a => a.subjectId === parseInt(location.state.preSelectSubjectId));
          if (matchingAssignment) {
            setSelectedAssignmentId(matchingAssignment.id);
            const matchingCat = matchingAssignment.subject.subjectCategory || "THEORY";
            setCurrentCategory(matchingCat);
            if (matchingCat === 'LAB') setSelectedExam('lab_marks');
            else setSelectedExam('cia1');
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async () => {
    if (!selectedAssignmentId) return;
    setLoading(true);
    try {
      const assignment = assignments.find(
        (a) => a.id === parseInt(selectedAssignmentId),
      );
      if (!assignment) return;

      setCurrentCategory(assignment.subject.subjectCategory || "THEORY");

      const res = await getFacultyMarks(assignment.subject.id);
      setStudents(res.data);

      // Check if marks are locked
      if (res.data.length > 0) {
        const firstMark = res.data[0].marks;
        const granularLock = (selectedExam === 'lab_marks' || selectedExam === 'integrated_lab')
          ? firstMark?.isLocked
          : firstMark?.[`isLocked_${selectedExam}`];
        const globalLock = firstMark?.isLocked;
        setIsLocked(!!(granularLock || globalLock)); // Ensure boolean
      } else {
        setIsLocked(false);
      }
    } catch (err) {
      toast.error("Error fetching student list");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (studentId, field, value) => {
    if (isLocked) {
      toast.error("Marks are locked by Admin. Cannot edit.");
      return;
    }

    const numVal = parseFloat(value);
    const max = maxMarks[field] || 100;

    // Allow -1 for absentees, or 0 to max
    if (
      value !== "" &&
      (isNaN(numVal) || numVal < -1 || numVal > max)
    ) {
      return;
    }

    setStudents((prev) =>
      prev.map((s) => {
        if (s.studentId !== studentId) return s;

        // For both lab_marks (pure LAB) and integrated_lab, use direct field name
        const isLabExam = selectedExam === 'integrated_lab' || selectedExam === 'lab_marks';
        const dbField = isLabExam ? field : `${selectedExam}_${field}`;
        return {
          ...s,
          marks: {
            ...s.marks,
            [dbField]: value,
          },
        };
      }),
    );
  };

  const handleSave = async () => {
    if (isLocked) {
      toast.error("Marks are locked by Admin. Cannot save.");
      return;
    }

    if (students.length === 0) {
      toast.error("Please load students first before saving.");
      return;
    }

    setSaving(true);
    try {
      const assignment = assignments.find(
        (a) => a.id === parseInt(selectedAssignmentId),
      );
      if (!assignment) {
        toast.error("No assignment selected. Please reload the page.");
        return;
      }

      // Helper: convert undefined/empty to null, but preserve 0 and -1
      const toVal = (v) => (v === undefined || v === '' ? null : parseFloat(v));

      const promises = students.map((s) => {
        const payload = {
          studentId: s.studentId,
          subjectId: assignment.subject.id,
        };

        const isLabExam = selectedExam === 'integrated_lab' || selectedExam === 'lab_marks';
        const fieldMarks = {};

        if (isLabExam) {
            fieldMarks.lab_attendance = toVal(s.marks.lab_attendance);
            fieldMarks.lab_observation = toVal(s.marks.lab_observation);
            fieldMarks.lab_record = toVal(s.marks.lab_record);
            fieldMarks.lab_model = toVal(s.marks.lab_model);
        } else {
            fieldMarks[`${selectedExam}_test`] = toVal(s.marks[`${selectedExam}_test`]);
            fieldMarks[`${selectedExam}_assignment`] = toVal(s.marks[`${selectedExam}_assignment`]);
            fieldMarks[`${selectedExam}_attendance`] = toVal(s.marks[`${selectedExam}_attendance`]);
        }

        payload.fieldMarks = fieldMarks;

        return submitFacultyMarks(payload);
      });

      await Promise.all(promises);
      toast.success("All marks saved successfully!");
      handleSearch(); // Refresh data
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Error saving marks");
      }
    } finally {
      setSaving(false);
    }
  };

  const exportToExcel = async () => {
    if (students.length === 0) {
      toast.error("No data to export");
      return;
    }

    const assignment = assignments.find(
      (a) => a.id === parseInt(selectedAssignmentId),
    );
    const isLabExam = selectedExam === 'integrated_lab' || selectedExam === 'lab_marks';
    const examLabel = selectedExam === 'integrated_lab' ? "INTEGRATED LAB" : selectedExam === 'lab_marks' ? "LAB MARKS" : selectedExam.toUpperCase().replace("CIA", "CIA-");

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(examLabel);

    // Add columns
    if (isLabExam) {
      worksheet.columns = [
        { header: "S.No", key: "sno", width: 10 },
        { header: "Register Number", key: "regNo", width: 20 },
        { header: "Student Name", key: "name", width: 30 },
        { header: "Attendance (25)", key: "la", width: 15 },
        { header: "Observation (25)", key: "lo", width: 15 },
        { header: "Record (25)", key: "lr", width: 15 },
        { header: "Model (25)", key: "lm", width: 15 },
        { header: "Total (100)", key: "total", width: 15 },
      ];
    } else {
      worksheet.columns = [
        { header: "S.No", key: "sno", width: 10 },
        { header: "Register Number", key: "regNo", width: 20 },
        { header: "Student Name", key: "name", width: 30 },
        { header: "Test (60)", key: "test", width: 15 },
        { header: "Assignment (20)", key: "assign", width: 15 },
        { header: "Attendance (20)", key: "attend", width: 15 },
        { header: "Total (100)", key: "total", width: 15 },
      ];
    }

    // Add rows
    students.forEach((s, idx) => {
      let isAbs = false;
      let total = 0;
      const row = { sno: idx + 1, regNo: s.rollNo, name: s.name };

      // Parse mark value: treat -1/'-1' as absent marker, null/undefined/'' as 0
      const parseVal = (v) => {
        if (v === -1 || v === '-1' || parseFloat(v) === -1) return -1; // absent
        if (v === null || v === undefined || v === '') return 0;
        return parseFloat(v) || 0;
      };

      if (isLabExam) {
        const la = parseVal(s.marks.lab_attendance);
        const lo = parseVal(s.marks.lab_observation);
        const lr = parseVal(s.marks.lab_record);
        const lm = parseVal(s.marks.lab_model);
        isAbs = la === -1 || lo === -1 || lr === -1 || lm === -1;
        total = (la === -1 ? 0 : la) + (lo === -1 ? 0 : lo) + (lr === -1 ? 0 : lr) + (lm === -1 ? 0 : lm);
        row.la = la === -1 ? "ABSENT" : la;
        row.lo = lo === -1 ? "ABSENT" : lo;
        row.lr = lr === -1 ? "ABSENT" : lr;
        row.lm = lm === -1 ? "ABSENT" : lm;
      } else {
        const rawTest = parseVal(s.marks[`${selectedExam}_test`]);
        const rawAssign = parseVal(s.marks[`${selectedExam}_assignment`]);
        const rawAttend = parseVal(s.marks[`${selectedExam}_attendance`]);
        isAbs = rawTest === -1 || rawAssign === -1 || rawAttend === -1;
        total = (rawTest === -1 ? 0 : rawTest) + (rawAssign === -1 ? 0 : rawAssign) + (rawAttend === -1 ? 0 : rawAttend);
        row.test = rawTest === -1 ? "ABSENT" : rawTest;
        row.assign = rawAssign === -1 ? "ABSENT" : rawAssign;
        row.attend = rawAttend === -1 ? "ABSENT" : rawAttend;
      }

      row.total = isAbs ? "ABSENT" : total;
      worksheet.addRow(row);
    });

    const filename = `${assignment.subject.code}_${examLabel}_${assignment.section}_Marks.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, filename);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      <div className="mb-8 animate-fadeIn">
        <h1 className="text-3xl font-black text-[#003B73] mb-2 tracking-tight">
          Enter Marks
        </h1>
        <p className="text-gray-500 font-medium">
          Manage student assessments and CIA marks
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6 animate-fadeIn delay-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Subject & Section
            </label>
            <CustomSelect
              className="w-full font-semibold "
              value={selectedAssignmentId}
              onChange={(e) => {
                setSelectedAssignmentId(e.target.value);
                const a = assignments.find(x => x.id === parseInt(e.target.value));
                if (a) {
                  const cat = a.subject.subjectCategory || "THEORY";
                  setCurrentCategory(cat);
                  // Auto-select correct exam type based on subject category
                  if (cat === 'LAB') setSelectedExam('lab_marks');
                  else if (cat === 'INTEGRATED') setSelectedExam('cia1');
                  else setSelectedExam('cia1');
                }
              }}
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.subject.name} ({a.subject.code}) - Sec {a.section}
                </option>
              ))}
            </CustomSelect>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Exam Component
            </label>
            <CustomSelect
              className="w-full font-semibold "
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
            >
              {/* CIA options: only for THEORY and INTEGRATED subjects */}
              {currentCategory !== 'LAB' && (
                <>
                  <option value="cia1" disabled={!activeSessions.some(s => s.examMode === 'CIA 1')}>CIA - I (Theory) {!activeSessions.some(s => s.examMode === 'CIA 1') && '(Inactive)'}</option>
                  <option value="cia2" disabled={!activeSessions.some(s => s.examMode === 'CIA 2')}>CIA - II (Theory) {!activeSessions.some(s => s.examMode === 'CIA 2') && '(Inactive)'}</option>
                  <option value="cia3" disabled={!activeSessions.some(s => s.examMode === 'CIA 3')}>CIA - III (Theory) {!activeSessions.some(s => s.examMode === 'CIA 3') && '(Inactive)'}</option>
                </>
              )}
              {/* Lab Marks: shown for pure LAB subjects */}
              {currentCategory === 'LAB' && (
                <option value="lab_marks" disabled={!activeSessions.some(s => s.examMode === 'LAB')}>Lab Marks (Internal) {!activeSessions.some(s => s.examMode === 'LAB') && '(Inactive)'}</option>
              )}
              {/* Integrated Lab: shown for INTEGRATED subjects */}
              {currentCategory === 'INTEGRATED' && (
                <option value="integrated_lab" disabled={!activeSessions.some(s => s.examMode === 'LAB')}>Integrated Lab Marks {!activeSessions.some(s => s.examMode === 'LAB') && '(Inactive)'}</option>
              )}
            </CustomSelect>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full bg-[#003B73] hover:bg-[#002850] text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
            >
              <Search size={18} />
              Load Students
            </button>
          </div>
        </div>

        {isLocked && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
            <Lock className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-red-800">
                {selectedExam === 'lab_marks' ? 'Lab Marks' : selectedExam === 'integrated_lab' ? 'Integrated Lab Marks' : selectedExam.toUpperCase().replace("CIA", "CIA-")} Locked
                by Admin
              </p>
              <p className="text-sm text-red-600 mt-1">
                These marks have been locked and cannot be edited.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Marks Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn delay-200">
        <div className="p-6 bg-[#003B73] text-white">
          <h2 className="text-2xl font-bold uppercase tracking-tight">
            {selectedExam === 'lab_marks'
              ? "Lab Marks Entry"
              : selectedExam === 'integrated_lab'
                ? "Integrated Lab Components"
                : `${selectedExam.toUpperCase().replace("CIA", "CIA-")} Marks Entry`}
          </h2>
          <p className="text-blue-100 mt-1 font-medium italic">
            {(selectedExam === 'integrated_lab' || selectedExam === 'lab_marks')
              ? "Attendance (25) + Observation (25) + Record (25) + Model Exam (25) = Total (100)"
              : "Test (60) + Assignment (20) + Attendance (20) = Total (100)"}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003B73] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading students...</p>
            </div>
          </div>
        ) : students.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="p-4 text-left font-black text-gray-400 uppercase tracking-widest text-[10px] w-16">S.No</th>
                    <th className="p-4 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Roll No</th>
                    <th className="p-4 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Student Name</th>

                    {(selectedExam === 'integrated_lab' || selectedExam === 'lab_marks') ? (
                      <>
                        <th className="p-4 text-center font-black text-[#003B73] uppercase tracking-widest text-[10px] bg-blue-50/50">Attendance (25)</th>
                        <th className="p-4 text-center font-black text-[#003B73] uppercase tracking-widest text-[10px] bg-blue-50/50">Observation (25)</th>
                        <th className="p-4 text-center font-black text-[#003B73] uppercase tracking-widest text-[10px] bg-blue-50/50">Record (25)</th>
                        <th className="p-4 text-center font-black text-[#003B73] uppercase tracking-widest text-[10px] bg-blue-50/50">Model Exam (25)</th>
                      </>
                    ) : (
                      <>
                        <th className="p-4 text-center font-black text-[#003B73] uppercase tracking-widest text-[10px] bg-blue-50/50">Test (60)</th>
                        <th className="p-4 text-center font-black text-[#003B73] uppercase tracking-widest text-[10px] bg-blue-50/50">Assignment (20)</th>
                        <th className="p-4 text-center font-black text-[#003B73] uppercase tracking-widest text-[10px] bg-blue-50/50">Attendance (20)</th>
                      </>
                    )}
                    <th className="p-4 text-center font-black text-emerald-600 uppercase tracking-widest text-[10px] bg-emerald-50/50 w-24">Total (100)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((s, idx) => {
                    const isAbs = (val) => val === -1 || val === "-1" || parseFloat(val) === -1;
                    const cleanMark = (val) => isAbs(val) || val === null || val === undefined ? 0 : parseFloat(val);

                    let total = 0;
                    let anyAbsent = false;

                    if (selectedExam === 'integrated_lab' || selectedExam === 'lab_marks') {
                      const la = s.marks.lab_attendance;
                      const lo = s.marks.lab_observation;
                      const lr = s.marks.lab_record;
                      const lm = s.marks.lab_model;
                      anyAbsent = isAbs(la) || isAbs(lo) || isAbs(lr) || isAbs(lm);
                      total = cleanMark(la) + cleanMark(lo) + cleanMark(lr) + cleanMark(lm);
                    } else {
                      const t = s.marks[`${selectedExam}_test`];
                      const a = s.marks[`${selectedExam}_assignment`];
                      const at = s.marks[`${selectedExam}_attendance`];
                      anyAbsent = isAbs(t) || isAbs(a) || isAbs(at);
                      total = cleanMark(t) + cleanMark(at) + cleanMark(a);
                    }

                    return (
                      <tr key={s.studentId} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="p-4 text-gray-400 font-bold font-mono text-xs">{idx + 1}</td>
                        <td className="p-4 font-black text-[#003B73] font-mono text-sm uppercase tracking-tighter">{s.rollNo}</td>
                        <td className="p-4 font-bold text-gray-800 text-sm">{s.name}</td>

                        {(selectedExam === 'integrated_lab' || selectedExam === 'lab_marks') ? (
                          <>
                            <td className="p-2"><input type="number" className={`w-full p-3 border-2 rounded-xl text-center font-black transition-all ${isLocked ? "bg-gray-50 border-gray-100 text-gray-400" : isAbs(s.marks.lab_attendance) ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-gray-100 focus:border-[#003B73]"}`} value={s.marks.lab_attendance === -1 ? "-1" : (s.marks.lab_attendance ?? "")} onChange={(e) => handleInputChange(s.studentId, "lab_attendance", e.target.value)} disabled={isLocked} /></td>
                            <td className="p-2"><input type="number" className={`w-full p-3 border-2 rounded-xl text-center font-black transition-all ${isLocked ? "bg-gray-50 border-gray-100 text-gray-400" : isAbs(s.marks.lab_observation) ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-gray-100 focus:border-[#003B73]"}`} value={s.marks.lab_observation === -1 ? "-1" : (s.marks.lab_observation ?? "")} onChange={(e) => handleInputChange(s.studentId, "lab_observation", e.target.value)} disabled={isLocked} /></td>
                            <td className="p-2"><input type="number" className={`w-full p-3 border-2 rounded-xl text-center font-black transition-all ${isLocked ? "bg-gray-50 border-gray-100 text-gray-400" : isAbs(s.marks.lab_record) ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-gray-100 focus:border-[#003B73]"}`} value={s.marks.lab_record === -1 ? "-1" : (s.marks.lab_record ?? "")} onChange={(e) => handleInputChange(s.studentId, "lab_record", e.target.value)} disabled={isLocked} /></td>
                            <td className="p-2"><input type="number" className={`w-full p-3 border-2 rounded-xl text-center font-black transition-all ${isLocked ? "bg-gray-50 border-gray-100 text-gray-400" : isAbs(s.marks.lab_model) ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-gray-100 focus:border-[#003B73]"}`} value={s.marks.lab_model === -1 ? "-1" : (s.marks.lab_model ?? "")} onChange={(e) => handleInputChange(s.studentId, "lab_model", e.target.value)} disabled={isLocked} /></td>
                          </>
                        ) : (
                          <>
                            <td className="p-2"><input type="number" className={`w-full p-3 border-2 rounded-xl text-center font-black transition-all ${isLocked ? "bg-gray-50 border-gray-100 text-gray-400" : isAbs(s.marks[`${selectedExam}_test`]) ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-gray-100 focus:border-[#003B73]"}`} value={s.marks[`${selectedExam}_test`] === -1 ? "-1" : (s.marks[`${selectedExam}_test`] ?? "")} onChange={(e) => handleInputChange(s.studentId, "test", e.target.value)} disabled={isLocked} /></td>
                            <td className="p-2"><input type="number" className={`w-full p-3 border-2 rounded-xl text-center font-black transition-all ${isLocked ? "bg-gray-50 border-gray-100 text-gray-400" : isAbs(s.marks[`${selectedExam}_assignment`]) ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-gray-100 focus:border-[#003B73]"}`} value={s.marks[`${selectedExam}_assignment`] === -1 ? "-1" : (s.marks[`${selectedExam}_assignment`] ?? "")} onChange={(e) => handleInputChange(s.studentId, "assignment", e.target.value)} disabled={isLocked} /></td>
                            <td className="p-2"><input type="number" className={`w-full p-3 border-2 rounded-xl text-center font-black transition-all ${isLocked ? "bg-gray-50 border-gray-100 text-gray-400" : isAbs(s.marks[`${selectedExam}_attendance`]) ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-gray-100 focus:border-[#003B73]"}`} value={s.marks[`${selectedExam}_attendance`] === -1 ? "-1" : (s.marks[`${selectedExam}_attendance`] ?? "")} onChange={(e) => handleInputChange(s.studentId, "attendance", e.target.value)} disabled={isLocked} /></td>
                          </>
                        )}

                        <td className="p-4 text-center">
                          {anyAbsent ? (
                            <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100 uppercase tracking-widest">Absent</span>
                          ) : (
                            <span className="text-lg font-black text-[#003B73] tracking-tighter">{total.toFixed(0)}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Actions */}
            <div className="p-8 bg-gray-50 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-[#003B73]">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Registry Summary</p>
                  <p className="text-sm font-black text-[#003B73]">{students.length} Student Profiles Loaded</p>
                </div>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <button
                  onClick={exportToExcel}
                  className="flex-1 md:flex-none px-8 py-4 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-[20px] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-sm"
                >
                  <Download size={18} /> Export Datasheet
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || isLocked}
                  className={`flex-1 md:flex-none px-10 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${isLocked ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-[#003B73] text-white hover:bg-[#002850] active:scale-95"}`}
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/50 border-t-white" />
                  ) : (
                    <><Save size={20} /> COMMIT RECORDS</>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-32 text-center bg-gray-50/50">
            <div className="w-24 h-24 bg-white rounded-[40px] shadow-xl border border-gray-100 flex items-center justify-center text-gray-200 mx-auto mb-10 group-hover:scale-110 transition-transform">
              <AlertCircle size={48} />
            </div>
            <h3 className="text-2xl font-black text-gray-300 uppercase tracking-widest mb-3">Void Registry</h3>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">Select Filters & Invoke Pulse Search</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnterMarks;
