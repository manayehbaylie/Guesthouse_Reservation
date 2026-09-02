import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LogIn,
  Mail,
  Lock,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  Phone,
} from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';
  const reservationData = location.state?.reservationData || null;
  const bookingData = location.state?.bookingData || null;
  const pendingReservation = location.state?.pendingReservation || false;

  const [hasPendingReservation, setHasPendingReservation] = useState(false);

  useEffect(() => {
    const pendingData = sessionStorage.getItem('pendingReservation');
    if (pendingData) {
      try {
        const parsed = JSON.parse(pendingData);
        setHasPendingReservation(true);
      } catch (e) {
        console.error('Failed to parse pending reservation:', e);
      }
    }
  }, []);

  const isComingFromBooking = () => {
    if (reservationData || bookingData || pendingReservation) {
      return true;
    }
    if (hasPendingReservation) {
      return true;
    }
    const fromState = location.state?.from;
    if (fromState) {
      if (typeof fromState === 'string') {
        return fromState.includes('/booking');
      }
      if (typeof fromState === 'object' && fromState.pathname) {
        return fromState.pathname.includes('/booking');
      }
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);

      // ✅ Check for pending reservation in localStorage (not sessionStorage)
      const pendingData = localStorage.getItem('pendingBooking');
      
      if (pendingData) {
        try {
          const bookingData = JSON.parse(pendingData);
          localStorage.removeItem('pendingBooking');
          
          console.log('✅ Redirecting to dashboard with booking data');
          
          // ✅ Navigate to guest dashboard with payment flag
          navigate('/guest/dashboard', {
            replace: true,
            state: {
              showPayment: true,
              bookingData: bookingData,
              fromLogin: true,
            }
          });
          return;
        } catch (e) {
          console.error('Failed to process pending booking:', e);
          localStorage.removeItem('pendingBooking');
        }
      }

      // Check if coming from booking with state data
      if (reservationData || bookingData) {
        const data = reservationData || bookingData;
        
        navigate('/guest/dashboard', {
          replace: true,
          state: {
            showPayment: true,
            bookingData: data,
            fromLogin: true,
          }
        });
        return;
      }

      const cameFromBooking = isComingFromBooking();

      if (cameFromBooking) {
        const retryPending = localStorage.getItem('pendingBooking');
        if (retryPending) {
          try {
            const data = JSON.parse(retryPending);
            localStorage.removeItem('pendingBooking');
            
            navigate('/guest/dashboard', {
              replace: true,
              state: {
                showPayment: true,
                bookingData: data,
                fromLogin: true,
              }
            });
            return;
          } catch (e) {
            console.error('Failed to retry pending booking:', e);
          }
        }
        navigate('/guest/dashboard', { replace: true });
        return;
      }

      // Role-based redirection for non-booking flows
      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });

      } else if (user.role === 'OWNER') {
        navigate('/owner', { replace: true });

      } else if (user.role === 'RECEPTIONIST') {
        navigate('/receptionist', { replace: true });

      } else if (user.role === 'GUEST') {
        // Normal guest login - go to dashboard
        navigate('/guest/dashboard', { replace: true });

      } else {
        navigate(from, { replace: true });
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

  const isFromBooking = isComingFromBooking();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 lg:p-10">

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <span className="text-2xl font-black text-stone-900">Guesthouse</span>
            <span className="text-2xl font-black text-stone-900"> Platform</span>
          </div>
        </div>

        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-stone-900">
            {isFromBooking ? 'Login to Complete Booking' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-stone-500">
            {isFromBooking 
              ? 'Please log in to confirm your reservation'
              : 'Sign in to your account to continue'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="flex gap-2 p-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${
                loginMethod === 'email'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${
                loginMethod === 'phone'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Phone className="w-4 h-4 inline mr-2" />
              Phone
            </button>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">
              {loginMethod === 'email' ? 'Email Address' : 'Phone Number'}
            </label>
            <div className="relative">
              {loginMethod === 'email' ? (
                <Mail className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              ) : (
                <Phone className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              )}
              <input
                type={loginMethod === 'email' ? 'email' : 'tel'}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={loginMethod === 'email' ? 'guest@example.com' : '+251 9XXXXXXXX'}
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-stone-300 text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-12 pr-12 py-4 rounded-xl border border-stone-300 text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="mt-2 text-right">
              <Link to="/forgot-password" className="text-sm font-semibold text-amber-600 hover:text-amber-700 hover:underline">
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-lg rounded-xl transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>{isFromBooking ? 'Login & Continue' : 'Sign In'}</span>
                {isFromBooking && <ArrowRight className="w-5 h-5" />}
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-stone-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-amber-600 hover:text-amber-700 hover:underline">
            Create Account
          </Link>
        </p>

        <div className="mt-8 pt-6 border-t border-stone-200 text-center">
          <p className="text-sm text-stone-400">
            © 2026 Guesthouse Platform. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
}

export default Login;