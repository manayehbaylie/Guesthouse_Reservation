import React, { useEffect, useState, useCallback } from "react";
import { ApiService } from "../../services/api.js";
import {
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  FileText,
  Building2,
  AlertCircle,
} from "lucide-react";

export const GuestBookings = ({ onViewReceipt }) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const currentUser = ApiService.getCurrentUser();

      console.log("GuestBookings - current user:", currentUser);
      console.log("GuestBookings - user ID:", currentUser?.id);
      console.log("GuestBookings - token:", localStorage.getItem("token"));

      if (!currentUser?.id) {
        setReservations([]);
        setError("You are not logged in. Please log in again.");
        return;
      }

      /*
       * IMPORTANT:
       *
       * When backend mode is being used, ApiService.getReservations()
       * automatically calls:
       *
       * GET /api/guest/reservations
       *
       * That endpoint uses the authenticated user's ID.
       *
       * We therefore do NOT depend on manually filtering by guestId
       * here.
       */
      const list = await ApiService.getReservations();

      console.log(
        "GuestBookings - reservations returned:",
        list
      );

      const safeList = Array.isArray(list) ? list : [];

      /*
       * Extra frontend protection.
       *
       * If the API returns guestId, make sure we only show
       * this guest's reservations.
       */
      const myReservations = safeList.filter((reservation) => {
        if (!reservation?.guestId) {
          return true;
        }

        return (
          String(reservation.guestId) ===
          String(currentUser.id)
        );
      });

      setReservations(myReservations);
    } catch (err) {
      console.error(
        "Failed to load guest reservations:",
        err
      );

      setReservations([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load your reservations."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusStyle = (status) => {
    const normalized = String(status || "").toLowerCase();

    if (
      normalized === "confirmed" ||
      normalized === "paid"
    ) {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }

    if (
      normalized === "checked_in" ||
      normalized === "checked-in"
    ) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }

    if (
      normalized === "checked_out" ||
      normalized === "checked-out"
    ) {
      return "bg-stone-100 text-stone-700 border-stone-300";
    }

    if (normalized === "pending") {
      return "bg-amber-100 text-amber-800 border-amber-200";
    }

    if (normalized === "cancelled") {
      return "bg-red-100 text-red-800 border-red-200";
    }

    return "bg-stone-100 text-stone-700 border-stone-200";
  };

  const formatStatus = (status) => {
    return String(status || "pending")
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return String(date);
    }

    return parsed.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="border-b border-stone-200 pb-4">
          <h1 className="text-2xl font-bold font-serif text-stone-900">
            My Reservation History
          </h1>

          <p className="text-xs text-stone-500 mt-1">
            View your upcoming stays and payment receipts.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <div className="mx-auto w-9 h-9 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin" />

          <p className="mt-4 text-sm text-stone-500">
            Loading reservation records...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-200 pb-4 gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-stone-900">
            My Reservation History
          </h1>

          <p className="text-xs text-stone-500 mt-1">
            View your upcoming stays, checked-in status, and payment receipts.
          </p>
        </div>

        <div className="text-xs font-mono bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl font-semibold">
          Guest Account:{" "}
          {ApiService.getCurrentUser()?.name || "Guest"}
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />

          <div>
            <p className="text-sm font-bold text-red-800">
              Unable to load reservations
            </p>

            <p className="text-xs text-red-700 mt-1">
              {error}
            </p>

            <button
              type="button"
              onClick={loadData}
              className="mt-3 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* EMPTY */}
      {!error && reservations.length === 0 && (
        <div className="bg-stone-50 rounded-2xl p-12 text-center border border-stone-200 space-y-3">
          <Calendar className="w-12 h-12 text-stone-400 mx-auto" />

          <h3 className="font-bold text-stone-800 text-lg">
            No Reservations Found
          </h3>

          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            You have not booked any guesthouse stays yet.
            Search guesthouses to make your first online reservation.
          </p>
        </div>
      )}

      {/* RESERVATIONS */}
      {reservations.length > 0 && (
        <div className="space-y-4">

          {reservations.map((res) => {
            const totalPrice = Number(
              res.totalPrice || 0
            );

            const nights = Number(
              res.nightsCount || 0
            );

            return (
              <div
                key={res.id}
                className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >

                {/* RESERVATION INFORMATION */}
                <div className="space-y-3 flex-1">

                  <div className="flex flex-wrap items-center gap-2">

                    <span className="font-mono text-xs font-extrabold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-md">
                      {res.id}
                    </span>

                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${getStatusStyle(
                        res.status
                      )}`}
                    >
                      {formatStatus(res.status)}
                    </span>

                    {res.createdAt && (
                      <span className="text-xs text-stone-400 font-mono">
                        Booked on{" "}
                        {formatDate(res.createdAt)}
                      </span>
                    )}
                  </div>

                  {/* GUESTHOUSE */}
                  <div>
                    <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-amber-700" />

                      {res.guesthouseName ||
                        "Guesthouse"}
                    </h3>

                    <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-800" />

                      {res.guesthouseLocation ||
                        "Location unavailable"}
                    </p>

                    <p className="text-xs text-stone-500 mt-1">
                      Room{" "}
                      {res.roomNumber || "-"}{" "}
                      {res.roomType
                        ? `(${res.roomType})`
                        : ""}
                    </p>
                  </div>

                  {/* DATES */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200/80 w-fit">

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-800" />

                      <span>
                        {formatDate(
                          res.checkInDate
                        )}

                        {" → "}

                        {formatDate(
                          res.checkOutDate
                        )}
                      </span>
                    </div>

                    <span className="text-stone-300">
                      |
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-stone-500" />

                      <span className="font-semibold text-stone-900">
                        {nights} Night
                        {nights !== 1
                          ? "s"
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* PRICE + RECEIPT */}
                <div className="flex md:flex-col justify-between items-end gap-4 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-stone-100">

                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                      Total Paid
                    </span>

                    <span className="text-xl font-mono font-extrabold text-amber-900">
                      {totalPrice.toLocaleString()}{" "}
                      <span className="text-xs font-normal text-stone-600">
                        ETB
                      </span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onViewReceipt) {
                        onViewReceipt(res);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-300 font-semibold text-xs rounded-xl shadow-sm transition-colors border border-stone-700"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />

                    View Receipt
                  </button>
                </div>
              </div>
            );
          })}

        </div>
      )}
    </div>
  );
};

export default GuestBookings;