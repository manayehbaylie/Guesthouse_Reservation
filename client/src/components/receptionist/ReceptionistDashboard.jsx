import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import {
  UserCheck,
  UserX,
  Calendar,
  Building,
  CheckCircle,
  Clock,
  RefreshCw,
  LogOut,
  SlidersHorizontal,
  BedDouble,
  ShieldCheck,
  AlertCircle,
  Plus,
  Printer,
  X,
  CreditCard,
  UserPlus,
} from 'lucide-react';

export const ReceptionistDashboard = () => {
  const currentUser = ApiService.getCurrentUser();
  const guesthouseId = currentUser?.guesthouseId || 'gh-1';

  const [guesthouse, setGuesthouse] = useState(null);
  const [arrivals, setArrivals] = useState([]);
  const [departures, setDepartures] = useState([]);
  const [allReservations, setAllReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('arrivals');

  // Walk-In Guest Modal State
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('+251 9');
  const [walkInEmail, setWalkInEmail] = useState('');
  const [walkInRoomId, setWalkInRoomId] = useState('');
  const [walkInNights, setWalkInNights] = useState(1);
  const [walkInPayMethod, setWalkInPayMethod] = useState<'telebirr' | 'chapa' | 'card'>('telebirr');
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const gh = await ApiService.getGuesthouseById(guesthouseId);
      setGuesthouse(gh);

      const arr = await ApiService.getReceptionistArrivals(guesthouseId);
      setArrivals(arr);

      const dep = await ApiService.getReceptionistDepartures(guesthouseId);
      setDepartures(dep);

      const resList = await ApiService.getReservations({ guesthouseId });
      setAllReservations(resList);

      const roomList = await ApiService.getRoomsForGuesthouse(guesthouseId);
      setRooms(roomList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [guesthouseId]);

  const handleCheckIn = async (resId) => {
    try {
      await ApiService.performCheckIn(resId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Check-in error');
    }
  };

  const handleCheckOut = async (resId) => {
    try {
      await ApiService.performCheckOut(resId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Check-out error');
    }
  };

  const handleToggleRoomStatus = async (roomId, currentStatus) => {
    const nextStatus = currentStatus === 'available' ? 'unavailable' : 'available';
    try {
      await ApiService.updateRoomAvailability(roomId, nextStatus);
      await loadData();
    } catch (err) {
      alert(err.message || 'Room status toggle error');
    }
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    if (!walkInRoomId) {
      alert('Please select an available room.');
      return;
    }

    setIsSubmittingWalkIn(true);
    try {
      // Calculate dates
      const today = new Date();
      const checkInStr = today.toISOString().split('T')[0];
      const outDate = new Date(today);
      outDate.setDate(outDate.getDate() + Number(walkInNights));
      const checkOutStr = outDate.toISOString().split('T')[0];

      const { reservation } = await ApiService.createBookingAndPay({
        guesthouseId,
        roomId: walkInRoomId,
        checkInDate: checkInStr,
        checkOutDate: checkOutStr,
        nightsCount: Number(walkInNights),
        paymentMethod: walkInPayMethod,
      });

      // Automatically perform check-in for walk-in guest
      await ApiService.performCheckIn(reservation.id);

      setIsWalkInOpen(false);
      setWalkInName('');
      setWalkInPhone('+251 9');
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to process walk-in guest.');
    } finally {
      setIsSubmittingWalkIn(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Property Header */}
      <div className="bg-gradient-to-r from-blue-950 via-stone-900 to-stone-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-blue-900/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full">
              Front Desk Staff Module
            </span>
            <span className="text-xs text-stone-400 font-mono">
              Staff: {currentUser?.name}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-white">
            {guesthouse?.name || 'Front Desk Operations'}
          </h1>
          <p className="text-xs text-stone-300 mt-1 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-blue-400" />
            {guesthouse?.location || 'Property Location'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsWalkInOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Front Desk Walk-In Check-In
          </button>

          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-xs font-semibold rounded-xl border border-blue-700/50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh State
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Today's Arrivals</span>
            <span className="text-2xl font-mono font-extrabold text-blue-900">{arrivals.length}</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Today's Departures</span>
            <span className="text-2xl font-mono font-extrabold text-amber-900">{departures.length}</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <UserX className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Occupied Rooms</span>
            <span className="text-2xl font-mono font-extrabold text-emerald-900">
              {allReservations.filter((r) => r.status === 'checked_in').length}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <BedDouble className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Available Inventory</span>
            <span className="text-2xl font-mono font-extrabold text-stone-900">
              {rooms.filter((r) => r.availabilityStatus === 'available').length} / {rooms.length}
            </span>
          </div>
          <div className="p-3 bg-stone-100 text-stone-700 rounded-xl">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex bg-stone-200 p-1 rounded-2xl max-w-2xl text-xs font-bold">
        <button
          onClick={() => setActiveTab('arrivals')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'arrivals' ? 'bg-white text-blue-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Today's Arrivals ({arrivals.length})
        </button>
        <button
          onClick={() => setActiveTab('departures')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'departures' ? 'bg-white text-amber-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Today's Departures ({departures.length})
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'rooms' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Room Status Control ({rooms.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'all' ? 'bg-white text-purple-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          All Reservations ({allReservations.length})
        </button>
      </div>

      {/* Tab Content: Arrivals */}
      {activeTab === 'arrivals' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-stone-200 bg-stone-50">
            <h2 className="font-bold text-stone-900 text-base">Arrivals Requiring Guest Check-In</h2>
            <p className="text-xs text-stone-500">System verified reservations scheduled for arrival today.</p>
          </div>

          {arrivals.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-xs">No pending guest arrivals for today.</div>
          ) : (
            <div className="divide-y divide-stone-200">
              {arrivals.map((res) => (
                <div key={res.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                        {res.id}
                      </span>
                      <span className="font-bold text-stone-900 text-sm">Guest: {res.guestName}</span>
                    </div>
                    <p className="text-xs text-stone-500">
                      Phone: <span className="font-mono">{res.guestPhone}</span> &bull; Room {res.roomNumber} ({res.roomType})
                    </p>
                    <p className="text-xs text-stone-500">
                      Dates: {res.checkInDate} to {res.checkOutDate} ({res.nightsCount} night{res.nightsCount > 1 ? 's' : ''})
                    </p>
                  </div>

                  <button
                    onClick={() => handleCheckIn(res.id)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <CheckCircle className="w-4 h-4" /> Perform Guest Check-In
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Departures */}
      {activeTab === 'departures' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-stone-200 bg-stone-50">
            <h2 className="font-bold text-stone-900 text-base">Departures Requiring Guest Check-Out</h2>
            <p className="text-xs text-stone-500">Guests currently checked in scheduled to depart today.</p>
          </div>

          {departures.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-xs">No guest departures scheduled for today.</div>
          ) : (
            <div className="divide-y divide-stone-200">
              {departures.map((res) => (
                <div key={res.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                        {res.id}
                      </span>
                      <span className="font-bold text-stone-900 text-sm">Guest: {res.guestName}</span>
                    </div>
                    <p className="text-xs text-stone-500">
                      Phone: <span className="font-mono">{res.guestPhone}</span> &bull; Room {res.roomNumber} ({res.roomType})
                    </p>
                  </div>

                  <button
                    onClick={() => handleCheckOut(res.id)}
                    className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <UserX className="w-4 h-4" /> Perform Guest Check-Out
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Room Status Control */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs text-stone-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              Receptionists can update room availability (Available / Unavailable) manually, e.g. after check-out or for maintenance.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((rm) => {
              const isAvailable = rm.availabilityStatus === 'available';

              return (
                <div key={rm.id} className="bg-white p-5 rounded-2xl border border-stone-200 space-y-3 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                        Room {rm.roomNumber}
                      </span>
                      <h3 className="font-bold text-stone-900 text-base mt-1">{rm.type}</h3>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {rm.availabilityStatus}
                    </span>
                  </div>

                  <div className="text-xs text-stone-500 font-mono">
                    Rate: {rm.pricePerNight.toLocaleString()} ETB / night
                  </div>

                  <button
                    onClick={() => handleToggleRoomStatus(rm.id, rm.availabilityStatus)}
                    className={`w-full py-2 px-3 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center gap-2 ${
                      isAvailable
                        ? 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                    }`}
                  >
                    Toggle to {isAvailable ? 'Unavailable' : 'Available'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content: All Reservations Table */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3.5">Res ID</th>
                <th className="p-3.5">Guest</th>
                <th className="p-3.5">Room</th>
                <th className="p-3.5">Dates</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-medium text-stone-800">
              {allReservations.map((r) => (
                <tr key={r.id}>
                  <td className="p-3.5 font-mono font-bold text-amber-900">{r.id}</td>
                  <td className="p-3.5 font-bold">{r.guestName}</td>
                  <td className="p-3.5">Room {r.roomNumber} ({r.roomType})</td>
                  <td className="p-3.5">{r.checkInDate} &rarr; {r.checkOutDate}</td>
                  <td className="p-3.5 font-mono">{r.totalPrice.toLocaleString()} ETB</td>
                  <td className="p-3.5">
                    <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Walk-In Registration Modal */}
      {isWalkInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200 my-8">
            <div className="bg-gradient-to-r from-blue-900 to-stone-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Front Desk Module</span>
                <h3 className="text-lg font-bold font-serif text-white">Register Walk-In Guest</h3>
              </div>
              <button
                onClick={() => setIsWalkInOpen(false)}
                className="p-1 rounded-full text-stone-300 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWalkInSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Guest Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alazar Tadesse"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Guest Phone Number</label>
                <input
                  type="text"
                  required
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Select Room</label>
                <select
                  required
                  value={walkInRoomId}
                  onChange={(e) => setWalkInRoomId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="">-- Choose Available Room --</option>
                  {rooms
                    .filter((r) => r.availabilityStatus === 'available')
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        Room {r.roomNumber} - {r.type} ({r.pricePerNight.toLocaleString()} ETB/night)
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Nights Count</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={walkInNights}
                    onChange={(e) => setWalkInNights(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-stone-600 mb-1">Payment Collected</label>
                  <select
                    value={walkInPayMethod}
                    onChange={(e) => setWalkInPayMethod(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="telebirr">Telebirr Direct</option>
                    <option value="chapa">Chapa / Card</option>
                    <option value="card">Cash at Desk</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWalkInOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWalkIn}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" /> Check-In Guest Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
