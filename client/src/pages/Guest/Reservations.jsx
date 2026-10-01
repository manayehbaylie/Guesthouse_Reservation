import React, {
  useState,
  useEffect,
} from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

import {
  ApiService,
} from '../../services/api.js';

import {
  useAuth,
} from '../../context/AuthContext.jsx';

import {
  Calendar,
  MapPin,
  Printer,
  ShieldCheck,
  FileText,
  Star,
  X,
  Send,
  CheckCircle,
  ChevronRight,
  Building2,
  Trash2,
} from 'lucide-react';

import PaymentScreen from "../../components/PaymentScreen";
export function GuestBookings() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [reservations, setReservations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [deletingReservationId, setDeletingReservationId] =
    useState(null);

  const [deleteError, setDeleteError] =
    useState('');

  const [selectedReceiptRes, setSelectedReceiptRes] =
    useState(null);

  const handlePrintReceipt = (reservation) => {
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
    const amount = Number(reservation.totalPrice || 0);
    const nights = Number(reservation.nightsCount || 0);
    const guestName = reservation.guestName || user?.name || 'Guest';
    const paymentMethod = reservation.paymentMethod || reservation.payment?.method || 'N/A';
    const paymentStatus = reservation.paymentStatus || 'Pending';

    printWindow.document.write(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Reservation ${escapeHtml(reservation.id)} Receipt</title>
          <style>
            @page { size: A4 portrait; margin: 14mm; }
            * { box-sizing: border-box; }
            body { margin: 0; color: #153b53; font: 14px/1.5 Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .receipt { width: 100%; max-width: 182mm; margin: 0 auto; }
            .topline { height: 5px; background: #ffb900; }
            header { display: flex; justify-content: space-between; align-items: flex-start; padding: 24px 0 20px; border-bottom: 1px solid #dce6eb; }
            .brand { color: #043658; font-size: 20px; font-weight: 700; }
            .muted { color: #647b8a; }
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
            .total-amount { color: #087443; }
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
                <div class="muted">Official guest receipt</div>
              </div>
              <div>
                <div class="eyebrow">Reservation</div>
                <div class="reference">#${escapeHtml(reservation.id)}</div>
                <div class="status">${escapeHtml(String(reservation.status || 'Confirmed').replace(/_/g, ' '))}</div>
              </div>
            </header>
            <section class="property">
              <div class="eyebrow">Property</div>
              <h1>${escapeHtml(reservation.guesthouseName || `Guesthouse #${reservation.guesthouseId || 'N/A'}`)}</h1>
              <div class="muted">${escapeHtml(reservation.guesthouseCity || reservation.guesthouseLocation || 'City unavailable')}</div>
              <div class="muted">Property ID: ${escapeHtml(reservation.guesthouseId || 'N/A')}</div>
            </section>
            <section>
              <h2 class="section-title">Guest and stay details</h2>
              <div class="details">
                <div class="detail"><span class="label">Guest name</span><span class="value">${escapeHtml(guestName)}</span></div>
                <div class="detail"><span class="label">Room</span><span class="value">${escapeHtml(`Room ${reservation.roomNumber || 'N/A'} (${reservation.roomType || 'N/A'})`)}</span></div>
                <div class="detail"><span class="label">Check-in</span><span class="value">${escapeHtml(reservation.checkInDate)}</span></div>
                <div class="detail"><span class="label">Check-out</span><span class="value">${escapeHtml(reservation.checkOutDate)}</span></div>
                <div class="detail"><span class="label">Duration</span><span class="value">${nights} night${nights === 1 ? '' : 's'}</span></div>
                <div class="detail"><span class="label">Payment method</span><span class="value">${escapeHtml(paymentMethod)}</span></div>
              </div>
            </section>
            <section class="payment">
              <h2 class="section-title">Payment summary</h2>
              <div class="payment-row"><span class="muted">Payment status</span><strong>${escapeHtml(paymentStatus)}</strong></div>
              <div class="total"><span>Total amount paid</span><span class="total-amount">${Number.isFinite(amount) ? amount.toLocaleString() : '0'} ETB</span></div>
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

  // ==========================================================
  // REVIEW STATE
  // ==========================================================

  const [selectedReviewRes, setSelectedReviewRes] =
    useState(null);

  const [reviewRating, setReviewRating] =
    useState(0);

  const [reviewComment, setReviewComment] =
    useState('');

  const [submittingReview, setSubmittingReview] =
    useState(false);

  const [reviewError, setReviewError] =
    useState('');

  const [reviewSuccess, setReviewSuccess] =
    useState('');

  const [reviewedReservations, setReviewedReservations] =
    useState(() => {
      try {
        const saved =
          localStorage.getItem(
            'gh_reviewed_reservations'
          );

        return saved
          ? JSON.parse(saved)
          : [];
      } catch {
        return [];
      }
    });


  // ==========================================================
  // LOAD RESERVATIONS
  // ==========================================================

  useEffect(() => {
    async function loadBookings() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const resList =
          await ApiService.getReservations({
            guestId: user.id,
          });

        setReservations(
          Array.isArray(resList)
            ? resList
            : []
        );
      } catch (err) {
        console.error(
          'Failed to load guest reservations:',
          err
        );
      } finally {
        setLoading(false);
      }
    }

    loadBookings();
  }, [user]);

  const handleDeleteReservation = async (reservation) => {
    setDeleteError('');
    setDeletingReservationId(reservation.id);
    try {
      await ApiService.deleteGuestReservation(reservation.id);
      setReservations((current) =>
        current.filter((item) => String(item.id) !== String(reservation.id))
      );
    } catch (error) {
      setDeleteError(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete this reservation. Please try again.'
      );
    } finally {
      setDeletingReservationId(null);
    }
  };


  const hasReviewed = (reservationId) => {
    return reviewedReservations.includes(
      String(reservationId)
    );
  };


  const openReviewModal = (reservation) => {
    setSelectedReviewRes(reservation);

    setReviewRating(0);

    setReviewComment('');

    setReviewError('');

    setReviewSuccess('');
  };


  const closeReviewModal = () => {
    if (submittingReview) {
      return;
    }

    setSelectedReviewRes(null);

    setReviewRating(0);

    setReviewComment('');

    setReviewError('');

    setReviewSuccess('');
  };


  const handleSubmitReview = async () => {
    setReviewError('');

    setReviewSuccess('');

    if (!selectedReviewRes) {
      return;
    }

    if (!reviewRating) {
      setReviewError(
        'Please select a rating from 1 to 5 stars.'
      );

      return;
    }

    if (!reviewComment.trim()) {
      setReviewError(
        'Please write your review before submitting.'
      );

      return;
    }

    const reviewStatus = String(selectedReviewRes.status || '').toLowerCase();
    if (reviewStatus !== 'checked_in' && reviewStatus !== 'checked_out') {
      setReviewError(
        'You can review a guesthouse after checking in.'
      );

      return;
    }

    if (
      hasReviewed(
        selectedReviewRes.id
      )
    ) {
      setReviewError(
        'You have already submitted a review for this reservation.'
      );

      return;
    }

    const guesthouseId =
      selectedReviewRes.guesthouseId;

    if (!guesthouseId) {
      setReviewError(
        'The guesthouse information is missing from this reservation.'
      );

      return;
    }

    setSubmittingReview(true);

    try {
      await ApiService.createReview({
        guesthouseId,
        reservationId:
          selectedReviewRes.id,
        rating: reviewRating,
        comment:
          reviewComment.trim(),
      });

      const updatedReviewedReservations = [
        ...reviewedReservations,
        String(selectedReviewRes.id),
      ];

      setReviewedReservations(
        updatedReviewedReservations
      );

      localStorage.setItem(
        'gh_reviewed_reservations',
        JSON.stringify(
          updatedReviewedReservations
        )
      );

      setReviewSuccess(
        'Your review has been submitted successfully. Thank you! ❤️'
      );

      setReviewRating(0);

      setReviewComment('');

      setTimeout(() => {
        setSelectedReviewRes(null);

        setReviewSuccess('');
      }, 1800);

    } catch (error) {
      console.error(
        'Failed to submit review:',
        error
      );

      setReviewError(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to submit your review. Please try again.'
      );
    } finally {
      setSubmittingReview(false);
    }
  };


  // ==========================================================
  // RENDER
  // ==========================================================

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#e5edf2] border-t-[#FFC107] rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-[#647b8a]">{t('Loading your bookings...')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* PAGE HEADER */}
        <div>
          <h1 className="text-2xl font-black text-[#043658] tracking-tight">
            {t('My Reservations & Receipts')}
          </h1>

          <p className="text-xs text-[#647b8a]">
            {t('Track active check-ins, upcoming stays, completed stays, and access official payment receipts.')}
          </p>
        </div>

        {deleteError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {deleteError}
          </div>
        )}

        {/* NO RESERVATIONS */}
        {reservations.length === 0 ? (

          <div className="bg-white p-12 rounded-3xl border border-[#e5edf2] text-center space-y-3">

            <Calendar className="w-10 h-10 text-[#94a8b5] mx-auto" />

            <h3 className="text-base font-bold text-[#043658]">
              {t('No Reservations Found')}
            </h3>

            <p className="text-xs text-[#647b8a]">
              {t('You have no active or historical bookings on this account.')}
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {reservations.map((res) => (

              <div
                key={res.id}
                className="bg-white p-6 rounded-3xl border border-[#e5edf2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
              >

                {/* RESERVATION INFORMATION */}
                <div className="space-y-2 flex-1">

                  <div className="flex items-center gap-2">

                    <span className="font-mono text-xs font-bold text-[#647b8a]">
                      #{res.id}
                    </span>

                    <span
                      className={`
                        px-2.5
                        py-0.5
                        rounded-full
                        text-[10px]
                        font-bold
                        uppercase
                        ${
                          res.status ===
                          'confirmed'
                            ? 'bg-amber-100 text-amber-800'
                            : res.status ===
                              'checked_in'
                            ? 'bg-emerald-100 text-emerald-800'
                            : res.status ===
                              'checked_out'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-stone-100 text-stone-700'
                        }
                      `}
                    >
                      {String(
                        res.status || ''
                      ).replace(
                        '_',
                        ' '
                      )}
                    </span>

                  </div>


                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 shrink-0 text-[#ffb900]" />
                    <h3 className="text-lg font-bold text-[#043658]">
                      {res.guesthouseName || `Guesthouse #${res.guesthouseId || 'N/A'}`}
                    </h3>
                  </div>


                  <p className="text-xs text-[#647b8a] flex items-center gap-1">

                    <MapPin className="w-3.5 h-3.5 text-[#94a8b5]" />

                    <span>
                      {res.guesthouseCity || res.guesthouseLocation || 'City unavailable'}
                    </span>
                    <span className="ml-1 rounded-full bg-[#f5f8fa] px-2 py-0.5 text-[10px] font-semibold text-[#647b8a]">
                      Property #{res.guesthouseId || 'N/A'}
                    </span>

                  </p>


                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs font-medium text-[#043658] pt-1">

                    <span>
                      {t('Room')}:{' '}
                      <strong>
                        {res.roomNumber}{' '}
                        ({res.roomType})
                      </strong>
                    </span>

                    <span>
                      {t('Dates')}:{' '}
                      <strong>
                        {res.checkInDate}
                      </strong>{' '}
                      {t('to')}{' '}
                      <strong>
                        {res.checkOutDate}
                      </strong>{' '}
                      ({res.nightsCount}{' '}
                      nights)
                    </span>

                  </div>

                </div>


                {/* ACTIONS */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-[#e5edf2]">

                  {/* TOTAL */}
                  <div className="text-right mr-1">

                    <div className="text-xs text-[#647b8a]">
                      {t('Total Paid')}
                    </div>

                    <div className="text-lg font-black text-[#043658]">
                      {Number(
                        res.totalPrice || 0
                      ).toLocaleString()}{' '}
                      ETB
                    </div>

                  </div>


                  {/* VIEW DETAILS */}
                  <Link
                    to={`/reservations/${res.id}`}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-blue-200"
                  >
                    <span>{t('View Details')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>


                  {/* RECEIPT */}
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedReceiptRes(res)
                    }
                    className="px-4 py-2 bg-[#043658] hover:bg-[#0b2f4a] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >

                    <FileText className="w-4 h-4 text-[#FFC107]" />

                    <span>
                      {t('View Receipt')}
                    </span>

                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteReservation(res)}
                    disabled={deletingReservationId === res.id}
                    aria-label={`Delete reservation ${res.id}`}
                    className="px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{deletingReservationId === res.id ? t('Deleting...') : t('Delete')}</span>
                  </button>

                </div>

              </div>

            ))}

          </div>
        )}


        {/* RECEIPT MODAL */}
        {selectedReceiptRes && (

          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">

            <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-[#e5edf2] shadow-2xl space-y-6">

              <div className="text-center space-y-1">

                <div className="w-10 h-10 rounded-xl bg-[#FFC107] text-[#043658] font-bold flex items-center justify-center mx-auto mb-2">

                  <ShieldCheck className="w-6 h-6" />

                </div>

                <h2 className="text-xl font-black text-[#043658]">
                  {t('Official Guest Receipt')}
                </h2>

                <p className="text-[11px] text-[#647b8a]">
                  {t('Guesthouse Reservation Platform Verification')}
                </p>

              </div>


              <div className="bg-[#f5f8fa] p-4 rounded-2xl border border-[#e5edf2] text-xs space-y-2">

                <div className="flex justify-between gap-4">
                  <span className="text-[#647b8a]">
                    {t('Reservation ID')}:
                  </span>

                  <span className="font-mono font-bold text-[#043658]">
                    {selectedReceiptRes.id}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[#647b8a]">
                    {t('Guest Name')}:
                  </span>

                  <span className="font-bold text-[#043658]">
                    {selectedReceiptRes.guestName ||
                      user?.name ||
                      ''}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[#647b8a]">
                    {t('Property')}:
                  </span>

                  <span className="text-right font-bold text-[#043658]">
                    {selectedReceiptRes.guesthouseName || `Guesthouse #${selectedReceiptRes.guesthouseId || 'N/A'}`}
                    <span className="block text-[10px] font-medium text-[#647b8a]">
                      Property #{selectedReceiptRes.guesthouseId || 'N/A'}
                    </span>
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[#647b8a]">Location:</span>
                  <span className="text-right font-semibold text-[#043658]">
                    {selectedReceiptRes.guesthouseCity || selectedReceiptRes.guesthouseLocation || 'City unavailable'}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[#647b8a]">
                    {t('Room')}:
                  </span>

                  <span className="font-bold text-[#043658]">
                    Room{' '}
                    {selectedReceiptRes.roomNumber}{' '}
                    ({selectedReceiptRes.roomType})
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[#647b8a]">
                    {t('Check-In / Out')}:
                  </span>

                  <span className="font-bold text-[#043658]">
                    {selectedReceiptRes.checkInDate}{' '}
                    -{' '}
                    {selectedReceiptRes.checkOutDate}
                  </span>
                </div>

                <div className="flex justify-between pt-2 border-t border-[#e5edf2]">

                  <span className="text-[#647b8a] font-bold">
                    {t('Total Amount Paid')}:
                  </span>

                  <span className="font-black text-emerald-700 text-sm">
                    {Number(
                      selectedReceiptRes.totalPrice ||
                      0
                    ).toLocaleString()}{' '}
                    ETB
                  </span>

                </div>

              </div>


              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={() => handlePrintReceipt(selectedReceiptRes)}
                  className="flex-1 py-2.5 bg-[#043658] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#0b2f4a] transition"
                >

                  <Printer className="w-4 h-4" />

                  <span>
                    {t('Print Receipt')}
                  </span>

                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedReceiptRes(null)
                  }
                  className="px-4 py-2.5 bg-[#f5f8fa] text-[#647b8a] rounded-xl text-xs font-bold hover:bg-[#e5edf2] transition"
                >
                  {t('Close')}
                </button>

              </div>

            </div>

          </div>

        )}


        {/* REVIEW MODAL */}
        {selectedReviewRes && (

          <div className="fixed inset-0 z-[60] bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">

            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#e5edf2] shadow-2xl">

              {/* MODAL HEADER */}
              <div className="flex items-start justify-between gap-4">

                <div>

                  <div className="flex items-center gap-2">

                    <div className="w-10 h-10 rounded-xl bg-[#FFC107]/20 flex items-center justify-center">

                      <Star className="w-5 h-5 text-[#FFC107] fill-current" />

                    </div>

                    <div>

                      <h2 className="text-xl font-black text-[#043658]">
                        Write a Review
                      </h2>

                      <p className="text-xs text-[#647b8a]">
                        Share your experience
                      </p>

                    </div>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={closeReviewModal}
                  disabled={submittingReview}
                  className="w-9 h-9 rounded-xl bg-[#f5f8fa] hover:bg-[#e5edf2] flex items-center justify-center text-[#647b8a] transition-colors disabled:opacity-50"
                >

                  <X className="w-5 h-5" />

                </button>

              </div>

              {/* GUESTHOUSE */}
              <div className="mt-6 bg-[#f5f8fa] rounded-2xl border border-[#e5edf2] p-4">

                <h3 className="font-black text-[#043658]">
                  {selectedReviewRes.guesthouseName}
                </h3>

                <p className="text-xs text-[#647b8a] mt-1 flex items-center gap-1">

                  <MapPin className="w-3.5 h-3.5" />

                  {selectedReviewRes.guesthouseLocation}

                </p>

                <p className="text-xs text-[#647b8a] mt-2">
                  Stay:{' '}
                  <strong>
                    {selectedReviewRes.checkInDate}
                  </strong>{' '}
                  →{' '}
                  <strong>
                    {selectedReviewRes.checkOutDate}
                  </strong>
                </p>

              </div>

              {/* RATING */}
              <div className="mt-6">

                <label className="block text-sm font-black text-[#043658] mb-3">
                  How was your stay?
                </label>

                <div className="flex items-center gap-2">

                  {[1, 2, 3, 4, 5].map(
                    (star) => (

                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setReviewRating(star)
                        }
                        disabled={submittingReview}
                        aria-label={`${star} star rating`}
                        className="p-1 transition-transform hover:scale-110 disabled:opacity-50"
                      >

                        <Star
                          className={`
                            w-9 h-9
                            transition-colors
                            ${
                              star <=
                              reviewRating
                                ? 'text-[#FFC107] fill-[#FFC107]'
                                : 'text-[#cbd8e0]'
                            }
                          `}
                        />

                      </button>

                    )
                  )}

                </div>

                <p className="text-xs text-[#647b8a] mt-2">

                  {reviewRating === 0
                    ? 'Select a rating'
                    : `${reviewRating} out of 5 stars`}

                </p>

              </div>

              {/* COMMENT */}
              <div className="mt-5">

                <label
                  htmlFor="guest-review"
                  className="block text-sm font-black text-[#043658] mb-2"
                >
                  Your Review
                </label>

                <textarea
                  id="guest-review"
                  value={reviewComment}
                  onChange={(event) =>
                    setReviewComment(
                      event.target.value
                    )
                  }
                  disabled={submittingReview}
                  rows={5}
                  maxLength={1000}
                  placeholder="Tell other guests about your experience..."
                  className="w-full rounded-2xl border border-[#e5edf2] bg-[#f5f8fa] px-4 py-3 text-sm text-[#043658] outline-none resize-none focus:border-[#FFC107] focus:ring-2 focus:ring-[#FFC107]/20 disabled:opacity-60"
                />

                <div className="text-right text-[11px] text-[#647b8a] mt-1">
                  {reviewComment.length}/1000
                </div>

              </div>

              {/* ERROR */}
              {reviewError && (

                <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-medium text-red-700">
                  {reviewError}
                </div>

              )}

              {/* SUCCESS */}
              {reviewSuccess && (

                <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-700 flex items-center gap-2">

                  <CheckCircle className="w-4 h-4 shrink-0" />

                  {reviewSuccess}

                </div>

              )}

              {/* BUTTONS */}
              <div className="mt-6 flex gap-3">

                <button
                  type="button"
                  onClick={closeReviewModal}
                  disabled={submittingReview}
                  className="flex-1 py-3 bg-[#f5f8fa] hover:bg-[#e5edf2] text-[#647b8a] rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="flex-1 py-3 bg-[#043658] hover:bg-[#FFC107] hover:text-[#043658] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >

                  {submittingReview ? (

                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />

                      <span>
                        Submitting...
                      </span>
                    </>

                  ) : (

                    <>
                      <Send className="w-4 h-4" />

                      <span>
                        Submit Review
                      </span>
                    </>

                  )}

                </button>

              </div>

            </div>

          </div>

        )}

      </div>
    </DashboardLayout>
  );
}

export default GuestBookings;