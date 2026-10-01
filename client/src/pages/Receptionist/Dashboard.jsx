import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useNavigate } from 'react-router-dom';

import {
  BedDouble,
  CalendarDays,
  Search,
  CheckCircle,
  CreditCard,
  Building,
  X,
  SlidersHorizontal,
  ArrowLeft,
  Printer,
  AlertCircle,
  Menu,
} from 'lucide-react';

export function ReceptionistDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const translateStatus = (value) => t(String(value || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase()));

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ============================================================
  // DELETE RESERVATION
  // ============================================================

  const handleDeleteReservation = async (reservation) => {
    setActionLoadingId(reservation.id);
    setError(null);

    try {
      await ApiService.deleteReceptionistReservation(reservation.id);
      setAllReservations((currentReservations) =>
        currentReservations.filter(
          (item) => item.id !== reservation.id
        )
      );
    } catch (err) {
      console.error('Failed to delete reservation:', err);
      setError(err?.message || t('Failed to delete reservation.'));
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
      name: valid.name ?? valid.guesthouseName ?? valid.propertyName ?? t('Assigned Guesthouse'),
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

  const loadData = async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setLoading(true);
    }
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
          t('No guesthouse is assigned to this receptionist. Please ask the owner/admin to assign this account to a guesthouse.')
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
      setError(err?.message || t('Failed to load dashboard data'));
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
      await loadData({ showLoading: false });
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
      await loadData({ showLoading: false });
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
      await loadData({ showLoading: false });
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
      await loadData({ showLoading: false });
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
        <div className="text-stone-500">{t('Loading dashboard...')}</div>
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
                      {guesthouse?.name || t('Guesthouse')}
              </h2>
              <p className="text-xs text-stone-400">{t('Reception Dashboard')}</p>
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
              <div className="font-bold">{t('All Reservations')}</div>
              <div className={`text-xs ${activeTab === 'all' ? 'text-stone-900' : 'text-stone-400'}`}>
                {allReservations.length} {t('total')}
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
              <div className="font-bold">{t('In-House Guests')}</div>
              <div className={`text-xs ${activeTab === 'inhouse' ? 'text-stone-900' : 'text-stone-400'}`}>
                {dashboardStats?.inHouse ?? inHouseGuests.length} {t('staying')}
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
              <div className="font-bold">{t('Room Availability')}</div>
              <div className={`text-xs ${activeTab === 'rooms' ? 'text-stone-900' : 'text-stone-400'}`}>
                {rooms.length} {t('rooms')}
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
                {user?.name || user?.fullName || t('Receptionist')}
              </div>
              <div className="text-xs text-stone-400">{t('Front Desk Staff')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto lg:ml-72">

        <div className="flex items-center justify-between mb-6">

        {/* MOBILE HAMBURGER MENU - visible only on small screens */}
        <div className="lg:hidden flex items-center mb-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-stone-900 text-white rounded-xl shadow-lg shadow-stone-900/30 hover:bg-stone-800 transition-all duration-200"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-3 font-bold text-stone-900 text-sm">
            {guesthouse?.name || t('Guesthouse')} {t('Dashboard')}
          </span>
        </div>

        </div>

        {/* ====================================================
            KPI CARDS - BRAND COLORS
        ==================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">

          {/* ALL RESERVATIONS */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setSearchTerm('');
            }}
            className={`group w-full min-h-14 text-left p-2 rounded-lg border shadow-sm flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0c3047] hover:border-[#0c3047] hover:text-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 ${activeTab === 'all' ? 'bg-[#0c3047] border-[#0c3047] text-white' : 'bg-white border-sky-200 text-stone-900'}`}
          >
            <div>
              <span className={`text-[9px] font-bold uppercase tracking-wider block ${activeTab === 'all' ? 'text-white/75 group-hover:text-white' : 'text-sky-700'}`}>{t('All Reservations')}</span>
              <span className={`text-base font-mono font-extrabold ${activeTab === 'all' ? 'text-white' : 'text-stone-900 group-hover:text-white'}`}>{allReservations.length}</span>
              <span className={`text-[10px] block ${activeTab === 'all' ? 'text-white/75' : 'text-sky-700 group-hover:text-white/75'}`}>{t('Total bookings')}</span>
            </div>
            <div className={`p-1.5 rounded-md ${activeTab === 'all' ? 'bg-amber-400 text-[#0c3047]' : 'bg-sky-600 text-white group-hover:bg-amber-400 group-hover:text-[#0c3047]'}`}>
              <CalendarDays className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* IN HOUSE - Amber/Gold */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('inhouse');
              setSearchTerm('');
            }}
            className={`group w-full min-h-14 text-left p-2 rounded-lg border shadow-sm flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0c3047] hover:border-[#0c3047] hover:text-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 ${activeTab === 'inhouse' ? 'bg-[#0c3047] border-[#0c3047] text-white' : 'bg-white border-amber-200 text-stone-900'}`}
          >
            <div>
              <span className={`text-[9px] font-bold uppercase tracking-wider block ${activeTab === 'inhouse' ? 'text-white/75' : 'text-amber-700'}`}>{t('In-House Guests')}</span>
              <span className={`text-base font-mono font-extrabold ${activeTab === 'inhouse' ? 'text-white' : 'text-stone-900 group-hover:text-white'}`}>{dashboardStats?.inHouse ?? 0}</span>
              <span className={`text-[10px] block ${activeTab === 'inhouse' ? 'text-white/75' : 'text-amber-700'}`}>{t('Rooms occupied')}</span>
            </div>
            <div className={`p-1.5 rounded-md ${activeTab === 'inhouse' ? 'bg-amber-400 text-[#0c3047]' : 'bg-amber-500 text-stone-900 group-hover:bg-amber-400 group-hover:text-[#0c3047]'}`}>
              <BedDouble className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* AVAILABLE ROOMS - Stone/Dark */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('rooms');
              setSearchTerm('');
            }}
            className={`group w-full min-h-14 text-left p-2 rounded-lg border shadow-sm flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0c3047] hover:border-[#0c3047] hover:text-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 ${activeTab === 'rooms' ? 'bg-[#0c3047] border-[#0c3047] text-white' : 'bg-white border-stone-300 text-stone-900'}`}
          >
            <div>
              <span className={`text-[9px] font-bold uppercase tracking-wider block ${activeTab === 'rooms' ? 'text-white/75' : 'text-stone-700'}`}>{t('Available Rooms')}</span>
              <span className={`text-base font-mono font-extrabold ${activeTab === 'rooms' ? 'text-white' : 'text-stone-900 group-hover:text-white'}`}>
                {dashboardStats?.availableRooms ?? 0} / {dashboardStats?.totalRooms ?? 0}
              </span>
              <span className={`text-[10px] block ${activeTab === 'rooms' ? 'text-white/75' : 'text-stone-700 group-hover:text-white/75'}`}>{t('Ready for guests')}</span>
            </div>
            <div className={`p-1.5 rounded-md ${activeTab === 'rooms' ? 'bg-amber-400 text-[#0c3047]' : 'bg-stone-700 text-white group-hover:bg-amber-400 group-hover:text-[#0c3047]'}`}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </div>
          </button>

        </div>

        {/* SEARCH - Brand Colors */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />

          <input
            type="text"
            placeholder={t('Search guest name, room #, reservation ID...')}
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
            {t('Search')}
          </button>
        </div>

        {/* ====================================================
            IN-HOUSE
        ==================================================== */}

        {activeTab === 'inhouse' && (
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            {inHouseGuests.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs">{t('No guests currently in-house.')}</div>
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
                          {t('Checked In')}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">
                        {t('Phone')}: <span className="font-mono">{res.guestPhone || t('N/A')}</span> &bull; {t('Room')} {res.roomNumber} ({t(res.roomType)})
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
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/30 transition-colors duration-200 flex items-center gap-1.5 border-2 border-amber-500"
                      >
                        <span>{actionLoadingId === res.id ? t('Checking Out...') : t('Check Out Now')}</span>
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
                    <th className="p-3.5">{t('TOKEN & GUEST')}</th>
                    <th className="p-3.5">{t('ROOM')}</th>
                    <th className="p-3.5">{t('DATES')}</th>
                    <th className="p-3.5">{t('STATUS')}</th>
                    <th className="p-3.5">{t('AMOUNT')}</th>
                    <th className="p-3.5">{t('ACTIONS')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-900">
                  {allReservations.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-stone-500">{t('No reservations found.')}</td>
                    </tr>
                  ) : (
                    allReservations.map((r) => (
                      <tr key={r.id}>
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">#res_{r.id}</div>
                          <div className="font-bold">{r.guestName}</div>
                        </td>
                        <td className="p-3.5">{t('Room')} {r.roomNumber} {t(r.roomType)}</td>
                        <td className="p-3.5">{formatDate(r.checkInDate)} - {formatDate(r.checkOutDate)}</td>
                        <td className="p-3.5">
                          <span className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded ${getReservationStatusColor(r.status)}`}>
                            {translateStatus(r.status || 'PENDING')}
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
                                {actionLoadingId === r.id ? t('Checking In...') : t('Check In')}
                              </button>
                            )}

                            {String(r.status || '').toUpperCase() === 'CHECKED_IN' && (
                              <button
                                onClick={() => handleCheckOut(r.id)}
                                disabled={actionLoadingId === r.id}
                                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-900 text-xs rounded-lg font-bold"
                              >
                                {actionLoadingId === r.id ? t('Checking Out...') : t('Check Out')}
                              </button>
                            )}

                            <button
                              onClick={() => setReceiptReservation(r)}
                              className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs rounded font-bold border border-stone-200"
                            >
                              {t('Receipt')}
                            </button>

                            {['CHECKED_OUT', 'CANCELLED'].includes(String(r.status || '').trim().toUpperCase()) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteReservation(r)}
                                disabled={actionLoadingId === r.id}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs rounded-lg font-bold"
                              >
                                {actionLoadingId === r.id ? t('Deleting...') : t('Delete')}
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
              <span>{t('Receptionists can update room status: Available, Unavailable, and Maintenance.')}</span>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              {rooms.length === 0 ? (
                <div className="p-8 text-center text-stone-500">{t('No rooms found for this guesthouse.')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="p-3.5">{t('ROOM')}</th>
                        <th className="p-3.5">{t('CAPACITY')}</th>
                        <th className="p-3.5">{t('RATE')}</th>
                        <th className="p-3.5">{t('OCCUPANCY')}</th>
                        <th className="p-3.5">{t('STATUS')}</th>
                        <th className="p-3.5">{t('ACTIONS')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-medium text-stone-900">
                      {rooms.map((rm) => {
                        const status = String(rm.maintenanceStatus || 'AVAILABLE').toUpperCase();
                        const isOccupied = rm.availabilityStatus === 'occupied' || rm.available === false;
                        const isRoomActionLoading = actionLoadingId === `room-${rm.id}`;

                        return (
                          <tr key={rm.id}>
                            <td className="p-3.5">
                              <div className="font-mono font-bold">{t('Room')} {rm.roomNumber}</div>
                              <div className="text-stone-500">{translateStatus(rm.roomType)}</div>
                            </td>
                            <td className="p-3.5">{t('{{count}} guests', { count: rm.capacity ?? 0 })}</td>
                            <td className="p-3.5 font-mono">ETB {Number(rm.price ?? rm.pricePerNight ?? 0).toLocaleString()}</td>
                            <td className="p-3.5">
                              <span className={`font-bold ${rm.available ? 'text-emerald-600' : 'text-red-600'}`}>
                                {rm.available ? t('Vacant') : t('Occupied')}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getMaintenanceStatusColor(isOccupied ? 'UNAVAILABLE' : status)}`}>
                                {translateStatus(isOccupied ? 'UNAVAILABLE' : status)}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <div className="flex gap-2 flex-wrap">
                                <button
                                  onClick={() => handleUpdateRoomAvailability(rm.id, 'AVAILABLE')}
                                  disabled={isRoomActionLoading}
                                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-900 text-xs rounded-lg font-bold disabled:opacity-60"
                                >
                                  {isRoomActionLoading ? t('Updating...') : t('Available')}
                                </button>
                                <button
                                  onClick={() => handleUpdateRoomAvailability(rm.id, 'MAINTENANCE')}
                                  disabled={isRoomActionLoading}
                                  className="px-3 py-1 bg-orange-500 hover:bg-orange-400 text-white text-xs rounded-lg font-bold disabled:opacity-60"
                                >
                                  {isRoomActionLoading ? t('Updating...') : t('Maintenance')}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-stone-200 text-center">
          <p className="text-sm text-stone-500">© 2026 {t('Guesthouse Platform')}. {t('All rights reserved.')}</p>
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
                <p className="text-xs text-stone-500">{t('Reservation Receipt')}</p>
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
                    <span className="text-stone-500">{t('Reservation #')}</span>
                <span className="font-mono font-bold">{receiptReservation.id}</span>
              </div>
              <div className="flex justify-between">
                    <span className="text-stone-500">{t('Guest')}</span>
                <span className="font-semibold">{receiptReservation.guestName}</span>
              </div>
              <div className="flex justify-between">
                    <span className="text-stone-500">{t('Phone')}</span>
                <span className="font-mono">{receiptReservation.guestPhone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                    <span className="text-stone-500">{t('Room')}</span>
                <span>{receiptReservation.roomNumber} ({receiptReservation.roomType})</span>
              </div>
              <div className="flex justify-between">
                    <span className="text-stone-500">{t('Check-in')}</span>
                <span>{formatDate(receiptReservation.checkInDate)}</span>
              </div>
              <div className="flex justify-between">
                    <span className="text-stone-500">{t('Check-out')}</span>
                <span>{formatDate(receiptReservation.checkOutDate)}</span>
              </div>
              <div className="flex justify-between">
                    <span className="text-stone-500">{t('Nights')}</span>
                <span>{receiptReservation.nightsCount}</span>
              </div>
              <div className="flex justify-between">
                    <span className="text-stone-500">{t('Status')}</span>
                <span className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded ${getReservationStatusColor(receiptReservation.status)}`}>
                  {translateStatus(receiptReservation.status || 'PENDING')}
                </span>
              </div>
              <div className="flex justify-between">
                    <span className="text-stone-500">{t('Payment')}</span>
                <span className="uppercase font-semibold">{translateStatus(receiptReservation.paymentStatus || 'PENDING')}</span>
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
                {t('Print')}
              </button>
              <button
                onClick={() => setReceiptReservation(null)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm rounded-xl"
              >
                {t('Close')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ReceptionistDashboard;