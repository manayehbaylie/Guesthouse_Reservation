import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Building2,
  DoorOpen,
  BedDouble,
  Users,
  UserPlus,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  CreditCard,
  Smartphone,
  DollarSign,
  Receipt,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  BarChart3,
  LayoutDashboard,
  Star,
  MessageSquare,
  Send,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Sparkles,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  Settings,
  ToggleLeft,
  ToggleRight,
  Menu,
  X,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  Phone,
  Mail,
  Check,
  Percent,
} from 'lucide-react';

const ETHIOPIAN_CITIES = [
  'Addis Ababa',
  'Hawassa',
  'Bishoftu',
  'Bahir Dar',
  'Lalibela',
  'Gondar',
  'Arba Minch',
  'Mekelle',
  'Dire Dawa',
  'Jimma',
  'Adama',
];

const PRESET_AMENITIES = [
  'Free High-Speed Wi-Fi',
  'Complimentary Breakfast',
  '24/7 Generator Backup',
  'Secure Parking',
  'Continuous Hot Water',
  'Airport Shuttle Service',
  'Daily Room Cleaning',
  'Smart TV with DSTV',
  'Air Conditioning',
  'Front-Desk Concierge',
  'Balcony with City View',
  'Kitchen / Dining Area',
];

export function OwnerDashboard() {
  const { user, switchUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab State (URL sync or default 'overview')
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sidebar Collapse on Desktop / Mobile Drawer
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [guesthouse, setGuesthouse] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [staff, setStaff] = useState([]);
  const [payments, setPayments] = useState([]);
  const [revenueReport, setRevenueReport] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Toast / Alert Notification State
  const [notification, setNotification] = useState(null);

  // Filter & Search States
  const [roomFilterStatus, setRoomFilterStatus] = useState('ALL');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [paymentFilterMethod, setPaymentFilterMethod] = useState('ALL');
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');

  // Modals
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);

  // Room Form State
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('SUITE');
  const [roomCapacity, setRoomCapacity] = useState(2);
  const [roomPrice, setRoomPrice] = useState(2500);
  const [roomAvailable, setRoomAvailable] = useState(true);

  // Staff Form State
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('+251 9');
  const [staffPassword, setStaffPassword] = useState('Reception@123');

  // Edit Property Profile State
  const [propName, setPropName] = useState('');
  const [propCity, setPropCity] = useState('Addis Ababa');
  const [propAddress, setPropAddress] = useState('');
  const [propDesc, setPropDesc] = useState('');
  const [propImage, setPropImage] = useState('');
  const [propAmenities, setPropAmenities] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);

  // Review Response State
  const [respondingToReviewId, setRespondingToReviewId] = useState(null);
  const [reviewResponseText, setReviewResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Onboarding (New Owner without Guesthouse)
  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingCity, setOnboardingCity] = useState('Addis Ababa');
  const [onboardingAddress, setOnboardingAddress] = useState('');
  const [onboardingDesc, setOnboardingDesc] = useState('');
  const [onboardingImage, setOnboardingImage] = useState('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80');
  const [onboardingAmenities, setOnboardingAmenities] = useState(['Free High-Speed Wi-Fi', 'Complimentary Breakfast', '24/7 Generator Backup']);
  const [submittingOnboarding, setSubmittingOnboarding] = useState(false);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
    setMobileDrawerOpen(false);
  };

  /* ==========================================================
     LOAD ALL OWNER DATA
     ========================================================== */
  const loadOwnerDashboard = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      // 1. Fetch Owner's Guesthouse
      const gh = await ApiService.getMyGuesthouse();
      setGuesthouse(gh);

      if (gh) {
        setPropName(gh.name || '');
        setPropCity(gh.city || 'Addis Ababa');
        setPropAddress(gh.address || gh.location || '');
        setPropDesc(gh.description || '');
        setPropImage(gh.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80');
        setPropAmenities(gh.amenities && gh.amenities.length > 0 ? gh.amenities : PRESET_AMENITIES.slice(0, 4));

        // 2. Fetch Rooms for this guesthouse
        try {
          const rmList = await ApiService.getRoomsForGuesthouse(gh.id);
          setRooms(rmList || []);
        } catch {
          setRooms([]);
        }

        // 3. Fetch Receptionist Staff for this guesthouse
        try {
          const staffList = await ApiService.getOwnerReceptionists(gh.id);
          setStaff(staffList || []);
        } catch {
          setStaff([]);
        }

        // 4. Fetch Revenue & Verified Payments
        try {
          const rev = await ApiService.getOwnerRevenueReport(gh.id);
          setRevenueReport(rev);
        } catch {
          setRevenueReport(null);
        }

        try {
          const pmts = await ApiService.getOwnerPayments(gh.id);
          setPayments(pmts || []);
        } catch {
          setPayments([]);
        }

        // 5. Fetch Recent Reservations
        try {
          const rsvs = await ApiService.getOwnerDashboardRecentReservations();
          setReservations(rsvs || []);
        } catch {
          setReservations([]);
        }

        // 6. Fetch Reviews
        try {
          const revs = await ApiService.getOwnerReviews();
          setReviews(revs || []);
        } catch {
          setReviews([]);
        }
      }
    } catch (err) {
      console.error('Error loading owner dashboard:', err);
      showToast(err.message || 'Error loading dashboard data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOwnerDashboard();
  }, [user?.id]);

  /* ==========================================================
     ROOM INVENTORY ACTIONS
     ========================================================== */
  const handleToggleRoomStatus = async (room) => {
    const nextStatus = room.availabilityStatus === 'available' ? 'occupied' : 'available';
    try {
      await ApiService.updateRoomAvailability(room.id, nextStatus);
      showToast(`Room ${room.roomNumber} status set to ${nextStatus.toUpperCase()}`);
      loadOwnerDashboard(true);
    } catch (err) {
      showToast(err.message || 'Failed to toggle room status', 'error');
    }
  };

  const handleOpenAddRoomModal = () => {
    setEditingRoom(null);
    setRoomNumber('');
    setRoomType('SUITE');
    setRoomCapacity(2);
    setRoomPrice(2500);
    setRoomAvailable(true);
    setShowAddRoomModal(true);
  };

  const handleOpenEditRoomModal = (room) => {
    setEditingRoom(room);
    setRoomNumber(room.roomNumber);
    setRoomType(room.type || 'SUITE');
    setRoomCapacity(room.capacity || 2);
    setRoomPrice(room.pricePerNight || 2500);
    setRoomAvailable(room.availabilityStatus === 'available');
    setShowAddRoomModal(true);
  };

  const handleSaveRoomSubmit = async (e) => {
    e.preventDefault();
    if (!guesthouse) return;

    try {
      if (editingRoom) {
        // Update Room
        await ApiService.updateRoom(editingRoom.id, {
          roomNumber,
          roomType,
          capacity: Number(roomCapacity),
          pricePerNight: Number(roomPrice),
          available: roomAvailable,
        });
        showToast(`Room ${roomNumber} updated successfully!`);
      } else {
        // Create Room
        await ApiService.addRoom({
          guesthouseId: guesthouse.id,
          roomNumber,
          type: roomType,
          capacity: Number(roomCapacity),
          pricePerNight: Number(roomPrice),
          availabilityStatus: roomAvailable ? 'available' : 'occupied',
        });
        showToast(`Room ${roomNumber} added to inventory!`);
      }
      setShowAddRoomModal(false);
      loadOwnerDashboard(true);
    } catch (err) {
      showToast(err.message || 'Failed to save room details', 'error');
    }
  };

  const handleDeleteRoom = async (room) => {
    if (!confirm(`Are you sure you want to delete Room ${room.roomNumber}? This cannot be undone.`)) {
      return;
    }
    try {
      await ApiService.deleteRoom(room.id);
      showToast(`Room ${room.roomNumber} deleted from inventory`);
      loadOwnerDashboard(true);
    } catch (err) {
      showToast(err.message || 'Failed to delete room', 'error');
    }
  };

  /* ==========================================================
     RECEPTIONIST STAFF ACTIONS
     ========================================================== */
  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    if (!guesthouse) return;

    try {
      await ApiService.registerReceptionist({
        fullName: staffName,
        name: staffName,
        email: staffEmail,
        phone: staffPhone,
        password: staffPassword || 'Reception@123',
      });
      showToast(`Receptionist ${staffName} successfully registered and assigned!`);
      setShowAddStaffModal(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPhone('+251 9');
      loadOwnerDashboard(true);
    } catch (err) {
      showToast(err.message || 'Failed to register receptionist staff', 'error');
    }
  };

  const handleRemoveStaff = async (staffMember) => {
    if (!confirm(`Are you sure you want to remove ${staffMember.name || staffMember.fullName} from your front-desk staff?`)) {
      return;
    }
    try {
      await ApiService.removeReceptionistFromGuesthouse(staffMember.id);
      showToast(`Receptionist ${staffMember.name || staffMember.fullName} removed from guesthouse`);
      loadOwnerDashboard(true);
    } catch (err) {
      showToast(err.message || 'Failed to remove receptionist', 'error');
    }
  };

  /* ==========================================================
     PROPERTY PROFILE EDIT ACTIONS
     ========================================================== */
  const handleToggleAmenity = (amenity) => {
    if (propAmenities.includes(amenity)) {
      setPropAmenities(propAmenities.filter((a) => a !== amenity));
    } else {
      setPropAmenities([...propAmenities, amenity]);
    }
  };

  const handleUpdatePropertySubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await ApiService.updateMyGuesthouse({
        name: propName,
        city: propCity,
        location: propAddress,
        address: propAddress,
        description: propDesc,
        images: [propImage],
        image: propImage,
        amenities: propAmenities,
      });
      showToast('Property profile updated successfully!');
      loadOwnerDashboard(true);
    } catch (err) {
      showToast(err.message || 'Failed to update property details', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  /* ==========================================================
     REVIEW RESPONSE ACTIONS
     ========================================================== */
  const handleSubmitReviewResponse = async (reviewId) => {
    if (!reviewResponseText.trim()) return;
    setSubmittingResponse(true);
    try {
      await ApiService.respondToReview(reviewId, reviewResponseText.trim());
      showToast('Response submitted to guest review!');
      setRespondingToReviewId(null);
      setReviewResponseText('');
      loadOwnerDashboard(true);
    } catch (err) {
      showToast(err.message || 'Failed to submit review response', 'error');
    } finally {
      setSubmittingResponse(false);
    }
  };

  /* ==========================================================
     ONBOARDING: FIRST GUESTHOUSE REGISTRATION
     ========================================================== */
  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    setSubmittingOnboarding(true);
    try {
      const newGh = await ApiService.registerGuesthouse({
        name: onboardingName,
        city: onboardingCity,
        location: onboardingAddress,
        description: onboardingDesc,
        amenities: onboardingAmenities,
        images: [onboardingImage],
        ownerId: user?.id,
      });
      showToast('🎉 Guesthouse created successfully! Pending Admin verification.');
      if (user) {
        switchUser({ ...user, guesthouseId: newGh.id });
      }
      loadOwnerDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to create guesthouse', 'error');
    } finally {
      setSubmittingOnboarding(false);
    }
  };

  /* ==========================================================
     FILTERED LISTS
     ========================================================== */
  const filteredRooms = rooms.filter((r) => {
    const matchesStatus =
      roomFilterStatus === 'ALL'
        ? true
        : roomFilterStatus === 'AVAILABLE'
        ? r.availabilityStatus === 'available'
        : r.availabilityStatus === 'occupied';

    const matchesSearch =
      !roomSearchQuery ||
      r.roomNumber.toLowerCase().includes(roomSearchQuery.toLowerCase()) ||
      r.type.toLowerCase().includes(roomSearchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const filteredPayments = payments.filter((p) => {
    const matchesMethod =
      paymentFilterMethod === 'ALL'
        ? true
        : p.method.toLowerCase() === paymentFilterMethod.toLowerCase();

    const matchesSearch =
      !paymentSearchQuery ||
      p.referenceNumber.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
      p.guestName.toLowerCase().includes(paymentSearchQuery.toLowerCase());

    return matchesMethod && matchesSearch;
  });

  // Calculate Metrics
  const totalRoomsCount = rooms.length;
  const availableRoomsCount = rooms.filter((r) => r.availabilityStatus === 'available').length;
  const occupiedRoomsCount = totalRoomsCount - availableRoomsCount;
  const occupancyRate = totalRoomsCount > 0 ? Math.round((occupiedRoomsCount / totalRoomsCount) * 100) : 0;
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
      : '5.0';

  /* ==========================================================
     LOADING STATE
     ========================================================== */
  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4 px-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center animate-spin">
          <RefreshCw className="w-6 h-6 text-amber-500" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-base font-bold text-stone-900">Loading Owner Command Center</h3>
          <p className="text-xs text-stone-500">Retrieving real-time room inventory, revenue ledger, and front-desk staff...</p>
        </div>
      </div>
    );
  }

  /* ==========================================================
     ONBOARDING VIEW (When Owner Has No Guesthouse Yet)
     ========================================================== */
  if (!guesthouse) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950 p-8 text-white relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-black uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Owner Onboarding Wizard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Register Your Guesthouse</h1>
            <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-xl">
              Welcome to the Guesthouse Platform. Complete your property profile to unlock your command center, manage rooms, and receive guest reservations.
            </p>
          </div>

          {/* Setup Form */}
          <form onSubmit={handleOnboardingSubmit} className="p-6 sm:p-8 space-y-6 text-xs font-semibold">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-700 uppercase mb-1.5 font-bold">Guesthouse Name *</label>
                <input
                  type="text"
                  required
                  value={onboardingName}
                  onChange={(e) => setOnboardingName(e.target.value)}
                  placeholder="e.g. Bole Luxury Grand Villa"
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 uppercase mb-1.5 font-bold">City *</label>
                <select
                  value={onboardingCity}
                  onChange={(e) => setOnboardingCity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-amber-500 text-stone-900"
                >
                  {ETHIOPIAN_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-stone-700 uppercase mb-1.5 font-bold">Specific Street / Subcity Address *</label>
              <input
                type="text"
                required
                value={onboardingAddress}
                onChange={(e) => setOnboardingAddress(e.target.value)}
                placeholder="e.g. Bole Atlas, Near Edna Mall, Addis Ababa"
                className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 text-stone-900"
              />
            </div>

            <div>
              <label className="block text-stone-700 uppercase mb-1.5 font-bold">Property Description *</label>
              <textarea
                rows={4}
                required
                value={onboardingDesc}
                onChange={(e) => setOnboardingDesc(e.target.value)}
                placeholder="Describe your guesthouse rooms, ambiance, security, proximity to airport, and guest hospitality..."
                className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 text-stone-900"
              />
            </div>

            <div>
              <label className="block text-stone-700 uppercase mb-1.5 font-bold">Main Property Photo URL</label>
              <input
                type="url"
                value={onboardingImage}
                onChange={(e) => setOnboardingImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 text-stone-900"
              />
            </div>

            <button
              type="submit"
              disabled={submittingOnboarding}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              {submittingOnboarding ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Registering Property...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Create Guesthouse & Open Command Center</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ==========================================================
     MAIN OWNER DASHBOARD VIEW (With Dedicated Sidebar)
     ========================================================== */
  return (
    <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 py-6">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold transition-all transform animate-in slide-in-from-bottom duration-300 ${
            notification.type === 'error'
              ? 'bg-red-950 text-red-200 border-red-800'
              : 'bg-stone-950 text-white border-amber-500/40 shadow-amber-500/10'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 text-stone-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Mobile Bar */}
      <div className="lg:hidden flex items-center justify-between bg-stone-900 text-white p-4 rounded-2xl mb-4 border border-stone-800 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-black">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs line-clamp-1">{guesthouse.name}</div>
            <div className="text-[10px] text-amber-400 capitalize">{guesthouse.status || 'Approved'}</div>
          </div>
        </div>
        <button
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          className="p-2 rounded-xl bg-stone-800 text-amber-400 hover:bg-stone-700"
        >
          {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Dashboard Layout Container */}
      <div className="flex gap-6 items-start">
        {/* ==========================================================
            1. DEDICATED OWNER SIDEBAR
            ========================================================== */}
        <aside
          className={`${
            mobileDrawerOpen ? 'block fixed inset-y-0 left-0 z-50 w-72 p-4 bg-stone-950 shadow-2xl' : 'hidden'
          } lg:block lg:sticky lg:top-20 shrink-0 w-72 bg-stone-950 text-stone-200 rounded-3xl border border-stone-800/80 shadow-2xl p-5 space-y-6 transition-all`}
        >
          {/* Property Identity Card in Sidebar */}
          <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Property Console</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  guesthouse.status === 'approved' || guesthouse.status === 'APPROVED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : guesthouse.status === 'rejected' || guesthouse.status === 'REJECTED'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {guesthouse.status || 'APPROVED'}
              </span>
            </div>
            <h2 className="text-sm font-black text-white line-clamp-1">{guesthouse.name}</h2>
            <div className="text-[11px] text-stone-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="line-clamp-1">{guesthouse.address || guesthouse.city}, {guesthouse.city}</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5 text-xs font-bold">
            <button
              onClick={() => handleTabChange('overview')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-stone-300 hover:bg-stone-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>Property Overview</span>
              </div>
            </button>

            <button
              onClick={() => handleTabChange('rooms')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                activeTab === 'rooms'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-stone-300 hover:bg-stone-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <BedDouble className="w-4 h-4" />
                <span>Room Inventory</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'rooms' ? 'bg-stone-950 text-amber-400' : 'bg-stone-800 text-stone-300'
                }`}
              >
                {rooms.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('staff')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                activeTab === 'staff'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-stone-300 hover:bg-stone-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>Receptionist Staff</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'staff' ? 'bg-stone-950 text-amber-400' : 'bg-stone-800 text-stone-300'
                }`}
              >
                {staff.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('revenue')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                activeTab === 'revenue'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-stone-300 hover:bg-stone-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Receipt className="w-4 h-4" />
                <span>Revenue & Audit</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'revenue' ? 'bg-stone-950 text-amber-400' : 'bg-stone-800 text-emerald-400'
                }`}
              >
                {revenueReport?.totalRevenue ? `${(revenueReport.totalRevenue / 1000).toFixed(0)}k` : '0k'}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('edit_property')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                activeTab === 'edit_property'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-stone-300 hover:bg-stone-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4" />
                <span>Edit Property Profile</span>
              </div>
            </button>

            <button
              onClick={() => handleTabChange('reviews')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                activeTab === 'reviews'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-stone-300 hover:bg-stone-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Star className="w-4 h-4" />
                <span>Guest Feedback</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'reviews' ? 'bg-stone-950 text-amber-400' : 'bg-stone-800 text-amber-400'
                }`}
              >
                {reviews.length}
              </span>
            </button>
          </nav>

          {/* Quick Action Buttons in Sidebar */}
          <div className="pt-2 border-t border-stone-800/80 space-y-2">
            <button
              onClick={handleOpenAddRoomModal}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-700/80 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Room to Inventory</span>
            </button>

            <button
              onClick={() => setShowAddStaffModal(true)}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-700/80 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-400" />
              <span>Assign Receptionist</span>
            </button>

            <Link
              to={`/guesthouse/${guesthouse.id}`}
              target="_blank"
              className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Public Guest Listing</span>
            </Link>
          </div>

          {/* Owner Profile Chip in Sidebar */}
          <div className="pt-2 border-t border-stone-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-sm">
              {user?.name?.charAt(0) || 'O'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-black text-white truncate">{user?.name || 'Property Owner'}</div>
              <div className="text-[10px] text-stone-400 truncate">{user?.email}</div>
            </div>
          </div>
        </aside>

        {/* ==========================================================
            2. MAIN CONTENT PANE
            ========================================================== */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Top Command Bar */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-black uppercase text-amber-600 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Property Management Console</span>
              </div>
              <h1 className="text-2xl font-black text-stone-900 tracking-tight">
                {activeTab === 'overview' && 'Owner Command Center'}
                {activeTab === 'rooms' && 'Room Inventory & Rate Manager'}
                {activeTab === 'staff' && 'Front-Desk Receptionist Console'}
                {activeTab === 'revenue' && 'Verified Revenue & Payment Audit'}
                {activeTab === 'edit_property' && 'Edit Guesthouse Profile Details'}
                {activeTab === 'reviews' && 'Guest Reviews & Direct Replies'}
              </h1>
              <p className="text-xs text-stone-500">
                Operating property: <strong className="text-stone-800">{guesthouse.name}</strong> • City: <strong className="text-stone-800">{guesthouse.city}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => loadOwnerDashboard(true)}
                disabled={refreshing}
                className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                title="Refresh live data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* ==========================================================
              TAB 1: PROPERTY OVERVIEW
              ========================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Approval Notice Banner if not approved */}
              {guesthouse.status === 'pending' || guesthouse.status === 'PENDING' ? (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">Property Approval in Progress</strong>
                    Your guesthouse has been submitted and is currently being verified by platform administrators. You can configure rooms and staff right now; your listing will appear in guest searches once approved.
                  </div>
                </div>
              ) : null}

              {/* 4 Primary KPI Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-stone-400 text-xs font-semibold">
                    <span>Verified Gross Revenue</span>
                    <DollarSign className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-stone-900">
                    {revenueReport?.totalRevenue ? `${revenueReport.totalRevenue.toLocaleString()} ETB` : '0 ETB'}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Telebirr & Chapa Online</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-stone-400 text-xs font-semibold">
                    <span>Room Inventory</span>
                    <BedDouble className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-black text-stone-900">{totalRoomsCount} Rooms</div>
                  <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
                    <span className="text-emerald-700 font-bold">{availableRoomsCount} Available</span> •{' '}
                    <span className="text-amber-700 font-bold">{occupiedRoomsCount} Occupied</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-stone-400 text-xs font-semibold">
                    <span>Receptionist Team</span>
                    <Users className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-black text-stone-900">{staff.length} Active Staff</div>
                  <div className="text-[11px] text-stone-500">Operating Front-Desk Console</div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-stone-400 text-xs font-semibold">
                    <span>Occupancy Rate</span>
                    <Percent className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-stone-900">{occupancyRate}%</div>
                  {/* Occupancy Progress Bar */}
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Middle Section: Live Room Grid */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-stone-900">Live Room Status Grid</h3>
                      <p className="text-xs text-stone-500">Real-time room occupancy and quick toggle status</p>
                    </div>
                    <button
                      onClick={() => handleTabChange('rooms')}
                      className="text-xs text-amber-600 font-bold hover:underline"
                    >
                      Manage All Rooms →
                    </button>
                  </div>

                  {rooms.length === 0 ? (
                    <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 space-y-3">
                      <BedDouble className="w-8 h-8 text-stone-300 mx-auto" />
                      <p className="text-xs text-stone-500">No rooms added to inventory yet.</p>
                      <button
                        onClick={handleOpenAddRoomModal}
                        className="px-4 py-2 bg-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-sm hover:bg-amber-400"
                      >
                        + Add Your First Room
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {rooms.map((room) => (
                        <div
                          key={room.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            room.availabilityStatus === 'available'
                              ? 'bg-emerald-50/50 border-emerald-200/80 hover:border-emerald-400'
                              : 'bg-amber-50/50 border-amber-200/80 hover:border-amber-400'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-black">
                            <span className="text-stone-900">Room {room.roomNumber}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                room.availabilityStatus === 'available'
                                  ? 'bg-emerald-200 text-emerald-900'
                                  : 'bg-amber-200 text-amber-900'
                              }`}
                            >
                              {room.availabilityStatus}
                            </span>
                          </div>
                          <div className="text-[10px] text-stone-500 mt-1 capitalize">{room.type} • {room.capacity} Guests</div>
                          <div className="text-xs font-black text-stone-900 mt-2">
                            {room.pricePerNight?.toLocaleString()} ETB
                          </div>
                          <button
                            onClick={() => handleToggleRoomStatus(room)}
                            className="w-full mt-2 py-1 bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 text-[10px] font-bold rounded-lg transition-colors shadow-xs"
                          >
                            Toggle Status
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              {/* Bottom Section: Recent Reservations Table */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Recent Guest Reservations</h3>
                    <p className="text-xs text-stone-500">Live booking activity across rooms</p>
                  </div>
                  <Link to="/reservations" className="text-xs text-amber-600 font-bold hover:underline">
                    View Full Reservation Ledger →
                  </Link>
                </div>

                {reservations.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                    <Calendar className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="text-xs text-stone-500 font-medium">No reservations recorded yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-medium">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-3">Reservation ID</th>
                          <th className="px-5 py-3">Guest Name</th>
                          <th className="px-5 py-3">Room</th>
                          <th className="px-5 py-3">Check-In</th>
                          <th className="px-5 py-3">Check-Out</th>
                          <th className="px-5 py-3">Total Amount</th>
                          <th className="px-5 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-stone-800">
                        {reservations.slice(0, 5).map((rsv) => (
                          <tr key={rsv.id} className="hover:bg-stone-50/50">
                            <td className="px-5 py-3.5 font-mono font-bold text-stone-900">#{rsv.id}</td>
                            <td className="px-5 py-3.5 font-bold">{rsv.guestName || 'Guest'}</td>
                            <td className="px-5 py-3.5">Room {rsv.roomNumber || rsv.room?.roomNumber}</td>
                            <td className="px-5 py-3.5">{rsv.checkInDate || new Date(rsv.checkIn).toLocaleDateString()}</td>
                            <td className="px-5 py-3.5">{rsv.checkOutDate || new Date(rsv.checkOut).toLocaleDateString()}</td>
                            <td className="px-5 py-3.5 font-black text-stone-900">{rsv.totalPrice?.toLocaleString()} ETB</td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  rsv.status === 'confirmed' || rsv.status === 'CONFIRMED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : rsv.status === 'checked_in' || rsv.status === 'CHECKED_IN'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {rsv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB 2: MANAGE ROOM INVENTORY
              ========================================================== */}
          {activeTab === 'rooms' && (
            <div className="space-y-6">
              {/* Controls Bar */}
              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search room number or type..."
                      value={roomSearchQuery}
                      onChange={(e) => setRoomSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 w-56 bg-stone-50"
                    />
                  </div>

                  <select
                    value={roomFilterStatus}
                    onChange={(e) => setRoomFilterStatus(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white focus:ring-2 focus:ring-amber-500 font-semibold"
                  >
                    <option value="ALL">All Rooms ({rooms.length})</option>
                    <option value="AVAILABLE">Available Only ({availableRoomsCount})</option>
                    <option value="OCCUPIED">Occupied Only ({occupiedRoomsCount})</option>
                  </select>
                </div>

                <button
                  onClick={handleOpenAddRoomModal}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/10"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Room</span>
                </button>
              </div>

              {/* Rooms Catalog Table */}
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-medium">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-6 py-4">Room No.</th>
                        <th className="px-6 py-4">Room Type</th>
                        <th className="px-6 py-4">Max Capacity</th>
                        <th className="px-6 py-4">Nightly Rate</th>
                        <th className="px-6 py-4">Live Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-800">
                      {filteredRooms.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-stone-400">
                            No rooms matching your search or filters.
                          </td>
                        </tr>
                      ) : (
                        filteredRooms.map((room) => (
                          <tr key={room.id} className="hover:bg-stone-50/60 transition-colors">
                            <td className="px-6 py-4 font-black text-stone-900">Room {room.roomNumber}</td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 font-bold uppercase text-[10px]">
                                {room.type}
                              </span>
                            </td>
                            <td className="px-6 py-4">{room.capacity} Persons</td>
                            <td className="px-6 py-4 font-black text-stone-900 text-sm">
                              {room.pricePerNight?.toLocaleString()} ETB
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                  room.availabilityStatus === 'available'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {room.availabilityStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleToggleRoomStatus(room)}
                                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition-colors"
                                >
                                  Toggle Status
                                </button>
                                <button
                                  onClick={() => handleOpenEditRoomModal(room)}
                                  className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors"
                                  title="Edit room"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRoom(room)}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-colors"
                                  title="Delete room"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB 3: RECEPTIONIST STAFF MANAGEMENT
              ========================================================== */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-stone-900">Front-Desk Team ({staff.length})</h3>
                  <p className="text-xs text-stone-500">Manage receptionist accounts authorized to operate the front-desk console</p>
                </div>

                <button
                  onClick={() => setShowAddStaffModal(true)}
                  className="px-4 py-2.5 bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-colors"
                >
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>Register Receptionist</span>
                </button>
              </div>

              {/* Staff Cards List */}
              {staff.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3">
                  <Users className="w-12 h-12 text-stone-300 mx-auto" />
                  <h4 className="text-sm font-bold text-stone-800">No Receptionists Assigned</h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    Create receptionist credentials so your front-desk staff can log in, view daily arrivals, and check guests in/out.
                  </p>
                  <button
                    onClick={() => setShowAddStaffModal(true)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-xs"
                  >
                    + Register First Receptionist
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {staff.map((st) => (
                    <div key={st.id} className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 font-black text-base">
                            {(st.name || st.fullName || 'R').charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-stone-900 text-sm">{st.name || st.fullName}</div>
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">
                              Receptionist Access Active
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveStaff(st)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-colors"
                          title="Remove staff"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="pt-2 border-t border-stone-100 space-y-1.5 text-xs text-stone-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-stone-400" />
                          <span>{st.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          <span>{st.phone}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==========================================================
              TAB 4: PAYMENT & REVENUE AUDIT
              ========================================================== */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              {/* Payment Method Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                    <Smartphone className="w-4 h-4" />
                    <span>Telebirr Mobile Wallet</span>
                  </div>
                  <div className="text-2xl font-black text-stone-900">
                    {revenueReport?.paymentMethodBreakdown?.telebirr?.toLocaleString() || '0'} ETB
                  </div>
                  <div className="text-[10px] text-stone-400">Direct mobile wallet collections</div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                    <CreditCard className="w-4 h-4" />
                    <span>Chapa Online Gateway</span>
                  </div>
                  <div className="text-2xl font-black text-stone-900">
                    {revenueReport?.paymentMethodBreakdown?.chapa?.toLocaleString() || '0'} ETB
                  </div>
                  <div className="text-[10px] text-stone-400">Visa / Mastercard / Local cards</div>
                </div>

                <div className="bg-stone-950 text-white p-5 rounded-3xl shadow-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <DollarSign className="w-4 h-4" />
                    <span>Total Gross Collections</span>
                  </div>
                  <div className="text-2xl font-black text-amber-400">
                    {revenueReport?.totalRevenue?.toLocaleString() || '0'} ETB
                  </div>
                  <div className="text-[10px] text-stone-400">{payments.length} Verified Transactions</div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search payment reference or guest..."
                      value={paymentSearchQuery}
                      onChange={(e) => setPaymentSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 w-64 bg-stone-50"
                    />
                  </div>

                  <select
                    value={paymentFilterMethod}
                    onChange={(e) => setPaymentFilterMethod(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white font-semibold"
                  >
                    <option value="ALL">All Payment Gateways</option>
                    <option value="telebirr">Telebirr Only</option>
                    <option value="chapa">Chapa / Card Only</option>
                    <option value="cbe_birr">CBE Birr Only</option>
                  </select>
                </div>

                <div className="text-xs text-stone-500 font-bold">
                  Showing <strong>{filteredPayments.length}</strong> transactions
                </div>
              </div>

              {/* Transactions Ledger Table */}
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-medium">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-6 py-4">Reference No.</th>
                        <th className="px-6 py-4">Guest</th>
                        <th className="px-6 py-4">Gateway</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-800">
                      {filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-stone-400">
                            No payment transactions matching your filter.
                          </td>
                        </tr>
                      ) : (
                        filteredPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-stone-50/60 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-stone-900">{p.referenceNumber}</td>
                            <td className="px-6 py-4 font-bold">{p.guestName || 'Guest'}</td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 font-bold uppercase text-[10px]">
                                {p.method}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-black text-emerald-700 text-sm">
                              {p.amount.toLocaleString()} ETB
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                                {p.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-stone-500">
                              {p.createdAt ? new Date(p.createdAt).toLocaleString() : 'Recent'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB 5: EDIT PROPERTY PROFILE
              ========================================================== */}
          {activeTab === 'edit_property' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Edit Form */}
              <form onSubmit={handleUpdatePropertySubmit} className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-5 text-xs font-semibold">
                <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
                  Property Information & Amenities
                </h3>

                <div>
                  <label className="block text-stone-700 uppercase mb-1.5 font-bold">Guesthouse Name *</label>
                  <input
                    type="text"
                    required
                    value={propName}
                    onChange={(e) => setPropName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 text-stone-900 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-700 uppercase mb-1.5 font-bold">City *</label>
                    <select
                      value={propCity}
                      onChange={(e) => setPropCity(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-amber-500 text-stone-900 text-xs"
                    >
                      {ETHIOPIAN_CITIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-700 uppercase mb-1.5 font-bold">Address / Subcity *</label>
                    <input
                      type="text"
                      required
                      value={propAddress}
                      onChange={(e) => setPropAddress(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 text-stone-900 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-700 uppercase mb-1.5 font-bold">Property Description *</label>
                  <textarea
                    rows={4}
                    required
                    value={propDesc}
                    onChange={(e) => setPropDesc(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 text-stone-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 uppercase mb-1.5 font-bold">Cover Photo URL</label>
                  <input
                    type="url"
                    value={propImage}
                    onChange={(e) => setPropImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 text-stone-900 text-xs"
                  />
                </div>

                {/* Amenities Tag Selector */}
                <div>
                  <label className="block text-stone-700 uppercase mb-2 font-bold">Select Available Amenities</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESET_AMENITIES.map((amenity) => {
                      const isSelected = propAmenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => handleToggleAmenity(amenity)}
                          className={`px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center gap-2 border transition-all ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500 text-stone-950 font-bold'
                              : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                              isSelected ? 'bg-amber-500 text-stone-950' : 'border border-stone-300'
                            }`}
                          >
                            {isSelected && '✓'}
                          </div>
                          <span className="line-clamp-1">{amenity}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-colors shadow-md shadow-amber-500/20 flex items-center gap-2"
                  >
                    {savingProfile ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Property Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Live Preview Card */}
              <div className="space-y-4">
                <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="h-44 relative bg-stone-100 overflow-hidden">
                    <img
                      src={propImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                      alt="Property Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-stone-950/80 backdrop-blur-xs text-amber-400 text-[10px] font-black uppercase">
                      Live Preview Card
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <h4 className="text-base font-black text-stone-900">{propName || 'Guesthouse Name'}</h4>
                    <p className="text-xs text-stone-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>{propAddress || 'Address'}, {propCity}</span>
                    </p>
                    <p className="text-xs text-stone-600 line-clamp-3 pt-1">{propDesc}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================
              TAB 6: GUEST REVIEWS & FEEDBACK
              ========================================================== */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-stone-900">Guest Feedback & Rating</h3>
                  <p className="text-xs text-stone-500">Read verified guest reviews and reply directly to customer feedback</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-sm font-black text-stone-900">{averageRating}</span>
                  <span className="text-xs text-stone-400">({reviews.length} reviews)</span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3">
                  <MessageSquare className="w-12 h-12 text-stone-300 mx-auto" />
                  <h4 className="text-sm font-bold text-stone-800">No Reviews Yet</h4>
                  <p className="text-xs text-stone-500">
                    Reviews left by guests after their stay will appear here for you to read and respond.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4 text-xs font-semibold">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                            {(rev.guest?.fullName || 'G').charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-stone-900 text-sm">{rev.guest?.fullName || 'Verified Guest'}</div>
                            <div className="text-stone-400 text-[11px]">{rev.guest?.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < (rev.rating || 5) ? 'fill-amber-400' : 'text-stone-200'}`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-stone-700 bg-stone-50 p-4 rounded-2xl text-xs leading-relaxed">
                        "{rev.comment}"
                      </p>

                      {/* Owner Response Box */}
                      {rev.ownerResponse ? (
                        <div className="bg-blue-50/80 border border-blue-100 p-4 rounded-2xl space-y-1">
                          <div className="text-[10px] font-black uppercase text-blue-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Your Response as Property Owner</span>
                          </div>
                          <p className="text-blue-950 text-xs">{rev.ownerResponse}</p>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-1">
                          {respondingToReviewId === rev.id ? (
                            <div className="space-y-2">
                              <textarea
                                rows={3}
                                value={reviewResponseText}
                                onChange={(e) => setReviewResponseText(e.target.value)}
                                placeholder="Write your professional response to this guest..."
                                className="w-full p-3 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSubmitReviewResponse(rev.id)}
                                  disabled={submittingResponse}
                                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-1.5"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>{submittingResponse ? 'Submitting...' : 'Post Response'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRespondingToReviewId(null);
                                    setReviewResponseText('');
                                  }}
                                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setRespondingToReviewId(rev.id);
                                setReviewResponseText('');
                              }}
                              className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl flex items-center gap-1.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Reply to Guest</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ==========================================================
          MODAL: ADD / EDIT ROOM
          ========================================================== */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-stone-200 shadow-2xl space-y-5 text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-black text-stone-900">
                {editingRoom ? `Edit Room ${editingRoom.roomNumber}` : 'Add Room to Inventory'}
              </h3>
              <button
                onClick={() => setShowAddRoomModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoomSubmit} className="space-y-4">
              <div>
                <label className="block text-stone-700 uppercase mb-1 font-bold">Room Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 101 or 204"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 uppercase mb-1 font-bold">Room Type *</label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-amber-500 font-semibold"
                  >
                    <option value="SINGLE">Single Room</option>
                    <option value="DOUBLE">Double Room</option>
                    <option value="TWIN">Twin Room</option>
                    <option value="FAMILY">Family Room</option>
                    <option value="SUITE">Luxury Suite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 uppercase mb-1 font-bold">Max Guests *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={roomCapacity}
                    onChange={(e) => setRoomCapacity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 uppercase mb-1 font-bold">Nightly Rate (ETB) *</label>
                <input
                  type="number"
                  min={100}
                  required
                  value={roomPrice}
                  onChange={(e) => setRoomPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="roomAvailableCheck"
                  checked={roomAvailable}
                  onChange={(e) => setRoomAvailable(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="roomAvailableCheck" className="text-stone-700 font-bold">
                  Room is Available for Immediate Guest Bookings
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl shadow-sm"
                >
                  {editingRoom ? 'Save Room Changes' : 'Save Room to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL: REGISTER RECEPTIONIST STAFF
          ========================================================== */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-stone-200 shadow-2xl space-y-5 text-xs font-semibold animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-black text-stone-900">Register Front-Desk Receptionist</h3>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-stone-700 uppercase mb-1 font-bold">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tigist Alemu"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 uppercase mb-1 font-bold">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="receptionist@guesthouse.com"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 uppercase mb-1 font-bold">Ethiopian Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+251 911 234567"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-700 uppercase mb-1 font-bold">Initial Password</label>
                <input
                  type="text"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <p className="text-[10px] text-stone-400 mt-1">Default password provided to staff to access front-desk console.</p>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-stone-950 hover:bg-stone-800 text-white font-black rounded-xl shadow-sm"
                >
                  Register Receptionist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
