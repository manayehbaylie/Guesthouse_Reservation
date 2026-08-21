import React, {
  useState,
  useEffect,
} from 'react';

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

  // Keep track of reviews submitted during
  // the current page session.
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


  // ==========================================================
  // CHECK WHETHER REVIEW WAS ALREADY SUBMITTED
  // ==========================================================

  const hasReviewed = (reservationId) => {
    return reviewedReservations.includes(
      String(reservationId)
    );
  };


  // ==========================================================
  // OPEN REVIEW MODAL
  // ==========================================================

  const openReviewModal = (reservation) => {
    setSelectedReviewRes(reservation);

    setReviewRating(0);

    setReviewComment('');

    setReviewError('');

    setReviewSuccess('');
  };


  // ==========================================================
  // CLOSE REVIEW MODAL
  // ==========================================================

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


  // ==========================================================
  // SUBMIT REVIEW
  // ==========================================================

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
        'Please write your Metsafiya before submitting.'
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

      // Save the reservation ID locally
      // so the button does not appear again
      // during this browser session.
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
        'Your review has been submitted successfully. Thank you for your Metsafiya! ❤️'
      );

      setReviewRating(0);

      setReviewComment('');

      // Close automatically after a short delay.
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">
          My Reservations & Receipts
        </h1>

        <p className="text-xs text-stone-500">
          Track active check-ins, upcoming stays,
          completed stays, and access official
          payment receipts.
        </p>
      </div>


      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-32 bg-stone-200 rounded-3xl animate-pulse"
            />
          ))}
        </div>
      ) : reservations.length === 0 ? (

        /* ===================================================
           NO RESERVATIONS
        =================================================== */

        <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3">

          <Calendar className="w-10 h-10 text-stone-400 mx-auto" />

          <h3 className="text-base font-bold text-stone-800">
            No Reservations Found
          </h3>

          <p className="text-xs text-stone-500">
            You have no active or historical
            bookings on this account.
          </p>

        </div>

      ) : (

        /* ===================================================
           RESERVATIONS
        =================================================== */

        <div className="space-y-4">

          {reservations.map((res) => (

            <div
              key={res.id}
              className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
            >

              {/* ============================================
                  RESERVATION INFORMATION
              ============================================ */}

              <div className="space-y-2">

                <div className="flex items-center gap-2">

                  <span className="font-mono text-xs font-bold text-stone-500">
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


                <h3 className="text-lg font-bold text-stone-900">
                  {res.guesthouseName}
                </h3>


                <p className="text-xs text-stone-500 flex items-center gap-1">

                  <MapPin className="w-3.5 h-3.5 text-stone-400" />

                  <span>
                    {res.guesthouseLocation}
                  </span>

                </p>


                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs font-medium text-stone-700 pt-1">

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


              {/* ============================================
                  ACTIONS
              ============================================ */}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-stone-100">

                {/* TOTAL */}

                <div className="text-right mr-1">

                  <div className="text-xs text-stone-400">
                    Total Paid
                  </div>

                  <div className="text-lg font-black text-stone-900">
                    {Number(
                      res.totalPrice || 0
                    ).toLocaleString()}{' '}
                    ETB
                  </div>

                </div>


                {/* ========================================
                    WRITE REVIEW
                ======================================== */}

                {res.status ===
                  'checked_out' && (

                  hasReviewed(res.id) ? (

                    <div className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">

                      <CheckCircle className="w-4 h-4" />

                      <span>
                        Review Submitted
                      </span>

                    </div>

                  ) : (

                    <button
                      type="button"
                      onClick={() =>
                        openReviewModal(res)
                      }
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
                    >

                      <Star className="w-4 h-4 fill-current" />

                      <span>
                        Write Review
                      </span>

                    </button>

                  )
                )}


                {/* ========================================
                    RECEIPT
                ======================================== */}

                <button
                  type="button"
                  onClick={() =>
                    setSelectedReceiptRes(res)
                  }
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >

                  <FileText className="w-4 h-4 text-amber-400" />

                  <span>
                    View Receipt
                  </span>

                </button>

              </div>

            </div>

          ))}

        </div>
      )}


      {/* =====================================================
          RECEIPT MODAL
      ===================================================== */}

      {selectedReceiptRes && (

        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">

          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-stone-200 shadow-2xl space-y-6">

            <div className="text-center space-y-1">

              <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 font-bold flex items-center justify-center mx-auto mb-2">

                <ShieldCheck className="w-6 h-6" />

              </div>

              <h2 className="text-xl font-black text-stone-900">
                Official Guest Receipt
              </h2>

              <p className="text-[11px] text-stone-500">
                Guesthouse Reservation Platform Verification
              </p>

            </div>


            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs space-y-2">

              <div className="flex justify-between gap-4">
                <span className="text-stone-500">
                  Reservation ID:
                </span>

                <span className="font-mono font-bold text-stone-900">
                  {selectedReceiptRes.id}
                </span>
              </div>


              <div className="flex justify-between gap-4">
                <span className="text-stone-500">
                  Guest Name:
                </span>

                <span className="font-bold text-stone-900">
                  {selectedReceiptRes.guestName ||
                    user?.name ||
                    ''}
                </span>
              </div>


              <div className="flex justify-between gap-4">
                <span className="text-stone-500">
                  Property:
                </span>

                <span className="font-bold text-stone-900">
                  {selectedReceiptRes.guesthouseName}
                </span>
              </div>


              <div className="flex justify-between gap-4">
                <span className="text-stone-500">
                  Room:
                </span>

                <span className="font-bold text-stone-900">
                  Room{' '}
                  {selectedReceiptRes.roomNumber}{' '}
                  ({selectedReceiptRes.roomType})
                </span>
              </div>


              <div className="flex justify-between gap-4">
                <span className="text-stone-500">
                  Check-In / Out:
                </span>

                <span className="font-bold text-stone-900">
                  {selectedReceiptRes.checkInDate}{' '}
                  -{' '}
                  {selectedReceiptRes.checkOutDate}
                </span>
              </div>


              <div className="flex justify-between pt-2 border-t border-stone-200">

                <span className="text-stone-500 font-bold">
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
                className="flex-1 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
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
                className="px-4 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-200"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          REVIEW MODAL
      ===================================================== */}

      {selectedReviewRes && (

        <div className="fixed inset-0 z-[60] bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-stone-200 shadow-2xl">

            {/* ============================================
                MODAL HEADER
            ============================================ */}

            <div className="flex items-start justify-between gap-4">

              <div>

                <div className="flex items-center gap-2">

                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">

                    <Star className="w-5 h-5 text-amber-600 fill-current" />

                  </div>

                  <div>

                    <h2 className="text-xl font-black text-stone-900">
                      Write a Review
                    </h2>

                    <p className="text-xs text-stone-500">
                      Share your Metsafiya
                    </p>

                  </div>

                </div>

              </div>


              <button
                type="button"
                onClick={closeReviewModal}
                disabled={submittingReview}
                className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors disabled:opacity-50"
              >

                <X className="w-5 h-5" />

              </button>

            </div>


            {/* ============================================
                GUESTHOUSE
            ============================================ */}

            <div className="mt-6 bg-stone-50 rounded-2xl border border-stone-200 p-4">

              <h3 className="font-black text-stone-900">
                {selectedReviewRes.guesthouseName}
              </h3>

              <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">

                <MapPin className="w-3.5 h-3.5" />

                {selectedReviewRes.guesthouseLocation}

              </p>

              <p className="text-xs text-stone-500 mt-2">
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


            {/* ============================================
                RATING
            ============================================ */}

            <div className="mt-6">

              <label className="block text-sm font-black text-stone-900 mb-3">
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
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-stone-300'
                          }
                        `}
                      />

                    </button>

                  )
                )}

              </div>

              <p className="text-xs text-stone-500 mt-2">

                {reviewRating === 0
                  ? 'Select a rating'
                  : `${reviewRating} out of 5 stars`}

              </p>

            </div>


            {/* ============================================
                COMMENT
            ============================================ */}

            <div className="mt-5">

              <label
                htmlFor="guest-review"
                className="block text-sm font-black text-stone-900 mb-2"
              >
                Your Metsafiya
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
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none resize-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:opacity-60"
              />

              <div className="text-right text-[11px] text-stone-400 mt-1">
                {reviewComment.length}/1000
              </div>

            </div>


            {/* ============================================
                ERROR
            ============================================ */}

            {reviewError && (

              <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-medium text-red-700">
                {reviewError}
              </div>

            )}


            {/* ============================================
                SUCCESS
            ============================================ */}

            {reviewSuccess && (

              <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-700 flex items-center gap-2">

                <CheckCircle className="w-4 h-4 shrink-0" />

                {reviewSuccess}

              </div>

            )}


            {/* ============================================
                BUTTONS
            ============================================ */}

            <div className="mt-6 flex gap-3">

              <button
                type="button"
                onClick={closeReviewModal}
                disabled={submittingReview}
                className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>


              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="flex-1 py-3 bg-stone-900 hover:bg-amber-500 hover:text-stone-950 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
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
  );
}

export default GuestBookings;