import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import FacultyHome from "./FacultyHome";
import EnterMarks from "./EnterMarks";
import FacultyTimetable from "./FacultyTimetable";
import AttendanceManager from "./AttendanceManager";
import MyClasses from "./MyClasses";
import ClassDetails from "./ClassDetails";
import PublishedResults from "./PublishedResults";
import Announcements from "../shared/Announcements";
import Materials from "../shared/Materials";
import Settings from "../shared/Settings";
import FacultyProfile from "./FacultyProfile";
import { useContext, useEffect, useState } from "react";
import { getFacultyAssignments } from "../../services/faculty.service";
import AuthContext from "../../context/AuthProvider";

const FacultyPortal = () => {
  const { auth } = useContext(AuthContext);
  const [assignedSubjects, setAssignedSubjects] = useState([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await getFacultyAssignments();
        setAssignedSubjects(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSubjects();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="FACULTY" />
      <div className="flex-1 flex flex-col ml-64 transition-all duration-300">
        <Header title="Faculty Portal" />
        <main className="flex-1 p-8 mt-24 overflow-y-auto animate-fadeIn">
          <Routes>
            <Route path="/" element={<FacultyHome assignedSubjects={assignedSubjects} />} />
            <Route path="/marks" element={<EnterMarks />} />
            <Route path="/results" element={<PublishedResults />} />
            <Route path="/timetable" element={<FacultyTimetable />} />
            <Route path="/attendance" element={<AttendanceManager />} />
            <Route path="/classes" element={<MyClasses />} />
            <Route path="/class/:subjectId" element={<ClassDetails />} />
            <Route path="/profile" element={<FacultyProfile />} />
            <Route path="/announcements" element={<Announcements role="FACULTY" />} />
            <Route path="/materials" element={<Materials role="FACULTY" />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/faculty" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default FacultyPortal;
