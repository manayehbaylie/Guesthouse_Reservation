import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ApiService } from '../services/api.js';
import {
  Search,
  Calendar,
  Home,
  Building2,
  BedDouble,
  Users,
  DollarSign,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ChevronRight,
  Code2,
  LogOut,
  Sliders,
  CheckCircle2,
  X,
  Layers,
  Terminal
} from 'lucide-react';

export function Sidebar({ isOpen, onClose, onOpenArchModal }) {
  const { user, logout, switchUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const role = user?.role || 'Guest';

  const isActive = (path) => location.pathname === path;

  const handleQuickSwitchRole = (targetRole) => {
    const allUsers = ApiService.getAllUsers();
    const userToSet = allUsers.find((u) => u.role === targetRole) || allUsers[0];
    switchUser(userToSet);

    if (targetRole === 'Admin') navigate('/admin');
    else if (targetRole === 'Owner') navigate('/owner');
    else if (targetRole === 'Receptionist') navigate('/receptionist');
    else navigate('/');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-stone-900 text-stone-200 border-r border-stone-800 flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" onClick={onClose}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-stone-950 shadow-md font-black">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white tracking-tight leading-tight">
                Guesthouse Platform
              </div>
              <div className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">
                SRS v2.0 Architecture
              </div>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
          {/* Active Role Card & Switcher */}
          <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-stone-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Active Context:
              </span>
              <strong className="text-amber-400 font-bold uppercase">{role}</strong>
            </div>

            <div className="text-[11px] text-stone-300 font-medium truncate">
              {user?.name || 'Walk-In Guest'} ({user?.email || 'Guest Mode'})
            </div>

            {/* Quick Switch Buttons */}
            <div className="pt-1">
              <div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-1.5">
                Switch Portal Mode:
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {['Guest', 'Receptionist', 'Owner', 'Admin'].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleQuickSwitchRole(r)}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all text-left flex items-center justify-between ${
                      role === r
                        ? 'bg-amber-500 text-stone-950 shadow-xs'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white'
                    }`}
                  >
                    <span>{r}</span>
                    {role === r && <CheckCircle2 className="w-3 h-3 text-stone-950" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Guest Navigation */}
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              Guest Services
            </div>
            <Link
              to="/search"
              onClick={onClose}
              className={`w-full px-3 py-2.5 rounded-xl font-semibold flex items-center justify-between transition-colors ${
                isActive('/search')
                  ? 'bg-amber-500 text-stone-950 shadow-xs font-bold'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4" />
                <span>Search Guesthouses</span>
              </div>
              <span className="text-[10px] bg-amber-400/20 px-1.5 py-0.5 rounded text-amber-300 font-bold">
                Live Filter
              </span>
            </Link>

            <Link
              to="/"
              onClick={onClose}
              className={`w-full px-3 py-2.5 rounded-xl font-semibold flex items-center gap-2.5 transition-colors ${
                isActive('/')
                  ? 'bg-amber-500/15 text-amber-400 font-bold'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Explore Homepage</span>
            </Link>

            <Link
              to="/reservations"
              onClick={onClose}
              className={`w-full px-3 py-2.5 rounded-xl font-semibold flex items-center gap-2.5 transition-colors ${
                isActive('/reservations')
                  ? 'bg-amber-500/15 text-amber-400 font-bold'
                  : 'text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>My Reservations</span>
            </Link>
          </div>

          {/* Owner Navigation */}
          {(role === 'Owner' || role === 'Admin') && (
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-bold text-amber-400/80 uppercase tracking-wider">
                Property Owner Hub
              </div>
              <Link
                to="/owner"
                onClick={onClose}
                className={`w-full px-3 py-2 rounded-xl font-semibold flex items-center gap-2.5 transition-colors ${
                  isActive('/owner')
                    ? 'bg-amber-500/15 text-amber-400 font-bold'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Property Dashboard</span>
              </Link>
              <Link
                to="/owner/rooms"
                onClick={onClose}
                className={`w-full px-3 py-2 rounded-xl font-semibold flex items-center gap-2.5 transition-colors ${
                  isActive('/owner/rooms')
                    ? 'bg-amber-500/15 text-amber-400 font-bold'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <BedDouble className="w-4 h-4" />
                <span>Manage Rooms</span>
              </Link>
              <Link
                to="/owner/staff"
                onClick={onClose}
                className={`w-full px-3 py-2 rounded-xl font-semibold flex items-center gap-2.5 transition-colors ${
                  isActive('/owner/staff')
                    ? 'bg-amber-500/15 text-amber-400 font-bold'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Manage Staff</span>
              </Link>
              <Link
                to="/owner/revenue"
                onClick={onClose}
                className={`w-full px-3 py-2 rounded-xl font-semibold flex items-center gap-2.5 transition-colors ${
                  isActive('/owner/revenue')
                    ? 'bg-amber-500/15 text-amber-400 font-bold'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Revenue & Gateway Reports</span>
              </Link>
            </div>
          )}

          {/* Receptionist Navigation */}
          {(role === 'Receptionist' || role === 'Owner' || role === 'Admin') && (
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Front Desk Reception
              </div>
              <Link
                to="/receptionist"
                onClick={onClose}
                className={`w-full px-3 py-2 rounded-xl font-semibold flex items-center gap-2.5 transition-colors ${
                  isActive('/receptionist')
                    ? 'bg-emerald-500/15 text-emerald-400 font-bold'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Check-In & Desk Operations</span>
              </Link>
            </div>
          )}

          {/* Admin Navigation */}
          {role === 'Admin' && (
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                System Administration
              </div>
              <Link
                to="/admin"
                onClick={onClose}
                className={`w-full px-3 py-2 rounded-xl font-semibold flex items-center gap-2.5 transition-colors ${
                  isActive('/admin')
                    ? 'bg-purple-500/15 text-purple-300 font-bold'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Platform Admin Dashboard</span>
              </Link>
            </div>
          )}

          {/* Architecture & API Documentation Button */}
          <div className="pt-4 border-t border-stone-800/80 space-y-1">
            <div className="px-2 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              Developer Architecture
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenArchModal();
              }}
              className="w-full px-3 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl font-semibold flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>Backend & Frontend Specs</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            </button>
          </div>
        </div>

        {/* Bottom User Profile */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name ? user.name.charAt(0) : 'G'}
            </div>
            <div className="truncate">
              <div className="font-bold text-xs text-stone-200 truncate">{user?.name || 'Guest User'}</div>
              <div className="text-[10px] text-stone-500 truncate">{user?.email || 'Not logged in'}</div>
            </div>
          </div>

          {user ? (
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-stone-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className="text-xs font-bold text-amber-400 hover:underline"
            >
              Login
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
