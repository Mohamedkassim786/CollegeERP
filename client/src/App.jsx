import { Routes, Route } from 'react-router-dom';
import Login from './pages/auth/Login';
import AdminDashboard from './pages/admin/AdminPortal';
import FacultyDashboard from './pages/faculty/FacultyPortal';
import HODDashboard from './pages/hod/HODPortal';
import ExternalDashboard from './pages/external/ExternalDashboard';
import ExternalMarkEntry from './pages/external/ExternalMarkEntry';
import ProtectedRoute from './components/ProtectedRoute';
import PrincipalDashboard from './pages/principal/PrincipalPortal';
import ChiefSecretaryPortal from './pages/chiefsecretary/ChiefSecretaryPortal';
import StudentDashboard from './pages/student/StudentPortal';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/unauthorized" element={<div className="p-8">Unauthorized Access</div>} />

            {/* Admin Portal */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin/*" element={<AdminDashboard />} />
            </Route>

            {/* Faculty */}
            <Route element={<ProtectedRoute allowedRoles={['FACULTY', 'FIRST_YEAR_COORDINATOR']} />}>
                <Route path="/faculty/*" element={<FacultyDashboard />} />
            </Route>

            {/* HOD — full sidebar with nested routes */}
            <Route element={<ProtectedRoute allowedRoles={['HOD', 'FIRST_YEAR_COORDINATOR']} />}>
                <Route path="/hod/*" element={<HODDashboard />} />
            </Route>

            {/* External Staff */}
            <Route element={<ProtectedRoute allowedRoles={['EXTERNAL_STAFF']} />}>
                <Route path="/external" element={<ExternalDashboard />} />
                <Route path="/external/marks/:assignmentId" element={<ExternalMarkEntry />} />
            </Route>

            {/* Principal */}
            <Route element={<ProtectedRoute allowedRoles={['PRINCIPAL']} />}>
                <Route path="/principal/*" element={<PrincipalDashboard />} />
            </Route>


            {/* Chief Secretary */}
            <Route element={<ProtectedRoute allowedRoles={['CHIEF_SECRETARY']} />}>
                <Route path="/chief-secretary/*" element={<ChiefSecretaryPortal />} />
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
