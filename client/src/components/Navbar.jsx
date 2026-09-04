
import React, { useEffect, useState } from 'react';
import {
  Link,
  useNavigate,
  useLocation,
} from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import { NotificationBell } from './common/NotificationBell.jsx';
import { ApiService } from '../services/api.js';

import {
  Home,
  Search,
  User,
  LogOut,
  Menu,
  X,
  Building2,
  ChevronDown,
  Settings,
  Save,
  XCircle,
  Loader2,
} from 'lucide-react';

/* ============================================================
   NAVBAR
============================================================ */

export function Navbar({ onToggleSidebar }) {
  const {
    user,
    logout,
    isAuthenticated,
    isGuest,
    isOwner,
    isAdmin,
    isReceptionist,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  /* ==========================================================
     STATE
  ========================================================== */

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  /* ==========================================================
     UPDATE PROFILE STATE
  ========================================================== */

  const [showProfileModal, setShowProfileModal] = useState(false);

  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profilePassword, setProfilePassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  /* ==========================================================
     RECEPTIONIST DASHBOARD CHECK
  ========================================================== */

  const isReceptionistDashboard =
    location.pathname === '/receptionist' ||
    location.pathname === '/receptionist-dashboard' ||
    location.pathname === '/dashboard/receptionist';

  /* ==========================================================
     DISPLAY NAME
  ========================================================== */

  const getDisplayName = () => {
    if (!user) return 'Guest';

    return (
      user.name ||
      user.fullName ||
      user.email ||
      'User'
    );
  };

  /* ==========================================================
     ROLE BADGE COLOR
  ========================================================== */

  const getRoleBadgeColor = () => {
    if (isAdmin()) {
      return 'bg-red-100 text-red-700 border border-red-200';
    }

    if (isOwner()) {
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    }

    if (isReceptionist()) {
      return 'bg-purple-100 text-purple-700 border border-purple-200';
    }

    if (isGuest()) {
      return 'bg-green-100 text-green-700 border border-green-200';
    }

    return 'bg-stone-100 text-stone-700 border border-stone-200';
  };

  /* ==========================================================
     ROLE DISPLAY
  ========================================================== */

  const getRoleDisplay = () => {
    if (isAdmin()) return 'ADMIN';
    if (isOwner()) return 'OWNER';
    if (isReceptionist()) return 'RECEPTIONIST';
    if (isGuest()) return 'GUEST';

    return 'USER';
  };

  /* ============================================================
     NAV LINKS - CONDITIONAL
  ============================================================ */

  const getNavLinks = () => {
    // After login - show nothing here.
    // Dashboard is shown separately for guests.
    if (isAuthenticated()) {
      return [];
    }

    // Before login - show public links.
    return [
      { path: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
      { path: '/search', label: 'Explore', icon: <Search className="w-4 h-4" /> },
      { path: '/about', label: 'About Us', icon: null },
      { path: '/contact', label: 'Contact', icon: null },
    ];
  };

  const navLinks = getNavLinks();

  /* ==========================================================
     OPEN UPDATE PROFILE
  ========================================================== */

  const openUpdateProfile = () => {
    setProfileName(
      user?.name ||
      user?.fullName ||
      ''
    );

    setProfileEmail(
      user?.email ||
      ''
    );

    setProfilePhone(
      user?.phone ||
      ''
    );

    setProfilePassword('');

    setProfileMessage('');
    setProfileError('');

    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);

    setShowProfileModal(true);
  };

  /* ==========================================================
     CLOSE UPDATE PROFILE
  ========================================================== */

  const closeUpdateProfile = () => {
    if (savingProfile) return;

    setShowProfileModal(false);
    setProfilePassword('');
    setProfileMessage('');
    setProfileError('');
  };

  /* ==========================================================
     SAVE PROFILE
  ========================================================== */

  const handleSaveProfile = async () => {
    setProfileMessage('');
    setProfileError('');

    if (!profileName.trim()) {
      setProfileError('Full name is required.');
      return;
    }

    if (!profileEmail.trim()) {
      setProfileError('Email is required.');
      return;
    }

    if (!profilePhone.trim()) {
      setProfileError('Phone number is required.');
      return;
    }

    try {
      setSavingProfile(true);

      const updatedUser =
        await ApiService.updateProfile({
          name: profileName.trim(),
          email: profileEmail.trim(),
          phone: profilePhone.trim(),
          password: profilePassword,
        });

      if (updatedUser) {
        setProfileMessage(
          'Profile updated successfully.'
        );

        setProfilePassword('');

        setTimeout(() => {
          setShowProfileModal(false);
          setProfileMessage('');

          window.location.reload();
        }, 800);
      }
    } catch (error) {
      console.error(
        'Profile update failed:',
        error
      );

      setProfileError(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update profile.'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  /* ==========================================================
     LOGOUT
  ========================================================== */

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    setShowProfileModal(false);

    logout();

    navigate('/');
  };

  /* ==========================================================
     CLOSE DROPDOWN WHEN USER CHANGES
  ========================================================== */

  useEffect(() => {
    setProfileDropdownOpen(false);
  }, [user?.id]);

  /* ==========================================================
     CLOSE MOBILE MENU ON ROUTE CHANGE
  ========================================================== */

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  /* ==========================================================
     RECEPTIONIST DASHBOARD NAVBAR
  ========================================================== */

  if (isReceptionistDashboard) {
    return (
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end h-16">

            {isAuthenticated() ? (
              <div className="relative">

                <button
                  type="button"
                  onClick={() =>
                    setProfileDropdownOpen(!profileDropdownOpen)
                  }
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-stone-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-amber-600" />
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-bold text-stone-900">
                      {getDisplayName()}
                    </p>

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor()}`}
                    >
                      {getRoleDisplay()}
                    </span>
                  </div>

                  <ChevronDown className="w-4 h-4 text-stone-400" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-stone-200 shadow-lg py-2 z-50">

                    <div className="px-4 py-3 border-b border-stone-100">
                      <p className="font-bold text-stone-900">
                        {getDisplayName()}
                      </p>

                      <p className="text-sm text-stone-500">
                        {user?.email}
                      </p>

                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor()} mt-1 inline-block`}
                      >
                        {getRoleDisplay()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={openUpdateProfile}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Update Profile
                    </button>

                    <button
                      type="button"
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

          </div>
        </div>
      </nav>
    );
  }

  /* ============================================================
     FULL NAVBAR FOR OTHER PAGES
  ============================================================ */

  return (
    <>
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between h-16">

            {/* ==================================================
                LOGO
            ================================================== */}

            <div className="flex items-center gap-2">

              <Link
                to="/"
                className="flex items-center gap-2"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm">
                  <Building2 className="w-5 h-5 text-stone-950" />
                </div>

                <div className="hidden sm:block">
                  <span className="text-xl font-black text-stone-900">
                    Guesthouse
                  </span>

                  <span className="text-xl font-black text-stone-900">
                    {' '}Platform
                  </span>
                </div>

                <div className="sm:hidden">
                  <span className="text-lg font-black text-stone-900">
                    GP
                  </span>
                </div>
              </Link>

            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {!isAuthenticated() && (
                <>
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
                </>
              )}

              {/* Dashboard Link - Only show when authenticated as Guest */}
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
              {isAuthenticated() && <NotificationBell variant="navbar" />}

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

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-stone-200 shadow-lg py-2 z-50">
                      <div className="px-4 py-3 border-b border-stone-100">
                        <p className="font-bold text-stone-900">{getDisplayName()}</p>
                        <p className="text-sm text-stone-500">{user?.email}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor()} mt-1 inline-block`}>
                          {getRoleDisplay()}
                        </span>

                      </div>

                      <button onClick={openUpdateProfile} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors">
                        <Settings className="w-4 h-4" /> Update Profile
                      </button>

                      <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-stone-100 mt-1">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="px-4 py-2 text-sm font-bold text-stone-700 hover:text-stone-900 transition-colors">Login</Link>
                  <Link to="/register" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm rounded-xl transition-colors">Register</Link>
                </div>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-stone-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-stone-600" /> : <Menu className="w-6 h-6 text-stone-600" />}
              </button>
            </div>

          </div>

          {/* ======================================================
              MOBILE MENU
          ====================================================== */}

          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-stone-200 py-4 px-4">
              <div className="flex flex-col gap-2">
                {!isAuthenticated() && (
                  <>
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
                  </>
                )}

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
                    type="button"
                    onClick={openUpdateProfile}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-50 transition-colors text-stone-700"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="font-semibold">Update Profile</span>
                  </button>
                )}

                {isAuthenticated() && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-semibold">Logout</span>
                  </button>
                )}

              </div>
            </div>
          )}

        </div>

      </nav>

      {/* ========================================================
          UPDATE PROFILE MODAL
      ======================================================== */}

      {showProfileModal && (
        <ProfileModal
          profileName={profileName}
          profileEmail={profileEmail}
          profilePhone={profilePhone}
          profilePassword={profilePassword}
          savingProfile={savingProfile}
          profileMessage={profileMessage}
          profileError={profileError}
          setProfileName={setProfileName}
          setProfileEmail={setProfileEmail}
          setProfilePhone={setProfilePhone}
          setProfilePassword={setProfilePassword}
          handleSaveProfile={handleSaveProfile}
          closeUpdateProfile={closeUpdateProfile}
        />
      )}

    </>
  );
}

/* ==============================================================
   PROFILE MODAL
============================================================== */

function ProfileModal({
  profileName,
  profileEmail,
  profilePhone,
  profilePassword,
  savingProfile,
  profileMessage,
  profileError,
  setProfileName,
  setProfileEmail,
  setProfilePhone,
  setProfilePassword,
  handleSaveProfile,
  closeUpdateProfile,
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto p-4 sm:items-center">

      {/* Overlay */}

      <button
        type="button"
        aria-label="Close profile modal"
        onClick={closeUpdateProfile}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
      />

      {/* Modal */}

      <div className="relative my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="px-6 sm:px-8 py-6 border-b border-stone-200 bg-white">

          <div className="flex items-start justify-between gap-4">

            <div>

              <div className="flex items-center gap-3 mb-2">

                <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>

                <div>

                  <h2 className="text-xl sm:text-2xl font-black text-stone-900">
                    Update Profile
                  </h2>

                  <p className="text-sm text-stone-500">
                    Update your account information
                  </p>

                </div>

              </div>

            </div>

            <button
              type="button"
              onClick={closeUpdateProfile}
              disabled={savingProfile}
              className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <XCircle className="w-5 h-5 text-stone-600" />
            </button>

          </div>

        </div>

        {/* ======================================================
            BODY
        ====================================================== */}

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">

          <div className="space-y-5">

            {/* Success */}

            {profileMessage && (
              <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
                {profileMessage}
              </div>
            )}

            {/* Error */}

            {profileError && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
                {profileError}
              </div>
            )}

            {/* Full Name */}

            <div>

              <label
                htmlFor="profile-name"
                className="block text-sm font-black text-stone-700 mb-2"
              >
                Full Name
              </label>

              <input
                id="profile-name"
                type="text"
                value={profileName}
                onChange={(e) =>
                  setProfileName(e.target.value)
                }
                placeholder="Enter your full name"
                autoComplete="name"
                className="w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-white text-stone-900 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              />

            </div>

            {/* Email */}

            <div>

              <label
                htmlFor="profile-email"
                className="block text-sm font-black text-stone-700 mb-2"
              >
                Email
              </label>

              <input
                id="profile-email"
                type="email"
                value={profileEmail}
                onChange={(e) =>
                  setProfileEmail(e.target.value)
                }
                placeholder="Enter your email"
                autoComplete="email"
                className="w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-white text-stone-900 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              />

            </div>

            {/* Phone */}

            <div>

              <label
                htmlFor="profile-phone"
                className="block text-sm font-black text-stone-700 mb-2"
              >
                Phone
              </label>

              <input
                id="profile-phone"
                type="tel"
                value={profilePhone}
                onChange={(e) =>
                  setProfilePhone(e.target.value)
                }
                placeholder="+251 9..."
                autoComplete="tel"
                className="w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-white text-stone-900 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              />

            </div>

            {/* Password */}

            <div>

              <label
                htmlFor="profile-password"
                className="block text-sm font-black text-stone-700 mb-2"
              >
                New Password
              </label>

              <input
                id="profile-password"
                type="password"
                value={profilePassword}
                onChange={(e) =>
                  setProfilePassword(e.target.value)
                }
                placeholder="Leave blank to keep current password"
                autoComplete="new-password"
                className="w-full px-4 py-3.5 rounded-xl border border-stone-200 bg-white text-stone-900 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              />

              <p className="text-xs text-stone-400 mt-2">
                Leave blank if you do not want to change
                your password.
              </p>

            </div>

          </div>

        </div>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <div className="shrink-0 border-t border-stone-200 bg-stone-50 px-6 py-5 sm:px-8">

          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={closeUpdateProfile}
              disabled={savingProfile}
              className="px-5 py-3 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold text-sm hover:bg-stone-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-60"
            >

              {savingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Navbar;

