import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ApiService } from '../services/api.js';
import {
  Building2,
  Calendar,
  Home,
  Search,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Sliders,
  DollarSign,
  Users,
  BedDouble,
  UserCheck,
  Sparkles,
  Menu,
  X,
  PanelLeftOpen,
  Terminal
} from 'lucide-react';

export function Navbar({ onToggleSidebar, onOpenArchModal }) {
  const { user, logout, switchUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = user?.role || 'Guest';

  const handleQuickSwitchRole = (targetRole) => {
    const allUsers = ApiService.getAllUsers();
    const userToSet = allUsers.find((u) => u.role === targetRole) || allUsers[0];
    switchUser(userToSet);

    if (targetRole === 'Admin') navigate('/admin');
    else if (targetRole === 'Owner') navigate('/owner');
    else if (targetRole === 'Receptionist') navigate('/receptionist');
    else navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-stone-900 border-b border-stone-800 text-stone-100 shadow-md">
      {/* Top Banner for Role Quick Switcher */}
      <div className="bg-stone-950 px-4 py-1.5 text-xs border-b border-stone-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-stone-400 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Active Context: <strong className="text-amber-400 font-bold uppercase">{role}</strong></span>
          <span className="hidden sm:inline text-stone-700">|</span>
          <span className="hidden sm:inline text-stone-400">{user?.email || 'Guest Mode'}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-stone-500 font-medium mr-1 text-[11px] hidden md:inline">Quick Role Switch:</span>
          {['Guest', 'Receptionist', 'Owner', 'Admin'].map((r) => (
            <button
              key={r}
              onClick={() => handleQuickSwitchRole(r)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                role === r
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}

          {onOpenArchModal && (
            <button
              onClick={onOpenArchModal}
              className="ml-2 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 flex items-center gap-1"
            >
              <Terminal className="w-3 h-3" />
              <span className="hidden sm:inline">Backend/Frontend Specs</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Sidebar Toggle Button */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 transition-colors flex items-center gap-1.5 font-bold text-xs"
                title="Toggle Sidebar Navigation"
              >
                <PanelLeftOpen className="w-5 h-5" />
                <span className="hidden lg:inline text-[11px]">Sidebar</span>
              </button>
            )}

            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-stone-950 shadow-md group-hover:scale-105 transition-transform font-black">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base sm:text-lg text-white tracking-tight block leading-none">
                  Guesthouse Platform
                </span>
                <span className="text-[10px] text-amber-400/90 font-medium tracking-wider uppercase block mt-1">
                  SRS v2.0 Architecture
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links for Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/search"
              className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                isActive('/search')
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Search Guesthouses</span>
            </Link>

            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isActive('/') ? 'bg-amber-500/10 text-amber-400' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            {user && (
              <Link
                to="/reservations"
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isActive('/reservations') ? 'bg-amber-500/10 text-amber-400' : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>My Bookings</span>
              </Link>
            )}


{/* Owner specific links */}
{role === 'Owner' && (
  <>
    {/* Owner Dashboard */}
    <Link
      to="/owner"
      className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
        isActive('/owner')
          ? 'bg-amber-500/10 text-amber-400'
          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
      }`}
    >
      <Building2 className="w-4 h-4" />
      <span>Owner Hub</span>
    </Link>

    {/* Create / Manage Guesthouse */}
    <Link
      to="/owner/guesthouse"
      className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
        isActive('/owner/guesthouse')
          ? 'bg-amber-500/10 text-amber-400'
          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
      }`}
    >
      <Building2 className="w-4 h-4" />
      <span>Create / Manage Guesthouse</span>
    </Link>
  </>
)}
              
            

            {/* Receptionist specific links */}
            {role === 'Receptionist' && (
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
            {role === 'Admin' && (
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
                <div className="text-right">
                  <div className="text-xs font-bold text-stone-200">{user.name}</div>
                  <div className="text-[10px] text-amber-400">{user.role}</div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
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

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-800 bg-stone-900 px-4 py-3 space-y-2">
          <Link
            to="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-bold bg-amber-500 text-stone-950"
          >
            🔍 Search Guesthouses
          </Link>
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-stone-300 hover:bg-stone-800"
          >
            Home
          </Link>
          {user && (
            <Link
              to="/reservations"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-stone-300 hover:bg-stone-800"
            >
              My Bookings
            </Link>
          )}
          {role === 'Owner' && (
  <>
    <Link
      to="/owner"
      onClick={() => setMobileMenuOpen(false)}
      className="block px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-stone-800"
    >
      Owner Dashboard
    </Link>

    <Link
      to="/owner/guesthouse"
      onClick={() => setMobileMenuOpen(false)}
      className="block px-3 py-2 rounded-lg text-sm font-medium text-amber-400 hover:bg-stone-800"
    >
      Create / Manage Guesthouse
    </Link>
  </>
)}
          {role === 'Receptionist' && (
            <Link
              to="/receptionist"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-emerald-400 hover:bg-stone-800"
            >
              Reception Desk
            </Link>
          )}
          {role === 'Admin' && (
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
