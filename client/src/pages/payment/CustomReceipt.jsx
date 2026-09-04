
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Receipt,
  ArrowRight,
  Home,
  CreditCard,
  Hash,
  CalendarDays,
  Banknote,
} from "lucide-react";

export default function CustomReceipt() {
  const location = useLocation();
  const navigate = useNavigate();

  const payment = location.state?.payment;
  const txRef = location.state?.txRef;

  // If receipt data is missing, don't show an empty receipt
  if (!payment) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl bg-white border border-stone-200 shadow-xl p-8 text-center">

          <Receipt className="mx-auto h-14 w-14 text-stone-400" />

          <h1 className="mt-5 text-2xl font-black text-stone-900">
            Receipt Unavailable
          </h1>

          <p className="mt-3 text-sm text-stone-600">
            Payment receipt information could not be found.
          </p>

          <button
            type="button"
            onClick={() => navigate("/guest/dashboard", { replace: true })}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-5 py-4 text-sm font-black text-white hover:bg-stone-800"
          >
            Go to Dashboard
            <ArrowRight className="h-5 w-5" />
          </button>

        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * PAYMENT DATA
   * ============================================================
   */

  const amount =
    payment.amount ??
    payment.totalAmount ??
    payment.total ??
    payment.amountPaid ??
    0;

  const currency =
    payment.currency || "ETB";

  const reference =
    payment.tx_ref ||
    payment.txRef ||
    payment.transactionReference ||
    txRef ||
    "N/A";

  const paymentMethod =
    payment.paymentMethod ||
    payment.method ||
    payment.channel ||
    "CHAPA";

  const reservationId =
    payment.reservationId ||
    payment.reservation?.id ||
    "N/A";

  const paymentDate =
    payment.paidAt ||
    payment.updatedAt ||
    payment.createdAt;

  const formatDate = (date) => {
    if (!date) return "N/A";

    try {
      return new Date(date).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(date);
    }
  };

  /*
   * ============================================================
   * CUSTOM RECEIPT
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-2xl">

        {/* SUCCESS ICON */}

        <div className="mb-6 text-center">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2
              className="h-12 w-12 text-emerald-600"
              strokeWidth={2}
            />
          </div>

          <h1 className="mt-5 text-3xl font-black text-stone-900">
            Payment Successful
          </h1>

          <p className="mt-2 text-sm text-stone-600">
            Your payment has been successfully verified.
          </p>

        </div>

        {/* ======================================================
            RECEIPT
        ====================================================== */}

        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl">

          {/* RECEIPT HEADER */}

          <div className="bg-stone-900 px-6 py-7 text-white sm:px-8">

            <div className="flex items-center justify-between">

              <div>

                <div className="flex items-center gap-2">
                  <Receipt className="h-6 w-6" />

                  <span className="text-sm font-black uppercase tracking-widest">
                    Payment Receipt
                  </span>
                </div>

                <h2 className="mt-3 text-2xl font-black">
                  Guesthouse Reservation
                </h2>

              </div>

              <div className="rounded-full bg-emerald-500/20 px-4 py-2">
                <span className="text-sm font-black text-emerald-300">
                  PAID
                </span>
              </div>

            </div>

          </div>

          {/* AMOUNT */}

          <div className="border-b border-stone-200 px-6 py-8 text-center">

            <p className="text-xs font-black uppercase tracking-widest text-stone-500">
              Amount Paid
            </p>

            <div className="mt-3">

              <span className="text-4xl font-black text-stone-900">
                {Number(amount).toLocaleString()}
              </span>

              <span className="ml-2 text-xl font-black text-stone-500">
                {currency}
              </span>

            </div>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">

              <CheckCircle2 className="h-4 w-4" />

              Payment Confirmed

            </div>

          </div>

          {/* TRANSACTION DETAILS */}

          <div className="px-6 py-8 sm:px-8">

            <h3 className="text-lg font-black text-stone-900">
              Transaction Details
            </h3>

            <div className="mt-5 space-y-4">

              {/* TRANSACTION REFERENCE */}

              <div className="flex items-center gap-4 rounded-2xl bg-stone-50 p-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Hash className="h-5 w-5 text-stone-700" />
                </div>

                <div className="min-w-0">

                  <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
                    Transaction Reference
                  </p>

                  <p className="mt-1 break-all text-sm font-black text-stone-900">
                    {reference}
                  </p>

                </div>

              </div>

              {/* RESERVATION */}

              <div className="flex items-center gap-4 rounded-2xl bg-stone-50 p-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Receipt className="h-5 w-5 text-stone-700" />
                </div>

                <div>

                  <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
                    Reservation ID
                  </p>

                  <p className="mt-1 text-sm font-black text-stone-900">
                    {reservationId}
                  </p>

                </div>

              </div>

              {/* PAYMENT METHOD */}

              <div className="flex items-center gap-4 rounded-2xl bg-stone-50 p-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <CreditCard className="h-5 w-5 text-stone-700" />
                </div>

                <div>

                  <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
                    Payment Method
                  </p>

                  <p className="mt-1 text-sm font-black text-stone-900">
                    {paymentMethod}
                  </p>

                </div>

              </div>

              {/* DATE */}

              <div className="flex items-center gap-4 rounded-2xl bg-stone-50 p-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <CalendarDays className="h-5 w-5 text-stone-700" />
                </div>

                <div>

                  <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
                    Payment Date
                  </p>

                  <p className="mt-1 text-sm font-black text-stone-900">
                    {formatDate(paymentDate)}
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* SUCCESS MESSAGE */}

          <div className="mx-6 mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:mx-8">

            <div className="flex gap-3">

              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />

              <div>

                <p className="font-black text-emerald-900">
                  Your payment is confirmed
                </p>

                <p className="mt-1 text-sm leading-6 text-emerald-800">
                  Your payment has been successfully verified.
                  Please keep this receipt for your records.
                </p>

              </div>

            </div>

          </div>

          {/* ======================================================
              DASHBOARD BUTTON
          ====================================================== */}

          <div className="border-t border-stone-200 bg-stone-50 px-6 py-6 sm:px-8">

            <button
              type="button"
              onClick={() =>
                navigate("/guest/dashboard", {
                  replace: true,
                  state: {
                    paymentStatus: "PAID",
                    payment,
                  },
                })
              }
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-stone-900 px-6 py-4 text-sm font-black text-white shadow-lg transition hover:bg-stone-800"
            >

              <Home className="h-5 w-5" />

              Go to Guest Dashboard

              <ArrowRight className="h-5 w-5" />

            </button>

            <p className="mt-3 text-center text-xs text-stone-500">
              You can continue to your dashboard whenever you are ready.
            </p>

          </div>

        </div>

      </div>

    </main>
  );
}

