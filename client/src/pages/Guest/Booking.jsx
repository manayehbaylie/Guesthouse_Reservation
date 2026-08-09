import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Calendar,
  CreditCard,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Building2,
  Receipt,
  Printer,
} from 'lucide-react';

export function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const guesthouseId = searchParams.get('guesthouseId');
  const roomId = searchParams.get('roomId');

  const [guesthouse, setGuesthouse] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [checkInDate, setCheckInDate] = useState('2026-08-06');
  const [checkOutDate, setCheckOutDate] = useState('2026-08-09');
  const [paymentMethod, setPaymentMethod] = useState('telebirr');
  const [phone, setPhone] = useState(user?.phone || '+251 91 123 4567');

  const [step, setStep] = useState('checkout'); // 'checkout' | 'processing' | 'success'
  const [error, setError] = useState(null);
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (guesthouseId) {
          const gh = await ApiService.getGuesthouseById(guesthouseId);
          setGuesthouse(gh);
          if (gh && roomId) {
            const rmList = await ApiService.getRoomsForGuesthouse(gh.id);
            setRoom(rmList.find((r) => r.id === roomId) || rmList[0]);
          }
        }
      } catch (err) {
        console.error('Error initializing booking flow:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [guesthouseId, roomId]);

  // Price calculations
  const inTime = new Date(checkInDate).getTime();
  const outTime = new Date(checkOutDate).getTime();
  const nightsCount = Math.max(1, Math.round((outTime - inTime) / (1000 * 3600 * 24)));
  const totalPrice = room ? room.pricePerNight * nightsCount : 0;

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setError(null);
    setStep('processing');

    try {
      const res = await ApiService.createBookingAndPay({
        guesthouseId: guesthouse.id,
        roomId: room.id,
        checkInDate,
        checkOutDate,
        nightsCount,
        paymentMethod,
        phone,
      });

      setResultData(res);
      setStep('success');
    } catch (err) {
      setStep('checkout');
      setError(err.message || 'Payment failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800 mx-auto"></div>
      </div>
    );
  }

  if (!guesthouse || !room) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-stone-800">Invalid Booking Details</h2>
        <button
          onClick={() => navigate('/search')}
          className="px-4 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs"
        >
          Select a Room
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Complete Your Booking</h1>
        <p className="text-xs text-stone-500">Instant Automated Confirmation & Verified Local Payment Gateway</p>
      </div>

      {step === 'processing' && (
        <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-4 shadow-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <h3 className="text-base font-bold text-stone-900">Communicating with Gateway...</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Verifying your {paymentMethod.toUpperCase()} transaction and locking room calendar.
          </p>
        </div>
      )}

      {step === 'success' && resultData && (
        <div className="bg-white p-8 rounded-3xl border border-emerald-200 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto font-bold">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-stone-900">Booking & Payment Verified!</h2>
            <p className="text-xs text-stone-500">
              Reservation Code: <strong className="text-stone-900">{resultData.reservation.id}</strong>
            </p>
          </div>

          <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-stone-500">Property:</span>
              <span className="font-bold text-stone-900">{guesthouse.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Room:</span>
              <span className="font-bold text-stone-900">Room {room.roomNumber} ({room.type})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Dates:</span>
              <span className="font-bold text-stone-900">{checkInDate} to {checkOutDate} ({nightsCount} nights)</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-stone-200">
              <span className="text-stone-500 font-bold">Amount Paid:</span>
              <span className="font-black text-emerald-700">{totalPrice.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Payment Reference:</span>
              <span className="font-mono text-stone-700">{resultData.payment.referenceNumber}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 py-2.5 bg-stone-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Receipt</span>
            </button>
            <button
              onClick={() => navigate('/reservations')}
              className="flex-1 py-2.5 bg-amber-500 text-stone-950 rounded-xl font-bold text-xs text-center"
            >
              View My Reservations
            </button>
          </div>
        </div>
      )}

      {step === 'checkout' && (
        <form onSubmit={handleProcessPayment} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Dates Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700">1. Reservation Dates</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Check-In</label>
                  <input
                    type="date"
                    required
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Check-Out</label>
                  <input
                    type="date"
                    required
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700">2. Select Payment Method</h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('telebirr')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    paymentMethod === 'telebirr'
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-blue-600 mb-1" />
                  <div className="font-bold text-xs text-stone-900">Telebirr</div>
                  <div className="text-[9px] text-stone-500">Ethio Telecom</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('chapa')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    paymentMethod === 'chapa'
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-emerald-600 mb-1" />
                  <div className="font-bold text-xs text-stone-900">Chapa</div>
                  <div className="text-[9px] text-stone-500">Debit / Local Cards</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    paymentMethod === 'card'
                      ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-500'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-purple-600 mb-1" />
                  <div className="font-bold text-xs text-stone-900">Bank Transfer</div>
                  <div className="text-[9px] text-stone-500">CBE / Dashen / Awash</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                Mobile Number for Confirmation
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <span>Pay & Confirm Reservation ({totalPrice.toLocaleString()} ETB)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Booking Summary */}
          <div className="bg-stone-900 text-stone-100 p-6 rounded-3xl space-y-4 h-fit">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">Order Summary</h3>
            <div className="space-y-2 text-xs border-b border-stone-800 pb-4">
              <div className="font-bold text-white text-sm">{guesthouse.name}</div>
              <div className="text-stone-400">Room {room.roomNumber} ({room.type})</div>
              <div className="text-stone-400">{nightsCount} nights stay</div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-stone-400">
                <span>Room Rate:</span>
                <span>{room.pricePerNight.toLocaleString()} ETB / night</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Tax & Service:</span>
                <span className="text-emerald-400 font-semibold">Included</span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-stone-800">
                <span>Total Amount:</span>
                <span className="text-amber-400">{totalPrice.toLocaleString()} ETB</span>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
