import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

import {
  BedDouble,
  Search,
  LogOut,
  CheckCircle,
  CreditCard,
  Building,
  X,
  SlidersHorizontal,
  ArrowLeft,
  Printer,
  AlertCircle,
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

      setError(
        err?.message ||
          'Failed to delete reservation.'
      );
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

    // ----------------------------------------------------------
    // 1. Dedicated receptionist endpoint
    // ----------------------------------------------------------

    if (
      typeof ApiService.getReceptionistGuesthouse ===
      'function'
    ) {
      try {
        const dedicated =
          await ApiService.getReceptionistGuesthouse();

        if (dedicated) {
          candidates.push(dedicated);
        }
      } catch (err) {
        console.warn(
          'Dedicated receptionist guesthouse lookup failed:',
          err
        );
      }
    }

    // ----------------------------------------------------------
    // 2. Dashboard response
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // 3. Authenticated user
    // ----------------------------------------------------------

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

        city:
          currentUser?.guesthouseCity ??
          currentUser?.propertyCity,

        address:
          currentUser?.guesthouseAddress ??
          currentUser?.propertyAddress,
      });
    }

    // ----------------------------------------------------------
    // 4. Look inside receptionist records
    // ----------------------------------------------------------

    const records = [
      ...(Array.isArray(arrivalList)
        ? arrivalList
        : []),

      ...(Array.isArray(departureList)
        ? departureList
        : []),

      ...(Array.isArray(inHouseList)
        ? inHouseList
        : []),

      ...(Array.isArray(reservationList)
        ? reservationList
        : []),

      ...(Array.isArray(roomList)
        ? roomList
        : []),
    ];

    const recordWithProperty =
      records.find((record) => {
        const id =
          record?.guesthouseId ??
          record?.propertyId ??
          record?.guesthouse?.id ??
          record?.property?.id ??
          record?.room?.guesthouseId ??
          record?.room?.guesthouse?.id;

        return (
          id !== undefined &&
          id !== null &&
          String(id).trim() !== ''
        );
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

    // ----------------------------------------------------------
    // Select first valid guesthouse
    // ----------------------------------------------------------

    const valid = candidates.find((candidate) => {
      const id =
        candidate?.id ??
        candidate?.guesthouseId ??
        candidate?.propertyId;

      return (
        id !== undefined &&
        id !== null &&
        String(id).trim() !== ''
      );
    });

    if (!valid) {
      return null;
    }

    return {
      ...valid,

      id:
        valid.id ??
        valid.guesthouseId ??
        valid.propertyId,

      name:
        valid.name ??
        valid.guesthouseName ??
        valid.propertyName ??
        'Assigned Guesthouse',
    };
  };

  // ============================================================
  // FRONTEND GUESTHOUSE FILTER
  // ============================================================

  const filterByGuesthouse = (
    items,
    assignedId
  ) => {
    if (
      !Array.isArray(items) ||
      !assignedId
    ) {
      return items || [];
    }

    const normalizedAssignedId =
      String(assignedId);

    return items.filter((item) => {
      const itemId =
        item?.guesthouseId ??
        item?.propertyId ??
        item?.guesthouse?.id ??
        item?.property?.id ??
        item?.room?.guesthouseId ??
        item?.room?.guesthouse?.id;

      /*
       * If endpoint does not expose guesthouseId,
       * keep the record because backend is expected
       * to already scope the receptionist endpoint.
       */

      if (
        itemId === undefined ||
        itemId === null ||
        itemId === ''
      ) {
        return true;
      }

      return (
        String(itemId) ===
        normalizedAssignedId
      );
    });
  };

  // ============================================================
  // LOAD DASHBOARD
  // ============================================================

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // --------------------------------------------------------
      // Dashboard statistics
      // --------------------------------------------------------

      const stats =
        await ApiService.getReceptionistDashboardStats();

      setDashboardStats(stats);

      // --------------------------------------------------------
      // Arrivals
      // --------------------------------------------------------

      const arr =
        await ApiService.getReceptionistArrivals();

      // --------------------------------------------------------
      // Departures
      // --------------------------------------------------------

      const dep =
        await ApiService.getReceptionistDepartures();

      // --------------------------------------------------------
      // In-house
      // --------------------------------------------------------

      const inHouse =
        await ApiService.getReceptionistInHouse();

      // --------------------------------------------------------
      // Reservations
      // --------------------------------------------------------

      const resList =
        await ApiService.getReceptionistReservations();

      // --------------------------------------------------------
      // Rooms
      // --------------------------------------------------------

      const roomList =
        await ApiService.getReceptionistRooms();

      // --------------------------------------------------------
      // Resolve assigned guesthouse
      // --------------------------------------------------------

      const assignedGuesthouse =
        await resolveAssignedGuesthouse({
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

      setGuesthouse(
        assignedGuesthouse
      );

      const assignedId = String(
        assignedGuesthouse.id
      );

      // --------------------------------------------------------
      // Filter receptionist data
      // --------------------------------------------------------

      setArrivals(
        filterByGuesthouse(
          arr,
          assignedId
        )
      );

      setDepartures(
        filterByGuesthouse(
          dep,
          assignedId
        )
      );

      setInHouseGuests(
        filterByGuesthouse(
          inHouse,
          assignedId
        )
      );

      setAllReservations(
        filterByGuesthouse(
          resList,
          assignedId
        )
      );

      setRooms(
        filterByGuesthouse(
          roomList,
          assignedId
        )
      );
    } catch (err) {
      console.error(
        'Error loading dashboard data:',
        err
      );

      setError(
        err?.message ||
          'Failed to load dashboard data'
      );
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

      const results =
        await ApiService.searchReceptionistReservations(
          searchTerm
        );

      const assignedId = String(
        guesthouse?.id ??
          guesthouse?.guesthouseId ??
          guesthouse?.propertyId ??
          ''
      );

      setAllReservations(
        assignedId
          ? filterByGuesthouse(
              results,
              assignedId
            )
          : results
      );

      setActiveTab('all');
    } catch (err) {
      console.error(
        'Search error:',
        err
      );

      setError(
        err?.message ||
          'Search failed'
      );
    }
  };

  // ============================================================
  // CHECK IN
  // ============================================================

  const handleCheckIn = async (
    reservationId
  ) => {
    setActionLoadingId(
      reservationId
    );

    setError(null);

    try {
      await ApiService.checkInGuest(
        reservationId
      );

      await loadData();
    } catch (err) {
      console.error(
        'Check-in error:',
        err
      );

      setError(
        err?.message ||
          'Check-in error'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // ============================================================
  // CHECK OUT
  // ============================================================

  const handleCheckOut = async (
    reservationId
  ) => {
    setActionLoadingId(
      reservationId
    );

    setError(null);

    try {
      await ApiService.checkOutGuest(
        reservationId
      );

      await loadData();
    } catch (err) {
      console.error(
        'Check-out error:',
        err
      );

      setError(
        err?.message ||
          'Check-out error'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // ============================================================
  // ROOM STATUS UPDATE
  // ============================================================

  const handleUpdateRoomAvailability =
    async (
      roomId,
      maintenanceStatus
    ) => {
      setActionLoadingId(
        `room-${roomId}`
      );

      setError(null);

      try {
        /*
         * IMPORTANT:
         * ApiService converts this to the exact
         * Prisma enum format before sending it.
         */

        await ApiService.updateReceptionistRoomAvailability(
          roomId,
          maintenanceStatus
        );

        await loadData();
      } catch (err) {
        console.error(
          'Room status update error:',
          err
        );

        setError(
          err?.message ||
            'Room status update error'
        );
      } finally {
        setActionLoadingId(null);
      }
    };

  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate = (
    dateString
  ) => {
    if (
      !dateString ||
      dateString === 'N/A'
    ) {
      return 'N/A';
    }

    const date =
      new Date(dateString);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return 'N/A';
    }

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  };

  // ============================================================
  // RESERVATION STATUS COLOR
  // ============================================================

  const getReservationStatusColor =
    (status) => {
      switch (
        String(status || '')
          .toUpperCase()
      ) {
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

  // ============================================================
  // ROOM STATUS COLOR
  // ============================================================

  const getMaintenanceStatusColor =
    (status) => {
      switch (
        String(status || '')
          .toUpperCase()
      ) {
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

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-stone-500">
          Loading dashboard...
        </div>
      </div>
    );
  }

  // ============================================================
  // DASHBOARD
  // ============================================================

  return (
    <div className="flex min-h-screen bg-stone-100">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <div className="w-64 bg-white border-r border-stone-200 shadow-sm flex flex-col">

        {/* Guesthouse */}
        <div className="p-6 border-b border-stone-200">

          <div className="flex items-center gap-3 mb-2">

            <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>

            <div>
              <h2 className="font-bold text-stone-900 text-sm">
                {guesthouse?.name ||
                  'Guesthouse'}
              </h2>

              <p className="text-xs text-stone-500">
                Reception Dashboard
              </p>
            </div>

          </div>

        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">

          {/* ALL RESERVATIONS */}
          <button
            onClick={() => {
              setActiveTab('all');
              setSearchTerm('');
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-[1.02] ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 border-2 border-purple-400'
                : 'text-stone-600 bg-white border-2 border-stone-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700'
            }`}
          >

            <span className="text-lg">
              📅
            </span>

            <div className="flex-1 text-left">

              <div className="font-bold">
                All Reservations
              </div>

              <div
                className={`text-xs ${
                  activeTab === 'all'
                    ? 'text-purple-100'
                    : 'text-stone-500'
                }`}
              >
                {allReservations.length}{' '}
                total
              </div>

            </div>

          </button>

          {/* IN-HOUSE */}
          <button
            onClick={() => {
              setActiveTab('inhouse');
              setSearchTerm('');
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-[1.02] ${
              activeTab === 'inhouse'
                ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/30 border-2 border-teal-400'
                : 'text-stone-600 bg-white border-2 border-stone-200 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700'
            }`}
          >

            <BedDouble
              className={`w-5 h-5 ${
                activeTab === 'inhouse'
                  ? 'text-white'
                  : 'text-teal-500'
              }`}
            />

            <div className="flex-1 text-left">

              <div className="font-bold">
                In-House Guests
              </div>

              <div
                className={`text-xs ${
                  activeTab === 'inhouse'
                    ? 'text-teal-100'
                    : 'text-stone-500'
                }`}
              >
                {dashboardStats?.inHouse ??
                  inHouseGuests.length}{' '}
                staying
              </div>

            </div>

          </button>

          {/* ROOMS */}
          <button
            onClick={() => {
              setActiveTab('rooms');
              setSearchTerm('');
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-[1.02] ${
              activeTab === 'rooms'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 border-2 border-blue-400'
                : 'text-stone-600 bg-white border-2 border-stone-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >

            <SlidersHorizontal
              className={`w-5 h-5 ${
                activeTab === 'rooms'
                  ? 'text-white'
                  : 'text-blue-500'
              }`}
            />

            <div className="flex-1 text-left">

              <div className="font-bold">
                Room Availability
              </div>

              <div
                className={`text-xs ${
                  activeTab === 'rooms'
                    ? 'text-blue-100'
                    : 'text-stone-500'
                }`}
              >
                {rooms.length} rooms
              </div>

            </div>

          </button>

        </nav>

        {/* USER */}
        <div className="p-4 border-t border-stone-200">

          <div className="flex items-center gap-3">

            <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0) ||
                user?.fullName?.charAt(0) ||
                'R'}
            </div>

            <div className="flex-1">

              <div className="text-sm font-semibold text-stone-900">
                {user?.name ||
                  user?.fullName ||
                  'Receptionist'}
              </div>

              <div className="text-xs text-stone-500">
                Front Desk Staff
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="flex-1 p-8 overflow-y-auto">

        {/* ERROR */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2">

            <AlertCircle className="w-4 h-4" />

            <span className="text-sm">
              {error}
            </span>

            <button
              onClick={() =>
                setError(null)
              }
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>

          </div>
        )}

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">

          <div className="flex items-center gap-4">

            <button
              onClick={() =>
                navigate('/')
              }
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-stone-600 to-stone-700 hover:from-stone-700 hover:to-stone-800 text-white rounded-xl shadow-lg shadow-stone-500/30 transition-all duration-200 transform hover:scale-105 border-2 border-stone-500"
            >
              <ArrowLeft className="w-4 h-4" />

              <span className="text-sm font-semibold">
                Back
              </span>
            </button>

            <div>

              <h1 className="text-2xl font-bold text-stone-900">

                {activeTab === 'inhouse' &&
                  'Guests Currently In-House'}

                {activeTab === 'all' &&
                  'Property Reservation Master List'}

                {activeTab === 'rooms' &&
                  'Room Availability Management'}

              </h1>

              <p className="text-sm text-stone-500 mt-1">

                {activeTab === 'inhouse' &&
                  'All guests currently staying, regardless of departure date'}

                {activeTab === 'all' &&
                  `Full list of reservations for ${
                    guesthouse?.name ||
                    'guesthouse'
                  }`}

                {activeTab === 'rooms' &&
                  'Receptionists can update room status for housekeeping and maintenance'}

              </p>

            </div>

          </div>

          {/* PROFILE */}
          <div className="relative">

            <button
              type="button"
              onClick={() =>
                setProfileMenuOpen(
                  !profileMenuOpen
                )
              }
              className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-300 rounded-xl hover:bg-stone-50"
            >

              <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.charAt(0) ||
                  user?.fullName?.charAt(0) ||
                  'R'}
              </div>

              <span className="text-sm font-semibold text-stone-700">
                {user?.name ||
                  user?.fullName ||
                  'Receptionist'}
              </span>

              <span className="text-stone-400">
                ▼
              </span>

            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-stone-200 rounded-xl shadow-xl z-50">

                <div className="p-4 border-b border-stone-200">

                  <div className="font-semibold text-stone-900">
                    {user?.name ||
                      user?.fullName ||
                      'Receptionist'}
                  </div>

                  <div className="text-xs text-stone-500 mt-1">
                    {user?.email ||
                      'No email'}
                  </div>

                  <div className="text-xs font-bold text-blue-600 mt-2">
                    RECEPTIONIST
                  </div>

                </div>

                <div className="p-2">

                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(
                        false
                      );

                      navigate(
                        '/profile'
                      );
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-stone-700 hover:bg-stone-100"
                  >
                    ⚙️
                    <span>
                      Update Profile
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleLogout
                    }
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />

                    <span>
                      Logout
                    </span>
                  </button>

                </div>

              </div>
            )}

          </div>

        </div>

        {/* ====================================================
            KPI CARDS
        ==================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-8">

          {/* IN HOUSE */}
          <button
            onClick={() => {
              setActiveTab('inhouse');
              setSearchTerm('');
            }}
            className="text-left bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-2xl border-2 border-emerald-200 shadow-lg shadow-emerald-500/20 flex items-center justify-between transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
          >

            <div>

              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block">
                In-House Guests
              </span>

              <span className="text-2xl font-mono font-extrabold text-emerald-900">
                {dashboardStats?.inHouse ??
                  0}
              </span>

              <span className="text-xs text-emerald-700 block mt-1">
                Rooms occupied
              </span>

            </div>

            <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg">
              <BedDouble className="w-6 h-6" />
            </div>

          </button>

          {/* AVAILABLE ROOMS */}
          <button
            onClick={() => {
              setActiveTab('rooms');
              setSearchTerm('');
            }}
            className="text-left bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-2xl border-2 border-purple-200 shadow-lg shadow-purple-500/20 flex items-center justify-between transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
          >

            <div>

              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 block">
                Available Rooms
              </span>

              <span className="text-2xl font-mono font-extrabold text-purple-900">
                {dashboardStats?.availableRooms ??
                  0}{' '}
                /{' '}
                {dashboardStats?.totalRooms ??
                  0}
              </span>

              <span className="text-xs text-purple-700 block mt-1">
                Ready for guests
              </span>

            </div>

            <div className="p-3 bg-purple-500 text-white rounded-xl shadow-lg">
              <SlidersHorizontal className="w-6 h-6" />
            </div>

          </button>

        </div>

        {/* SEARCH */}
        <div className="relative mb-6">

          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />

          <input
            type="text"
            placeholder="Search guest name, room #, reservation ID..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (
                e.key === 'Enter'
              ) {
                handleSearch();
              }
            }}
            className="w-full pl-10 pr-24 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
          >
            Search
          </button>

        </div>

        {/* ====================================================
            IN-HOUSE
        ==================================================== */}

        {activeTab === 'inhouse' && (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">

            {inHouseGuests.length ===
            0 ? (
              <div className="p-8 text-center text-stone-500 text-xs">
                No guests currently in-house.
              </div>
            ) : (
              <div className="divide-y divide-stone-200">

                {inHouseGuests.map(
                  (res) => (
                    <div
                      key={res.id}
                      className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >

                      <div className="space-y-1">

                        <div className="flex items-center gap-2">

                          <span className="font-mono text-xs font-bold text-teal-900 bg-teal-100 px-2 py-0.5 rounded">
                            #{res.id}
                          </span>

                          <span className="font-bold text-stone-900 text-sm">
                            {res.guestName}
                          </span>

                          <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Checked In
                          </span>

                        </div>

                        <p className="text-xs text-stone-500">
                          Phone:{' '}
                          <span className="font-mono">
                            {res.guestPhone ||
                              'N/A'}
                          </span>{' '}
                          &bull; Room{' '}
                          {res.roomNumber}{' '}
                          (
                          {res.roomType}
                          )
                        </p>

                        <p className="text-xs text-stone-500">
                          {formatDate(
                            res.checkInDate
                          )}{' '}
                          -{' '}
                          {formatDate(
                            res.checkOutDate
                          )}
                        </p>

                      </div>

                      <div className="flex gap-2 shrink-0">

                        <button
                          onClick={() =>
                            setReceiptReservation(
                              res
                            )
                          }
                          className="px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 border-2 border-stone-200"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            handleCheckOut(
                              res.id
                            )
                          }
                          disabled={
                            actionLoadingId ===
                            res.id
                          }
                          className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-500/30 transition-all duration-200 transform hover:scale-105 flex items-center gap-1.5 border-2 border-teal-400"
                        >
                          <span>
                            {actionLoadingId ===
                            res.id
                              ? 'Checking Out...'
                              : 'Check Out Now'}
                          </span>
                        </button>

                      </div>

                    </div>
                  )
                )}

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

                    <th className="p-3.5">
                      Token & Guest
                    </th>

                    <th className="p-3.5">
                      Room
                    </th>

                    <th className="p-3.5">
                      Dates
                    </th>

                    <th className="p-3.5">
                      Status
                    </th>

                    <th className="p-3.5">
                      Amount
                    </th>

                    <th className="p-3.5">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-stone-200 font-medium text-stone-800">

                  {allReservations.length ===
                  0 ? (
                    <tr>

                      <td
                        colSpan="6"
                        className="p-8 text-center text-stone-500"
                      >
                        No reservations found.
                      </td>

                    </tr>
                  ) : (
                    allReservations.map(
                      (r) => (
                        <tr key={r.id}>

                          <td className="p-3.5">

                            <div className="font-mono font-bold text-amber-900">
                              #res_{r.id}
                            </div>

                            <div className="font-bold">
                              {r.guestName}
                            </div>

                          </td>

                          <td className="p-3.5">
                            Room{' '}
                            {r.roomNumber}{' '}
                            {r.roomType}
                          </td>

                          <td className="p-3.5">
                            {formatDate(
                              r.checkInDate
                            )}{' '}
                            -{' '}
                            {formatDate(
                              r.checkOutDate
                            )}
                          </td>

                          <td className="p-3.5">

                            <span
                              className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded ${getReservationStatusColor(
                                r.status
                              )}`}
                            >
                              {String(
                                r.status ||
                                  'PENDING'
                              )
                                .replace(
                                  /_/g,
                                  ' '
                                )}
                            </span>

                          </td>

                          <td className="p-3.5 font-mono">
                            ETB{' '}
                            {Number(
                              r.totalPrice ||
                                0
                            ).toLocaleString()}
                          </td>

                          <td className="p-3.5">

                            <div className="flex gap-2 flex-wrap">

                              {/* CHECK IN */}
                              {String(
                                r.status ||
                                  ''
                              ).toUpperCase() ===
                                'CONFIRMED' && (
                                <button
                                  onClick={() =>
                                    handleCheckIn(
                                      r.id
                                    )
                                  }
                                  disabled={
                                    actionLoadingId ===
                                    r.id
                                  }
                                  className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-60 text-white text-xs rounded-lg font-bold"
                                >
                                  {actionLoadingId ===
                                  r.id
                                    ? 'Checking In...'
                                    : 'Check In'}
                                </button>
                              )}

                              {/* CHECK OUT */}
                              {String(
                                r.status ||
                                  ''
                              ).toUpperCase() ===
                                'CHECKED_IN' && (
                                <button
                                  onClick={() =>
                                    handleCheckOut(
                                      r.id
                                    )
                                  }
                                  disabled={
                                    actionLoadingId ===
                                    r.id
                                  }
                                  className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-60 text-white text-xs rounded-lg font-bold"
                                >
                                  {actionLoadingId ===
                                  r.id
                                    ? 'Checking Out...'
                                    : 'Check Out'}
                                </button>
                              )}

                              {/* RECEIPT */}
                              <button
                                onClick={() =>
                                  setReceiptReservation(
                                    r
                                  )
                                }
                                className="px-3 py-1 bg-stone-200 text-stone-700 text-xs rounded hover:bg-stone-300 font-bold"
                              >
                                Receipt
                              </button>

                              {/* DELETE */}
                              {[
                                'CHECKED_OUT',
                                'CANCELLED',
                              ].includes(
                                String(
                                  r.status ||
                                    ''
                                )
                                  .trim()
                                  .toUpperCase()
                              ) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteReservation(
                                      r
                                    )
                                  }
                                  disabled={
                                    actionLoadingId ===
                                    r.id
                                  }
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs rounded-lg font-bold"
                                >
                                  {actionLoadingId ===
                                  r.id
                                    ? 'Deleting...'
                                    : 'Delete'}
                                </button>
                              )}

                            </div>

                          </td>

                        </tr>
                      )
                    )
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

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs text-stone-600 flex items-center gap-2">

              <AlertCircle className="w-4 h-4 text-blue-700 shrink-0" />

              <span>
                Receptionists can update room
                status: Available, Unavailable,
                Cleaning, and Maintenance.
              </span>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {rooms.length === 0 ? (
                <div className="col-span-full bg-white p-8 rounded-2xl border border-stone-200 text-center text-stone-500">
                  No rooms found for this guesthouse.
                </div>
              ) : (
                rooms.map((rm) => {

                  const status =
                    String(
                      rm.maintenanceStatus ||
                        'AVAILABLE'
                    ).toUpperCase();

                  const isAvailable =
                    status ===
                    'AVAILABLE';

                  const isRoomActionLoading =
                    actionLoadingId ===
                    `room-${rm.id}`;

                  return (
                    <div
                      key={rm.id}
                      className="bg-white p-5 rounded-2xl border border-stone-200 space-y-3 shadow-sm"
                    >

                      {/* ROOM HEADER */}
                      <div className="flex justify-between items-start">

                        <div>

                          <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                            Room{' '}
                            {rm.roomNumber}
                          </span>

                          <h3 className="font-bold text-stone-900 text-base mt-1">
                            {rm.roomType}
                          </h3>

                        </div>

                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getMaintenanceStatusColor(
                            status
                          )}`}
                        >
                          {status}
                        </span>

                      </div>

                      {/* ROOM INFO */}
                      <div className="text-xs text-stone-500 font-mono">

                        {rm.capacity ??
                          0}{' '}
                        Guests &bull; Rate
                        ETB{' '}
                        {Number(
                          rm.price ??
                            rm.pricePerNight ??
                            0
                        ).toLocaleString()}

                      </div>

                      {/* OCCUPANCY */}
                      <div className="text-xs text-stone-500">

                        Occupancy:{' '}

                        <span
                          className={`font-bold ${
                            rm.available
                              ? 'text-emerald-600'
                              : 'text-red-600'
                          }`}
                        >
                          {rm.available
                            ? 'Vacant'
                            : 'Occupied'}
                        </span>

                      </div>

                      {/* STATUS BUTTONS */}
                      <div className="flex gap-2">

                        {/* MARK AVAILABLE */}
                        {!isAvailable && (
                          <button
                            onClick={() =>
                              handleUpdateRoomAvailability(
                                rm.id,
                                'AVAILABLE'
                              )
                            }
                            disabled={
                              isRoomActionLoading
                            }
                            className="flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-2 border-emerald-400 shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-60"
                          >
                            {isRoomActionLoading
                              ? 'Updating...'
                              : 'Mark Available'}
                          </button>
                        )}

                        {/* CLEANING + MAINTENANCE */}
                        {isAvailable && (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateRoomAvailability(
                                  rm.id,
                                  'CLEANING'
                                )
                              }
                              disabled={
                                isRoomActionLoading
                              }
                              className="flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 border-2 border-yellow-300 shadow-lg shadow-yellow-500/30 hover:from-yellow-500 hover:to-yellow-600 disabled:opacity-60"
                            >
                              {isRoomActionLoading
                                ? 'Updating...'
                                : 'Cleaning'}
                            </button>

                            <button
                              onClick={() =>
                                handleUpdateRoomAvailability(
                                  rm.id,
                                  'MAINTENANCE'
                                )
                              }
                              disabled={
                                isRoomActionLoading
                              }
                              className="flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 to-orange-500 text-orange-900 border-2 border-orange-300 shadow-lg shadow-orange-500/30 hover:from-orange-500 hover:to-orange-600 disabled:opacity-60"
                            >
                              {isRoomActionLoading
                                ? 'Updating...'
                                : 'Maintenance'}
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

      </div>

      {/* ======================================================
          RECEIPT MODAL
      ====================================================== */}

      {receiptReservation && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() =>
            setReceiptReservation(null)
          }
        >

          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="flex justify-between items-start mb-4">

              <div>

                <h3 className="font-bold text-stone-900 text-lg">
                  {guesthouse?.name ||
                    'Guesthouse'}
                </h3>

                <p className="text-xs text-stone-500">
                  Reservation Receipt
                </p>

              </div>

              <button
                onClick={() =>
                  setReceiptReservation(
                    null
                  )
                }
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            <div className="space-y-3 text-sm border-t border-b border-dashed border-stone-300 py-4">

              <div className="flex justify-between">
                <span className="text-stone-500">
                  Reservation #
                </span>

                <span className="font-mono font-bold">
                  {receiptReservation.id}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-stone-500">
                  Guest
                </span>

                <span className="font-semibold">
                  {
                    receiptReservation.guestName
                  }
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-stone-500">
                  Phone
                </span>

                <span className="font-mono">
                  {receiptReservation.guestPhone ||
                    'N/A'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-stone-500">
                  Room
                </span>

                <span>
                  {
                    receiptReservation.roomNumber
                  }{' '}
                  (
                  {
                    receiptReservation.roomType
                  }
                  )
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-stone-500">
                  Check-in
                </span>

                <span>
                  {formatDate(
                    receiptReservation.checkInDate
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-stone-500">
                  Check-out
                </span>

                <span>
                  {formatDate(
                    receiptReservation.checkOutDate
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-stone-500">
                  Nights
                </span>

                <span>
                  {
                    receiptReservation.nightsCount
                  }
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-stone-500">
                  Status
                </span>

                <span
                  className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded ${getReservationStatusColor(
                    receiptReservation.status
                  )}`}
                >
                  {String(
                    receiptReservation.status ||
                      'PENDING'
                  ).replace(
                    /_/g,
                    ' '
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-stone-500">
                  Payment
                </span>

                <span className="uppercase font-semibold">
                  {receiptReservation.paymentStatus ||
                    'PENDING'}
                </span>
              </div>

            </div>

            <div className="flex justify-between items-center mt-4 mb-6">

              <span className="font-bold text-stone-900">
                Total
              </span>

              <span className="font-mono font-extrabold text-xl text-stone-900">
                ETB{' '}
                {Number(
                  receiptReservation.totalPrice ||
                    0
                ).toLocaleString()}
              </span>

            </div>

            <div className="flex gap-2">

              <button
                onClick={() =>
                  window.print()
                }
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>

              <button
                onClick={() =>
                  setReceiptReservation(
                    null
                  )
                }
                className="flex-1 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-sm rounded-xl"
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