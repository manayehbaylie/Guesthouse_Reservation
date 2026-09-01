import React, {
  useState,
  useEffect,
} from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout.jsx';

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
} from 'lucide-react';


export function GuestBookings() {
  const { user } = useAuth();

  const [reservations, setReservations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedReceiptRes, setSelectedReceiptRes] =
    useState(null);

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

    if (
      selectedReviewRes.status !==
      'checked_out'
    ) {
      setReviewError(
        'You can only review a guesthouse after completing your stay.'
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
            <p className="mt-4 text-[#647b8a]">Loading your bookings...</p>
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
            My Reservations & Receipts
          </h1>

          <p className="text-xs text-[#647b8a]">
            Track active check-ins, upcoming stays,
            completed stays, and access official
            payment receipts.
          </p>
        </div>

        {/* NO RESERVATIONS */}
        {reservations.length === 0 ? (

          <div className="bg-white p-12 rounded-3xl border border-[#e5edf2] text-center space-y-3">

            <Calendar className="w-10 h-10 text-[#94a8b5] mx-auto" />

            <h3 className="text-base font-bold text-[#043658]">
              No Reservations Found
            </h3>

            <p className="text-xs text-[#647b8a]">
              You have no active or historical
              bookings on this account.
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


                  <h3 className="text-lg font-bold text-[#043658]">
                    {res.guesthouseName}
                  </h3>


                  <p className="text-xs text-[#647b8a] flex items-center gap-1">

                    <MapPin className="w-3.5 h-3.5 text-[#94a8b5]" />

                    <span>
                      {res.guesthouseLocation}
                    </span>

                  </p>


                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs font-medium text-[#043658] pt-1">

                    <span>
                      Room:{' '}
                      <strong>
                        {res.roomNumber}{' '}
                        ({res.roomType})
                      </strong>
                    </span>

                    <span>
                      Dates:{' '}
                      <strong>
                        {res.checkInDate}
                      </strong>{' '}
                      to{' '}
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
                      Total Paid
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
                    <span>View Details</span>
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
                      View Receipt
                    </span>

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
                  Official Guest Receipt
                </h2>

                <p className="text-[11px] text-[#647b8a]">
                  Guesthouse Reservation Platform Verification
                </p>

              </div>


              <div className="bg-[#f5f8fa] p-4 rounded-2xl border border-[#e5edf2] text-xs space-y-2">

                <div className="flex justify-between gap-4">
                  <span className="text-[#647b8a]">
                    Reservation ID:
                  </span>

                  <span className="font-mono font-bold text-[#043658]">
                    {selectedReceiptRes.id}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[#647b8a]">
                    Guest Name:
                  </span>

                  <span className="font-bold text-[#043658]">
                    {selectedReceiptRes.guestName ||
                      user?.name ||
                      ''}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[#647b8a]">
                    Property:
                  </span>

                  <span className="font-bold text-[#043658]">
                    {selectedReceiptRes.guesthouseName}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[#647b8a]">
                    Room:
                  </span>

                  <span className="font-bold text-[#043658]">
                    Room{' '}
                    {selectedReceiptRes.roomNumber}{' '}
                    ({selectedReceiptRes.roomType})
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-[#647b8a]">
                    Check-In / Out:
                  </span>

                  <span className="font-bold text-[#043658]">
                    {selectedReceiptRes.checkInDate}{' '}
                    -{' '}
                    {selectedReceiptRes.checkOutDate}
                  </span>
                </div>

                <div className="flex justify-between pt-2 border-t border-[#e5edf2]">

                  <span className="text-[#647b8a] font-bold">
                    Total Amount Paid:
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
                  onClick={() =>
                    window.print()
                  }
                  className="flex-1 py-2.5 bg-[#043658] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#0b2f4a] transition"
                >

                  <Printer className="w-4 h-4" />

                  <span>
                    Print Receipt
                  </span>

                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedReceiptRes(null)
                  }
                  className="px-4 py-2.5 bg-[#f5f8fa] text-[#647b8a] rounded-xl text-xs font-bold hover:bg-[#e5edf2] transition"
                >
                  Close
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