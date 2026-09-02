import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import {
  Building,
  Users,
  CheckCircle,
  XCircle,
  Activity,
  Settings,
  RefreshCw,
  Percent,
  TrendingUp,
  DollarSign,
} from 'lucide-react';

export const AdminDashboard = () => {
  const [guesthouses, setGuesthouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('approvals');
  const [loading, setLoading] = useState(true);

  // Commission State
  const [commissionRate, setCommissionRate] = useState(5.0);
  const [totalCommission, setTotalCommission] = useState(125000);
  const [pendingCommission, setPendingCommission] = useState(35000);
  const [telebirrGateway, setTelebirrGateway] = useState(true);
  const [chapaGateway, setChapaGateway] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const ghList = await ApiService.getGuesthouses();
      setGuesthouses(ghList);

      const userList = await ApiService.fetchAdminUsers();
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

  const pendingGuesthouses = guesthouses.filter((g) => g.status === 'pending' || g.status === 'PENDING');
  const ownerAccounts = users.filter((u) => u.role === 'OWNER' || u.role === 'Owner').length;

  return (
    <div className="pb-16">
      
      {/* Admin Control Sidebar - 4 Compact Cards in One Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        
        {/* Card 1: Total Guesthouses */}
        <div className="bg-gradient-to-br from-[#043658] to-[#0a4f7e] text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all border border-[#FFC107]/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">Total Guesthouses</span>
            <Building className="w-5 h-5 text-[#FFC107]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#FFC107]">{guesthouses.length}</div>
          <p className="text-[10px] text-white/70 mt-1">{guesthouses.filter(g => g.status === 'approved' || g.status === 'APPROVED').length} approved</p>
        </div>

        {/* Card 2: Owner Accounts */}
        <div className="bg-gradient-to-br from-[#043658] to-[#0a4f7e] text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all border border-[#FFC107]/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">Owner Accounts</span>
            <Users className="w-5 h-5 text-[#FFC107]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#FFC107]">{ownerAccounts}</div>
          <p className="text-[10px] text-white/70 mt-1">{users.length} total users</p>
        </div>

        {/* Card 3: Pending Verification */}
        <div className="bg-gradient-to-br from-[#FFC107] to-[#ffb300] text-[#043658] p-4 rounded-xl shadow-lg hover:shadow-xl transition-all border border-[#043658]/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">Pending Verification</span>
            <CheckCircle className="w-5 h-5 text-[#043658]" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#043658]">{pendingGuesthouses.length}</div>
          <p className="text-[10px] text-[#043658]/70 mt-1">awaiting approval</p>
        </div>

        {/* Card 4: Platform Commission */}
        <div className="bg-gradient-to-br from-[#043658] to-[#0a4f7e] text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all border border-[#FFC107]/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">Platform Commission</span>
            <Percent className="w-5 h-5 text-[#FFC107]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#FFC107]">{commissionRate}%</div>
          <p className="text-[10px] text-white/70 mt-1">Current rate</p>
        </div>

      </div>

      {/* Commission Activity Section */}
      <div className="mb-8 bg-gradient-to-r from-[#043658]/5 to-[#FFC107]/5 rounded-xl p-6 border border-[#043658]/10">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-[#043658]" />
          <h2 className="text-lg font-bold text-[#043658]">Commission Activity</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
            <span className="text-xs font-semibold text-stone-500 block mb-1">Total Commission Collected</span>
            <div className="text-2xl font-bold text-[#043658] font-mono">{totalCommission.toLocaleString()} ETB</div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600 font-semibold">+12% this month</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
            <span className="text-xs font-semibold text-stone-500 block mb-1">Pending Commission</span>
            <div className="text-2xl font-bold text-[#FFC107] font-mono">{pendingCommission.toLocaleString()} ETB</div>
            <p className="text-xs text-stone-500 mt-2">From active bookings</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
            <span className="text-xs font-semibold text-stone-500 block mb-1">Commission Settings</span>
            <div className="flex items-center gap-3 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-16 px-2 py-1 border border-stone-300 rounded text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#043658]"
                />
                <span className="text-sm font-bold text-stone-600">%</span>
              </label>
              <button className="px-3 py-1 bg-[#043658] text-white text-xs font-bold rounded hover:bg-[#0a4f7e] transition-colors">
                Update
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Management Tabs */}
      <div className="flex bg-stone-200 p-1 rounded-xl max-w-4xl text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'approvals' ? 'bg-white text-[#043658] shadow-sm' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Pending Approvals ({pendingGuesthouses.length})
        </button>
        <button
          onClick={() => setActiveTab('guesthouses')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'guesthouses' ? 'bg-white text-[#043658] shadow-sm' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          All Guesthouses ({guesthouses.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'users' ? 'bg-white text-[#043658] shadow-sm' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Manage Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'activity' ? 'bg-white text-[#043658] shadow-sm' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Activity Logs
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2 px-3 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'settings' ? 'bg-white text-[#043658] shadow-sm' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Settings
        </button>
      </div>

      {/* Tab 1: Pending Approvals */}
      {activeTab === 'approvals' && (
        <div className="space-y-4 mt-6">
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
            <h2 className="text-lg font-bold text-[#043658]">Guesthouse Approval Queue</h2>
            <p className="text-xs text-stone-500">Review and approve pending guesthouse registrations</p>
          </div>

          {pendingGuesthouses.length === 0 ? (
            <div className="bg-stone-50 rounded-xl p-8 text-center border border-stone-200 text-stone-500 text-xs">
              No pending guesthouses. All properties have been reviewed.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingGuesthouses.map((gh) => (
                <div key={gh.id} className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#043658] bg-[#FFC107]/20 px-2.5 py-0.5 rounded">
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
                      className="flex-1 md:flex-initial px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-lg border border-red-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                    <button
                      onClick={() => handleApproveGuesthouse(gh.id, 'approved')}
                      className="flex-1 md:flex-initial px-5 py-2 bg-[#043658] hover:bg-[#0a4f7e] text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
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
        <div className="bg-white rounded-xl border border-stone-200 overflow-x-auto shadow-sm mt-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3.5">ID</th>
                <th className="p-3.5">Guesthouse Name</th>
                <th className="p-3.5">City / Location</th>
                <th className="p-3.5">Contact Phone</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-medium text-stone-800">
              {guesthouses.map((gh) => (
                <tr key={gh.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-[#043658]">{gh.id}</td>
                  <td className="p-3.5 font-bold">{gh.name}</td>
                  <td className="p-3.5">{gh.city} ({gh.location})</td>
                  <td className="p-3.5 font-mono text-sm">{gh.phone}</td>
                  <td className="p-3.5">
                    <span className={`uppercase text-[10px] font-bold px-2.5 py-1 rounded ${
                      gh.status === 'approved' || gh.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-[#FFC107]/20 text-[#043658]'
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
        <div className="bg-white rounded-xl border border-stone-200 overflow-x-auto shadow-sm mt-6">
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
                <tr key={u.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-stone-500">{u.id}</td>
                  <td className="p-3.5 font-bold">{u.name}</td>
                  <td className="p-3.5">{u.email}</td>
                  <td className="p-3.5 font-mono">{u.phone}</td>
                  <td className="p-3.5">
                    <span className={`uppercase text-[10px] font-bold px-2.5 py-1 rounded ${
                      u.role === 'ADMIN' || u.role === 'Admin' ? 'bg-[#043658]/10 text-[#043658]' :
                      u.role === 'OWNER' || u.role === 'Owner' ? 'bg-[#FFC107]/20 text-[#043658]' :
                      u.role === 'RECEPTIONIST' || u.role === 'Receptionist' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
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

      {/* Tab 4: Activity Logs */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm mt-6">
          <div className="p-4 border-b border-stone-200 font-bold text-[#043658] text-sm bg-stone-50">
            System Activity Feed
          </div>
          {logs.length === 0 ? (
            <div className="p-8 text-center text-stone-500 text-xs">
              No activity logs recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-stone-200 text-xs">
              {logs.slice(0, 10).map((log) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-stone-50 transition-colors">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#043658] bg-[#FFC107]/20 px-2 py-0.5 rounded">{log.action}</span>
                      <span className="bg-stone-100 font-mono text-[10px] px-2 py-0.5 rounded text-stone-600">
                        {log.actor} ({log.role})
                      </span>
                    </div>
                    <p className="text-stone-700">{log.details}</p>
                  </div>
                  <span className="text-[10px] font-mono text-stone-400 shrink-0 whitespace-nowrap">{log.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: System Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-4 mt-6">
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
            <h2 className="text-lg font-bold text-[#043658]">Payment Gateway Configuration</h2>
            <p className="text-xs text-stone-500">Manage payment processing options</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#043658] mb-2">Telebirr Mobile Money Integration</label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={telebirrGateway}
                  onChange={(e) => setTelebirrGateway(e.target.checked)}
                  className="w-5 h-5 accent-[#043658] cursor-pointer"
                />
                <span className="text-sm text-stone-700">Enable Telebirr payments</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#043658] mb-2">Chapa Gateway Integration</label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={chapaGateway}
                  onChange={(e) => setChapaGateway(e.target.checked)}
                  className="w-5 h-5 accent-[#043658] cursor-pointer"
                />
                <span className="text-sm text-stone-700">Enable Chapa payments</span>
              </label>
            </div>

            <div className="pt-4 border-t border-stone-200">
              <button className="px-6 py-2.5 bg-[#043658] hover:bg-[#0a4f7e] text-white font-bold text-xs rounded-lg shadow-sm transition-colors">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
