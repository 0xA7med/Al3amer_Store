import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '@/lib/supabase';

const AuthLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await adminLogin(email, password);
    setLoading(false);
    if (res.success) {
      localStorage.setItem('isAdminLoggedIn', 'true');
      setError('');
      navigate('/admin');
    } else {
      setError(res.message || 'فشل تسجيل الدخول');
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