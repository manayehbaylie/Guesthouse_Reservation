import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ApiService } from '../../services/api.js';
import { DashboardLayout } from '../../components/DashboardLayout.jsx';
import {
  Calendar,
  ChevronRight,
  MapPin,
  Bed,
  Clock,
  Wallet,
  Star,
  Building2,
  CheckCircle,
  Clock as ClockIcon,
  XCircle,
  Eye,
} from 'lucide-react';

export default function GuestDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [recentGuesthouses, setRecentGuesthouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingStays: 0,
    totalSpent: 0,
    totalNights: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const reservations = await ApiService.getReservations({ guestId: user?.id });
      setBookings(reservations);

      const now = new Date();
      const upcoming = reservations.filter(
        (booking) => new Date(booking.checkInDate) >= now
      );
      setUpcomingBookings(upcoming);

      const totalSpent = reservations.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const totalNights = reservations.reduce((sum, b) => sum + (b.nightsCount || 0), 0);

      setStats({
        totalBookings: reservations.length,
        upcomingStays: upcoming.length,
        totalSpent,
        totalNights,
      });

      const guesthouses = await ApiService.getGuesthouses({ limit: 6 });
      setRecentGuesthouses(guesthouses.slice(0, 4));

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      confirmed: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
      pending: 'bg-amber-500/10 text-amber-600 border-amber-200',
      checked_in: 'bg-blue-500/10 text-blue-600 border-blue-200',
      checked_out: 'bg-stone-500/10 text-stone-600 border-stone-200',
      cancelled: 'bg-red-500/10 text-red-600 border-red-200',
    };
    return statusMap[status?.toLowerCase()] || 'bg-stone-500/10 text-stone-600 border-stone-200';
  };

  const getStatusIcon = (status) => {
    const statusMap = {
      confirmed: <CheckCircle className="w-4 h-4" />,
      pending: <ClockIcon className="w-4 h-4" />,
      checked_in: <Eye className="w-4 h-4" />,
      checked_out: <CheckCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
    };
    return statusMap[status?.toLowerCase()] || <ClockIcon className="w-4 h-4" />;
  };

  const getStatusText = (status) => {
    const statusMap = {
      confirmed: 'Confirmed',
      pending: 'Pending',
      checked_in: 'Checked In',
      checked_out: 'Completed',
      cancelled: 'Cancelled',
    };
    return statusMap[status?.toLowerCase()] || status || 'Unknown';
  };

  if (loading) {
    return (
      <DashboardLayout showHeader={false}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#e5edf2] border-t-[#FFC107] rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-[#647b8a]">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout showHeader={false}>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#043658]">
          Welcome back, {user?.name?.split(' ')[0] || 'Guest'}! 👋
        </h1>
        <p className="text-[#647b8a] mt-1">
          Here's an overview of your stays and bookings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-[#e5edf2]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#647b8a]">Total Bookings</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#043658]">{stats.totalBookings}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#e5edf2]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#647b8a]">Upcoming Stays</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#043658]">{stats.upcomingStays}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#e5edf2]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#647b8a]">Total Spent</span>
            <div className="w-10 h-10 rounded-xl bg-[#FFC107]/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#FFC107]" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#FFC107]">
            {stats.totalSpent.toLocaleString()} ETB
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#e5edf2]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#647b8a]">Nights Stayed</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Bed className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#043658]">{stats.totalNights}</p>
        </div>
      </div>

      {/* Upcoming Stays */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-[#043658]">Upcoming Stays</h2>
          {upcomingBookings.length > 0 && (
            <Link to="/reservations" className="text-sm font-semibold text-[#FFC107] hover:text-[#ffb300]">
              View All →
            </Link>
          )}
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e5edf2] p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#f5f8fa] flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-[#94a8b5]" />
            </div>
            <p className="text-[#647b8a] font-medium">No upcoming stays</p>
            <p className="text-sm text-[#94a8b5] mt-1">Book a guesthouse to start your journey</p>
            <Link
              to="/guest/search"
              className="mt-4 inline-block px-6 py-2.5 bg-[#FFC107] hover:bg-[#ffb300] text-[#043658] font-bold rounded-xl text-sm transition"
            >
              Start Exploring
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingBookings.slice(0, 4).map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-[#e5edf2] p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-[#043658]">{booking.guesthouseName}</h4>
                    <p className="text-sm text-[#647b8a] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {booking.guesthouseLocation || 'Ethiopia'}
                    </p>
                  </div>
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(booking.status)}`}>
                    {getStatusIcon(booking.status)}
                    {getStatusText(booking.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-[#647b8a]">Room</p>
                    <p className="font-semibold text-[#043658]">
                      {booking.roomNumber} ({booking.roomType})
                    </p>
                  </div>
                  <div>
                    <p className="text-[#647b8a]">Nights</p>
                    <p className="font-semibold text-[#043658]">{booking.nightsCount}</p>
                  </div>
                  <div>
                    <p className="text-[#647b8a]">Check-in</p>
                    <p className="font-semibold text-[#043658]">{booking.checkInDate}</p>
                  </div>
                  <div>
                    <p className="text-[#647b8a]">Check-out</p>
                    <p className="font-semibold text-[#043658]">{booking.checkOutDate}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#e5edf2] flex items-center justify-between">
                  <span className="text-lg font-black text-[#FFC107]">
                    {booking.totalPrice?.toLocaleString()} ETB
                  </span>
                  <Link
                    to={`/reservations/${booking.id}`}
                    className="text-sm font-semibold text-[#FFC107] hover:text-[#ffb300] flex items-center gap-1"
                  >
                    Details <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Guesthouses */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-[#043658]">Recent Guesthouses</h2>
          <Link to="/guest/search" className="text-sm font-semibold text-[#FFC107] hover:text-[#ffb300]">
            Explore More →
          </Link>
        </div>

        {recentGuesthouses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e5edf2] p-8 text-center">
            <Building2 className="w-12 h-12 text-[#94a8b5] mx-auto mb-3" />
            <p className="text-[#647b8a]">No guesthouses available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentGuesthouses.map((guesthouse) => (
              <Link
                key={guesthouse.id}
                to={`/guesthouse/${guesthouse.id}`}
                className="bg-white rounded-2xl border border-[#e5edf2] overflow-hidden hover:shadow-md transition group"
              >
                <div className="h-40 bg-[#e5edf2] relative">
                  <img
                    src={guesthouse.image || guesthouse.images?.[0] || guesthouse.photos?.[0] || ''}
                    alt={guesthouse.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[#FFC107] text-[#FFC107]" />
                    {guesthouse.rating?.toFixed(1) || 'New'}
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-[#043658] group-hover:text-[#FFC107] transition">
                    {guesthouse.name}
                  </h4>
                  <p className="text-sm text-[#647b8a] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {guesthouse.city || guesthouse.location || 'Ethiopia'}
                  </p>
                  <p className="mt-2 text-sm font-bold text-[#FFC107]">
                    From {guesthouse.priceRange?.min?.toLocaleString() || '0'} ETB/night
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Bookings History */}
      <div className="bg-white rounded-2xl border border-[#e5edf2] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5edf2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#FFC107]" />
            <h2 className="font-bold text-[#043658]">Recent Bookings History</h2>
          </div>
          <Link to="/reservations" className="text-sm font-semibold text-[#FFC107] hover:text-[#ffb300]">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f5f8fa]">
              <tr className="text-left">
                <th className="px-6 py-3 font-semibold text-[#647b8a]">Guesthouse</th>
                <th className="px-6 py-3 font-semibold text-[#647b8a]">Room</th>
                <th className="px-6 py-3 font-semibold text-[#647b8a]">Check-in</th>
                <th className="px-6 py-3 font-semibold text-[#647b8a]">Check-out</th>
                <th className="px-6 py-3 font-semibold text-[#647b8a]">Amount</th>
                <th className="px-6 py-3 font-semibold text-[#647b8a]">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 5).map((booking) => (
                <tr key={booking.id} className="border-t border-[#e5edf2] hover:bg-[#f5f8fa]">
                  <td className="px-6 py-3 font-medium text-[#043658]">{booking.guesthouseName}</td>
                  <td className="px-6 py-3 text-[#647b8a]">{booking.roomNumber}</td>
                  <td className="px-6 py-3 text-[#647b8a]">{booking.checkInDate}</td>
                  <td className="px-6 py-3 text-[#647b8a]">{booking.checkOutDate}</td>
                  <td className="px-6 py-3 font-semibold text-[#043658]">{booking.totalPrice?.toLocaleString()} ETB</td>
                  <td className="px-6 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-[#647b8a]">
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 pt-6 border-t border-[#e5edf2] text-center">
        <p className="text-sm text-[#94a8b5]">
          © 2026 Guesthouse Platform. All rights reserved.
        </p>
      </footer>
    </DashboardLayout>
  );
}