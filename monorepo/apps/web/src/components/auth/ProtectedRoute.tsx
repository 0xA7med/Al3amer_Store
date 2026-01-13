import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const location = useLocation();

    // Show loading spinner while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0f18]">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Not authenticated -> Redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Requires admin but user is not admin -> Redirect to home
    if (requireAdmin && user?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

export default ProtectedRoute;
