import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ allowedRoles = [], children }) {
    const location = useLocation();
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // If not authenticated, redirect to login
    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Admins can access everything
    if (role === 'admin') {
        return children;
    }

    // If no specific roles required, allow
    if (!allowedRoles || allowedRoles.length === 0) {
        return children;
    }

    // Otherwise check if user's role is allowed
    if (allowedRoles.includes(role)) {
        return children;
    }

    // Not authorized
    return <Navigate to="/" replace />;
}
