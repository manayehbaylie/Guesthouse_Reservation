import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Star, MessageSquare, Send, ChevronLeft, CheckCircle2 } from 'lucide-react';

export function GuestReviews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const reviewsData = await ApiService.getOwnerReviews();
      setReviews(reviewsData);
    } catch (err) {
      console.error('Error loading reviews:', err);
      alert('Error loading reviews: ' + (err.message || 'Unknown error'));
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (reviewId) => {
    if (!responseText.trim()) {
      alert('Please enter a response');
      return;
    }
    try {
      await ApiService.respondToReview(reviewId, responseText);
      setResponseText('');
      setRespondingTo(null);
      loadReviews();
    } catch (err) {
      alert(err.message || 'Failed to submit response');
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-stone-600 font-medium">Loading Reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={() => navigate('/owner')}
        className="flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-stone-900"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Owner Dashboard</span>
      </button>

      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Guest Reviews & Feedback</h1>
          <p className="text-xs text-stone-500">View guest feedback and respond to reviews</p>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 font-medium">No reviews yet</p>
            <p className="text-stone-400 text-xs">Guest reviews will appear here once guests submit feedback</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border border-stone-200 rounded-2xl p-5 space-y-4">
                {/* Guest Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold">
                      {review.guest.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-stone-900">{review.guest.fullName}</div>
                      <div className="text-xs text-stone-500">{review.guest.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStars(review.rating)}
                  </div>
                </div>

                {/* Review Content */}
                <div className="text-sm text-stone-700 bg-stone-50 p-4 rounded-xl">
                  {review.comment}
                </div>

                {/* Reservation Info */}
                <div className="text-xs text-stone-500">
                  <span className="font-medium">Stay:</span> {new Date(review.reservation.checkIn).toLocaleDateString()} - {new Date(review.reservation.checkOut).toLocaleDateString()}
                </div>

                {/* Owner Response */}
                {review.ownerResponse ? (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-800 font-bold text-xs mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Your Response</span>
                    </div>
                    <div className="text-sm text-blue-900">{review.ownerResponse}</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {respondingTo === review.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Write your response to this guest..."
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRespond(review.id)}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-2"
                          >
                            <Send className="w-4 h-4" />
                            <span>Submit Response</span>
                          </button>
                          <button
                            onClick={() => {
                              setRespondingTo(null);
                              setResponseText('');
                            }}
                            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRespondingTo(review.id)}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Respond to Review</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}