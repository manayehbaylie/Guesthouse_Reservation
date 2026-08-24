
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Building2,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = String(user?.role || "GUEST").toUpperCase();

  const isDashboardUser =
    role === "OWNER" ||
    role === "RECEPTIONIST" ||
    role === "ADMIN";

  const closeMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }

    closeMenu();
    navigate("/login");
  };

  const navLinkClass = (active = false) =>
    `relative rounded-lg px-3 py-2 text-sm font-semibold transition ${
      active
        ? "bg-stone-50 text-[#043658]"
        : "text-stone-600 hover:bg-stone-50 hover:text-[#043658]"
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">

          {/* LEFT SIDE */}
          <div className="flex items-center gap-4">

            {/* SIDEBAR BUTTON */}
            {isDashboardUser && onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                aria-label="Open dashboard sidebar"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#043658] text-white transition hover:bg-[#064b78]"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            {/* LOGO */}
            <Link
              to="/"
              onClick={closeMenu}
              className="flex items-center gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#043658] text-[#FFC107]">
                <Building2 className="h-6 w-6" />
              </div>

              <div className="hidden sm:block">
                <div className="text-base font-black text-[#043658]">
                  Guesthouse Platform
                </div>

                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFC107]">
                  Ethiopia
                </div>
              </div>
            </Link>

            {/* DESKTOP NAVIGATION */}
            {!isDashboardUser && (
              <nav className="ml-2 hidden items-center gap-1 md:flex">

                {/* HOME */}
                <Link
                  to="/"
                  onClick={closeMenu}
                  className={navLinkClass(
                    location.pathname === "/"
                  )}
                >
                  Home
                </Link>

                {/* EXPLORE */}
                <Link
                  to="/explore"
                  onClick={closeMenu}
                  className={navLinkClass(
                    location.pathname === "/explore"
                  )}
                >
                  Explore
                </Link>

                {/* ABOUT US */}
                <Link
                  to="/about"
                  onClick={closeMenu}
                  className={navLinkClass(
                    location.pathname === "/about"
                  )}
                >
                  About Us
                </Link>

                {/* CONTACT */}
                <Link
                  to="/contact"
                  onClick={closeMenu}
                  className={navLinkClass(
                    location.pathname === "/contact"
                  )}
                >
                  Contact
                </Link>
              </nav>
            )}
          </div>

          {/* DESKTOP RIGHT SIDE */}
          <div className="hidden items-center gap-3 md:flex">
            {!user ? (
              <>
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold text-[#043658] transition hover:bg-stone-50"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="rounded-lg bg-[#043658] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#064b78]"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#043658]">
                    {user.fullName ||
                      user.name ||
                      "User"}
                  </p>

                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#FFC107]">
                    {role}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Logout"
                  title="Logout"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-500 transition hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen((open) => !open)
            }
            aria-label={
              mobileMenuOpen
                ? "Close menu"
                : "Open menu"
            }
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[#043658] transition hover:bg-stone-50 md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE NAVIGATION */}
      {mobileMenuOpen && (
        <div className="border-t border-stone-200 bg-white shadow-lg md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">

            {!isDashboardUser && (
              <nav className="flex flex-col gap-1">

                {/* HOME */}
                <Link
                  to="/"
                  onClick={closeMenu}
                  className={navLinkClass(
                    location.pathname === "/"
                  )}
                >
                  Home
                </Link>

                {/* EXPLORE */}
                <Link
                  to="/explore"
                  onClick={closeMenu}
                  className={navLinkClass(
                    location.pathname === "/explore"
                  )}
                >
                  Explore
                </Link>

                {/* ABOUT US */}
                <Link
                  to="/about"
                  onClick={closeMenu}
                  className={navLinkClass(
                    location.pathname === "/about"
                  )}
                >
                  About Us
                </Link>

                {/* CONTACT */}
                <Link
                  to="/contact"
                  onClick={closeMenu}
                  className={navLinkClass(
                    location.pathname === "/contact"
                  )}
                >
                  Contact
                </Link>

                {/* MOBILE AUTH */}
                {!user && (
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-stone-200 pt-4">
                    <Link
                      to="/login"
                      onClick={closeMenu}
                      className="rounded-lg border border-[#043658] px-4 py-3 text-center text-sm font-semibold text-[#043658]"
                    >
                      Login
                    </Link>

                    <Link
                      to="/register"
                      onClick={closeMenu}
                      className="rounded-lg bg-[#043658] px-4 py-3 text-center text-sm font-bold text-white"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </nav>
            )}

            {/* DASHBOARD USER MOBILE AREA */}
            {isDashboardUser && (
              <div className="space-y-3">
                <div className="rounded-xl bg-[#043658] p-4 text-white">
                  <p className="text-sm font-bold">
                    {user?.fullName ||
                      user?.name ||
                      "User"}
                  </p>

                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#FFC107]">
                    {role}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;

