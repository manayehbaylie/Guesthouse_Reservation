import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  UserX,
  BedDouble,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  Phone,
  Calendar,
  Smartphone,
  CreditCard,
  Building,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';

export function ReceptionistDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const guesthouseId = user?.guesthouseId || 'gh-1';

  const [guesthouse, setGuesthouse] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active view filter: 'grid', 'arrivals', 'checked_in'
  const [activeTab, setActiveTab] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Receipt Modal state
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const loadFrontDeskData = async () => {
    setLoading(true);
    try {
      const gh = await ApiService.getGuesthouseById(guesthouseId);
      setGuesthouse(gh);

      const rmList = await ApiService.getRoomsForGuesthouse(guesthouseId);
      setRooms(rmList);

      const resList = await ApiService.getReservations({ guesthouseId });
      setReservations(resList);
    } catch (err) {
      console.error('Error loading receptionist data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFrontDeskData();
  }, [guesthouseId]);

  const handleCheckIn = async (reservationId) => {
    try {
      await ApiService.checkInGuest(reservationId);
      loadFrontDeskData();
    } catch (err) {
      alert(err.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async (reservationId) => {
    try {
      await ApiService.checkOutGuest(reservationId);
      loadFrontDeskData();
    } catch (err) {
      alert(err.message || 'Check-out failed');
    }
  };

  const filteredReservations = reservations.filter((res) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = res.guestName.toLowerCase().includes(q);
      const roomMatch = String(res.roomNumber).includes(q);
      const phoneMatch = res.guestPhone.includes(q);
      if (!nameMatch && !roomMatch && !phoneMatch) return false;
    }

    if (activeTab === 'arrivals') return res.status === 'confirmed';
    if (activeTab === 'checked_in') return res.status === 'checked_in';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase text-emerald-700 tracking-wider">
            Front Desk Operations & Check-In Console
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            {guesthouse ? guesthouse.name : 'Guesthouse Reception'}
          </h1>
          <p className="text-xs text-stone-500">
            Location: <strong>{guesthouse?.location}, {guesthouse?.city}</strong> • Receptionist: <strong className="text-stone-900">{user?.name}</strong>
          </p>
        </div>

        <button
          onClick={() => navigate('/search')}
          className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors"
        >
          <span>Open Guest Booking Search</span>
          <ExternalLink className="w-4 h-4 text-amber-400" />
        </button>
      </div>

      {/* Front Desk Key Performance Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <div className="text-xs text-stone-400 font-medium">Occupancy Rate</div>
          <div className="text-2xl font-black text-stone-900">
            {rooms.length > 0
              ? `${Math.round(
                  (rooms.filter((r) => r.availabilityStatus === 'occupied').length / rooms.length) * 100
                )}%`
              : '0%'}
          </div>
          <div className="text-[11px] text-stone-500">
            {rooms.filter((r) => r.availabilityStatus === 'occupied').length} / {rooms.length} Rooms Occupied
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <div className="text-xs text-stone-400 font-medium">Pending Guest Arrivals</div>
          <div className="text-2xl font-black text-amber-700">
            {reservations.filter((r) => r.status === 'confirmed').length} Guests
          </div>
          <div className="text-[11px] text-amber-600 font-bold">Awaiting Key Handover</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <div className="text-xs text-stone-400 font-medium">In-House Active Stays</div>
          <div className="text-2xl font-black text-emerald-700">
            {reservations.filter((r) => r.status === 'checked_in').length} Guests
          </div>
          <div className="text-[11px] text-emerald-600 font-bold">Checked-In At Property</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <div className="text-xs text-stone-400 font-medium">Available Rooms</div>
          <div className="text-2xl font-black text-stone-900">
            {rooms.filter((r) => r.availabilityStatus === 'available').length} Rooms
          </div>
          <div className="text-[11px] text-stone-500">Ready for Guest Bookings</div>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-3">
        <div className="flex gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('grid')}
            className={`pb-2 transition-colors ${
              activeTab === 'grid' ? 'border-b-2 border-amber-500 text-stone-900' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            Live Room Status Grid ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab('arrivals')}
            className={`pb-2 transition-colors ${
              activeTab === 'arrivals' ? 'border-b-2 border-amber-500 text-stone-900' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            Expected Guest Arrivals ({reservations.filter((r) => r.status === 'confirmed').length})
          </button>
          <button
            onClick={() => setActiveTab('checked_in')}
            className={`pb-2 transition-colors ${
              activeTab === 'checked_in' ? 'border-b-2 border-amber-500 text-stone-900' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            In-House Stays ({reservations.filter((r) => r.status === 'checked_in').length})
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search room # or guest name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* View Mode 1: Live Interactive Room Grid */}
      {activeTab === 'grid' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-xs text-stone-500 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Green = Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> Red = Occupied
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Yellow = Maintenance
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {rooms.map((room) => {
              const currentRes = reservations.find(
                (r) => r.roomId === room.id && (r.status === 'confirmed' || r.status === 'checked_in')
              );

              return (
                <div
                  key={room.id}
                  className={`p-4 rounded-3xl border shadow-xs transition-all flex flex-col justify-between h-36 ${
                    room.availabilityStatus === 'available'
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      : room.availabilityStatus === 'occupied'
                      ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                      : 'bg-amber-50/80 border-amber-200 text-amber-950'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-base font-black">Room {room.roomNumber}</span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          room.availabilityStatus === 'available'
                            ? 'bg-emerald-500'
                            : room.availabilityStatus === 'occupied'
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                        }`}
                      ></span>
                    </div>
                    <div className="text-[10px] font-bold opacity-80 mt-0.5">{room.type}</div>
                  </div>

                  {currentRes ? (
                    <div className="space-y-1">
                      <div className="text-xs font-bold truncate">{currentRes.guestName}</div>
                      <div className="text-[10px] opacity-75">{currentRes.status.replace('_', ' ')}</div>
                      {currentRes.status === 'confirmed' && (
                        <button
                          onClick={() => handleCheckIn(currentRes.id)}
                          className="w-full py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold shadow-xs hover:bg-emerald-500"
                        >
                          Check In Guest
                        </button>
                      )}
                      {currentRes.status === 'checked_in' && (
                        <button
                          onClick={() => handleCheckOut(currentRes.id)}
                          className="w-full py-1 bg-stone-900 text-white rounded-lg text-[10px] font-bold hover:bg-stone-800"
                        >
                          Check Out
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-black">{room.pricePerNight.toLocaleString()} ETB / night</div>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-1">Ready for Guest Stay</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View Mode 2 & 3: Guest Lists (Arrivals & Checked In) */}
      {(activeTab === 'arrivals' || activeTab === 'checked_in') && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs font-medium">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Res ID</th>
                <th className="px-6 py-3.5">Guest Name</th>
                <th className="px-6 py-3.5">Phone Number</th>
                <th className="px-6 py-3.5">Room</th>
                <th className="px-6 py-3.5">Check In / Out</th>
                <th className="px-6 py-3.5">Total Rate</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Console Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filteredReservations.map((res) => (
                <tr key={res.id} className="hover:bg-stone-50/50">
                  <td className="px-6 py-4 font-mono font-bold text-stone-900">#{res.id}</td>
                  <td className="px-6 py-4 font-bold text-stone-900">{res.guestName}</td>
                  <td className="px-6 py-4 text-stone-600">{res.guestPhone}</td>
                  <td className="px-6 py-4 font-bold">Room {res.roomNumber} ({res.roomType})</td>
                  <td className="px-6 py-4">{res.checkInDate} to {res.checkOutDate}</td>
                  <td className="px-6 py-4 font-black text-stone-900">{res.totalPrice.toLocaleString()} ETB</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        res.status === 'confirmed'
                          ? 'bg-amber-100 text-amber-800'
                          : res.status === 'checked_in'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {res.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    {res.status === 'confirmed' && (
                      <button
                        onClick={() => handleCheckIn(res.id)}
                        className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-500 shadow-xs"
                      >
                        Check In
                      </button>
                    )}
                    {res.status === 'checked_in' && (
                      <button
                        onClick={() => handleCheckOut(res.id)}
                        className="px-3 py-1 bg-stone-900 text-white font-bold rounded-lg text-xs hover:bg-stone-800"
                      >
                        Check Out
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedReceipt(res)}
                      className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-lg text-xs"
                    >
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Official Printable Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-4 text-xs font-semibold">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 font-black flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-stone-900">Front Desk Guest Receipt</h2>
              <p className="text-[10px] text-stone-500">Official Verification & Confirmation Document</p>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Guest Name:</span>
                <span className="font-bold text-stone-900">{selectedReceipt.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Phone:</span>
                <span className="font-bold text-stone-900">{selectedReceipt.guestPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Room:</span>
                <span className="font-bold text-stone-900">Room {selectedReceipt.roomNumber} ({selectedReceipt.roomType})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Total Fee:</span>
                <span className="font-black text-emerald-700">{selectedReceipt.totalPrice?.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Payment Ref:</span>
                <span className="font-mono text-stone-900 font-bold">TLB-{selectedReceipt.id}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Copy</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold"
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
