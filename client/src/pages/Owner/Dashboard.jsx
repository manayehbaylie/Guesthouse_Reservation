import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Building2,
  BedDouble,
  Users,
  DollarSign,
  Plus,
  BarChart3,
  CheckCircle2,
  ArrowUpRight,
  ShieldAlert,
  Smartphone,
  CreditCard,
  UserPlus,
  Edit,
  MapPin,
  Calendar,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export function OwnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const guesthouseId = user?.guesthouseId || 'gh-1';

  const [guesthouse, setGuesthouse] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [staff, setStaff] = useState([]);
  const [payments, setPayments] = useState([]);
  const [revenueReport, setRevenueReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'rooms', 'staff', 'revenue', 'edit_property'

  // Form State: Add Room
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('Deluxe Suite');
  const [roomCapacity, setRoomCapacity] = useState(2);
  const [roomPrice, setRoomPrice] = useState(2500);

  // Form State: Register Staff
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('+251 9');

  // Form State: Edit Property
  const [propName, setPropName] = useState('');
  const [propCity, setPropCity] = useState('Addis Ababa');
  const [propLocation, setPropLocation] = useState('');
  const [propDesc, setPropDesc] = useState('');
  const [propAmenities, setPropAmenities] = useState('');

  const loadOwnerData = async () => {
    setLoading(true);
    try {
      const gh = await ApiService.getGuesthouseById(guesthouseId);
      setGuesthouse(gh);
      if (gh) {
        setPropName(gh.name || '');
        setPropCity(gh.city || 'Addis Ababa');
        setPropLocation(gh.location || '');
        setPropDesc(gh.description || '');
        setPropAmenities(gh.amenities?.join(', ') || '');

        const rmList = await ApiService.getRoomsForGuesthouse(gh.id);
        setRooms(rmList);

        const rev = await ApiService.getOwnerRevenueReport(gh.id);
        setRevenueReport(rev);

        const pmts = await ApiService.getOwnerPayments(gh.id);
        setPayments(pmts);

        const allU = ApiService.getAllUsers();
        setStaff(allU.filter((u) => u.role === 'Receptionist' && (u.guesthouseId === gh.id || !u.guesthouseId)));
      }
    } catch (err) {
      console.error('Failed to load owner dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, [guesthouseId]);

  const handleToggleRoomStatus = async (roomId, currentStatus) => {
    const nextStatus = currentStatus === 'available' ? 'unavailable' : 'available';
    try {
      await ApiService.updateRoomAvailability(roomId, nextStatus);
      loadOwnerData();
    } catch (err) {
      alert(err.message || 'Error updating room availability');
    }
  };

  const handleAddRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      await ApiService.addRoom({
        guesthouseId,
        roomNumber,
        type: roomType,
        capacity: Number(roomCapacity),
        pricePerNight: Number(roomPrice),
        availabilityStatus: 'available',
      });
      setShowAddRoomModal(false);
      setRoomNumber('');
      loadOwnerData();
    } catch (err) {
      alert(err.message || 'Failed to add room.');
    }
  };

  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    try {
      await ApiService.registerUser({
        name: staffName,
        email: staffEmail,
        phone: staffPhone,
        role: 'Receptionist',
        guesthouseId,
      });
      setShowAddStaffModal(false);
      setStaffName('');
      setStaffEmail('');
      loadOwnerData();
    } catch (err) {
      alert(err.message || 'Failed to register receptionist staff.');
    }
  };

  const handleUpdatePropertySubmit = async (e) => {
    e.preventDefault();
    try {
      const amList = propAmenities.split(',').map((s) => s.trim()).filter(Boolean);
      await ApiService.registerGuesthouse({
        name: propName,
        city: propCity,
        location: propLocation,
        description: propDesc,
        amenities: amList,
        images: guesthouse?.images || ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'],
        ownerId: user.id,
      });
      alert('Property details updated successfully.');
      loadOwnerData();
    } catch (err) {
      alert(err.message || 'Error saving property update.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase text-amber-700 tracking-wider">Property Owner Management Console</div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            {guesthouse ? guesthouse.name : 'Owner Command Center'}
          </h1>
          <p className="text-xs text-stone-500">
            Location: <strong>{guesthouse?.location}, {guesthouse?.city}</strong> • Status: <span className="text-emerald-700 font-bold uppercase">{guesthouse?.status || 'approved'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddRoomModal(true)}
            className="px-3.5 py-2 bg-amber-500 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-amber-400 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Room</span>
          </button>
          <button
            onClick={() => setShowAddStaffModal(true)}
            className="px-3.5 py-2 bg-stone-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-stone-800 transition-colors"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>Assign Receptionist</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <div className="text-xs text-stone-400 font-medium">Total Verified Revenue</div>
          <div className="text-2xl font-black text-stone-900">
            {revenueReport ? `${revenueReport.totalRevenue.toLocaleString()} ETB` : '12,600 ETB'}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Telebirr & Chapa Online Payments</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <div className="text-xs text-stone-400 font-medium">Room Inventory</div>
          <div className="text-2xl font-black text-stone-900">{rooms.length} Rooms</div>
          <div className="text-[11px] text-stone-500">
            {rooms.filter((r) => r.availabilityStatus === 'available').length} Available • {rooms.filter((r) => r.availabilityStatus === 'occupied').length} Occupied
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <div className="text-xs text-stone-400 font-medium">Active Receptionist Staff</div>
          <div className="text-2xl font-black text-stone-900">{staff.length} Assigned</div>
          <div className="text-[11px] text-stone-500">Operating Front-Desk Console</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
          <div className="text-xs text-stone-400 font-medium">Property Status</div>
          <div className="text-2xl font-black text-emerald-700 capitalize">
            {guesthouse ? guesthouse.status : 'Approved'}
          </div>
          <div className="text-[11px] text-stone-500">Live in Guest Search Catalog</div>
        </div>
      </div>

      {/* Interactive Operational Tabs */}
      <div className="flex border-b border-stone-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors ${
            activeTab === 'overview' ? 'border-b-2 border-amber-500 text-stone-900' : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          Property Overview
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`pb-3 transition-colors ${
            activeTab === 'rooms' ? 'border-b-2 border-amber-500 text-stone-900' : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          Manage Room Inventory ({rooms.length})
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 transition-colors ${
            activeTab === 'staff' ? 'border-b-2 border-amber-500 text-stone-900' : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          Receptionist Staff ({staff.length})
        </button>
        <button
          onClick={() => setActiveTab('revenue')}
          className={`pb-3 transition-colors ${
            activeTab === 'revenue' ? 'border-b-2 border-amber-500 text-stone-900' : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          Payment & Revenue Audit
        </button>
        <button
          onClick={() => setActiveTab('edit_property')}
          className={`pb-3 transition-colors ${
            activeTab === 'edit_property' ? 'border-b-2 border-amber-500 text-stone-900' : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          Edit Property Profile
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-stone-900">Property Details</h3>
            <p className="text-xs text-stone-600 leading-relaxed">{guesthouse?.description}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {guesthouse?.amenities?.map((am) => (
                <span key={am} className="px-3 py-1 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold">
                  ✓ {am}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-stone-900 text-stone-100 p-6 rounded-3xl space-y-4 shadow-lg">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              <span>Owner Quick Actions</span>
            </h3>
            <div className="space-y-2 text-xs font-semibold">
              <button
                onClick={() => setShowAddRoomModal(true)}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold transition-colors"
              >
                + Add Room to Inventory
              </button>
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-white rounded-xl font-bold transition-colors"
              >
                + Register Front-Desk Receptionist
              </button>
              <button
                onClick={() => setActiveTab('edit_property')}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-bold transition-colors"
              >
                ✎ Edit Property Information
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Manage Room Inventory */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-stone-900">Guesthouse Rooms & Nightly Rates</h3>
            <button
              onClick={() => setShowAddRoomModal(true)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Room</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Room Number</th>
                  <th className="px-6 py-3.5">Room Type</th>
                  <th className="px-6 py-3.5">Max Guests</th>
                  <th className="px-6 py-3.5">Nightly Rate</th>
                  <th className="px-6 py-3.5">Availability</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-stone-50">
                    <td className="px-6 py-4 font-bold text-stone-900">Room {room.roomNumber}</td>
                    <td className="px-6 py-4">{room.type}</td>
                    <td className="px-6 py-4">{room.capacity} Persons</td>
                    <td className="px-6 py-4 font-black text-stone-900">{room.pricePerNight.toLocaleString()} ETB</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          room.availabilityStatus === 'available'
                            ? 'bg-emerald-100 text-emerald-800'
                            : room.availabilityStatus === 'occupied'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {room.availabilityStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleRoomStatus(room.id, room.availabilityStatus)}
                        className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs"
                      >
                        Toggle Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Receptionist Staff */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-stone-900">Front-Desk Receptionists</h3>
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Receptionist</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 divide-y divide-stone-100 text-xs">
            {staff.map((st) => (
              <div key={st.id} className="p-5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-stone-900 text-sm">{st.name}</div>
                  <div className="text-stone-500">{st.email} • {st.phone}</div>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
                  Receptionist Console Access Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Revenue Audit */}
      {activeTab === 'revenue' && (
        <div className="space-y-4">
          {revenueReport && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                  <Smartphone className="w-4 h-4" />
                  <span>Telebirr Mobile Wallet Earnings</span>
                </div>
                <div className="text-2xl font-black text-stone-900">
                  {revenueReport.paymentMethodBreakdown.telebirr.toLocaleString()} ETB
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                  <CreditCard className="w-4 h-4" />
                  <span>Chapa / Visa / Mastercard Earnings</span>
                </div>
                <div className="text-2xl font-black text-stone-900">
                  {revenueReport.paymentMethodBreakdown.chapa.toLocaleString()} ETB
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Payment Reference</th>
                  <th className="px-6 py-3.5">Guest</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 font-mono font-bold text-stone-900">{p.referenceNumber}</td>
                    <td className="px-6 py-4 font-bold">{p.guestName}</td>
                    <td className="px-6 py-4 uppercase font-bold text-stone-700">{p.method}</td>
                    <td className="px-6 py-4 font-black text-emerald-700">{p.amount.toLocaleString()} ETB</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Edit Property Profile */}
      {activeTab === 'edit_property' && (
        <form onSubmit={handleUpdatePropertySubmit} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4 text-xs font-semibold max-w-2xl">
          <h3 className="text-base font-bold text-stone-900">Edit Property Details</h3>
          <div>
            <label className="block text-stone-600 uppercase mb-1">Guesthouse Name</label>
            <input
              type="text"
              required
              value={propName}
              onChange={(e) => setPropName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 uppercase mb-1">City</label>
              <select
                value={propCity}
                onChange={(e) => setPropCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white"
              >
                <option value="Addis Ababa">Addis Ababa</option>
                <option value="Hawassa">Hawassa</option>
                <option value="Bishoftu">Bishoftu</option>
                <option value="Bahir Dar">Bahir Dar</option>
                <option value="Lalibela">Lalibela</option>
              </select>
            </div>
            <div>
              <label className="block text-stone-600 uppercase mb-1">Subcity / Area</label>
              <input
                type="text"
                required
                value={propLocation}
                onChange={(e) => setPropLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-stone-600 uppercase mb-1">Description</label>
            <textarea
              rows={3}
              value={propDesc}
              onChange={(e) => setPropDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300"
            />
          </div>
          <div>
            <label className="block text-stone-600 uppercase mb-1">Amenities (Comma-separated)</label>
            <input
              type="text"
              value={propAmenities}
              onChange={(e) => setPropAmenities(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl shadow-xs">
            Save Property Changes
          </button>
        </form>
      )}

      {/* Add Room Modal */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-4 text-xs font-semibold">
            <h3 className="text-base font-bold text-stone-900">Add Room to Guesthouse Inventory</h3>
            <form onSubmit={handleAddRoomSubmit} className="space-y-3">
              <div>
                <label className="block text-stone-600 uppercase mb-1">Room Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 104"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block text-stone-600 uppercase mb-1">Room Type</label>
                <input
                  type="text"
                  required
                  placeholder="Deluxe King Suite"
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block text-stone-600 uppercase mb-1">Capacity (Persons)</label>
                <input
                  type="number"
                  required
                  value={roomCapacity}
                  onChange={(e) => setRoomCapacity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block text-stone-600 uppercase mb-1">Price per Night (ETB)</label>
                <input
                  type="number"
                  required
                  value={roomPrice}
                  onChange={(e) => setRoomPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl shadow-xs">
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-4 text-xs font-semibold">
            <h3 className="text-base font-bold text-stone-900">Register Front-Desk Receptionist</h3>
            <form onSubmit={handleAddStaffSubmit} className="space-y-3">
              <div>
                <label className="block text-stone-600 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Tigist Alemu"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block text-stone-600 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="receptionist@example.com"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>
              <div>
                <label className="block text-stone-600 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl shadow-xs">
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
