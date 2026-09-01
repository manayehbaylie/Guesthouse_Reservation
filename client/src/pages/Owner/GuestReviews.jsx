import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  Star, 
  MessageSquare, 
  Send, 
  ChevronLeft, 
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Calendar,
  User,
  Building2,
  Clock
} from 'lucide-react';

export function GuestReviews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    withResponses: 0,
    withoutResponses: 0,
  });

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError('');
    
    try {
      const reviewsData = await ApiService.getOwnerReviews();
      
      // Sort reviews by date (newest first)
      const sortedReviews = (reviewsData || []).sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setReviews(sortedReviews);
      
      // Calculate stats
      const total = sortedReviews.length;
      const withResponses = sortedReviews.filter(r => r.ownerResponse).length;
      const withoutResponses = total - withResponses;
      const average = total > 0 
        ? sortedReviews.reduce((acc, r) => acc + (r.rating || 0), 0) / total 
        : 0;
      
      setStats({
        total,
        average,
        withResponses,
        withoutResponses,
      });
      
    } catch (err) {
      console.error('Error loading reviews:', err);
      setError(err.message || 'Failed to load reviews. Please try again.');
      setReviews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRespond = async (reviewId) => {
    if (!responseText.trim()) {
      setError('Please enter a response before submitting.');
      return;
    }
    
    if (responseText.trim().length < 10) {
      setError('Response must be at least 10 characters long.');
      return;
    }
    
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      await ApiService.respondToReview(reviewId, responseText.trim());
      setSuccess('Response submitted successfully!');
      setResponseText('');
      setRespondingTo(null);
      
      // Reload reviews after short delay
      setTimeout(() => {
        setSuccess('');
        loadReviews(true);
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting response:', err);
      setError(err.message || 'Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelResponse = () => {
    setRespondingTo(null);
    setResponseText('');
    setError('');
  };

  const renderStars = (rating) => {
    const filledStars = Math.round(rating || 0);
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < filledStars 
            ? 'fill-amber-400 text-amber-400' 
            : 'text-stone-200'
        }`}
      />
    ));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'G';
    return name.charAt(0).toUpperCase();
  };

  const getRatingLabel = (rating) => {
    const labels = {
      5: 'Excellent 🌟',
      4: 'Very Good 👍',
      3: 'Good',
      2: 'Fair',
      1: 'Poor',
    };
    return labels[Math.round(rating)] || 'Not rated';
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-stone-600 font-medium">Loading Reviews...</p>
          <p className="text-xs text-stone-400 mt-1">Fetching guest feedback</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/owner')}
        className="flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Owner Dashboard</span>
      </button>

      {/* Main Card */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Guest Reviews & Feedback
            </h1>
            <p className="text-xs text-stone-500">
              View guest feedback and respond to reviews
            </p>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={() => loadReviews(true)}
            disabled={refreshing}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Stats Cards */}
        {reviews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <p className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Total Reviews</p>
              <p className="text-2xl font-black text-amber-900">{stats.total}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <p className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Average Rating</p>
              <p className="text-2xl font-black text-emerald-900 flex items-center gap-1">
                {stats.average.toFixed(1)}
                <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-[10px] font-black uppercase text-blue-700 tracking-wider">Responded</p>
              <p className="text-2xl font-black text-blue-900">{stats.withResponses}</p>
            </div>
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <p className="text-[10px] font-black uppercase text-stone-600 tracking-wider">Pending Response</p>
              <p className="text-2xl font-black text-stone-900">{stats.withoutResponses}</p>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-700 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 font-medium">No Reviews Yet</p>
            <p className="text-stone-400 text-xs max-w-sm mx-auto mt-1">
              Guest reviews will appear here once guests submit feedback after their stay.
            </p>
            <button
              onClick={() => navigate('/owner')}
              className="mt-4 px-4 py-2 bg-amber-500 text-stone-950 font-bold text-xs rounded-xl hover:bg-amber-400 transition"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div 
                key={review.id} 
                className={`border rounded-2xl p-5 space-y-4 transition-all ${
                  review.ownerResponse 
                    ? 'border-emerald-200 bg-emerald-50/30' 
                    : 'border-stone-200 hover:border-amber-200'
                }`}
              >
                {/* Guest Info & Rating */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-black text-sm">
                      {getInitials(review.guest?.fullName || review.guest?.name)}
                    </div>
                    <div>
                      <div className="font-bold text-stone-900 text-sm">
                        {review.guest?.fullName || review.guest?.name || 'Guest'}
                      </div>
                      <div className="text-xs text-stone-500">
                        {review.guest?.email || 'No email provided'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-xs font-bold text-amber-600">
                      {getRatingLabel(review.rating)}
                    </span>
                  </div>
                </div>

                {/* Review Content */}
                <div className="bg-white p-4 rounded-xl border border-stone-100">
                  <p className="text-sm text-stone-700 leading-relaxed">
                    "{review.comment || 'No comment provided.'}"
                  </p>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Stay: {formatDate(review.reservation?.checkIn)} - {formatDate(review.reservation?.checkOut)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Reviewed: {formatDate(review.createdAt)}</span>
                  </div>
                  {review.reservation?.roomNumber && (
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Room {review.reservation.roomNumber}</span>
                    </div>
                  )}
                </div>

                {/* Owner Response */}
                {review.ownerResponse ? (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-800 font-bold text-xs mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Your Response</span>
                      <span className="text-[10px] font-normal text-blue-500 ml-auto">
                        {formatDate(review.updatedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-blue-900 leading-relaxed">
                      {review.ownerResponse}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {respondingTo === review.id ? (
                      <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1.5">
                            Your Response
                          </label>
                          <textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Write your professional response to this guest..."
                            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
                            rows={3}
                            maxLength={500}
                          />
                          <div className="text-right text-[10px] text-stone-400 mt-1">
                            {responseText.length}/500 characters
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleRespond(review.id)}
                            disabled={submitting || responseText.trim().length < 10}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {submitting ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                                <span>Submitting...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Submit Response</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleCancelResponse}
                            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs rounded-xl transition"
                          >
                            Cancel
                          </button>
                          {responseText.trim().length > 0 && responseText.trim().length < 10 && (
                            <span className="text-[10px] text-red-500 flex items-center">
                              Minimum 10 characters
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setRespondingTo(review.id);
                          setResponseText('');
                          setError('');
                        }}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl flex items-center gap-2 transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
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

      {/* Quick Tips */}
      {reviews.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider mb-2">
            💡 Best Practices for Responding to Reviews
          </h4>
          <ul className="space-y-1 text-xs text-amber-700">
            <li>• <span className="font-bold">Be grateful:</span> Thank the guest for their feedback</li>
            <li>• <span className="font-bold">Be professional:</span> Keep responses courteous and constructive</li>
            <li>• <span className="font-bold">Address concerns:</span> If there were issues, explain how you're addressing them</li>
            <li>• <span className="font-bold">Be timely:</span> Respond to reviews within 24-48 hours</li>
            <li>• <span className="font-bold">Keep it concise:</span> Be clear and to the point</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default GuestReviews;