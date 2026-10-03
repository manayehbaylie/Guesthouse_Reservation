import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { GuestReviews } from './GuestReviews.jsx';
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
  Info,
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
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const translateStatus = (value) => t(String(value || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase()));
  
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab State
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sidebar State
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [guesthouse, setGuesthouse] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [staff, setStaff] = useState([]);
  const [payments, setPayments] = useState([]);
  const [revenueReport, setRevenueReport] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    paymentMethodBreakdown: { telebirr: 0, bank_transfer: 0, card: 0 },
    occupancyRate: 0,
  });
  const [reservations, setReservations] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Toast State
  const [notification, setNotification] = useState(null);

  // Filter States
  const [roomFilterStatus, setRoomFilterStatus] = useState('ALL');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [paymentFilterMethod, setPaymentFilterMethod] = useState('ALL');
  const [paymentFilterPeriod, setPaymentFilterPeriod] = useState('ALL');
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');

  // Modal States
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);

  // Room Form State
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('SUITE');
  const [roomCapacity, setRoomCapacity] = useState(2);
  const [roomPrice, setRoomPrice] = useState(2500);
  const [roomAvailable, setRoomAvailable] = useState(true);
  const [roomFormError, setRoomFormError] = useState('');

  // Staff Form State
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('+251 9');
  const [staffPassword, setStaffPassword] = useState('Reception@123');
  const [staffFormError, setStaffFormError] = useState('');

  // Edit Property Profile State
  const [propName, setPropName] = useState('');
  const [propCity, setPropCity] = useState('Addis Ababa');
  const [propAddress, setPropAddress] = useState('');
  const [propDesc, setPropDesc] = useState('');
  const [propImage, setPropImage] = useState('');
  const [propAmenities, setPropAmenities] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);

  // Onboarding State
  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingCity, setOnboardingCity] = useState('Addis Ababa');
  const [onboardingAddress, setOnboardingAddress] = useState('');
  const [onboardingDesc, setOnboardingDesc] = useState('');
  const [onboardingImage, setOnboardingImage] = useState('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80');
  const [onboardingAmenities, setOnboardingAmenities] = useState(['Free High-Speed Wi-Fi', 'Complimentary Breakfast', '24/7 Generator Backup']);
  const [submittingOnboarding, setSubmittingOnboarding] = useState(false);

  const showToast = (message, type = 'success') => {
    setNotification({ message: t(message), type });
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
      console.log('🔍 Loading owner dashboard for user:', user?.id);
      console.log('👤 User object:', user);
      
      // 1. Fetch Owner's Guesthouse
      const gh = await ApiService.getMyGuesthouse();
      console.log('🏠 Guesthouse data from API:', gh);
      
      // Check if we have a valid guesthouse
      if (gh && gh.id) {
        console.log('✅ Valid guesthouse found:', gh.id, gh.name);
        setGuesthouse(gh);
        
        // Set property profile data
        setPropName(gh.name || '');
        setPropCity(gh.city || 'Addis Ababa');
        setPropAddress(gh.address || gh.location || '');
        setPropDesc(gh.description || '');
        setPropImage(gh.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80');
        setPropAmenities(gh.amenities && gh.amenities.length > 0 ? gh.amenities : PRESET_AMENITIES.slice(0, 4));

        // 2. Fetch Rooms for this guesthouse
        try {
          console.log('📦 Fetching rooms for guesthouse:', gh.id);
          const rmList = await ApiService.getRoomsForGuesthouse(gh.id);
          console.log('🛏️ Rooms data:', rmList);
          setRooms(Array.isArray(rmList) ? rmList : []);
        } catch (error) {
          console.error('❌ Error fetching rooms:', error);
          setRooms([]);
        }

        // 3. Fetch Receptionist Staff
        try {
          console.log('👥 Fetching staff for guesthouse:', gh.id);
          const staffList = await ApiService.getOwnerReceptionists(gh.id);
          console.log('🧑‍💼 Staff data:', staffList);
          setStaff(Array.isArray(staffList) ? staffList : []);
        } catch (error) {
          console.error('❌ Error fetching staff:', error);
          setStaff([]);
        }

        // 4. Fetch Revenue Report
        try {
          console.log('💰 Fetching revenue report for guesthouse:', gh.id);
          const rev = await ApiService.getOwnerRevenueReport(gh.id);
          console.log('📊 Revenue data:', rev);
          if (rev) {
            setRevenueReport({
              totalRevenue: rev.totalRevenue || 0,
              totalTransactions: rev.totalTransactions || 0,
              paymentMethodBreakdown: {
                telebirr: rev.paymentMethodBreakdown?.telebirr || 0,
                bank_transfer: rev.paymentMethodBreakdown?.bank_transfer || 0,
                card: rev.paymentMethodBreakdown?.card || 0,
              },
              occupancyRate: rev.occupancyRate || 0,
            });
          }
        } catch (error) {
          console.error('❌ Error fetching revenue:', error);
          setRevenueReport({
            totalRevenue: 0,
            totalTransactions: 0,
            paymentMethodBreakdown: { telebirr: 0, bank_transfer: 0, card: 0 },
            occupancyRate: 0,
          });
        }

        // 5. Fetch Payments
        try {
          console.log('💳 Fetching payments for guesthouse:', gh.id);
          const pmts = await ApiService.getOwnerPayments(gh.id);
          console.log('💵 Payments data:', pmts);
          setPayments(Array.isArray(pmts) ? pmts : []);
        } catch (error) {
          console.error('❌ Error fetching payments:', error);
          setPayments([]);
        }

        // 6. Fetch Recent Reservations
        try {
          console.log('📅 Fetching recent reservations');
          const rsvs = await ApiService.getOwnerDashboardRecentReservations();
          console.log('📋 Reservations data:', rsvs);
          setReservations(Array.isArray(rsvs) ? rsvs : []);
        } catch (error) {
          console.error('❌ Error fetching reservations:', error);
          setReservations([]);
        }

        // 7. Fetch Reviews
        try {
          console.log('⭐ Fetching reviews');
          const revs = await ApiService.getOwnerReviews();
          console.log('📝 Reviews data:', revs);
          setReviews(Array.isArray(revs) ? revs : []);
        } catch (error) {
          console.error('❌ Error fetching reviews:', error);
          setReviews([]);
        }
      } else {
        console.warn('⚠️ No guesthouse found for this owner');
        setGuesthouse(null);
        // Reset all data
        setRooms([]);
        setStaff([]);
        setPayments([]);
        setRevenueReport({
          totalRevenue: 0,
          totalTransactions: 0,
          paymentMethodBreakdown: { telebirr: 0, bank_transfer: 0, card: 0 },
          occupancyRate: 0,
        });
        setReservations([]);
        setReviews([]);
        
        // If user is owner but has no guesthouse, show a message
        if (user?.role === 'OWNER') {
          showToast('Please register your guesthouse to get started', 'info');
        }
      }
    } catch (err) {
      console.error('❌ Error loading owner dashboard:', err);
      showToast(err.message || t('Error loading dashboard data'), 'error');
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
    if (String(guesthouse?.status || '').toUpperCase() !== 'APPROVED') {
      showToast('Your guesthouse is still pending approval. Room controls are locked until approval.', 'info');
      return;
    }

    if (room.availabilityStatus === 'reserved') {
      showToast(t('Room {{number}} is reserved and cannot be toggled until the reservation ends.', { number: room.roomNumber }), 'info');
      return;
    }

    const nextStatus = room.availabilityStatus === 'available' ? 'unavailable' : 'available';
    try {
      await ApiService.updateRoomAvailability(room.id, nextStatus);
      showToast(t('Room {{number}} status set to {{status}}', { number: room.roomNumber, status: translateStatus(nextStatus) }));
      loadOwnerDashboard(true);
    } catch (err) {
      showToast(err.message || t('Failed to toggle room status'), 'error');
    }
  };

  const handleOpenAddRoomModal = () => {
    if (String(guesthouse?.status || '').toUpperCase() !== 'APPROVED') {
      showToast('Your guesthouse is still pending approval. Room creation is locked until approval.', 'info');
      return;
    }

    setEditingRoom(null);
    setRoomNumber('');
    setRoomType('SUITE');
    setRoomCapacity(2);
    setRoomPrice(2500);
    setRoomAvailable(true);
    setRoomFormError('');
    setShowAddRoomModal(true);
  };

  const handleOpenEditRoomModal = (room) => {
    if (String(guesthouse?.status || '').toUpperCase() !== 'APPROVED') {
      showToast('Your guesthouse is still pending approval. Room editing is locked until approval.', 'info');
      return;
    }

    setEditingRoom(room);
    setRoomNumber(room.roomNumber);
    setRoomType(room.type || 'SUITE');
    setRoomCapacity(room.capacity || 2);
    setRoomPrice(room.pricePerNight || 2500);
    setRoomAvailable(room.availabilityStatus === 'available');
    setRoomFormError('');
    setShowAddRoomModal(true);
  };

  const handleSaveRoomSubmit = async (e) => {
    e.preventDefault();
    setRoomFormError('');
    if (!guesthouse) return;

    if (String(guesthouse.status || '').toUpperCase() !== 'APPROVED') {
      setRoomFormError('Your guesthouse is still pending approval. Room changes are disabled until approval is complete.');
      showToast('Your guesthouse is still pending approval. Room changes are disabled until approval is complete.', 'info');
      return;
    }

    try {
      if (editingRoom) {
        await ApiService.updateRoom(editingRoom.id, {
          roomNumber,
          roomType,
          capacity: Number(roomCapacity),
          pricePerNight: Number(roomPrice),
          available: roomAvailable,
        });
        showToast(t('Room {{number}} updated successfully!', { number: roomNumber }));
      } else {
        await ApiService.addRoom({
          guesthouseId: guesthouse.id,
          roomNumber,
          type: roomType,
          capacity: Number(roomCapacity),
          pricePerNight: Number(roomPrice),
          availabilityStatus: roomAvailable ? 'available' : 'unavailable',
        });
        showToast(t('Room {{number}} added to inventory!', { number: roomNumber }));
      }
      setShowAddRoomModal(false);
      loadOwnerDashboard(true);
    } catch (err) {
      setRoomFormError(err.message || t('Failed to save room details'));
    }
  };

  const handleDeleteRoom = async (room) => {
    if (!confirm(t('Are you sure you want to delete Room {{number}}? This cannot be undone.', { number: room.roomNumber }))) {
      return;
    }
    try {
      await ApiService.deleteRoom(room.id);
      showToast(t('Room {{number}} deleted from inventory', { number: room.roomNumber }));
      loadOwnerDashboard(true);
    } catch (err) {
      showToast(err.message || t('Failed to delete room'), 'error');
    }
  };

  /* ==========================================================
     RECEPTIONIST STAFF ACTIONS
     ========================================================== */
  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    setStaffFormError('');
    if (!guesthouse) return;

    if (String(guesthouse.status || '').toUpperCase() !== 'APPROVED') {
      setStaffFormError('Your guesthouse is still pending approval. Staff registration is locked until approval is complete.');
      showToast('Your guesthouse is still pending approval. Staff registration is locked until approval is complete.', 'info');
      return;
    }

    try {
      await ApiService.registerReceptionist({
        fullName: staffName,
        name: staffName,
        email: staffEmail,
        phone: staffPhone,
        password: staffPassword || 'Reception@123',
      });
      showToast(t('Receptionist {{name}} successfully registered and assigned!', { name: staffName }));
      setShowAddStaffModal(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPhone('+251 9');
      loadOwnerDashboard(true);
    } catch (err) {
      setStaffFormError(err.message || t('Failed to register receptionist staff'));
    }
  };

  const handleOpenStaffModal = () => {
    setStaffFormError('');
    setShowAddStaffModal(true);
  };

  const handleRemoveStaff = async (staffMember) => {
    if (String(guesthouse?.status || '').toUpperCase() !== 'APPROVED') {
      showToast('Your guesthouse is still pending approval. Staff management is locked until approval is complete.', 'info');
      return;
    }

    if (!confirm(t('Are you sure you want to remove {{name}} from your front-desk staff?', { name: staffMember.name || staffMember.fullName }))) {
      return;
    }
    try {
      await ApiService.removeReceptionistFromGuesthouse(staffMember.id);
      showToast(t('Receptionist {{name}} removed from guesthouse', { name: staffMember.name || staffMember.fullName }));
      loadOwnerDashboard(true);
    } catch (err) {
      showToast(err.message || t('Failed to remove receptionist'), 'error');
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
        image: propImage,
        amenities: propAmenities,
      });
      showToast('Property profile updated successfully!');
      loadOwnerDashboard(true);
    } catch (err) {
      showToast(err.message || t('Failed to update property details'), 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  /* ==========================================================
     ONBOARDING
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
        image: onboardingImage,
        ownerId: user?.id,
      });
      showToast(t('Guesthouse created successfully! Pending Admin verification.'));
      if (user) {
        switchUser({ ...user, guesthouseId: newGh.id });
      }
      loadOwnerDashboard();
    } catch (err) {
      showToast(err.message || t('Failed to create guesthouse'), 'error');
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
        : r.availabilityStatus === 'unavailable' || r.availabilityStatus === 'occupied';

    const matchesSearch =
      !roomSearchQuery ||
      (r.roomNumber && r.roomNumber.toLowerCase().includes(roomSearchQuery.toLowerCase())) ||
      (r.type && r.type.toLowerCase().includes(roomSearchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const getPeriodStart = (period) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    if (period === 'week') {
      const day = start.getDay();
      const daysSinceMonday = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - daysSinceMonday);
    } else if (period === 'month') {
      start.setDate(1);
    } else if (period === 'year') {
      start.setMonth(0, 1);
    }

    return start;
  };

  const formatPaymentDate = (dateString) => {
    if (!dateString) return '-';

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredPayments = payments.filter((p) => {
    const matchesMethod =
      paymentFilterMethod === 'ALL'
        ? true
        : p.method && (
          p.method.toLowerCase() === paymentFilterMethod.toLowerCase() ||
          (paymentFilterMethod === 'card' && p.method.toLowerCase() === 'chapa')
        );

    const matchesSearch =
      !paymentSearchQuery ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(paymentSearchQuery.toLowerCase())) ||
      (p.guestName && p.guestName.toLowerCase().includes(paymentSearchQuery.toLowerCase()));

    const matchesPeriod =
      paymentFilterPeriod === 'ALL' ||
      new Date(p.createdAt) >= getPeriodStart(paymentFilterPeriod);

    return matchesMethod && matchesSearch && matchesPeriod;
  });

  const paidRevenueByPeriod = ['day', 'week', 'month', 'year'].reduce((totals, period) => {
    const periodStart = getPeriodStart(period);
    totals[period] = payments.reduce((total, payment) => {
      const paymentDate = new Date(payment.createdAt);
      return paymentDate >= periodStart ? total + Number(payment.amount || 0) : total;
    }, 0);
    return totals;
  }, {});

  const handleDeletePayment = async (payment) => {
    if (!payment?.id || !window.confirm('Delete this guest payment record?')) {
      return;
    }

    try {
      await ApiService.deleteOwnerPayment(payment.id);
      showToast('Guest payment deleted successfully.');
      await loadOwnerDashboard(true);
    } catch (error) {
      showToast(error.message || 'Failed to delete guest payment.', 'error');
    }
  };

  // Calculate Metrics
  const totalRoomsCount = rooms.length;
  const availableRoomsCount = rooms.filter((r) => r.availabilityStatus === 'available').length;
  const occupiedRoomsCount = totalRoomsCount - availableRoomsCount;
  const occupancyRate = totalRoomsCount > 0 ? Math.round((occupiedRoomsCount / totalRoomsCount) * 100) : 0;
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
      : '0.0';

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
          <h3 className="text-base font-bold text-stone-900">{t('Loading Owner Command Center')}</h3>
          <p className="text-xs text-stone-500">{t('Retrieving real-time room inventory, revenue ledger, and front-desk staff...')}</p>
        </div>
      </div>
    );
  }

  /* ==========================================================
     MAIN OWNER DASHBOARD VIEW
     ========================================================== */
  const ghDisplay = guesthouse || {
    name: t('Unregistered Property'),
    status: 'NOT REGISTERED',
    city: t('Location Not Set'),
    address: t('No property address registered'),
  };
  return (
    <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 py-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold transition-all transform animate-in slide-in-from-bottom duration-300 ${
            notification.type === 'error'
              ? 'bg-red-950 text-red-200 border-red-800'
              : notification.type === 'info'
              ? 'bg-blue-950 text-blue-200 border-blue-800'
              : 'bg-stone-950 text-white border-amber-500/40 shadow-amber-500/10'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          ) : notification.type === 'info' ? (
            <Info className="w-5 h-5 text-blue-400 shrink-0" />
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
            <div className="font-bold text-xs line-clamp-1">{ghDisplay.name}</div>
            <div className="text-[10px] text-amber-400 capitalize">{translateStatus(ghDisplay.status)}</div>
          </div>
        </div>
        <button
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          className="p-2 rounded-xl bg-stone-800 text-amber-400 hover:bg-stone-700"
        >
          {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Dashboard Layout */}
      <div className="flex gap-6 items-start">
        {/* SIDEBAR */}
        <aside
          className={`${
            mobileDrawerOpen ? 'block fixed inset-y-0 left-0 z-50 w-72 p-4 bg-stone-950 shadow-2xl' : 'hidden'
          } lg:block lg:sticky lg:top-20 shrink-0 w-72 bg-stone-950 text-stone-200 rounded-3xl border border-stone-800/80 shadow-2xl p-5 space-y-6 transition-all`}
        >
          <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>{t('Property Console')}</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  String(ghDisplay.status).toUpperCase() === 'APPROVED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : String(ghDisplay.status).toUpperCase() === 'REJECTED'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {translateStatus(ghDisplay.status)}
              </span>
            </div>
            <h2 className="text-sm font-black text-white line-clamp-1">{ghDisplay.name}</h2>
            <div className="text-[11px] text-stone-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="line-clamp-1">{ghDisplay.address || ghDisplay.city}, {ghDisplay.city}</span>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-bold">
            <button
              onClick={() => handleTabChange('overview')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-stone-300 hover:bg-amber-500/20 hover:text-amber-300 hover:ring-1 hover:ring-amber-400/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>{t('Property Overview')}</span>
              </div>
            </button>

            <button
              onClick={() => handleTabChange('rooms')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                activeTab === 'rooms'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-stone-300 hover:bg-blue-500/20 hover:text-blue-300 hover:ring-1 hover:ring-blue-400/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <BedDouble className="w-4 h-4" />
                <span>{t('Room Inventory')}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-stone-800 text-amber-400">
                {rooms.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('staff')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                activeTab === 'staff'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-stone-300 hover:bg-violet-500/20 hover:text-violet-300 hover:ring-1 hover:ring-violet-400/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" />
                <span>{t('Receptionist Staff')}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-stone-800 text-amber-400">
                {staff.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('revenue')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                activeTab === 'revenue'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-stone-300 hover:bg-emerald-500/20 hover:text-emerald-300 hover:ring-1 hover:ring-emerald-400/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Receipt className="w-4 h-4" />
                <span>{t('Revenue & Audit')}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-stone-800 text-emerald-400">
                {revenueReport?.totalRevenue ? `${(revenueReport.totalRevenue / 1000).toFixed(0)}k` : '0k'}
              </span>
            </button>

            <button
              onClick={() => navigate('/owner/guesthouse')}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all text-stone-300 hover:bg-cyan-500/20 hover:text-cyan-300 hover:ring-1 hover:ring-cyan-400/40"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4" />
                <span>{t('Guesthouse Registration')}</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleTabChange('edit_property')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                activeTab === 'edit_property'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-stone-300 hover:bg-orange-500/20 hover:text-orange-300 hover:ring-1 hover:ring-orange-400/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4" />
                <span>{t('Edit Property Profile')}</span>
              </div>
            </button>

            <button
              onClick={() => handleTabChange('reviews')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                activeTab === 'reviews'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-stone-300 hover:bg-rose-500/20 hover:text-rose-300 hover:ring-1 hover:ring-rose-400/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Star className="w-4 h-4" />
                <span>{t('Guest Feedback')}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-stone-800 text-amber-400">
                {reviews.length}
              </span>
            </button>
          </nav>
          
          <div className="pt-2 border-t border-stone-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-sm">
              {user?.name?.charAt(0) || 'O'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-black text-white truncate">{user?.name || t('Property Owner')}</div>
              <div className="text-[10px] text-stone-400 truncate">{user?.email}</div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Top Command Bar */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-black uppercase text-amber-600 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('Property Management Console')}</span>
              </div>
              <h1 className="text-2xl font-black text-stone-900 tracking-tight">
                {activeTab === 'overview' && t('Owner Command Center')}
                {activeTab === 'rooms' && t('Room Inventory & Rate Manager')}
                {activeTab === 'staff' && t('Front-Desk Receptionist Console')}
                {activeTab === 'revenue' && t('Verified Revenue & Payment Audit')}
                {activeTab === 'edit_property' && t('Edit Guesthouse Profile Details')}
                {activeTab === 'reviews' && t('Guest Reviews & Feedback')}
              </h1>
              <p className="text-xs text-stone-500">
                {t('Operating property')}: <strong className="text-stone-800">{ghDisplay.name}</strong> • {t('City')}: <strong className="text-stone-800">{ghDisplay.city}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => loadOwnerDashboard(true)}
                disabled={refreshing}
                className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? t('Refreshing...') : t('Refresh')}</span>
              </button>

            </div>
          </div>

          {/* TAB 1: PROPERTY OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Not Registered Banner */}
              {!guesthouse && (
                <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950 p-6 rounded-3xl border border-amber-500/30 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider mb-2">
                      <Sparkles className="w-3 h-3" />
                      <span>{t('Action Required')}</span>
                    </div>
                    <h3 className="text-lg font-black">{t('Register Your Guesthouse')}</h3>
                    <p className="text-stone-300 text-xs mt-1 max-w-xl">
                      {t('Submit your guesthouse details to the platform administrator. Once approved, your property will be published and you will be able to add rooms and receptionists.')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/owner/guesthouse')}
                    className="shrink-0 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('Register Property')}</span>
                  </button>
                </div>
              )}

              {/* Approval Notice */}
              {guesthouse && (String(guesthouse.status || '').toUpperCase() === 'PENDING') && (
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start gap-3.5 text-amber-900 text-xs shadow-xs">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold text-sm block text-amber-950">{t('Property Verification in Progress')}</strong>
                    <p className="mt-1 leading-relaxed text-amber-900">
                      {t('Your guesthouse {{name}} is currently pending administrator verification. While in pending status, public search visibility, room inventory creation, and staff invites are locked until an administrator reviews and approves your submission.', { name: guesthouse.name })}
                    </p>
                  </div>
                </div>
              )}

              {guesthouse && (String(guesthouse.status || '').toUpperCase() === 'REJECTED') && (
                <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-red-900 text-xs shadow-xs">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold text-sm block text-red-950">{t('Guesthouse Registration Needs Correction')}</strong>
                      <p className="mt-1 text-red-800">
                        {guesthouse.rejectionReason || t('The administrator requested modifications to your property details.')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/owner/guesthouse')}
                    className="shrink-0 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    {t('Review and Resubmit')}
                  </button>
                </div>
              )}

              {/* 4 KPI Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button type="button" onClick={() => handleTabChange('revenue')} className="group w-full text-left bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-2 transition-all hover:-translate-y-0.5 hover:border-[#0b3b5b] hover:bg-[#0b3b5b] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500/40">
                  <div className="flex items-center justify-between text-stone-400 group-hover:text-amber-300 text-xs font-semibold">
                    <span>{t('Verified Gross Revenue')}</span>
                    <DollarSign className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-stone-900 group-hover:text-white">
                    {revenueReport?.totalRevenue ? `${revenueReport.totalRevenue.toLocaleString()} ETB` : '0 ETB'}
                  </div>
                  <div className="text-[11px] text-emerald-600 group-hover:text-amber-300 font-bold flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>{t('Total Revenue')}</span>
                  </div>
                </button>

                <button type="button" onClick={() => handleTabChange('rooms')} className="group w-full text-left bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-2 transition-all hover:-translate-y-0.5 hover:border-[#0b3b5b] hover:bg-[#0b3b5b] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500/40">
                  <div className="flex items-center justify-between text-stone-400 group-hover:text-amber-300 text-xs font-semibold">
                    <span>{t('Room Inventory')}</span>
                    <BedDouble className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-black text-stone-900 group-hover:text-white">{t('{{count}} Rooms', { count: totalRoomsCount })}</div>
                  <div className="text-[11px] text-stone-500 group-hover:text-stone-200 flex items-center gap-1.5">
                    <span className="text-emerald-700 group-hover:text-emerald-300 font-bold">{t('{{count}} Available', { count: availableRoomsCount })}</span> •{' '}
                    <span className="text-amber-700 group-hover:text-amber-300 font-bold">{t('{{count}} Occupied', { count: occupiedRoomsCount })}</span>
                  </div>
                </button>

                <button type="button" onClick={() => handleTabChange('staff')} className="group w-full text-left bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-2 transition-all hover:-translate-y-0.5 hover:border-[#0b3b5b] hover:bg-[#0b3b5b] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500/40">
                  <div className="flex items-center justify-between text-stone-400 group-hover:text-amber-300 text-xs font-semibold">
                    <span>{t('Receptionist Team')}</span>
                    <Users className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-black text-stone-900 group-hover:text-white">{t('{{count}} Active Staff', { count: staff.length })}</div>
                  <div className="text-[11px] text-stone-500 group-hover:text-stone-200">{t('Operating Front-Desk Console')}</div>
                </button>

                <button type="button" onClick={() => handleTabChange('overview')} className="group w-full text-left bg-white p-5 rounded-3xl border border-stone-200 shadow-sm space-y-2 transition-all hover:-translate-y-0.5 hover:border-[#0b3b5b] hover:bg-[#0b3b5b] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500/40">
                  <div className="flex items-center justify-between text-stone-400 group-hover:text-amber-300 text-xs font-semibold">
                    <span>{t('Occupancy Rate')}</span>
                    <Percent className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-stone-900 group-hover:text-white">{occupancyRate}%</div>
                  <div className="w-full h-1.5 bg-stone-100 group-hover:bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>
                </button>
              </div>

              {/* Live Room Grid */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">{t('Live Room Status Grid')}</h3>
                    <p className="text-xs text-stone-500">{t('Real-time room occupancy and quick toggle status')}</p>
                  </div>
                  <button
                    onClick={() => handleTabChange('rooms')}
                    className="text-xs text-amber-600 font-bold hover:underline"
                  >
                    {t('Manage All Rooms')} →
                  </button>
                </div>

                {rooms.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 space-y-3">
                    <BedDouble className="w-8 h-8 text-stone-300 mx-auto" />
                    <p className="text-xs text-stone-500">{t('No rooms added to inventory yet.')}</p>
                    <button
                      onClick={handleOpenAddRoomModal}
                      className="px-4 py-2 bg-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-sm hover:bg-amber-400"
                    >
                      {t('+ Add Your First Room')}
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
                          <span className="text-stone-900">{t('Room {{number}}', { number: room.roomNumber })}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              room.availabilityStatus === 'available'
                                ? 'bg-emerald-200 text-emerald-900'
                                : 'bg-amber-200 text-amber-900'
                            }`}
                          >
                            {translateStatus(room.availabilityStatus)}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-500 mt-1 capitalize">{translateStatus(room.type)} • {t('{{count}} Guests', { count: room.capacity })}</div>
                        <div className="text-xs font-black text-stone-900 mt-2">
                          {room.pricePerNight?.toLocaleString()} ETB
                        </div>
                        <button
                          onClick={() => handleToggleRoomStatus(room)}
                          disabled={room.availabilityStatus === 'reserved'}
                          title={room.availabilityStatus === 'reserved' ? t('Reserved rooms cannot be toggled until the reservation ends') : t('Toggle room availability')}
                          className="w-full mt-2 py-1 bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 text-[10px] font-bold rounded-lg transition-colors shadow-xs disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                        >
                          {room.availabilityStatus === 'reserved' ? t('Reserved') : t('Toggle Status')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ROOMS */}
          {activeTab === 'rooms' && (
            <div className="space-y-6">
              {(!guesthouse || String(guesthouse.status || '').toUpperCase() !== 'APPROVED') && (
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-900 text-xs shadow-xs">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold text-sm block text-amber-950">{t('Room Management Locked')}</strong>
                      <p className="mt-0.5 text-amber-900">
                        {guesthouse
                          ? t('Your guesthouse ({{name}}) is currently {{status}}. Room additions and status changes will unlock automatically once an administrator approves your property.', { name: guesthouse.name, status: translateStatus(guesthouse.status || 'pending approval') })
                          : t('You must register a guesthouse and have it approved by an administrator before managing rooms.')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/owner/guesthouse')}
                    className="shrink-0 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>{guesthouse ? t('View Registration Status') : t('Register Guesthouse')}</span>
                  </button>
                </div>
              )}

              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={t('Search room...')}
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
                    <option value="ALL">{t('All Rooms ({{count}})', { count: rooms.length })}</option>
                    <option value="AVAILABLE">{t('Available ({{count}})', { count: availableRoomsCount })}</option>
                    <option value="OCCUPIED">{t('Occupied ({{count}})', { count: occupiedRoomsCount })}</option>
                  </select>
                </div>
                <button
                  onClick={handleOpenAddRoomModal}
                  className={`px-4 py-2.5 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all ${
                    guesthouse && String(guesthouse.status || '').toUpperCase() === 'APPROVED'
                      ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-sm'
                      : 'bg-stone-200 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                    <span>{t('Add New Room')}</span>
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-medium">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-6 py-4">{t('Room No.')}</th>
                        <th className="px-6 py-4">{t('Type')}</th>
                        <th className="px-6 py-4">{t('Capacity')}</th>
                        <th className="px-6 py-4">{t('Rate')}</th>
                        <th className="px-6 py-4">{t('Status')}</th>
                        <th className="px-6 py-4 text-right">{t('Actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-800">
                      {filteredRooms.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-stone-400">
                            {t('No rooms found.')}
                          </td>
                        </tr>
                      ) : (
                        filteredRooms.map((room) => (
                          <tr key={room.id} className="hover:bg-stone-50/60">
                            <td className="px-6 py-4 font-black text-stone-900">{t('Room {{number}}', { number: room.roomNumber })}</td>
                            <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 font-bold uppercase text-[10px]">{translateStatus(room.type)}</span></td>
                            <td className="px-6 py-4">{t('{{count}} Persons', { count: room.capacity })}</td>
                            <td className="px-6 py-4 font-black text-stone-900">{room.pricePerNight?.toLocaleString()} ETB</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${room.availabilityStatus === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                {translateStatus(room.availabilityStatus)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleToggleRoomStatus(room)} className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs">{t('Toggle')}</button>
                                <button onClick={() => handleOpenEditRoomModal(room)} className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteRoom(room)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl"><Trash2 className="w-4 h-4" /></button>
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

          {/* TAB 3: STAFF */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              {(!guesthouse || String(guesthouse.status || '').toUpperCase() !== 'APPROVED') && (
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-900 text-xs shadow-xs">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold text-sm block text-amber-950">{t('Receptionist Management Locked')}</strong>
                      <p className="mt-0.5 text-amber-900">
                        {guesthouse
                          ? t('Your guesthouse ({{name}}) is currently {{status}}. Front-desk receptionist registration will unlock automatically once an administrator approves your property.', { name: guesthouse.name, status: translateStatus(guesthouse.status || 'pending approval') })
                          : t('You must register a guesthouse and have it approved by an administrator before creating receptionist accounts.')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/owner/guesthouse')}
                    className="shrink-0 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>{guesthouse ? t('View Registration Status') : t('Register Guesthouse')}</span>
                  </button>
                </div>
              )}

              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-stone-900">{t('Front-Desk Team ({{count}})', { count: staff.length })}</h3>
                  <p className="text-xs text-stone-500">{t('Manage receptionist accounts')}</p>
                </div>
                <button
                  onClick={handleOpenStaffModal}
                  className={`px-4 py-2.5 font-bold text-xs rounded-xl flex items-center gap-2 transition-all ${
                    guesthouse && String(guesthouse.status || '').toUpperCase() === 'APPROVED'
                      ? 'bg-stone-950 hover:bg-stone-800 text-white'
                      : 'bg-stone-200 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>{t('Register Receptionist')}</span>
                </button>
              </div>

              {staff.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center">
                  <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-stone-800">{t('No Receptionists Assigned')}</h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">{t('Create receptionist credentials for your front-desk staff.')}</p>
                  <button onClick={handleOpenStaffModal} className="mt-4 px-4 py-2 bg-amber-500 text-stone-950 font-bold text-xs rounded-xl">{t('+ Register First Receptionist')}</button>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-xs">
                      <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-3 font-bold">{t('Name')}</th>
                          <th className="px-5 py-3 font-bold">{t('Role')}</th>
                          <th className="px-5 py-3 font-bold">{t('Email')}</th>
                          <th className="px-5 py-3 font-bold">{t('Phone')}</th>
                          <th className="px-5 py-3 text-right font-bold">{t('Action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {staff.map((st) => (
                          <tr key={st.id} className="hover:bg-stone-50/70">
                            <td className="px-5 py-4 font-bold text-stone-900">{st.name || st.fullName || t('Receptionist')}</td>
                            <td className="px-5 py-4">
                              <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-bold uppercase">{t('Receptionist')}</span>
                            </td>
                            <td className="px-5 py-4 text-stone-600">{st.email || '-'}</td>
                            <td className="px-5 py-4 text-stone-600">{st.phone || '-'}</td>
                            <td className="px-5 py-4 text-right">
                              <button onClick={() => handleRemoveStaff(st)} aria-label={t('Remove {{name}}', { name: st.name || st.fullName || t('Receptionist') })} className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REVENUE */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div className="grid w-full max-w-4xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {[
                  { key: 'day', label: 'Paid Today', icon: Calendar, colorClass: 'text-blue-600', hoverClass: 'hover:border-blue-300 hover:bg-blue-50/60' },
                  { key: 'week', label: 'Paid This Week', icon: Calendar, colorClass: 'text-emerald-600', hoverClass: 'hover:border-emerald-300 hover:bg-emerald-50/60' },
                  { key: 'month', label: 'Paid This Month', icon: Calendar, colorClass: 'text-violet-600', hoverClass: 'hover:border-violet-300 hover:bg-violet-50/60' },
                  { key: 'year', label: 'Paid This Year', icon: Calendar, colorClass: 'text-amber-600', hoverClass: 'hover:border-amber-300 hover:bg-amber-50/60' },
                ].map(({ key, label, icon: PeriodIcon, colorClass, hoverClass }) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={paymentFilterPeriod === key}
                    onClick={() => setPaymentFilterPeriod((current) => current === key ? 'ALL' : key)}
                    className={`group min-w-0 rounded-xl border p-3 text-left shadow-sm space-y-1 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-950/30 ${paymentFilterPeriod === key ? 'border-stone-950 bg-stone-950 text-white' : `border-stone-200 bg-white ${hoverClass}`}`}
                  >
                    <div className={`flex min-w-0 items-center gap-1.5 font-bold text-[10px] ${paymentFilterPeriod === key ? 'text-amber-400' : colorClass}`}>
                      <PeriodIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{t(label)}</span>
                    </div>
                    <div className={`truncate text-lg font-black ${paymentFilterPeriod === key ? 'text-white' : 'text-stone-900'}`}>
                      {paidRevenueByPeriod[key].toLocaleString()} ETB
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-stone-100 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-black text-stone-900">{t('Payment Activity')}</h3>
                    <p className="text-xs text-stone-500 mt-1">{t('Verified transactions from your guesthouse reservations.')}</p>
                  </div>
                  <span className="text-xs font-bold text-stone-500">{t('{{count}} records', { count: filteredPayments.length })}</span>
                </div>

                {payments.length === 0 ? (
                  <div className="p-10 text-center">
                    <Receipt className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-stone-700">{t('No payment activity yet')}</p>
                    <p className="text-xs text-stone-500 mt-1">{t('Completed guest payments will appear here.')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-3 font-bold">{t('Guest')}</th>
                          <th className="px-5 py-3 font-bold">{t('Room')}</th>
                          <th className="px-5 py-3 font-bold">{t('Method')}</th>
                          <th className="px-5 py-3 font-bold">{t('Status')}</th>
                          <th className="px-5 py-3 font-bold">{t('Paid Date')}</th>
                          <th className="px-5 py-3 font-bold text-right">{t('Amount')}</th>
                          <th className="px-5 py-3 font-bold text-right">{t('Action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filteredPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-stone-50/70">
                            <td className="px-5 py-4 font-bold text-stone-900">{payment.guestName || t('Guest')}</td>
                            <td className="px-5 py-4 text-stone-600">{payment.roomNumber ? t('Room {{number}}', { number: payment.roomNumber }) : '-'}</td>
                            <td className="px-5 py-4 uppercase text-stone-600">{translateStatus(payment.method || '-')}</td>
                            <td className="px-5 py-4">
                              <span className={`px-2 py-1 rounded-full font-bold uppercase ${payment.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                {translateStatus(payment.status || 'pending')}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-stone-600">{formatPaymentDate(payment.createdAt)}</td>
                            <td className="px-5 py-4 text-right font-black text-stone-900">{Number(payment.amount || 0).toLocaleString()} ETB</td>
                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeletePayment(payment)}
                                aria-label={t('Delete payment for {{name}}', { name: payment.guestName || t('Guest') })}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-[10px] font-bold text-red-600 transition hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                {t('Delete')}
                              </button>
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

          {/* TAB 5: GUEST REVIEWS */}
          {activeTab === 'reviews' && <GuestReviews embedded />}

          {/* TAB 6: EDIT PROPERTY */}
          {activeTab === 'edit_property' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <form onSubmit={handleUpdatePropertySubmit} className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-5 text-xs font-semibold">
                <h3 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">{t('Property Information')}</h3>
                <div>
                  <label className="block text-stone-700 uppercase mb-1.5 font-bold">{t('Guesthouse Name *')}</label>
                  <input type="text" required value={propName} onChange={(e) => setPropName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 text-stone-900 text-xs" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-stone-700 uppercase mb-1.5 font-bold">{t('City *')}</label>
                  <input
  type="text"
  list="city-suggestions"
  required
  value={propCity}
  onChange={(e) => setPropCity(e.target.value)}
  placeholder={t('Enter city')}
  className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-amber-500 text-stone-900 text-xs"
/>
<datalist id="city-suggestions">
  {ETHIOPIAN_CITIES.map((c) => (<option key={c} value={c} />))}
</datalist>
                  </div>
                  <div>
                    <label className="block text-stone-700 uppercase mb-1.5 font-bold">{t('Address *')}</label>
                    <input type="text" required value={propAddress} onChange={(e) => setPropAddress(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 text-stone-900 text-xs" />
                  </div>
                </div>
                <div>
                  <label className="block text-stone-700 uppercase mb-1.5 font-bold">{t('Description *')}</label>
                  <textarea rows={4} required value={propDesc} onChange={(e) => setPropDesc(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 text-stone-900 text-xs" />
                </div>
                <div>
                  <label className="block text-stone-700 uppercase mb-2 font-bold">{t('Amenities')}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESET_AMENITIES.map((amenity) => {
                      const isSelected = propAmenities.includes(amenity);
                      return (
                        <button key={amenity} type="button" onClick={() => handleToggleAmenity(amenity)} className={`px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center gap-2 border transition-all ${isSelected ? 'bg-amber-500/10 border-amber-500 text-stone-950 font-bold' : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'}`}>
                          <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${isSelected ? 'bg-amber-500 text-stone-950' : 'border border-stone-300'}`}>{isSelected && '✓'}</div>
                          <span className="line-clamp-1">{t(amenity)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button type="submit" disabled={savingProfile} className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2">
                  {savingProfile ? (<><RefreshCw className="w-4 h-4 animate-spin" /><span>{t('Saving...')}</span></>) : (<><Check className="w-4 h-4" /><span>{t('Save Property')}</span></>)}
                </button>
              </form>
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="h-44 relative bg-stone-100 overflow-hidden">
                  <img src={propImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'} alt={t('Preview')} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-stone-950/80 text-amber-400 text-[10px] font-black uppercase">{t('Preview')}</div>
                </div>
                <div className="p-5">
                  <h4 className="text-base font-black text-stone-900">{propName || t('Guesthouse')}</h4>
                  <p className="text-xs text-stone-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber-600" /><span>{propAddress || t('Address')}, {propCity}</span></p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ADD ROOM MODAL */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-stone-200 shadow-2xl space-y-5 text-xs font-semibold">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-black text-stone-900">{editingRoom ? t('Edit Room {{number}}', { number: editingRoom.roomNumber }) : t('Add Room')}</h3>
              <button onClick={() => setShowAddRoomModal(false)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveRoomSubmit} className="space-y-4">
              <div>
                <label className="block text-stone-700 uppercase mb-1 font-bold">{t('Room Number *')}</label>
                <input type="text" required placeholder="e.g. 101" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 uppercase mb-1 font-bold">{t('Room Type *')}</label>
                  <select value={roomType} onChange={(e) => setRoomType(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-amber-500 font-semibold">
                    <option value="SINGLE">{t('Single')}</option>
                    <option value="DOUBLE">{t('Double')}</option>
                    <option value="TWIN">{t('Twin')}</option>
                    <option value="FAMILY">{t('Family')}</option>
                    <option value="SUITE">{t('Suite')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-700 uppercase mb-1 font-bold">{t('Max Guests *')}</label>
                  <input type="number" min={1} max={10} required value={roomCapacity} onChange={(e) => setRoomCapacity(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div>
                <label className="block text-stone-700 uppercase mb-1 font-bold">{t('Nightly Rate (ETB) *')}</label>
                <input type="number" min={100} required value={roomPrice} onChange={(e) => setRoomPrice(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="flex items-center gap-2.5">
                <input type="checkbox" id="roomAvailableCheck" checked={roomAvailable} onChange={(e) => setRoomAvailable(e.target.checked)} className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500" />
                <label htmlFor="roomAvailableCheck" className="text-stone-700 font-bold">{t('Available for Booking')}</label>
              </div>
              {roomFormError && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-semibold text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{roomFormError}</span>
                </div>
              )}
              <div className="flex gap-2 justify-end pt-3 border-t border-stone-100">
                <button type="button" onClick={() => setShowAddRoomModal(false)} className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl">{t('Cancel')}</button>
                <button type="submit" className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl">{editingRoom ? t('Update Room') : t('Add Room')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-stone-200 shadow-2xl space-y-5 text-xs font-semibold">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-black text-stone-900">{t('Register Receptionist')}</h3>
              <button onClick={() => setShowAddStaffModal(false)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-stone-700 uppercase mb-1 font-bold">{t('Full Name *')}</label>
                <input type="text" required placeholder="e.g. Tigist Alemu" value={staffName} onChange={(e) => setStaffName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-stone-700 uppercase mb-1 font-bold">{t('Email *')}</label>
                <input type="email" required placeholder="receptionist@guesthouse.com" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-stone-700 uppercase mb-1 font-bold">{t('Phone *')}</label>
                <input type="text" required placeholder="+251 911 234567" value={staffPhone} onChange={(e) => setStaffPhone(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-stone-700 uppercase mb-1 font-bold">{t('Password')}</label>
                <input type="text" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-500 font-mono" />
              </div>
              {staffFormError && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-semibold text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{staffFormError}</span>
                </div>
              )}
              <div className="flex gap-2 justify-end pt-3 border-t border-stone-100">
                <button type="button" onClick={() => setShowAddStaffModal(false)} className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl">{t('Cancel')}</button>
                <button type="submit" className="px-5 py-2.5 bg-stone-950 hover:bg-stone-800 text-white font-black rounded-xl">{t('Register')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default OwnerDashboard;