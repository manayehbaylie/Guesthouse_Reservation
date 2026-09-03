import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import {
  Building,
  Plus,
  BedDouble,
  UserPlus,
  DollarSign,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
} from 'lucide-react';

export const OwnerDashboard = () => {
  const currentUser = ApiService.getCurrentUser();
  const [guesthouseId, setGuesthouseId] = useState(null);

  const [guesthouse, setGuesthouse] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [payments, setPayments] = useState([]);
  const [revenueReport, setRevenueReport] = useState(null);
  const [staffList, setStaffList] = useState([]);
  
  const [activeTab, setActiveTab] = useState('rooms');

  // Modals / Form States
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('Standard Deluxe');
  const [capacity, setCapacity] = useState(2);
  const [pricePerNight, setPricePerNight] = useState(2500);

  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('+251 9');

  const [ghName, setGhName] = useState('');
  const [ghCity, setGhCity] = useState('Addis Ababa');
  const [ghLocation, setGhLocation] = useState('');
  const [ghAddress, setGhAddress] = useState('');
  const [ghPhone, setGhPhone] = useState('+251 11 ');
  const [ghDescription, setGhDescription] = useState('');

  const loadData = async () => {
    try {
      // Get the owner's guesthouse using the proper API endpoint
      const gh = await ApiService.getMyGuesthouse();
      if (gh) {
        setGuesthouseId(gh.id);
        setGuesthouse(gh);

        const roomList = await ApiService.getRoomsForGuesthouse(gh.id);
        setRooms(roomList);

        const payList = await ApiService.getOwnerPayments(gh.id);
        setPayments(payList);

        const rep = await ApiService.getOwnerRevenueReport(gh.id);
        setRevenueReport(rep);

        const staff = await ApiService.getOwnerReceptionists(gh.id);
        setStaffList(Array.isArray(staff) ? staff : []);
      } else {
        setGuesthouseId(null);
        setGuesthouse(null);
        setRooms([]);
        setPayments([]);
        setRevenueReport(null);
        setStaffList([]);
      }
    } catch (err) {
      console.error(err);
      setGuesthouseId(null);
      setGuesthouse(null);
      setRooms([]);
      setPayments([]);
      setRevenueReport(null);
      setStaffList([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddRoomSubmit = async (e) => {
    e.preventDefault();
    try {
      await ApiService.addRoom({
        guesthouseId,
        roomNumber,
        type: roomType,
        capacity: Number(capacity),
        pricePerNight: Number(pricePerNight),
        availabilityStatus: 'available',
        description: `${roomType} with modern amenities and hot water.`,
        amenities: ['Free Wi-Fi', 'Hot Water', 'Cable TV'],
      });
      setShowAddRoom(false);
      setRoomNumber('');
      await loadData();
    } catch (err) {
      alert(err.message || 'Error adding room');
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
      setShowAddStaff(false);
      setStaffName('');
      setStaffEmail('');
      await loadData();
    } catch (err) {
      alert(err.message || 'Error registering staff');
    }
  };

  const handleRegisterGuesthouse = async (e) => {
    e.preventDefault();
    try {
      await ApiService.registerGuesthouse({
        ownerId: currentUser?.id || 'usr-owner-1',
        name: ghName,
        description: ghDescription,
        city: ghCity,
        location: ghLocation,
        address: ghAddress,
        phone: ghPhone,
        email: currentUser?.email || 'owner@example.com',
        images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'],
        amenities: ['Free Wi-Fi', 'Breakfast Included', 'Generator Backup'],
      });
      alert('Guesthouse submitted for System Admin approval!');
      await loadData();
    } catch (err) {
      alert(err.message || 'Error registering guesthouse');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-amber-800/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
              Property Owner Portal
            </span>
            <span className="text-xs text-stone-300 font-mono">
              Owner: {currentUser?.name}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-amber-50">
            {guesthouse ? guesthouse.name : 'Register Property'}
          </h1>
          <p className="text-xs text-stone-300 mt-1">
            {guesthouse ? `${guesthouse.location} (${guesthouse.city})` : 'Register your guesthouse to start receiving online bookings.'}
          </p>
        </div>

        {/* Approval Status Badge */}
        {guesthouse && (
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 shadow-sm ${
              guesthouse.status === 'approved'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
            }`}>
              {guesthouse.status === 'approved' ? (
                <> <CheckCircle className="w-4 h-4 text-emerald-400" /> Platform Approved </>
              ) : (
                <> <Clock className="w-4 h-4 text-amber-400" /> Pending Admin Approval </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Warning if Pending Approval */}
      {guesthouse && guesthouse.status === 'pending' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
          <div>
            Your guesthouse registration is currently pending System Administrator review. It will appear in public search once approved. You can switch to the <strong>Admin Role</strong> via the top menu to approve it immediately for testing!
          </div>
        </div>
      )}

      {/* Revenue KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Total Property Revenue</span>
          <span className="text-2xl font-mono font-extrabold text-amber-900">
            {(revenueReport?.totalRevenue || 0).toLocaleString()} <span className="text-xs font-normal text-stone-500">ETB</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Monthly Revenue</span>
          <span className="text-2xl font-mono font-extrabold text-amber-900">
            {(revenueReport?.monthlyRevenue || 0).toLocaleString()} <span className="text-xs font-normal text-stone-500">ETB</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Total Bookings</span>
          <span className="text-2xl font-mono font-extrabold text-stone-900">{revenueReport?.totalBookings || 0}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Occupancy Rate</span>
          <span className="text-2xl font-mono font-extrabold text-emerald-800">{revenueReport?.occupancyRate || 0}%</span>
        </div>
      </div>

      {/* Owner Navigation Tabs */}
      <div className="flex bg-stone-200 p-1 rounded-2xl max-w-xl text-xs font-bold">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'rooms' ? 'bg-white text-amber-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Manage Rooms ({rooms.length})
        </button>
        <button
          onClick={() => setActiveTab('revenue')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'revenue' ? 'bg-white text-amber-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Payment History & Revenue
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'staff' ? 'bg-white text-amber-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Receptionist Staff ({staffList.length})
        </button>
        <button
          onClick={() => setActiveTab('register')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'register' ? 'bg-white text-amber-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Register New Guesthouse
        </button>
      </div>

      {/* Tab 1: Room Management */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold font-serif text-stone-900">Property Rooms & Rates</h2>
              <p className="text-xs text-stone-500">Configure room types, capacity, and nightly rates in ETB.</p>
            </div>
            <button
              onClick={() => setShowAddRoom(!showAddRoom)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Room
            </button>
          </div>

          {showAddRoom && (
            <form onSubmit={handleAddRoomSubmit} className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200/80 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">Add Room Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700">Room Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 105"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700">Room Type</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Executive Suite"
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700">Guest Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700">Price per Night (ETB)</label>
                  <input
                    type="number"
                    step="100"
                    value={pricePerNight}
                    onChange={(e) => setPricePerNight(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoom(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-800 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Save Room
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((rm) => (
              <div key={rm.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                    Room {rm.roomNumber}
                  </span>
                  <span className="text-sm font-mono font-extrabold text-stone-900">{rm.pricePerNight.toLocaleString()} ETB</span>
                </div>
                <h3 className="font-bold text-stone-900 text-base">{rm.type}</h3>
                <p className="text-xs text-stone-500">Capacity: {rm.capacity} Guests &bull; Status: <span className="font-semibold uppercase">{rm.availabilityStatus}</span></p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Revenue & Payment History */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          
          {/* Method Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500">
              Payment Gateway Distribution (System Processed)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 block">Telebirr Mobile Money</span>
                <span className="text-xl font-mono font-extrabold text-emerald-950">
                  {(revenueReport?.paymentMethodBreakdown.telebirr || 0).toLocaleString()} ETB
                </span>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <span className="text-xs font-bold text-blue-800 block">Chapa Ethiopian Gateway</span>
                <span className="text-xl font-mono font-extrabold text-blue-950">
                  {(revenueReport?.paymentMethodBreakdown.chapa || 0).toLocaleString()} ETB
                </span>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                <span className="text-xs font-bold text-purple-800 block">Visa / Mastercard</span>
                <span className="text-xl font-mono font-extrabold text-purple-950">
                  {(revenueReport?.paymentMethodBreakdown.card || 0).toLocaleString()} ETB
                </span>
              </div>
            </div>
          </div>

          {/* Payment History Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-x-auto shadow-sm">
            <div className="p-4 border-b border-stone-200 font-bold text-stone-800 text-sm">
              Online Payments History (Audit Logged)
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-3.5">Payment Ref</th>
                  <th className="p-3.5">Guest</th>
                  <th className="p-3.5">Gateway</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Processed By</th>
                  <th className="p-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-medium text-stone-800">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3.5 font-mono font-bold text-amber-900">{p.referenceNumber}</td>
                    <td className="p-3.5 font-bold">{p.guestName}</td>
                    <td className="p-3.5 uppercase font-bold text-stone-600">{p.method}</td>
                    <td className="p-3.5 font-mono">{p.amount.toLocaleString()} ETB</td>
                    <td className="p-3.5">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        System Automatic
                      </span>
                    </td>
                    <td className="p-3.5 text-stone-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Tab 3: Receptionist Staff Accounts */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold font-serif text-stone-900">Front Desk Receptionist Staff</h2>
              <p className="text-xs text-stone-500">Create and manage receptionist accounts scoped to this guesthouse.</p>
            </div>
            <button
              onClick={() => setShowAddStaff(!showAddStaff)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Add Receptionist Account
            </button>
          </div>

          {showAddStaff && (
            <form onSubmit={handleAddStaffSubmit} className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200/80 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">Register Receptionist Staff</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tigist Alemu"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. tigist@guesthouse.et"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-stone-300 text-xs font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaff(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-800 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-3.5">Staff Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-medium text-stone-800">
                {staffList.map((st) => (
                  <tr key={st.id}>
                    <td className="p-3.5 font-bold">{st.name}</td>
                    <td className="p-3.5">{st.email}</td>
                    <td className="p-3.5 font-mono">{st.phone}</td>
                    <td className="p-3.5">
                      <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">
                        Receptionist
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Register New Guesthouse */}
      {activeTab === 'register' && (
        <form onSubmit={handleRegisterGuesthouse} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4 max-w-2xl">
          <h2 className="text-lg font-bold font-serif text-stone-900">Submit New Guesthouse Property</h2>
          <p className="text-xs text-stone-500">Property will be submitted to the System Administrator for platform listing approval.</p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Guesthouse Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Bishoftu Crater Views Guesthouse"
                value={ghName}
                onChange={(e) => setGhName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">City</label>
                <select
                  value={ghCity}
                  onChange={(e) => setGhCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-bold bg-white"
                >
                  <option value="Addis Ababa">Addis Ababa</option>
                  <option value="Hawassa">Hawassa</option>
                  <option value="Bishoftu">Bishoftu</option>
                  <option value="Bahir Dar">Bahir Dar</option>
                  <option value="Lalibela">Lalibela</option>
                  <option value="Gondar">Gondar</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">Location / Neighborhood</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bole Atlas"
                  value={ghLocation}
                  onChange={(e) => setGhLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Full Street Address</label>
              <input
                type="text"
                required
                placeholder="e.g. Kebele 02, House #991"
                value={ghAddress}
                onChange={(e) => setGhAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Contact Phone</label>
              <input
                type="text"
                required
                value={ghPhone}
                onChange={(e) => setGhPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Property Description</label>
              <textarea
                rows={3}
                required
                placeholder="Describe your guesthouse..."
                value={ghDescription}
                onChange={(e) => setGhDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-bold"
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-800 hover:bg-amber-900 text-white font-bold text-sm rounded-xl shadow-md transition-colors"
          >
            Submit Property for Platform Approval
          </button>
        </form>
      )}

    </div>
  );
};
