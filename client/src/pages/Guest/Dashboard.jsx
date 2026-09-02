import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
  Smartphone,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function GuestDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
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

  // ✅ Payment States
  const [showPayment, setShowPayment] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('telebirr');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');

  useEffect(() => {
    // ✅ Check for pending booking from localStorage
    const pendingData = localStorage.getItem('pendingBooking');
    if (pendingData) {
      try {
        const data = JSON.parse(pendingData);
        setPendingBooking(data);
        setShowPayment(true);
      } catch (error) {
        console.error('Error parsing pending booking:', error);
        localStorage.removeItem('pendingBooking');
      }
    }
    
    // Check location state
    if (location.state?.showPayment && location.state?.bookingData) {
      setPendingBooking(location.state.bookingData);
      setShowPayment(true);
    }
    
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

  // ✅ Handle Payment Submission
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentError('');
    setPaymentSuccess('');
    setSubmitting(true);

    if (!pendingBooking) {
      setPaymentError('No booking found to complete.');
      setSubmitting(false);
      return;
    }

    if (!paymentMethod) {
      setPaymentError('Please select a payment method.');
      setSubmitting(false);
      return;
    }

    if (paymentMethod === 'telebirr' && !phone) {
      setPaymentError('Please enter your phone number for Telebirr.');
      setSubmitting(false);
      return;
    }

    try {
      const result = await ApiService.createBookingAndPay({
        guesthouseId: pendingBooking.guesthouseId || pendingBooking.guesthouse?.id,
        roomId: pendingBooking.roomId || pendingBooking.room?.id,
        checkInDate: pendingBooking.checkInDate,
        checkOutDate: pendingBooking.checkOutDate,
        nightsCount: pendingBooking.nights || 0,
        numberOfGuests: pendingBooking.numberOfGuests || 1,
        paymentMethod: paymentMethod,
        phone: phone,
        bankName: bankName,
        accountNumber: accountNumber,
      });

      console.log('✅ Booking created:', result);
      setPaymentSuccess('✅ Your booking has been confirmed!');
      
      localStorage.removeItem('pendingBooking');
      
      setTimeout(() => {
        setShowPayment(false);
        setPendingBooking(null);
        loadDashboardData();
        navigate('/reservations');
      }, 2000);

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error?.message || 'Failed to complete booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Cancel pending booking
  const handleCancelBooking = () => {
    localStorage.removeItem('pendingBooking');
    setShowPayment(false);
    setPendingBooking(null);
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
      <DashboardLayout>
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
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* =========================================================
            ✅ PAYMENT SECTION - ONLY SHOWS WHEN PENDING BOOKING EXISTS
            ========================================================= */}
        {showPayment && pendingBooking && (
          <div className="bg-white rounded-2xl border border-[#FFC107] shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-6 h-6 text-[#FFC107]" />
                <h2 className="text-xl font-black text-[#043658]">Complete Your Booking</h2>
              </div>
              <button
                onClick={handleCancelBooking}
                className="text-sm text-red-500 hover:text-red-600 font-semibold transition"
              >
                Cancel
              </button>
            </div>
            
            <p className="text-[#647b8a] mb-4">
              Please complete your payment to confirm the reservation.
            </p>

            {/* Booking Summary */}
            <div className="p-4 bg-[#f5f8fa] rounded-xl border border-[#e5edf2] mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-[#647b8a]">Guesthouse</p>
                  <p className="font-bold text-[#043658] text-sm">
                    {pendingBooking.guesthouse?.name || 'Guesthouse'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#647b8a]">Room</p>
                  <p className="font-bold text-[#043658] text-sm">
                    Room {pendingBooking.room?.roomNumber || pendingBooking.roomId}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#647b8a]">Dates</p>
                  <p className="font-bold text-[#043658] text-sm">
                    {pendingBooking.checkInDate} → {pendingBooking.checkOutDate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#647b8a]">Guests</p>
                  <p className="font-bold text-[#043658] text-sm">
                    {pendingBooking.numberOfGuests || 1} guest
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#e5edf2] flex justify-between">
                <span className="text-[#647b8a]">Total Amount</span>
                <span className="text-xl font-black text-[#FFC107]">
                  {pendingBooking.totalPrice?.toLocaleString() || 0} ETB
                </span>
              </div>
            </div>

            {paymentError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {paymentError}
              </div>
            )}

            {paymentSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {paymentSuccess}
              </div>
            )}

            {/* Payment Methods */}
            <div className="space-y-3">
              <p className="text-sm font-bold text-[#043658]">Select Payment Method</p>
              
              {/* Telebirr */}
              <div
                className={`border rounded-xl p-4 cursor-pointer transition ${
                  paymentMethod === 'telebirr'
                    ? 'border-[#FFC107] bg-[#FFC107]/5 ring-2 ring-[#FFC107]/20'
                    : 'border-[#e5edf2] hover:border-[#FFC107]'
                }`}
                onClick={() => setPaymentMethod('telebirr')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-[#043658]">Telebirr</p>
                    <p className="text-xs text-[#647b8a]">Pay using your Telebirr mobile account</p>
                  </div>
                  <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'telebirr' ? 'border-[#FFC107] bg-[#FFC107]' : 'border-[#e5edf2]'
                  }`}>
                    {paymentMethod === 'telebirr' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
              </div>

              {/* Chapa */}
              <div
                className={`border rounded-xl p-4 cursor-pointer transition ${
                  paymentMethod === 'chapa'
                    ? 'border-[#FFC107] bg-[#FFC107]/5 ring-2 ring-[#FFC107]/20'
                    : 'border-[#e5edf2] hover:border-[#FFC107]'
                }`}
                onClick={() => setPaymentMethod('chapa')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-[#043658]">Chapa</p>
                    <p className="text-xs text-[#647b8a]">Pay using Chapa payment gateway</p>
                  </div>
                  <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'chapa' ? 'border-[#FFC107] bg-[#FFC107]' : 'border-[#e5edf2]'
                  }`}>
                    {paymentMethod === 'chapa' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
              </div>

              {/* Bank Transfer */}
              <div
                className={`border rounded-xl p-4 cursor-pointer transition ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-[#FFC107] bg-[#FFC107]/5 ring-2 ring-[#FFC107]/20'
                    : 'border-[#e5edf2] hover:border-[#FFC107]'
                }`}
                onClick={() => setPaymentMethod('bank_transfer')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-[#043658]">Bank Transfer</p>
                    <p className="text-xs text-[#647b8a]">Transfer from any Ethiopian bank account</p>
                  </div>
                  <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'bank_transfer' ? 'border-[#FFC107] bg-[#FFC107]' : 'border-[#e5edf2]'
                  }`}>
                    {paymentMethod === 'bank_transfer' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            {paymentMethod === 'telebirr' && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <label className="block text-sm font-bold text-[#043658] mb-1.5">
                  Mobile Number for Confirmation
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 9000000000"
                  className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-[#FFC107] focus:border-[#FFC107] outline-none text-sm bg-white"
                />
                <p className="text-xs text-[#647b8a] mt-1">
                  Enter the phone number connected to your Telebirr account.
                </p>
              </div>
            )}

            {paymentMethod === 'bank_transfer' && (
              <div className="mt-4 space-y-3">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <label className="block text-sm font-bold text-[#043658] mb-1.5">
                    Bank Name
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-[#FFC107] focus:border-[#FFC107] outline-none text-sm bg-white"
                  >
                    <option value="">Select Bank</option>
                    <option value="CBE">Commercial Bank of Ethiopia (CBE)</option>
                    <option value="Awash">Awash Bank</option>
                    <option value="Dashen">Dashen Bank</option>
                    <option value="Hibret">Hibret Bank</option>
                    <option value="Oromia">Oromia Bank</option>
                    <option value="Wegagen">Wegagen Bank</option>
                    <option value="Zemen">Zemen Bank</option>
                    <option value="Abyssinia">Abyssinia Bank</option>
                  </select>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <label className="block text-sm font-bold text-[#043658] mb-1.5">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter your bank account number"
                    className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-[#FFC107] focus:border-[#FFC107] outline-none text-sm bg-white"
                  />
                </div>
              </div>
            )}

            <div className="mt-6">
              <button
                type="button"
                onClick={handlePaymentSubmit}
                disabled={submitting}
                className="w-full py-3.5 bg-[#FFC107] hover:bg-[#ffb300] text-[#043658] font-bold text-sm rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#043658] border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    Confirm & Pay {pendingBooking.totalPrice?.toLocaleString() || 0} ETB
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            WELCOME SECTION - ORIGINAL
            ========================================================= */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#043658]">
            Welcome back, {user?.name?.split(' ')[0] || 'Guest'}! 👋
          </h1>
          <p className="text-[#647b8a] mt-1">
            Here's an overview of your stays and bookings
          </p>
        </div>

        {/* =========================================================
            STATS CARDS - ORIGINAL
            ========================================================= */}
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

        {/* =========================================================
            UPCOMING STAYS - ORIGINAL
            ========================================================= */}
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

        {/* =========================================================
            RECENT GUESTHOUSES - ORIGINAL
            ========================================================= */}
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

        {/* =========================================================
            RECENT BOOKINGS HISTORY - ORIGINAL
            ========================================================= */}
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
      </div>
    </DashboardLayout>
  );
}