import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

import {
  LayoutDashboard,
  Building2,
  Clock3,
  UserCog,
  DatabaseBackup,
  Users,
  Search,
  ShieldCheck,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  Settings,
  LogOut,
  ChevronDown,
  X,
  Download,
  Upload,
  MapPin,
  Mail,
  Phone,
  ArrowUpRight,
  ArrowRight,
  Activity,
  AlertCircle,
  Wallet,
  Percent,
  DollarSign,
  Menu,
  Home,
  UserCheck,
  TrendingUp,
  BarChart3,
  CircleDollarSign,
  FileCheck2,
  Ban,
} from 'lucide-react';

const COMMISSION_RATE_KEY = 'gh_admin_commission_rate';

// ============================================================
// ADMIN DASHBOARD
// ============================================================

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ----------------------------------------------------------
  // ACTIVE SIDEBAR PAGE
  // ----------------------------------------------------------

  const [activePage, setActivePage] = useState('dashboard');

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [showProfileMenu, setShowProfileMenu] =
    useState(false);

  const [showProfileModal, setShowProfileModal] =
    useState(false);

  const [rejectingGuesthouseId, setRejectingGuesthouseId] =
    useState(null);

  // ----------------------------------------------------------
  // DATA
  // ----------------------------------------------------------

  const [stats, setStats] = useState({
    totalGuesthouses: 0,
    approvedGuesthouses: 0,
    pendingGuesthouses: 0,
    rejectedGuesthouses: 0,
    totalOwners: 0,
    totalUsers: 0,

    totalRevenue: 0,
    commissionRate: 10,
    commissionRevenue: 0,
    ownerPayouts: 0,
  });

  const [pendingGuesthouses, setPendingGuesthouses] =
    useState([]);

  const [allGuesthouses, setAllGuesthouses] =
    useState([]);

  const [usersList, setUsersList] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');
  const [backupMessage, setBackupMessage] = useState('');

  // ----------------------------------------------------------
  // SEARCH
  // ----------------------------------------------------------

  const [guesthouseSearch, setGuesthouseSearch] =
    useState('');

  const [ownerSearch, setOwnerSearch] =
    useState('');

  // ----------------------------------------------------------
  // LOAD ADMIN DATA
  // ----------------------------------------------------------

  const loadAdminData = useCallback(async () => {
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
        ApiService.getAdminGuesthouses(),
        ApiService.getAllUsers(),
      ]);

      const safePending =
        Array.isArray(pending)
          ? pending
          : [];

      const safeGuesthouses =
        Array.isArray(guesthouses)
          ? guesthouses
          : [];

      const safeUsers =
        Array.isArray(users)
          ? users
          : [];

      // ------------------------------------------------------
      // OWNERS ONLY
      // ------------------------------------------------------

      const ownersOnly =
        safeUsers.filter((item) =>
          String(item?.role || '')
            .toUpperCase() === 'OWNER'
        );

      // ------------------------------------------------------
      // CALCULATE BASIC COUNTS
      // ------------------------------------------------------

      const totalGuesthouses =
        Number(
          platformStats?.totalGuesthouses
        ) ||
        safeGuesthouses.length ||
        0;

      const approvedGuesthouses =
        Number(
          platformStats?.approvedGuesthouses
        ) ||
        safeGuesthouses.filter(
          (gh) =>
            String(gh?.status || '')
              .toLowerCase() === 'approved'
        ).length ||
        0;

      const rejectedGuesthouses =
        Number(
          platformStats?.rejectedGuesthouses
        ) ||
        safeGuesthouses.filter(
          (gh) =>
            String(gh?.status || '')
              .toLowerCase() === 'rejected'
        ).length ||
        0;

      // ------------------------------------------------------
      // REVENUE / COMMISSION
      // ------------------------------------------------------

      const totalRevenue =
        Number(
          platformStats?.totalRevenue
        ) ||
        Number(
          platformStats?.grossRevenue
        ) ||
        Number(
          platformStats?.revenue
        ) ||
        0;

      const commissionRate = Number(platformStats?.commissionRate) || 10;

      const commissionRevenue =
        Number(
          platformStats?.commissionRevenue
        ) ||
        Number(
          platformStats?.platformCommission
        ) ||
        (totalRevenue * commissionRate) / 100;

      const ownerPayouts =
        Number(
          platformStats?.ownerPayouts
        ) ||
        Math.max(
          totalRevenue - commissionRevenue,
          0
        );

      setStats({
        totalGuesthouses,
        approvedGuesthouses,
        pendingGuesthouses:
          safePending.length,
        rejectedGuesthouses,
        totalOwners:
          ownersOnly.length,
        totalUsers:
          safeUsers.length,

        totalRevenue,
        commissionRate,
        commissionRevenue,
        ownerPayouts,
      });

      setPendingGuesthouses(
        safePending
      );

      setAllGuesthouses(
        safeGuesthouses
      );

      setUsersList(
        safeUsers
      );

    } catch (err) {
      console.error(
        'Admin data loading error:',
        err
      );

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
  }, []);

  // ----------------------------------------------------------
  // INITIAL LOAD
  // ----------------------------------------------------------

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // ----------------------------------------------------------
  // OWNERS
  // ----------------------------------------------------------

  const owners = useMemo(() => {
    return usersList.filter(
      (item) =>
        String(item?.role || '')
          .toUpperCase() === 'OWNER'
    );
  }, [usersList]);

  // ----------------------------------------------------------
  // FILTER OWNERS
  // ----------------------------------------------------------

  const filteredOwners = useMemo(() => {
    const query =
      ownerSearch.trim().toLowerCase();

    if (!query) {
      return owners;
    }

    return owners.filter((owner) => {
      const name =
        String(
          owner?.name ||
          owner?.fullName ||
          ''
        ).toLowerCase();

      const email =
        String(
          owner?.email || ''
        ).toLowerCase();

      const phone =
        String(
          owner?.phone || ''
        ).toLowerCase();

      return (
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query)
      );
    });
  }, [
    owners,
    ownerSearch,
  ]);

  // ----------------------------------------------------------
  // FILTER GUESTHOUSES
  // ----------------------------------------------------------

  const filteredGuesthouses =
    useMemo(() => {
      const query =
        guesthouseSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return allGuesthouses;
      }

      return allGuesthouses.filter(
        (gh) => {
          const name =
            String(
              gh?.name || ''
            ).toLowerCase();

          const city =
            String(
              gh?.city || ''
            ).toLowerCase();

          const location =
            String(
              gh?.location ||
              gh?.address ||
              ''
            ).toLowerCase();

          return (
            name.includes(query) ||
            city.includes(query) ||
            location.includes(query)
          );
        }
      );
    }, [
      allGuesthouses,
      guesthouseSearch,
    ]);

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const handlePageChange = (
    page
  ) => {
    setActivePage(page);
    setMobileSidebarOpen(false);
    setShowProfileMenu(false);
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // ==========================================================
  // APPROVE
  // ==========================================================

  const handleApproveGuesthouse =
    async (id) => {
      if (!id) return;

      try {
        setLoading(true);

        await ApiService.approveGuesthouse(
          id
        );

        await loadAdminData();

      } catch (err) {
        console.error(
          'Approve guesthouse error:',
          err
        );

        alert(
          err?.response?.data?.message ||
          err?.message ||
          'Failed to approve guesthouse.'
        );

      } finally {
        setLoading(false);
      }
    };

  // ==========================================================
  // REJECT
  // ==========================================================

  const handleRejectGuesthouse =
    async (id, reason) => {
      if (!id || !reason?.trim()) return;

      try {
        setLoading(true);

        await ApiService.rejectGuesthouse(
          id,
          reason.trim()
        );

        await loadAdminData();
        setRejectingGuesthouseId(null);
        handlePageChange('dashboard');

      } catch (err) {
        console.error(
          'Reject guesthouse error:',
          err
        );

        alert(
          err?.response?.data?.message ||
          err?.message ||
          'Failed to reject guesthouse.'
        );

      } finally {
        setLoading(false);
      }
    };

  // ==========================================================
  // DELETE GUESTHOUSE
  // ==========================================================

  const handleDeleteGuesthouse =
    async (id) => {
      if (!id) return;

      const confirmed =
        window.confirm(
          'Are you sure you want to delete this guesthouse?\n\nThis action cannot be undone.'
        );

      if (!confirmed) {
        return;
      }

      try {
        setLoading(true);

        await ApiService.deleteGuesthouse(
          id
        );

        await loadAdminData();

      } catch (err) {
        console.error(
          'Delete guesthouse error:',
          err
        );

        alert(
          err?.response?.data?.message ||
          err?.message ||
          'Failed to delete guesthouse.'
        );

      } finally {
        setLoading(false);
      }
    };

  // ==========================================================
  // DELETE OWNER
  // ==========================================================

  const handleDeleteOwner =
    async (id) => {
      if (!id) return;

      const confirmed =
        window.confirm(
          'Are you sure you want to delete this owner account?\n\nThis action cannot be undone.'
        );

      if (!confirmed) {
        return;
      }

      try {
        setLoading(true);

        await ApiService.deleteUser(
          id
        );

        await loadAdminData();

      } catch (err) {
        console.error(
          'Delete owner error:',
          err
        );

        alert(
          err?.response?.data?.message ||
          err?.message ||
          'Failed to delete owner.'
        );

      } finally {
        setLoading(false);
      }
    };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {
    const confirmed =
      window.confirm(
        'Are you sure you want to logout?'
      );

    if (!confirmed) {
      return;
    }

    ApiService.logoutUser();

    setShowProfileMenu(false);

    navigate('/login', {
      replace: true,
    });
  };

  // ==========================================================
  // BACKUP
  // ==========================================================

  const handleSystemBackup = async () => {
    try {
      setBackupMessage('');
      const backupData = await ApiService.downloadAdminBackup();

      const json =
        JSON.stringify(
          backupData,
          null,
          2
        );

      const blob =
        new Blob(
          [json],
          {
            type:
              'application/json',
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          'a'
        );

      link.href = url;

      link.download =
        `guesthouse-admin-backup-${new Date()
          .toISOString()
          .slice(0, 10)}.json`;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      URL.revokeObjectURL(
        url
      );

      setBackupMessage('Complete backup downloaded successfully. Store it securely for recovery.');
    } catch (err) {
      console.error(
        'Backup error:',
        err
      );

      setBackupMessage(err.message || 'Failed to create system backup.');
    }
  };

  const handleRestoreBackup = async (backup) => {
    if (!backup || backup.format !== 'guesthouse-platform-backup' || !backup.data) {
      setBackupMessage('Invalid backup file. Please choose a Guesthouse Platform JSON backup.');
      return;
    }

    const confirmed = window.confirm('Restore this backup? Current database data will be permanently replaced.');
    if (!confirmed) return;

    try {
      setBackupMessage('Restoring backup...');
      const result = await ApiService.restoreAdminBackup(backup);
      setBackupMessage(`Restore completed: ${result?.users || 0} users, ${result?.guesthouses || 0} guesthouses, ${result?.rooms || 0} rooms restored.`);
      await loadAdminData();
    } catch (err) {
      setBackupMessage(err.message || 'Failed to restore backup.');
    }
  };

  // ==========================================================
  // PROFILE SAVED
  // ==========================================================

  const handleProfileSaved =
    async (updatedUser) => {
      if (updatedUser) {
        ApiService.setCurrentUser(
          updatedUser
        );
      }

      setShowProfileModal(false);

      await loadAdminData();
    };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 py-6">

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="lg:hidden flex items-center justify-between bg-stone-950 text-white p-4 rounded-2xl mb-4 border border-stone-800 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-black">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs line-clamp-1">Guesthouse Platform</div>
            <div className="text-[10px] text-amber-400 uppercase tracking-wider">Administrator</div>
          </div>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-xl bg-stone-800 text-amber-400 hover:bg-stone-700"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex gap-6 items-start">
        <AdminSidebar
          activePage={activePage}
          onPageChange={handlePageChange}
          mobileOpen={mobileSidebarOpen}
          user={user}
          onLogout={handleLogout}
          pendingCount={pendingGuesthouses.length}
        />

        <main className="flex-1 min-w-0 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-black uppercase text-amber-600 tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Administration Console</span>
              </div>
              <h1 className="text-2xl font-black text-stone-900 tracking-tight">
                {getPageTitle(activePage)}
              </h1>
              <p className="text-xs text-stone-500">
                Guesthouse Reservation Platform
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
              <div className="w-9 h-9 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-black text-sm">
                {(user?.name || user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-xs font-black text-stone-900">
                  {user?.name || user?.fullName || 'Administrator'}
                </div>
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                  Admin
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
              <button type="button" onClick={() => setError('')}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {activePage === 'dashboard' && (
            <AdminDashboardHome
              stats={stats}
              loading={loading}
              onRefresh={loadAdminData}
              onNavigate={handlePageChange}
              pendingGuesthouses={pendingGuesthouses}
              guesthouses={allGuesthouses}
            />
          )}

          {activePage === 'guesthouses' && (
            <GuesthousePage
              guesthouses={filteredGuesthouses}
              search={guesthouseSearch}
              setSearch={setGuesthouseSearch}
              loading={loading}
              onApprove={handleApproveGuesthouse}
              onDelete={handleDeleteGuesthouse}
            />
          )}

          {activePage === 'pending' && (
            <PendingPage
              pendingGuesthouses={pendingGuesthouses}
              loading={loading}
              onApprove={handleApproveGuesthouse}
              onReject={(id) => setRejectingGuesthouseId(id)}
            />
          )}

          {activePage === 'owners' && (
            <OwnersPage
              owners={filteredOwners}
              totalOwners={owners.length}
              search={ownerSearch}
              setSearch={setOwnerSearch}
              loading={loading}
              onDelete={handleDeleteOwner}
            />
          )}

          {activePage === 'commission' && (
            <CommissionPage
              stats={stats}
              loading={loading}
              onRefresh={loadAdminData}
              onRateChange={(commissionRate) => {
                localStorage.setItem(COMMISSION_RATE_KEY, String(commissionRate));
                setStats((previous) => ({
                  ...previous,
                  commissionRate,
                  commissionRevenue: (previous.totalRevenue * commissionRate) / 100,
                  ownerPayouts: Math.max(previous.totalRevenue - (previous.totalRevenue * commissionRate) / 100, 0),
                }));
              }}
            />
          )}

          {activePage === 'backup' && (
            <BackupPage
              onBackup={handleSystemBackup}
              onRestore={handleRestoreBackup}
              backupMessage={backupMessage}
              loading={loading}
              guesthousesCount={allGuesthouses.length}
              ownersCount={owners.length}
              usersCount={usersList.length}
            />
          )}
        </main>
      </div>

      {showProfileModal && (
        <UpdateProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onSaved={handleProfileSaved}
        />
      )}

      {rejectingGuesthouseId && (
        <RejectionReasonModal
          loading={loading}
          onClose={() => setRejectingGuesthouseId(null)}
          onSubmit={(reason) => handleRejectGuesthouse(rejectingGuesthouseId, reason)}
        />
      )}
    </div>
  );
}


// ============================================================
// REJECTION REASON MODAL
// ============================================================

function RejectionReasonModal({
  loading,
  onClose,
  onSubmit,
}) {
  const [reason, setReason] =
    useState('');
  const [validationError, setValidationError] =
    useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!reason.trim()) {
      setValidationError(
        'Please provide a reason for rejecting this application.'
      );
      return;
    }

    onSubmit(reason);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#043658]/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-guesthouse-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 sm:px-7">
          <div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <Ban className="h-5 w-5" />
            </div>
            <h2
              id="reject-guesthouse-title"
              className="text-xl font-black text-[#073957]"
            >
              Reject guesthouse application
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add a clear reason that the owner can act on.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close rejection dialog"
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-[#073957] disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6 sm:px-7">
          <div>
            <label
              htmlFor="rejection-reason"
              className="mb-2 block text-sm font-black text-[#073957]"
            >
              Rejection reason
            </label>
            <textarea
              id="rejection-reason"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (validationError) setValidationError('');
              }}
              autoFocus
              rows={5}
              maxLength={500}
              placeholder="Explain what needs to be corrected before approval..."
              className="w-full resize-y rounded-2xl border border-slate-300 px-4 py-3 text-sm text-[#073957] outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
            />
            <div className="mt-2 flex items-start justify-between gap-4 text-xs">
              <span className="text-red-600" role="alert">
                {validationError}
              </span>
              <span className="shrink-0 text-slate-400">
                {reason.length}/500
              </span>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-[#073957] transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" />
              {loading ? 'Rejecting...' : 'Reject application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ============================================================
// PAGE TITLE
// ============================================================

function getPageTitle(page) {
  const titles = {
    dashboard:
      'Administration Dashboard',

    guesthouses:
      'Guesthouse Management',

    pending:
      'Pending Verification',

    owners:
      'Manage Owners',

    commission:
      'Commission Management',

    backup:
      'System Backup',
  };

  return (
    titles[page] ||
    'Administration'
  );
}


// ============================================================
// ADMIN SIDEBAR
// ============================================================

function AdminSidebar({
  activePage,
  onPageChange,
  mobileOpen,
  user,
  onLogout,
  pendingCount,
}) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'guesthouses', label: 'Guesthouses', icon: Building2 },
    { id: 'pending', label: 'Pending Verification', icon: Clock3 },
    { id: 'owners', label: 'Manage Owners', icon: UserCog },
    { id: 'commission', label: 'Commission', icon: Percent },
    { id: 'backup', label: 'System Backup', icon: DatabaseBackup },
  ];

  return (
    <aside
      className={`${
        mobileOpen ? 'block fixed inset-y-0 left-0 z-50 w-72 p-4 bg-stone-950 shadow-2xl' : 'hidden'
      } lg:block lg:sticky lg:top-20 shrink-0 w-72 bg-stone-950 text-stone-200 rounded-3xl border border-stone-800/80 shadow-2xl p-5 space-y-6 transition-all`}
    >
      <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-2xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Administration</span>
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Active
          </span>
        </div>
        <h2 className="text-sm font-black text-white line-clamp-1">Guesthouse Platform</h2>
        <div className="text-[11px] text-stone-400 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Platform control center</span>
        </div>
      </div>

      <nav className="space-y-1.5 text-xs font-bold">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
                active
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black shadow-lg shadow-amber-500/20'
                  : 'text-stone-300 hover:bg-stone-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.id === 'pending' && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${active ? 'bg-stone-950 text-white' : 'bg-stone-800 text-amber-400'}`}>
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-sm">
            {(user?.name || user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-black text-white truncate">{user?.name || user?.fullName || 'Administrator'}</div>
            <div className="text-[10px] text-stone-400 uppercase tracking-wider truncate">Admin</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="p-2 rounded-xl bg-stone-900 text-stone-300 hover:bg-red-500/10 hover:text-red-300 transition"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}


// ============================================================
// ADMIN DASHBOARD HOME
// ============================================================

function MetricSparkBar({ color, values, idPrefix }) {
  const width = 160;
  const height = 48;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / (max - min || 1)) * (height - 12) - 6;
    return [x, y];
  });

  const linePath = points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`)
    .join(' ');

  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;
  const gradientId = `spark-${idPrefix}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-12 w-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width={width} height={height} rx="12" fill="rgba(255,255,255,0.02)" />
      <path d={areaPath} fill={`url(#${gradientId})`} opacity="1" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />

      {points.map(([x, y], index) => (
        <circle
          key={`${idPrefix}-${index}`}
          cx={x}
          cy={y}
          r="2.3"
          fill="#ffffff"
          stroke={color}
          strokeWidth="1.4"
        />
      ))}
    </svg>
  );
}

function AdminDashboardHome({
  stats,
  loading,
  onRefresh,
  onNavigate,
  pendingGuesthouses,
  guesthouses,
}) {
  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Total Guesthouses',
            value: stats.totalGuesthouses,
            detail: `${stats.approvedGuesthouses} approved`,
            icon: Building2,
            page: 'guesthouses',
            cardClass: 'bg-[#073957] text-white',
            valueClass: 'text-amber-300',
            iconClass: 'text-amber-300',
            color: '#fbbf24',
            spark: [18, 22, 20, 30, 46, 58, 52],
            chartId: 'total-guesthouses',
            trend: '+12.4%',
            trendLabel: 'vs last week',
          },
          {
            label: 'Owner Accounts',
            value: stats.totalOwners,
            detail: 'active owners',
            icon: Users,
            page: 'owners',
            cardClass: 'bg-[#073957] text-white',
            valueClass: 'text-sky-200',
            iconClass: 'text-sky-200',
            color: '#38bdf8',
            spark: [14, 18, 26, 22, 36, 42, 48],
            chartId: 'owner-accounts',
            trend: '+8.1%',
            trendLabel: 'new signups',
          },
          {
            label: 'Pending Verification',
            value: stats.pendingGuesthouses,
            detail: 'awaiting approval',
            icon: Clock3,
            page: 'pending',
            cardClass: 'bg-[#073957] text-white',
            valueClass: 'text-amber-300',
            iconClass: 'text-amber-300',
            color: '#f59e0b',
            spark: [10, 12, 16, 18, 24, 22, 30],
            chartId: 'pending-verification',
            trend: '-3.2%',
            trendLabel: 'this week',
          },
          {
            label: 'Platform Commission',
            value: `${stats.commissionRate}%`,
            detail: 'current rate',
            icon: Percent,
            page: 'commission',
            cardClass: 'bg-[#073957] text-white',
            valueClass: 'text-emerald-200',
            iconClass: 'text-emerald-200',
            color: '#34d399',
            spark: [8, 14, 18, 26, 28, 34, 42],
            chartId: 'platform-commission',
            trend: '+5.8%',
            trendLabel: 'earnings',
          },
        ].map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className="space-y-3">
              <button
                type="button"
                onClick={() => onNavigate(card.page)}
                className={`w-full min-h-[128px] rounded-2xl border border-white/15 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${card.cardClass}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] opacity-85">{card.label}</span>
                  <Icon className={`h-5 w-5 shrink-0 ${card.iconClass}`} />
                </div>
                <div className={`mt-3 text-3xl font-black leading-none ${card.valueClass}`}>{card.value}</div>
                <p className="mt-2 text-[11px] font-semibold opacity-75">{card.detail}</p>
              </button>

              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                  <span>{card.label}</span>
                  <span className={card.trend.startsWith('-') ? 'text-red-500' : 'text-emerald-500'}>{card.trend}</span>
                </div>
                <MetricSparkBar color={card.color} values={card.spark} idPrefix={card.chartId} />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}


// ============================================================
// STAT CARD
// ============================================================

function AdminStatCard({
  title,
  value,
  icon,
  description,
  warning,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-white rounded-3xl border border-slate-200 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >

      <div className="flex items-start justify-between">

        <div
          className={`
            w-12 h-12 rounded-2xl
            flex items-center justify-center
            ${
              warning
                ? 'bg-amber-100 text-amber-700'
                : 'bg-sky-50 text-[#073957]'
            }
          `}
        >
          {icon}
        </div>

        <ArrowUpRight className="w-4 h-4 text-slate-300" />

      </div>

      <div className="mt-5">

        <div className="text-xs font-black uppercase tracking-wider text-slate-400">
          {title}
        </div>

        <div className="mt-2 text-2xl sm:text-3xl font-black text-[#073957]">
          {value}
        </div>

        <div className="mt-2 text-xs text-slate-500">
          {description}
        </div>

      </div>

    </button>
  );
}


// ============================================================
// MINI DASHBOARD CARD
// ============================================================

function DashboardMiniCard({
  title,
  value,
  icon,
  type,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div
            className={`
              w-10 h-10 rounded-xl
              flex items-center justify-center
              ${
                type === 'success'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-slate-100 text-[#073957]'
              }
            `}
          >
            {icon}
          </div>

          <div>

            <div className="text-xs font-black uppercase tracking-wider text-slate-400">
              {title}
            </div>

            <div className="text-xl font-black text-[#073957] mt-1">
              {value}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// ACTIVITY ROW
// ============================================================

function ActivityRow({
  icon,
  title,
  value,
  text,
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-xl hover:bg-slate-50">

      <div className="flex items-center gap-3">

        <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#073957] flex items-center justify-center">
          {icon}
        </div>

        <div>

          <div className="text-sm font-black text-[#073957]">
            {title}
          </div>

          <div className="text-xs text-slate-500">
            {text}
          </div>

        </div>

      </div>

      <div className="font-black text-[#073957]">
        {value}
      </div>

    </div>
  );
}


// ============================================================
// QUICK ACTION
// ============================================================

function QuickAction({
  icon,
  title,
  text,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-300 hover:shadow-md transition"
    >

      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
        {icon}
      </div>

      <div className="mt-4 font-black text-[#073957]">
        {title}
      </div>

      <p className="text-xs text-slate-500 mt-1 leading-5">
        {text}
      </p>

    </button>
  );
}


// ============================================================
// GUESTHOUSE PAGE
// ============================================================

function GuesthousePage({
  guesthouses,
  search,
  setSearch,
  loading,
  onApprove,
  onDelete,
}) {
  return (
    <div className="space-y-5">

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div className="relative w-full lg:max-w-lg">

            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search guesthouse, city or location..."
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />

          </div>

          <div className="px-4 py-2 rounded-xl bg-slate-100 text-[#073957] text-sm font-black">
            {guesthouses.length} shown
          </div>

        </div>

        {guesthouses.length ===
        0 ? (
          <EmptyState
            title="No guesthouses found"
            text="There are no guesthouses matching your search."
          />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-slate-50">

                <tr>

                  <TableHeader>
                    Guesthouse
                  </TableHeader>

                  <TableHeader>
                    Location
                  </TableHeader>

                  <TableHeader>
                    Rating
                  </TableHeader>

                  <TableHeader>
                    Status
                  </TableHeader>

                  <TableHeader align="right">
                    Actions
                  </TableHeader>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {guesthouses.map(
                  (gh) => (
                    <tr
                      key={gh.id}
                      className="hover:bg-slate-50"
                    >

                      <td className="px-5 py-5">

                        <div className="font-black text-[#073957]">
                          {gh.name ||
                            'Unnamed Guesthouse'}
                        </div>

                        <div className="text-xs text-slate-400 mt-1">
                          ID: {gh.id}
                        </div>

                      </td>

                      <td className="px-5 py-5">

                        <div className="flex items-center gap-2 text-sm text-slate-600">

                          <MapPin className="w-4 h-4 text-slate-400" />

                          {gh.city ||
                            gh.location ||
                            gh.address ||
                            'N/A'}

                        </div>

                      </td>

                      <td className="px-5 py-5 text-sm">

                        <span className="font-black text-[#073957]">
                          {Number(
                            gh.rating ||
                            0
                          ).toFixed(1)}
                        </span>

                        <span className="ml-1">
                          ★
                        </span>

                      </td>

                      <td className="px-5 py-5">

                        <StatusBadge
                          status={
                            gh.status ||
                            'unknown'
                          }
                        />

                      </td>

                      <td className="px-5 py-5">

                        <div className="flex justify-end gap-2">

                          {[
                            'pending',
                            'draft',
                          ].includes(
                            String(
                              gh.status ||
                              ''
                            ).toLowerCase()
                          ) && (
                            <button
                              type="button"
                              onClick={() =>
                                onApprove(
                                  gh.id
                                )
                              }
                              disabled={
                                loading
                              }
                              className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold disabled:opacity-50"
                            >
                              Approve
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              onDelete(
                                gh.id
                              )
                            }
                            disabled={
                              loading
                            }
                            className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}


// ============================================================
// PENDING PAGE
// ============================================================

function PendingPage({
  pendingGuesthouses,
  loading,
  onApprove,
  onReject,
}) {
  const [expandedId, setExpandedId] =
    useState(null);

  const fileUrl = (value) => {
    if (!value) return '';

    if (
      /^https?:\/\//i.test(
        value
      )
    ) {
      return value;
    }

    return `http://localhost:5000${
      value.startsWith('/')
        ? value
        : `/${value}`
    }`;
  };

  return (
    <div className="space-y-5">

      {pendingGuesthouses.length ===
      0 ? (
        <div className="bg-white rounded-3xl border border-slate-200">
          <EmptyState
            title="No pending guesthouses"
            text="All guesthouses have been reviewed."
          />
        </div>
      ) : (
        <div className="space-y-4">

          {pendingGuesthouses.map(
            (gh) => (
              <div
                key={gh.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm"
              >

                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">

                  <div className="flex-1 min-w-0">

                    <div className="flex items-center gap-3">

                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Building2 className="w-6 h-6" />
                      </div>

                      <div className="min-w-0">

                        <h3 className="font-black text-[#073957] truncate">
                          {gh.name ||
                            'Unnamed Guesthouse'}
                        </h3>

                        <p className="text-sm text-slate-500 mt-1">
                          {gh.city ||
                            'Unknown city'}
                          {' • '}
                          {gh.location ||
                            gh.address ||
                            'No location'}
                        </p>

                      </div>

                    </div>

                    {gh.description && (
                      <p className="text-sm text-slate-600 mt-4 leading-6">
                        {gh.description}
                      </p>
                    )}

                    <div className="text-xs text-slate-400 mt-3">
                      Application ID: {gh.id}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(
                          expandedId ===
                            gh.id
                            ? null
                            : gh.id
                        )
                      }
                      className="mt-4 text-xs font-black text-[#073957] hover:text-amber-600"
                    >
                      {expandedId ===
                      gh.id
                        ? 'Hide full application'
                        : 'View full application'}
                    </button>

                    {expandedId ===
                      gh.id && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl bg-slate-50 border border-slate-200 p-5 text-xs text-slate-700">

                        <div className="space-y-2">

                          <h4 className="font-black text-[#073957]">
                            Owner information
                          </h4>

                          <p>
                            <strong>Name:</strong>{' '}
                            {gh.owner?.name ||
                              'Not provided'}
                          </p>

                          <p>
                            <strong>Email:</strong>{' '}
                            {gh.owner?.email ||
                              'Not provided'}
                          </p>

                          <p>
                            <strong>Phone:</strong>{' '}
                            {gh.owner?.phone ||
                              'Not provided'}
                          </p>

                          <p>
                            <strong>Owner ID:</strong>{' '}
                            {gh.owner?.id ||
                              gh.ownerId ||
                              'Not provided'}
                          </p>

                          <p>
                            <strong>Role:</strong>{' '}
                            {gh.owner?.role ||
                              'OWNER'}
                          </p>

                          <p>
                            <strong>Address:</strong>{' '}
                            {gh.owner?.residentialAddress ||
                              'Not provided'}
                          </p>

                        </div>

                        <div className="space-y-2">

                          <h4 className="font-black text-[#073957]">
                            Guesthouse information
                          </h4>

                          <p>
                            <strong>Address:</strong>{' '}
                            {gh.address ||
                              'Not provided'}
                          </p>

                          <p>
                            <strong>Sub-city:</strong>{' '}
                            {gh.subCity ||
                              'Not provided'}
                          </p>

                          <p>
                            <strong>Woreda:</strong>{' '}
                            {gh.woreda ||
                              'Not provided'}
                          </p>

                          <p>
                            <strong>Phone:</strong>{' '}
                            {gh.phone ||
                              'Not provided'}
                          </p>

                          <p>
                            <strong>Email:</strong>{' '}
                            {gh.email ||
                              'Not provided'}
                          </p>

                          <p>
                            <strong>Rooms:</strong>{' '}
                            {gh.numberOfRooms ||
                              gh.rooms?.length ||
                              'Not provided'}
                          </p>

                          <p>
                            <strong>License:</strong>{' '}
                            {gh.licenseNumber ||
                              'Not provided'}
                          </p>

                        </div>

                        <div className="space-y-2">

                          <h4 className="font-black text-[#073957]">
                            License document
                          </h4>

                          {gh.licenseDocument ? (
                            <a
                              href={fileUrl(
                                gh.licenseDocument
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="text-amber-700 font-bold hover:underline"
                            >
                              Open license document
                            </a>
                          ) : (
                            <p className="text-slate-500">
                              No license document
                            </p>
                          )}

                        </div>

                        <div className="space-y-2 md:col-span-2">

                          <h4 className="font-black text-[#073957]">
                            Rooms
                          </h4>

                          {gh.rooms?.length ? (
                            <div className="overflow-x-auto">

                              <table className="w-full text-left">

                                <thead>

                                  <tr className="border-b border-slate-200">

                                    <th className="py-2 pr-3">
                                      Room
                                    </th>

                                    <th className="py-2 pr-3">
                                      Type
                                    </th>

                                    <th className="py-2 pr-3">
                                      Capacity
                                    </th>

                                    <th className="py-2">
                                      Price
                                    </th>

                                  </tr>

                                </thead>

                                <tbody>

                                  {gh.rooms.map(
                                    (room) => (
                                      <tr
                                        key={
                                          room.id
                                        }
                                        className="border-b border-slate-100"
                                      >

                                        <td className="py-2 pr-3">
                                          {room.roomNumber}
                                        </td>

                                        <td className="py-2 pr-3">
                                          {room.type}
                                        </td>

                                        <td className="py-2 pr-3">
                                          {room.capacity}
                                        </td>

                                        <td className="py-2">
                                          {Number(
                                            room.pricePerNight ||
                                            0
                                          ).toLocaleString()}{' '}
                                          ETB
                                        </td>

                                      </tr>
                                    )
                                  )}

                                </tbody>

                              </table>

                            </div>
                          ) : (
                            <p className="text-slate-500">
                              No rooms submitted
                            </p>
                          )}

                        </div>

                        <div className="space-y-2 md:col-span-2">

                          <h4 className="font-black text-[#073957]">
                            Guesthouse photos
                          </h4>

                          {gh.image ||
                          gh.photos?.length ||
                          gh.images?.length ? (
                            <div className="flex flex-wrap gap-3">

                              {Array.from(
                                new Set([
                                  gh.image,
                                  ...(gh.photos || []),
                                  ...(gh.images || []),
                                ].filter(Boolean))
                              ).map(
                                (
                                  photo,
                                  index
                                ) => (
                                  <a
                                    key={`${photo}-${index}`}
                                    href={fileUrl(
                                      photo
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <img
                                      src={fileUrl(
                                        photo
                                      )}
                                      alt={`Guesthouse photo ${
                                        index +
                                        1
                                      }`}
                                      className="w-28 h-20 object-cover rounded-xl border border-slate-200"
                                    />
                                  </a>
                                )
                              )}

                            </div>
                          ) : (
                            <p className="text-slate-500">
                              No photos submitted
                            </p>
                          )}

                        </div>

                      </div>
                    )}

                  </div>

                  <div className="flex gap-2 shrink-0">

                    <button
                      type="button"
                      onClick={() =>
                        onReject(
                          gh.id
                        )
                      }
                      disabled={loading}
                      className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-2 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onApprove(
                          gh.id
                        )
                      }
                      disabled={loading}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>

                  </div>

                </div>

              </div>
            )
          )}

        </div>
      )}

    </div>
  );
}


// ============================================================
// OWNERS PAGE
// ============================================================

function OwnersPage({
  owners,
  totalOwners,
  search,
  setSearch,
  loading,
  onDelete,
}) {
  return (
    <div className="space-y-5">

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">

        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div className="relative w-full lg:max-w-lg">

            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search owner name, email or phone..."
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-amber-400"
            />

          </div>

          <div className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 text-sm font-black">
            {totalOwners} Owners
          </div>

        </div>

        {owners.length ===
        0 ? (
          <EmptyState
            title="No owners found"
            text="There are no owner accounts matching your search."
          />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-slate-50">

                <tr>

                  <TableHeader>
                    Owner
                  </TableHeader>

                  <TableHeader>
                    Email
                  </TableHeader>

                  <TableHeader>
                    Phone
                  </TableHeader>

                  <TableHeader>
                    Role
                  </TableHeader>

                  <TableHeader align="right">
                    Actions
                  </TableHeader>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {owners.map(
                  (owner) => (
                    <tr
                      key={owner.id}
                      className="hover:bg-slate-50"
                    >

                      <td className="px-5 py-5">

                        <div className="flex items-center gap-3">

                          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                            {(
                              owner?.name ||
                              owner?.fullName ||
                              'O'
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>

                            <div className="font-black text-[#073957]">
                              {owner?.name ||
                                owner?.fullName ||
                                'N/A'}
                            </div>

                            <div className="text-xs text-slate-400">
                              ID: {owner.id}
                            </div>

                          </div>

                        </div>

                      </td>

                      <td className="px-5 py-5 text-sm text-slate-600">

                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          {owner.email ||
                            'N/A'}
                        </div>

                      </td>

                      <td className="px-5 py-5 text-sm text-slate-600">

                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400" />
                          {owner.phone ||
                            'N/A'}
                        </div>

                      </td>

                      <td className="px-5 py-5">

                        <span className="px-3 py-1.5 rounded-full bg-sky-50 text-[#073957] text-[9px] font-black">
                          OWNER
                        </span>

                      </td>

                      <td className="px-5 py-5">

                        <div className="flex justify-end">

                          <button
                            type="button"
                            onClick={() =>
                              onDelete(
                                owner.id
                              )
                            }
                            disabled={
                              loading
                            }
                            className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}


// ============================================================
// COMMISSION PAGE
// ============================================================

function CommissionPage({
  stats,
  loading,
  onRefresh,
  onRateChange,
}) {
  const [rateInput, setRateInput] = useState(String(stats.commissionRate));
  const [rateError, setRateError] = useState('');

  useEffect(() => {
    setRateInput(String(stats.commissionRate));
  }, [stats.commissionRate]);

  const handleRateSubmit = (event) => {
    event.preventDefault();
    const nextRate = Number(rateInput);
    if (!Number.isFinite(nextRate) || nextRate < 0 || nextRate > 100) {
      setRateError('Enter a commission rate between 0 and 100%.');
      return;
    }
    setRateError('');
    onRateChange(nextRate);
  };

  return (
    <div className="space-y-6">

      {/* ====================================================
          COMMISSION HERO
      ==================================================== */}

      <div className="rounded-3xl bg-[#073957] text-white p-6 sm:p-8">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>

            <div className="text-xs uppercase tracking-[0.2em] font-black text-amber-300">
              Platform Earnings
            </div>

            <div className="mt-3 text-3xl sm:text-4xl font-black">
              {formatMoney(
                stats.commissionRevenue
              )}{' '}
              ETB
            </div>

            <p className="mt-2 text-sm text-slate-300">
              Estimated platform commission generated
              from reservation revenue.
            </p>

          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-amber-400 text-[#073957] font-black text-sm disabled:opacity-50"
          >
            <RefreshCw
              className={`inline w-4 h-4 mr-2 ${
                loading
                  ? 'animate-spin'
                  : ''
              }`}
            />
            Refresh
          </button>

        </div>

      </div>

      {/* ====================================================
          COMMISSION CARDS
      ==================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        <CommissionStat
          title="Commission Rate"
          value={`${stats.commissionRate}%`}
          icon={
            <Percent className="w-6 h-6" />
          }
          description="Admin-controlled platform rate"
          tone="amber"
        />

        <CommissionStat
          title="Gross Revenue"
          value={`${formatMoney(
            stats.totalRevenue
          )} ETB`}
          icon={
            <CircleDollarSign className="w-6 h-6" />
          }
          description="Total reservation revenue"
          tone="blue"
        />

        <CommissionStat
          title="Owner Payouts"
          value={`${formatMoney(
            stats.ownerPayouts
          )} ETB`}
          icon={
            <Wallet className="w-6 h-6" />
          }
          description="Revenue after commission"
          tone="emerald"
        />

      </div>

      <div className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-black text-[#073957]">Control Commission Rate</h3>
            <p className="mt-1 text-sm text-slate-500">Set the percentage deducted from successful reservation revenue.</p>
          </div>
          <form onSubmit={handleRateSubmit} className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-black uppercase tracking-wide text-slate-600">
              Rate (%)
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={rateInput}
                onChange={(event) => setRateInput(event.target.value)}
                className="mt-1 block w-28 rounded-xl border border-amber-300 bg-white px-3 py-2.5 text-sm font-bold text-[#073957] outline-none focus:ring-2 focus:ring-amber-400"
              />
            </label>
            <button type="submit" className="rounded-xl bg-[#073957] px-4 py-2.5 text-sm font-black text-white hover:bg-[#0b4b73]">
              Save Rate
            </button>
          </form>
        </div>
        {rateError && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{rateError}</p>}
      </div>

      {/* ====================================================
          COMMISSION CALCULATION
      ==================================================== */}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">

        <div className="flex items-start gap-4">

          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>

          <div>

            <h3 className="font-black text-[#073957]">
              Commission Calculation
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Current platform commission calculation.
            </p>

          </div>

        </div>

        <div className="mt-6 overflow-x-auto">

          <table className="w-full">

            <tbody>

              <CommissionRow
                label="Gross reservation revenue"
                value={`${formatMoney(
                  stats.totalRevenue
                )} ETB`}
              />

              <CommissionRow
                label="Platform commission rate"
                value={`${stats.commissionRate}%`}
              />

              <CommissionRow
                label="Platform commission"
                value={`${formatMoney(
                  stats.commissionRevenue
                )} ETB`}
                highlight
              />

              <CommissionRow
                label="Owner payout"
                value={`${formatMoney(
                  stats.ownerPayouts
                )} ETB`}
              />

            </tbody>

          </table>

        </div>

      </div>

      {/* ====================================================
          IMPORTANT NOTE
      ==================================================== */}

      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">

        <div className="flex gap-3">

          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />

          <div>

            <div className="font-black text-amber-800">
              Commission data source
            </div>

            <p className="text-sm text-amber-700 mt-1 leading-6">
              This page reads commission and revenue
              values returned by the admin platform statistics
              API. The backend should calculate commission from
              successful PAID reservations/payments.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// COMMISSION STAT
// ============================================================

function CommissionStat({
  title,
  value,
  icon,
  description,
  tone = 'blue',
}) {
  const tones = {
    amber: {
      card: 'bg-[#073957] border-[#0b5277] text-white',
      icon: 'bg-amber-200/70 text-amber-700',
    },
    blue: {
      card: 'bg-[#073957] border-[#0b5277] text-white',
      icon: 'bg-sky-200/70 text-sky-700',
    },
    emerald: {
      card: 'bg-[#073957] border-[#0b5277] text-white',
      icon: 'bg-emerald-200/70 text-emerald-700',
    },
  };
  const selectedTone = tones[tone] || tones.blue;

  return (
    <div className={`rounded-3xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${selectedTone.card}`}>

      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedTone.icon}`}>
        {icon}
      </div>

      <div className="mt-5 text-xs font-black uppercase tracking-wider text-white">
        {title}
      </div>

      <div className="mt-2 text-2xl font-black text-amber-300">
        {value}
      </div>

      <div className="mt-2 text-xs text-white">
        {description}
      </div>

    </div>
  );
}


// ============================================================
// COMMISSION ROW
// ============================================================

function CommissionRow({
  label,
  value,
  highlight,
}) {
  return (
    <tr className="border-b border-slate-100">

      <td className="py-4 text-sm text-slate-600">
        {label}
      </td>

      <td
        className={`
          py-4 text-right font-black
          ${
            highlight
              ? 'text-amber-600'
              : 'text-[#073957]'
          }
        `}
      >
        {value}
      </td>

    </tr>
  );
}


// ============================================================
// BACKUP PAGE
// ============================================================

function BackupPage({
  onBackup,
  onRestore,
  backupMessage,
  loading,
  guesthousesCount,
  ownersCount,
  usersCount,
}) {
  return (
    <div className="space-y-5">

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <BackupStat
          label="Guesthouses"
          value={
            guesthousesCount
          }
          icon={Building2}
          className="bg-[#073957] border-[#0b5277] text-white"
          iconClassName="bg-blue-600 text-white"
        />

        <BackupStat
          label="Owners"
          value={
            ownersCount
          }
          icon={UserCog}
          className="bg-[#073957] border-[#0b5277] text-white"
          iconClassName="bg-amber-500 text-white"
        />

        <BackupStat
          label="Users"
          value={
            usersCount
          }
          icon={Users}
          className="bg-[#073957] border-[#0b5277] text-white"
          iconClassName="bg-emerald-600 text-white"
        />

      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-[#073957] flex items-center justify-center">
                <DatabaseBackup className="w-5 h-5" />
              </div>

              <h3 className="font-black text-[#073957]">
                Export platform data
              </h3>

            </div>

            <p className="text-sm text-slate-500 mt-3 max-w-2xl leading-6">
              Download guesthouses, pending applications,
              owner accounts, users and platform statistics
              as a JSON administration backup.
            </p>

          </div>

          <button
            type="button"
            onClick={onBackup}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#073957] hover:bg-[#052c45] text-white text-sm font-black disabled:opacity-50 shrink-0"
          >

            <Download className="w-4 h-4" />

            Download Backup

          </button>

        </div>

        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-black text-[#073957]">Restore from backup</h3>
              <p className="mt-1 text-sm text-slate-500">Upload a complete JSON backup to recover the platform after data loss.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 hover:bg-red-100">
              <Upload className="h-4 w-4" />
              Upload Backup
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (!file) return;
                  try {
                    const backup = JSON.parse(await file.text());
                    await onRestore(backup);
                  } catch {
                    onRestore(null);
                  }
                }}
              />
            </label>
          </div>
          {backupMessage && <p role="status" className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{backupMessage}</p>}
          <p className="mt-3 text-xs font-semibold text-red-600">Restore replaces current database records. Keep multiple backup copies in a secure location.</p>
        </div>

      </div>

    </div>
  );
}


// ============================================================
// BACKUP STAT
// ============================================================

function BackupStat({
  label,
  value,
  icon: Icon,
  className,
  iconClassName,
}) {
  return (
    <div className={`group min-w-0 rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${className}`}>

      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0 text-xs font-black uppercase tracking-wider opacity-70">
          {label}
        </div>

        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition group-hover:scale-105 ${iconClassName}`}>
          <Icon className="h-5 w-5" />
        </div>

      </div>

      <div className="mt-5 text-4xl font-black leading-none">
        {value}
      </div>

    </div>
  );
}


// ============================================================
// PAGE HEADER
// ============================================================

function PageHeader({
  icon,
  title,
  subtitle,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

      <div className="flex items-start gap-3">

        <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          {icon}
        </div>

        <div>

          <h2 className="text-2xl font-black text-[#073957]">
            {title}
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            {subtitle}
          </p>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// TABLE HEADER
// ============================================================

function TableHeader({
  children,
  align = 'left',
}) {
  return (
    <th
      className={`px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-${align}`}
    >
      {children}
    </th>
  );
}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  status,
}) {
  const normalized =
    String(status)
      .toLowerCase();

  let classes =
    'bg-slate-100 text-slate-600';

  if (
    normalized ===
    'approved'
  ) {
    classes =
      'bg-emerald-100 text-emerald-700';
  }

  if (
    normalized ===
    'rejected'
  ) {
    classes =
      'bg-red-100 text-red-700';
  }

  if (
    normalized ===
    'pending'
  ) {
    classes =
      'bg-amber-100 text-amber-700';
  }

  return (
    <span
      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${classes}`}
    >
      {status}
    </span>
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

      <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
        <ShieldCheck className="w-7 h-7 text-slate-400" />
      </div>

      <h3 className="font-black text-[#073957] mt-4">
        {title}
      </h3>

      <p className="text-sm text-slate-500 mt-1">
        {text}
      </p>

    </div>
  );
}


// ============================================================
// UPDATE PROFILE MODAL
// ============================================================

function UpdateProfileModal({
  user,
  onClose,
  onSaved,
}) {
  const [name, setName] =
    useState(
      user?.name ||
      user?.fullName ||
      ''
    );

  const [email, setEmail] =
    useState(
      user?.email || ''
    );

  const [phone, setPhone] =
    useState(
      user?.phone || ''
    );

  const [password, setPassword] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      try {
        setSaving(true);
        setError('');

        const updatedUser =
          await ApiService.updateProfile({
            name,
            email,
            phone,
            password,
          });

        await onSaved(
          updatedUser
        );

      } catch (err) {
        console.error(
          'Update profile error:',
          err
        );

        setError(
          err?.response?.data?.message ||
          err?.message ||
          'Failed to update profile.'
        );

      } finally {
        setSaving(false);
      }
    };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div className="my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">

          <div>

            <h2 className="text-lg font-black text-[#073957]">
              Update Profile
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Update your administrator account.
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>

        </div>

        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto p-6"
        >

          <div className="space-y-4">

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          <ProfileInput
            label="Full Name"
            value={name}
            onChange={setName}
            required
          />

          <ProfileInput
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            required
          />

          <ProfileInput
            label="Phone"
            type="tel"
            value={phone}
            onChange={setPhone}
          />

          <ProfileInput
            label="New Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Leave empty to keep current password"
          />

            <div className="flex gap-3 pt-3">

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-xl bg-[#073957] hover:bg-[#052c45] text-white text-sm font-bold"
            >
              {saving
                ? 'Saving...'
                : 'Save Changes'}
            </button>

            </div>

          </div>

        </form>

      </div>

    </div>
  );
}


// ============================================================
// PROFILE INPUT
// ============================================================

function ProfileInput({
  label,
  type = 'text',
  value,
  onChange,
  required = false,
  placeholder = '',
}) {
  return (
    <div>

      <label className="block text-xs font-bold text-slate-600 mb-1.5">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        required={required}
        placeholder={
          placeholder
        }
        autoComplete={
          type === 'password'
            ? 'new-password'
            : undefined
        }
        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
      />

    </div>
  );
}


// ============================================================
// MONEY FORMAT
// ============================================================

function formatMoney(
  value
) {
  return Number(
    value || 0
  ).toLocaleString(
    'en-US',
    {
      maximumFractionDigits: 2,
    }
  );
}