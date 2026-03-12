import { Routes, Route } from 'react-router-dom';
import Login from './pages/auth/Login';
import AdminDashboard from './pages/admin/AdminPortal';
import FacultyDashboard from './pages/faculty/FacultyPortal';
import HODDashboard from './pages/hod/HODPortal';
import ExternalDashboard from './pages/external/ExternalDashboard';
import ExternalMarkEntry from './pages/external/ExternalMarkEntry';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import PrincipalDashboard from './pages/principal/Dashboard';
import AdminHome from './pages/admin/Dashboard'; // COE redirected to Admin Dashboard
import ChiefSecretaryDashboard from './pages/chiefsecretary/Dashboard';
import StudentDashboard from './pages/student/StudentPortal';
import StudentManager from './pages/admin/academics/StudentManager';
import StudentProfile from './pages/admin/academics/StudentProfile';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/unauthorized" element={<div className="p-8">Unauthorized Access</div>} />

            {/* Admin & COE (Merged) */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'COE']} />}>
                <Route path="/admin/*" element={<AdminDashboard />} />
            </Route>

            {/* Faculty */}
            <Route element={<ProtectedRoute allowedRoles={['FACULTY']} />}>
                <Route path="/faculty/*" element={<FacultyDashboard />} />
            </Route>

            {/* HOD — full sidebar with nested routes */}
            <Route element={<ProtectedRoute allowedRoles={['HOD']} />}>
                <Route path="/hod/*" element={<HODDashboard />} />
            </Route>

            {/* External Staff */}
            <Route element={<ProtectedRoute allowedRoles={['EXTERNAL_STAFF']} />}>
                <Route path="/external" element={<DashboardLayout role="EXTERNAL_STAFF" title="External Portal"><ExternalDashboard /></DashboardLayout>} />
                <Route path="/external/marks/:assignmentId" element={<ExternalMarkEntry />} />
            </Route>

            {/* Principal */}
            <Route element={<ProtectedRoute allowedRoles={['PRINCIPAL']} />}>
                <Route path="/principal" element={<DashboardLayout role="PRINCIPAL" title="Principal Portal"><PrincipalDashboard /></DashboardLayout>} />
                <Route path="/principal/students" element={<DashboardLayout role="PRINCIPAL" title="Principal Portal"><StudentManager /></DashboardLayout>} />
                <Route path="/principal/students/profile/:id" element={<DashboardLayout role="PRINCIPAL" title="Principal Portal"><StudentProfile /></DashboardLayout>} />
                <Route path="/principal/*" element={<DashboardLayout role="PRINCIPAL" title="Principal Portal"><PrincipalDashboard /></DashboardLayout>} />
            </Route>


            {/* Chief Secretary */}
            <Route element={<ProtectedRoute allowedRoles={['CHIEF_SECRETARY']} />}>
                <Route path="/chief-secretary" element={<DashboardLayout role="CHIEF_SECRETARY" title="Chief Secretary Portal"><ChiefSecretaryDashboard /></DashboardLayout>} />
                <Route path="/chief-secretary/students" element={<DashboardLayout role="CHIEF_SECRETARY" title="Institutional Intel"><StudentManager /></DashboardLayout>} />
                <Route path="/chief-secretary/students/profile/:id" element={<DashboardLayout role="CHIEF_SECRETARY" title="Institutional Intel"><StudentProfile /></DashboardLayout>} />
                <Route path="/chief-secretary/*" element={<DashboardLayout role="CHIEF_SECRETARY" title="Chief Secretary Portal"><ChiefSecretaryDashboard /></DashboardLayout>} />
            </Route>

            {/* Student */}
            <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
                <Route path="/student/*" element={<StudentDashboard />} />
            </Route>

            {/* Fallback & Redirects */}
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Login />} />
        </Routes>
    );
}

export default App;
