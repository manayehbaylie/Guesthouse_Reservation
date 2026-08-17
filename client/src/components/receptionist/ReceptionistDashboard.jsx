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
  Search,
} from 'lucide-react';

export const ReceptionistDashboard = () => {
  const currentUser = ApiService.getCurrentUser();
  const [guesthouse, setGuesthouse] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [arrivals, setArrivals] = useState([]);
  const [departures, setDepartures] = useState([]);
  const [inHouseGuests, setInHouseGuests] = useState([]);
  const [allReservations, setAllReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('arrivals');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load dashboard stats
      const stats = await ApiService.getReceptionistDashboardStats();
      setDashboardStats(stats);

      // Load arrivals
      const arr = await ApiService.getReceptionistArrivals();
      setArrivals(arr);

      // Load departures
      const dep = await ApiService.getReceptionistDepartures();
      setDepartures(dep);

      // Load in-house guests
      const inHouse = await ApiService.getReceptionistInHouse();
      setInHouseGuests(inHouse);

      // Load all reservations
      const resList = await ApiService.getReceptionistReservations();
      setAllReservations(resList);

      // Load rooms
      const roomList = await ApiService.getReceptionistRooms();
      setRooms(roomList);

      // Get guesthouse info from the first room
      if (roomList.length > 0) {
        const firstRoom = await ApiService.getRoomById(roomList[0].id);
        // Get guesthouse info
        try {
          const guesthouses = await ApiService.getGuesthouses();
          if (guesthouses.length > 0) {
            setGuesthouse(guesthouses[0]);
          }
        } catch (e) {
          console.error('Error fetching guesthouse:', e);
        }
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadData();
      return;
    }
    try {
      const results = await ApiService.searchReceptionistReservations(searchTerm);
      setAllReservations(results);
      setActiveTab('all');
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed');
    }
  };

  const handleCheckIn = async (resId) => {
    try {
      await ApiService.checkInGuest(resId);
      await loadData();
    } catch (err) {
      setError(err.message || 'Check-in error');
    }
  };

  const handleCheckOut = async (resId) => {
    try {
      await ApiService.checkOutGuest(resId);
      await loadData();
    } catch (err) {
      setError(err.message || 'Check-out error');
    }
  };

  const handleUpdateRoomAvailability = async (roomId, maintenanceStatus) => {
    try {
      await ApiService.updateReceptionistRoomAvailability(roomId, maintenanceStatus);
      await loadData();
    } catch (err) {
      setError(err.message || 'Room status update error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getMaintenanceStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE':
        return 'bg-emerald-100 text-emerald-800';
      case 'UNAVAILABLE':
        return 'bg-red-100 text-red-800';
      case 'CLEANING':
        return 'bg-yellow-100 text-yellow-800';
      case 'MAINTENANCE':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReservationStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'CHECKED_IN':
        return 'bg-emerald-100 text-emerald-800';
      case 'CHECKED_OUT':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-stone-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-stone-100">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-stone-200 shadow-sm flex flex-col">
        {/* Guesthouse Info */}
        <div className="p-6 border-b border-stone-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-sm">{guesthouse?.name || 'Guesthouse'}</h2>
              <p className="text-xs text-stone-500">Reception Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => { setActiveTab('arrivals'); setSearchTerm(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'arrivals' 
                ? 'bg-blue-50 text-blue-900 border border-blue-200' 
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <UserCheck className="w-5 h-5" />
            <div className="flex-1 text-left">
              <div>Today's Arrivals</div>
              <div className="text-xs opacity-70">{dashboardStats?.arrivals || 0} guests</div>
            </div>
          </button>

          <button
            onClick={() => { setActiveTab('departures'); setSearchTerm(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'departures' 
                ? 'bg-amber-50 text-amber-900 border border-amber-200' 
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <UserX className="w-5 h-5" />
            <div className="flex-1 text-left">
              <div>Today's Departures</div>
              <div className="text-xs opacity-70">{dashboardStats?.departures || 0} check-outs</div>
            </div>
          </button>

          <button
            onClick={() => { setActiveTab('all'); setSearchTerm(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'all' 
                ? 'bg-purple-50 text-purple-900 border border-purple-200' 
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <div className="flex-1 text-left">
              <div>All Reservations</div>
              <div className="text-xs opacity-70">{allReservations.length} total</div>
            </div>
          </button>

          <button
            onClick={() => { setActiveTab('rooms'); setSearchTerm(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'rooms' 
                ? 'bg-stone-100 text-stone-900 border border-stone-300' 
                : 'text-stone-600 hover:bg-stone-50'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <div className="flex-1 text-left">
              <div>Room Availability</div>
              <div className="text-xs opacity-70">{rooms.length} rooms</div>
            </div>
          </button>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {currentUser?.fullName?.charAt(0) || currentUser?.name?.charAt(0) || 'R'}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-stone-900">{currentUser?.fullName || currentUser?.name || 'Receptionist'}</div>
              <div className="text-xs text-stone-500">Front Desk Staff</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              {activeTab === 'arrivals' && "Today's Expected Arrivals"}
              {activeTab === 'departures' && "Today's Expected Departures"}
              {activeTab === 'all' && "Property Reservation Master List"}
              {activeTab === 'rooms' && "Room Availability Management"}
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              {activeTab === 'arrivals' && "Guests scheduled to check in today"}
              {activeTab === 'departures' && "Guests currently checked in scheduled to depart today"}
              {activeTab === 'all' && `Full list of reservations for ${guesthouse?.name || 'guesthouse'}`}
              {activeTab === 'rooms' && "Receptionists can toggle room status after check-out, for housekeeping, or maintenance"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-stone-300 text-stone-700 text-xs font-semibold rounded-xl hover:bg-stone-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Today's Arrivals</span>
              <span className="text-2xl font-mono font-extrabold text-blue-900">{dashboardStats?.arrivals || 0}</span>
              <span className="text-xs text-stone-500 block mt-1">Guest to check in</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Today's Departures</span>
              <span className="text-2xl font-mono font-extrabold text-amber-900">{dashboardStats?.departures || 0}</span>
              <span className="text-xs text-stone-500 block mt-1">Check-outs expected</span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
              <UserX className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">In-House Guests</span>
              <span className="text-2xl font-mono font-extrabold text-emerald-900">{dashboardStats?.inHouse || 0}</span>
              <span className="text-xs text-stone-500 block mt-1">Rooms occupied</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <BedDouble className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Available Rooms</span>
              <span className="text-2xl font-mono font-extrabold text-stone-900">
                {dashboardStats?.availableRooms || 0} / {dashboardStats?.totalRooms || 0}
              </span>
              <span className="text-xs text-stone-500 block mt-1">Ready for guests</span>
            </div>
            <div className="p-3 bg-stone-100 text-stone-700 rounded-xl">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search guest name, room #, reservation ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
        </div>

        {/* Tab Content: Arrivals */}
        {activeTab === 'arrivals' && (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            {arrivals.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs">No pending guest arrivals for today.</div>
            ) : (
              <div className="divide-y divide-stone-200">
                {arrivals.map((res) => (
                  <div key={res.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                          #{res.id}
                        </span>
                        <span className="font-bold text-stone-900 text-sm">{res.guestName}</span>
                      </div>
                      <p className="text-xs text-stone-500">
                        Phone: <span className="font-mono">{res.guestPhone}</span> &bull; Room {res.roomNumber} ({res.roomType})
                      </p>
                      <p className="text-xs text-stone-500">
                        {formatDate(res.checkInDate)} - {formatDate(res.checkOutDate)} ({res.nightsCount} night{res.nightsCount > 1 ? 's' : ''})
                      </p>
                      {res.payment && (
                        <p className="text-xs text-stone-500 flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          {res.payment.method?.toUpperCase() || 'TELEBIRR'} - {res.payment.status?.toUpperCase() || 'PAID'}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleCheckIn(res.id)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <CheckCircle className="w-4 h-4" /> Check In
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
            {departures.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs">No guest departures scheduled for today.</div>
            ) : (
              <div className="divide-y divide-stone-200">
                {departures.map((res) => (
                  <div key={res.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                          #{res.id}
                        </span>
                        <span className="font-bold text-stone-900 text-sm">{res.guestName}</span>
                      </div>
                      <p className="text-xs text-stone-500">
                        Phone: <span className="font-mono">{res.guestPhone}</span> &bull; Room {res.roomNumber} ({res.roomType})
                      </p>
                      <p className="text-xs text-stone-500">
                        Checked in at {formatTime(res.checkInDate)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleCheckOut(res.id)}
                      className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <UserX className="w-4 h-4" /> Perform Check-Out & Free Room
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: All Reservations */}
        {activeTab === 'all' && (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="p-3.5">Token & Guest</th>
                    <th className="p-3.5">Room</th>
                    <th className="p-3.5">Dates</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 font-medium text-stone-800">
                  {allReservations.map((r) => (
                    <tr key={r.id}>
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-amber-900">#res_{r.id}</div>
                        <div className="font-bold">{r.guestName}</div>
                      </td>
                      <td className="p-3.5">Room {r.roomNumber} {r.roomType}</td>
                      <td className="p-3.5">{formatDate(r.checkInDate)} - {formatDate(r.checkOutDate)}</td>
                      <td className="p-3.5">
                        <span className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded ${getReservationStatusColor(r.status)}`}>
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">ETB {r.totalPrice.toLocaleString()}</td>
                      <td className="p-3.5">
                        <div className="flex gap-2">
                          {r.status === 'confirmed' && (
                            <button
                              onClick={() => handleCheckIn(r.id)}
                              className="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700"
                            >
                              Check In
                            </button>
                          )}
                          {r.status === 'checked_in' && (
                            <button
                              onClick={() => handleCheckOut(r.id)}
                              className="px-3 py-1 bg-amber-800 text-white text-xs rounded hover:bg-amber-900"
                            >
                              Check Out
                            </button>
                          )}
                          <button className="px-3 py-1 bg-stone-200 text-stone-700 text-xs rounded hover:bg-stone-300">
                            Receipt
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Room Availability Manager */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs text-stone-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-700 shrink-0" />
              <span>
                Receptionists can update room availability status (Available, Unavailable, Cleaning, Maintenance).
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((rm) => (
                <div key={rm.id} className="bg-white p-5 rounded-2xl border border-stone-200 space-y-3 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                        Room {rm.roomNumber}
                      </span>
                      <h3 className="font-bold text-stone-900 text-base mt-1">{rm.type}</h3>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getMaintenanceStatusColor(rm.maintenanceStatus)}`}>
                      {rm.maintenanceStatus || 'AVAILABLE'}
                    </span>
                  </div>

                  <div className="text-xs text-stone-500 font-mono">
                    {rm.capacity} Guests &bull; Rate ETB {rm.pricePerNight.toLocaleString()}
                  </div>

                  <div className="text-xs text-stone-500">
                    Occupancy: <span className={`font-bold ${rm.availabilityStatus === 'available' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {rm.availabilityStatus === 'available' ? 'Vacant' : 'Occupied'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {rm.maintenanceStatus !== 'AVAILABLE' && (
                      <button
                        onClick={() => handleUpdateRoomAvailability(rm.id, 'AVAILABLE')}
                        className="flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center gap-2 bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                      >
                        Mark Available
                      </button>
                    )}
                    {rm.maintenanceStatus === 'AVAILABLE' && (
                      <>
                        <button
                          onClick={() => handleUpdateRoomAvailability(rm.id, 'CLEANING')}
                          className="flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center gap-2 bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
                        >
                          Cleaning
                        </button>
                        <button
                          onClick={() => handleUpdateRoomAvailability(rm.id, 'MAINTENANCE')}
                          className="flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center gap-2 bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200"
                        >
                          Maintenance
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};