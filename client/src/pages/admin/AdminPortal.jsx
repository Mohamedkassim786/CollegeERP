import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import AdminHome from "./Dashboard";
import FacultyManager from "./academics/FacultyManager";
import SubjectManager from "./academics/SubjectManager";
import StudentManager from "./academics/StudentManager";
import AutoPromote from "./academics/AutoPromote";
import AdminMarksManager from "./examination/AdminMarksManager";
import AdminMarksApproval from "./examination/AdminMarksApproval";
import TimetableManager from "./schedule/TimetableManager";
import DepartmentManager from "./academics/DepartmentManager";
import AttendanceReports from "./schedule/AttendanceReports";
import EndSemMarksEntry from "./examination/ResultsConsolidation";
import ExternalStaffManager from "./examination/ExternalStaffManager";
import DummyNumberManager from "./examination/DummyNumberManager";
import HallAllocation from "./examination/HallAllocation";
import HallTicket from "./examination/HallTicket";
import ExamAttendanceSheet from "./examination/ExamAttendanceSheet";
import ArrearManagement from "./examination/ArrearManagement";
import Dispatch from "./examination/Dispatch";
import Announcements from "../shared/Announcements";
import Settings from "../shared/Settings";
import StudentProfile from "./academics/StudentProfile";
import FacultyProfile from "./academics/FacultyProfile";
import AttendanceEligibility from "./examination/AttendanceEligibility";
import ProvisionalResults from "./examination/ProvisionalResults";
import UserManager from "./settings/UserManager";

/** Placeholder for pages that are being built */
const ComingSoon = ({ title }) => (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <div className="text-5xl mb-4">🚧</div>
        <h2 className="text-xl font-semibold text-gray-600">{title}</h2>
        <p className="text-sm mt-2">This module is coming soon.</p>
    </div>
);

const AdminPortal = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="ADMIN" />
      <div className="flex-1 flex flex-col ml-64 transition-all duration-300">
        <Header title="Admin Portal" />
        <main className="flex-1 p-8 mt-24 overflow-y-auto animate-fadeIn">
          <Routes>
            {/* Dashboard */}
            <Route path="/" element={<AdminHome />} />

            {/* Academics */}
            <Route path="faculty" element={<FacultyManager />} />
            <Route path="faculty/:id" element={<FacultyProfile />} />
            <Route path="subjects" element={<SubjectManager />} />
            <Route path="departments" element={<DepartmentManager />} />
            <Route path="courses" element={<Navigate to="/admin/subjects" replace />} />
            <Route path="students" element={<StudentManager />} />
            <Route path="students/profile/:id" element={<StudentProfile />} />
            <Route path="students/promote" element={<AutoPromote />} />

            {/* Schedule */}
            <Route path="timetable" element={<TimetableManager />} />
            <Route path="attendance" element={<AttendanceReports />} />

            {/* Admin Marks Management */}
            <Route path="marks/:subjectId" element={<AdminMarksManager />} />

            {/* Examination Control */}
            <Route path="marks-approval" element={<AdminMarksApproval />} />
            <Route path="results-consolidation" element={<EndSemMarksEntry />} />
            <Route path="attendance-eligibility" element={<AttendanceEligibility />} />
            <Route path="dummy-mapping" element={<DummyNumberManager />} />
            <Route path="external" element={<ExternalStaffManager />} />
            <Route path="hall-allocation" element={<HallAllocation />} />
            <Route path="hall-ticket" element={<HallTicket />} />
            <Route path="exam-attendance-sheet" element={<ExamAttendanceSheet />} />
            <Route path="dispatch" element={<Dispatch />} />
            <Route path="provisional-results" element={<ProvisionalResults />} />
            <Route path="arrears" element={<ArrearManagement />} />

            {/* Legacy redirect */}
            <Route path="end-sem-marks" element={<Navigate to="/admin/results-consolidation" replace />} />
            <Route path="exams" element={<Navigate to="/admin/provisional-results" replace />} />
            <Route path="arrears/manage" element={<Navigate to="/admin/arrears" replace />} />

            {/* Announcements & Settings */}
            <Route path="users" element={<UserManager />} />
            <Route path="announcements" element={<Announcements role="ADMIN" />} />
            <Route path="settings" element={<Settings />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminPortal;
