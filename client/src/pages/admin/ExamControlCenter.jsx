import CustomSelect from "../../components/CustomSelect";
import React, { useState, useEffect, useCallback } from "react";
import {
  Award,
  Lock,
  Unlock,
  CheckCircle,
  Save,
  Filter,
  RefreshCw,
} from "lucide-react";
import api from "../../api/axios";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import toast from "react-hot-toast";

const ExamControlCenter = () => {
  const [status, setStatus] = useState({
    department: "",
    year: "",
    semester: "",
    section: "",
    markEntryOpen: false,
    isPublished: false,
    isLocked: false,
  });

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInitialData = async () => {
    try {
      const deptsRes = await api.get("/admin/departments");
      setDepartments(deptsRes.data);
      if (deptsRes.data.length > 0) {
        setStatus((prev) => ({ ...prev, department: deptsRes.data[0].name }));
      }
    } catch (error) {
      toast.error("Failed to load departments");
    }
  };

  const fetchCurrentStatus = useCallback(async () => {
    if (
      !status.department ||
      !status.year ||
      !status.semester ||
      !status.section
    )
      return;

    setLoading(true);
    try {
      const res = await api.get("/exam/semester-control", {
        params: {
          department: status.department,
          year: status.year,
          semester: status.semester,
          section: status.section,
        },
      });
      setStatus((prev) => ({
        ...prev,
        markEntryOpen: res.data.markEntryOpen,
        isPublished: res.data.isPublished,
        isLocked: res.data.isLocked,
      }));
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch status");
    } finally {
      setLoading(false);
    }
  }, [status.department, status.year, status.semester, status.section]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchCurrentStatus();
  }, [fetchCurrentStatus]);

  const toggleControl = async (field) => {
    if (
      !status.department ||
      !status.year ||
      !status.semester ||
      !status.section
    ) {
      toast.error("Please select all filters first");
      return;
    }

    // Guard: isLocked is permanent — cannot be undone
    if (field === "isLocked" && status.isLocked) {
      toast.error("Semester is permanently locked and cannot be unlocked.");
      return;
    }

    // Guard: Cannot publish unless mark entry is closed AND semester is locked
    if (field === "isPublished" && !status.isPublished) {
      if (status.markEntryOpen) {
        toast.error("Please close Mark Entry before publishing results.");
        return;
      }
      if (!status.isLocked) {
        toast.error("Please lock the semester before publishing results.");
        return;
      }
    }

    try {
      const newValue = !status[field];
      await api.post("/exam/semester-control", {
        department: status.department,
        year: status.year,
        semester: status.semester,
        section: status.section,
        field,
        value: newValue,
      });
      setStatus((prev) => ({ ...prev, [field]: newValue }));
      toast.success(`Control updated successfully`);
    } catch (error) {
      toast.error("Failed to update control");
    }
  };

  return (
    <div className="w-full animate-fadeIn pb-12">
      <div className="flex flex-col mb-10">
        <h1 className="text-4xl font-black text-[#003B73] tracking-tight flex items-center gap-3">
          <Award className="text-blue-600" size={32} /> Central Examination Control
        </h1>
        <p className="text-gray-500 font-medium mt-1">
          Governing mark entry windows, result publication status, and final semester locking.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-6 rounded-[28px] shadow-sm border border-gray-100 mb-8 flex flex-wrap items-end gap-6">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
            Department
          </label>
          <CustomSelect
            className="w-full"
            value={status.department}
            onChange={(e) =>
              setStatus({ ...status, department: e.target.value })
            }
          >
            <option value="">Select Department...</option>
            {departments.map((d) => (
              <option key={d.id} value={d.code || d.name}>
                {d.code || d.name}
              </option>
            ))}
          </CustomSelect>
        </div>
        <div className="w-40">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
            Semester
          </label>
          <CustomSelect
            className="w-full"
            value={status.semester}
            onChange={(e) => {
              const sem = parseInt(e.target.value);
              const year = Math.ceil(sem / 2);
              setStatus({
                ...status,
                semester: e.target.value,
                year: year.toString(),
              });
            }}
          >
            <option value="">Choose...</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </CustomSelect>
        </div>
        <div className="w-40">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
            Section
          </label>
          <CustomSelect
            className="w-full"
            value={status.section}
            onChange={(e) =>
              setStatus({ ...status, section: e.target.value })
            }
          >
            <option value="">Choose...</option>
            {["A", "B", "C", "D"].map((s) => (
              <option key={s} value={s}>
                Section {s}
              </option>
            ))}
          </CustomSelect>
        </div>
        <button
          onClick={fetchCurrentStatus}
          disabled={loading || !status.department || !status.semester || !status.section}
          className="bg-[#003B73] text-white h-[52px] px-8 rounded-2xl hover:bg-blue-800 disabled:bg-gray-100 disabled:text-gray-400 transition-all font-black flex items-center gap-2"
        >
          {loading ? <RefreshCw className="animate-spin" size={20} /> : <Filter size={20} />}
          Check Status
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="font-black text-gray-400 uppercase tracking-widest animate-pulse">
            Syncing Global Status...
          </p>
        </div>
      ) : !status.department || !status.semester || !status.section ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[40px] py-24 flex flex-col items-center text-center px-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
            <Filter size={32} className="text-gray-200" />
          </div>
          <h3 className="text-2xl font-black text-gray-300 mb-2">Filters Required</h3>
          <p className="text-gray-400 font-medium max-w-sm">
            Select a department, semester and section above to view and manage examination controls.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-slideUp">
          {/* Mark Entry Card */}
          <div className="group relative bg-white p-10 rounded-[48px] shadow-sm border border-gray-100 hover:shadow-2xl hover:border-blue-100 transition-all duration-500 overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 ${status.markEntryOpen ? 'bg-red-500' : 'bg-emerald-500'}`}></div>

            <div className={`w-16 h-16 rounded-3xl mb-8 flex items-center justify-center shadow-inner ${status.markEntryOpen ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
              {status.markEntryOpen ? <Lock size={32} /> : <Unlock size={32} />}
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-black text-[#003B73] mb-3">Mark Entry Window</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2 h-2 rounded-full ${status.markEntryOpen ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${status.markEntryOpen ? 'text-red-600' : 'text-emerald-600'}`}>
                  {status.markEntryOpen ? 'Current State: OPEN' : 'Current State: CLOSED'}
                </span>
              </div>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">
                Controls whether faculty members can enter or modify marks for this specific class and semester.
              </p>
            </div>

            <button
              onClick={() => toggleControl("markEntryOpen")}
              className={`w-full py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 transition-all ${status.markEntryOpen
                  ? "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                  : "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                }`}
            >
              {status.markEntryOpen ? "Close Entry Window" : "Open Entry Window"}
            </button>
          </div>

          {/* Results Publication Card */}
          <div className="group relative bg-white p-10 rounded-[48px] shadow-sm border border-gray-100 hover:shadow-2xl hover:border-blue-100 transition-all duration-500 overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-3xl opacity-20 ${status.isPublished ? 'bg-blue-500' : 'bg-orange-500'}`}></div>

            <div className={`w-16 h-16 rounded-3xl mb-8 flex items-center justify-center shadow-inner ${status.isPublished ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"}`}>
              <CheckCircle size={32} />
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-black text-[#003B73] mb-3">Results Visibility</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2 h-2 rounded-full ${status.isPublished ? 'bg-blue-500 animate-pulse' : 'bg-orange-500'}`}></span>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${status.isPublished ? 'text-blue-600' : 'text-orange-600'}`}>
                  {status.isPublished ? 'Status: PUBLISHED' : 'Status: HIDDEN'}
                </span>
              </div>
              <p className="text-sm text-gray-400 font-medium leading-relaxed">
                Determines if consolidated results and GPA are visible to students and faculty on their portals.
              </p>
            </div>

            {(!status.isLocked || status.markEntryOpen) && !status.isPublished && (
              <div className="flex items-center gap-2 mb-6 p-3 bg-red-50 rounded-2xl border border-red-100">
                <X size={14} className="text-red-500" />
                <p className="text-[10px] text-red-600 font-black uppercase tracking-wider">
                  Requirement: Lock Semester Mandatory
                </p>
              </div>
            )}

            <button
              onClick={() => toggleControl("isPublished")}
              disabled={!status.isLocked || status.markEntryOpen}
              className={`w-full py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 transition-all ${!status.isLocked || status.markEntryOpen
                  ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                  : status.isPublished
                    ? "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                    : "bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white"
                }`}
            >
              {status.isPublished ? "Unpublish Results" : "Publish Results"}
            </button>
          </div>

          {/* Freeze/Lock Card */}
          <div className="group relative bg-[#000814] p-10 rounded-[48px] shadow-2xl transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 -mr-12 -mt-12 bg-blue-600 rounded-full blur-[100px] opacity-20"></div>

            <div className={`w-16 h-16 rounded-3xl mb-8 flex items-center justify-center shadow-2xl ${status.isLocked ? "bg-blue-600 text-white" : "bg-white/10 text-white/30"}`}>
              <Lock size={32} />
            </div>

            <div className="mb-10">
              <h3 className="text-2xl font-black text-white mb-3">Permanent Freeze</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2 h-2 rounded-full ${status.isLocked ? 'bg-blue-500' : 'bg-white/20'}`}></span>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${status.isLocked ? 'text-blue-400' : 'text-white/30'}`}>
                  {status.isLocked ? 'STATE: FROZEN' : 'STATE: ACTIVE'}
                </span>
              </div>
              <p className="text-sm text-white/40 font-medium leading-relaxed">
                Final administrative seal. Freezes all marks, attendance, and result data. This action is irreversible.
              </p>
            </div>

            {status.isLocked ? (
              <div className="w-full py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 bg-white/10 text-white/40 border border-white/10 cursor-not-allowed">
                <Lock size={20} /> Data Securely Frozen
              </div>
            ) : (
              <button
                onClick={() => toggleControl("isLocked")}
                className="w-full py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-500/20 transition-all"
              >
                <Lock size={20} /> Lock Semester Now
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamControlCenter;
