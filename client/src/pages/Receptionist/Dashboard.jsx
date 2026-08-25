import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  UserX,
  BedDouble,
  Search,
  CheckCircle,
  Clock,
  RefreshCw,
  ShieldCheck,
  Phone,
  Calendar,
  Smartphone,
  CreditCard,
  Building,
  ExternalLink,
  AlertCircle,
  X,
  SlidersHorizontal,
  ArrowLeft,
  Printer,
} from 'lucide-react';

export function ReceptionistDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [receiptReservation, setReceiptReservation] = useState(null);

const handleDeleteReservation = async (reservation) => {
  const confirmed = window.confirm(
    `Are you sure you want to permanently delete reservation #res_${reservation.id}?`
  );

  if (!confirmed) {
    return;
  }

  setActionLoadingId(reservation.id);

  try {
    await ApiService.deleteReceptionistReservation(
      reservation.id
    );

    setAllReservations((currentReservations) =>
      currentReservations.filter(
        (item) => item.id !== reservation.id
      )
    );

    alert("Reservation deleted successfully.");
  } catch (error) {
    console.error(
      "Failed to delete reservation:",
      error
    );

    setError(
      error?.message ||
      "Failed to delete reservation."
    );
  } finally {
    setActionLoadingId(null);
  }
};

  /**
   * Extract a guesthouse/property object from the different shapes that
   * existing receptionist endpoints may return.
   *
   * Priority:
   * 1. Dedicated receptionist guesthouse endpoint, if present.
   * 2. Dashboard stats/property returned by the backend.
   * 3. Authenticated user's assigned guesthouse fields.
   * 4. Guesthouse id returned with receptionist-scoped rooms/reservations.
   *
   * We deliberately DO NOT fall back to getGuesthouses()[0].
   */
  const resolveAssignedGuesthouse = async ({
    stats,
    user: currentUser,
    arrivals: arrivalList,
    departures: departureList,
    inHouseGuests: inHouseList,
    reservations: reservationList,
    rooms: roomList,
  }) => {
    const candidates = [];

    // Use a dedicated backend method when the project has one.
    if (typeof ApiService.getReceptionistGuesthouse === 'function') {
      try {
        const dedicated = await ApiService.getReceptionistGuesthouse();
        if (dedicated) candidates.push(dedicated);
      } catch (e) {
        console.warn('Dedicated receptionist guesthouse lookup failed:', e);
      }
    }

    // Common dashboard response shapes.
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

    // Common AuthContext user shapes.
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
        name:
          currentUser?.guesthouseName ??
          currentUser?.propertyName ??
          currentUser?.assignedGuesthouseName ??
          currentUser?.assignedPropertyName,
        city: currentUser?.guesthouseCity ?? currentUser?.propertyCity,
        address:
          currentUser?.guesthouseAddress ??
          currentUser?.propertyAddress,
      });
    }

    // If the receptionist APIs are correctly scoped by the backend, their
    // records may contain guesthouseId/propertyId.
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
        name:
          recordWithProperty.guesthouse?.name ??
          recordWithProperty.property?.name ??
          recordWithProperty.guesthouseName ??
          recordWithProperty.propertyName,
        city:
          recordWithProperty.guesthouse?.city ??
          recordWithProperty.property?.city ??
          recordWithProperty.city,
        address:
          recordWithProperty.guesthouse?.address ??
          recordWithProperty.property?.address ??
          recordWithProperty.address,
      });
    }

    const valid = candidates.find((candidate) => {
      const id =
        candidate?.id ??
        candidate?.guesthouseId ??
        candidate?.propertyId;

      return id !== undefined && id !== null && String(id).trim() !== '';
    });

    if (!valid) return null;

    return {
      ...valid,
      id: valid.id ?? valid.guesthouseId ?? valid.propertyId,
      name:
        valid.name ??
        valid.guesthouseName ??
        valid.propertyName ??
        'Assigned Guesthouse',
    };
  };

  /**
   * Defensive frontend guard.
   * The backend MUST already scope receptionist data by assignment.
   * This additionally removes records carrying a different property id.
   */
  const filterByGuesthouse = (items, assignedId) => {
    if (!Array.isArray(items) || !assignedId) return items || [];

    const normalizedAssignedId = String(assignedId);

    return items.filter((item) => {
      const itemId =
        item?.guesthouseId ??
        item?.propertyId ??
        item?.guesthouse?.id ??
        item?.property?.id ??
        item?.room?.guesthouseId ??
        item?.room?.guesthouse?.id;

      // If this particular API object does not expose a property id,
      // keep it because the backend endpoint is expected to be scoped.
      if (itemId === undefined || itemId === null || itemId === '') {
        return true;
      }

      return String(itemId) === normalizedAssignedId;
    });
  };

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

      // IMPORTANT:
      // Never use ApiService.getGuesthouses()[0] here.
      // That returns the first guesthouse in the whole system and can show
      // another property's name (for example Hawassa) to the current staff.
      //
      // The receptionist must always use the guesthouse assigned to the
      // currently authenticated user.
      const assignedGuesthouse = await resolveAssignedGuesthouse({
        stats,
        user,
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

      // Keep the dashboard data locked to the assigned property whenever
      // the API response contains a guesthouse/property id.
      const assignedId = String(
        assignedGuesthouse.id ??
        assignedGuesthouse.guesthouseId ??
        ''
      );

      if (assignedId) {
        setArrivals(filterByGuesthouse(arr, assignedId));
        setDepartures(filterByGuesthouse(dep, assignedId));
        setInHouseGuests(filterByGuesthouse(inHouse, assignedId));
        setAllReservations(filterByGuesthouse(resList, assignedId));
        setRooms(filterByGuesthouse(roomList, assignedId));
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
      const assignedId = String(
        guesthouse?.id ??
        guesthouse?.guesthouseId ??
        guesthouse?.propertyId ??
        ''
      );
      setAllReservations(
        assignedId ? filterByGuesthouse(results, assignedId) : results
      );
      setActiveTab('all');
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed');
    }
  };

  const handleCheckIn = async (resId) => {
    setActionLoadingId(resId);
    try {
      await ApiService.checkInGuest(resId);
      await loadData();
    } catch (err) {
      setError(err.message || 'Check-in error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCheckOut = async (resId) => {
    setActionLoadingId(resId);
    try {
      await ApiService.checkOutGuest(resId);
      await loadData();
    } catch (err) {
      setError(err.message || 'Check-out error');
    } finally {
      setActionLoadingId(null);
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
          {/* <button
            onClick={() => { setActiveTab('arrivals'); setSearchTerm(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-[1.02] ${
              activeTab === 'arrivals' 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 border-2 border-emerald-400' 
                : 'text-stone-600 bg-white border-2 border-stone-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            <UserCheck className={`w-5 h-5 ${activeTab === 'arrivals' ? 'text-white' : 'text-emerald-500'}`} />
            <div className="flex-1 text-left">
              <div className="font-bold">Today's Arrivals</div>
              <div className={`text-xs ${activeTab === 'arrivals' ? 'text-emerald-100' : 'text-stone-500'}`}>{dashboardStats?.arrivals || 0} guests</div>
            </div>
          </button> */}

          {/* <button
            onClick={() => { setActiveTab('departures'); setSearchTerm(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-[1.02] ${
              activeTab === 'departures' 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 border-2 border-amber-400' 
                : 'text-stone-600 bg-white border-2 border-stone-200 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700'
            }`}
          >
            <UserX className={`w-5 h-5 ${activeTab === 'departures' ? 'text-white' : 'text-amber-500'}`} />
            <div className="flex-1 text-left">
              <div className="font-bold">Today's Departures</div>
              <div className={`text-xs ${activeTab === 'departures' ? 'text-amber-100' : 'text-stone-500'}`}>{dashboardStats?.departures || 0} check-outs</div>
            </div>
          </button> */}

          <button
            onClick={() => { setActiveTab('all'); setSearchTerm(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-[1.02] ${
              activeTab === 'all' 
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 border-2 border-purple-400' 
                : 'text-stone-600 bg-white border-2 border-stone-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700'
            }`}
          >
            <Calendar className={`w-5 h-5 ${activeTab === 'all' ? 'text-white' : 'text-purple-500'}`} />
            <div className="flex-1 text-left">
              <div className="font-bold">All Reservations</div>
              <div className={`text-xs ${activeTab === 'all' ? 'text-purple-100' : 'text-stone-500'}`}>{allReservations.length} total</div>
            </div>
          </button>

          <button
            onClick={() => { setActiveTab('inhouse'); setSearchTerm(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-[1.02] ${
              activeTab === 'inhouse' 
                ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/30 border-2 border-teal-400' 
                : 'text-stone-600 bg-white border-2 border-stone-200 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700'
            }`}
          >
            <BedDouble className={`w-5 h-5 ${activeTab === 'inhouse' ? 'text-white' : 'text-teal-500'}`} />
            <div className="flex-1 text-left">
              <div className="font-bold">In-House Guests</div>
              <div className={`text-xs ${activeTab === 'inhouse' ? 'text-teal-100' : 'text-stone-500'}`}>{dashboardStats?.inHouse ?? inHouseGuests.length} staying</div>
            </div>
          </button>

          <button
            onClick={() => { setActiveTab('rooms'); setSearchTerm(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-[1.02] ${
              activeTab === 'rooms' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 border-2 border-blue-400' 
                : 'text-stone-600 bg-white border-2 border-stone-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <SlidersHorizontal className={`w-5 h-5 ${activeTab === 'rooms' ? 'text-white' : 'text-blue-500'}`} />
            <div className="flex-1 text-left">
              <div className="font-bold">Room Availability</div>
              <div className={`text-xs ${activeTab === 'rooms' ? 'text-blue-100' : 'text-stone-500'}`}>{rooms.length} rooms</div>
            </div>
          </button>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0) || user?.fullName?.charAt(0) || 'R'}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-stone-900">{user?.name || user?.fullName || 'Receptionist'}</div>
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-stone-600 to-stone-700 hover:from-stone-700 hover:to-stone-800 text-white rounded-xl shadow-lg shadow-stone-500/30 transition-all duration-200 transform hover:scale-105 border-2 border-stone-500"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-semibold">Back</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-stone-900">
                {activeTab === 'arrivals' && "Today's Expected Arrivals"}
                {activeTab === 'departures' && "Today's Expected Departures"}
                {activeTab === 'inhouse' && "Guests Currently In-House"}
                {activeTab === 'all' && "Property Reservation Master List"}
                {activeTab === 'rooms' && "Room Availability Management"}
              </h1>
              <p className="text-sm text-stone-500 mt-1">
                {activeTab === 'arrivals' && "Guests scheduled to check in today"}
                {activeTab === 'departures' && "Guests currently checked in scheduled to depart today"}
                {activeTab === 'inhouse' && "All guests currently staying, regardless of departure date"}
                {activeTab === 'all' && `Full list of reservations for ${guesthouse?.name || 'guesthouse'}`}
                {activeTab === 'rooms' && "Receptionists can toggle room status after check-out, for housekeeping, or maintenance"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200 transform hover:scale-105 border-2 border-blue-400"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* <button
            onClick={() => { setActiveTab('arrivals'); setSearchTerm(''); }}
            className="text-left bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl border-2 border-blue-200 shadow-lg shadow-blue-500/20 flex items-center justify-between transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block">Today's Arrivals</span>
              <span className="text-2xl font-mono font-extrabold text-blue-900">{dashboardStats?.arrivals || 0}</span>
              <span className="text-xs text-blue-700 block mt-1">Guest to check in</span>
            </div>
            <div className="p-3 bg-blue-500 text-white rounded-xl shadow-lg">
              <UserCheck className="w-6 h-6" />
            </div>
          </button> */}

          {/* <button
            onClick={() => { setActiveTab('departures'); setSearchTerm(''); }}
            className="text-left bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-2xl border-2 border-amber-200 shadow-lg shadow-amber-500/20 flex items-center justify-between transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block">Today's Departures</span>
              <span className="text-2xl font-mono font-extrabold text-amber-900">{dashboardStats?.departures || 0}</span>
              <span className="text-xs text-amber-700 block mt-1">Check-outs expected</span>
            </div>
            <div className="p-3 bg-amber-500 text-white rounded-xl shadow-lg">
              <UserX className="w-6 h-6" />
            </div>
          </button> */}

          <button
            onClick={() => { setActiveTab('inhouse'); setSearchTerm(''); }}
            className="text-left bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-2xl border-2 border-emerald-200 shadow-lg shadow-emerald-500/20 flex items-center justify-between transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block">In-House Guests</span>
              <span className="text-2xl font-mono font-extrabold text-emerald-900">{dashboardStats?.inHouse || 0}</span>
              <span className="text-xs text-emerald-700 block mt-1">Rooms occupied</span>
            </div>
            <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg">
              <BedDouble className="w-6 h-6" />
            </div>
          </button>

          <button
            onClick={() => { setActiveTab('rooms'); setSearchTerm(''); }}
            className="text-left bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-2xl border-2 border-purple-200 shadow-lg shadow-purple-500/20 flex items-center justify-between transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 block">Available Rooms</span>
              <span className="text-2xl font-mono font-extrabold text-purple-900">
                {dashboardStats?.availableRooms || 0} / {dashboardStats?.totalRooms || 0}
              </span>
              <span className="text-xs text-purple-700 block mt-1">Ready for guests</span>
            </div>
            <div className="p-3 bg-purple-500 text-white rounded-xl shadow-lg">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
          </button>
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
                      {res.paymentStatus && (
                        <p className="text-xs text-stone-500 flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          ETB {res.totalPrice.toLocaleString()} &bull; {res.paymentStatus.toUpperCase()}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setReceiptReservation(res)}
                        className="px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 border-2 border-stone-200"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCheckIn(res.id)}
                        disabled={actionLoadingId === res.id}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-200 transform hover:scale-105 flex items-center gap-1.5 border-2 border-emerald-400"
                      >
                        <CheckCircle className="w-4 h-4" /> {actionLoadingId === res.id ? 'Checking In...' : 'Check In'}
                      </button>
                    </div>
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
                        Stayed {formatDate(res.checkInDate)} - {formatDate(res.checkOutDate)} &bull; ETB {res.totalPrice.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setReceiptReservation(res)}
                        className="px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 border-2 border-stone-200"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCheckOut(res.id)}
                        disabled={actionLoadingId === res.id}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/30 transition-all duration-200 transform hover:scale-105 flex items-center gap-1.5 border-2 border-amber-400"
                      >
                        <UserX className="w-4 h-4" /> {actionLoadingId === res.id ? 'Checking Out...' : 'Perform Check-Out & Free Room'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: In-House Guests */}
        {activeTab === 'inhouse' && (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            {inHouseGuests.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs">No guests currently in-house.</div>
            ) : (
              <div className="divide-y divide-stone-200">
                {inHouseGuests.map((res) => (
                  <div key={res.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-900 bg-teal-100 px-2 py-0.5 rounded">
                          #{res.id}
                        </span>
                        <span className="font-bold text-stone-900 text-sm">{res.guestName}</span>
                        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Checked In
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">
                        Phone: <span className="font-mono">{res.guestPhone}</span> &bull; Room {res.roomNumber} ({res.roomType})
                      </p>
                      <p className="text-xs text-stone-500">
                        {formatDate(res.checkInDate)} - {formatDate(res.checkOutDate)} ({res.nightsCount} night{res.nightsCount > 1 ? 's' : ''})
                        {res.checkOutDate === new Date().toISOString().slice(0, 10) && (
                          <span className="ml-2 font-bold text-amber-700">Departs today</span>
                        )}
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setReceiptReservation(res)}
                        className="px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 border-2 border-stone-200"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCheckOut(res.id)}
                        disabled={actionLoadingId === res.id}
                        className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-500/30 transition-all duration-200 transform hover:scale-105 flex items-center gap-1.5 border-2 border-teal-400"
                      >
                        <UserX className="w-4 h-4" /> {actionLoadingId === res.id ? 'Checking Out...' : 'Check Out Now'}
                      </button>
                    </div>
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
                              disabled={actionLoadingId === r.id}
                              className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-60 text-white text-xs rounded-lg shadow-lg shadow-emerald-500/30 transition-all duration-200 transform hover:scale-105 border-2 border-emerald-400 font-bold"
                            >
                              Check In
                            </button>
                          )}
                          {r.status === 'checked_in' && (
                            <button
                              onClick={() => handleCheckOut(r.id)}
                              disabled={actionLoadingId === r.id}
                              className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-60 text-white text-xs rounded-lg shadow-lg shadow-amber-500/30 transition-all duration-200 transform hover:scale-105 border-2 border-amber-400 font-bold"
                            >
                              Check Out
                            </button>
                          )}
                          <button
                            onClick={() => setReceiptReservation(r)}
                            className="px-3 py-1 bg-stone-200 text-stone-700 text-xs rounded hover:bg-stone-300 font-bold"
                          >
                            Receipt
                          </button>
    {["checked_out", "cancelled"].includes(
  String(r.status || "").trim().toLowerCase()
) && (
  <button
    type="button"
    onClick={() => handleDeleteReservation(r)}
    disabled={actionLoadingId === r.id}
    className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs rounded-lg font-bold transition-all"
  >
    {actionLoadingId === r.id ? "Deleting..." : "Delete"}
  </button>
)}
                                          
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
                  <h3 className="font-bold text-stone-900 text-base mt-1">{rm.roomType}</h3>                    
                  </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getMaintenanceStatusColor(rm.maintenanceStatus)}`}>
                      {rm.maintenanceStatus || 'AVAILABLE'}
                    </span>
                  </div>

                  <div className="text-xs text-stone-500 font-mono">
                   {rm.capacity} Guests &bull; Rate ETB {(rm.price || 0).toLocaleString()}                  
                   </div>

                  <div className="text-xs text-stone-500">
                  Occupancy: <span className={`font-bold ${rm.available ? 'text-emerald-600' : 'text-red-600'}`}>
                    {rm.available ? 'Vacant' : 'Occupied'}
                         </span>
                          </div>

                  <div className="flex gap-2">
                    {rm.maintenanceStatus !== 'AVAILABLE' && (
                      <button
                        onClick={() => handleUpdateRoomAvailability(rm.id, 'AVAILABLE')}
                        className="flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-2 border-emerald-400 shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700"
                      >
                        Mark Available
                      </button>
                    )}
                    {rm.maintenanceStatus === 'AVAILABLE' && (
                      <>
                        <button
                          onClick={() => handleUpdateRoomAvailability(rm.id, 'CLEANING')}
                          className="flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 border-2 border-yellow-300 shadow-lg shadow-yellow-500/30 hover:from-yellow-500 hover:to-yellow-600"
                        >
                          Cleaning
                        </button>
                        <button
                          onClick={() => handleUpdateRoomAvailability(rm.id, 'MAINTENANCE')}
                          className="flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 to-orange-500 text-orange-900 border-2 border-orange-300 shadow-lg shadow-orange-500/30 hover:from-orange-500 hover:to-orange-600"
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

      {/* Receipt Modal */}
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
                <h3 className="font-bold text-stone-900 text-lg">{guesthouse?.name || 'Guesthouse'}</h3>
                <p className="text-xs text-stone-500">Reservation Receipt</p>
              </div>
              <button
                onClick={() => setReceiptReservation(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm border-t border-b border-dashed border-stone-300 py-4">
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
                <span className="font-mono">{receiptReservation.guestPhone}</span>
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
                  {receiptReservation.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Payment</span>
                <span className="uppercase font-semibold">{receiptReservation.paymentStatus}</span>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 mb-6">
              <span className="font-bold text-stone-900">Total</span>
              <span className="font-mono font-extrabold text-xl text-stone-900">
                ETB {receiptReservation.totalPrice.toLocaleString()}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                onClick={() => setReceiptReservation(null)}
                className="flex-1 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-sm rounded-xl transition-colors"
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