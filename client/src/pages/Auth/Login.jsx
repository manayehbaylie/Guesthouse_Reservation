import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { LogIn, Mail, Lock, Sparkles, Building2 } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'OWNER') navigate('/owner');
      else if (user.role === 'RECEPTIONIST') navigate('/receptionist');
      else navigate(from);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const sampleAccounts = [
    { name: 'Abebe Bikila', email: 'guest@example.com', password: 'Password123', role: 'GUEST' },
    { name: 'Solomon Tadesse', email: 'owner@example.com', password: 'Password123', role: 'OWNER' },
    { name: 'Tigist Alemu', email: 'receptionist@example.com', password: 'Password123', role: 'RECEPTIONIST' },
    { name: 'Kassaye Worku', email: 'admin@example.com', password: 'Password123', role: 'ADMIN' },
  ];

  const autofillAccount = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-stone-50">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Sign in to your account</h2>
          <p className="mt-1 text-xs text-stone-500">Access Guesthouse Reservation Platform features</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="guest@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password123"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Quick Demo Accounts */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 text-xs">
          <div className="font-bold text-stone-800 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Click any Demo Account to autofill:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {sampleAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => autofillAccount(acc)}
                className="text-left p-2 rounded-lg bg-stone-50 hover:bg-amber-50 border border-stone-200 transition-colors"
              >
                <div className="font-semibold text-stone-900">{acc.name}</div>
                <div className="text-[10px] text-amber-700 font-medium">{acc.role}</div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-stone-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-amber-600 hover:underline">
            Register as Guest or Owner
          </Link>
        </p>
      </div>
    </div>
  );
}
