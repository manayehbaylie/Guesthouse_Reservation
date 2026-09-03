// src/components/DashboardLayout.jsx

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ApiService } from '../services/api.js';
import { NotificationBell } from './common/NotificationBell.jsx';
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
  MapPin,
  Settings,
} from 'lucide-react';

export function DashboardLayout({ children, showHeader = true }) {
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

  // Load the most recent booking for the sidebar
  const loadUpcomingBooking = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        console.log('❌ No user ID found');
        setUpcomingBooking(null);
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching reservations for user:', user.id);
      
      const reservations = await ApiService.getReservations({ guestId: user.id });
      console.log('📋 All reservations from API:', reservations);
      
      if (!reservations || reservations.length === 0) {
        console.log('ℹ️ No reservations found');
        setUpcomingBooking(null);
        setLoading(false);
        return;
      }
      
      // Sort by createdAt (newest first)
      const sortedByDate = [...reservations].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      // Get the most recent booking
      let booking = sortedByDate[0];
      
      // Skip cancelled bookings
      if (booking && booking.status === 'cancelled') {
        booking = sortedByDate.find(b => b.status !== 'cancelled');
      }
      
      if (booking) {
        console.log('✅ Selected booking (most recent):', booking);
        console.log('📌 Guesthouse ID from booking:', booking.guesthouseId);
        
        if (booking.guesthouseId) {
          try {
            console.log('🔍 Fetching guesthouse details for ID:', booking.guesthouseId);
            const guesthouse = await ApiService.getGuesthouseById(booking.guesthouseId);
            console.log('🏠 Guesthouse details from API:', guesthouse);
            
            if (guesthouse) {
              const updatedBooking = {
                ...booking,
                guesthouseName: guesthouse.name || 'Guesthouse',
                guesthouseLocation: guesthouse.city || guesthouse.location || 'Ethiopia',
                guesthouseCity: guesthouse.city,
                guesthouseImage: guesthouse.image,
              };
              console.log('✅ Updated booking with guesthouse name:', updatedBooking.guesthouseName);
              setUpcomingBooking(updatedBooking);
            } else {
              setUpcomingBooking({
                ...booking,
                guesthouseName: 'Guesthouse',
                guesthouseLocation: 'Ethiopia',
              });
            }
          } catch (error) {
            console.error('❌ Failed to fetch guesthouse details:', error);
            setUpcomingBooking({
              ...booking,
              guesthouseName: 'Guesthouse',
              guesthouseLocation: 'Ethiopia',
            });
          }
        } else {
          setUpcomingBooking({
            ...booking,
            guesthouseName: 'Guesthouse',
            guesthouseLocation: 'Ethiopia',
          });
        }
      } else {
        console.log('ℹ️ No bookings found');
        setUpcomingBooking(null);
      }
    } catch (error) {
      console.error('❌ Failed to load upcoming booking:', error);
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

  // ============================================================
  // NAVIGATION ITEMS - REMOVED "Profile" from sidebar navigation
  // ============================================================
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
      {/* =========================================================
          SIDEBAR
      ========================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#043658] border-r border-white/10 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:flex lg:flex-col lg:h-screen lg:sticky top-0`}
      >
        {/* =========================================================
            1. HEADER - LOGO (FIRST)
        ========================================================= */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <Link to="/guest/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FFC107] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#043658]" />
              </div>
              <div>
                <span className="text-lg font-black text-white">Guesthouse</span>
                <span className="text-lg font-black text-[#FFC107]"> Platform</span>
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

        {/* =========================================================
            2. CURRENT STAY (SECOND)
        ========================================================= */}
        <div className="mx-3 mt-4 px-4 py-3 bg-[#FFC107]/10 border border-[#FFC107]/20 rounded-xl">
          <p className="text-[10px] text-[#FFC107] font-bold uppercase tracking-wider">
            Current Stay
          </p>
          
          {!loading && upcomingBooking ? (
            <>
              <p className="text-sm font-bold text-white mt-0.5 truncate flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#FFC107] shrink-0" />
                {upcomingBooking.guesthouseName || 'Guesthouse'}
              </p>
              {upcomingBooking.guesthouseLocation && (
                <div className="flex items-center gap-1 mt-0.5 text-[10px] text-white/50">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{upcomingBooking.guesthouseLocation}</span>
                </div>
              )}
              <p className="text-[10px] text-white/40 mt-0.5">
                {upcomingBooking.checkInDate} → {upcomingBooking.checkOutDate}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-white/30 mt-0.5 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-white/20" />
                No Active Stay
              </p>
              <p className="text-[10px] text-white/20 mt-0.5">
                Book a guesthouse to get started
              </p>
            </>
          )}
        </div>

        {/* =========================================================
            3. USER PROFILE (THIRD) - EMAIL AND PHONE REMOVED
        ========================================================= */}
        <div className="px-6 py-4 mx-3 mt-3 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#FFC107]/20 flex items-center justify-center">
              <User className="w-6 h-6 text-[#FFC107]" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white truncate">{user?.name || 'Guest'}</p>
              <p className="text-sm text-white/60">Guest</p>
            </div>
          </div>
          {/* ✅ EMAIL AND PHONE REMOVED */}
        </div>

        {/* =========================================================
            NAVIGATION MENU
        ========================================================= */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto mt-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                currentPath === item.path
                  ? 'bg-[#FFC107]/15 text-[#FFC107] font-bold'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className={currentPath === item.path ? 'text-[#FFC107]' : 'text-white/40'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* =========================================================
            LOGOUT
        ========================================================= */}
        {showHeader && (
        <div className="px-4 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-white/60 hover:bg-red-500/15 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Logout</span>
          </button>
        </div>
        )}
      </aside>

      {/* =========================================================
          MOBILE OVERLAY
      ========================================================= */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}
      <main className="flex-1 min-w-0">
        {/* TOP HEADER BAR */}
        {showHeader && (
        <header className="bg-white border-b border-[#e5edf2] sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            {/* Mobile Menu Button */}
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-[#f5f8fa]">
              <Menu className="w-5 h-5 text-[#647b8a]" />
            </button>

            {/* Page Title */}
            <div className="hidden md:block">
              <h1 className="text-lg font-black text-[#043658]">
                {currentPath === '/guest/dashboard' && 'Dashboard'}
                {currentPath === '/reservations' && 'My Bookings'}
                {currentPath === '/guest/search' && 'Find Guesthouses'}
                {currentPath === '/guest/reviews' && 'Reviews'}
                {currentPath === '/profile' && 'Profile'}
              </h1>
            </div>

            <div className="flex items-center gap-4 ml-auto">
              {/* NOTIFICATION BELL */}
              <NotificationBell />

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#f5f8fa] transition"
                >
                  <div className="w-8 h-8 rounded-full bg-[#FFC107]/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-[#FFC107]" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-bold text-[#043658] truncate max-w-[100px]">
                      {user?.name || 'Guest'}
                    </p>
                    <span className="text-xs text-[#647b8a]">Guest</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#647b8a] transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#e5edf2] shadow-lg py-2 z-50">
                    <div className="px-4 py-3 border-b border-[#e5edf2]">
                      <p className="font-bold text-[#043658] truncate">{user?.name || 'Guest'}</p>
                      <p className="text-sm text-[#647b8a] truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-[#FFC107]/20 text-[#FFC107] text-xs font-bold rounded-full">
                        Guest
                      </span>
                    </div>

                    <Link to="/guest/dashboard" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#647b8a] hover:bg-[#f5f8fa] transition">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>

                    <Link to="/profile" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#647b8a] hover:bg-[#f5f8fa] transition">
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>

                    <Link to="/reservations" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#647b8a] hover:bg-[#f5f8fa] transition">
                      <Calendar className="w-4 h-4" />
                      My Bookings
                    </Link>

                    <div className="border-t border-[#e5edf2] mt-1">
                      <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
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
        )}

        {/* PAGE CONTENT */}
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>

        {/* FOOTER */}
        <footer className="px-4 sm:px-6 lg:px-8 pb-6">
          <div className="pt-6 border-t border-[#e5edf2] text-center">
            <p className="text-sm text-[#647b8a]">
              © 2026 Guesthouse Platform. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default DashboardLayout;