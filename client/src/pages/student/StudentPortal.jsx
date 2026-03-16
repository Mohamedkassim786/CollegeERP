import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import StudentHome from "./Dashboard";
import StudentProfile from "./StudentProfile";
import StudentResult from "./StudentResult";
import StudentAttendance from "./StudentAttendance";
import StudentMarks from "./StudentMarks";
import StudentTimetable from "./StudentTimetable";
import Announcements from "../shared/Announcements";
import Settings from "../shared/Settings";

const StudentPortal = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="STUDENT" />
      <div className="flex-1 flex flex-col ml-64 transition-all duration-300">
        <Header title="Student Portal" />
        <main className="flex-1 p-8 mt-24 overflow-y-auto animate-fadeIn">
          <Routes>
            <Route path="/" element={<StudentHome />} />
            <Route path="/profile" element={<StudentProfile role="STUDENT" />} />
            <Route path="/attendance" element={<StudentAttendance />} />
            <Route path="/marks" element={<StudentMarks />} />
            <Route path="/results" element={<StudentResult />} />
            <Route path="/timetable" element={<StudentTimetable />} />
            <Route path="/announcements" element={<Announcements role="STUDENT" />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/student" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default StudentPortal;
