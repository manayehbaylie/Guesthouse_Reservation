import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ApiService } from '../../services/api.js';
import { DashboardLayout } from '../../components/DashboardLayout.jsx';
import {
  Star,
  Send,
  MapPin,
  Calendar,
  Building2,
  CheckCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export function WriteReview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [completedBookings, setCompletedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submittedReviews, setSubmittedReviews] = useState([]);
  const [reviewWithResponse, setReviewWithResponse] = useState({});

  useEffect(() => {
    loadCompletedBookings();
  }, [user?.id]);

  const loadCompletedBookings = async () => {
    setLoading(true);
    setError('');
    try {
      // Get all reservations for the current guest
      const reservations = await ApiService.getReservations({ guestId: user?.id });
      
      console.log('All reservations:', reservations);
      
      // Filter for checked_out status only
      const completed = reservations.filter(
        (booking) => {
          const status = String(booking.status || '').toLowerCase();
          return status === 'checked_out';
        }
      );
      
      console.log('Completed bookings (checked_out):', completed);
      setCompletedBookings(completed);
      
      // Check which bookings already have reviews and get the review data
      const reviewed = [];
      const reviewData = {};
      for (const booking of completed) {
        try {
          const review = await ApiService.getReviewForReservation(booking.id);
          if (review && review.id) {
            reviewed.push(String(booking.id));
            reviewData[booking.id] = review;
            console.log(`Booking ${booking.id} already has review:`, review);
          }
        } catch (e) {
          // No review found - that's fine, user can write one
          console.log(`No review found for booking: ${booking.id}`);
        }
      }
      setSubmittedReviews(reviewed);
      setReviewWithResponse(reviewData);
      
    } catch (error) {
      console.error('Failed to load completed bookings:', error);
      setError('Failed to load your completed stays. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const hasReviewed = (bookingId) => {
    return submittedReviews.includes(String(bookingId));
  };

  const getReview = (bookingId) => {
    return reviewWithResponse[bookingId] || null;
  };

  const renderStars = (rating, size = 'w-4 h-4') => {
    const stars = [];
    const roundedRating = Math.round(rating || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`${size} ${
            i <= roundedRating
              ? 'fill-amber-400 text-amber-400'
              : 'text-stone-200'
          }`}
        />
      );
    }
    return stars;
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!selectedBooking) {
      setError('Please select a booking to review.');
      return;
    }
    
    if (rating === 0) {
      setError('Please select a rating (1-5 stars).');
      return;
    }
    
    if (!comment.trim()) {
      setError('Please write your review.');
      return;
    }
    
    if (hasReviewed(selectedBooking.id)) {
      setError('You have already reviewed this booking.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      await ApiService.createReview({
        guesthouseId: selectedBooking.guesthouseId,
        reservationId: selectedBooking.id,
        rating: rating,
        comment: comment.trim(),
      });
      
      setSuccess('✅ Your review has been submitted successfully! Thank you for your feedback.');
      
      // Add to reviewed list
      setSubmittedReviews([...submittedReviews, String(selectedBooking.id)]);
      
      // Reset form
      setRating(0);
      setComment('');
      setSelectedBooking(null);
      
      // Reload bookings to update status
      setTimeout(() => {
        setSuccess('');
        loadCompletedBookings();
      }, 3000);
      
    } catch (error) {
      console.error('Review submission error:', error);
      setError(error?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      checked_out: 'bg-blue-100 text-blue-700 border-blue-200',
      confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      checked_in: 'bg-amber-100 text-amber-700 border-amber-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    };
    return statusMap[status?.toLowerCase()] || 'bg-stone-100 text-stone-700 border-stone-200';
  };

  const getStatusText = (status) => {
    const statusMap = {
      checked_out: 'Completed Stay ✅',
      confirmed: 'Confirmed',
      checked_in: 'Checked In',
      cancelled: 'Cancelled',
      pending: 'Pending',
    };
    return statusMap[status?.toLowerCase()] || status || 'Unknown';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#e5edf2] border-t-[#FFC107] rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-[#647b8a]">Loading your stays...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-black text-[#043658]">Write a Review</h1>
          <p className="text-sm text-[#647b8a]">
            Share your Metsafiya experience and help other travelers make better decisions
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-700 text-sm flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}

        {/* No Completed Bookings */}
        {completedBookings.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#e5edf2] p-12 text-center">
            <Building2 className="w-16 h-16 text-[#94a8b5] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#043658]">No Completed Stays</h3>
            <p className="text-[#647b8a] mt-2">
              You can only review guesthouses after completing your stay.
            </p>
            <p className="text-xs text-[#647b8a] mt-1">
              Once your stay is checked out, you'll be able to share your experience here.
            </p>
            <Link
              to="/guest/search"
              className="mt-4 inline-block px-6 py-2.5 bg-[#FFC107] hover:bg-[#ffb300] text-[#043658] font-bold rounded-xl text-sm transition"
            >
              Book a Stay
            </Link>
          </div>
        )}

        {/* Booking List */}
        <div className="space-y-4">
          {completedBookings.map((booking) => {
            const reviewed = hasReviewed(booking.id);
            const review = getReview(booking.id);

            return (
              <div
                key={booking.id}
                className={`bg-white rounded-2xl border p-5 transition ${
                  selectedBooking?.id === booking.id
                    ? 'border-[#FFC107] shadow-lg ring-2 ring-[#FFC107]/20'
                    : 'border-[#e5edf2] hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-[#043658]">
                        {booking.guesthouseName || 'Guesthouse'}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                      {reviewed && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Reviewed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#647b8a] flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {booking.guesthouseLocation || 'Ethiopia'}
                    </p>
                    <p className="text-sm text-[#647b8a] flex items-center gap-1 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {booking.checkInDate || '—'} → {booking.checkOutDate || '—'}
                      <span className="text-xs text-stone-400 ml-1">
                        ({booking.nightsCount || 0} nights)
                      </span>
                    </p>
                    {booking.roomNumber && (
                      <p className="text-xs text-[#647b8a] mt-0.5">
                        Room {booking.roomNumber} • {booking.roomType || 'Standard'}
                      </p>
                    )}

                    {/* ✅ SHOW OWNER RESPONSE IF REVIEW EXISTS */}
                    {reviewed && review && review.ownerResponse && (
                      <div className="mt-3 bg-purple-50 border border-purple-200 p-3 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-bold text-purple-800">Owner Response</span>
                          <span className="text-[10px] text-purple-500 ml-auto">
                            {review.updatedAt ? new Date(review.updatedAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="text-sm text-purple-900">{review.ownerResponse}</p>
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Response received</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {!reviewed && (
                    <button
                      onClick={() => {
                        setSelectedBooking(selectedBooking?.id === booking.id ? null : booking);
                        setRating(0);
                        setComment('');
                        setError('');
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition shrink-0 ml-4 ${
                        selectedBooking?.id === booking.id
                          ? 'bg-[#e5edf2] text-[#647b8a]'
                          : 'bg-[#FFC107] text-[#043658] hover:bg-[#ffb300]'
                      }`}
                    >
                      {selectedBooking?.id === booking.id ? 'Cancel' : 'Write Review'}
                    </button>
                  )}
                </div>

                {/* Review Form */}
                {selectedBooking?.id === booking.id && !reviewed && (
                  <div className="mt-4 pt-4 border-t border-[#e5edf2]">
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <p className="text-sm font-bold text-[#043658] mb-2">
                          How was your stay at {booking.guesthouseName}?
                        </p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="p-1 transition-transform hover:scale-110 focus:outline-none"
                            >
                              <Star
                                className={`w-8 h-8 ${
                                  star <= (hoverRating || rating)
                                    ? 'fill-[#FFC107] text-[#FFC107]'
                                    : 'text-[#cbd8e0]'
                                } transition-colors`}
                              />
                            </button>
                          ))}
                        </div>
                        <p className="text-sm text-[#647b8a] mt-1">
                          {rating === 0 
                            ? 'Tap a star to rate your experience' 
                            : `${rating} out of 5 stars - ${rating === 5 ? 'Excellent! 🌟' : rating >= 4 ? 'Great! 👍' : rating >= 3 ? 'Good' : rating >= 2 ? 'Could be better' : 'Needs improvement'}`}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#043658] mb-2">
                          Your Metsafiya (Review)
                        </label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={4}
                          placeholder="Tell other guests about your experience... What did you like? How was the service? Would you recommend this place?"
                          className="w-full px-4 py-3 rounded-xl border border-[#e5edf2] focus:ring-2 focus:ring-[#FFC107] focus:border-transparent outline-none text-sm resize-none"
                          maxLength={1000}
                        />
                        <div className="flex justify-between text-xs text-[#647b8a] mt-1">
                          <span>{comment.length > 0 ? `${comment.length}/1000 characters` : 'Write at least 10 characters'}</span>
                          {comment.length > 0 && comment.length < 10 && (
                            <span className="text-red-500">Please write more (minimum 10 characters)</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          disabled={submitting || rating === 0 || comment.trim().length < 10}
                          className="px-6 py-2.5 bg-[#FFC107] hover:bg-[#ffb300] text-[#043658] font-bold rounded-xl flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-[#043658] border-t-transparent rounded-full animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Submit Review
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBooking(null);
                            setRating(0);
                            setComment('');
                            setError('');
                          }}
                          className="px-6 py-2.5 bg-[#f5f8fa] hover:bg-[#e5edf2] text-[#647b8a] font-bold rounded-xl transition"
                        >
                          Cancel
                        </button>
                      </div>
                      
                      {rating === 0 && (
                        <p className="text-xs text-red-500">⚠️ Please select a rating</p>
                      )}
                      {comment.trim().length > 0 && comment.trim().length < 10 && (
                        <p className="text-xs text-red-500">⚠️ Please write at least 10 characters</p>
                      )}
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Review Tips */}
        {completedBookings.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-700">
            <h4 className="font-bold mb-1">💡 Tips for writing a great review:</h4>
            <ul className="list-disc list-inside space-y-0.5 text-blue-600">
              <li>Be honest and detailed about your experience</li>
              <li>Mention specific things you liked or disliked</li>
              <li>Include details about cleanliness, service, and amenities</li>
              <li>Your feedback helps other travelers make better choices</li>
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default WriteReview;