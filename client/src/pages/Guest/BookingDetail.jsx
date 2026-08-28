import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ApiService } from '../../services/api.js';
import { DashboardLayout } from '../../components/DashboardLayout.jsx';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Bed,
  Users,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Printer,
  Building2,
} from 'lucide-react';

export function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBookingDetail();
  }, [id]);

  const loadBookingDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const reservations = await ApiService.getReservations({ guestId: user?.id });
      const found = reservations.find((r) => String(r.id) === String(id));
      
      if (found) {
        setBooking(found);
      } else {
        setError('Booking not found');
      }
    } catch (err) {
      console.error('Failed to load booking:', err);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      checked_in: 'bg-blue-100 text-blue-700 border-blue-200',
      checked_out: 'bg-stone-100 text-stone-700 border-stone-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    };
    return statusMap[status?.toLowerCase()] || 'bg-stone-100 text-stone-700 border-stone-200';
  };

  const getStatusIcon = (status) => {
    const statusMap = {
      confirmed: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      pending: <Clock className="w-5 h-5 text-amber-600" />,
      checked_in: <Users className="w-5 h-5 text-blue-600" />,
      checked_out: <CheckCircle2 className="w-5 h-5 text-stone-600" />,
      cancelled: <XCircle className="w-5 h-5 text-red-600" />,
    };
    return statusMap[status?.toLowerCase()] || <Clock className="w-5 h-5 text-stone-600" />;
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#e5edf2] border-t-[#ffc107] rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-[#647b8a]">Loading booking details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !booking) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto py-20 text-center">
          <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm">
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="mt-4 text-2xl font-black text-stone-900">Booking Not Found</h2>
            <p className="mt-2 text-stone-500">{error || 'The booking you are looking for does not exist.'}</p>
            <button
              onClick={() => navigate('/reservations')}
              className="mt-6 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl transition"
            >
              Back to My Bookings
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Back Button */}
      <button
        onClick={() => navigate('/reservations')}
        className="flex items-center gap-2 text-sm font-semibold text-[#647b8a] hover:text-[#043658] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Bookings
      </button>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-[#e5edf2] shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-8 text-stone-950">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-stone-800/80">
                <Building2 className="w-4 h-4" />
                <span>Reservation #{booking.id}</span>
              </div>
              <h1 className="text-2xl font-black mt-1">{booking.guesthouseName}</h1>
              <p className="text-stone-800/70 flex items-center gap-1 mt-0.5">
                <MapPin className="w-4 h-4" />
                {booking.guesthouseLocation || 'Ethiopia'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border ${getStatusBadge(booking.status)} bg-white/90`}>
                {getStatusIcon(booking.status)}
                {getStatusText(booking.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Booking Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailItem 
              icon={<Calendar className="w-5 h-5" />}
              label="Check-in"
              value={booking.checkInDate}
            />
            <DetailItem 
              icon={<Calendar className="w-5 h-5" />}
              label="Check-out"
              value={booking.checkOutDate}
            />
            <DetailItem 
              icon={<Bed className="w-5 h-5" />}
              label="Room"
              value={`${booking.roomNumber} (${booking.roomType})`}
            />
            <DetailItem 
              icon={<Users className="w-5 h-5" />}
              label="Nights"
              value={`${booking.nightsCount} night${booking.nightsCount > 1 ? 's' : ''}`}
            />
          </div>

          {/* Payment Details */}
          <div className="border-t border-[#e5edf2] pt-4">
            <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider mb-3">
              Payment Details
            </h3>
            <div className="bg-stone-50 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Payment Method</span>
                <span className="font-semibold text-stone-900">
                  {booking.paymentMethod || booking.payment?.method || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Payment Status</span>
                <span className={`font-semibold ${
                  booking.paymentStatus === 'paid' || booking.paymentStatus === 'PAID'
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}>
                  {booking.paymentStatus || 'Pending'}
                </span>
              </div>
              <div className="flex justify-between text-lg font-black border-t border-stone-200 pt-2 mt-2">
                <span className="text-stone-700">Total Paid</span>
                <span className="text-amber-600">
                  {booking.totalPrice?.toLocaleString()} ETB
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-[#e5edf2]">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
            <button
              onClick={() => navigate('/reservations')}
              className="flex-1 sm:flex-none px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              View All Bookings
            </button>
            <button
              onClick={() => navigate('/search')}
              className="flex-1 sm:flex-none px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              Book Another Stay
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ============================================================
// DETAIL ITEM COMPONENT
// ============================================================

function DetailItem({ icon, label, value }) {
  return (
    <div className="bg-stone-50 rounded-2xl p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-stone-500 font-semibold uppercase tracking-wider">{label}</p>
        <p className="font-bold text-stone-900">{value || '-'}</p>
      </div>
    </div>
  );
}

export default BookingDetail;