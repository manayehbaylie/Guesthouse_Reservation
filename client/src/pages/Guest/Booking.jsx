import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ApiService } from '../../services/api.js';
import {
  Calendar,
  Users,
  CreditCard,
  Smartphone,
  Building2,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  Bed,
  Shield,
  Banknote,
  Wallet,
  Star,
  LogIn,
  Home,
} from 'lucide-react';

export function Booking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { guesthouseId, roomId } = useParams();

  const bookingData = location.state?.bookingData || {};

  const [guesthouse, setGuesthouse] = useState(bookingData.guesthouse || null);
  const [room, setRoom] = useState(bookingData.room || null);
  const [loading, setLoading] = useState(true);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [nights, setNights] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);

  useEffect(() => {
    loadBookingData();
  }, [guesthouseId, roomId]);

  const loadBookingData = async () => {
    setLoading(true);
    try {
      if (bookingData.guesthouse && bookingData.room) {
        setGuesthouse(bookingData.guesthouse);
        setRoom(bookingData.room);
        setLoading(false);
        return;
      }

      if (guesthouseId) {
        const gh = await ApiService.getGuesthouseById(guesthouseId);
        setGuesthouse(gh);
      }

      if (roomId) {
        const rooms = await ApiService.getRoomsForGuesthouse(guesthouseId);
        const foundRoom = rooms.find(r => String(r.id) === String(roomId));
        setRoom(foundRoom);
      }
    } catch (error) {
      console.error('Error loading booking data:', error);
      setError('Failed to load booking details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (checkInDate && checkOutDate && room) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const diffTime = Math.abs(checkOut - checkIn);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        setNights(diffDays);
        setTotalPrice(diffDays * (room.pricePerNight || room.price || 0));
      } else {
        setNights(0);
        setTotalPrice(0);
      }
    }
  }, [checkInDate, checkOutDate, room]);

  // ✅ Check availability - redirect to login, then dashboard with booking data
  const handleCheckAvailability = async () => {
    if (!user) {
      // ✅ Save booking data to localStorage
      const bookingDataToSave = {
        guesthouseId: guesthouse?.id,
        roomId: room?.id,
        guesthouse: guesthouse,
        room: room,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        numberOfGuests: numberOfGuests,
        nights: nights,
        totalPrice: totalPrice,
        showPayment: true, // Flag to show payment on dashboard
      };
      localStorage.setItem('pendingBooking', JSON.stringify(bookingDataToSave));
      
      // ✅ Redirect to login - after login, go to dashboard
      navigate('/login', { 
        state: { 
          from: '/booking',
          redirectTo: '/guest/dashboard' // Go to dashboard after login
        } 
      });
      return;
    }

    if (!checkInDate || !checkOutDate) {
      setError('Please select both check-in and check-out dates.');
      return;
    }

    if (numberOfGuests < 1) {
      setError('Please select at least 1 guest.');
      return;
    }

    setCheckingAvailability(true);
    setError('');

    try {
      const reservations = await ApiService.getReservations({ 
        guesthouseId: guesthouse?.id 
      });

      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);

      const isBooked = reservations.some(reservation => {
        if (String(reservation.roomId) !== String(room?.id)) return false;
        
        const resCheckIn = new Date(reservation.checkInDate);
        const resCheckOut = new Date(reservation.checkOutDate);
        
        return (checkIn < resCheckOut && checkOut > resCheckIn) &&
               (reservation.status !== 'cancelled' && reservation.status !== 'checked_out');
      });

      if (isBooked) {
        setError('This room is not available for the selected dates. Please choose different dates.');
      } else {
        // ✅ Save to localStorage and redirect to dashboard
        const bookingDataToSave = {
          guesthouseId: guesthouse?.id,
          roomId: room?.id,
          guesthouse: guesthouse,
          room: room,
          checkInDate: checkInDate,
          checkOutDate: checkOutDate,
          numberOfGuests: numberOfGuests,
          nights: nights,
          totalPrice: totalPrice,
          showPayment: true,
        };
        localStorage.setItem('pendingBooking', JSON.stringify(bookingDataToSave));
        
        // ✅ Go to dashboard with payment
        navigate('/guest/dashboard', { 
          state: { 
            showPayment: true,
            bookingData: bookingDataToSave
          } 
        });
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      if (error?.response?.status === 401) {
        const bookingDataToSave = {
          guesthouseId: guesthouse?.id,
          roomId: room?.id,
          guesthouse: guesthouse,
          room: room,
          checkInDate: checkInDate,
          checkOutDate: checkOutDate,
          numberOfGuests: numberOfGuests,
          nights: nights,
          totalPrice: totalPrice,
          showPayment: true,
        };
        localStorage.setItem('pendingBooking', JSON.stringify(bookingDataToSave));
        navigate('/login', { 
          state: { 
            from: '/booking',
            redirectTo: '/guest/dashboard'
          } 
        });
      } else {
        setError('Failed to check availability. Please try again.');
      }
    } finally {
      setCheckingAvailability(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const roundedRating = Math.round(rating || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= roundedRating
              ? 'fill-amber-400 text-amber-400'
              : 'text-stone-200'
          }`}
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-stone-500">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!guesthouse || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="max-w-md mx-auto text-center py-16">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-stone-800">Booking Not Found</h2>
          <p className="text-stone-500 mt-2">The room or guesthouse you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/guest/search')}
            className="mt-6 px-6 py-2.5 bg-amber-500 text-stone-950 font-bold rounded-xl hover:bg-amber-400 transition"
          >
            Find Guesthouses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-black">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black text-stone-900">Guesthouse</span>
              <span className="text-lg font-black text-amber-500"> Platform</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/guest/search')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 transition"
          >
            Browse More →
          </button>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-stone-900 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Guesthouse
        </button>

        {/* Guesthouse Info */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-stone-900">Check Your Stay</h1>
              <p className="text-sm text-stone-500">
                {guesthouse.name} • {guesthouse.city}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {renderStars(guesthouse.rating)}
              </div>
              <span className="text-sm font-bold text-stone-900">
                {Number(guesthouse.rating || 0).toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-3 justify-center">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-amber-600' : 'text-stone-300'}`}>
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <span className="text-xs font-bold">Check Stay</span>
          </div>
          <div className="w-12 h-0.5 bg-stone-200" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-amber-600' : 'text-stone-300'}`}>
            <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-500 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <span className="text-xs font-bold">Payment</span>
          </div>
          <div className="w-12 h-0.5 bg-stone-200" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-amber-600' : 'text-stone-300'}`}>
            <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-500 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <span className="text-xs font-bold">Confirm</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* CHECK YOUR STAY */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            Check Your Stay
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Select your dates and number of guests before continuing.
          </p>

          {/* Selected Room */}
          <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200">
            <p className="text-xs text-stone-500">Selected Room</p>
            <p className="font-bold text-stone-900">Room {room.roomNumber} • {room.type}</p>
            <p className="text-xs text-stone-500">Max {room.capacity} guests</p>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5">
                Check-in Date *
              </label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-1.5">
                Check-out Date *
              </label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                min={checkInDate || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-bold text-stone-700 mb-1.5">
              Number of Guests *
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setNumberOfGuests(Math.max(1, numberOfGuests - 1))}
                className="w-10 h-10 rounded-xl border border-stone-300 flex items-center justify-center font-bold text-lg hover:bg-stone-50 transition"
              >
                -
              </button>
              <span className="text-lg font-bold text-stone-900 min-w-[60px] text-center">
                {numberOfGuests}
              </span>
              <button
                type="button"
                onClick={() => setNumberOfGuests(Math.min(room.capacity || 10, numberOfGuests + 1))}
                className="w-10 h-10 rounded-xl border border-stone-300 flex items-center justify-center font-bold text-lg hover:bg-stone-50 transition"
              >
                +
              </button>
              <span className="text-sm text-stone-500">
                Max {room.capacity} guests
              </span>
            </div>
          </div>

          {/* Check Availability Button */}
          <div className="mt-6 pt-6 border-t border-stone-200">
            <button
              type="button"
              onClick={handleCheckAvailability}
              disabled={checkingAvailability || !checkInDate || !checkOutDate}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {checkingAvailability ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  Checking Availability...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Check Availability
                </>
              )}
            </button>
            <p className="text-xs text-stone-400 text-center mt-2">
              Your room is checked for availability before the reservation is confirmed.
            </p>
            {!user && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                <LogIn className="w-4 h-4 text-amber-600" />
                <p className="text-xs text-amber-700">
                  Please log in to check availability and book your stay.
                </p>
              </div>
            )}
          </div>

          {/* Price Preview */}
          {nights > 0 && (
            <div className="mt-4 p-4 bg-stone-50 rounded-xl border border-stone-200">
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">{nights} night{nights > 1 ? 's' : ''}</span>
                <span className="font-bold text-stone-900">
                  {totalPrice.toLocaleString()} ETB
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-stone-600">Room: {room.roomNumber}</span>
                <span className="text-stone-600">{numberOfGuests} guest{numberOfGuests > 1 ? 's' : ''}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-xs text-stone-400">
            © 2026 Guesthouse Platform. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
}

export default Booking;