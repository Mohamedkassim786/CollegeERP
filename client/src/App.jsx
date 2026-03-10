import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import ExternalDashboard from './pages/external/ExternalDashboard';
import ExternalMarkEntry from './pages/external/ExternalMarkEntry';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import PrincipalDashboard from './pages/dashboards/PrincipalDashboard';
import COEDashboard from './pages/dashboards/COEDashboard';
import HODDashboard from './pages/dashboards/HODDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import StudentManager from './pages/admin/StudentManager';
import StudentProfile from './pages/admin/StudentProfile';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/unauthorized" element={<div className="p-8">Unauthorized Access</div>} />

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin/*" element={<AdminDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['FACULTY']} />}>
                <Route path="/faculty/*" element={<FacultyDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['EXTERNAL_STAFF']} />}>
                <Route path="/external" element={<DashboardLayout role="EXTERNAL_STAFF" title="External Portal"><ExternalDashboard /></DashboardLayout>} />
                <Route path="/external/marks/:assignmentId" element={<ExternalMarkEntry />} />
            </Route>

            {/* Principal Routes */}
            <Route element={<ProtectedRoute allowedRoles={['PRINCIPAL']} />}>
                <Route path="/principal" element={<DashboardLayout role="PRINCIPAL" title="Principal Portal"><PrincipalDashboard /></DashboardLayout>} />
                <Route path="/principal/students" element={<DashboardLayout role="PRINCIPAL" title="Principal Portal"><StudentManager /></DashboardLayout>} />
                <Route path="/principal/students/profile/:id" element={<DashboardLayout role="PRINCIPAL" title="Principal Portal"><StudentProfile /></DashboardLayout>} />
                <Route path="/principal/*" element={<DashboardLayout role="PRINCIPAL" title="Principal Portal"><PrincipalDashboard /></DashboardLayout>} />
            </Route>

            {/* COE Routes */}
            <Route element={<ProtectedRoute allowedRoles={['COE']} />}>
                <Route path="/coe" element={<DashboardLayout role="COE" title="COE Portal"><COEDashboard /></DashboardLayout>} />
                <Route path="/coe/students" element={<DashboardLayout role="COE" title="COE Portal"><StudentManager /></DashboardLayout>} />
                <Route path="/coe/students/profile/:id" element={<DashboardLayout role="COE" title="COE Portal"><StudentProfile /></DashboardLayout>} />
                <Route path="/coe/*" element={<DashboardLayout role="COE" title="COE Portal"><COEDashboard /></DashboardLayout>} />
            </Route>

            {/* HOD Routes */}
            <Route element={<ProtectedRoute allowedRoles={['HOD']} />}>
                <Route path="/hod" element={<DashboardLayout role="HOD" title="Department Portal"><HODDashboard /></DashboardLayout>} />
                <Route path="/hod/students" element={<DashboardLayout role="HOD" title="Department Portal"><StudentManager /></DashboardLayout>} />
                <Route path="/hod/students/profile/:id" element={<DashboardLayout role="HOD" title="Department Portal"><StudentProfile /></DashboardLayout>} />
                <Route path="/hod/*" element={<DashboardLayout role="HOD" title="Department Portal"><HODDashboard /></DashboardLayout>} />
            </Route>

            {/* Student Routes */}
            <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
                <Route path="/student/*" element={<DashboardLayout role="STUDENT" title="Student Portal"><StudentDashboard /></DashboardLayout>} />
            </Route>
        </Routes>
    );
}

export default App;
