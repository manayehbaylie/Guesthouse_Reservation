import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Building2,
  Calendar,
  Home,
  Search,
  ShieldCheck,
  LogOut,
  UserCheck,
  Menu,
  X,
  PanelLeftOpen,
  Sparkles,
} from "lucide-react";

export function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = user?.role || "Guest";

  const isActive = (path) => location.pathname === path;

  /*
   * ----------------------------------------------------------
   * DASHBOARD ROUTES
   * ----------------------------------------------------------
   */

  const isDashboardRoute = /^\/(owner|receptionist|admin)(\/|$)/.test(
    location.pathname
  );

  /*
   * ----------------------------------------------------------
   * CHECK IF LOGGED-IN USER IS A GUEST
   * ----------------------------------------------------------
   */

  const isGuest = Boolean(user) && role.toUpperCase() === "GUEST";

  /*
   * ----------------------------------------------------------
   * LOGOUT
   * ----------------------------------------------------------
   */

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/login");
  };

  /*
   * ----------------------------------------------------------
   * CLOSE MOBILE MENU
   * ----------------------------------------------------------
   */

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-stone-800 bg-stone-900 text-stone-100 shadow-md">
      {/* ======================================================
          TOP STATUS BAR
      ====================================================== */}

      <div className="border-b border-stone-800/80 bg-stone-950 px-4 py-1.5">
        <div className="mx-auto flex max-w-7xl items-center gap-2 text-xs font-medium text-stone-400">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />

          <span>
            {user ? (
              <>
                Active Context:{" "}
                <strong className="font-bold uppercase text-amber-400">
                  {role}
                </strong>
              </>
            ) : (
              <span>Guesthouse Reservation Platform</span>
            )}
          </span>

          {user?.email && (
            <>
              <span className="hidden text-stone-700 sm:inline">|</span>

              <span className="hidden text-stone-400 sm:inline">
                {user.email}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ======================================================
          MAIN NAVBAR
      ====================================================== */}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* ==================================================
              LOGO / BRAND
          ================================================== */}

          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="flex items-center gap-1.5 rounded-xl bg-stone-800 p-2 text-xs font-bold text-amber-400 transition-colors hover:bg-stone-700"
                title="Toggle Sidebar Navigation"
              >
                <PanelLeftOpen className="h-5 w-5" />

                <span className="hidden text-[11px] lg:inline">
                  Sidebar
                </span>
              </button>
            )}

            <Link
              to="/"
              className="group flex items-center gap-3"
              onClick={closeMobileMenu}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-stone-950 shadow-md transition-transform group-hover:scale-105">
                <Building2 className="h-5 w-5" />
              </div>

              <div>
                <span className="block text-base font-bold leading-none tracking-tight text-white sm:text-lg">
                  Guesthouse Platform
                </span>

                <span className="mt-1 block text-[10px] font-medium uppercase tracking-wider text-amber-400/90">
                  SRS v2.0 Architecture
                </span>
              </div>
            </Link>
          </div>

          {/* ==================================================
              DESKTOP NAVIGATION
          ================================================== */}

          <nav className="hidden items-center gap-1 md:flex">
            {/* ------------------------------------------------
                SEARCH GUESTHOUSES
                ONLY VISIBLE AFTER GUEST LOGIN
            ------------------------------------------------ */}

            {isGuest && !isDashboardRoute && (
              <Link
                to="/search"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                  isActive("/search")
                    ? "bg-amber-500 text-stone-950 shadow-xs"
                    : "text-stone-300 hover:bg-stone-800 hover:text-white"
                }`}
              >
                <Search className="h-4 w-4" />

                <span>Search Guesthouses</span>
              </Link>
            )}

            {/* ------------------------------------------------
                HOME
                ALWAYS VISIBLE
            ------------------------------------------------ */}

            <Link
              to="/"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                isActive("/")
                  ? "bg-amber-500/10 text-amber-400"
                  : "text-stone-300 hover:bg-stone-800 hover:text-white"
              }`}
            >
              <Home className="h-4 w-4" />

              <span>Home</span>
            </Link>

            {/* ------------------------------------------------
                MY BOOKINGS
                ONLY VISIBLE TO LOGGED-IN GUEST
            ------------------------------------------------ */}

            {isGuest && !isDashboardRoute && (
              <Link
                to="/reservations"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  isActive("/reservations")
                    ? "bg-amber-500/10 text-amber-400"
                    : "text-stone-300 hover:bg-stone-800 hover:text-white"
                }`}
              >
                <Calendar className="h-4 w-4" />

                <span>My Bookings</span>
              </Link>
            )}

            {/* =================================================
                OWNER NAVIGATION
            ================================================= */}

            {role.toUpperCase() === "OWNER" && (
              <Link
                to="/owner"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  isActive("/owner")
                    ? "bg-amber-500/10 text-amber-400"
                    : "text-stone-300 hover:bg-stone-800 hover:text-white"
                }`}
              >
                <Building2 className="h-4 w-4" />

                <span>Owner Hub</span>
              </Link>
            )}

            {/* =================================================
                RECEPTIONIST NAVIGATION
            ================================================= */}

            {role.toUpperCase() === "RECEPTIONIST" && (
              <Link
                to="/receptionist"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive("/receptionist")
                    ? "bg-amber-500/10 text-emerald-400"
                    : "text-stone-300 hover:bg-stone-800 hover:text-white"
                }`}
              >
                <UserCheck className="h-4 w-4" />

                <span>Front Desk</span>
              </Link>
            )}

            {/* =================================================
                ADMIN NAVIGATION
            ================================================= */}

            {role.toUpperCase() === "ADMIN" && (
              <Link
                to="/admin"
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive("/admin")
                    ? "bg-purple-500/10 text-purple-400"
                    : "text-stone-300 hover:bg-stone-800 hover:text-white"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />

                <span>Admin Console</span>
              </Link>
            )}
          </nav>

          {/* ==================================================
              DESKTOP LOGIN / USER AREA
          ================================================== */}

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <div className="flex items-center gap-3 border-l border-stone-800 pl-2">
                <div className="text-right">
                  <div className="text-xs font-bold text-stone-200">
                    {user.name || "User"}
                  </div>

                  <div className="text-[10px] text-amber-400">
                    {user.role || "Guest"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-800 hover:text-white"
                  title="Log out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <>
                {/* LOGIN */}

                <Link
                  to="/login"
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-stone-300 transition hover:bg-stone-800 hover:text-white"
                >
                  Log In
                </Link>

                {/* REGISTER */}

                <Link
                  to="/register"
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-black text-stone-950 transition hover:bg-amber-400"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* ==================================================
              MOBILE MENU BUTTON
          ================================================== */}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-800 hover:text-white md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* ======================================================
          MOBILE MENU
      ====================================================== */}

      {mobileMenuOpen && (
        <div className="space-y-2 border-t border-stone-800 bg-stone-900 px-4 py-3 md:hidden">
          {/* --------------------------------------------------
              LOGGED-IN GUEST
              SEARCH
          -------------------------------------------------- */}

          {isGuest && (
            <Link
              to="/search"
              onClick={closeMobileMenu}
              className={`block rounded-lg px-3 py-2 text-sm font-bold transition ${
                isActive("/search")
                  ? "bg-amber-500 text-stone-950"
                  : "bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white"
              }`}
            >
              🔍 Search Guesthouses
            </Link>
          )}

          {/* --------------------------------------------------
              HOME
          -------------------------------------------------- */}

          <Link
            to="/"
            onClick={closeMobileMenu}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-300 hover:bg-stone-800"
          >
            🏠 Home
          </Link>

          {/* --------------------------------------------------
              GUEST BOOKINGS
          -------------------------------------------------- */}

          {isGuest && (
            <Link
              to="/reservations"
              onClick={closeMobileMenu}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-300 hover:bg-stone-800"
            >
              📅 My Bookings
            </Link>
          )}

          {/* --------------------------------------------------
              OWNER
          -------------------------------------------------- */}

          {role.toUpperCase() === "OWNER" && (
            <Link
              to="/owner"
              onClick={closeMobileMenu}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-amber-400 hover:bg-stone-800"
            >
              🏢 Owner Dashboard
            </Link>
          )}

          {/* --------------------------------------------------
              RECEPTIONIST
          -------------------------------------------------- */}

          {role.toUpperCase() === "RECEPTIONIST" && (
            <Link
              to="/receptionist"
              onClick={closeMobileMenu}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-emerald-400 hover:bg-stone-800"
            >
              👤 Reception Desk
            </Link>
          )}

          {/* --------------------------------------------------
              ADMIN
          -------------------------------------------------- */}

          {role.toUpperCase() === "ADMIN" && (
            <Link
              to="/admin"
              onClick={closeMobileMenu}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-purple-400 hover:bg-stone-800"
            >
              🛡️ Admin Console
            </Link>
          )}

          {/* ==================================================
              MOBILE AUTH
          ================================================== */}

          {!user ? (
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-stone-800 pt-3">
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="rounded-lg px-3 py-2 text-center text-sm font-semibold text-stone-300 hover:bg-stone-800 hover:text-white"
              >
                Log In
              </Link>

              <Link
                to="/register"
                onClick={closeMobileMenu}
                className="rounded-lg bg-amber-500 px-3 py-2 text-center text-sm font-black text-stone-950 hover:bg-amber-400"
              >
                Register
              </Link>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center gap-2 border-t border-stone-800 pt-3 text-sm font-semibold text-red-400 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />

              Log Out
            </button>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;