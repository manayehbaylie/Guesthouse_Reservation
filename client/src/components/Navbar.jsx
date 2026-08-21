import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Building2,
  Calendar,
  Home,
  Search,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const normalizedRole = String(user?.role || "GUEST").toUpperCase();

  const isDashboardUser =
    normalizedRole === "ADMIN" ||
    normalizedRole === "OWNER" ||
    normalizedRole === "RECEPTIONIST";

  const isGuest = normalizedRole === "GUEST";

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-stone-800 bg-stone-950 text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* =====================================================
              LEFT SIDE / BRAND
              ===================================================== */}
          <div className="flex min-w-0 items-center gap-3">

            {/* 
              IMPORTANT:
              This button only controls the dashboard-specific
              sidebar passed from the dashboard layout.

              It does NOT render the shared PortalSidebar.
            */}
            {onToggleSidebar && isDashboardUser && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="rounded-lg bg-stone-800 p-2 text-amber-400 transition hover:bg-stone-700"
                title="Toggle dashboard sidebar"
                aria-label="Toggle dashboard sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            <Link
              to={isDashboardUser ? location.pathname : "/"}
              className="flex items-center gap-3"
              onClick={closeMobileMenu}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 shadow-md">
                <Building2 className="h-5 w-5" />
              </div>

              <div className="hidden sm:block">
                <span className="block text-base font-black tracking-tight">
                  Guesthouse Platform
                </span>

                <span className="block text-[10px] font-semibold uppercase tracking-widest text-amber-400">
                  Ethiopia
                </span>
              </div>
            </Link>
          </div>

          {/* =====================================================
              DESKTOP NAVIGATION

              Only normal guest/public navigation appears here.

              NO:
              - SWITCH PORTAL MODE
              - GUEST SERVICES sidebar
              - Admin portal switch
              - Owner portal switch
              - Receptionist portal switch
              ===================================================== */}
          {!isDashboardUser && (
            <nav className="hidden items-center gap-1 md:flex">

              {/* HOME */}
              <Link
                to="/"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive("/")
                    ? "bg-amber-500 text-stone-950"
                    : "text-stone-300 hover:bg-stone-800 hover:text-white"
                }`}
              >
                <Home className="h-4 w-4" />
                Home
              </Link>

              {/* SEARCH */}
              {/* <Link
                to="/search"
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black transition ${
                  isActive("/search")
                    ? "bg-amber-500 text-stone-950 shadow-md"
                    : "bg-stone-800 text-amber-400 hover:bg-stone-700"
                }`}
              >
                <Search className="h-4 w-4" />
                Search Guesthouses
              </Link> */}

              {/* MY RESERVATIONS */}
              {user && isGuest && (
                <Link
                  to="/reservations"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    isActive("/reservations")
                      ? "bg-amber-500/10 text-amber-400"
                      : "text-stone-300 hover:bg-stone-800 hover:text-white"
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  My Bookings
                </Link>
              )}
            </nav>
          )}

          {/* =====================================================
              DESKTOP USER / AUTH
              ===================================================== */}
          <div className="hidden items-center gap-3 md:flex">

            {user ? (
              <>
                <div className="border-l border-stone-800 pl-3 text-right">
                  <p className="text-sm font-bold text-stone-100">
                    {user.fullName || user.name || "User"}
                  </p>

                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-400">
                    {normalizedRole}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-800 hover:text-white"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-stone-300 transition hover:bg-stone-800 hover:text-white"
                >
                  Log In
                </Link>

                <Link
                  to="/register"
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-black text-stone-950 transition hover:bg-amber-400"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* =====================================================
              MOBILE BUTTON
              ===================================================== */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="rounded-lg p-2 text-stone-300 transition hover:bg-stone-800 hover:text-white md:hidden"
            aria-label={
              mobileMenuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* =====================================================
          MOBILE MENU

          NO PORTAL SIDEBAR HERE.
          Dashboard-specific sidebars remain outside Navbar.
          ===================================================== */}
      {mobileMenuOpen && (
        <div className="border-t border-stone-800 bg-stone-950 px-4 py-4 md:hidden">
          <nav className="space-y-2">

            {/* =================================================
                GUEST / PUBLIC NAVIGATION
                ================================================= */}
            {!isDashboardUser && (
              <>
                <Link
                  to="/"
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold ${
                    isActive("/")
                      ? "bg-amber-500 text-stone-950"
                      : "text-stone-300 hover:bg-stone-800"
                  }`}
                >
                  <Home className="h-5 w-5" />
                  Home
                </Link>

                <Link
                  to="/search"
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-black ${
                    isActive("/search")
                      ? "bg-amber-500 text-stone-950"
                      : "bg-stone-800 text-amber-400 hover:bg-stone-700"
                  }`}
                >
                  <Search className="h-5 w-5" />
                  Search Guesthouses
                </Link>

                {user && isGuest && (
                  <Link
                    to="/reservations"
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold ${
                      isActive("/reservations")
                        ? "bg-amber-500/10 text-amber-400"
                        : "text-stone-300 hover:bg-stone-800"
                    }`}
                  >
                    <Calendar className="h-5 w-5" />
                    My Bookings
                  </Link>
                )}
              </>
            )}

            {/* =================================================
                DASHBOARD USERS

                We intentionally do NOT render:
                - PortalSidebar
                - Switch Portal Mode
                - Guest Services
                - Admin Console
                - Owner Dashboard
                - Receptionist Dashboard

                Their own dashboard sidebar handles navigation.
                ================================================= */}
            {isDashboardUser && (
              <div className="rounded-lg border border-stone-800 bg-stone-900 p-4">
                <p className="text-sm font-bold text-white">
                  {user?.fullName || user?.name || "User"}
                </p>

                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-400">
                  {normalizedRole}
                </p>

                <p className="mt-2 text-xs text-stone-500">
                  Use your dashboard sidebar for navigation.
                </p>
              </div>
            )}

            {/* =================================================
                NOT LOGGED IN
                ================================================= */}
            {!user && (
              <div className="grid grid-cols-2 gap-2 border-t border-stone-800 pt-3">
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="rounded-lg border border-stone-700 px-4 py-3 text-center text-sm font-semibold text-stone-300"
                >
                  Log In
                </Link>

                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="rounded-lg bg-amber-500 px-4 py-3 text-center text-sm font-black text-stone-950"
                >
                  Register
                </Link>
              </div>
            )}

            {/* =================================================
                USER INFORMATION + LOGOUT
                ================================================= */}
            {user && (
              <div className="mt-3 border-t border-stone-800 pt-3">

                <div className="mb-3 rounded-lg bg-stone-900 p-3">
                  <p className="text-sm font-bold text-white">
                    {user.fullName || user.name || "User"}
                  </p>

                  <p className="mt-1 text-xs text-amber-400">
                    {user.email || ""}
                  </p>

                  <p className="mt-1 text-[10px] font-bold uppercase text-stone-500">
                    {normalizedRole}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-700 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-stone-800"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;