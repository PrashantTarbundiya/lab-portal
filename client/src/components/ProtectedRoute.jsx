import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    // If trying to access staff or doctor route, send to staff login
    if (requiredRole === 'FRONT_DESK' || requiredRole === 'DOCTOR') {
      return <Navigate to="/staff/login" state={{ from: location }} replace />;
    }
    // Otherwise patient login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    if (role === 'DOCTOR') return <Navigate to="/doctor" replace />;
    if (role === 'FRONT_DESK') return <Navigate to="/staff" replace />;
    return <Navigate to="/reports" replace />;
  }

  return children;
}

