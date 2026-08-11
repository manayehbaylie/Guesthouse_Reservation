import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import {
  Shield,
  Building,
  Users,
  CheckCircle,
  XCircle,
  Activity,
  Settings,
  RefreshCw,
  Search,
  Sliders,
} from 'lucide-react';

export const AdminDashboard = () => {
  const [guesthouses, setGuesthouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('approvals');
  const [loading, setLoading] = useState(true);

  // Settings State
  const [commissionRate, setCommissionRate] = useState(5.0);
  const [telebirrGateway, setTelebirrGateway] = useState(true);
  const [chapaGateway, setChapaGateway] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const ghList = await ApiService.getGuesthouses();
      setGuesthouses(ghList);

      const userList = ApiService.getAllUsers();
      setUsers(userList);

      const logList = ApiService.getAuditLogs();
      setLogs(logList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveGuesthouse = async (id, status) => {
    try {
      await ApiService.approveGuesthouse(id, status);
      await loadData();
    } catch (err) {
      alert(err.message || 'Error approving guesthouse');
    }
  };

  const pendingGuesthouses = guesthouses.filter((g) => g.status === 'pending');

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-stone-900 to-purple-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-purple-800/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2.5 py-0.5 rounded-full">
              Platform Governance Module
            </span>
            <span className="text-xs text-stone-300 font-mono">
              System Admin
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-purple-50">
            System Administrator Oversight
          </h1>
          <p className="text-xs text-stone-300 mt-1">
            Guesthouse registration approvals, account governance, platform activity audit monitoring, and system settings.
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-semibold rounded-xl border border-purple-700/50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Admin View
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Pending Approvals</span>
            <span className="text-2xl font-mono font-extrabold text-amber-800">{pendingGuesthouses.length}</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Building className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Total Guesthouses</span>
            <span className="text-2xl font-mono font-extrabold text-purple-900">{guesthouses.length}</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
            <Building className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Registered Users</span>
            <span className="text-2xl font-mono font-extrabold text-blue-900">{users.length}</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Audit Activity Logs</span>
            <span className="text-2xl font-mono font-extrabold text-emerald-900">{logs.length}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex bg-stone-200 p-1 rounded-2xl max-w-3xl text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'approvals' ? 'bg-white text-purple-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Pending Approvals Queue ({pendingGuesthouses.length})
        </button>
        <button
          onClick={() => setActiveTab('guesthouses')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'guesthouses' ? 'bg-white text-purple-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          All Guesthouses ({guesthouses.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'users' ? 'bg-white text-purple-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Manage Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'activity' ? 'bg-white text-purple-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          System Activity Audit Logs
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2 px-3 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'settings' ? 'bg-white text-purple-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          System Settings
        </button>
      </div>

      {/* Tab 1: Pending Approvals */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <h2 className="text-lg font-bold font-serif text-stone-900">Guesthouse Registration Queue</h2>
            <p className="text-xs text-stone-500">Review newly registered guesthouses and grant platform listing approval.</p>
          </div>

          {pendingGuesthouses.length === 0 ? (
            <div className="bg-stone-50 rounded-2xl p-8 text-center border border-stone-200 text-stone-500 text-xs">
              No pending guesthouse approvals in queue. All registered properties are reviewed.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingGuesthouses.map((gh) => (
                <div key={gh.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded">
                        {gh.id}
                      </span>
                      <span className="font-bold text-stone-900 text-lg">{gh.name}</span>
                      <span className="text-xs bg-stone-100 font-bold px-2 py-0.5 rounded text-stone-700">
                        {gh.city}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600">{gh.location} &bull; Address: {gh.address}</p>
                    <p className="text-xs text-stone-500 line-clamp-2">{gh.description}</p>
                    <p className="text-xs text-stone-400 font-mono">Contact: {gh.phone} | {gh.email}</p>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                    <button
                      onClick={() => handleApproveGuesthouse(gh.id, 'rejected')}
                      className="flex-1 md:flex-initial px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl border transition-colors flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4 text-red-600" /> Reject
                    </button>
                    <button
                      onClick={() => handleApproveGuesthouse(gh.id, 'approved')}
                      className="flex-1 md:flex-initial px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve Listing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: All Guesthouses */}
      {activeTab === 'guesthouses' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Guesthouse Name</th>
                <th className="p-3.5">City / Location</th>
                <th className="p-3.5">Contact Phone</th>
                <th className="p-3.5">Approval Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-medium text-stone-800">
              {guesthouses.map((gh) => (
                <tr key={gh.id}>
                  <td className="p-3.5 font-mono font-bold text-purple-900">{gh.id}</td>
                  <td className="p-3.5 font-bold">{gh.name}</td>
                  <td className="p-3.5">{gh.city} ({gh.location})</td>
                  <td className="p-3.5 font-mono">{gh.phone}</td>
                  <td className="p-3.5">
                    <span className={`uppercase text-[10px] font-bold px-2.5 py-0.5 rounded ${
                      gh.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {gh.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: User Accounts */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3.5">User ID</th>
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Phone</th>
                <th className="p-3.5">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-medium text-stone-800">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="p-3.5 font-mono font-bold text-stone-500">{u.id}</td>
                  <td className="p-3.5 font-bold">{u.name}</td>
                  <td className="p-3.5">{u.email}</td>
                  <td className="p-3.5 font-mono">{u.phone}</td>
                  <td className="p-3.5">
                    <span className={`uppercase text-[10px] font-bold px-2.5 py-0.5 rounded ${
                      u.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                      u.role === 'Owner' ? 'bg-amber-100 text-amber-800' :
                      u.role === 'Receptionist' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-stone-200 font-bold text-stone-800 text-sm">
            Platform System Audit Activity Feed
          </div>
          <div className="divide-y divide-stone-200 text-xs">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-purple-900">{log.action}</span>
                    <span className="bg-stone-100 font-mono text-[10px] px-2 py-0.5 rounded text-stone-600">
                      Actor: {log.actor} ({log.role})
                    </span>
                  </div>
                  <p className="text-stone-700">{log.details}</p>
                </div>
                <span className="text-[10px] font-mono text-stone-400 shrink-0">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm max-w-xl space-y-6">
          <h2 className="text-lg font-bold font-serif text-stone-900">Platform System Configuration</h2>

          <div className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-stone-700 mb-1">Platform Commission Fee (%)</label>
              <input
                type="number"
                step="0.5"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-bold"
              />
            </div>

            <div className="pt-2 border-t border-stone-200 space-y-3">
              <span className="block text-stone-500 uppercase tracking-wider text-[10px]">Payment Gateways Status</span>
              
              <label className="flex items-center justify-between p-3 rounded-xl border border-stone-200">
                <span>Telebirr Mobile Money Integration</span>
                <input
                  type="checkbox"
                  checked={telebirrGateway}
                  onChange={(e) => setTelebirrGateway(e.target.checked)}
                  className="w-4 h-4 accent-purple-800 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-stone-200">
                <span>Chapa Gateway Integration</span>
                <input
                  type="checkbox"
                  checked={chapaGateway}
                  onChange={(e) => setChapaGateway(e.target.checked)}
                  className="w-4 h-4 accent-purple-800 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
