import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Home,
  Search,
  Calendar,
  User,
  LogOut,
  Menu,
  X,
  Building2,
  Bell,
  ChevronDown,
} from 'lucide-react';

export function Navbar({ onToggleSidebar }) {
  const { user, logout, isAuthenticated, isGuest, isOwner, isAdmin, isReceptionist } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileDropdownOpen(false);
  };

  const getDisplayName = () => {
    if (!user) return 'Guest';
    return user.name || user.fullName || user.email || 'User';
  };

  const getRoleBadgeColor = () => {
    if (isAdmin()) return 'bg-red-100 text-red-700';
    if (isOwner()) return 'bg-blue-100 text-blue-700';
    if (isReceptionist()) return 'bg-purple-100 text-purple-700';
    if (isGuest()) return 'bg-green-100 text-green-700';
    return 'bg-stone-100 text-stone-700';
  };

  const getRoleDisplay = () => {
    if (isAdmin()) return 'Admin';
    if (isOwner()) return 'Owner';
    if (isReceptionist()) return 'Receptionist';
    if (isGuest()) return 'Guest';
    return 'User';
  };

  const navLinks = [
    { path: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { path: '/search', label: 'Explore', icon: <Search className="w-4 h-4" /> },
    { path: '/reservations', label: 'My Bookings', icon: <Calendar className="w-4 h-4" /> },
    { path: '/about', label: 'About Us', icon: null },
    { path: '/contact', label: 'Contact', icon: null },
  ];

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-stone-950" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-black text-stone-900">Guesthouse</span>
                <span className="text-xl font-black text-stone-900"> Platform</span>
              </div>
              <div className="sm:hidden">
                <span className="text-lg font-black text-stone-900">GP</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors flex items-center gap-1.5"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}

            {/* ✅ Dashboard Link for Guests */}
            {isAuthenticated() && isGuest() && (
              <Link
                to="/guest/dashboard"
                className="text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Right Side - User Menu */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-stone-100 transition-colors">
              <Bell className="w-5 h-5 text-stone-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {isAuthenticated() ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-bold text-stone-900">{getDisplayName()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor()}`}>
                      {getRoleDisplay()}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-stone-400 hidden lg:block" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-stone-200 shadow-lg py-2 z-50">
                    <div className="px-4 py-3 border-b border-stone-100">
                      <p className="font-bold text-stone-900">{getDisplayName()}</p>
                      <p className="text-sm text-stone-500">{user?.email}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor()} mt-1 inline-block`}>
                        {getRoleDisplay()}
                      </span>
                    </div>

                    {/* ✅ Dashboard link in dropdown */}
                    {isGuest() && (
                      <Link
                        to="/guest/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                      >
                        <Home className="w-4 h-4" />
                        Dashboard
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>

                    <Link
                      to="/reservations"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      My Bookings
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-stone-100 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-bold text-stone-700 hover:text-stone-900 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm rounded-xl transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-stone-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-stone-600" /> : <Menu className="w-6 h-6 text-stone-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-stone-200 py-4 px-4">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-50 transition-colors"
              >
                {link.icon}
                <span className="font-semibold text-stone-700">{link.label}</span>
              </Link>
            ))}

            {/* ✅ Dashboard link in mobile menu */}
            {isAuthenticated() && isGuest() && (
              <Link
                to="/guest/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-50 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="font-semibold text-amber-600">Dashboard</span>
              </Link>
            )}

            {isAuthenticated() && (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors text-red-600"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-semibold">Logout</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;