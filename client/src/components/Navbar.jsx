import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Building2,
  Calendar,
  Home,
  Search,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  DollarSign,
  Users,
  BedDouble,
  UserCheck,
  Sparkles,
  Menu,
  X,
  Terminal,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';

export function Navbar({ onOpenArchModal }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = user?.role || 'GUEST';

  const handleRoleButtonClick = (targetRole) => {
    // When logged out, role buttons navigate to login
    if (!user) {
      navigate('/login');
      return;
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-stone-900 border-b border-stone-800 text-stone-100 shadow-md">
      {/* Top Banner for Role Buttons - Hide for Owner and Receptionist pages */}
      {!location.pathname.startsWith('/owner') && !location.pathname.startsWith('/receptionist') && (
        <div className="bg-stone-950 px-4 py-1.5 text-xs border-b border-stone-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-stone-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {user ? (
              <>
                <span>Logged in as: <strong className="text-amber-400 font-bold uppercase">{role}</strong></span>
                <span className="hidden sm:inline text-stone-700">|</span>
                <span className="hidden sm:inline text-stone-400">{user.email}</span>
              </>
            ) : (
              <span>Guest Mode - <strong className="text-amber-400">Not Logged In</strong></span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Show role buttons only when logged out */}
            {/* {!user && (
              <>
                <span className="text-stone-500 font-medium mr-1 text-[11px] hidden md:inline">Login as:</span>
                {['Guest', 'Receptionist', 'Owner', 'Admin'].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRoleButtonClick(r)}
                    className="px-2 py-0.5 rounded text-[11px] font-medium bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </>
            )} */}

            {/* {onOpenArchModal && (
              <button
                onClick={onOpenArchModal}
                className="ml-2 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 flex items-center gap-1"
              >
                <Terminal className="w-3 h-3" />
                <span className="hidden sm:inline">Backend/Frontend Specs</span>
              </button>
            )} */}
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            {/* Hide brand logo for Owner pages */}
            {!location.pathname.startsWith('/owner') && !location.pathname.startsWith('/receptionist') ? (
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-stone-950 shadow-md group-hover:scale-105 transition-transform font-black">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-base sm:text-lg text-white tracking-tight block leading-none">
                     well come to this Guesthouse 
                  </span>
                  <span className="text-[10px] text-amber-400/90 font-medium tracking-wider uppercase block mt-1">
                    
                  </span>
                </div>
              </Link>
            ) : location.pathname.startsWith('/owner') ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-stone-950 shadow-md font-black">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-base sm:text-lg text-white tracking-tight block leading-none">
                    Owner Dashboard
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-bold text-base sm:text-lg">Back</span>
              </button>
            )}
          </div>

          {/* Navigation Links for Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Show guest navigation when logged out or when logged in as GUEST */}
            {!user || role === 'GUEST' ? (
              <>
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isActive('/') ? 'bg-amber-500/10 text-amber-400' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </Link>
                <Link
                  to="/search"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isActive('/search') ? 'bg-amber-500/10 text-amber-400' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  
                  
                </Link>
                {user && (
                  <Link
                    to="/reservations"
                    className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isActive('/reservations') ? 'bg-amber-500/10 text-amber-400' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>My Reservations</span>
                  </Link>
                )}
              </>
            ) : null}

            {/* Owner-specific navigation items - Hide when on Owner pages */}
            {role === 'OWNER' && !location.pathname.startsWith('/owner') && (
              <>
                <Link
                  to="/owner"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isActive('/owner') ? 'bg-amber-500/10 text-amber-400' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/owner/guesthouse"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isActive('/owner/guesthouse') ? 'bg-amber-500/10 text-amber-400' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Manage Guesthouse</span>
                </Link>

                <Link
                  to="/owner/rooms"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isActive('/owner/rooms') ? 'bg-amber-500/10 text-amber-400' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <BedDouble className="w-4 h-4" />
                  <span>Rooms</span>
                </Link>

                <Link
                  to="/owner/staff"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isActive('/owner/staff') ? 'bg-amber-500/10 text-amber-400' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Staff</span>
                </Link>

                <Link
                  to="/owner/revenue"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isActive('/owner/revenue') ? 'bg-amber-500/10 text-amber-400' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Revenue</span>
                </Link>

                <Link
                  to="/owner/reviews"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isActive('/owner/reviews') ? 'bg-amber-500/10 text-amber-400' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Reviews</span>
                </Link>
              </>
            )}

            {/* Show "Back to Home" link when on Owner pages */}
            {location.pathname.startsWith('/owner') && (
              <Link
                to="/"
                className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors text-stone-300 hover:bg-stone-800 hover:text-white"
              >
                <Home className="w-4 h-4" />
                <span>Back to Home</span>
              </Link>
            )}

            {/* Receptionist specific links */}
            {role === 'RECEPTIONIST' && (
              <Link
                to="/receptionist"
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isActive('/receptionist') ? 'bg-amber-500/10 text-amber-400' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Front Desk</span>
              </Link>
            )}

            {/* Admin specific links */}
            {role === 'ADMIN' && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isActive('/admin') ? 'bg-amber-500/10 text-amber-400' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Console</span>
              </Link>
            )}
          </nav>

          {/* User Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-stone-800">
                {/* Hide user info for Owner pages */}
                {!location.pathname.startsWith('/owner') && (
                  <div className="text-right">
                    <div className="text-xs font-bold text-stone-200">{user.fullName}</div>
                    <div className="text-[10px] text-amber-400">{role}</div>
                  </div>
                )}
                {/* Always show logout button */}
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-xs transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger - Hide for Owner and Receptionist pages */}
          {!location.pathname.startsWith('/owner') && !location.pathname.startsWith('/receptionist') && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}

          {/* Show logout button on Owner and Receptionist pages for mobile */}
          {(location.pathname.startsWith('/owner') || location.pathname.startsWith('/receptionist')) && (
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="md:hidden p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
              title="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu - Hide for Owner and Receptionist pages */}
      {mobileMenuOpen && !location.pathname.startsWith('/owner') && !location.pathname.startsWith('/receptionist') && (
        <div className="md:hidden border-t border-stone-800 bg-stone-900 px-4 py-3 space-y-2">
          {/* Show guest navigation when logged out or when logged in as GUEST */}
          {!user || role === 'GUEST' ? (
            <>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-stone-300 hover:bg-stone-800"
              >
                Home
              </Link>
              <Link
                to="/search"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-stone-300 hover:bg-stone-800"
              >
                Search
              </Link>
              {user && (
                <Link
                  to="/reservations"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-stone-300 hover:bg-stone-800"
                >
                  My Reservations
                </Link>
              )}
            </>
          ) : null}

          {/* Owner-specific navigation items - Hide when on Owner pages */}
          {role === 'OWNER' && !location.pathname.startsWith('/owner') && (
            <>
              <Link
                to="/owner"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-stone-800"
              >
                Dashboard
              </Link>
              <Link
                to="/owner/guesthouse"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-stone-800"
              >
                Manage Guesthouse
              </Link>
              <Link
                to="/owner/rooms"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-stone-800"
              >
                Rooms
              </Link>
              <Link
                to="/owner/staff"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-stone-800"
              >
                Staff
              </Link>
              <Link
                to="/owner/revenue"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-stone-800"
              >
                Revenue
              </Link>
              <Link
                to="/owner/reviews"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-stone-800"
              >
                Reviews
              </Link>
            </>
          )}

          {/* Receptionist specific links */}
          {role === 'RECEPTIONIST' && (
            <Link
              to="/receptionist"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-emerald-400 hover:bg-stone-800"
            >
              Front Desk
            </Link>
          )}

          {/* Admin specific links */}
          {role === 'ADMIN' && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-purple-400 hover:bg-stone-800"
            >
              Admin Console
            </Link>
          )}
        </div>
      )}
    </header>
  );
}