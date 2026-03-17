import { useState, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import { getProfile, updateSettingsProfile, changeSettingsPassword, getFacultyProfile, getActivityLogs } from "../../services/profile.service";
import { toggleFacultyStatus, resetFacultyPassword } from "../../services/faculty.service";
import { getAcademicYears, createAcademicYear, activateAcademicYear } from "../../services/academic.service";
import { getSystemSettings, updateSystemSetting } from "../../services/settings.service";
import AuthContext from "../../context/AuthProvider";
import {
  User,
  Lock,
  Shield,
  Activity,
  Save,
  RefreshCw,
  UserMinus,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Mail,
  Phone,
  Hash,
  Calendar,
  Plus,
  Camera,
  Building2
} from "lucide-react";
import toast from "react-hot-toast";

const Settings = () => {
  const { auth } = useContext(AuthContext);
  const location = useLocation();
  const isForced =
    location.state?.forcePasswordChange || auth.forcePasswordChange;
  const isAdmin = auth.role === "ADMIN";

  const [activeTab, setActiveTab] = useState("personal");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Personal Info States
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
  });

  // Security States
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Admin-Only: Faculty Management States
  const [facultyList, setFacultyList] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [newFacultyPassword, setNewFacultyPassword] = useState("");

  // Academic Year Management States
  const [academicYears, setAcademicYears] = useState([]);
  const [newYear, setNewYear] = useState("");

  // System Settings States
  const [systemSettings, setSystemSettings] = useState({});
  const [coordinatorId, setCoordinatorId] = useState("");

  useEffect(() => {
    fetchProfile();
    if (isAdmin) {
      fetchFaculty();
      fetchActivities();
      fetchAcademicYears();
      fetchSettings();
    }
    if (isForced) {
      setActiveTab("security");
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      setProfile(res.data);
      setPersonalInfo({
        fullName: res.data.fullName || res.data.name || "",
        email: res.data.email || "",
        phoneNumber: res.data.phoneNumber || "",
      });
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      const res = await getFacultyProfile();
      setFacultyList(res.data);
    } catch (err) {
      console.error("Failed to fetch faculty:", err);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await getActivityLogs();
      setActivities(res.data);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const res = await getAcademicYears();
      setAcademicYears(res.data);
    } catch (err) {
      console.error("Failed to fetch academic years:", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await getSystemSettings();
      setSystemSettings(res.data);
      if (res.data.FIRST_YEAR_COORDINATOR_ID) {
        setCoordinatorId(res.data.FIRST_YEAR_COORDINATOR_ID);
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  };

  const handleUpdateCoordinator = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSystemSetting({
        key: 'FIRST_YEAR_COORDINATOR_ID',
        value: coordinatorId
      });
      toast.success("First Year Coordinator assigned!");
      fetchSettings();
    } catch (err) {
      toast.error("Failed to assign coordinator");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateYear = async (e) => {
    e.preventDefault();
    if (!newYear) return;
    try {
      await createAcademicYear({ year: newYear });
      toast.success("Academic year created!");
      setNewYear("");
      fetchAcademicYears();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create year");
    }
  };

  const handleActivateYear = async (id) => {
    try {
      await activateAcademicYear(id);
      toast.success("Academic year activated!");
      fetchAcademicYears();
    } catch (err) {
      toast.error("Failed to activate year");
    }
  };

  const handleUpdatePersonal = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettingsProfile(personalInfo);
      toast.success("Profile updated successfully!");
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await changeSettingsPassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success("Password changed successfully!");
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFaculty = async (facultyId, currentStatus) => {
    if (
      !confirm(
        `Are you sure you want to ${currentStatus ? "enable" : "disable"} this account?`,
      )
    )
      return;
    try {
      await toggleFacultyStatus({
        facultyId,
        isDisabled: !currentStatus,
      });
      fetchFaculty();
      fetchActivities();
    } catch (err) {
      toast.error("Failed to toggle status");
    }
  };

  const handleResetFacultyPassword = async () => {
    if (!newFacultyPassword) return;
    try {
      await resetFacultyPassword({
        facultyId: selectedFaculty.id,
        newPassword: newFacultyPassword,
      });
      toast.success("Password reset successfully!");
      setShowResetModal(false);
      setNewFacultyPassword("");
      fetchActivities();
    } catch (err) {
      toast.error("Failed to reset password");
    }
  };

  const getPhotoUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    return `http://${window.location.hostname}:3000/uploads/faculty/${photo}`;
  };

  if (loading)
    return (
      <div className="p-8 text-center animate-pulse">Loading settings...</div>
    );

  const sections = [
    { id: "personal", label: "Personal Information", icon: User },
    { id: "security", label: "Security", icon: Lock },
  ];

  if (isAdmin) {
    sections.push({ id: "activity", label: "Activity Log", icon: Activity });
    sections.push({ id: "academic-mgmt", label: "Academic Years", icon: Calendar });
  } else {
    sections.push({ id: "academic", label: "Academic Info", icon: Info });
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8 animate-fadeIn">
        <h1 className="text-3xl font-black text-[#003B73]">Profile Settings</h1>
        <p className="text-gray-500 font-medium">
          Manage your {isAdmin ? "admin" : "faculty"} account preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Tabs */}
        <div className="lg:col-span-1 space-y-2 animate-slideIn">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveTab(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
                activeTab === s.id
                  ? "bg-[#003B73] text-white shadow-lg translate-x-1"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              <s.icon size={20} />
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn">
            {/* 1. Personal Information */}
            {activeTab === "personal" && (
              <div className="p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <User className="text-blue-600" size={24} />
                  Personal Details
                </h3>

                {!isAdmin && (auth.role === 'FACULTY' || auth.role === 'HOD') && (
                  <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col md:flex-row gap-8 items-center md:items-start group">
                    <div className="relative">
                      {profile?.photo ? (
                        <img 
                          src={getPhotoUrl(profile.photo)} 
                          alt="Profile" 
                          className="w-32 h-32 rounded-3xl object-cover shadow-2xl border-4 border-white group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#003B73] to-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl border-4 border-white group-hover:scale-105 transition-transform duration-300">
                          {profile?.fullName?.split(' ').map(n => n[0]).join('') || profile?.staffId?.[0]}
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg text-blue-600">
                        <Camera size={18} />
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-4 w-full">
                      <div className="flex flex-wrap gap-3">
                        <span className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-black uppercase tracking-widest border border-blue-200">
                          {profile?.staffId}
                        </span>
                        <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-200">
                          {profile?.designation}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="text-2xl font-black text-gray-900 tracking-tight">{profile?.fullName}</h4>
                        <p className="text-[#003B73] font-bold text-sm flex items-center gap-2 mt-1">
                          <Building2 size={16} />
                          {profile?.department}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="flex items-center gap-2 text-gray-500 text-sm font-medium bg-white/50 p-2 rounded-lg border border-gray-100">
                          <Mail size={14} /> {profile?.email || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-sm font-medium bg-white/50 p-2 rounded-lg border border-gray-100">
                          <Phone size={14} /> {profile?.phoneNumber || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <form
                  onSubmit={handleUpdatePersonal}
                  className="space-y-6 max-w-2xl"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Full Name
                      </label>
                      <input
                        className="input-field"
                        value={personalInfo.fullName}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            fullName: e.target.value,
                          })
                        }
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Email ID {isAdmin ? "(Editable)" : "(Read-only)"}
                      </label>
                      <input
                        className={`input-field ${!isAdmin ? "bg-gray-50 cursor-not-allowed" : ""}`}
                        value={personalInfo.email}
                        onChange={(e) =>
                          isAdmin &&
                          setPersonalInfo({
                            ...personalInfo,
                            email: e.target.value,
                          })
                        }
                        disabled={!isAdmin}
                        type="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Phone Number
                      </label>
                      <input
                        className="input-field"
                        value={personalInfo.phoneNumber}
                        onChange={(e) =>
                          setPersonalInfo({
                            ...personalInfo,
                            phoneNumber: e.target.value,
                          })
                        }
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Role
                      </label>
                      <div className="input-field bg-gray-50 flex items-center gap-2 font-black text-blue-700">
                        <Shield size={16} /> {profile?.role || 'User'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Username
                      </label>
                      <div className="input-field bg-gray-50 font-mono text-gray-600">
                        {profile?.username || profile?.staffId || profile?.rollNo}
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary px-8 py-3 flex items-center gap-2 shadow-xl"
                  >
                    <Save size={18} />{" "}
                    {saving ? "Saving..." : "Update Information"}
                  </button>
                </form>
              </div>
            )}

            {/* 2. Security */}
            {activeTab === "security" && (
              <div className="p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Lock className="text-red-600" size={24} />
                  Security & Auth
                </h3>

                {isForced && (
                  <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3 animate-bounce">
                    <AlertTriangle
                      className="text-red-600 shrink-0 mt-0.5"
                      size={20}
                    />
                    <div>
                      <p className="font-bold text-red-800">
                        Password Change Required
                      </p>
                      <p className="text-sm text-red-600">
                        Your password was reset by an administrator. You must
                        change it before continuing.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Current Password
                      </label>
                      <input
                        type="password"
                        className="input-field"
                        value={passwords.currentPassword}
                        onChange={(e) =>
                          setPasswords({
                            ...passwords,
                            currentPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        New Password
                      </label>
                      <input
                        type="password"
                        className="input-field"
                        value={passwords.newPassword}
                        onChange={(e) =>
                          setPasswords({
                            ...passwords,
                            newPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className="input-field"
                        value={passwords.confirmPassword}
                        onChange={(e) =>
                          setPasswords({
                            ...passwords,
                            confirmPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-primary bg-red-600 hover:bg-red-700 border-none w-full py-4 shadow-lg flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={20} />{" "}
                      {saving ? "Processing..." : "Change Password"}
                    </button>
                  </form>

                  <div className="space-y-6">
                    {!isAdmin && profile?.role !== 'STUDENT' && (
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-sm font-bold text-gray-500 uppercase">
                          Last Password Change
                        </p>
                        <p className="text-lg font-black text-gray-800 mt-1">
                          {profile?.lastPasswordChange
                            ? new Date(
                                profile.lastPasswordChange,
                              ).toLocaleDateString()
                            : "Never"}
                        </p>
                      </div>
                    )}
                    {!isAdmin && profile?.role !== 'STUDENT' && (
                      <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                        <h4 className="font-bold text-red-800 flex items-center gap-2">
                          <AlertTriangle size={18} /> Danger Zone
                        </h4>
                        <p className="text-xs text-red-600 mt-1 mb-4">
                          You can force logout all sessions from here.
                        </p>
                        <button className="w-full py-2 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors">
                          Logout from all devices (Optional)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}


            {/* 4. Admin-Only Activity Log */}
            {activeTab === "activity" && isAdmin && (
              <div className="p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Activity className="text-blue-500" size={24} />
                  Recent Admin Actions
                </h3>
                <div className="space-y-4">
                  {activities.length === 0 ? (
                    <p className="text-center py-12 text-gray-400 font-medium">
                      No recent actions logged
                    </p>
                  ) : (
                    activities.map((log) => (
                      <div
                        key={log.id}
                        className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100"
                      >
                        <div
                          className={`p-3 rounded-lg flex-shrink-0 ${
                            log.action.includes("PASSWORD")
                              ? "bg-blue-100 text-blue-600"
                              : "bg-orange-100 text-orange-600"
                          }`}
                        >
                          <Activity size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <span className="font-black text-[#003B73] text-sm uppercase tracking-wider">
                              {log.action.replace("_", " ")}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mt-1">
                            {log.description}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-tighter">
                            Performed by:{" "}
                            <span className="text-indigo-600">
                              {log.performer.fullName}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 6. Admin-Only Academic Year Management */}
            {activeTab === "academic-mgmt" && isAdmin && (
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <Calendar className="text-[#003B73]" size={24} />
                      Academic Year Management
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">Define and activate academic cycles</p>
                  </div>
                </div>

                {/* Add New Year */}
                <form onSubmit={handleCreateYear} className="flex gap-4 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="flex-1">
                    <input 
                      className="input-field"
                      placeholder="e.g., 2024-2025"
                      value={newYear}
                      onChange={e => setNewYear(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary px-8 flex items-center gap-2">
                    <Plus size={20} /> Add Year
                  </button>
                </form>

                {/* Years Table */}
                <div className="space-y-4">
                  {academicYears.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed text-gray-400">
                      No academic years defined yet
                    </div>
                  ) : (
                    academicYears.map(ay => (
                      <div key={ay.id} className={`flex items-center justify-between p-6 rounded-2xl border transition-all ${
                        ay.isActive 
                          ? 'bg-blue-50 border-blue-200 shadow-md ring-1 ring-blue-500/20' 
                          : 'bg-white border-gray-100 hover:border-gray-200'
                      }`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                            ay.isActive ? 'bg-[#003B73] text-white' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {ay.year.substring(2, 4)}
                          </div>
                          <div>
                            <p className="text-lg font-black text-[#003B73]">{ay.year}</p>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                              Status: {ay.isActive ? <span className="text-blue-600">Active Cycle</span> : 'Inactive'}
                            </p>
                          </div>
                        </div>

                        {!ay.isActive && (
                          <button 
                            onClick={() => handleActivateYear(ay.id)}
                            className="px-6 py-2 bg-white border-2 border-blue-100 text-[#003B73] font-black rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all text-sm"
                          >
                            Set Active
                          </button>
                        )}
                        {ay.isActive && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-blue-100/50 text-blue-700 rounded-xl text-sm font-black">
                            <CheckCircle size={16} /> Current Active
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 5. Faculty-Only Academic Info */}
            {activeTab === "academic" && !isAdmin && (
              <div className="p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Info className="text-blue-600" size={24} />
                  Academic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">
                        Department
                      </p>
                      <p className="text-xl font-black text-blue-900">
                        {profile?.department || 'Not Assigned'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                        Designation
                      </p>
                      <p className="text-xl font-black text-gray-800">
                        {profile?.designation || (profile?.role === 'STUDENT' ? 'Student' : 'Faculty Member')}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-2xl">
                    <h4 className="font-bold mb-4 flex items-center gap-2">
                      <Activity className="text-cyan-400" size={18} /> Teaching
                      Overview
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">
                          Current Academic Year
                        </span>
                        <span className="font-mono text-cyan-400">2025-26</span>
                      </li>
                      <li className="flex justify-between items-center text-sm border-t border-gray-800 pt-3">
                        <span className="text-gray-400">
                          Total Subjects Handled
                        </span>
                        <span className="font-mono font-bold">
                          Demo (Data in classes page)
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Reset Password
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Resetting password for <strong>{selectedFaculty.fullName}</strong>
              . They will be forced to change it on their next login.
            </p>
            <input
              type="password"
              className="input-field w-full mb-6"
              placeholder="Enter new password"
              value={newFacultyPassword}
              onChange={(e) => setNewFacultyPassword(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 btn bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleResetFacultyPassword}
                className="flex-1 btn btn-primary"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
