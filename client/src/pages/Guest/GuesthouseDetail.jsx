import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api.js';
import {
  MapPin,
  Star,
  Users,
  Bed,
  CheckCircle2,
  Phone,
  Mail,
  ShieldCheck,
  ChevronLeft,
  MessageSquare,
  X,
} from 'lucide-react';

export function GuesthouseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [guesthouse, setGuesthouse] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // ==========================================================
  // REVIEW STATE
  // ==========================================================

  const [showReviews, setShowReviews] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  // ==========================================================
  // LOAD GUESTHOUSE DATA
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const loadGuesthouseData = async () => {
      try {
        setLoading(true);

        const gh = await ApiService.getGuesthouseById(id);

        if (
          !gh ||
          String(gh.status).toLowerCase() !== 'approved'
        ) {
          throw new Error('Guesthouse is not verified.');
        }

        if (!mounted) return;

        setGuesthouse(gh);

        const roomList =
          await ApiService.getRoomsForGuesthouse(gh.id);

        let reservationList = [];

        try {
          reservationList =
            await ApiService.getReservations({
              guesthouseId: gh.id,
            });
        } catch (reservationError) {
          console.warn(
            'Could not load reservations:',
            reservationError
          );
          reservationList = [];
        }

        if (!mounted) return;

        setRooms(
          Array.isArray(roomList)
            ? roomList
            : []
        );

        setReservations(
          Array.isArray(reservationList)
            ? reservationList
            : []
        );
      } catch (error) {
        console.error(
          'Failed to load guesthouse:',
          error
        );

        if (mounted) {
          setGuesthouse(null);
          setRooms([]);
          setReservations([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadGuesthouseData();

    return () => {
      mounted = false;
    };
  }, [id]);

  // ==========================================================
  // LOAD REVIEWS WHEN REVIEW PANEL IS OPENED
  // ==========================================================

  useEffect(() => {
    if (!showReviews || !guesthouse?.id) {
      return;
    }

    let mounted = true;

    const loadReviews = async () => {
      try {
        setReviewsLoading(true);

        const result =
          await ApiService.getGuesthouseReviews(
            guesthouse.id
          );

        if (mounted) {
          setReviews(
            Array.isArray(result)
              ? result
              : []
          );
        }
      } catch (error) {
        console.error(
          'Failed to load reviews:',
          error
        );

        if (mounted) {
          setReviews([]);
        }
      } finally {
        if (mounted) {
          setReviewsLoading(false);
        }
      }
    };

    loadReviews();

    return () => {
      mounted = false;
    };
  }, [showReviews, guesthouse?.id]);

  // ==========================================================
  // DETERMINE ROOM STATUS
  // ==========================================================

  const getRoomStatus = (room) => {
    const roomId = String(room.id);

    const activeReservation =
      reservations.find((reservation) => {
        if (
          String(reservation.roomId) !== roomId
        ) {
          return false;
        }

        const status =
          String(
            reservation.status || ''
          ).toLowerCase();

        return [
          'pending',
          'confirmed',
          'checked_in',
        ].includes(status);
      });

    if (
      activeReservation &&
      String(
        activeReservation.status
      ).toLowerCase() === 'checked_in'
    ) {
      return 'occupied';
    }

    if (
      activeReservation &&
      String(
        activeReservation.status
      ).toLowerCase() === 'confirmed'
    ) {
      return 'unavailable';
    }

    if (
      activeReservation &&
      String(
        activeReservation.status
      ).toLowerCase() === 'pending'
    ) {
      return 'unavailable';
    }

    if (
      room.available === false ||
      String(
        room.availabilityStatus || ''
      ).toLowerCase() !== 'available'
    ) {
      return 'unavailable';
    }

    return 'available';
  };

  // ==========================================================
  // SELECT ROOM / OPEN BOOKING FORM - FIXED!
  // ==========================================================

  const handleBookRoom = (room) => {
    const status = getRoomStatus(room);

    if (status !== 'available') {
      return;
    }

    // THIS IS THE CORRECT FLOW:
    // Navigate DIRECTLY to booking page, NOT to login!
    console.log('Navigating to booking page with room:', room.id);
    
    navigate(
      `/booking?guesthouseId=${guesthouse.id}&roomId=${room.id}`,
      {
        state: {
          bookingData: {
            guesthouseId: guesthouse.id,
            roomId: room.id,
            guesthouse: guesthouse,
            room: room,
          }
        },
      }
    );
  };

  // ==========================================================
  // SUBMIT REVIEW
  // ==========================================================

  const handleSubmitReview = async (event) => {
    event.preventDefault();

    setReviewMessage('');

    if (
      selectedRating < 1 ||
      selectedRating > 5
    ) {
      setReviewMessage(
        'Please select a rating from 1 to 5 stars.'
      );
      return;
    }

    if (!reviewComment.trim()) {
      setReviewMessage(
        'Please write a comment for your review.'
      );
      return;
    }

    try {
      setSubmittingReview(true);

      const currentUser =
        ApiService.getCurrentUser();

      if (!currentUser?.id) {
        setReviewMessage(
          'Please log in as a guest before submitting a review.'
        );
        return;
      }

      const guestReservation =
        reservations.find((reservation) => {
          const status =
            String(
              reservation.status || ''
            ).toLowerCase();

          return (
            String(
              reservation.guesthouseId
            ) === String(guesthouse.id) &&
            [
              'checked_out',
              'completed',
            ].includes(status)
          );
        });

      if (!guestReservation?.id) {
        setReviewMessage(
          'You can review this guesthouse after completing your stay.'
        );
        return;
      }

      if (
        typeof ApiService.createReview !==
        'function'
      ) {
        throw new Error(
          'Review service is not available.'
        );
      }

      await ApiService.createReview({
        guesthouseId: guesthouse.id,
        reservationId: guestReservation.id,
        rating: selectedRating,
        comment: reviewComment.trim(),
      });

      setReviewMessage(
        'Your review was submitted successfully.'
      );

      setSelectedRating(0);
      setHoverRating(0);
      setReviewComment('');

      const updatedReviews =
        await ApiService.getGuesthouseReviews(
          guesthouse.id
        );

      setReviews(
        Array.isArray(updatedReviews)
          ? updatedReviews
          : []
      );
    } catch (error) {
      console.error(
        'Failed to submit review:',
        error
      );

      setReviewMessage(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to submit review.'
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  // ==========================================================
  // STAR RENDERING
  // ==========================================================

  const renderStars = (
    rating,
    clickable = false
  ) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(
          (starNumber) => {
            const active =
              starNumber <=
              Number(rating || 0);

            if (clickable) {
              return (
                <button
                  key={starNumber}
                  type="button"
                  onClick={() =>
                    setSelectedRating(
                      starNumber
                    )
                  }
                  onMouseEnter={() =>
                    setHoverRating(
                      starNumber
                    )
                  }
                  onMouseLeave={() =>
                    setHoverRating(0)
                  }
                  className="focus:outline-none transition-transform hover:scale-110"
                  aria-label={`${starNumber} star`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      starNumber <=
                      (hoverRating ||
                        selectedRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-stone-300'
                    }`}
                  />
                </button>
              );
            }

            return (
              <Star
                key={starNumber}
                className={`w-5 h-5 ${
                  active
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-stone-300'
                }`}
              />
            );
          }
        )}
      </div>
    );
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-96 bg-stone-200 animate-pulse rounded-3xl" />
      </div>
    );
  }

  // ==========================================================
  // NOT FOUND
  // ==========================================================

  if (!guesthouse) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">
          Verified guesthouse not found
        </h2>

        <button
          onClick={() =>
            navigate('/search')
          }
          className="mt-6 px-6 py-4 bg-amber-500 rounded-xl text-base font-bold"
        >
          Back to Search
        </button>
      </div>
    );
  }

  // ==========================================================
  // IMAGES
  // ==========================================================

  const images =
    guesthouse.images?.length
      ? guesthouse.images
      : [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        ];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ==================================================== */}
      {/* BACK BUTTON */}
      {/* ==================================================== */}

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-base font-bold text-stone-600 hover:text-stone-900"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to listings
      </button>

      {/* ==================================================== */}
      {/* GUESTHOUSE HEADER */}
      {/* ==================================================== */}

      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-bold flex gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Verified
          </span>

          <span className="text-base text-amber-600 font-bold flex items-center gap-1.5">
            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            {Number(
              guesthouse.rating || 0
            ).toFixed(1)}
          </span>
        </div>

        <h1 className="text-4xl font-black mt-3">
          {guesthouse.name}
        </h1>

        <p className="text-base text-stone-500 flex items-center gap-2 mt-2">
          <MapPin className="w-5 h-5" />
          {guesthouse.address ||
            guesthouse.location}
          {guesthouse.city
            ? `, ${guesthouse.city}`
            : ''}
        </p>

        {/* ================================================== */}
        {/* REVIEWS BUTTON */}
        {/* ================================================== */}

        <div className="absolute top-0 right-0">

          <button
            type="button"
            onClick={() =>
              setShowReviews(
                (previous) => !previous
              )
            }
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-stone-200 shadow-sm hover:border-amber-400 hover:bg-amber-50 transition-colors text-sm font-bold"
          >
            <MessageSquare className="w-5 h-5 text-amber-500" />
            Reviews
            <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-xs">
              {reviews.length}
            </span>
          </button>

          {/* ================================================= */}
          {/* REVIEW PANEL */}
          {/* ================================================= */}

          {showReviews && (
            <div className="absolute right-0 top-14 z-50 w-[400px] sm:w-[480px] max-h-[80vh] overflow-y-auto bg-white rounded-2xl border border-stone-200 shadow-2xl">

              {/* REVIEW PANEL HEADER */}

              <div className="sticky top-0 z-10 bg-white border-b p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">
                    Guest Reviews
                  </h3>
                  <p className="text-sm text-stone-500 mt-1">
                    Reviews for {guesthouse.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowReviews(false)
                  }
                  className="p-2 rounded-lg hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ================================================= */}
              {/* WRITE REVIEW */}
              {/* ================================================= */}

              <div className="p-5 border-b bg-stone-50">

                <h4 className="text-base font-bold mb-4">
                  Write a Review
                </h4>

                <form
                  onSubmit={
                    handleSubmitReview
                  }
                  className="space-y-4"
                >

                  <div>
                    <p className="text-sm text-stone-500 mb-2">
                      Select your rating
                    </p>

                    <div className="flex items-center gap-1">

                      {[1, 2, 3, 4, 5].map(
                        (starNumber) => (
                          <button
                            key={starNumber}
                            type="button"
                            onClick={() =>
                              setSelectedRating(
                                starNumber
                              )
                            }
                            onMouseEnter={() =>
                              setHoverRating(
                                starNumber
                              )
                            }
                            onMouseLeave={() =>
                              setHoverRating(
                                0
                              )
                            }
                            className="p-0.5 focus:outline-none transition-transform hover:scale-110"
                            aria-label={`${starNumber} star`}
                          >
                            <Star
                              className={`w-8 h-8 ${
                                starNumber <=
                                (hoverRating ||
                                  selectedRating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-stone-300'
                              }`}
                            />
                          </button>
                        )
                      )}

                    </div>

                    <p className="text-sm text-stone-500 mt-1">
                      {selectedRating === 0
                        ? 'No rating selected'
                        : `${selectedRating} out of 5 stars`}
                    </p>
                  </div>

                  {/* COMMENT */}

                  <textarea
                    value={reviewComment}
                    onChange={(event) =>
                      setReviewComment(
                        event.target.value
                      )
                    }
                    placeholder="Write your review..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-base outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                  />

                  {/* MESSAGE */}

                  {reviewMessage && (
                    <p
                      className={`text-sm font-medium ${
                        reviewMessage
                          .toLowerCase()
                          .includes('success')
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {reviewMessage}
                    </p>
                  )}

                  {/* SUBMIT */}

                  <button
                    type="submit"
                    disabled={
                      submittingReview
                    }
                    className="w-full px-5 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-stone-300 disabled:cursor-not-allowed text-stone-950 font-bold text-base transition-colors"
                  >
                    {submittingReview
                      ? 'Submitting...'
                      : 'Submit Review'}
                  </button>
                </form>
              </div>

              {/* ================================================= */}
              {/* EXISTING REVIEWS */}
              {/* ================================================= */}

              <div className="p-5 space-y-5">

                {reviewsLoading ? (
                  <div className="py-8 text-center">
                    <p className="text-base text-stone-500">
                      Loading reviews...
                    </p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="py-8 text-center">

                    <MessageSquare className="w-10 h-10 mx-auto text-stone-300" />

                    <p className="text-base font-semibold text-stone-500 mt-2">
                      No reviews yet
                    </p>

                    <p className="text-sm text-stone-400 mt-1">
                      Be the first guest to review this guesthouse.
                    </p>

                  </div>
                ) : (
                  reviews.map(
                    (review) => (
                      <div
                        key={review.id}
                        className="border-b border-stone-100 pb-5 last:border-b-0 last:pb-0"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div>

                            <p className="text-base font-bold">
                              {review.guest?.fullName ||
                                review.guestName ||
                                'Guest'}
                            </p>

                            <p className="text-sm text-stone-400 mt-0.5">
                              {review.createdAt
                                ? new Date(
                                    review.createdAt
                                  ).toLocaleDateString()
                                : ''}
                            </p>

                          </div>

                          <div className="flex items-center gap-0.5">

                            {[1, 2, 3, 4, 5].map(
                              (starNumber) => (
                                <Star
                                  key={
                                    starNumber
                                  }
                                  className={`w-4 h-4 ${
                                    starNumber <=
                                    Number(
                                      review.rating ||
                                        0
                                    )
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-stone-300'
                                  }`}
                                />
                              )
                            )}

                          </div>

                        </div>

                        <p className="text-base text-stone-600 leading-relaxed mt-2">
                          {review.comment}
                        </p>

                        {/* OWNER RESPONSE */}

                        {review.ownerResponse && (
                          <div className="mt-3 ml-3 p-4 rounded-xl bg-stone-50 border-l-2 border-amber-400">

                            <p className="text-sm font-bold text-stone-700">
                              Owner response
                            </p>

                            <p className="text-sm text-stone-500 mt-1 leading-relaxed">
                              {review.ownerResponse}
                            </p>

                          </div>
                        )}

                      </div>
                    )
                  )
                )}

              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================== */}
      {/* IMAGE GALLERY */}
      {/* ==================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="lg:col-span-2 h-96 sm:h-112 rounded-3xl overflow-hidden bg-stone-100">

          <img
            src={images[activeImageIndex]}
            alt={guesthouse.name}
            className="w-full h-full object-cover"
          />

        </div>

        <div className="grid grid-cols-2 gap-3 h-96 sm:h-112">

          {images
            .slice(0, 4)
            .map((img, index) => (
              <button
                key={`${img}-${index}`}
                type="button"
                onClick={() =>
                  setActiveImageIndex(index)
                }
                className={`rounded-2xl overflow-hidden border-2 ${
                  activeImageIndex === index
                    ? 'border-amber-500'
                    : 'border-transparent'
                }`}
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}

        </div>
      </div>

      {/* ==================================================== */}
      {/* MAIN CONTENT */}
      {/* ==================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-6">

          {/* ================================================= */}
          {/* ABOUT */}
          {/* ================================================= */}

          <div className="bg-white p-8 rounded-3xl border space-y-4">

            <h3 className="text-2xl font-bold">
              About this Guesthouse
            </h3>

            <p className="text-base text-stone-600 leading-relaxed">
              {guesthouse.description ||
                'No description is available for this guesthouse.'}
            </p>

          </div>

          {/* ================================================= */}
          {/* AMENITIES */}
          {/* ================================================= */}

          <div className="bg-white p-8 rounded-3xl border space-y-4">

            <h3 className="text-2xl font-bold">
              Amenities & Services
            </h3>

            {guesthouse.amenities?.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                {guesthouse.amenities.map(
                  (amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 text-sm font-semibold"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      {amenity}
                    </div>
                  )
                )}

              </div>
            ) : (
              <p className="text-base text-stone-500">
                No amenities have been listed.
              </p>
            )}

          </div>

          {/* ================================================= */}
          {/* ROOMS */}
          {/* ================================================= */}

          <div className="space-y-5">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-2xl font-bold">
                  Rooms
                </h2>

                <p className="text-base text-stone-500 mt-1">
                  Room availability is updated from the reservation system.
                </p>

              </div>

            </div>

            {rooms.length === 0 ? (

              <p className="text-base text-stone-500 bg-white p-6 rounded-2xl border">
                No rooms have been registered for this guesthouse.
              </p>

            ) : (

              <div className="space-y-5">

                {rooms.map((room) => {

                  const status =
                    getRoomStatus(room);

                  const isAvailable =
                    status === 'available';

                  const isOccupied =
                    status === 'occupied';

                  const isUnavailable =
                    status === 'unavailable';

                  return (

                    <div
                      key={room.id}
                      className={`bg-white p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        !isAvailable
                          ? 'bg-stone-50'
                          : ''
                      }`}
                    >

                      {/* ROOM INFORMATION */}

                      <div>

                        <div className="flex items-center gap-3 flex-wrap">

                          <span className="text-xl font-bold">
                            Room {room.roomNumber}
                          </span>

                          <span className="text-base font-semibold text-stone-600">
                            ({room.type})
                          </span>

                          {isAvailable && (
                            <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
                              Available
                            </span>
                          )}

                          {isUnavailable && (
                            <span className="px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-bold">
                              Unavailable
                            </span>
                          )}

                          {isOccupied && (
                            <span className="px-3 py-1.5 rounded-full bg-stone-200 text-stone-700 text-sm font-bold">
                              Occupied
                            </span>
                          )}

                        </div>

                        <div className="flex items-center gap-5 text-sm text-stone-500 mt-2">

                          <span className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            Max {room.capacity}
                          </span>

                          <span className="flex items-center gap-1.5">
                            <Bed className="w-4 h-4" />
                            {room.type}
                          </span>

                        </div>

                        {isUnavailable && (
                          <p className="text-sm text-red-600 mt-2 font-medium">
                            This room has already been booked and cannot be selected.
                          </p>
                        )}

                        {isOccupied && (
                          <p className="text-sm text-stone-600 mt-2 font-medium">
                            This room is currently occupied by a guest.
                          </p>
                        )}

                      </div>

                      {/* PRICE + ACTION */}

                      <div className="flex items-center justify-between gap-6">

                        <div>

                          <span className="text-xl font-bold">
                            {Number(
                              room.pricePerNight || 0
                            ).toLocaleString()} ETB
                          </span>

                          <div className="text-sm text-stone-400">
                            per night
                          </div>

                        </div>

                        {isAvailable && (

                          <button
                            type="button"
                            onClick={() =>
                              handleBookRoom(room)
                            }
                            className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-base transition-colors"
                          >
                            Select & Book
                          </button>

                        )}

                        {isUnavailable && (

                          <button
                            type="button"
                            disabled
                            className="px-6 py-3.5 rounded-xl bg-stone-200 text-stone-500 font-bold text-base cursor-not-allowed"
                          >
                            Unavailable
                          </button>

                        )}

                        {isOccupied && (

                          <button
                            type="button"
                            disabled
                            className="px-6 py-3.5 rounded-xl bg-stone-300 text-stone-600 font-bold text-base cursor-not-allowed"
                          >
                            Occupied
                          </button>

                        )}

                      </div>

                    </div>

                  );
                })}

              </div>

            )}

          </div>

        </div>

        {/* ================================================== */}
        {/* SIDEBAR */}
        {/* ================================================== */}

        <aside>

          <div className="bg-stone-900 text-stone-100 p-8 rounded-3xl space-y-5">

            <h3 className="text-xl font-bold flex gap-3">

              <ShieldCheck className="w-6 h-6 text-amber-400" />

              Verified Guarantee

            </h3>

            <p className="text-base text-stone-300">
              Only administrator-approved properties appear in guest search. Room availability is checked before booking.
            </p>

            {/* LEGEND */}

            <div className="pt-4 border-t border-stone-800 space-y-3">

              <div className="flex items-center gap-3 text-base">

                <span className="w-3 h-3 rounded-full bg-emerald-400" />

                <span className="text-stone-300">
                  Available
                </span>

              </div>

              <div className="flex items-center gap-3 text-base">

                <span className="w-3 h-3 rounded-full bg-red-400" />

                <span className="text-stone-300">
                  Unavailable / Booked
                </span>

              </div>

              <div className="flex items-center gap-3 text-base">

                <span className="w-3 h-3 rounded-full bg-stone-400" />

                <span className="text-stone-300">
                  Occupied
                </span>

              </div>

            </div>

            {/* CONTACT */}

            <div className="pt-4 border-t border-stone-800 space-y-3 text-base text-stone-400">

              <div className="flex items-center gap-3">

                <Phone className="w-5 h-5 text-amber-400" />

                {guesthouse.phone ||
                  '+251 91 100 2233'}

              </div>

              <div className="flex items-center gap-3">

                <Mail className="w-5 h-5 text-amber-400" />

                {guesthouse.email ||
                  'support@guesthouse.et'}

              </div>

            </div>

          </div>

        </aside>

      </div>
    </div>
  );
}

export default GuesthouseDetail;