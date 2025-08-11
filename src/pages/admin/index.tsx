import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AdminIndex = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/admin-login', { replace: true });
    }
  }, [session, loading, navigate]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">جاري تحميل صفحة الأدمن...</div>;
  }

  if (!session) {
    // This will be rendered briefly before the useEffect redirect happens.
    // Returning null is fine as the redirect will be very fast.
    return null; 
  }

  return <Outlet />;
};

export default AdminIndex;
