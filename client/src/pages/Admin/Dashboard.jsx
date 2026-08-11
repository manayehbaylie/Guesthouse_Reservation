import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  Users,
  DollarSign,
  Activity,
  UserCheck,
  Search,
  Sliders,
  Terminal,
  FileCode2,
} from 'lucide-react';

export function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingGuesthouses, setPendingGuesthouses] = useState([]);
  const [allGuesthouses, setAllGuesthouses] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'pending', 'guesthouses', 'users', 'specs'
  const [activeTab, setActiveTab] = useState('pending');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const st = await ApiService.getAdminPlatformStats();
      setStats(st);

      const pending = await ApiService.getAdminPendingGuesthouses();
      setPendingGuesthouses(pending);

      const allGh = await ApiService.getGuesthouses();
      setAllGuesthouses(allGh);

      const uList = ApiService.getAllUsers();
      setUsersList(uList);
    } catch (err) {
      console.error('Error loading admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleApproveGuesthouse = async (id) => {
    try {
      await ApiService.approveGuesthouse(id);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Error approving guesthouse');
    }
  };

  const handlePromoteUserRole = (userId, newRole) => {
    try {
      const allU = ApiService.getAllUsers();
      const targetUser = allU.find((u) => u.id === userId);
      if (targetUser) {
        targetUser.role = newRole;
        setUsersList([...allU]);
        alert(`User ${targetUser.name} role updated to ${newRole}`);
      }
    } catch (err) {
      alert(err.message || 'Error changing user role');
    }
  };

  const filteredUsers = usersList.filter((u) => {
    if (userRoleFilter !== 'All' && u.role !== userRoleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchRole = u.role.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchRole) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase text-purple-700 tracking-wider">
            Platform System Administration Console
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">System Control & Operations</h1>
          <p className="text-xs text-stone-500">
            Platform Operator ID: <strong className="text-stone-900">{user?.email}</strong> • Mode: Superadmin
          </p>
        </div>
      </div>

      {/* Platform System Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
            <div className="text-xs text-stone-400 font-medium">Total Platform Revenue</div>
            <div className="text-2xl font-black text-stone-900">{stats.totalPlatformRevenue.toLocaleString()} ETB</div>
            <div className="text-[11px] text-emerald-600 font-bold">Processed via Telebirr & Chapa</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
            <div className="text-xs text-stone-400 font-medium">Registered Properties</div>
            <div className="text-2xl font-black text-stone-900">{stats.totalGuesthouses} Properties</div>
            <div className="text-[11px] text-stone-500">{stats.approvedGuesthouses} Approved & Live</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
            <div className="text-xs text-stone-400 font-medium">Platform Reservations</div>
            <div className="text-2xl font-black text-stone-900">{stats.totalReservations} Bookings</div>
            <div className="text-[11px] text-stone-500">Automated double-booking prevention</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-1">
            <div className="text-xs text-stone-400 font-medium">Registered User Accounts</div>
            <div className="text-2xl font-black text-stone-900">{stats.totalUsers} Accounts</div>
            <div className="text-[11px] text-stone-500">Guests, Owners, Receptionists, Admins</div>
          </div>
        </div>
      )}

      {/* Operational Tabs */}
      <div className="flex border-b border-stone-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 transition-colors ${
            activeTab === 'pending' ? 'border-b-2 border-purple-600 text-stone-900' : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          Pending Property Verification ({pendingGuesthouses.length})
        </button>
        <button
          onClick={() => setActiveTab('guesthouses')}
          className={`pb-3 transition-colors ${
            activeTab === 'guesthouses' ? 'border-b-2 border-purple-600 text-stone-900' : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          All System Guesthouses ({allGuesthouses.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 transition-colors ${
            activeTab === 'users' ? 'border-b-2 border-purple-600 text-stone-900' : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          User Accounts Directory ({usersList.length})
        </button>
      </div>

      {/* Tab 1: Pending Property Approvals */}
      {activeTab === 'pending' && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <span>Pending Guesthouse Verification Requests ({pendingGuesthouses.length})</span>
          </h3>

          {pendingGuesthouses.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500 bg-stone-50 rounded-2xl border border-stone-100">
              No pending guesthouses awaiting approval. All properties verified!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingGuesthouses.map((gh) => (
                <div
                  key={gh.id}
                  className="p-5 rounded-2xl border border-stone-200 bg-stone-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-stone-900 text-sm">{gh.name}</h4>
                    <p className="text-xs text-stone-500">
                      City: <strong>{gh.city}</strong> • Location: <strong>{gh.location}</strong>
                    </p>
                    <p className="text-xs text-stone-600 line-clamp-1">{gh.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveGuesthouse(gh.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Publish</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: All System Guesthouses Table */}
      {activeTab === 'guesthouses' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Property ID</th>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">City</th>
                  <th className="px-6 py-3.5">Rating</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {allGuesthouses.map((gh) => (
                  <tr key={gh.id}>
                    <td className="px-6 py-4 font-mono font-bold text-stone-900">{gh.id}</td>
                    <td className="px-6 py-4 font-bold">{gh.name}</td>
                    <td className="px-6 py-4">{gh.city}</td>
                    <td className="px-6 py-4">{gh.rating} ★</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          gh.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {gh.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {gh.status === 'pending' && (
                        <button
                          onClick={() => handleApproveGuesthouse(gh.id)}
                          className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: User Accounts Directory */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500">Filter Role:</span>
              {['All', 'Guest', 'Owner', 'Receptionist', 'Admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => setUserRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    userRoleFilter === r ? 'bg-purple-700 text-white' : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search user email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">User Name</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Phone</th>
                  <th className="px-6 py-3.5">Current Role</th>
                  <th className="px-6 py-3.5 text-right">Role Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 font-bold text-stone-900">{u.name}</td>
                    <td className="px-6 py-4 text-stone-600">{u.email}</td>
                    <td className="px-6 py-4 text-stone-600">{u.phone || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 font-bold uppercase text-[10px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handlePromoteUserRole(u.id, e.target.value)}
                        className="px-2 py-1 rounded-lg border border-stone-300 text-xs bg-white font-bold"
                      >
                        <option value="Guest">Guest</option>
                        <option value="Owner">Owner</option>
                        <option value="Receptionist">Receptionist</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
