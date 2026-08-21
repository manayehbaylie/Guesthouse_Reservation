
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LogIn,
  Mail,
  Lock,
  Sparkles,
  Building2,
  Eye,
  EyeOff,
} from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Keep the page the guest originally came from.
  // If there is no previous page, use the homepage.
  const from =
    location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);

      // ------------------------------------------------------
      // ROLE-BASED REDIRECTION
      // ------------------------------------------------------

      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });

      } else if (user.role === 'OWNER') {
        navigate('/owner', { replace: true });

      } else if (user.role === 'RECEPTIONIST') {
        navigate('/receptionist', { replace: true });

      } else if (user.role === 'GUEST') {
        /*
         * IMPORTANT:
         *
         * If the guest came from "View & Book", the protected
         * page should be stored in location.state.from.
         *
         * Otherwise, after a normal guest login, send the guest
         * to the Guest Search Dashboard instead of the homepage.
         */

        const cameFromProtectedPage =
          location.state?.from?.pathname;

        if (cameFromProtectedPage) {
          navigate(
            cameFromProtectedPage +
              (location.state?.from?.search || ''),
            {
              replace: true,
              state: location.state?.from?.state,
            }
          );
        } else {
          navigate('/guest/search', {
            replace: true,
          });
        }

      } else {
        navigate(from, {
          replace: true,
        });
      }

    } catch (err) {
      setError(
        err.message ||
          'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const sampleAccounts = [
    {
      name: 'Admin',
      email: 'admin@gmail.com',
      password: 'password123',
      role: 'ADMIN',
    },
    {
      name: 'Owner',
      email: 'manayeh@gmail.com',
      password: 'password123',
      role: 'OWNER',
    },
    {
      name: 'Receptionist',
      email: 'marta@gmail.com',
      password: 'password123',
      role: 'RECEPTIONIST',
    },
    {
      name: 'Guest',
      email: 'senayt@gmail.com',
      password: 'password123',
      role: 'GUEST',
    },
  ];

  const autofillAccount = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-stone-50">
      <div className="max-w-md w-full space-y-6">

        {/* HEADER */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md mb-3">
            <Building2 className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
            Sign in to your account
          </h2>

          <p className="mt-1 text-xs text-stone-500">
            Access Guesthouse Reservation Platform features
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-4"
        >

          {/* EMAIL */}
          <div>
            <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
              Email Address
            </label>

            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />

              <input
                type="email"
                required
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="guest@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
              Password
            </label>

            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />

              <input
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                required
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Password123"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (previous) => !previous
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
                aria-label={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
                title={
                  showPassword
                    ? 'Hide password'
                    : 'Show password'
                }
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* SIGN IN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />

            <span>
              {loading
                ? 'Authenticating...'
                : 'Sign In'}
            </span>
          </button>
        </form>

        {/* QUICK DEMO ACCOUNTS */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 text-xs">

          <div className="font-bold text-stone-800 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />

            <span>
              Click any Demo Account to autofill:
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {sampleAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() =>
                  autofillAccount(acc)
                }
                className="text-left p-2 rounded-lg bg-stone-50 hover:bg-amber-50 border border-stone-200 transition-colors"
              >
                <div className="font-semibold text-stone-900">
                  {acc.name}
                </div>

                <div className="text-[10px] text-amber-700 font-medium">
                  {acc.role}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* REGISTER LINK */}
        <p className="text-center text-xs text-stone-500">
          Don't have an account?{' '}

          <Link
            to="/register"
            className="font-semibold text-amber-600 hover:underline"
          >
            Register as Guest or Owner
          </Link>
        </p>

      </div>
    </div>
  );
}

