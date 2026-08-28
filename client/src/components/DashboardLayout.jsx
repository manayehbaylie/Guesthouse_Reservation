import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ApiService } from '../services/api.js';
import {
  LayoutDashboard,
  Calendar,
  Search,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  Building2,
  ChevronDown,
  MessageSquare,
} from 'lucide-react';

export function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [upcomingBooking, setUpcomingBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentPath = location.pathname;

  useEffect(() => {
    loadUpcomingBooking();
  }, [user?.id]);

  const loadUpcomingBooking = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        setUpcomingBooking(null);
        setLoading(false);
        return;
      }

      const reservations = await ApiService.getReservations({ guestId: user.id });
      
      if (!reservations || reservations.length === 0) {
        setUpcomingBooking(null);
        setLoading(false);
        return;
      }
      
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const upcoming = reservations.filter((booking) => {
        const checkIn = new Date(booking.checkInDate);
        checkIn.setHours(0, 0, 0, 0);
        return checkIn >= now && 
               booking.status !== 'checked_out' && 
               booking.status !== 'cancelled';
      });
      
      if (upcoming.length > 0) {
        upcoming.sort((a, b) => new Date(a.checkInDate) - new Date(b.checkInDate));
        setUpcomingBooking(upcoming[0]);
      } else {
        setUpcomingBooking(null);
      }
    } catch (error) {
      console.error('Failed to load upcoming booking:', error);
      setUpcomingBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileDropdownOpen(false);
  };

  const navItems = [
    { 
      path: '/guest/dashboard', 
      icon: <LayoutDashboard className="w-5 h-5" />, 
      label: 'Overview' 
    },
    { 
      path: '/reservations', 
      icon: <Calendar className="w-5 h-5" />, 
      label: 'My Bookings' 
    },
    { 
      path: '/guest/search', 
      icon: <Search className="w-5 h-5" />, 
      label: 'Find Guesthouses' 
    },
    { 
      path: '/guest/reviews', 
      icon: <MessageSquare className="w-5 h-5" />, 
      label: 'Reviews' 
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f8fa] flex">
      {/* ============================================================
          SIDEBAR
      ============================================================ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#043658] border-r border-white/10 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:flex lg:flex-col lg:h-screen lg:sticky top-0`}
      >
        {/* Sidebar Header */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <Link to="/guest/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#ffc107] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#043658]" />
              </div>
              <div>
                <span className="text-lg font-black text-white">Guesthouse</span>
                <span className="text-lg font-black text-[#ffc107]"> Platform</span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* ============================================================
            CURRENT STAY - Shows guesthouse name when booking exists
        ============================================================ */}
        {!loading && upcomingBooking && (
          <div className="mx-3 mt-2 px-4 py-3 bg-[#ffc107]/10 border border-[#ffc107]/20 rounded-xl">
            <p className="text-[10px] text-[#ffc107] font-bold uppercase tracking-wider">
              Current Stay
            </p>
            <p className="text-sm font-bold text-white mt-0.5 truncate">
              {upcomingBooking.guesthouseName}
            </p>
            <p className="text-[10px] text-white/50 mt-0.5">
              {upcomingBooking.checkInDate} → {upcomingBooking.checkOutDate}
            </p>
          </div>
        )}

        {/* User Profile Summary */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#ffc107]/20 flex items-center justify-center">
              <User className="w-6 h-6 text-[#ffc107]" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white">{user?.name || 'Guest'}</p>
              <p className="text-sm text-white/60">Guest</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="text-white/60">{user?.email}</span>
            <span className="text-white/20">|</span>
            <span className="text-white/60">{user?.phone}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                currentPath === item.path
                  ? 'bg-[#ffc107]/15 text-[#ffc107] font-bold'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className={currentPath === item.path ? 'text-[#ffc107]' : 'text-white/40'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-white/60 hover:bg-red-500/15 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ============================================================
          MAIN CONTENT
      ============================================================ */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-[#e5edf2] sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-[#f5f8fa]"
            >
              <Menu className="w-5 h-5 text-[#647b8a]" />
            </button>

            <div className="hidden md:block"></div>

            <div className="flex items-center gap-4 ml-auto">
              {/* Notification */}
              <button className="relative p-2 rounded-lg hover:bg-[#f5f8fa] transition">
                <Bell className="w-5 h-5 text-[#647b8a]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#f5f8fa] transition"
                >
                  <div className="w-8 h-8 rounded-full bg-[#ffc107]/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-[#ffc107]" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-bold text-[#043658]">{user?.name || 'Guest'}</p>
                    <span className="text-xs text-[#647b8a]">Guest</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#647b8a] transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#e5edf2] shadow-lg py-2 z-50">
                    <div className="px-4 py-3 border-b border-[#e5edf2]">
                      <p className="font-bold text-[#043658]">{user?.name || 'Guest'}</p>
                      <p className="text-sm text-[#647b8a]">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-[#ffc107]/20 text-[#ffc107] text-xs font-bold rounded-full">
                        Guest
                      </span>
                    </div>

                    <Link
                      to="/guest/dashboard"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#647b8a] hover:bg-[#f5f8fa] transition"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#647b8a] hover:bg-[#f5f8fa] transition"
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>

                    <Link
                      to="/reservations"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#647b8a] hover:bg-[#f5f8fa] transition"
                    >
                      <Calendar className="w-4 h-4" />
                      My Bookings
                    </Link>

                    <div className="border-t border-[#e5edf2] mt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>

        {/* Footer */}
        <footer className="px-4 sm:px-6 lg:px-8 pb-6">
          <div className="pt-6 border-t border-[#e5edf2] text-center">
            <p className="text-sm text-[#94a8b5]">
              © 2026 Guesthouse Platform. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}