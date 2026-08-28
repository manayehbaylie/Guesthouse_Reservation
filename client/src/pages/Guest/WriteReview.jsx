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

  useEffect(() => {
    loadCompletedBookings();
  }, []);

  // ✅ FIXED: Load completed bookings and check for existing reviews
  const loadCompletedBookings = async () => {
    setLoading(true);
    try {
      const reservations = await ApiService.getReservations({ guestId: user?.id });
      
      // Get only completed stays (checked_out)
      const completed = reservations.filter(
        (booking) => booking.status === 'checked_out'
      );
      
      setCompletedBookings(completed);
      
      // Check which ones already have reviews
      const reviewed = [];
      for (const booking of completed) {
        try {
          const review = await ApiService.getReviewForReservation(booking.id);
          if (review && review.id) {
            reviewed.push(String(booking.id));
          }
        } catch (e) {
          // No review found - this is fine
          console.log('No review found for booking:', booking.id);
        }
      }
      setSubmittedReviews(reviewed);
      
    } catch (error) {
      console.error('Failed to load completed bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Check if review was submitted
  const hasReviewed = (bookingId) => {
    return submittedReviews.includes(String(bookingId));
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
      
      setSubmittedReviews([...submittedReviews, String(selectedBooking.id)]);
      
      setRating(0);
      setComment('');
      setSelectedBooking(null);
      
      setTimeout(() => {
        setSuccess('');
        loadCompletedBookings();
      }, 2000);
      
    } catch (error) {
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
    };
    return statusMap[status?.toLowerCase()] || 'bg-stone-100 text-stone-700 border-stone-200';
  };

  const getStatusText = (status) => {
    const statusMap = {
      checked_out: 'Completed',
      confirmed: 'Confirmed',
      checked_in: 'Checked In',
      cancelled: 'Cancelled',
    };
    return statusMap[status?.toLowerCase()] || status || 'Unknown';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#e5edf2] border-t-[#ffc107] rounded-full animate-spin mx-auto" />
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
            Share your Metsafiya and help other travelers make better decisions
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-700 text-sm flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
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
            <Link
              to="/guest/search"
              className="mt-4 inline-block px-6 py-2.5 bg-[#ffc107] hover:bg-[#ffb300] text-[#043658] font-bold rounded-xl text-sm transition"
            >
              Book a Stay
            </Link>
          </div>
        )}

        {/* Booking List */}
        <div className="space-y-4">
          {completedBookings.map((booking) => (
            <div
              key={booking.id}
              className={`bg-white rounded-2xl border p-5 transition ${
                selectedBooking?.id === booking.id
                  ? 'border-[#ffc107] shadow-lg'
                  : 'border-[#e5edf2] hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#043658]">{booking.guesthouseName}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                    {hasReviewed(booking.id) && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">
                        ✅ Reviewed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#647b8a] flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {booking.guesthouseLocation || 'Ethiopia'}
                  </p>
                  <p className="text-sm text-[#647b8a] flex items-center gap-1 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {booking.checkInDate} → {booking.checkOutDate}
                  </p>
                </div>
                
                {/* ✅ If NOT reviewed, show "Write Review" button */}
                {!hasReviewed(booking.id) && (
                  <button
                    onClick={() => {
                      setSelectedBooking(selectedBooking?.id === booking.id ? null : booking);
                      setRating(0);
                      setComment('');
                      setError('');
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                      selectedBooking?.id === booking.id
                        ? 'bg-stone-200 text-stone-700'
                        : 'bg-[#ffc107] text-[#043658] hover:bg-[#ffb300]'
                    }`}
                  >
                    {selectedBooking?.id === booking.id ? 'Cancel' : 'Write Review'}
                  </button>
                )}
              </div>

              {/* Review Form - Only shows if NOT reviewed and selected */}
              {selectedBooking?.id === booking.id && !hasReviewed(booking.id) && (
                <div className="mt-4 pt-4 border-t border-[#e5edf2]">
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <p className="text-sm font-bold text-[#043658] mb-2">How was your stay?</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-8 h-8 ${
                                star <= (hoverRating || rating)
                                  ? 'fill-[#ffc107] text-[#ffc107]'
                                  : 'text-[#cbd8e0]'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <p className="text-sm text-[#647b8a] mt-1">
                        {rating === 0 ? 'Select a rating' : `${rating} out of 5 stars`}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#043658] mb-2">
                        Your Metsafiya
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        placeholder="Tell other guests about your experience..."
                        className="w-full px-4 py-3 rounded-xl border border-[#e5edf2] focus:ring-2 focus:ring-[#ffc107] focus:border-transparent outline-none text-sm"
                      />
                      <div className="text-right text-xs text-[#647b8a] mt-1">
                        {comment.length}/1000
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2.5 bg-[#ffc107] hover:bg-[#ffb300] text-[#043658] font-bold rounded-xl flex items-center gap-2 transition disabled:opacity-50"
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
                        onClick={() => setSelectedBooking(null)}
                        className="px-6 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default WriteReview;