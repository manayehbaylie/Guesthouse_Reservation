import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  XCircle,
  Users,
  Search,
  ShieldCheck,
  RefreshCw,
  Trash2,
} from 'lucide-react';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeSection, setActiveSection] = useState('pending');

  const [stats, setStats] = useState({
    totalPlatformRevenue: 0,
    totalGuesthouses: 0,
    approvedGuesthouses: 0,
    totalReservations: 0,
    totalUsers: 0,
    pendingGuesthouses: 0,
  });

  const [pendingGuesthouses, setPendingGuesthouses] = useState([]);
  const [allGuesthouses, setAllGuesthouses] = useState([]);
  const [usersList, setUsersList] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');

  // ============================================================
  // LOAD ADMIN DATA
  // ============================================================

  const loadAdminData = async () => {
    setLoading(true);
    setError('');

    try {
      const [
        platformStats,
        pending,
        guesthouses,
        users,
      ] = await Promise.all([
        ApiService.getAdminPlatformStats(),
        ApiService.getAdminPendingGuesthouses(),
        ApiService.getGuesthouses(),
        ApiService.getAllUsers(),
      ]);

      setStats({
        totalPlatformRevenue:
          Number(platformStats?.totalPlatformRevenue || 0),

        totalGuesthouses:
          Number(platformStats?.totalGuesthouses || 0),

        approvedGuesthouses:
          Number(platformStats?.approvedGuesthouses || 0),

        totalReservations:
          Number(platformStats?.totalReservations || 0),

        totalUsers:
          Number(platformStats?.totalUsers || 0),

        pendingGuesthouses:
          pending?.length || 0,
      });

      setPendingGuesthouses(
        Array.isArray(pending) ? pending : []
      );

      setAllGuesthouses(
        Array.isArray(guesthouses) ? guesthouses : []
      );

      setUsersList(
        Array.isArray(users) ? users : []
      );
    } catch (err) {
      console.error('Admin data loading error:', err);

      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load admin data.'
      );

      setPendingGuesthouses([]);
      setAllGuesthouses([]);
      setUsersList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // ============================================================
  // APPROVE
  // ============================================================

  const handleApproveGuesthouse = async (id) => {
    if (!id) return;

    try {
      setLoading(true);

      await ApiService.approveGuesthouse(id);

      await loadAdminData();

      setActiveSection('pending');
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to approve guesthouse.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // REJECT
  // ============================================================

  const handleRejectGuesthouse = async (id) => {
    if (!id) return;

    const reason =
      window.prompt(
        'Enter rejection reason:',
        'Does not meet platform standards'
      );

    if (reason === null) return;

    try {
      setLoading(true);

      await ApiService.rejectGuesthouse(
        id,
        reason
      );

      await loadAdminData();
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to reject guesthouse.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // DELETE GUESTHOUSE
  // ============================================================

  const handleDeleteGuesthouse = async (id) => {
    if (!id) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this guesthouse?\n\nThis action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      await ApiService.deleteGuesthouse(id);

      await loadAdminData();
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to delete guesthouse.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // DELETE USER
  // ============================================================

  const handleDeleteUser = async (id) => {
    if (!id) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this user?\n\nThis action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      await ApiService.deleteUser(id);

      await loadAdminData();
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to delete user.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CHANGE USER ROLE
  // ============================================================

  const handlePromoteUserRole = async (
    userId,
    newRole
  ) => {
    if (!userId || !newRole) return;

    try {
      setLoading(true);

      await ApiService.updateUserRole(
        userId,
        newRole
      );

      await loadAdminData();
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update user role.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // USER FILTER
  // ============================================================

  const filteredUsers = usersList.filter((item) => {
    const role =
      String(item?.role || '').toUpperCase();

    const roleMatch =
      userRoleFilter === 'All' ||
      role === userRoleFilter;

    if (!roleMatch) {
      return false;
    }

    const query =
      searchQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    const name =
      String(item?.name || '').toLowerCase();

    const email =
      String(item?.email || '').toLowerCase();

    const phone =
      String(item?.phone || '').toLowerCase();

    return (
      name.includes(query) ||
      email.includes(query) ||
      phone.includes(query) ||
      role.toLowerCase().includes(query)
    );
  });

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">

          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-stone-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-purple-700" />

                <h1 className="text-2xl font-black text-stone-900">
                  Admin Dashboard
                </h1>
              </div>

              <p className="text-sm text-stone-500 mt-1">
                Platform administration and system management
              </p>

              {user?.email && (
                <p className="text-xs text-stone-400 mt-1">
                  Administrator: {user.email}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={loadAdminData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-bold disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                loading ? 'animate-spin' : ''
              }`}
            />

            Refresh
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">

          <StatCard
            title="Revenue"
            value={`${stats.totalPlatformRevenue.toLocaleString()} ETB`}
          />

          <StatCard
            title="Guesthouses"
            value={stats.totalGuesthouses}
          />

          <StatCard
            title="Approved"
            value={stats.approvedGuesthouses}
          />

          <StatCard
            title="Reservations"
            value={stats.totalReservations}
          />

          <StatCard
            title="Users"
            value={stats.totalUsers}
          />

        </div>

        {/* ADMIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-6">

          {/* SIDEBAR */}
          <aside className="bg-white rounded-3xl border border-stone-200 p-4 h-fit">

            <div className="text-xs uppercase tracking-wider font-black text-stone-400 px-3 mb-3">
              Administration
            </div>

            <SidebarButton
              active={activeSection === 'pending'}
              icon={<Building2 className="w-4 h-4" />}
              label="Pending Verification"
              count={pendingGuesthouses.length}
              onClick={() =>
                setActiveSection('pending')
              }
            />

            <SidebarButton
              active={activeSection === 'guesthouses'}
              icon={<Building2 className="w-4 h-4" />}
              label="Guesthouses"
              count={allGuesthouses.length}
              onClick={() =>
                setActiveSection('guesthouses')
              }
            />

            <SidebarButton
              active={activeSection === 'users'}
              icon={<Users className="w-4 h-4" />}
              label="User Accounts"
              count={usersList.length}
              onClick={() =>
                setActiveSection('users')
              }
            />

          </aside>

          {/* CONTENT */}
          <main>

            {/* ==================================================
                PENDING VERIFICATION
            ================================================== */}

            {activeSection === 'pending' && (
              <section className="bg-white rounded-3xl border border-stone-200 p-6">

                <SectionHeader
                  icon={
                    <Building2 className="w-5 h-5 text-amber-600" />
                  }
                  title="Pending Property Verification"
                  subtitle="Review and approve new guesthouses."
                />

                {pendingGuesthouses.length === 0 ? (
                  <EmptyState
                    title="No pending guesthouses"
                    text="All guesthouses have been reviewed."
                  />
                ) : (
                  <div className="space-y-4">

                    {pendingGuesthouses.map((gh) => (
                      <div
                        key={gh.id}
                        className="border border-stone-200 rounded-2xl p-5"
                      >

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">

                          <div>
                            <h3 className="font-black text-stone-900">
                              {gh.name}
                            </h3>

                            <p className="text-sm text-stone-500 mt-1">
                              {gh.city || 'Unknown city'}
                              {' • '}
                              {gh.location ||
                                gh.address ||
                                'No location'}
                            </p>

                            {gh.description && (
                              <p className="text-sm text-stone-600 mt-2">
                                {gh.description}
                              </p>
                            )}

                            <div className="text-xs text-stone-400 mt-2">
                              ID: {gh.id}
                            </div>
                          </div>

                          <div className="flex gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                handleRejectGuesthouse(
                                  gh.id
                                )
                              }
                              disabled={loading}
                              className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleApproveGuesthouse(
                                  gh.id
                                )
                              }
                              disabled={loading}
                              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Approve
                            </button>

                          </div>

                        </div>

                      </div>
                    ))}

                  </div>
                )}

              </section>
            )}

            {/* ==================================================
                GUESTHOUSES
            ================================================== */}

            {activeSection === 'guesthouses' && (
              <section className="bg-white rounded-3xl border border-stone-200 overflow-hidden">

                <div className="p-6 border-b border-stone-200">
                  <SectionHeader
                    icon={
                      <Building2 className="w-5 h-5 text-purple-600" />
                    }
                    title="Guesthouse Directory"
                    subtitle="Manage all properties registered on the platform."
                  />
                </div>

                {allGuesthouses.length === 0 ? (
                  <EmptyState
                    title="No guesthouses"
                    text="There are no registered guesthouses."
                  />
                ) : (
                  <div className="overflow-x-auto">

                    <table className="w-full text-left">

                      <thead className="bg-stone-50">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold">
                            Name
                          </th>

                          <th className="px-6 py-4 text-xs font-bold">
                            City
                          </th>

                          <th className="px-6 py-4 text-xs font-bold">
                            Rating
                          </th>

                          <th className="px-6 py-4 text-xs font-bold">
                            Status
                          </th>

                          <th className="px-6 py-4 text-xs font-bold text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-stone-100">

                        {allGuesthouses.map((gh) => (
                          <tr key={gh.id}>

                            <td className="px-6 py-4">
                              <div className="font-bold">
                                {gh.name}
                              </div>

                              <div className="text-xs text-stone-400">
                                ID: {gh.id}
                              </div>
                            </td>

                            <td className="px-6 py-4 text-sm">
                              {gh.city || 'N/A'}
                            </td>

                            <td className="px-6 py-4 text-sm">
                              {Number(gh.rating || 0).toFixed(1)} ★
                            </td>

                            <td className="px-6 py-4">

                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                  String(
                                    gh.status
                                  ).toLowerCase() ===
                                  'approved'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {gh.status || 'unknown'}
                              </span>

                            </td>

                            <td className="px-6 py-4">

                              <div className="flex justify-end gap-2">

                                {String(
                                  gh.status
                                ).toLowerCase() ===
                                  'pending' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleApproveGuesthouse(
                                        gh.id
                                      )
                                    }
                                    className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                                  >
                                    Approve
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteGuesthouse(
                                      gh.id
                                    )
                                  }
                                  disabled={loading}
                                  className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>

                              </div>

                            </td>

                          </tr>
                        ))}

                      </tbody>

                    </table>

                  </div>
                )}

              </section>
            )}

            {/* ==================================================
                USERS
            ================================================== */}

            {activeSection === 'users' && (
              <section className="bg-white rounded-3xl border border-stone-200 overflow-hidden">

                <div className="p-6 border-b border-stone-200">

                  <SectionHeader
                    icon={
                      <Users className="w-5 h-5 text-purple-600" />
                    }
                    title="User Accounts Directory"
                    subtitle="Manage platform users and roles."
                  />

                  <div className="mt-5 flex flex-col md:flex-row gap-4 justify-between">

                    <div className="flex flex-wrap gap-2">

                      {[
                        'All',
                        'GUEST',
                        'OWNER',
                        'RECEPTIONIST',
                        'ADMIN',
                      ].map((role) => (
                        <button
                          type="button"
                          key={role}
                          onClick={() =>
                            setUserRoleFilter(role)
                          }
                          className={`px-3 py-2 rounded-lg text-xs font-bold ${
                            userRoleFilter === role
                              ? 'bg-purple-700 text-white'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {role}
                        </button>
                      ))}

                    </div>

                    <div className="relative">

                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />

                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) =>
                          setSearchQuery(
                            e.target.value
                          )
                        }
                        placeholder="Search users..."
                        className="w-full md:w-72 pl-9 pr-4 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />

                    </div>

                  </div>

                </div>

                {filteredUsers.length === 0 ? (
                  <EmptyState
                    title="No users found"
                    text="No users match the current filter."
                  />
                ) : (
                  <div className="overflow-x-auto">

                    <table className="w-full text-left">

                      <thead className="bg-stone-50">
                        <tr>

                          <th className="px-6 py-4 text-xs font-bold">
                            Name
                          </th>

                          <th className="px-6 py-4 text-xs font-bold">
                            Email
                          </th>

                          <th className="px-6 py-4 text-xs font-bold">
                            Phone
                          </th>

                          <th className="px-6 py-4 text-xs font-bold">
                            Role
                          </th>

                          <th className="px-6 py-4 text-xs font-bold text-right">
                            Actions
                          </th>

                        </tr>
                      </thead>

                      <tbody className="divide-y divide-stone-100">

                        {filteredUsers.map((item) => (
                          <tr key={item.id}>

                            <td className="px-6 py-4 font-bold">
                              {item.name || 'N/A'}
                            </td>

                            <td className="px-6 py-4 text-sm text-stone-600">
                              {item.email || 'N/A'}
                            </td>

                            <td className="px-6 py-4 text-sm text-stone-600">
                              {item.phone || 'N/A'}
                            </td>

                            <td className="px-6 py-4">

                              <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-[10px] font-black">
                                {item.role}
                              </span>

                            </td>

                            <td className="px-6 py-4">

                              <div className="flex justify-end gap-2">

                                <select
                                  value={
                                    item.role
                                  }
                                  onChange={(e) =>
                                    handlePromoteUserRole(
                                      item.id,
                                      e.target.value
                                    )
                                  }
                                  className="px-2 py-2 rounded-lg border border-stone-300 text-xs font-bold"
                                >
                                  <option value="GUEST">
                                    Guest
                                  </option>

                                  <option value="OWNER">
                                    Owner
                                  </option>

                                  <option value="RECEPTIONIST">
                                    Receptionist
                                  </option>

                                  <option value="ADMIN">
                                    Admin
                                  </option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteUser(
                                      item.id
                                    )
                                  }
                                  disabled={loading}
                                  className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-bold disabled:opacity-50"
                                >
                                  Delete
                                </button>

                              </div>

                            </td>

                          </tr>
                        ))}

                      </tbody>

                    </table>

                  </div>
                )}

              </section>
            )}

          </main>

        </div>

      </div>
    </div>
  );
}


// ============================================================
// STAT CARD
// ============================================================

function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <div className="text-xs font-bold text-stone-400 uppercase">
        {title}
      </div>

      <div className="text-2xl font-black text-stone-900 mt-2">
        {value}
      </div>
    </div>
  );
}


// ============================================================
// SIDEBAR BUTTON
// ============================================================

function SidebarButton({
  active,
  icon,
  label,
  count,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-sm font-bold mb-1 ${
        active
          ? 'bg-purple-700 text-white'
          : 'text-stone-600 hover:bg-stone-100'
      }`}
    >
      <span className="flex items-center gap-3">
        {icon}
        {label}
      </span>

      <span
        className={`text-xs px-2 py-0.5 rounded-full ${
          active
            ? 'bg-white/20'
            : 'bg-stone-100'
        }`}
      >
        {count}
      </span>
    </button>
  );
}


// ============================================================
// SECTION HEADER
// ============================================================

function SectionHeader({
  icon,
  title,
  subtitle,
}) {
  return (
    <div className="flex items-start gap-3">

      <div className="mt-0.5">
        {icon}
      </div>

      <div>
        <h2 className="text-lg font-black text-stone-900">
          {title}
        </h2>

        <p className="text-sm text-stone-500 mt-1">
          {subtitle}
        </p>
      </div>

    </div>
  );
}


// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  title,
  text,
}) {
  return (
    <div className="p-12 text-center">

      <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center">
        <ShieldCheck className="w-6 h-6 text-stone-400" />
      </div>

      <h3 className="font-bold text-stone-800 mt-4">
        {title}
      </h3>

      <p className="text-sm text-stone-500 mt-1">
        {text}
      </p>

    </div>
  );
}


// IMPORTANT:
// Named export for App.jsx
// export { AdminDashboard };

// Default export is also provided for compatibility.
export default AdminDashboard;