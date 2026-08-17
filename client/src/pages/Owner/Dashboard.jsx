import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiService, api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Building2,
  BedDouble,
  Users,
  DollarSign,
  Plus,
  BarChart3,
  CheckCircle2,
  Smartphone,
  CreditCard,
  UserPlus,
  LogOut,
  MessageSquare,
} from 'lucide-react';

export function OwnerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [guesthouseId, setGuesthouseId] = useState(null);
  const [guesthouse, setGuesthouse] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [staff, setStaff] = useState([]);
  const [payments, setPayments] = useState([]);
  const [revenueReport, setRevenueReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('revenue'); // For Payment History tab only

  // Form State: Edit Property (for quick edits on dashboard)
  const [propName, setPropName] = useState('');
  const [propCity, setPropCity] = useState('Addis Ababa');
  const [propLocation, setPropLocation] = useState('');
  const [propDesc, setPropDesc] = useState('');
  const [propAmenities, setPropAmenities] = useState('');

  // Redirect if not logged in or not an owner
  useEffect(() => {
    if (!user || user.role !== 'OWNER') {
      navigate('/login');
    }
  }, [user, navigate]);

  // Don't render if not authorized
  if (!user || user.role !== 'OWNER') {
    return null;
  }

  const loadOwnerData = async () => {
    setLoading(true);
    try {
      // First, get the owner's guesthouse using the /owner/me endpoint
      const gh = await ApiService.getMyGuesthouse();
      setGuesthouse(gh);
      if (gh) {
        setGuesthouseId(gh.id);
        setPropName(gh.name || '');
        setPropCity(gh.city || 'Addis Ababa');
        setPropLocation(gh.location || '');
        setPropDesc(gh.description || '');
        setPropAmenities(gh.amenities?.join(', ') || '');

        try {
          const rmList = await ApiService.getRoomsForGuesthouse(gh.id);
          setRooms(rmList);
        } catch (roomErr) {
          console.error('Failed to load rooms:', roomErr);
          setRooms([]);
        }

        try {
          // Use the owner dashboard revenue endpoint
          const dashboardStats = await ApiService.getOwnerDashboardStats();
          const revenueData = await ApiService.getOwnerDashboardRevenue();
          setRevenueReport({
            totalRevenue: revenueData.totalRevenue || 0,
            totalTransactions: dashboardStats.totalReservations || 0,
            paymentMethodBreakdown: {
              telebirr: revenueData.totalRevenue || 0, // Backend doesn't break down by method yet
              chapa: 0,
              cbe_birr: 0,
            },
            occupancyRate: dashboardStats.totalRooms > 0 
              ? Math.round(((dashboardStats.totalRooms - dashboardStats.availableRooms) / dashboardStats.totalRooms) * 100) 
              : 0,
          });
        } catch (revErr) {
          console.error('Failed to load revenue:', revErr);
          setRevenueReport({ totalRevenue: 0, paymentMethodBreakdown: { telebirr: 0, chapa: 0 } });
        }

        try {
          // Use the owner dashboard payments endpoint
          const pmts = await ApiService.getOwnerDashboardRecentPayments();
          setPayments(pmts);
        } catch (payErr) {
          console.error('Failed to load payments:', payErr);
          setPayments([]);
        }

        try {
          // Use the owner-specific staff endpoint
          const staffData = await ApiService.getOwnerReceptionists(gh.id);
          setStaff(staffData);
        } catch (staffErr) {
          console.error('Failed to load staff:', staffErr);
          setStaff([]);
        }
      }
    } catch (err) {
      console.error('Failed to load owner dashboard data:', err);
      // If owner doesn't have a guesthouse yet, that's okay
      setGuesthouse(null);
      setGuesthouseId(null);
      // Set default values so dashboard can still render
      setRooms([]);
      setStaff([]);
      setPayments([]);
      setRevenueReport({ totalRevenue: 0, paymentMethodBreakdown: { telebirr: 0, chapa: 0 } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, []);

  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-stone-600 font-medium">Loading Owner Dashboard...</p>
        </div>
      </div>
    );
  }

  const handleUpdatePropertySubmit = async (e) => {
    e.preventDefault();
    try {
      const amList = propAmenities.split(',').map((s) => s.trim()).filter(Boolean);
      // Use the owner-specific endpoint for updating guesthouse
      await api.put('/owner/guesthouse', {
        name: propName,
        city: propCity,
        address: propLocation,
        description: propDesc,
      });
      alert('Property details updated successfully.');
      loadOwnerData();
    } catch (err) {
      alert(err.message || 'Error saving property update.');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 text-white flex flex-col fixed h-full">
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => navigate('/owner')}
            className="w-full px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors bg-amber-500 text-stone-950"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => navigate('/owner/guesthouse')}
            className="w-full px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors text-stone-300 hover:bg-stone-800"
          >
            <Building2 className="w-4 h-4" />
            <span>Manage Guesthouse</span>
          </button>
          <button
            onClick={() => navigate('/owner/rooms')}
            className="w-full px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors text-stone-300 hover:bg-stone-800"
          >
            <BedDouble className="w-4 h-4" />
            <span>Room Inventory</span>
          </button>
          <button
            onClick={() => navigate('/owner/staff')}
            className="w-full px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors text-stone-300 hover:bg-stone-800"
          >
            <Users className="w-4 h-4" />
            <span>Staff Accounts</span>
          </button>
          <button
            onClick={() => navigate('/owner/revenue')}
            className="w-full px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors text-stone-300 hover:bg-stone-800"
          >
            <DollarSign className="w-4 h-4" />
            <span>Revenue & Reports</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`w-full px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors ${
              activeTab === 'payments' ? 'bg-amber-500 text-stone-950' : 'text-stone-300 hover:bg-stone-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payment History</span>
          </button>
          <button
            onClick={() => navigate('/owner/reviews')}
            className="w-full px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors text-stone-300 hover:bg-stone-800"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Guest Reviews</span>
          </button>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-stone-800">
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="w-full px-4 py-3 rounded-lg text-xs font-semibold text-stone-300 hover:bg-stone-800 flex items-center gap-3 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Top Header */}
        <header className="bg-white border-b border-stone-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black text-stone-900 tracking-tight">
                  {guesthouse ? guesthouse.name : 'Owner Dashboard'}
                </h1>
                <p className="text-xs text-stone-500">
                  {guesthouse?.location || 'Bole Subcity, Addis Ababa, Ethiopia'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/owner/rooms')}
                  className="px-4 py-2 bg-amber-500 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-amber-400 transition-colors shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Manage Rooms</span>
                </button>
                <button
                  onClick={() => navigate('/owner/staff')}
                  className="px-4 py-2 bg-stone-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-stone-800 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Manage Staff</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Primary KPI Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
              <div className="text-xs text-stone-500 font-medium uppercase tracking-wider">TOTAL NET REVENUE</div>
              <div className="text-2xl font-black text-stone-900">
                {revenueReport ? `${revenueReport.totalRevenue.toLocaleString()} ETB` : '0 ETB'}
              </div>
              <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% Online Verified</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
              <div className="text-xs text-stone-500 font-medium uppercase tracking-wider">CURRENT OCCUPANCY</div>
              <div className="text-2xl font-black text-stone-900">
                {revenueReport ? `${revenueReport.occupancyRate}%` : '0%'}
              </div>
              <div className="text-[11px] text-stone-500">
                {rooms.filter((r) => r.availabilityStatus !== 'available').length} of {rooms.length} rooms occupied
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
              <div className="text-xs text-stone-500 font-medium uppercase tracking-wider">TOTAL BOOKINGS</div>
              <div className="text-2xl font-black text-stone-900">{revenueReport?.totalTransactions || payments.length}</div>
              <div className="text-[11px] text-stone-500">Self-service online reservations</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
              <div className="text-xs text-stone-500 font-medium uppercase tracking-wider">PROPERTY ROOMS</div>
              <div className="text-2xl font-black text-stone-900">{rooms.length}</div>
              <div className="text-[11px] text-stone-500">Listed on Ethiopian platform</div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          {revenueReport && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                  <Smartphone className="w-4 h-4" />
                  <span>Telebirr Mobile Wallet Earnings</span>
                </div>
                <div className="text-2xl font-black text-stone-900">
                  {revenueReport.paymentMethodBreakdown.telebirr.toLocaleString()} ETB
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
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

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-900">Recent Transactions</h3>
            </div>
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

          {/* Payment History Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
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
        </div>
      </main>
    </div>
  );
}