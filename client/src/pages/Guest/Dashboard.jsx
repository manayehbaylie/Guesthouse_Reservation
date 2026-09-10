import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
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
  ShieldCheck,
} from 'lucide-react';

export default function GuestDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const selectedGuesthouseId = searchParams.get('guesthouseId') || localStorage.getItem(`selectedGuesthouseId:${user?.id}`);
  
  const [bookings, setBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [selectedGuesthouse, setSelectedGuesthouse] = useState(null);
  const [myReviews, setMyReviews] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingStays: 0,
    totalSpent: 0,
    totalNights: 0,
  });

  // Payment States
  const [showPayment, setShowPayment] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');

  // ============================================================
  // CHECK FOR SHOW PAYMENT FROM LOGIN
  // ============================================================

  useEffect(() => {
    const bookingData = location.state?.bookingData;
    const hasValidBooking = Boolean(
      bookingData?.guesthouseId && bookingData?.roomId
    );

    // Payment is available only when room selection supplied booking data.
    if (location.state?.showPayment && hasValidBooking) {
      setShowPayment(true);
      setPendingBooking(bookingData);
    } else {
      setShowPayment(false);
      setPendingBooking(null);
    }
    
    loadDashboardData();
  }, [location.state, selectedGuesthouseId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const reservations = await ApiService.getReservations({ guestId: user?.id });
      const propertyBookings = selectedGuesthouseId
        ? reservations.filter((booking) => String(booking.guesthouseId) === String(selectedGuesthouseId))
        : reservations;
      setBookings(propertyBookings);

      if (selectedGuesthouseId) {
        const guesthouse = await ApiService.getGuesthouseById(Number(selectedGuesthouseId));
        setSelectedGuesthouse(guesthouse || null);
        localStorage.setItem(`selectedGuesthouseId:${user.id}`, String(selectedGuesthouseId));
      } else {
        setSelectedGuesthouse(null);
      }

      const payments = await ApiService.getPaymentHistory();
      setPaymentHistory(payments);

      const reviews = await ApiService.getMyReviews();
      setMyReviews(reviews);

      const now = new Date();
      const upcoming = propertyBookings.filter(
        (booking) => new Date(booking.checkInDate) >= now
      );
      setUpcomingBookings(upcoming);

      const totalSpent = propertyBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const totalNights = propertyBookings.reduce((sum, b) => sum + (b.nightsCount || 0), 0);

      setStats({
        totalBookings: reservations.length,
        upcomingStays: upcoming.length,
        totalSpent,
        totalNights,
      });


    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Payment Submission
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

    if (paymentMethod === 'bank_transfer') {
      if (!bankName) {
        setPaymentError('Please select your bank.');
        setSubmitting(false);
        return;
      }

      if (!/^\d{6,20}$/.test(accountNumber.trim())) {
        setPaymentError(
          accountNumber.trim()
            ? 'Account number must contain 6 to 20 digits.'
            : 'Please enter your bank account number.'
        );
        setSubmitting(false);
        return;
      }
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

      if (result?.checkoutUrl) {
        sessionStorage.removeItem('pendingReservation');
        window.location.href = result.checkoutUrl;
        return;
      }

      setPaymentSuccess('Payment checkout is ready. Please complete payment to confirm your booking.');
      sessionStorage.removeItem('pendingReservation');
      
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

  // Cancel pending booking
  const handleCancelBooking = () => {
    sessionStorage.removeItem('pendingReservation');
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
            <div className="w-12 h-12 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-base text-stone-500">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* =========================================================
            PAYMENT SECTION - SHOWS WHEN PENDING BOOKING EXISTS
            ========================================================= */}
        {showPayment && pendingBooking && (
          <div className="bg-white rounded-2xl border border-amber-500 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-6 h-6 text-amber-500" />
                <h2 className="text-xl font-black text-stone-900">Complete Your Booking</h2>
              </div>
              <button
                onClick={handleCancelBooking}
                className="text-sm text-red-500 hover:text-red-600 font-semibold transition"
              >
                Cancel
              </button>
            </div>
            
            <p className="text-stone-500 mb-4">
              Please complete your payment to confirm the reservation.
            </p>

            {/* Booking Summary */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-stone-500">Guesthouse</p>
                  <p className="font-bold text-stone-900 text-sm">
                    {pendingBooking.guesthouse?.name || 'Guesthouse'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Room</p>
                  <p className="font-bold text-stone-900 text-sm">
                    Room {pendingBooking.room?.roomNumber || pendingBooking.roomId}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Dates</p>
                  <p className="font-bold text-stone-900 text-sm">
                    {pendingBooking.checkInDate} → {pendingBooking.checkOutDate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Guests</p>
                  <p className="font-bold text-stone-900 text-sm">
                    {pendingBooking.numberOfGuests || 1} guest
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-stone-200 flex justify-between">
                <span className="text-stone-500">Total Amount</span>
                <span className="text-xl font-black text-amber-500">
                  {pendingBooking.totalPrice?.toLocaleString() || 0} ETB
                </span>
              </div>
            </div>

            {paymentSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {paymentSuccess}
              </div>
            )}

            {/* Payment Methods */}
            <div className="space-y-3">
              <p className="text-sm font-bold text-stone-900">Select Payment Method</p>
              
              {/* Telebirr */}
              <div
                className={`border rounded-xl p-4 cursor-pointer transition ${
                  paymentMethod === 'telebirr'
                    ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20'
                    : 'border-stone-200 hover:border-amber-500 hover:bg-stone-50'
                }`}
                onClick={() => {
                  setPaymentMethod('telebirr');
                  setPaymentError('');
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    paymentMethod === 'telebirr' ? 'bg-amber-500 text-stone-950' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">Telebirr</p>
                    <p className="text-xs text-stone-500">Pay using your Telebirr mobile account</p>
                  </div>
                  <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'telebirr' ? 'border-amber-500 bg-amber-500' : 'border-stone-300'
                  }`}>
                    {paymentMethod === 'telebirr' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
              </div>

              {/* Card via Chapa */}
              <div
                className={`border rounded-xl p-4 cursor-pointer transition ${
                  paymentMethod === 'card'
                    ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20'
                    : 'border-stone-200 hover:border-amber-500 hover:bg-stone-50'
                }`}
                onClick={() => {
                  setPaymentMethod('card');
                  setPaymentError('');
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    paymentMethod === 'card' ? 'bg-amber-500 text-stone-950' : 'bg-purple-50 text-purple-600'
                  }`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">Card</p>
                    <p className="text-xs text-stone-500">Pay securely by card</p>
                  </div>
                  <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'card' ? 'border-amber-500 bg-amber-500' : 'border-stone-300'
                  }`}>
                    {paymentMethod === 'card' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
              </div>

              {/* Bank Transfer */}
              <div
                className={`border rounded-xl p-4 cursor-pointer transition ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20'
                    : 'border-stone-200 hover:border-amber-500 hover:bg-stone-50'
                }`}
                onClick={() => {
                  setPaymentMethod('bank_transfer');
                  setPaymentError('');
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    paymentMethod === 'bank_transfer' ? 'bg-amber-500 text-stone-950' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">Bank Transfer</p>
                    <p className="text-xs text-stone-500">Transfer from any Ethiopian bank account</p>
                  </div>
                  <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'bank_transfer' ? 'border-amber-500 bg-amber-500' : 'border-stone-300'
                  }`}>
                    {paymentMethod === 'bank_transfer' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            {paymentMethod === 'telebirr' && (
              <div className="mt-4 p-4 bg-stone-50 rounded-xl border border-stone-200">
                <label className="block text-sm font-bold text-stone-900 mb-1.5">
                  Mobile Number for Confirmation
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPaymentError('');
                  }}
                  placeholder="+251 9000000000"
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm bg-white"
                />
                <p className="text-xs text-stone-500 mt-1">
                  Enter the phone number connected to your Telebirr account.
                </p>
              </div>
            )}

            {paymentMethod === 'bank_transfer' && (
              <div className="mt-4 space-y-3">
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <label className="block text-sm font-bold text-stone-900 mb-1.5">
                    Bank Name
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => {
                      setBankName(e.target.value);
                      setPaymentError('');
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm bg-white"
                  >
                    <option value="">Select Bank</option>
                    <option value="CBE">Commercial Bank of Ethiopia (CBE)</option>
                    <option value="Awash Bank">Awash Bank</option>
                    <option value="Dashen Bank">Dashen Bank</option>
                    <option value="Hibret Bank">Hibret Bank</option>
                    <option value="Oromia Bank">Oromia Bank</option>
                    <option value="Wegagen Bank">Wegagen Bank</option>
                    <option value="Zemen Bank">Zemen Bank</option>
                    <option value="Bank of Abyssinia">Bank of Abyssinia</option>
                  </select>
                </div>
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <label className="block text-sm font-bold text-stone-900 mb-1.5">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value);
                      setPaymentError('');
                    }}
                    placeholder="Enter your bank account number"
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm bg-white"
                  />
                </div>
              </div>
            )}

            <div className="mt-6">
              <button
                type="button"
                onClick={handlePaymentSubmit}
                disabled={submitting}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    Confirm & Pay {pendingBooking.totalPrice?.toLocaleString() || 0} ETB
                  </>
                )}
              </button>

              {paymentError && (
                <div
                  role="alert"
                  className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{paymentError}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-start gap-3 text-sm text-stone-500">
              <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-500" />
              <span>
                Your booking information is securely processed and the room availability is checked before confirmation.
              </span>
            </div>
          </div>
        )}

        {/* =========================================================
            HIDE DASHBOARD CONTENT WHEN PAYMENT IS SHOWING
            ========================================================= */}
        {!showPayment && (
          <>
            {/* WELCOME SECTION */}
            <div className="mb-8">
              <h1 className="text-3xl font-black text-stone-900">
                Welcome back, {user?.name?.split(' ')[0] || 'Guest'}! 👋
              </h1>
              <p className="text-stone-500 mt-1">
                Here's an overview of your stays and bookings
              </p>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-stone-500">Total Bookings</span>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-3xl font-black text-stone-900">{stats.totalBookings}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-stone-500">Upcoming Stays</span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <p className="text-3xl font-black text-stone-900">{stats.upcomingStays}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-stone-500">Total Spent</span>
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <p className="text-3xl font-black text-amber-600">
                  {stats.totalSpent.toLocaleString()} ETB
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-stone-500">Nights Stayed</span>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Bed className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-black text-stone-900">{stats.totalNights}</p>
              </div>
            </div>

            {/* UPCOMING STAYS */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-stone-900">Upcoming Stays</h2>
                {upcomingBookings.length > 0 && (
                  <Link to="/reservations" className="text-sm font-semibold text-amber-600 hover:text-amber-700">
                    View All →
                  </Link>
                )}
              </div>

              {upcomingBookings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-stone-400" />
                  </div>
                  <p className="text-stone-500 font-medium">No upcoming stays</p>
                  <p className="text-sm text-stone-400 mt-1">Book a guesthouse to start your journey</p>
                  <Link
                    to="/guest/search"
                    className="mt-4 inline-block px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-sm transition"
                  >
                    Start Exploring
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingBookings.slice(0, 4).map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-md transition shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-stone-900">{booking.guesthouseName}</h4>
                          <p className="text-sm text-stone-500 flex items-center gap-1">
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
                          <p className="text-stone-500">Room</p>
                          <p className="font-semibold text-stone-900">
                            {booking.roomNumber} ({booking.roomType})
                          </p>
                        </div>
                        <div>
                          <p className="text-stone-500">Nights</p>
                          <p className="font-semibold text-stone-900">{booking.nightsCount}</p>
                        </div>
                        <div>
                          <p className="text-stone-500">Check-in</p>
                          <p className="font-semibold text-stone-900">{booking.checkInDate}</p>
                        </div>
                        <div>
                          <p className="text-stone-500">Check-out</p>
                          <p className="font-semibold text-stone-900">{booking.checkOutDate}</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-stone-200 flex items-center justify-between">
                        <span className="text-lg font-black text-amber-600">
                          {booking.totalPrice?.toLocaleString()} ETB
                        </span>
                        <Link
                          to={`/reservations/${booking.id}`}
                          className="text-sm font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                        >
                          Details <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SELECTED GUESTHOUSE */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-stone-900">Your Guesthouse</h2>
                <Link to="/guest/search" className="text-sm font-semibold text-amber-600 hover:text-amber-700">
                  Change guesthouse →
                </Link>
              </div>

              {!selectedGuesthouse ? (
                <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center shadow-sm">
                  <Building2 className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                  <p className="font-semibold text-stone-700">No guesthouse selected</p>
                  <p className="mt-1 text-sm text-stone-500">Choose a guesthouse to personalize your dashboard.</p>
                  <Link
                    to="/guest/search"
                    className="mt-4 inline-block rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-stone-950 transition hover:bg-amber-400"
                  >
                    Find a guesthouse
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                      <Building2 className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-stone-900">{selectedGuesthouse.name}</h3>
                      <p className="flex items-center gap-1 text-sm text-stone-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {selectedGuesthouse.city || selectedGuesthouse.location || 'Ethiopia'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RECENT BOOKINGS HISTORY */}
            <div className="mb-8 rounded-2xl border border-stone-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  <h2 className="font-bold text-stone-900">Your Reviews</h2>
                </div>
                <Link to="/guest/reviews" className="text-sm font-semibold text-amber-600 hover:text-amber-700">
                  Write a Review
                </Link>
              </div>
              <div className="space-y-3 p-6">
                {myReviews.length === 0 ? (
                  <p className="text-sm text-stone-500">You have not submitted a review yet.</p>
                ) : (
                  myReviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="rounded-xl border border-stone-100 bg-stone-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-stone-900">
                          {review.guesthouse?.name || 'Guesthouse'}
                        </p>
                        <div className="flex items-center gap-1 text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
                          {Array.from({ length: 5 }, (_, index) => (
                            <Star key={index} className={`h-4 w-4 ${index < review.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-stone-600">{review.comment}</p>
                      <p className="mt-2 text-xs text-stone-400">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RECENT BOOKINGS HISTORY */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <h2 className="font-bold text-stone-900">Recent Bookings History</h2>
                </div>
                <Link to="/reservations" className="text-sm font-semibold text-amber-600 hover:text-amber-700">
                  View All →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50">
                    <tr className="text-left">
                      <th className="px-6 py-3 font-semibold text-stone-500">Guesthouse</th>
                      <th className="px-6 py-3 font-semibold text-stone-500">Room</th>
                      <th className="px-6 py-3 font-semibold text-stone-500">Check-in</th>
                      <th className="px-6 py-3 font-semibold text-stone-500">Check-out</th>
                      <th className="px-6 py-3 font-semibold text-stone-500">Amount</th>
                      <th className="px-6 py-3 font-semibold text-stone-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.slice(0, 5).map((booking) => (
                      <tr key={booking.id} className="border-t border-stone-100 hover:bg-stone-50">
                        <td className="px-6 py-3 font-medium text-stone-900">{booking.guesthouseName}</td>
                        <td className="px-6 py-3 text-stone-500">{booking.roomNumber}</td>
                        <td className="px-6 py-3 text-stone-500">{booking.checkInDate}</td>
                        <td className="px-6 py-3 text-stone-500">{booking.checkOutDate}</td>
                        <td className="px-6 py-3 font-semibold text-stone-900">{booking.totalPrice?.toLocaleString()} ETB</td>
                        <td className="px-6 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {bookings.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-stone-500">
                          No bookings found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-stone-200 text-center">
          <p className="text-sm text-stone-400">
            © 2026 Guesthouse Platform. All rights reserved.
          </p>
        </footer>
      </div>
    </DashboardLayout>
  );
}