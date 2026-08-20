import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  Activity,
  AlertCircle,
} from 'lucide-react';


// ============================================================
// ADMIN DASHBOARD
// ============================================================

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ==========================================================
  // SECTION REFS
  // ==========================================================

  const dashboardRef = useRef(null);
  const guesthousesRef = useRef(null);
  const pendingRef = useRef(null);
  const ownersRef = useRef(null);
  const backupRef = useRef(null);

  // ==========================================================
  // STATE
  // ==========================================================

  const [activeSection, setActiveSection] = useState('dashboard');

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [stats, setStats] = useState({
    totalGuesthouses: 0,
    approvedGuesthouses: 0,
    pendingGuesthouses: 0,
    totalOwners: 0,
  });

  const [pendingGuesthouses, setPendingGuesthouses] = useState([]);
  const [allGuesthouses, setAllGuesthouses] = useState([]);
  const [usersList, setUsersList] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [guesthouseSearch, setGuesthouseSearch] = useState('');

  // ==========================================================
  // SCROLL TO SECTION
  // ==========================================================

  const scrollToSection = useCallback((section) => {
    setActiveSection(section);

    const refs = {
      dashboard: dashboardRef,
      guesthouses: guesthousesRef,
      pending: pendingRef,
      owners: ownersRef,
      backup: backupRef,
    };

    const targetRef = refs[section];

    if (!targetRef?.current) {
      return;
    }

    window.setTimeout(() => {
      targetRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 30);
  }, []);

  // ==========================================================
  // LOAD ADMIN DATA
  // ==========================================================

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
        ApiService.getGuesthouses(),
        ApiService.getAllUsers(),
      ]);

      const safePending = Array.isArray(pending)
        ? pending
        : [];

      const safeGuesthouses = Array.isArray(guesthouses)
        ? guesthouses
        : [];

      const safeUsers = Array.isArray(users)
        ? users
        : [];

      // --------------------------------------------------------
      // IMPORTANT:
      // ADMIN MANAGE OWNERS = ONLY OWNER USERS
      // --------------------------------------------------------

      const ownersOnly = safeUsers.filter((item) => {
        return (
          String(item?.role || '').toUpperCase() === 'OWNER'
        );
      });

      const totalGuesthouses =
        Number(platformStats?.totalGuesthouses) ||
        safeGuesthouses.length ||
        0;

      const approvedGuesthouses =
        Number(platformStats?.approvedGuesthouses) ||
        safeGuesthouses.filter((gh) => {
          return (
            String(gh?.status || '').toLowerCase() ===
            'approved'
          );
        }).length ||
        0;

      setStats({
        totalGuesthouses,
        approvedGuesthouses,
        pendingGuesthouses: safePending.length,
        totalOwners: ownersOnly.length,
      });

      setPendingGuesthouses(safePending);
      setAllGuesthouses(safeGuesthouses);
      setUsersList(safeUsers);
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

      setStats({
        totalGuesthouses: 0,
        approvedGuesthouses: 0,
        pendingGuesthouses: 0,
        totalOwners: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // ==========================================================
  // OBSERVE CURRENT SECTION WHILE SCROLLING
  // ==========================================================

  useEffect(() => {
    const sections = [
      {
        name: 'dashboard',
        ref: dashboardRef,
      },
      {
        name: 'guesthouses',
        ref: guesthousesRef,
      },
      {
        name: 'pending',
        ref: pendingRef,
      },
      {
        name: 'owners',
        ref: ownersRef,
      },
      {
        name: 'backup',
        ref: backupRef,
      },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              b.intersectionRatio -
              a.intersectionRatio
          );

        if (visibleEntries.length > 0) {
          const visible = visibleEntries[0];

          const found = sections.find(
            (section) =>
              section.ref.current === visible.target
          );

          if (found) {
            setActiveSection(found.name);
          }
        }
      },
      {
        threshold: [0.15, 0.3, 0.5],
        rootMargin: '-100px 0px -45% 0px',
      }
    );

    sections.forEach((section) => {
      if (section.ref.current) {
        observer.observe(section.ref.current);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // ==========================================================
  // APPROVE GUESTHOUSE
  // ==========================================================

  const handleApproveGuesthouse = async (id) => {
    if (!id) {
      return;
    }

    try {
      setLoading(true);

      await ApiService.approveGuesthouse(id);

      await loadAdminData();

      scrollToSection('pending');
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

      setLoading(false);
    }
  };

  // ==========================================================
  // REJECT GUESTHOUSE
  // ==========================================================

  const handleRejectGuesthouse = async (id) => {
    if (!id) {
      return;
    }

    const reason = window.prompt(
      'Enter rejection reason:',
      'Does not meet platform standards'
    );

    if (reason === null) {
      return;
    }

    try {
      setLoading(true);

      await ApiService.rejectGuesthouse(
        id,
        reason
      );

      await loadAdminData();

      scrollToSection('pending');
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

      setLoading(false);
    }
  };

  // ==========================================================
  // DELETE GUESTHOUSE
  // ==========================================================

  const handleDeleteGuesthouse = async (id) => {
    if (!id) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this guesthouse?\n\nThis action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await ApiService.deleteGuesthouse(id);

      await loadAdminData();

      scrollToSection('guesthouses');
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

      setLoading(false);
    }
  };

  // ==========================================================
  // DELETE OWNER
  // ==========================================================

  const handleDeleteOwner = async (id) => {
    if (!id) {
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this owner account?\n\nThis action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await ApiService.deleteUser(id);

      await loadAdminData();

      scrollToSection('owners');
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

      setLoading(false);
    }
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {
    const confirmed = window.confirm(
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
  // ONLY OWNER USERS
  // ==========================================================

  const owners = useMemo(() => {
    return usersList.filter((item) => {
      return (
        String(item?.role || '').toUpperCase() ===
        'OWNER'
      );
    });
  }, [usersList]);

  // ==========================================================
  // SEARCH OWNERS
  // ==========================================================

  const filteredOwners = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    if (!query) {
      return owners;
    }

    return owners.filter((owner) => {
      const name = String(
        owner?.name ||
        owner?.fullName ||
        ''
      ).toLowerCase();

      const email = String(
        owner?.email || ''
      ).toLowerCase();

      const phone = String(
        owner?.phone || ''
      ).toLowerCase();

      return (
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query)
      );
    });
  }, [owners, searchQuery]);

  // ==========================================================
  // SEARCH GUESTHOUSES
  // ==========================================================

  const filteredGuesthouses = useMemo(() => {
    const query = guesthouseSearch
      .trim()
      .toLowerCase();

    if (!query) {
      return allGuesthouses;
    }

    return allGuesthouses.filter((gh) => {
      const name = String(
        gh?.name || ''
      ).toLowerCase();

      const city = String(
        gh?.city || ''
      ).toLowerCase();

      const location = String(
        gh?.location ||
        gh?.address ||
        ''
      ).toLowerCase();

      return (
        name.includes(query) ||
        city.includes(query) ||
        location.includes(query)
      );
    });
  }, [
    allGuesthouses,
    guesthouseSearch,
  ]);

  // ==========================================================
  // SYSTEM BACKUP
  // ==========================================================

  const handleSystemBackup = () => {
    try {
      const backupData = {
        backupType:
          'Guesthouse Reservation Platform Admin Backup',

        generatedAt:
          new Date().toISOString(),

        guesthouses:
          allGuesthouses,

        pendingGuesthouses:
          pendingGuesthouses,

        owners:
          owners,

        users:
          usersList,
      };

      const json = JSON.stringify(
        backupData,
        null,
        2
      );

      const blob = new Blob(
        [json],
        {
          type: 'application/json',
        }
      );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement('a');

      link.href = url;

      link.download =
        `guesthouse-admin-backup-${new Date()
          .toISOString()
          .slice(0, 10)}.json`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        'Backup error:',
        err
      );

      alert(
        'Failed to create system backup.'
      );
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-stone-50">

      {/* ======================================================
          TOP HEADER
      ====================================================== */}

      <header className="sticky top-0 z-50 bg-stone-950 text-white border-b border-stone-800">

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">

          <div className="h-20 flex items-center justify-between">

            {/* BRAND */}

            <button
              type="button"
              onClick={() =>
                scrollToSection('dashboard')
              }
              className="flex items-center gap-3"
            >

              <div className="w-11 h-11 rounded-xl bg-purple-700 flex items-center justify-center shadow-lg shadow-purple-900/30">
                <Building2 className="w-6 h-6 text-white" />
              </div>

              <div className="text-left">

                <div className="text-lg font-black tracking-tight">
                  Guesthouse Platform
                </div>

                <div className="text-[10px] font-black tracking-[0.25em] text-purple-400">
                  ETHIOPIA
                </div>

              </div>

            </button>

            {/* PROFILE */}

            <div className="relative">

              <button
                type="button"
                onClick={() =>
                  setShowProfileMenu(
                    (previous) =>
                      !previous
                  )
                }
                className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-white/10 transition"
              >

                <div className="hidden sm:block text-right">

                  <div className="text-sm font-black">
                    {user?.name ||
                      user?.fullName ||
                      'Administrator'}
                  </div>

                  <div className="text-[10px] font-black text-purple-400 uppercase tracking-wider">
                    Admin
                  </div>

                </div>

                <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center font-black">
                  {(
                    user?.name ||
                    user?.fullName ||
                    user?.email ||
                    'A'
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showProfileMenu
                      ? 'rotate-180'
                      : ''
                    }`}
                />

              </button>

              {/* PROFILE MENU */}

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-3 w-72 bg-white text-stone-900 rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">

                  <div className="px-5 py-4 border-b border-stone-100">

                    <div className="flex items-center gap-3">

                      <div className="w-11 h-11 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                        {(
                          user?.name ||
                          user?.fullName ||
                          user?.email ||
                          'A'
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">

                        <div className="text-sm font-black">
                          {user?.name ||
                            user?.fullName ||
                            'Administrator'}
                        </div>

                        <div className="text-xs text-stone-500 truncate">
                          {user?.email || ''}
                        </div>

                        <div className="text-[10px] text-purple-600 font-black uppercase mt-1">
                          Administrator
                        </div>

                      </div>

                    </div>

                  </div>

                  <div className="p-2">

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowProfileModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-bold text-stone-700 hover:bg-stone-100"
                    >
                      <Settings className="w-4 h-4" />
                      Update Profile
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-bold text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>

                  </div>

                </div>
              )}

            </div>

          </div>

        </div>

      </header>


      {/* ======================================================
          PAGE
      ====================================================== */}

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ERROR */}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start justify-between gap-4">

            <div className="flex items-start gap-3">

              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />

              <span>{error}</span>

            </div>

            <button
              type="button"
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>

          </div>
        )}


        {/* ====================================================
            MAIN LAYOUT
        ==================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

          {/* ==================================================
              SIDEBAR
          ================================================== */}

          <aside className="bg-white rounded-3xl border border-stone-200 p-4 h-fit lg:sticky lg:top-28 shadow-sm">

            <div className="px-3 mb-4">

              <div className="text-xs uppercase tracking-[0.12em] font-black text-stone-400">
                Administration
              </div>

              <div className="text-sm text-stone-500 mt-1">
                Platform management
              </div>

            </div>


            <AdminSidebarButton
              active={
                activeSection ===
                'dashboard'
              }
              icon={
                <LayoutDashboard className="w-5 h-5" />
              }
              label="Dashboard"
              onClick={() =>
                scrollToSection(
                  'dashboard'
                )
              }
            />


            <AdminSidebarButton
              active={
                activeSection ===
                'guesthouses'
              }
              icon={
                <Building2 className="w-5 h-5" />
              }
              label="Guesthouses"
              count={
                allGuesthouses.length
              }
              onClick={() =>
                scrollToSection(
                  'guesthouses'
                )
              }
            />


            <AdminSidebarButton
              active={
                activeSection ===
                'pending'
              }
              icon={
                <Clock3 className="w-5 h-5" />
              }
              label="Pending Verification"
              count={
                pendingGuesthouses.length
              }
              onClick={() =>
                scrollToSection(
                  'pending'
                )
              }
            />


            <AdminSidebarButton
              active={
                activeSection ===
                'owners'
              }
              icon={
                <UserCog className="w-5 h-5" />
              }
              label="Manage Owners"
              count={owners.length}
              onClick={() =>
                scrollToSection(
                  'owners'
                )
              }
            />


            <AdminSidebarButton
              active={
                activeSection ===
                'backup'
              }
              icon={
                <DatabaseBackup className="w-5 h-5" />
              }
              label="System Backup"
              onClick={() =>
                scrollToSection(
                  'backup'
                )
              }
            />

            {/* SIDEBAR SUMMARY */}

            <div className="mt-5 pt-5 border-t border-stone-100">

              <div className="px-3 text-[10px] font-black uppercase tracking-wider text-stone-400">
                Current Platform
              </div>

              <div className="mt-3 space-y-2">

                <SidebarMiniStat
                  label="Guesthouses"
                  value={
                    allGuesthouses.length
                  }
                />

                <SidebarMiniStat
                  label="Pending"
                  value={
                    pendingGuesthouses.length
                  }
                />

                <SidebarMiniStat
                  label="Owners"
                  value={
                    owners.length
                  }
                />

              </div>

            </div>

          </aside>


          {/* ==================================================
              CONTENT
          ================================================== */}

          <main className="min-w-0 space-y-8">

            {/* =================================================
                DASHBOARD - ALWAYS VISIBLE
            ================================================= */}

            <section
              ref={dashboardRef}
              id="admin-dashboard"
              className="scroll-mt-28"
            >

              <DashboardOverview
                stats={stats}
                loading={loading}
                onRefresh={
                  loadAdminData
                }
                onNavigate={
                  scrollToSection
                }
              />

            </section>


            {/* =================================================
                GUESTHOUSES
            ================================================= */}

            <section
              ref={guesthousesRef}
              id="admin-guesthouses"
              className="scroll-mt-28"
            >

              <GuesthouseSection
                guesthouses={
                  filteredGuesthouses
                }
                search={
                  guesthouseSearch
                }
                setSearch={
                  setGuesthouseSearch
                }
                loading={loading}
                onApprove={
                  handleApproveGuesthouse
                }
                onDelete={
                  handleDeleteGuesthouse
                }
              />

            </section>


            {/* =================================================
                PENDING
            ================================================= */}

            <section
              ref={pendingRef}
              id="admin-pending"
              className="scroll-mt-28"
            >

              <PendingSection
                pendingGuesthouses={
                  pendingGuesthouses
                }
                loading={loading}
                onApprove={
                  handleApproveGuesthouse
                }
                onReject={
                  handleRejectGuesthouse
                }
              />

            </section>


            {/* =================================================
                OWNERS / USER ACCOUNTS
            ================================================= */}

            <section
              ref={ownersRef}
              id="admin-owners"
              className="scroll-mt-28"
            >

              <OwnersSection
                owners={
                  filteredOwners
                }
                totalOwners={
                  owners.length
                }
                search={
                  searchQuery
                }
                setSearch={
                  setSearchQuery
                }
                loading={loading}
                onDelete={
                  handleDeleteOwner
                }
              />

            </section>


            {/* =================================================
                SYSTEM BACKUP
            ================================================= */}

            <section
              ref={backupRef}
              id="admin-backup"
              className="scroll-mt-28"
            >

              <BackupSection
                onBackup={
                  handleSystemBackup
                }
                loading={loading}
                guesthousesCount={
                  allGuesthouses.length
                }
                ownersCount={
                  owners.length
                }
                usersCount={
                  owners.length
                }
              />

            </section>

          </main>

        </div>


        {/* ====================================================
            PROFILE MODAL
        ==================================================== */}

        {showProfileModal && (
          <UpdateProfileModal
            user={user}
            onClose={() =>
              setShowProfileModal(false)
            }
            onSaved={async (
              updatedUser
            ) => {
              if (updatedUser) {
                ApiService.setCurrentUser(
                  updatedUser
                );
              }

              setShowProfileModal(false);

              await loadAdminData();
            }}
          />
        )}

      </div>

    </div>
  );
}


// ============================================================
// DASHBOARD OVERVIEW
// ============================================================

function DashboardOverview({
  stats,
  loading,
  onRefresh,
  onNavigate,
}) {
  return (
    <div className="space-y-6">

      {/* HERO */}

      <div className="relative overflow-hidden rounded-3xl bg-stone-950 text-white p-6 sm:p-8">

        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-purple-700/20 blur-3xl" />

        <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-purple-300 text-xs font-black uppercase tracking-wider">

                <ShieldCheck className="w-4 h-4" />

                Administrator

              </div>

              <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight">
                Administration Dashboard
              </h1>

              <p className="mt-3 text-sm sm:text-base text-stone-300 max-w-2xl">
                Manage guesthouses, verify new properties,
                manage owner accounts and maintain the
                reservation platform.
              </p>

            </div>


            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-stone-900 text-sm font-black hover:bg-stone-100 disabled:opacity-50 transition shrink-0"
            >

              <RefreshCw
                className={`w-4 h-4 ${loading
                    ? 'animate-spin'
                    : ''
                  }`}
              />

              {loading
                ? 'Refreshing...'
                : 'Refresh Data'}

            </button>

          </div>

        </div>

      </div>


      {/* ======================================================
          MAIN ADMIN CARDS
      ====================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        <OverviewCard
          icon={
            <Clock3 className="w-7 h-7" />
          }
          title="Pending Verification"
          value={
            stats.pendingGuesthouses
          }
          description="Guesthouses waiting for administrator approval."
          color="amber"
          onClick={() =>
            onNavigate('pending')
          }
        />


        <OverviewCard
          icon={
            <Building2 className="w-7 h-7" />
          }
          title="Guesthouses"
          value={
            stats.totalGuesthouses
          }
          description="All registered guesthouses on the platform."
          color="purple"
          onClick={() =>
            onNavigate('guesthouses')
          }
        />


        {/* IMPORTANT:
            SAME VALUE AS MANAGE OWNERS */}

        <OverviewCard
          icon={
            <Users className="w-7 h-7" />
          }
          title="User Accounts"
          value={stats.totalOwners}
          description="Owner accounts registered on the platform."
          color="blue"
          onClick={() =>
            onNavigate('owners')
          }
        />

      </div>


      {/* ======================================================
          ADMIN QUICK STATUS
      ====================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <QuickStat
          icon={
            <Building2 className="w-5 h-5" />
          }
          label="Total Guesthouses"
          value={
            stats.totalGuesthouses
          }
        />

        <QuickStat
          icon={
            <CheckCircle2 className="w-5 h-5" />
          }
          label="Approved"
          value={
            stats.approvedGuesthouses
          }
        />

        <QuickStat
          icon={
            <UserCog className="w-5 h-5" />
          }
          label="Owner Accounts"
          value={stats.totalOwners}
        />

      </div>


      {/* INFO */}

      <div className="rounded-3xl bg-white border border-stone-200 p-6">

        <div className="flex items-start gap-4">

          <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>

          <div>

            <h2 className="font-black text-stone-900">
              Administration Control Center
            </h2>

            <p className="text-sm text-stone-500 mt-1 leading-6">
              Use the administration menu to review
              guesthouses, approve or reject pending
              properties, manage owner accounts and
              export platform administration data.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// OVERVIEW CARD
// ============================================================

function OverviewCard({
  icon,
  title,
  value,
  description,
  color,
  onClick,
}) {
  const colorClasses = {
    purple: {
      icon: 'bg-purple-100 text-purple-700 group-hover:bg-purple-700 group-hover:text-white',
      value: 'text-purple-700',
      border:
        'hover:border-purple-300 hover:shadow-purple-100',
    },

    amber: {
      icon: 'bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white',
      value: 'text-amber-700',
      border:
        'hover:border-amber-300 hover:shadow-amber-100',
    },

    blue: {
      icon: 'bg-blue-100 text-blue-700 group-hover:bg-blue-700 group-hover:text-white',
      value: 'text-blue-700',
      border:
        'hover:border-blue-300 hover:shadow-blue-100',
    },
  };

  const selected =
    colorClasses[color] ||
    colorClasses.purple;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group text-left bg-white rounded-3xl border border-stone-200 p-6 hover:shadow-xl transition-all ${selected.border}`}
    >

      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition ${selected.icon}`}
      >
        {icon}
      </div>

      <div className="mt-6 text-lg font-black text-stone-900">
        {title}
      </div>

      <div
        className={`mt-2 text-4xl font-black ${selected.value}`}
      >
        {value}
      </div>

      <p className="mt-2 text-sm text-stone-500 leading-6">
        {description}
      </p>

      <div className="mt-5 inline-flex items-center gap-1 text-xs font-black text-stone-500 group-hover:text-purple-700 transition">
        Open section
        <ArrowRight className="w-3.5 h-3.5" />
      </div>

    </button>
  );
}


// ============================================================
// QUICK STAT
// ============================================================

function QuickStat({
  icon,
  label,
  value,
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">

      <div className="flex items-center justify-between gap-3">

        <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center">
          {icon}
        </div>

        <div className="text-2xl font-black text-stone-900">
          {value}
        </div>

      </div>

      <div className="mt-4 text-xs font-black uppercase tracking-wider text-stone-400">
        {label}
      </div>

    </div>
  );
}


// ============================================================
// GUESTHOUSE SECTION
// ============================================================

function GuesthouseSection({
  guesthouses,
  search,
  setSearch,
  loading,
  onApprove,
  onDelete,
}) {
  return (
    <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">

      <div className="p-6 border-b border-stone-200">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

          <SectionHeader
            icon={
              <Building2 className="w-5 h-5 text-purple-600" />
            }
            title="Guesthouses"
            subtitle="View and manage all registered guesthouses."
          />

          <div className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-sm font-black">
            {guesthouses.length} shown
          </div>

        </div>


        {/* SEARCH */}

        <div className="relative mt-5 max-w-lg">

          <Search className="absolute left-3 top-3 w-4 h-4 text-stone-400" />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search by guesthouse, city or location..."
            className="w-full pl-9 pr-4 py-3 rounded-xl border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />

        </div>

      </div>


      {guesthouses.length === 0 ? (
        <EmptyState
          title="No guesthouses found"
          text="There are no guesthouses matching your search."
        />
      ) : (
        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-stone-50">

              <tr>

                <th className="px-6 py-4 text-xs font-black text-stone-500 uppercase tracking-wider">
                  Guesthouse
                </th>

                <th className="px-6 py-4 text-xs font-black text-stone-500 uppercase tracking-wider">
                  Location
                </th>

                <th className="px-6 py-4 text-xs font-black text-stone-500 uppercase tracking-wider">
                  Rating
                </th>

                <th className="px-6 py-4 text-xs font-black text-stone-500 uppercase tracking-wider">
                  Status
                </th>

                <th className="px-6 py-4 text-xs font-black text-stone-500 uppercase tracking-wider text-right">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-stone-100">

              {guesthouses.map((gh) => (
                <tr
                  key={gh.id}
                  className="hover:bg-stone-50 transition"
                >

                  <td className="px-6 py-5">

                    <div className="font-black text-stone-900">
                      {gh.name ||
                        'Unnamed Guesthouse'}
                    </div>

                    <div className="text-xs text-stone-400 mt-1">
                      ID: {gh.id}
                    </div>

                  </td>


                  <td className="px-6 py-5">

                    <div className="flex items-center gap-2 text-sm text-stone-600">

                      <MapPin className="w-4 h-4 text-stone-400 shrink-0" />

                      <span>
                        {gh.city ||
                          gh.location ||
                          gh.address ||
                          'N/A'}
                      </span>

                    </div>

                  </td>


                  <td className="px-6 py-5 text-sm text-stone-600">

                    <span className="font-bold">
                      {Number(
                        gh.rating || 0
                      ).toFixed(1)}
                    </span>

                    <span className="ml-1">
                      ★
                    </span>

                  </td>


                  <td className="px-6 py-5">

                    <StatusBadge
                      status={
                        gh.status ||
                        'unknown'
                      }
                    />

                  </td>


                  <td className="px-6 py-5">

                    <div className="flex justify-end gap-2">

                      {String(
                        gh.status || ''
                      ).toLowerCase() ===
                        'pending' && (
                          <button
                            type="button"
                            onClick={() =>
                              onApprove(
                                gh.id
                              )
                            }
                            disabled={loading}
                            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
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
                        disabled={loading}
                        className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"
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

    </div>
  );
}


// ============================================================
// PENDING SECTION
// ============================================================

function PendingSection({
  pendingGuesthouses,
  loading,
  onApprove,
  onReject,
}) {
  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">

      <SectionHeader
        icon={
          <Clock3 className="w-5 h-5 text-amber-600" />
        }
        title="Pending Verification"
        subtitle="Review guesthouses waiting for administrator approval."
      />


      <div className="mt-6">

        {pendingGuesthouses.length === 0 ? (
          <EmptyState
            title="No pending guesthouses"
            text="All guesthouses have been reviewed."
          />
        ) : (
          <div className="space-y-4">

            {pendingGuesthouses.map(
              (gh) => (
                <div
                  key={gh.id}
                  className="border border-stone-200 rounded-2xl p-5 hover:border-purple-200 hover:shadow-sm transition"
                >

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

                    <div className="min-w-0">

                      <div className="flex items-center gap-3">

                        <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>

                        <div className="min-w-0">

                          <h3 className="font-black text-stone-900 truncate">
                            {gh.name ||
                              'Unnamed Guesthouse'}
                          </h3>

                          <p className="text-sm text-stone-500 mt-1">
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
                        <p className="text-sm text-stone-600 mt-4 leading-6">
                          {gh.description}
                        </p>
                      )}


                      <div className="text-xs text-stone-400 mt-3">
                        ID: {gh.id}
                      </div>

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
                        className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"
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
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"
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

    </div>
  );
}


// ============================================================
// OWNERS SECTION
// ============================================================

function OwnersSection({
  owners,
  totalOwners,
  search,
  setSearch,
  loading,
  onDelete,
}) {
  return (
    <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">

      <div className="p-6 border-b border-stone-200">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <SectionHeader
            icon={
              <UserCog className="w-5 h-5 text-purple-600" />
            }
            title="Manage Owners"
            subtitle="Only OWNER accounts are displayed here."
          />

          <div className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 text-sm font-black">
            {totalOwners} Owners
          </div>

        </div>


        {/* OWNER SEARCH ONLY */}

        <div className="relative mt-5 max-w-lg">

          <Search className="absolute left-3 top-3 w-4 h-4 text-stone-400" />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search owner name, email or phone..."
            className="w-full pl-9 pr-4 py-3 rounded-xl border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />

        </div>

      </div>


      {owners.length === 0 ? (
        <EmptyState
          title="No owners found"
          text="There are no owner accounts matching your search."
        />
      ) : (
        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="bg-stone-50">

              <tr>

                <th className="px-6 py-4 text-xs font-black text-stone-500 uppercase tracking-wider">
                  Owner
                </th>

                <th className="px-6 py-4 text-xs font-black text-stone-500 uppercase tracking-wider">
                  Email
                </th>

                <th className="px-6 py-4 text-xs font-black text-stone-500 uppercase tracking-wider">
                  Phone
                </th>

                <th className="px-6 py-4 text-xs font-black text-stone-500 uppercase tracking-wider">
                  Role
                </th>

                <th className="px-6 py-4 text-xs font-black text-stone-500 uppercase tracking-wider text-right">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-stone-100">

              {owners.map(
                (owner) => (
                  <tr
                    key={owner.id}
                    className="hover:bg-stone-50 transition"
                  >

                    <td className="px-6 py-5">

                      <div className="flex items-center gap-3">

                        <div className="w-11 h-11 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-black shrink-0">

                          {(
                            owner?.name ||
                            owner?.fullName ||
                            'O'
                          )
                            .charAt(0)
                            .toUpperCase()}

                        </div>

                        <div>

                          <div className="font-black text-stone-900">
                            {owner?.name ||
                              owner?.fullName ||
                              'N/A'}
                          </div>

                          <div className="text-xs text-stone-400 mt-1">
                            ID: {owner.id}
                          </div>

                        </div>

                      </div>

                    </td>


                    <td className="px-6 py-5 text-sm text-stone-600">

                      <div className="flex items-center gap-2">

                        <Mail className="w-4 h-4 text-stone-400" />

                        {owner.email ||
                          'N/A'}

                      </div>

                    </td>


                    <td className="px-6 py-5 text-sm text-stone-600">

                      <div className="flex items-center gap-2">

                        <Phone className="w-4 h-4 text-stone-400" />

                        {owner.phone ||
                          'N/A'}

                      </div>

                    </td>


                    <td className="px-6 py-5">

                      <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black">
                        OWNER
                      </span>

                    </td>


                    <td className="px-6 py-5">

                      <div className="flex justify-end">

                        <button
                          type="button"
                          onClick={() =>
                            onDelete(
                              owner.id
                            )
                          }
                          disabled={loading}
                          className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"
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
  );
}


// ============================================================
// BACKUP SECTION
// ============================================================

function BackupSection({
  onBackup,
  loading,
  guesthousesCount,
  ownersCount,
  usersCount,
}) {
  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">

      <SectionHeader
        icon={
          <DatabaseBackup className="w-5 h-5 text-purple-600" />
        }
        title="System Backup"
        subtitle="Export the currently loaded administration data."
      />


      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">

        <MiniStat
          label="Guesthouses"
          value={
            guesthousesCount
          }
        />

        <MiniStat
          label="Owners"
          value={ownersCount}
        />

        <MiniStat
          label="Owner Accounts"
          value={usersCount}
        />

      </div>


      <div className="mt-6 p-6 rounded-2xl bg-purple-50 border border-purple-100">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

          <div>

            <div className="flex items-center gap-2">

              <DatabaseBackup className="w-5 h-5 text-purple-700" />

              <h3 className="font-black text-stone-900">
                Export platform data
              </h3>

            </div>

            <p className="text-sm text-stone-600 mt-2 max-w-xl leading-6">
              Download guesthouses, pending verification
              records, owner accounts and loaded user
              administration data as a JSON backup.
            </p>

          </div>


          <button
            type="button"
            onClick={onBackup}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-sm font-black disabled:opacity-50 shrink-0 transition"
          >

            <Download className="w-4 h-4" />

            Download Backup

          </button>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// SIDEBAR BUTTON
// ============================================================

function AdminSidebarButton({
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
      className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl text-sm font-black mb-1 transition-all ${active
          ? 'bg-purple-700 text-white shadow-lg shadow-purple-200'
          : 'text-stone-600 hover:bg-stone-100'
        }`}
    >

      <span className="flex items-center gap-3 text-left">

        {icon}

        {label}

      </span>


      {count !== undefined && (
        <span
          className={`min-w-7 h-7 px-2 rounded-full flex items-center justify-center text-xs font-black ${active
              ? 'bg-white/20 text-white'
              : 'bg-stone-100 text-stone-600'
            }`}
        >
          {count}
        </span>
      )}

    </button>
  );
}


// ============================================================
// SIDEBAR MINI STAT
// ============================================================

function SidebarMiniStat({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50">

      <span className="text-xs font-bold text-stone-500">
        {label}
      </span>

      <span className="text-sm font-black text-stone-900">
        {value}
      </span>

    </div>
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

        <h2 className="text-xl font-black text-stone-900">
          {title}
        </h2>

        <p className="text-sm text-stone-500 mt-1 leading-6">
          {subtitle}
        </p>

      </div>

    </div>
  );
}


// ============================================================
// MINI STAT
// ============================================================

function MiniStat({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl bg-stone-50 border border-stone-200 p-5">

      <div className="text-xs font-black uppercase tracking-wider text-stone-400">
        {label}
      </div>

      <div className="mt-2 text-2xl font-black text-stone-900">
        {value}
      </div>

    </div>
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

  const approved =
    normalized === 'approved';

  const rejected =
    normalized === 'rejected';

  const pending =
    normalized === 'pending';

  let classes =
    'bg-stone-100 text-stone-700';

  if (approved) {
    classes =
      'bg-emerald-100 text-emerald-700';
  }

  if (rejected) {
    classes =
      'bg-red-100 text-red-700';
  }

  if (pending) {
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

      <div className="w-14 h-14 mx-auto rounded-full bg-stone-100 flex items-center justify-center">

        <ShieldCheck className="w-7 h-7 text-stone-400" />

      </div>

      <h3 className="font-black text-stone-800 mt-4">
        {title}
      </h3>

      <p className="text-sm text-stone-500 mt-1">
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

  // ==========================================================
  // SUBMIT
  // ==========================================================

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
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* HEADER */}

        <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between">

          <div>

            <h2 className="text-lg font-black text-stone-900">
              Update Profile
            </h2>

            <p className="text-xs text-stone-500 mt-1">
              Update your administrator account.
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>

        </div>


        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4"
        >

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
              className="flex-1 px-4 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-bold disabled:opacity-50"
            >
              Cancel
            </button>


            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-sm font-bold disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : 'Save Changes'}
            </button>

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

      <label className="block text-xs font-bold text-stone-600 mb-1.5">
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
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
      />

    </div>
  );
}


// ============================================================
// DEFAULT EXPORT
// ============================================================

export default AdminDashboard;