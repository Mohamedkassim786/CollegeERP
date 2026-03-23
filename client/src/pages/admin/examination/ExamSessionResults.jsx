import React, { useState, useEffect } from "react";
import { Search, Award, CheckCircle, XCircle, RefreshCw, Layers } from "lucide-react";
import CustomSelect from "../../../components/CustomSelect";
import { getDepartments } from "../../../services/department.service";
import { getPublishStatus, publishResult, unpublishResult, getIndividualStudentResultsAdmin } from "../../../services/results.service";
import toast from "react-hot-toast";

const ExamSessionResults = () => {
  const [activeTab, setActiveTab] = useState("PUBLISH");
  
  // Publish Tab State
  const [publishFilters, setPublishFilters] = useState({
    department: "", semester: "", year: new Date().getFullYear(), section: "A"
  });
  const [departments, setDepartments] = useState([]);
  const [publishLoading, setPublishLoading] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [publishStatusChecked, setPublishStatusChecked] = useState(false);

  // Student Result View Tab State
  const [regNo, setRegNo] = useState("");
  const [studentSemester, setStudentSemester] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [studentLoading, setStudentLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const deptsRes = await getDepartments();
      setDepartments(deptsRes.data);
      if (deptsRes.data.length > 0) {
        setPublishFilters(prev => ({ ...prev, department: deptsRes.data[0].name }));
      }
    } catch (error) {
      toast.error("Failed to load departments");
    }
  };

  const handleCheckPublishStatus = async () => {
    if (!publishFilters.department || !publishFilters.semester) {
      toast.error("Please select Department and Semester");
      return;
    }
    setPublishLoading(true);
    try {
      const res = await getPublishStatus({
        department: publishFilters.department,
        semester: publishFilters.semester,
        year: publishFilters.year,
        section: publishFilters.section
      });
      setIsPublished(res.data.isPublished);
      setPublishStatusChecked(true);
      toast.success("Publish status loaded");
    } catch (error) {
      console.error("Status check failed", error);
      toast.error("Failed to check status");
    } finally {
      setPublishLoading(false);
    }
  };

  const handlePublishToggle = async () => {
    const action = isPublished ? 'unpublish' : 'publish';
    const confirmMsg = isPublished 
      ? "Are you sure you want to UNPUBLISH these results? Students will no longer see them."
      : "Are you sure you want to PUBLISH these results? They will be visible to students.";
    
    if (!window.confirm(confirmMsg)) return;

    setPublishLoading(true);
    const toastId = toast.loading(`${isPublished ? 'Unpublishing' : 'Publishing'} results...`);
    try {
      if (isPublished) {
        await unpublishResult(publishFilters);
        setIsPublished(false);
        toast.success("Results unpublished successfully", { id: toastId });
      } else {
        await publishResult(publishFilters);
        setIsPublished(true);
        toast.success("Results published successfully", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${action} results`, { id: toastId });
    } finally {
      setPublishLoading(false);
    }
  };

  const handleFetchStudentResult = async () => {
    if (!regNo.trim()) {
      toast.error("Please enter a Register Number");
      return;
    }
    setStudentLoading(true);
    setStudentData(null);
    try {
      const res = await getIndividualStudentResultsAdmin({ regNo, semester: studentSemester });
      setStudentData(res.data);
      toast.success("Student results loaded");
    } catch (error) {
      console.error("Fetch student config failed", error);
      toast.error(error.response?.data?.message || "Failed to fetch student results");
    } finally {
      setStudentLoading(false);
    }
  };

  return (
    <div className="w-full animate-fadeIn pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#003B73] tracking-tight flex items-center gap-3">
            <Layers className="text-blue-600" size={32} /> Exam Session Results
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Manage publication and verify individual student outcomes.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[28px] p-2 flex border border-gray-100 mb-8 inline-block max-w-fit shadow-lg shadow-blue-900/5">
        <button
          onClick={() => setActiveTab("PUBLISH")}
          className={`px-6 py-2.5 rounded-[18px] text-sm font-black transition-all ${
            activeTab === "PUBLISH" 
              ? "bg-[#003B73] text-white shadow-md shadow-blue-900/20" 
              : "text-gray-400 hover:text-gray-700 bg-transparent hover:bg-gray-50"
          }`}
        >
          Publish Controls
        </button>
        <button
          onClick={() => setActiveTab("VIEWER")}
          className={`px-6 py-2.5 rounded-[18px] text-sm font-black transition-all ${
            activeTab === "VIEWER" 
              ? "bg-[#003B73] text-white shadow-md shadow-blue-900/20" 
              : "text-gray-400 hover:text-gray-700 bg-transparent hover:bg-gray-50"
          }`}
        >
          Individual Result Viewer
        </button>
      </div>

      {activeTab === "PUBLISH" && (
        <div className="animate-slideUp">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
            <h3 className="text-lg font-black text-gray-800 mb-6">Result Visibility Configuration</h3>
            
            <div className="flex flex-wrap items-end gap-6">
              <div className="flex-1 min-w-[280px]">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                  Department
                </label>
                <CustomSelect
                  className="w-full"
                  value={publishFilters.department}
                  onChange={(e) => {
                    setPublishFilters({ ...publishFilters, department: e.target.value });
                    setPublishStatusChecked(false);
                  }}
                >
                  <option value="">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.code || d.name}>{d.code || d.name}</option>
                  ))}
                </CustomSelect>
              </div>

              <div className="w-32">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                  Semester
                </label>
                <CustomSelect
                  className="w-full"
                  value={publishFilters.semester}
                  onChange={(e) => {
                    setPublishFilters({ ...publishFilters, semester: e.target.value });
                    setPublishStatusChecked(false);
                  }}
                >
                  <option value="">Choose...</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Sem {s}</option>
                  ))}
                </CustomSelect>
              </div>

              <div className="w-32">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                  Section
                </label>
                <CustomSelect
                  className="w-full"
                  value={publishFilters.section}
                  onChange={(e) => {
                    setPublishFilters({ ...publishFilters, section: e.target.value });
                    setPublishStatusChecked(false);
                  }}
                >
                  {['A', 'B', 'C', 'D'].map(sec => (
                    <option key={sec} value={sec}>Section {sec}</option>
                  ))}
                </CustomSelect>
              </div>

              <button
                onClick={handleCheckPublishStatus}
                disabled={publishLoading || !publishFilters.department || !publishFilters.semester}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 h-[52px] px-8 rounded-2xl transition-all font-black flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {publishLoading ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
                Check Status
              </button>

              {publishStatusChecked && (
                <button
                  onClick={handlePublishToggle}
                  disabled={publishLoading}
                  className={`h-[52px] px-8 rounded-2xl transition-all font-black flex items-center gap-2 shadow-lg text-sm ${
                    isPublished 
                      ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100 shadow-red-900/10' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/20'
                  }`}
                >
                  {isPublished ? <XCircle size={18} /> : <CheckCircle size={18} />}
                  {isPublished ? 'Unpublish Results' : 'Publish Results'}
                </button>
              )}
            </div>

            {publishStatusChecked && (
                <div className={`mt-8 p-6 rounded-2xl border ${isPublished ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                    <h4 className="font-black text-lg mb-2">{isPublished ? 'Results are Live' : 'Results are Hidden'}</h4>
                    <p className="text-sm">
                        {isPublished 
                            ? 'Students in the selected department, semester, and section can view their results in the portal.'
                            : 'Results are currently hidden from students. Finalize marks and press Publish to make them visible.'}
                    </p>
                </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "VIEWER" && (
        <div className="animate-slideUp">
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 mb-6 flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                Register Number
              </label>
              <input
                type="text"
                placeholder="e.g. 812421104001"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
              />
            </div>
            <div className="w-32">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                Semester
              </label>
              <CustomSelect
                className="w-full"
                value={studentSemester}
                onChange={(e) => setStudentSemester(e.target.value)}
              >
                <option value="">Any/Latest</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Sem {s}</option>
                ))}
              </CustomSelect>
            </div>
            <button
              onClick={handleFetchStudentResult}
              disabled={studentLoading || !regNo}
              className="bg-[#003B73] text-white h-[48px] px-8 rounded-2xl hover:bg-blue-800 disabled:bg-gray-200 disabled:text-gray-400 transition-all font-black flex items-center gap-2 shadow-lg shadow-blue-900/20 text-sm"
            >
              {studentLoading ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
              Search
            </button>
          </div>

          {studentData && (
            <div className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-gray-100">
               <div className="bg-gradient-to-br from-[#003B73] to-blue-900 p-8 text-white relative flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight">{studentData.studentDetails?.name || 'Unknown'}</h2>
                        <div className="flex gap-4 mt-2 font-medium text-blue-200 text-sm">
                            <span className="bg-white/10 px-3 py-1 rounded-full">{studentData.studentDetails?.registerNumber || 'No Reg No'}</span>
                            <span className="bg-white/10 px-3 py-1 rounded-full">{studentData.studentDetails?.department || 'Dept N/A'}</span>
                            <span className="bg-white/10 px-3 py-1 rounded-full">Semester: {studentData.semester}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-5xl font-black tracking-tighter text-white drop-shadow-md">
                            {studentData.gpa}
                        </div>
                        <div className="text-blue-200 text-sm font-bold uppercase tracking-widest mt-1">GPA (Sem {studentData.semester})</div>
                    </div>
               </div>

                <div className="p-8">
                    {studentData.results.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 font-bold">
                            No published results found for this student and semester.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject Code</th>
                              <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Course Title</th>
                              <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">CIA</th>
                              <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">ESE</th>
                              <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Total</th>
                              <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Grade</th>
                              <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Result</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {studentData.results.map((r, i) => (
                              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 font-bold text-gray-500 whitespace-nowrap">{r.subjectCode}</td>
                                <td className="py-4 font-black text-gray-800">{r.subjectName}</td>
                                <td className="py-4 font-bold text-gray-600 text-center">{r.cia}</td>
                                <td className="py-4 font-bold text-gray-600 text-center">{r.external}</td>
                                <td className="py-4 font-black text-[#003B73] text-center">{r.total}</td>
                                <td className="py-4 font-black text-[#003B73] text-center">{r.grade}</td>
                                <td className="py-4 text-right">
                                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    r.result === 'PASS' 
                                      ? 'bg-emerald-100 text-emerald-700' 
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {r.result}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExamSessionResults;
