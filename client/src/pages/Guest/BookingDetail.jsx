import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ApiService } from '../../services/api.js';
import { DashboardLayout } from '../../components/DashboardLayout.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
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
  Download,
  Building2,
} from 'lucide-react';

export function BookingDetail() {
  const { t } = useLanguage();
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
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      window.alert('Allow pop-ups for this site to print your receipt.');
      return;
    }

    const escapeHtml = (value) => String(value ?? 'N/A').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[character]);
    const amount = Number(booking.totalPrice || 0);
    const nights = Number(booking.nightsCount || 0);
    const paymentMethod = booking.paymentMethod || booking.payment?.method || 'N/A';
    const paymentStatus = booking.paymentStatus || 'Pending';

    printWindow.document.write(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Reservation ${escapeHtml(booking.id)} Receipt</title>
          <style>
            @page { size: A4 portrait; margin: 14mm; }
            * { box-sizing: border-box; }
            body { margin: 0; color: #153b53; font: 14px/1.5 Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .receipt { width: 100%; max-width: 182mm; margin: 0 auto; }
            .topline { height: 5px; background: #ffb900; }
            header { display: flex; justify-content: space-between; align-items: flex-start; padding: 24px 0 20px; border-bottom: 1px solid #dce6eb; }
            .brand { color: #043658; font-size: 20px; font-weight: 700; }
            .subtitle, .muted { color: #647b8a; }
            .eyebrow { margin-bottom: 5px; color: #647b8a; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
            .reference { color: #043658; font-size: 16px; font-weight: 700; text-align: right; }
            .status { display: inline-block; margin-top: 8px; padding: 4px 10px; border: 1px solid #9de2c4; border-radius: 20px; color: #087443; font-size: 11px; font-weight: 700; text-transform: capitalize; }
            .property { padding: 22px 0 18px; }
            h1 { margin: 0 0 4px; color: #043658; font-size: 21px; }
            .section-title { margin: 0 0 12px; color: #647b8a; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
            .details { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #dce6eb; border-radius: 8px; overflow: hidden; }
            .detail { min-height: 62px; padding: 12px 15px; border-bottom: 1px solid #dce6eb; }
            .detail:nth-child(odd) { border-right: 1px solid #dce6eb; }
            .detail:nth-last-child(-n+2) { border-bottom: 0; }
            .label { display: block; margin-bottom: 3px; color: #647b8a; font-size: 10px; text-transform: uppercase; }
            .value { color: #043658; font-weight: 700; }
            .payment { margin-top: 22px; padding-top: 17px; border-top: 1px solid #dce6eb; }
            .payment-row { display: flex; justify-content: space-between; gap: 16px; padding: 7px 0; }
            .total { display: flex; justify-content: space-between; margin-top: 10px; padding: 14px 15px; border-radius: 7px; background: #f2f6f8; font-size: 16px; font-weight: 700; }
            .total-amount { color: #b87900; }
            footer { margin-top: 25px; padding-top: 12px; border-top: 1px solid #dce6eb; color: #647b8a; font-size: 10px; }
            @media print { .receipt, header, .details, .payment, footer { break-inside: avoid; } }
          </style>
        </head>
        <body>
          <article class="receipt">
            <div class="topline"></div>
            <header>
              <div>
                <div class="brand">Guesthouse Platform</div>
                <div class="subtitle">Reservation payment receipt</div>
              </div>
              <div>
                <div class="eyebrow">Reservation</div>
                <div class="reference">#${escapeHtml(booking.id)}</div>
                <div class="status">${escapeHtml(String(booking.status || 'Unknown').replace(/_/g, ' '))}</div>
              </div>
            </header>
            <section class="property">
              <div class="eyebrow">Property</div>
              <h1>${escapeHtml(booking.guesthouseName || 'Guesthouse')}</h1>
              <div class="muted">${escapeHtml(booking.guesthouseLocation || 'Ethiopia')}</div>
            </section>
            <section>
              <h2 class="section-title">Stay details</h2>
              <div class="details">
                <div class="detail"><span class="label">Check-in</span><span class="value">${escapeHtml(booking.checkInDate)}</span></div>
                <div class="detail"><span class="label">Check-out</span><span class="value">${escapeHtml(booking.checkOutDate)}</span></div>
                <div class="detail"><span class="label">Room</span><span class="value">${escapeHtml(booking.roomNumber)} (${escapeHtml(booking.roomType)})</span></div>
                <div class="detail"><span class="label">Duration</span><span class="value">${nights} night${nights === 1 ? '' : 's'}</span></div>
              </div>
            </section>
            <section class="payment">
              <h2 class="section-title">Payment details</h2>
              <div class="payment-row"><span class="muted">Payment method</span><strong>${escapeHtml(paymentMethod)}</strong></div>
              <div class="payment-row"><span class="muted">Payment status</span><strong>${escapeHtml(paymentStatus)}</strong></div>
              <div class="total"><span>Total paid</span><span class="total-amount">${Number.isFinite(amount) ? amount.toLocaleString() : '0'} ETB</span></div>
            </section>
            <footer>Generated ${escapeHtml(new Date().toLocaleDateString())}. Please present this receipt at check-in.</footer>
          </article>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onafterprint = () => printWindow.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 300);
  };

  const handleSaveReceipt = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const document = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = document.internal.pageSize.getWidth();
      const left = 20;
      const right = pageWidth - 20;
      const amount = Number(booking.totalPrice || 0);
      const paymentStatus = booking.paymentStatus || 'Pending';
      let y = 25;

      document.setFillColor(4, 54, 88);
      document.rect(0, 0, pageWidth, 42, 'F');
      document.setTextColor(255, 255, 255);
      document.setFont('helvetica', 'bold');
      document.setFontSize(18);
      document.text('Guesthouse Reservation Platform', left, y);
      document.setFont('helvetica', 'normal');
      document.setFontSize(10);
      document.text('Reservation payment receipt', left, y + 8);
      document.text(`Reservation #${booking.id}`, right, y + 8, { align: 'right' });

      y = 57;
      document.setTextColor(4, 54, 88);
      document.setFont('helvetica', 'bold');
      document.setFontSize(14);
      document.text(booking.guesthouseName || 'Guesthouse', left, y);
      document.setFont('helvetica', 'normal');
      document.setFontSize(10);
      document.setTextColor(90, 105, 115);
      document.text(booking.guesthouseLocation || 'Ethiopia', left, y + 7);

      y += 23;
      document.setDrawColor(220, 228, 233);
      document.line(left, y, right, y);
      y += 12;

      const addRow = (label, value) => {
        document.setFont('helvetica', 'normal');
        document.setFontSize(10);
        document.setTextColor(90, 105, 115);
        document.text(label, left, y);
        document.setFont('helvetica', 'bold');
        document.setTextColor(4, 54, 88);
        document.text(String(value || 'N/A'), right, y, { align: 'right' });
        y += 10;
      };

      addRow('Status', String(booking.status || 'Unknown').replace(/_/g, ' '));
      addRow('Check-in', booking.checkInDate);
      addRow('Check-out', booking.checkOutDate);
      addRow('Room', `${booking.roomNumber || 'N/A'} (${booking.roomType || 'N/A'})`);
      addRow('Nights', `${booking.nightsCount || 0} night${booking.nightsCount === 1 ? '' : 's'}`);
      addRow('Payment method', booking.paymentMethod || booking.payment?.method || 'N/A');
      addRow('Payment status', paymentStatus);

      y += 3;
      document.setDrawColor(220, 228, 233);
      document.line(left, y, right, y);
      y += 12;
      document.setFont('helvetica', 'bold');
      document.setFontSize(13);
      document.setTextColor(4, 54, 88);
      document.text('Total Paid', left, y);
      document.setTextColor(255, 179, 0);
      document.text(`${amount.toLocaleString()} ETB`, right, y, { align: 'right' });

      document.setFont('helvetica', 'normal');
      document.setFontSize(8);
      document.setTextColor(120, 130, 138);
      document.text(`Generated ${new Date().toLocaleDateString()}`, left, 275);
      document.text('Please present this receipt at check-in.', right, 275, { align: 'right' });
      document.save(`reservation-${booking.id}-receipt.pdf`);
    } catch (err) {
      console.error('Failed to save reservation receipt:', err);
      window.alert('The receipt could not be saved. Please try printing it instead.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#e5edf2] border-t-[#FFC107] rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-[#647b8a]">{t('Loading booking details...')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !booking) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto py-20 text-center">
          <div className="bg-white border border-[#e5edf2] rounded-3xl p-8 shadow-sm">
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="mt-4 text-2xl font-black text-[#043658]">{t('Booking Not Found')}</h2>
            <p className="mt-2 text-[#647b8a]">{error || t('The booking you are looking for does not exist.')}</p>
            <button
              onClick={() => navigate('/reservations')}
              className="mt-6 px-6 py-3 bg-[#FFC107] hover:bg-[#ffb300] text-[#043658] font-bold rounded-xl transition"
            >
              {t('Back to My Bookings')}
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
        {t('Back to My Bookings')}
      </button>

      {/* Main Card */}
      <div id="booking-receipt" className="bg-white rounded-3xl border border-[#e5edf2] shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FFC107] to-[#ffb300] px-6 py-8 text-[#043658]">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#043658]/80">
                <Building2 className="w-4 h-4" />
                <span>{t('Reservation')} #{booking.id}</span>
              </div>
              <h1 className="text-2xl font-black mt-1">{booking.guesthouseName}</h1>
              <p className="text-[#043658]/70 flex items-center gap-1 mt-0.5">
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
              label={t('Check-in')}
              value={booking.checkInDate}
            />
            <DetailItem 
              icon={<Calendar className="w-5 h-5" />}
              label={t('Check-out')}
              value={booking.checkOutDate}
            />
            <DetailItem 
              icon={<Bed className="w-5 h-5" />}
              label={t('Room')}
              value={`${booking.roomNumber} (${booking.roomType})`}
            />
            <DetailItem 
              icon={<Users className="w-5 h-5" />}
              label={t('Nights')}
              value={`${booking.nightsCount} night${booking.nightsCount > 1 ? 's' : ''}`}
            />
          </div>

          {/* Payment Details */}
          <div className="border-t border-[#e5edf2] pt-4">
            <h3 className="text-sm font-bold text-[#043658] uppercase tracking-wider mb-3">
              {t('Payment Details')}
            </h3>
            <div className="bg-[#f5f8fa] rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#647b8a]">{t('Payment Method')}</span>
                <span className="font-semibold text-[#043658]">
                  {booking.paymentMethod || booking.payment?.method || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#647b8a]">{t('Payment Status')}</span>
                <span className={`font-semibold ${
                  booking.paymentStatus === 'paid' || booking.paymentStatus === 'PAID'
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}>
                  {booking.paymentStatus || 'Pending'}
                </span>
              </div>
              <div className="flex justify-between text-lg font-black border-t border-[#e5edf2] pt-2 mt-2">
                <span className="text-[#043658]">{t('Total Paid')}</span>
                <span className="text-[#FFC107]">
                  {booking.totalPrice?.toLocaleString()} ETB
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div id="booking-receipt-actions" className="flex flex-wrap gap-3 pt-4 border-t border-[#e5edf2]">
            <button
              onClick={handleSaveReceipt}
              className="flex-1 sm:flex-none px-6 py-3 bg-[#FFC107] hover:bg-[#ffb300] text-[#043658] font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('Save Receipt PDF')}
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-6 py-3 bg-[#043658] hover:bg-[#0b2f4a] text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              {t('Print Receipt')}
            </button>
            <button
              onClick={() => navigate('/reservations')}
              className="flex-1 sm:flex-none px-6 py-3 bg-[#FFC107] hover:bg-[#ffb300] text-[#043658] font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              {t('View All Bookings')}
            </button>
            <button
              onClick={() => navigate('/guest/search')}
              className="flex-1 sm:flex-none px-6 py-3 bg-[#f5f8fa] hover:bg-[#e5edf2] text-[#043658] font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              {t('Book Another Stay')}
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
    <div className="bg-[#f5f8fa] rounded-2xl p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-[#FFC107]/20 text-[#FFC107] flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-[#647b8a] font-semibold uppercase tracking-wider">{label}</p>
        <p className="font-bold text-[#043658]">{value || '-'}</p>
      </div>
    </div>
  );
}

export default BookingDetail;