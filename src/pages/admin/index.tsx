import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useNavigate, Outlet } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';

const AdminIndex = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !session) {
      navigate('/admin-login');
    }
  }, [session, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null; // or a redirect component
  }

  return <Outlet />;
};

export default AdminIndex;
