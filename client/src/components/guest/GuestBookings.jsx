import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { Calendar, Building, MapPin, Printer, CheckCircle, Clock, ShieldCheck, FileText } from 'lucide-react';

export const GuestBookings = ({ onViewReceipt }) => {
  const [reservations, setReservations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = ApiService.getCurrentUser();

  const loadData = async () => {
    setLoading(true);
    try {
      if (currentUser) {
        const list = await ApiService.getReservations({ guestId: currentUser.id });
        setReservations(list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-200 pb-4 gap-2">
        <div>
          <h1 className="text-2xl font-bold font-serif text-stone-900">My Reservation History</h1>
          <p className="text-xs text-stone-500">
            View your upcoming stays, checked-in status, and instant payment vouchers.
          </p>
        </div>
        <div className="text-xs font-mono bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl font-semibold">
          Guest Account: {currentUser?.name}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-stone-500">Loading reservation records...</div>
      ) : reservations.length === 0 ? (
        <div className="bg-stone-50 rounded-2xl p-12 text-center border border-stone-200 space-y-3">
          <Calendar className="w-12 h-12 text-stone-400 mx-auto" />
          <h3 className="font-bold text-stone-800 text-lg">No Reservations Found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            You have not booked any guesthouse stays yet. Search guesthouses to make your first online reservation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((res) => (
            <div
              key={res.id}
              className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-extrabold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-md">
                    {res.id}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                    res.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                    res.status === 'checked_in' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    res.status === 'checked_out' ? 'bg-stone-100 text-stone-700 border-stone-300' : 'bg-red-100 text-red-800'
                  }`}>
                    {res.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-stone-400 font-mono">
                    Booked on {new Date(res.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-stone-900 text-lg">{res.guesthouseName}</h3>
                  <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-800" /> {res.guesthouseLocation} &bull; Room {res.roomNumber} ({res.roomType})
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200/80 w-fit">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-800" />
                    <span>{res.checkInDate} &rarr; {res.checkOutDate}</span>
                  </div>
                  <span className="text-stone-300">|</span>
                  <span className="font-semibold text-stone-900">{res.nightsCount} Night{res.nightsCount > 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Price & Receipt Action */}
              <div className="flex md:flex-col justify-between items-end gap-4 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-stone-100">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Total Paid</span>
                  <span className="text-xl font-mono font-extrabold text-amber-900">
                    {res.totalPrice.toLocaleString()} <span className="text-xs font-normal text-stone-600">ETB</span>
                  </span>
                </div>

                <button
                  onClick={() => onViewReceipt(res)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 font-semibold text-xs rounded-xl shadow-sm transition-colors border border-stone-700"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" /> View Receipt
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
