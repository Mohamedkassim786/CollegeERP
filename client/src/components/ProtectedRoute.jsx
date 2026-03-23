import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthProvider';

const ProtectedRoute = ({ allowedRoles }) => {
    const { auth } = useContext(AuthContext);

    if (!auth) {
        return <Navigate to="/" replace />;
    }

    const userRoles = [auth.role, ...(auth.computedRoles || [])];
    const hasAccess = !allowedRoles || allowedRoles.some(role => userRoles.includes(role));

    if (!hasAccess) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
