import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

import {
  BedDouble,
  Search,
  LogOut,
  Building,
  X,
  SlidersHorizontal,
  ArrowLeft,
  Printer,
  AlertCircle,
  Menu,
} from 'lucide-react';

export function ReceptionistDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [guesthouse, setGuesthouse] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);

  const [arrivals, setArrivals] = useState([]);
  const [departures, setDepartures] = useState([]);
  const [inHouseGuests, setInHouseGuests] = useState([]);
  const [allReservations, setAllReservations] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [receiptReservation, setReceiptReservation] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = async () => {
    try {
      setProfileMenuOpen(false);
      if (typeof logout === 'function') {
        await logout();
      }
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      setError(err?.message || 'Logout failed');
    }
  };

  // ============================================================
  // DELETE RESERVATION
  // ============================================================

  const handleDeleteReservation = async (reservation) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete reservation #res_${reservation.id}?`
    );

    if (!confirmed) {
      return;
    }

    setActionLoadingId(reservation.id);
    setError(null);

    try {
      await ApiService.deleteReceptionistReservation(reservation.id);
      setAllReservations((currentReservations) =>
        currentReservations.filter(
          (item) => item.id !== reservation.id
        )
      );
      window.alert('Reservation deleted successfully.');
    } catch (err) {
      console.error('Failed to delete reservation:', err);
      setError(err?.message || 'Failed to delete reservation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ============================================================
  // RESOLVE ASSIGNED GUESTHOUSE
  // ============================================================

  const resolveAssignedGuesthouse = async ({
    stats,
    currentUser,
    arrivals: arrivalList,
    departures: departureList,
    inHouseGuests: inHouseList,
    reservations: reservationList,
    rooms: roomList,
  }) => {
    const candidates = [];

    if (typeof ApiService.getReceptionistGuesthouse === 'function') {
      try {
        const dedicated = await ApiService.getReceptionistGuesthouse();
        if (dedicated) {
          candidates.push(dedicated);
        }
      } catch (err) {
        console.warn('Dedicated receptionist guesthouse lookup failed:', err);
      }
    }

    candidates.push(
      stats?.guesthouse,
      stats?.property,
      stats?.assignedGuesthouse,
      stats?.assignedProperty,
      stats?.data?.guesthouse,
      stats?.data?.property,
      stats?.data?.assignedGuesthouse,
      stats?.data?.assignedProperty
    );

    candidates.push(
      currentUser?.guesthouse,
      currentUser?.property,
      currentUser?.assignedGuesthouse,
      currentUser?.assignedProperty
    );

    const userGuesthouseId =
      currentUser?.guesthouseId ??
      currentUser?.propertyId ??
      currentUser?.assignedGuesthouseId ??
      currentUser?.assignedPropertyId;

    if (userGuesthouseId) {
      candidates.push({
        id: userGuesthouseId,
        name: currentUser?.guesthouseName ??
          currentUser?.propertyName ??
          currentUser?.assignedGuesthouseName ??
          currentUser?.assignedPropertyName,
        city: currentUser?.guesthouseCity ??
          currentUser?.propertyCity,
        address: currentUser?.guesthouseAddress ??
          currentUser?.propertyAddress,
      });
    }

    const records = [
      ...(Array.isArray(arrivalList) ? arrivalList : []),
      ...(Array.isArray(departureList) ? departureList : []),
      ...(Array.isArray(inHouseList) ? inHouseList : []),
      ...(Array.isArray(reservationList) ? reservationList : []),
      ...(Array.isArray(roomList) ? roomList : []),
    ];

    const recordWithProperty = records.find((record) => {
      const id =
        record?.guesthouseId ??
        record?.propertyId ??
        record?.guesthouse?.id ??
        record?.property?.id ??
        record?.room?.guesthouseId ??
        record?.room?.guesthouse?.id;
      return id !== undefined && id !== null && String(id).trim() !== '';
    });

    if (recordWithProperty) {
      const id =
        recordWithProperty.guesthouseId ??
        recordWithProperty.propertyId ??
        recordWithProperty.guesthouse?.id ??
        recordWithProperty.property?.id ??
        recordWithProperty.room?.guesthouseId ??
        recordWithProperty.room?.guesthouse?.id;

      candidates.push({
        id,
        name: recordWithProperty.guesthouse?.name ??
          recordWithProperty.property?.name ??
          recordWithProperty.guesthouseName ??
          recordWithProperty.propertyName,
        city: recordWithProperty.guesthouse?.city ??
          recordWithProperty.property?.city ??
          recordWithProperty.city,
        address: recordWithProperty.guesthouse?.address ??
          recordWithProperty.property?.address ??
          recordWithProperty.address,
      });
    }

    const valid = candidates.find((candidate) => {
      const id = candidate?.id ?? candidate?.guesthouseId ?? candidate?.propertyId;
      return id !== undefined && id !== null && String(id).trim() !== '';
    });

    if (!valid) {
      return null;
    }

    return {
      ...valid,
      id: valid.id ?? valid.guesthouseId ?? valid.propertyId,
      name: valid.name ?? valid.guesthouseName ?? valid.propertyName ?? 'Assigned Guesthouse',
    };
  };

  // ============================================================
  // FRONTEND GUESTHOUSE FILTER
  // ============================================================

  const filterByGuesthouse = (items, assignedId) => {
    if (!Array.isArray(items) || !assignedId) {
      return items || [];
    }

    const normalizedAssignedId = String(assignedId);

    return items.filter((item) => {
      const itemId =
        item?.guesthouseId ??
        item?.propertyId ??
        item?.guesthouse?.id ??
        item?.property?.id ??
        item?.room?.guesthouseId ??
        item?.room?.guesthouse?.id;

      if (itemId === undefined || itemId === null || itemId === '') {
        return true;
      }

      return String(itemId) === normalizedAssignedId;
    });
  };

  // ============================================================
  // LOAD DASHBOARD
  // ============================================================

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const stats = await ApiService.getReceptionistDashboardStats();
      setDashboardStats(stats);

      const arr = await ApiService.getReceptionistArrivals();
      const dep = await ApiService.getReceptionistDepartures();
      const inHouse = await ApiService.getReceptionistInHouse();
      const resList = await ApiService.getReceptionistReservations();
      const roomList = await ApiService.getReceptionistRooms();

      const assignedGuesthouse = await resolveAssignedGuesthouse({
        stats,
        currentUser: user,
        arrivals: arr,
        departures: dep,
        inHouseGuests: inHouse,
        reservations: resList,
        rooms: roomList,
      });

      if (!assignedGuesthouse) {
        throw new Error(
          'No guesthouse is assigned to this receptionist. Please ask the owner/admin to assign this account to a guesthouse.'
        );
      }

      setGuesthouse(assignedGuesthouse);
      const assignedId = String(assignedGuesthouse.id);

      setArrivals(filterByGuesthouse(arr, assignedId));
      setDepartures(filterByGuesthouse(dep, assignedId));
      setInHouseGuests(filterByGuesthouse(inHouse, assignedId));
      setAllReservations(filterByGuesthouse(resList, assignedId));
      setRooms(filterByGuesthouse(roomList, assignedId));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadData();
  }, []);

  // ============================================================
  // SEARCH
  // ============================================================

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      await loadData();
      return;
    }

    try {
      setError(null);
      const results = await ApiService.searchReceptionistReservations(searchTerm);

      const assignedId = String(
        guesthouse?.id ?? guesthouse?.guesthouseId ?? guesthouse?.propertyId ?? ''
      );

      setAllReservations(assignedId ? filterByGuesthouse(results, assignedId) : results);
      setActiveTab('all');
    } catch (err) {
      console.error('Search error:', err);
      setError(err?.message || 'Search failed');
    }
  };

  // ============================================================
  // CHECK IN
  // ============================================================

  const handleCheckIn = async (reservationId) => {
    setActionLoadingId(reservationId);
    setError(null);

    try {
      await ApiService.checkInGuest(reservationId);
      await loadData();
    } catch (err) {
      console.error('Check-in error:', err);
      setError(err?.message || 'Check-in error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ============================================================
  // CHECK OUT
  // ============================================================

  const handleCheckOut = async (reservationId) => {
    setActionLoadingId(reservationId);
    setError(null);

    try {
      await ApiService.checkOutGuest(reservationId);
      await loadData();
    } catch (err) {
      console.error('Check-out error:', err);
      setError(err?.message || 'Check-out error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ============================================================
  // ROOM STATUS UPDATE
  // ============================================================

  const handleUpdateRoomAvailability = async (roomId, maintenanceStatus) => {
    setActionLoadingId(`room-${roomId}`);
    setError(null);

    try {
      await ApiService.updateReceptionistRoomAvailability(roomId, maintenanceStatus);
      await loadData();
    } catch (err) {
      console.error('Room status update error:', err);
      setError(err?.message || 'Room status update error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') {
      return 'N/A';
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // ============================================================
  // RESERVATION STATUS COLOR
  // ============================================================

  const getReservationStatusColor = (status) => {
    switch (String(status || '').toUpperCase()) {
      case 'CONFIRMED':
        return 'bg-amber-100 text-amber-800';
      case 'CHECKED_IN':
        return 'bg-emerald-100 text-emerald-800';
      case 'CHECKED_OUT':
        return 'bg-stone-100 text-stone-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-stone-100 text-stone-800';
    }
  };

  // ============================================================
  // ROOM STATUS COLOR
  // ============================================================

  const getMaintenanceStatusColor = (status) => {
    switch (String(status || '').toUpperCase()) {
      case 'AVAILABLE':
        return 'bg-emerald-100 text-emerald-800';
      case 'UNAVAILABLE':
        return 'bg-red-100 text-red-800';
      case 'CLEANING':
        return 'bg-amber-100 text-amber-800';
      case 'MAINTENANCE':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-stone-100 text-stone-800';
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-stone-500">Loading dashboard...</div>
      </div>
    );
  }

  // ============================================================
  // DASHBOARD
  // ============================================================

  return (
    <div className="flex min-h-screen bg-stone-50">

      {/* ======================================================
          SIDEBAR - RESPONSIVE (slides in/out on mobile)
      ====================================================== */}

      {/* Overlay - visible only when sidebar is open on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-stone-900 border-r border-stone-800 shadow-sm flex flex-col
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Close button inside sidebar (mobile only) */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 text-stone-400 hover:text-white lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Guesthouse */}
        <div className="p-6 border-b border-stone-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-stone-900" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">
                {guesthouse?.name || 'Guesthouse'}
              </h2>
              <p className="text-xs text-stone-400">Reception Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* ALL RESERVATIONS */}
          <button
            onClick={() => {
              setActiveTab('all');
              setSearchTerm('');
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'all'
                ? 'bg-amber-500 text-stone-900 shadow-lg shadow-amber-500/30 border-2 border-amber-500'
                : 'text-stone-300 bg-stone-800/50 border-2 border-stone-700 hover:bg-stone-800 hover:text-white hover:border-amber-500/50'
            }`}
          >
            <span className="text-lg">📅</span>
            <div className="flex-1 text-left">
              <div className="font-bold">All Reservations</div>
              <div className={`text-xs ${activeTab === 'all' ? 'text-stone-900' : 'text-stone-400'}`}>
                {allReservations.length} total
              </div>
            </div>
          </button>

          {/* IN-HOUSE */}
          <button
            onClick={() => {
              setActiveTab('inhouse');
              setSearchTerm('');
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'inhouse'
                ? 'bg-amber-500 text-stone-900 shadow-lg shadow-amber-500/30 border-2 border-amber-500'
                : 'text-stone-300 bg-stone-800/50 border-2 border-stone-700 hover:bg-stone-800 hover:text-white hover:border-amber-500/50'
            }`}
          >
            <BedDouble className={`w-5 h-5 ${activeTab === 'inhouse' ? 'text-stone-900' : 'text-stone-400'}`} />
            <div className="flex-1 text-left">
              <div className="font-bold">In-House Guests</div>
              <div className={`text-xs ${activeTab === 'inhouse' ? 'text-stone-900' : 'text-stone-400'}`}>
                {dashboardStats?.inHouse ?? inHouseGuests.length} staying
              </div>
            </div>
          </button>

          {/* ROOMS */}
          <button
            onClick={() => {
              setActiveTab('rooms');
              setSearchTerm('');
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'rooms'
                ? 'bg-amber-500 text-stone-900 shadow-lg shadow-amber-500/30 border-2 border-amber-500'
                : 'text-stone-300 bg-stone-800/50 border-2 border-stone-700 hover:bg-stone-800 hover:text-white hover:border-amber-500/50'
            }`}
          >
            <SlidersHorizontal className={`w-5 h-5 ${activeTab === 'rooms' ? 'text-stone-900' : 'text-stone-400'}`} />
            <div className="flex-1 text-left">
              <div className="font-bold">Room Availability</div>
              <div className={`text-xs ${activeTab === 'rooms' ? 'text-stone-900' : 'text-stone-400'}`}>
                {rooms.length} rooms
              </div>
            </div>
          </button>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-stone-900 text-xs font-bold">
              {user?.name?.charAt(0) || user?.fullName?.charAt(0) || 'R'}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">
                {user?.name || user?.fullName || 'Receptionist'}
              </div>
              <div className="text-xs text-stone-400">Front Desk Staff</div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto lg:ml-72">

        {/* MOBILE HAMBURGER MENU - visible only on small screens */}
        <div className="lg:hidden flex items-center mb-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-stone-900 text-white rounded-xl shadow-lg shadow-stone-900/30 hover:bg-stone-800 transition-all duration-200"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-3 font-bold text-stone-900 text-sm">
            {guesthouse?.name || 'Guesthouse'} Dashboard
          </span>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ====================================================
            KPI CARDS - BRAND COLORS
        ==================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-8">

          {/* IN HOUSE - Amber/Gold */}
          <button
            onClick={() => {
              setActiveTab('inhouse');
              setSearchTerm('');
            }}
            className="text-left bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-2xl border-2 border-amber-200 shadow-lg shadow-amber-500/20 flex items-center justify-between transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block">In-House Guests</span>
              <span className="text-2xl font-mono font-extrabold text-stone-900">{dashboardStats?.inHouse ?? 0}</span>
              <span className="text-xs text-amber-700 block mt-1">Rooms occupied</span>
            </div>
            <div className="p-3 bg-amber-500 text-stone-900 rounded-xl shadow-lg">
              <BedDouble className="w-6 h-6" />
            </div>
          </button>

          {/* AVAILABLE ROOMS - Stone/Dark */}
          <button
            onClick={() => {
              setActiveTab('rooms');
              setSearchTerm('');
            }}
            className="text-left bg-gradient-to-br from-stone-100 to-stone-200 p-5 rounded-2xl border-2 border-stone-300 shadow-lg shadow-stone-500/20 flex items-center justify-between transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">Available Rooms</span>
              <span className="text-2xl font-mono font-extrabold text-stone-900">
                {dashboardStats?.availableRooms ?? 0} / {dashboardStats?.totalRooms ?? 0}
              </span>
              <span className="text-xs text-stone-700 block mt-1">Ready for guests</span>
            </div>
            <div className="p-3 bg-stone-700 text-white rounded-xl shadow-lg">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
          </button>

        </div>

        {/* SEARCH - Brand Colors */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />

          <input
            type="text"
            placeholder="Search guest name, room #, reservation ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            className="w-full pl-10 pr-24 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />

          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-amber-500 text-stone-900 text-xs rounded-lg hover:bg-amber-400 transition-colors font-semibold"
          >
            Search
          </button>
        </div>

        {/* ====================================================
            IN-HOUSE
        ==================================================== */}

        {activeTab === 'inhouse' && (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            {inHouseGuests.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs">No guests currently in-house.</div>
            ) : (
              <div className="divide-y divide-stone-100">
                {inHouseGuests.map((res) => (
                  <div key={res.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                          #{res.id}
                        </span>
                        <span className="font-bold text-stone-900 text-sm">{res.guestName}</span>
                        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Checked In
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">
                        Phone: <span className="font-mono">{res.guestPhone || 'N/A'}</span> &bull; Room {res.roomNumber} ({res.roomType})
                      </p>
                      <p className="text-xs text-stone-500">
                        {formatDate(res.checkInDate)} - {formatDate(res.checkOutDate)}
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setReceiptReservation(res)}
                        className="px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-stone-200"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleCheckOut(res.id)}
                        disabled={actionLoadingId === res.id}
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/30 transition-all duration-200 transform hover:scale-105 flex items-center gap-1.5 border-2 border-amber-500"
                      >
                        <span>{actionLoadingId === res.id ? 'Checking Out...' : 'Check Out Now'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====================================================
            ALL RESERVATIONS
        ==================================================== */}

        {activeTab === 'all' && (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="p-3.5">TOKEN & GUEST</th>
                    <th className="p-3.5">ROOM</th>
                    <th className="p-3.5">DATES</th>
                    <th className="p-3.5">STATUS</th>
                    <th className="p-3.5">AMOUNT</th>
                    <th className="p-3.5">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-900">
                  {allReservations.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-stone-500">No reservations found.</td>
                    </tr>
                  ) : (
                    allReservations.map((r) => (
                      <tr key={r.id}>
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">#res_{r.id}</div>
                          <div className="font-bold">{r.guestName}</div>
                        </td>
                        <td className="p-3.5">Room {r.roomNumber} {r.roomType}</td>
                        <td className="p-3.5">{formatDate(r.checkInDate)} - {formatDate(r.checkOutDate)}</td>
                        <td className="p-3.5">
                          <span className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded ${getReservationStatusColor(r.status)}`}>
                            {String(r.status || 'PENDING').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono">ETB {Number(r.totalPrice || 0).toLocaleString()}</td>
                        <td className="p-3.5">
                          <div className="flex gap-2 flex-wrap">
                            {String(r.status || '').toUpperCase() === 'CONFIRMED' && (
                              <button
                                onClick={() => handleCheckIn(r.id)}
                                disabled={actionLoadingId === r.id}
                                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-900 text-xs rounded-lg font-bold"
                              >
                                {actionLoadingId === r.id ? 'Checking In...' : 'Check In'}
                              </button>
                            )}

                            {String(r.status || '').toUpperCase() === 'CHECKED_IN' && (
                              <button
                                onClick={() => handleCheckOut(r.id)}
                                disabled={actionLoadingId === r.id}
                                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-900 text-xs rounded-lg font-bold"
                              >
                                {actionLoadingId === r.id ? 'Checking Out...' : 'Check Out'}
                              </button>
                            )}

                            <button
                              onClick={() => setReceiptReservation(r)}
                              className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs rounded font-bold border border-stone-200"
                            >
                              Receipt
                            </button>

                            {['CHECKED_OUT', 'CANCELLED'].includes(String(r.status || '').trim().toUpperCase()) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteReservation(r)}
                                disabled={actionLoadingId === r.id}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs rounded-lg font-bold"
                              >
                                {actionLoadingId === r.id ? 'Deleting...' : 'Delete'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ====================================================
            ROOMS
        ==================================================== */}

        {activeTab === 'rooms' && (
          <div className="space-y-4">
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs text-stone-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-stone-700 shrink-0" />
              <span>Receptionists can update room status: Available, Unavailable, Cleaning, and Maintenance.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.length === 0 ? (
                <div className="col-span-full bg-white p-8 rounded-2xl border border-stone-200 text-center text-stone-500">
                  No rooms found for this guesthouse.
                </div>
              ) : (
                rooms.map((rm) => {
                  const status = String(rm.maintenanceStatus || 'AVAILABLE').toUpperCase();
                  const isAvailable = status === 'AVAILABLE';
                  const isRoomActionLoading = actionLoadingId === `room-${rm.id}`;

                  return (
                    <div key={rm.id} className="bg-white p-5 rounded-2xl border border-stone-200 space-y-3 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                            Room {rm.roomNumber}
                          </span>
                          <h3 className="font-bold text-stone-900 text-base mt-1">{rm.roomType}</h3>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getMaintenanceStatusColor(status)}`}>
                          {status}
                        </span>
                      </div>

                      <div className="text-xs text-stone-500 font-mono">
                        {rm.capacity ?? 0} Guests &bull; Rate ETB {Number(rm.price ?? rm.pricePerNight ?? 0).toLocaleString()}
                      </div>

                      <div className="text-xs text-stone-500">
                        Occupancy:{' '}
                        <span className={`font-bold ${rm.available ? 'text-emerald-600' : 'text-red-600'}`}>
                          {rm.available ? 'Vacant' : 'Occupied'}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {!isAvailable && (
                          <button
                            onClick={() => handleUpdateRoomAvailability(rm.id, 'AVAILABLE')}
                            disabled={isRoomActionLoading}
                            className="flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 bg-stone-900 text-white border-2 border-stone-900 shadow-lg shadow-stone-900/30 hover:bg-stone-800 disabled:opacity-60"
                          >
                            {isRoomActionLoading ? 'Updating...' : 'Mark Available'}
                          </button>
                        )}

                        {isAvailable && (
                          <>
                            <button
                              onClick={() => handleUpdateRoomAvailability(rm.id, 'CLEANING')}
                              disabled={isRoomActionLoading}
                              className="flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-stone-900 border-2 border-amber-300 shadow-lg shadow-amber-500/30 hover:from-amber-500 hover:to-amber-600 disabled:opacity-60"
                            >
                              {isRoomActionLoading ? 'Updating...' : 'Cleaning'}
                            </button>

                            <button
                              onClick={() => handleUpdateRoomAvailability(rm.id, 'MAINTENANCE')}
                              disabled={isRoomActionLoading}
                              className="flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white border-2 border-orange-300 shadow-lg shadow-orange-500/30 hover:from-orange-500 hover:to-orange-600 disabled:opacity-60"
                            >
                              {isRoomActionLoading ? 'Updating...' : 'Maintenance'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-stone-200 text-center">
          <p className="text-sm text-stone-500">© 2026 Guesthouse Platform. All rights reserved.</p>
        </footer>

      </div>

      {/* ======================================================
          RECEIPT MODAL
      ====================================================== */}

      {receiptReservation && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setReceiptReservation(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-stone-900 text-lg">
                  {guesthouse?.name || 'Guesthouse'}
                </h3>
                <p className="text-xs text-stone-500">Reservation Receipt</p>
              </div>
              <button
                onClick={() => setReceiptReservation(null)}
                className="text-stone-400 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm border-t border-b border-dashed border-stone-200 py-4">
              <div className="flex justify-between">
                <span className="text-stone-500">Reservation #</span>
                <span className="font-mono font-bold">{receiptReservation.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Guest</span>
                <span className="font-semibold">{receiptReservation.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Phone</span>
                <span className="font-mono">{receiptReservation.guestPhone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Room</span>
                <span>{receiptReservation.roomNumber} ({receiptReservation.roomType})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Check-in</span>
                <span>{formatDate(receiptReservation.checkInDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Check-out</span>
                <span>{formatDate(receiptReservation.checkOutDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Nights</span>
                <span>{receiptReservation.nightsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Status</span>
                <span className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded ${getReservationStatusColor(receiptReservation.status)}`}>
                  {String(receiptReservation.status || 'PENDING').replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Payment</span>
                <span className="uppercase font-semibold">{receiptReservation.paymentStatus || 'PENDING'}</span>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 mb-6">
              <span className="font-bold text-stone-900">Total</span>
              <span className="font-mono font-extrabold text-xl text-stone-900">
                ETB {Number(receiptReservation.totalPrice || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={() => setReceiptReservation(null)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm rounded-xl"
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

export default ReceptionistDashboard;