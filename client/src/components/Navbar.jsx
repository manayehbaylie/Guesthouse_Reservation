import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Search,
  CalendarDays,
  Building2,
  BedDouble,
  Users,
  BarChart3,
  Star,
  ClipboardList,
  ShieldCheck,
  LogOut,
  X,
  Settings,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Backend roles are uppercase:
  // GUEST, OWNER, RECEPTIONIST, ADMIN
  const role = user?.role?.toUpperCase() || 'GUEST';

  const handleLogout = () => {
    logout();
    onClose?.();
    navigate('/login');
  };

  const closeSidebar = () => {
    onClose?.();
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
      isActive
        ? 'bg-amber-100 text-amber-800'
        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
    }`;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-stone-200 shadow-lg transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto lg:shadow-none`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
              <span className="text-white font-bold">
                G
              </span>
            </div>

            <div>
              <div className="font-bold text-stone-900">
                Guesthouse
              </div>
              <div className="text-xs text-stone-500">
                Reservation
              </div>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={closeSidebar}
            className="lg:hidden p-2 rounded-lg text-stone-500 hover:bg-stone-100"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User information */}
        {user && (
          <div className="px-4 py-4 border-b border-stone-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <UserRound className="w-5 h-5 text-amber-700" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-800 truncate">
                  {user.fullName || user.name || 'User'}
                </p>

                <p className="text-xs text-stone-500 truncate">
                  {user.email}
                </p>

                <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                  {role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-3 overflow-y-auto h-[calc(100%-145px)]">

          {/* ================= GUEST / COMMON ================= */}
          <div className="mb-5">
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              General
            </p>

            <div className="space-y-1">
              <NavLink
                to="/"
                onClick={closeSidebar}
                className={linkClass}
              >
                <Home className="w-4 h-4" />
                Home
              </NavLink>

              <NavLink
                to="/search"
                onClick={closeSidebar}
                className={linkClass}
              >
                <Search className="w-4 h-4" />
                Search Guesthouses
              </NavLink>

              {user && (
                <NavLink
                  to="/reservations"
                  onClick={closeSidebar}
                  className={linkClass}
                >
                  <CalendarDays className="w-4 h-4" />
                  My Reservations
                </NavLink>
              )}
            </div>
          </div>

          {/* ================= OWNER ================= */}
          {role === 'OWNER' && (
            <div className="mb-5">
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Owner
              </p>

              <div className="space-y-1">
                <NavLink
                  to="/owner"
                  end
                  onClick={closeSidebar}
                  className={linkClass}
                >
                  <Building2 className="w-4 h-4" />
                  Dashboard
                </NavLink>

                <NavLink
                  to="/owner/guesthouse"
                  onClick={closeSidebar}
                  className={linkClass}
                >
                  <Building2 className="w-4 h-4" />
                  Guesthouse
                </NavLink>

                <NavLink
                  to="/owner/rooms"
                  onClick={closeSidebar}
                  className={linkClass}
                >
                  <BedDouble className="w-4 h-4" />
                  Rooms
                </NavLink>

                <NavLink
                  to="/owner/staff"
                  onClick={closeSidebar}
                  className={linkClass}
                >
                  <Users className="w-4 h-4" />
                  Staff
                </NavLink>

                <NavLink
                  to="/owner/revenue"
                  onClick={closeSidebar}
                  className={linkClass}
                >
                  <BarChart3 className="w-4 h-4" />
                  Revenue
                </NavLink>

                <NavLink
                  to="/owner/reviews"
                  onClick={closeSidebar}
                  className={linkClass}
                >
                  <Star className="w-4 h-4" />
                  Guest Reviews
                </NavLink>
              </div>
            </div>
          )}

          {/* ================= RECEPTIONIST ================= */}
          {role === 'RECEPTIONIST' && (
            <div className="mb-5">
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Receptionist
              </p>

              <div className="space-y-1">
                <NavLink
                  to="/receptionist"
                  end
                  onClick={closeSidebar}
                  className={linkClass}
                >
                  <ClipboardList className="w-4 h-4" />
                  Dashboard
                </NavLink>

                <NavLink
                  to="/reservations"
                  onClick={closeSidebar}
                  className={linkClass}
                >
                  <CalendarDays className="w-4 h-4" />
                  Reservations
                </NavLink>
              </div>
            </div>
          )}

          {/* ================= ADMIN ================= */}
          {role === 'ADMIN' && (
            <div className="mb-5">
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Administration
              </p>

              <div className="space-y-1">
                <NavLink
                  to="/admin"
                  end
                  onClick={closeSidebar}
                  className={linkClass}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin Dashboard
                </NavLink>
              </div>
            </div>
          )}

          {/* ================= ACCOUNT ================= */}
          {user && (
            <div className="border-t border-stone-200 pt-4">
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Account
              </p>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Settings placeholder if needed later */}
          {false && (
            <NavLink
              to="/settings"
              onClick={closeSidebar}
              className={linkClass}
            >
              <Settings className="w-4 h-4" />
              Settings
            </NavLink>
          )}
        </nav>
      </aside>
    </>
  );
};