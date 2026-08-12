import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Calendar, Building, MapPin, Printer, CheckCircle, Clock, ShieldCheck, FileText } from 'lucide-react';

export function GuestBookings() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceiptRes, setSelectedReceiptRes] = useState(null);

  useEffect(() => {
    async function loadBookings() {
      if (!user) return;
      setLoading(true);
      try {
        const resList = await ApiService.getReservations({ guestId: user.id });
        setReservations(resList);
      } catch (err) {
        console.error('Failed to load guest reservations:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">My Reservations & Receipts</h1>
        <p className="text-xs text-stone-500">Track active check-ins, upcoming stays, and access official payment receipts</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-stone-200 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3">
          <Calendar className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">No Reservations Found</h3>
          <p className="text-xs text-stone-500">You have no active or historical bookings on this account.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((res) => (
            <div
              key={res.id}
              className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-stone-500">#{res.id}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      res.status === 'confirmed'
                        ? 'bg-amber-100 text-amber-800'
                        : res.status === 'checked_in'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {res.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-stone-900">{res.guesthouseName}</h3>
                <p className="text-xs text-stone-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{res.guesthouseLocation}</span>
                </p>

                <div className="flex items-center gap-4 text-xs font-medium text-stone-700 pt-1">
                  <span>Room: <strong>{res.roomNumber} ({res.roomType})</strong></span>
                  <span>Dates: <strong>{res.checkInDate}</strong> to <strong>{res.checkOutDate}</strong> ({res.nightsCount} nights)</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-stone-100">
                <div className="text-right">
                  <div className="text-xs text-stone-400">Total Paid</div>
                  <div className="text-lg font-black text-stone-900">{res.totalPrice.toLocaleString()} ETB</div>
                </div>

                <button
                  onClick={() => setSelectedReceiptRes(res)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>View Receipt</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceiptRes && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-stone-200 shadow-2xl space-y-6">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 font-bold flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-stone-900">Official Guest Receipt</h2>
              <p className="text-[11px] text-stone-500">Guesthouse Reservation Platform Verification</p>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Reservation ID:</span>
                <span className="font-mono font-bold text-stone-900">{selectedReceiptRes.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Guest Name:</span>
                <span className="font-bold text-stone-900">{selectedReceiptRes.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Property:</span>
                <span className="font-bold text-stone-900">{selectedReceiptRes.guesthouseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Room:</span>
                <span className="font-bold text-stone-900">Room {selectedReceiptRes.roomNumber} ({selectedReceiptRes.roomType})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Check-In / Out:</span>
                <span className="font-bold text-stone-900">{selectedReceiptRes.checkInDate} - {selectedReceiptRes.checkOutDate}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-200">
                <span className="text-stone-500 font-bold">Total Amount Paid:</span>
                <span className="font-black text-emerald-700 text-sm">{selectedReceiptRes.totalPrice.toLocaleString()} ETB</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setSelectedReceiptRes(null)}
                className="px-4 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
