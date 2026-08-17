import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  DoorOpen,
  CalendarCheck,
  Plus,
  Edit,
  Eye,
  LogOut,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

import { ApiService } from "../../services/api.js";

/* ============================================================
   OWNER DASHBOARD
   ============================================================ */

function OwnerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [guesthouses, setGuesthouses] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [revenueReport, setRevenueReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ==========================================================
     LOAD OWNER DATA
     ========================================================== */

  const loadOwnerData = async () => {
    try {
      setLoading(true);
      setError("");

      /* --------------------------------------------------------
         CURRENT USER
         -------------------------------------------------------- */

      const currentUser = ApiService.getCurrentUser();

      setUser(currentUser || null);

      if (!currentUser?.id) {
        setGuesthouses([]);
        setReservations([]);
        setRevenueReport(null);

        setError(
          "No logged-in owner was found. Please log in again."
        );

        return;
      }

      /* --------------------------------------------------------
         LOAD GUESTHOUSES
         -------------------------------------------------------- */

      let allGuesthouses = [];

      try {
        const result = await ApiService.getGuesthouses();

        if (Array.isArray(result)) {
          allGuesthouses = result;
        } else if (Array.isArray(result?.data)) {
          allGuesthouses = result.data;
        } else {
          allGuesthouses = [];
        }
      } catch (guesthouseError) {
        console.error(
          "Failed to load guesthouses:",
          guesthouseError
        );

        allGuesthouses = [];
      }

      /* --------------------------------------------------------
         KEEP ONLY THIS OWNER'S GUESTHOUSES
         -------------------------------------------------------- */

      const ownerGuesthouses = allGuesthouses.filter(
        (guesthouse) => {
          const guesthouseOwnerId =
            guesthouse?.ownerId ??
            guesthouse?.owner?.id ??
            guesthouse?.owner?.userId;

          return (
            String(guesthouseOwnerId) ===
            String(currentUser.id)
          );
        }
      );

      setGuesthouses(ownerGuesthouses);

      /* --------------------------------------------------------
         LOAD RESERVATIONS
         -------------------------------------------------------- */

      let allReservations = [];

      try {
        const result = await ApiService.getReservations();

        if (Array.isArray(result)) {
          allReservations = result;
        } else if (Array.isArray(result?.data)) {
          allReservations = result.data;
        } else {
          allReservations = [];
        }
      } catch (reservationError) {
        console.error(
          "Failed to load reservations:",
          reservationError
        );

        allReservations = [];
      }

      /* --------------------------------------------------------
         OWNER GUESTHOUSE IDS
         -------------------------------------------------------- */

      const ownerGuesthouseIds = new Set(
        ownerGuesthouses
          .map((guesthouse) => guesthouse?.id)
          .filter(Boolean)
          .map((id) => String(id))
      );

      /* --------------------------------------------------------
         FILTER OWNER RESERVATIONS
         -------------------------------------------------------- */

      const ownerReservations = allReservations.filter(
        (reservation) => {
          const guesthouseId =
            reservation?.guesthouseId ??
            reservation?.guesthouse?.id ??
            reservation?.room?.guesthouseId ??
            reservation?.room?.guesthouse?.id;

          return ownerGuesthouseIds.has(
            String(guesthouseId)
          );
        }
      );

      setReservations(ownerReservations);

      /* --------------------------------------------------------
         LOAD OWNER REVENUE
         -------------------------------------------------------- */

      try {
        if (
          typeof ApiService.getOwnerRevenueReport ===
          "function"
        ) {
          const report =
            await ApiService.getOwnerRevenueReport();

          setRevenueReport(report || null);
        } else {
          setRevenueReport(null);
        }
      } catch (revenueError) {
        console.warn(
          "Could not load owner revenue report:",
          revenueError
        );

        setRevenueReport(null);
      }
    } catch (loadError) {
      console.error(
        "Failed to load owner dashboard:",
        loadError
      );

      setError(
        loadError?.response?.data?.message ||
          loadError?.message ||
          "Unable to load owner dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     INITIAL LOAD
     ========================================================== */

  useEffect(() => {
    loadOwnerData();
  }, []);

  /* ==========================================================
     LOGOUT
     ========================================================== */

  const handleLogout = () => {
    try {
      if (typeof ApiService.logout === "function") {
        ApiService.logout();
      }
    } catch (logoutError) {
      console.error(
        "Logout failed:",
        logoutError
      );
    }

    localStorage.removeItem("token");
    localStorage.removeItem("gh_current_user_v2");
    localStorage.removeItem("currentUser");

    navigate("/login");
  };

  /* ==========================================================
     GUESTHOUSE STATISTICS
     ========================================================== */

  const approvedGuesthouses = useMemo(() => {
    return guesthouses.filter((guesthouse) => {
      const status = String(
        guesthouse?.status || ""
      ).toUpperCase();

      return (
        status === "APPROVED" ||
        guesthouse?.approved === true
      );
    });
  }, [guesthouses]);

  const pendingGuesthouses = useMemo(() => {
    return guesthouses.filter((guesthouse) => {
      return (
        String(
          guesthouse?.status || ""
        ).toUpperCase() === "PENDING"
      );
    });
  }, [guesthouses]);

  const rejectedGuesthouses = useMemo(() => {
    return guesthouses.filter((guesthouse) => {
      return (
        String(
          guesthouse?.status || ""
        ).toUpperCase() === "REJECTED"
      );
    });
  }, [guesthouses]);

  /* ==========================================================
     TOTAL ROOMS
     ========================================================== */

  const totalRooms = useMemo(() => {
    return guesthouses.reduce(
      (total, guesthouse) => {
        const rooms = Array.isArray(
          guesthouse?.rooms
        )
          ? guesthouse.rooms
          : [];

        return total + rooms.length;
      },
      0
    );
  }, [guesthouses]);

  /* ==========================================================
     RESERVATION STATISTICS
     ========================================================== */

  const confirmedReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      const status = String(
        reservation?.status || ""
      ).toUpperCase();

      return (
        status === "CONFIRMED" ||
        status === "CHECKED_IN"
      );
    });
  }, [reservations]);

  const pendingReservations = useMemo(() => {
    return reservations.filter((reservation) => {
      return (
        String(
          reservation?.status || ""
        ).toUpperCase() === "PENDING"
      );
    });
  }, [reservations]);

  /* ==========================================================
     REVENUE
     ========================================================== */

  const revenue = useMemo(() => {
    if (
      revenueReport &&
      revenueReport.totalRevenue !== undefined &&
      revenueReport.totalRevenue !== null
    ) {
      return Number(
        revenueReport.totalRevenue
      );
    }

    return reservations.reduce(
      (total, reservation) => {
        const status = String(
          reservation?.status || ""
        ).toUpperCase();

        if (
          status === "CANCELLED" ||
          status === "REJECTED"
        ) {
          return total;
        }

        const amount =
          reservation?.payment?.amount ??
          reservation?.totalAmount ??
          reservation?.amount ??
          0;

        return (
          total + Number(amount || 0)
        );
      },
      0
    );
  }, [
    revenueReport,
    reservations,
  ]);

  /* ==========================================================
     FORMAT MONEY
     ========================================================== */

  const formatMoney = (amount) => {
    return `${Number(
      amount || 0
    ).toLocaleString()} ETB`;
  };

  /* ==========================================================
     STATUS STYLE
     ========================================================== */

  const getStatusStyle = (status) => {
    switch (
      String(
        status || ""
      ).toUpperCase()
    ) {
      case "APPROVED":
        return "bg-green-100 text-green-700";

      case "REJECTED":
        return "bg-red-100 text-red-700";

      case "PENDING":
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  /* ==========================================================
     RESERVATION COUNT FOR GUESTHOUSE
     ========================================================== */

  const getGuesthouseReservationCount = (
    guesthouseId
  ) => {
    return reservations.filter(
      (reservation) => {
        const reservationGuesthouseId =
          reservation?.guesthouseId ??
          reservation?.guesthouse?.id ??
          reservation?.room?.guesthouseId ??
          reservation?.room?.guesthouse?.id;

        return (
          String(
            reservationGuesthouseId
          ) === String(guesthouseId)
        );
      }
    ).length;
  };

  /* ==========================================================
     GET GUESTHOUSE IMAGE
     ========================================================== */

  const getGuesthouseImage = (
    guesthouse
  ) => {
    return (
      guesthouse?.image ||
      guesthouse?.images?.[0] ||
      null
    );
  };

  /* ==========================================================
     LOADING
     ========================================================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-md rounded-xl bg-white p-10 text-center shadow-sm">
            <RefreshCw
              size={38}
              className="mx-auto mb-4 animate-spin text-blue-600"
            />

            <h2 className="text-lg font-semibold text-gray-900">
              Loading Owner Dashboard
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Please wait while we load your
              guesthouses and reservations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     DASHBOARD
     ========================================================== */

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-4">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Owner Dashboard
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Welcome back,{" "}
              {user?.fullName ||
                user?.name ||
                "Owner"}
            </p>

            {user?.email && (
              <p className="mt-0.5 text-xs text-gray-400">
                {user.email}
              </p>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto max-w-7xl px-6 py-8">

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="mb-6 flex flex-col gap-4 rounded-xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-start sm:justify-between">

            <div>
              <h3 className="font-semibold text-red-900">
                Dashboard Error
              </h3>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>

            <button
              onClick={loadOwnerData}
              className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        )}

        {/* ====================================================
            ACTION BUTTONS
        ==================================================== */}

        <div className="mb-8 flex flex-wrap gap-3">

          <button
            onClick={() =>
              navigate(
                "/owner/guesthouses/new"
              )
            }
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={19} />
            Add Guesthouse
          </button>

          <button
            onClick={() =>
              navigate(
                "/owner/guesthouses"
              )
            }
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <Building2 size={19} />
            Manage Guesthouses
          </button>

          <button
            onClick={() =>
              navigate(
                "/owner/reservations"
              )
            }
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <CalendarCheck size={19} />
            Reservations
          </button>

          <button
            onClick={loadOwnerData}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
            title="Refresh dashboard"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {/* ====================================================
            STATISTICS
        ==================================================== */}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {/* Guesthouses */}

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Guesthouses
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {guesthouses.length}
                </p>
              </div>

              <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                <Building2 size={24} />
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              {approvedGuesthouses.length} approved
            </p>
          </div>

          {/* Rooms */}

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Rooms
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalRooms}
                </p>
              </div>

              <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
                <DoorOpen size={24} />
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Across your guesthouses
            </p>
          </div>

          {/* Reservations */}

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Reservations
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {reservations.length}
                </p>
              </div>

              <div className="rounded-lg bg-green-100 p-3 text-green-600">
                <CalendarCheck size={24} />
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              {confirmedReservations.length} confirmed
            </p>
          </div>

          {/* Revenue */}

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Revenue
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatMoney(revenue)}
                </p>
              </div>

              <div className="rounded-lg bg-orange-100 p-3 text-orange-600">
                <TrendingUp size={24} />
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              From reservations
            </p>
          </div>
        </div>

        {/* ====================================================
            MY GUESTHOUSES
        ==================================================== */}

        <section className="mt-8">

          <div className="mb-5 flex items-center justify-between gap-4">

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                My Guesthouses
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Manage your guesthouses and monitor approval status.
              </p>
            </div>

            <button
              onClick={() =>
                navigate(
                  "/owner/guesthouses/new"
                )
              }
              className="hidden items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:flex"
            >
              <Plus size={17} />
              Add New
            </button>
          </div>

          {/* No guesthouses */}

          {guesthouses.length === 0 ? (

            <div className="rounded-xl bg-white p-10 text-center shadow-sm">

              <Building2
                size={45}
                className="mx-auto mb-4 text-gray-300"
              />

              <h3 className="text-lg font-semibold text-gray-900">
                No guesthouses yet
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Add your first guesthouse to start receiving reservations.
              </p>

              <button
                onClick={() =>
                  navigate(
                    "/owner/guesthouses/new"
                  )
                }
                className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
              >
                Add Guesthouse
              </button>
            </div>

          ) : (

            <div className="grid gap-5 md:grid-cols-2">

              {guesthouses.map(
                (guesthouse) => {

                  const status =
                    String(
                      guesthouse?.status ||
                        "PENDING"
                    ).toUpperCase();

                  const rooms =
                    Array.isArray(
                      guesthouse?.rooms
                    )
                      ? guesthouse.rooms
                      : [];

                  const image =
                    getGuesthouseImage(
                      guesthouse
                    );

                  return (
                    <div
                      key={
                        guesthouse?.id
                      }
                      className="overflow-hidden rounded-xl bg-white shadow-sm"
                    >

                      {/* Image */}

                      {image ? (

                        <img
                          src={image}
                          alt={
                            guesthouse?.name ||
                            "Guesthouse"
                          }
                          className="h-48 w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />

                      ) : (

                        <div className="flex h-48 items-center justify-center bg-gray-100">
                          <Building2
                            size={50}
                            className="text-gray-300"
                          />
                        </div>

                      )}

                      <div className="p-5">

                        {/* Name / Status */}

                        <div className="flex items-start justify-between gap-4">

                          <div className="min-w-0">

                            <h3 className="truncate text-lg font-bold text-gray-900">
                              {guesthouse?.name ||
                                "Unnamed Guesthouse"}
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                              {guesthouse?.address ||
                                guesthouse?.city ||
                                "No address"}
                            </p>

                            {guesthouse?.city && (
                              <p className="mt-1 text-xs font-medium text-gray-400">
                                {guesthouse.city}
                              </p>
                            )}

                          </div>

                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                              status
                            )}`}
                          >
                            {status}
                          </span>

                        </div>

                        {/* Description */}

                        <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                          {guesthouse?.description ||
                            "No description available."}
                        </p>

                        {/* Room / reservation information */}

                        <div className="mt-4 grid grid-cols-2 gap-3">

                          <div className="rounded-lg bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">
                              Rooms
                            </p>

                            <p className="mt-1 font-bold text-gray-900">
                              {rooms.length}
                            </p>
                          </div>

                          <div className="rounded-lg bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">
                              Reservations
                            </p>

                            <p className="mt-1 font-bold text-gray-900">
                              {getGuesthouseReservationCount(
                                guesthouse?.id
                              )}
                            </p>
                          </div>

                        </div>

                        {/* Room details */}

                        {rooms.length > 0 && (

                          <div className="mt-4">

                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Rooms
                            </p>

                            <div className="flex flex-wrap gap-2">

                              {rooms
                                .slice(0, 5)
                                .map(
                                  (
                                    room,
                                    index
                                  ) => {

                                    const roomAvailable =
                                      room?.available !==
                                      false;

                                    return (
                                      <span
                                        key={
                                          room?.id ??
                                          room?.roomNumber ??
                                          index
                                        }
                                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                                          roomAvailable
                                            ? "bg-green-50 text-green-600"
                                            : "bg-red-50 text-red-600"
                                        }`}
                                      >
                                        Room{" "}
                                        {room?.roomNumber ||
                                          "—"}{" "}
                                        ·{" "}
                                        {formatMoney(
                                          room?.pricePerNight ??
                                            room?.price ??
                                            0
                                        )}
                                      </span>
                                    );
                                  }
                                )}

                              {rooms.length > 5 && (
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                  +
                                  {rooms.length -
                                    5}{" "}
                                  more
                                </span>
                              )}

                            </div>
                          </div>
                        )}

                        {/* Buttons */}

                        <div className="mt-5 flex gap-2">

                          <button
                            onClick={() =>
                              navigate(
                                `/owner/guesthouses/${guesthouse?.id}`
                              )
                            }
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            <Eye size={17} />
                            View
                          </button>

                          <button
                            onClick={() =>
                              navigate(
                                `/owner/guesthouses/${guesthouse?.id}/edit`
                              )
                            }
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            <Edit size={17} />
                            Edit
                          </button>

                        </div>

                      </div>
                    </div>
                  );
                }
              )}

            </div>
          )}
        </section>

        {/* ====================================================
            RECENT RESERVATIONS
        ==================================================== */}

        <section className="mt-8">

          <div className="mb-5 flex items-center justify-between gap-4">

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Recent Reservations
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Keep track of bookings made at your guesthouses.
              </p>
            </div>

            <button
              onClick={() =>
                navigate(
                  "/owner/reservations"
                )
              }
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View all
            </button>

          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-sm">

            {reservations.length === 0 ? (

              <div className="p-10 text-center">

                <CalendarCheck
                  size={45}
                  className="mx-auto mb-4 text-gray-300"
                />

                <p className="font-medium text-gray-700">
                  No reservations yet
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Reservations will appear here when guests book your rooms.
                </p>

              </div>

            ) : (

              <div className="divide-y">

                {reservations
                  .slice(0, 8)
                  .map(
                    (
                      reservation
                    ) => {

                      const status =
                        String(
                          reservation?.status ||
                            "PENDING"
                        ).toUpperCase();

                      const amount =
                        reservation?.payment
                          ?.amount ??
                        reservation?.totalAmount ??
                        reservation?.amount ??
                        0;

                      const guestName =
                        reservation?.guest
                          ?.fullName ||
                        reservation?.guest
                          ?.name ||
                        reservation?.guestName ||
                        "Guest";

                      const guesthouseName =
                        reservation?.room
                          ?.guesthouse?.name ||
                        reservation?.guesthouse
                          ?.name ||
                        "Guesthouse";

                      const checkIn =
                        reservation?.checkIn ||
                        reservation?.checkInDate;

                      const checkOut =
                        reservation?.checkOut ||
                        reservation?.checkOutDate;

                      return (
                        <div
                          key={
                            reservation?.id
                          }
                          className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                        >

                          <div className="flex items-start gap-4">

                            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                              <CalendarCheck
                                size={20}
                              />
                            </div>

                            <div>

                              <p className="font-semibold text-gray-900">
                                {guestName}
                              </p>

                              <p className="mt-1 text-sm text-gray-500">
                                {guesthouseName}
                              </p>

                              <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">

                                <span>
                                  Check-in:{" "}
                                  {checkIn
                                    ? new Date(
                                        checkIn
                                      ).toLocaleDateString()
                                    : "—"}
                                </span>

                                <span>
                                  Check-out:{" "}
                                  {checkOut
                                    ? new Date(
                                        checkOut
                                      ).toLocaleDateString()
                                    : "—"}
                                </span>

                              </div>

                            </div>
                          </div>

                          <div className="flex items-center gap-4">

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                status ===
                                "CONFIRMED"
                                  ? "bg-green-100 text-green-700"
                                  : status ===
                                    "CHECKED_IN"
                                  ? "bg-blue-100 text-blue-700"
                                  : status ===
                                    "CANCELLED"
                                  ? "bg-red-100 text-red-700"
                                  : status ===
                                    "REJECTED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {status}
                            </span>

                            <span className="font-semibold text-gray-900">
                              {formatMoney(
                                amount
                              )}
                            </span>

                          </div>

                        </div>
                      );
                    }
                  )}

              </div>
            )}

          </div>
        </section>

        {/* ====================================================
            STATUS SUMMARY
        ==================================================== */}

        <section className="mt-8 grid gap-5 md:grid-cols-3">

          {/* Pending */}

          <div className="rounded-xl bg-white p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="rounded-lg bg-yellow-100 p-3 text-yellow-600">
                <Clock size={21} />
              </div>

              <div>

                <p className="text-sm text-gray-500">
                  Pending applications
                </p>

                <p className="text-2xl font-bold text-gray-900">
                  {pendingGuesthouses.length}
                </p>

              </div>

            </div>

          </div>

          {/* Approved */}

          <div className="rounded-xl bg-white p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="rounded-lg bg-green-100 p-3 text-green-600">
                <CheckCircle size={21} />
              </div>

              <div>

                <p className="text-sm text-gray-500">
                  Approved guesthouses
                </p>

                <p className="text-2xl font-bold text-gray-900">
                  {approvedGuesthouses.length}
                </p>

              </div>

            </div>

          </div>

          {/* Rejected */}

          <div className="rounded-xl bg-white p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="rounded-lg bg-red-100 p-3 text-red-600">
                <XCircle size={21} />
              </div>

              <div>

                <p className="text-sm text-gray-500">
                  Rejected guesthouses
                </p>

                <p className="text-2xl font-bold text-gray-900">
                  {rejectedGuesthouses.length}
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* ====================================================
            PENDING RESERVATION NOTICE
        ==================================================== */}

        {pendingReservations.length > 0 && (

          <div className="mt-8 rounded-xl border border-yellow-200 bg-yellow-50 p-5">

            <div className="flex items-start gap-3">

              <Clock
                className="mt-0.5 shrink-0 text-yellow-600"
                size={21}
              />

              <div>

                <h3 className="font-semibold text-yellow-900">
                  Pending reservations
                </h3>

                <p className="mt-1 text-sm text-yellow-800">
                  You currently have{" "}
                  {pendingReservations.length}{" "}
                  pending reservation
                  {pendingReservations.length !==
                  1
                    ? "s"
                    : ""}{" "}
                  waiting for action.
                </p>

                <button
                  onClick={() =>
                    navigate(
                      "/owner/reservations"
                    )
                  }
                  className="mt-3 text-sm font-semibold text-yellow-900 underline"
                >
                  Review reservations
                </button>

              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            QUICK INFORMATION
        ==================================================== */}

        <section className="mt-8 rounded-xl bg-blue-600 p-6 text-white shadow-sm">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-xl font-bold">
                Manage your guesthouse business
              </h2>

              <p className="mt-2 max-w-2xl text-sm text-blue-100">
                Add guesthouses, manage rooms,
                monitor reservations and track
                your earnings from one place.
              </p>

            </div>

            <button
              onClick={() =>
                navigate(
                  "/owner/guesthouses"
                )
              }
              className="flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-blue-600 hover:bg-blue-50"
            >
              <Building2 size={18} />
              Manage Properties
            </button>

          </div>
        </section>

      </main>
    </div>
  );
}

/* ============================================================
   EXPORTS
   ============================================================

   IMPORTANT:

   App.jsx can now use:

   import { OwnerDashboard } from "./pages/Owner/Dashboard.jsx";

   OR:

   import OwnerDashboard from "./pages/Owner/Dashboard.jsx";
   ============================================================ */

export { OwnerDashboard };

export default OwnerDashboard;