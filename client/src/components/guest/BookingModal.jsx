import React, { useState } from 'react';
import { ApiService } from '../../services/api';
import {
  X,
  Calendar,
  CreditCard,
  PhoneCall,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Building,
  Smartphone,
  Lock,
  Loader2,
} from 'lucide-react';

export const BookingModal = ({
  guesthouse,
  room,
  onClose,
  onSuccess,
}) => {
  if (!guesthouse || !room) return null;

  const currentUser = ApiService.getCurrentUser();

  const [checkInDate, setCheckInDate] = useState('2026-08-06');
  const [checkOutDate, setCheckOutDate] = useState('2026-08-09');
  const [paymentMethod, setPaymentMethod] = useState('telebirr');
  const [telebirrPhone, setTelebirrPhone] = useState(currentUser?.phone || '+251 91 123 4567');
  
  const [step, setStep] = useState('details');
  const [error, setError] = useState(null);

  // Nights calculation
  const inTime = new Date(checkInDate).getTime();
  const outTime = new Date(checkOutDate).getTime();
  const nightsCount = Math.max(1, Math.round((outTime - inTime) / (1000 * 3600 * 24)));
  const totalPrice = room.pricePerNight * nightsCount;

  const handleConfirmAndPay = async (e) => {
    e.preventDefault();
    setError(null);

    if (inTime >= outTime) {
      setError('Check-out date must be after check-in date (Minimum stay is 1 night).');
      return;
    }

    setStep('processing');

    // Simulate real-time System payment verification & automated reservation creation (2 seconds)
    setTimeout(async () => {
      try {
        const { reservation, payment } = await ApiService.createBookingAndPay({
          guesthouseId: guesthouse.id,
          roomId: room.id,
          checkInDate,
          checkOutDate,
          nightsCount,
          paymentMethod,
        });

        setStep('confirmed');
        onSuccess(reservation, payment);
      } catch (err) {
        setStep('details');
        setError(err.message || 'Payment verification failed. Please try again.');
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200 my-8">
        
        {/* Top Header */}
        <div className="bg-stone-900 text-white p-6 relative">
          <button
            onClick={onClose}
            disabled={step === 'processing'}
            className="absolute top-4 right-4 text-stone-400 hover:text-white p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
              System Automated Checkout
            </span>
          </div>
          <h2 className="text-xl font-bold font-serif text-amber-100">
            Book Accommodation & Online Payment
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {guesthouse.name} &bull; Room {room.roomNumber} ({room.type})
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-6">
          
          {error && (
            <div className="p-4 rounded-xl bg-red-50 text-red-800 text-xs font-semibold border border-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <Loader2 className="w-16 h-16 text-amber-800 animate-spin" />
                <Smartphone className="w-6 h-6 text-amber-900 absolute inset-0 m-auto" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-stone-900 text-lg">System Verifying {paymentMethod.toUpperCase()} Payment...</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Performing automated double-booking availability lock and recording transaction...
                </p>
              </div>
            </div>
          )}

          {step === 'details' && (
            <form onSubmit={handleConfirmAndPay} className="space-y-6">
              
              {/* Stay Dates Selection */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-800" /> Stay Duration & Dates
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">Check-In Date</label>
                    <input
                      type="date"
                      required
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">Check-Out Date</label>
                    <input
                      type="date"
                      required
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-amber-950 font-medium pt-1">
                  <span>Calculated Stay: <strong>{nightsCount} Night{nightsCount > 1 ? 's' : ''}</strong></span>
                  <span>Rate: <strong>{room.pricePerNight.toLocaleString()} ETB / night</strong></span>
                </div>
              </div>

              {/* Payment Gateway Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500">
                  Select Online Payment Gateway
                </label>

                <div className="grid grid-cols-3 gap-3">
                  
                  {/* Telebirr */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('telebirr')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      paymentMethod === 'telebirr'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 text-emerald-950'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center justify-between">
                      Telebirr
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                    </span>
                    <span className="text-[10px] text-stone-500 mt-2">Ethio Telecom Mobile Money</span>
                  </button>

                  {/* Chapa */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('chapa')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      paymentMethod === 'chapa'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 text-emerald-950'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center justify-between">
                      Chapa
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                    </span>
                    <span className="text-[10px] text-stone-500 mt-2">Ethiopian Payment Gateway</span>
                  </button>

                  {/* International Card */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      paymentMethod === 'card'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 text-emerald-950'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center justify-between">
                      Card
                      <Lock className="w-4 h-4 text-emerald-600" />
                    </span>
                    <span className="text-[10px] text-stone-500 mt-2">Visa / Mastercard</span>
                  </button>

                </div>
              </div>

              {/* Payment Details Input */}
              {paymentMethod === 'telebirr' && (
                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider">Telebirr Mobile Payment</label>
                    <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">USSD *127# Simulation</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Telebirr Account Phone</label>
                      <input
                        type="text"
                        required
                        value={telebirrPhone}
                        onChange={(e) => setTelebirrPhone(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Telebirr Security PIN</label>
                      <input
                        type="password"
                        maxLength={4}
                        defaultValue="1234"
                        placeholder="••••"
                        className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-800 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    Automated Ethio Telecom API verification will instantly lock room & deduct {totalPrice.toLocaleString()} ETB.
                  </p>
                </div>
              )}

              {paymentMethod === 'chapa' && (
                <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-blue-950 uppercase tracking-wider">Chapa Payment Gateway</label>
                    <span className="text-[10px] font-mono font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded">Ethiopian Banks</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">Select Ethiopian Bank / Mobile Wallet</label>
                    <select className="w-full px-3.5 py-2 rounded-xl border border-blue-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white">
                      <option>Commercial Bank of Ethiopia (CBE Birr)</option>
                      <option>Telebirr via Chapa</option>
                      <option>Awash Bank (AwashBirr)</option>
                      <option>Dashen Bank (Amole)</option>
                      <option>Bank of Abyssinia (Apollo)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Price Summary */}
              <div className="border-t border-stone-200 pt-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold block">Total Payable Amount</span>
                  <span className="text-2xl font-mono font-extrabold text-amber-900">
                    {totalPrice.toLocaleString()} <span className="text-xs font-normal text-stone-600">ETB</span>
                  </span>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-amber-800 hover:bg-amber-900 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" /> Pay & Generate Voucher
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
