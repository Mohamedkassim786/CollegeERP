import React, { useState, useEffect } from "react";
import { Search, Award, CheckCircle, XCircle, RefreshCw, Layers } from "lucide-react";
import CustomSelect from "../../../components/CustomSelect";
import { getDepartments } from "../../../services/department.service";
import { getPublishStatus, publishResult, unpublishResult, lockResult, unlockResult } from "../../../services/results.service";
import toast from "react-hot-toast";

const ExamSessionResults = () => {
  const [publishFilters, setPublishFilters] = useState({
    department: "", semester: "", year: new Date().getFullYear(), section: "A"
  });
  const [departments, setDepartments] = useState([]);
  const [publishLoading, setPublishLoading] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // NEW STATE
  const [publishStatusChecked, setPublishStatusChecked] = useState(false);
  const [lockLoading, setLockLoading] = useState(false); // NEW STATE

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
      setIsLocked(res.data.isLocked || false);
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

  const handleLockToggle = async () => {
    const action = isLocked ? 'unlock' : 'lock';
    const confirmMsg = isLocked 
      ? "Are you sure you want to UNLOCK these results? Faculty will be able to modify marks."
      : "Are you sure you want to LOCK these results? This finalizes the semester and enables promotion.";
    
    if (!window.confirm(confirmMsg)) return;

    setLockLoading(true);
    const toastId = toast.loading(`${isLocked ? 'Unlocking' : 'Locking'} results...`);
    try {
      if (isLocked) {
        await unlockResult(publishFilters);
        setIsLocked(false);
        toast.success("Results unlocked successfully", { id: toastId });
      } else {
        await lockResult(publishFilters);
        setIsLocked(true);
        toast.success("Results locked successfully", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${action} results`, { id: toastId });
    } finally {
      setLockLoading(false);
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

        <div className="animate-slideUp">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 mt-6">
            <h3 className="text-lg font-black text-gray-800 mb-6">Result Visibility & Semester Lock</h3>
            
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
                <>
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
                  <div className="w-px h-12 bg-gray-200 mx-2"></div>
                  <button
                    onClick={handleLockToggle}
                    disabled={lockLoading}
                    className={`h-[52px] px-8 rounded-2xl transition-all font-black flex items-center gap-2 shadow-lg text-sm ${
                      isLocked 
                        ? 'bg-gray-800 text-white hover:bg-gray-900 shadow-gray-900/20' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-900/20'
                    }`}
                  >
                    {isLocked ? <XCircle size={18} /> : <CheckCircle size={18} />}
                    {isLocked ? 'Unlock Semester' : 'Lock Semester'}
                  </button>
                </>
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
                    <div className="mt-4 pt-4 border-t border-gray-200/50">
                        <h4 className="font-black text-sm mb-1">{isLocked ? 'Semester Locked' : 'Semester Unlocked'}</h4>
                        <p className="text-xs opacity-80">
                            {isLocked
                                ? 'Marks cannot be modified and Students are ready for promotion to the next semester.'
                                : 'Marks are still editable. Lock the semester to enable student promotion.'}
                        </p>
                    </div>
                </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default ExamSessionResults;
