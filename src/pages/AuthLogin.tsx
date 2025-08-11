import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const AuthLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (session && !authLoading) {
      const from = location.state?.from?.pathname || '/admin';
      // Use setTimeout to prevent navigation during render
      const timer = setTimeout(() => {
        navigate(from, { replace: true });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [session, navigate, location.state, authLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await auth.signIn(email.trim(), password.trim());
      // No need to navigate here, the useEffect will handle it
    } catch (error) {
      console.error('Login error:', error);
      
      // More user-friendly error messages
      const errorMessage = error.message.includes('Invalid login credentials')
        ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        : 'حدث خطأ أثناء تسجيل الدخول. الرجاء المحاولة مرة أخرى لاحقًا.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">تسجيل دخول الأدمن</h2>
        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? 'جاري التحقق...' : 'دخول'}
        </button>
      </form>
    </div>
  );
};

export default AuthLogin; 