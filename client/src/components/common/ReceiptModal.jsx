import React from 'react';
import { CheckCircle, Printer, X, Download, ShieldCheck, Building, Calendar, User, CreditCard } from 'lucide-react';

export const ReceiptModal = ({ reservation, payment, onClose }) => {
  if (!reservation) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-amber-100">
        
        {/* Header / Banner */}
        <div className="bg-gradient-to-r from-amber-800 via-stone-800 to-amber-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-300 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/20 rounded-lg backdrop-blur-sm border border-amber-400/30">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-amber-300 font-semibold">Official Payment Receipt</span>
              <h2 className="text-xl font-bold font-serif text-white">Guesthouse Reservation Platform</h2>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-amber-200/80">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            System-Verified Online Payment & Booking Confirmation
          </div>
        </div>

        {/* Receipt Printable Content */}
        <div id="printable-receipt" className="p-6 md:p-8 space-y-6 text-stone-800">
          
          {/* Status Badge & Reference */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-stone-200 gap-4">
            <div>
              <div className="text-xs text-stone-500 uppercase tracking-wide">Reservation Ref #</div>
              <div className="text-2xl font-mono font-bold text-amber-900">{reservation.id}</div>
              <div className="text-xs text-stone-500 mt-0.5">
                Issued on: {new Date(reservation.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
              </div>
            </div>
            <div className="flex flex-col sm:items-end">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Payment Confirmed
              </span>
              {payment?.referenceNumber && (
                <span className="text-xs font-mono text-stone-500 mt-1">
                  Trans Ref: {payment.referenceNumber}
                </span>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-stone-50/70 p-5 rounded-xl border border-stone-200/80">
            {/* Property */}
            <div>
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-amber-700" /> Property Details
              </h3>
              <p className="font-bold text-stone-900 text-base">{reservation.guesthouseName}</p>
              <p className="text-xs text-stone-600">{reservation.guesthouseLocation}</p>
              <p className="text-xs text-stone-600 mt-1">
                Room: <span className="font-semibold text-stone-800">{reservation.roomNumber} ({reservation.roomType})</span>
              </p>
            </div>

            {/* Guest */}
            <div>
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-700" /> Guest Details
              </h3>
              <p className="font-bold text-stone-900 text-base">{reservation.guestName}</p>
              <p className="text-xs text-stone-600">{reservation.guestPhone}</p>
              <p className="text-xs text-stone-600">{reservation.guestEmail}</p>
            </div>
          </div>

          {/* Stay Dates */}
          <div className="flex items-center justify-between bg-amber-50/50 p-4 rounded-xl border border-amber-200/60">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-amber-800" />
              <div>
                <div className="text-xs text-amber-900/70 font-medium">Check-In / Check-Out</div>
                <div className="text-sm font-semibold text-stone-900">
                  {reservation.checkInDate} &rarr; {reservation.checkOutDate}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-amber-900/70 font-medium">Duration</span>
              <div className="text-sm font-bold text-amber-900">{reservation.nightsCount} Night{reservation.nightsCount > 1 ? 's' : ''}</div>
            </div>
          </div>

          {/* Financial Itemization */}
          <div>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Payment Summary</h3>
            <div className="space-y-2 text-sm border-t border-b border-stone-200 py-3">
              <div className="flex justify-between text-stone-600">
                <span>Room Rate ({reservation.nightsCount} night{reservation.nightsCount > 1 ? 's' : ''})</span>
                <span className="font-mono">{reservation.totalPrice.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Service Fee & Tax (Included)</span>
                <span className="font-mono">0.00 ETB</span>
              </div>
              <div className="flex justify-between items-center text-stone-600 pt-1">
                <span className="flex items-center gap-1.5 text-xs text-stone-500">
                  <CreditCard className="w-3.5 h-3.5 text-stone-400" />
                  Payment Method:
                </span>
                <span className="font-semibold uppercase text-xs bg-stone-100 text-stone-800 px-2 py-0.5 rounded border border-stone-300">
                  {payment?.method || 'Online'}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <div>
                <div className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Total Amount Paid</div>
                <div className="text-2xl font-mono font-extrabold text-amber-900">
                  {reservation.totalPrice.toLocaleString()} <span className="text-sm font-normal text-stone-600">ETB</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-stone-400 font-mono">Processed by Platform Engine</div>
                <div className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full mt-1">
                  Verified & Audit Stored
                </div>
              </div>
            </div>
          </div>

          {/* Verification Footnote */}
          <div className="bg-stone-100 p-3 rounded-lg text-center text-xs text-stone-500 border border-stone-200">
            This digital receipt is generated automatically by the Guesthouse Reservation Platform.
            Present this voucher upon check-in at {reservation.guesthouseName}.
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-amber-800 hover:bg-amber-900 rounded-lg shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
        </div>

      </div>
    </div>
  );
};
