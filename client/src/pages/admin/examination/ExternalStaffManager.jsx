import CustomSelect from "../../../components/CustomSelect";
import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  X,
  Calendar,
  BookOpen,
  Clock,
  Shield,
  CheckCircle,
} from "lucide-react";
import { 
  getExternalAssignments, 
  getAvailableSubjectsForExternal, 
  getExternalStaff, 
  assignExternalMarkEntry, 
  createExternalStaff, 
  deleteExternalStaff, 
  deleteExternalAssignment 
} from "../../../services/external.service";
import Header from "../../../components/Header";
import toast from "react-hot-toast";

const categoryBadge = (cat) => {
  const map = {
    THEORY: { label: "Theory", cls: "bg-blue-100 text-blue-700" },
    LAB: { label: "Lab", cls: "bg-green-100 text-green-700" },
    INTEGRATED: { label: "Integrated", cls: "bg-purple-100 text-purple-700" },
  };
  const info = map[cat] || { label: cat || "Theory", cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${info.cls}`}>
      {info.label}
    </span>
  );
};

const ExternalStaffManager = () => {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [showWizard, setShowWizard] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Multi-subject assignment: staffId, selectedSubjectIds[], deadline
  const [formData, setFormData] = useState({
    staffId: "",
    deadline: "",
  });
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);

  const [newStaff, setNewStaff] = useState({
    username: "",
    password: "",
    fullName: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, subjectsRes, staffRes] = await Promise.all([
        getExternalAssignments(),
        getAvailableSubjectsForExternal(),
        getExternalStaff(),
      ]);

      setAssignments(
        Array.isArray(assignmentsRes.data) ? assignmentsRes.data : [],
      );
      setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
      setStaffList(Array.isArray(staffRes.data) ? staffRes.data : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load external staff data");
    } finally {
      setLoading(false);
    }
  };

  const toggleSubjectSelection = (subjectId, component = 'THEORY') => {
    const key = `${subjectId}-${component}`;
    setSelectedSubjectIds((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
    );
  };

  const handleAssignMarkEntry = async (e) => {
    e.preventDefault();

    if (!formData.staffId || selectedSubjectIds.length === 0 || !formData.deadline) {
      toast.error("Please select a staff, at least one subject, and a deadline");
      return;
    }

    try {
      // Create one assignment per selected subject
      const results = await Promise.allSettled(
        selectedSubjectIds.map((key) => {
          const [subjectId, component] = key.split('-');
          return assignExternalMarkEntry({
            staffId: formData.staffId,
            subjectId: parseInt(subjectId),
            component: component,
            deadline: formData.deadline,
          });
        })
      );

      const failed = results.filter((r) => r.status === "rejected");
      const succeeded = results.filter((r) => r.status === "fulfilled");

      if (succeeded.length > 0) {
        toast.success(`${succeeded.length} subject(s) assigned successfully`);
      }
      if (failed.length > 0) {
        failed.forEach((f) =>
          toast.error(f.reason?.response?.data?.message || "Assignment failed for a subject")
        );
      }

      setShowWizard(false);
      setFormData({ staffId: "", deadline: "" });
      setSelectedSubjectIds([]);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign mark entry");
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await createExternalStaff(newStaff);
      toast.success("External staff created successfully");
      setShowCreateModal(false);
      setNewStaff({ username: "", password: "", fullName: "" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create staff");
    }
  };

  const handleDeleteStaff = async (id) => {
    if (
      !window.confirm("Are you sure? This will remove all their assignments.")
    )
      return;
    try {
      await deleteExternalStaff(id);
      toast.success("Staff member removed");
      fetchData();
    } catch (error) {
      toast.error("Failed to remove staff");
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm("Remove this mark entry assignment?")) return;
    try {
      await deleteExternalAssignment(id);
      toast.success("Assignment removed");
      fetchData();
    } catch (error) {
      toast.error("Failed to remove assignment");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003B73]"></div>
      </div>
    );

  return (
    <div className="flex flex-col animate-fadeIn">
      <div className="flex flex-col items-center text-center mb-12 gap-6">
        <div className="animate-slideUp">
          <h1 className="text-4xl font-black text-[#003B73] tracking-tight">
            External Mark Entry Control
          </h1>
          <p className="text-gray-500 font-medium mt-2">
            Manage external evaluators and assign subjects for mark entry.
          </p>
        </div>
        <div className="flex gap-4 w-full max-w-sm">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#003B73] text-white rounded-2xl font-bold hover:bg-[#002850] shadow-xl transition-all"
          >
            <UserPlus size={20} /> Register Evaluator
          </button>
          <button
            onClick={() => setShowWizard(true)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl transition-all"
          >
            <Calendar size={20} /> Assign Subject(s)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Users size={28} />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest">
              Evaluators
            </p>
            <p className="text-3xl font-black text-[#003B73]">
              {staffList.length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <BookOpen size={28} />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest">
              Active Assignments
            </p>
            <p className="text-3xl font-black text-[#003B73]">
              {assignments.length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Shield size={28} />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest">
              Secure Entry
            </p>
            <p className="text-3xl font-black text-emerald-600 font-mono">
              ENFORCED
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        {/* Staff List */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-black text-[#003B73] text-xl flex items-center gap-3">
              <Users size={24} className="text-blue-500" /> Registered External
              Evaluators
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead className="bg-gray-50/50 text-[#003B73] text-xs font-black uppercase tracking-wider">
                <tr>
                  <th className="px-8 py-5">Full Name</th>
                  <th className="px-8 py-5">Username</th>
                  <th className="px-8 py-5">Date Joined</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {staffList.map((staff) => (
                  <tr
                    key={staff.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-8 py-5 font-bold text-gray-800">
                      {staff.fullName}
                    </td>
                    <td className="px-8 py-5 text-blue-600 font-mono text-sm">
                      {staff.username}
                    </td>
                    <td className="px-8 py-5 text-gray-400 font-bold text-sm">
                      {new Date(staff.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => handleDeleteStaff(staff.id)}
                        className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assignments List */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-black text-[#003B73] text-xl flex items-center gap-3">
              <Calendar size={24} className="text-indigo-500" /> Subject
              Assignments
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead className="bg-gray-50/50 text-[#003B73] text-xs font-black uppercase tracking-wider">
                <tr>
                  <th className="px-8 py-5 text-left">Subject</th>
                  <th className="px-8 py-5">Slot</th>
                  <th className="px-8 py-5">Assigned Evaluator</th>
                  <th className="px-8 py-5">Deadline</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assignments.map((asgn) => (
                  <tr
                    key={asgn.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-8 py-5 text-left">
                      <p className="font-bold text-gray-800">
                        {asgn.subject?.name}
                      </p>
                      <p className="text-[10px] font-black text-gray-400 tracking-widest">
                        {asgn.subject?.code}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${asgn.component === 'LAB' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {asgn.component || 'THEORY'}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-bold text-[#003B73]">
                      {asgn.staff?.fullName}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-2 text-sm font-bold text-gray-500">
                        <Clock size={14} className="text-red-400" />
                        {new Date(asgn.deadline).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => handleDeleteAssignment(asgn.id)}
                        className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {(showWizard || showCreateModal) && (
        <div className="fixed inset-0 bg-[#003B73]/20 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-slideIn border border-[#003B73]/10">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-[#003B73] text-xl">
                {showWizard ? "Assign Subject(s) to Evaluator" : "Register Evaluator"}
              </h3>
              <button
                onClick={() => {
                  setShowWizard(false);
                  setShowCreateModal(false);
                  setSelectedSubjectIds([]);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={28} />
              </button>
            </div>

            {showWizard ? (
              <form onSubmit={handleAssignMarkEntry} className="p-8 space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                    Select Evaluator
                  </label>
                  <CustomSelect
                    required
                    value={formData.staffId}
                    onChange={(e) =>
                      setFormData({ ...formData, staffId: e.target.value })
                    }
                    className="w-full"
                  >
                    <option value="">Choose...</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName}
                      </option>
                    ))}
                  </CustomSelect>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                    Select Subject(s)
                    <span className="ml-2 text-[#003B73]">
                      ({selectedSubjectIds.length} selected)
                    </span>
                  </label>
                  <div className="border border-gray-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                    {subjects.length === 0 ? (
                      <p className="p-4 text-center text-gray-400 font-bold text-sm">
                        No eligible subjects available
                      </p>
                    ) : (
                      subjects.map((sub) => {
                        const key = `${sub.id}-${sub.componentSlot || 'THEORY'}`;
                        const checked = selectedSubjectIds.includes(key);
                        return (
                          <label
                            key={key}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b last:border-b-0 border-gray-100 transition-colors ${checked ? "bg-blue-50" : "hover:bg-gray-50"}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSubjectSelection(sub.id, sub.componentSlot)}
                              className="w-4 h-4 accent-[#003B73]"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[#003B73] text-sm truncate">
                                {sub.displayName || sub.name}
                              </p>
                              <p className="text-[10px] text-gray-400 font-black tracking-widest">
                                {sub.code} • {sub.department}
                              </p>
                            </div>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${sub.componentSlot === 'LAB' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                              {sub.componentSlot || 'THEORY'}
                            </span>
                            {checked && <CheckCircle size={16} className="text-blue-500 shrink-0" />}
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                    Submission Deadline
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#003B73] outline-none font-bold transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-5 bg-[#003B73] text-white rounded-[24px] font-black hover:bg-[#002850] shadow-xl shadow-blue-900/20 transition-all"
                >
                  Create {selectedSubjectIds.length > 1 ? `${selectedSubjectIds.length} Assignments` : "Assignment"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreateStaff} className="p-8 space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaff.fullName}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, fullName: e.target.value })
                    }
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#003B73] outline-none font-bold transition-all"
                    placeholder="Dr. evaluator name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaff.username}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, username: e.target.value })
                    }
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#003B73] outline-none font-bold transition-all"
                    placeholder="evaluator_id"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newStaff.password}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, password: e.target.value })
                    }
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-[#003B73] outline-none font-bold transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-5 bg-[#003B73] text-white rounded-[24px] font-black hover:bg-[#002850] shadow-xl shadow-blue-900/20 transition-all"
                >
                  Register Evaluator
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalStaffManager;
