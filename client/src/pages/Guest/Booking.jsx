import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApiService } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  CreditCard,
  Printer,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

const ETHIOPIAN_BANKS = [
  "Commercial Bank of Ethiopia (CBE)",
  "Awash Bank",
  "Dashen Bank",
  "Bank of Abyssinia",
  "Zemen Bank",
  "PRIDE Microfinance",
];

export function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const guesthouseId = searchParams.get("guesthouseId");
  const roomId = searchParams.get("roomId");

  const [guesthouse, setGuesthouse] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("TELEBIRR");
  const [telebirrPhone, setTelebirrPhone] = useState(user?.phone || "");
  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const [step, setStep] = useState("checkout");
  const [error, setError] = useState("");
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    const loadBookingData = async () => {
      setLoading(true);

      try {
        if (!guesthouseId) {
          throw new Error("Guesthouse was not selected.");
        }

        const gh = await ApiService.getGuesthouseById(guesthouseId);

        if (!gh) {
          throw new Error("Guesthouse not found.");
        }

        setGuesthouse(gh);

        const rooms = await ApiService.getRoomsForGuesthouse(gh.id);

        const selectedRoom =
          rooms.find(
            (item) => String(item.id) === String(roomId)
          ) || rooms[0];

        if (!selectedRoom) {
          throw new Error("No room is available.");
        }

        setRoom(selectedRoom);

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(today.getDate() + 2);

        setCheckInDate(toDateInput(today));
        setCheckOutDate(toDateInput(tomorrow));

        if (dayAfterTomorrow <= tomorrow) {
          setCheckOutDate(toDateInput(dayAfterTomorrow));
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Unable to load booking information.");
      } finally {
        setLoading(false);
      }
    };

    loadBookingData();
  }, [guesthouseId, roomId]);

  const nightsCount = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0;

    const start = new Date(`${checkInDate}T12:00:00`);
    const end = new Date(`${checkOutDate}T12:00:00`);

    const difference =
      (end.getTime() - start.getTime()) /
      (1000 * 60 * 60 * 24);

    return Math.max(0, Math.round(difference));
  }, [checkInDate, checkOutDate]);

  const pricePerNight = Number(
    room?.pricePerNight ?? room?.price ?? 0
  );

  const totalPrice = pricePerNight * nightsCount;

  function validatePayment() {
    if (!checkInDate || !checkOutDate) {
      return "Please select your check-in and check-out dates.";
    }

    if (nightsCount <= 0) {
      return "Check-out date must be after check-in date.";
    }

    if (paymentMethod === "TELEBIRR") {
      if (!telebirrPhone.trim()) {
        return "Please enter your Telebirr mobile number.";
      }
    }

    if (paymentMethod === "CBE_BIRR") {
      if (!selectedBank) {
        return "Please select your bank.";
      }

      if (!accountNumber.trim()) {
        return "Please enter your bank account number.";
      }
    }

    return null;
  }

  const handlePayment = async (event) => {
    event.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    const validationError = validatePayment();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setStep("processing");

    try {
      const paymentPhone =
        paymentMethod === "TELEBIRR"
          ? telebirrPhone
          : accountNumber;

      const result = await ApiService.createBookingAndPay({
        guesthouseId,
        roomId,
        checkInDate,
        checkOutDate,
        nightsCount,
        paymentMethod,
        phone: paymentPhone,
        bankName:
          paymentMethod === "CBE_BIRR"
            ? selectedBank
            : null,
        accountNumber:
          paymentMethod === "CBE_BIRR"
            ? accountNumber
            : null,
      });

      setResultData(result);
      setStep("success");
    } catch (err) {
      console.error("Booking/payment error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Booking or payment failed. Please try again."
      );

      setStep("checkout");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-stone-500">
            Loading booking details...
          </p>
        </div>
      </div>
    );
  }

  if (!guesthouse || !room) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />

          <h2 className="mt-4 text-xl font-black text-stone-900">
            Booking unavailable
          </h2>

          <p className="mt-2 text-sm text-stone-500">
            {error || "The selected room could not be found."}
          </p>

          <button
            onClick={() => navigate("/search")}
            className="mt-6 px-5 py-3 rounded-xl bg-stone-900 text-white font-bold text-sm"
          >
            Back to Guesthouses
          </button>
        </div>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <div className="bg-white border border-stone-200 rounded-3xl p-10 text-center shadow-sm">
          <div className="w-14 h-14 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin mx-auto" />

          <h2 className="mt-6 text-xl font-black text-stone-900">
            Processing your booking
          </h2>

          <p className="mt-2 text-sm text-stone-500">
            Please wait while we confirm your payment and reserve the room.
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-emerald-600 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            Double-booking protection enabled
          </div>
        </div>
      </div>
    );
  }

  if (step === "success" && resultData) {
    const reservation = resultData.reservation || {};
    const payment = resultData.payment || {};

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white border border-emerald-200 rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-emerald-50 px-6 py-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h1 className="mt-4 text-2xl font-black text-stone-900">
              Booking Confirmed!
            </h1>

            <p className="mt-2 text-sm text-stone-600">
              Your room has been reserved successfully.
            </p>
          </div>

          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-amber-600" />

              <div>
                <p className="text-xs text-stone-500">
                  Guesthouse
                </p>

                <p className="font-bold text-stone-900">
                  {guesthouse.name}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 bg-stone-50 rounded-2xl p-5">
              <InfoItem
                label="Room"
                value={`Room ${room.roomNumber}`}
              />

              <InfoItem
                label="Room Type"
                value={room.type || room.roomType}
              />

              <InfoItem
                label="Check-in"
                value={checkInDate}
              />

              <InfoItem
                label="Check-out"
                value={checkOutDate}
              />

              <InfoItem
                label="Nights"
                value={String(nightsCount)}
              />

              <InfoItem
                label="Payment"
                value={
                  paymentMethod === "TELEBIRR"
                    ? "Telebirr"
                    : `${selectedBank} — Bank Transfer`
                }
              />
            </div>

            <div className="border-t border-stone-200 pt-5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-stone-700">
                  Total Paid
                </span>

                <span className="text-2xl font-black text-emerald-600">
                  {totalPrice.toLocaleString()} ETB
                </span>
              </div>
            </div>

            {payment.referenceNumber && (
              <div className="bg-stone-50 rounded-2xl p-4">
                <p className="text-xs text-stone-500">
                  Payment Reference
                </p>

                <p className="font-mono font-bold text-stone-900 mt-1">
                  {payment.referenceNumber}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl bg-stone-900 text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>

              <button
                onClick={() => navigate("/reservations")}
                className="flex-1 py-3 rounded-xl bg-amber-500 text-stone-950 font-bold text-sm"
              >
                View My Reservations
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-900">
          Complete Your Booking
        </h1>

        <p className="mt-2 text-sm text-stone-500">
          Reserve your room securely and choose your preferred Ethiopian payment method.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />

          <span className="text-sm font-medium">
            {error}
          </span>
        </div>
      )}

      <form
        onSubmit={handlePayment}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 space-y-6">
          {/* Guesthouse summary */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
            <h2 className="text-lg font-black text-stone-900 mb-5">
              Your Reservation
            </h2>

            <div className="flex gap-4">
              {guesthouse.images?.[0] && (
                <img
                  src={guesthouse.images[0]}
                  alt={guesthouse.name}
                  className="w-28 h-24 object-cover rounded-2xl"
                />
              )}

              <div>
                <h3 className="font-black text-stone-900">
                  {guesthouse.name}
                </h3>

                <p className="text-xs text-stone-500 mt-1">
                  {guesthouse.city}
                </p>

                <p className="text-xs text-stone-500 mt-2">
                  Room {room.roomNumber} ·{" "}
                  {room.type || room.roomType}
                </p>

                <p className="text-sm font-bold text-amber-600 mt-2">
                  {pricePerNight.toLocaleString()} ETB / night
                </p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
            <h2 className="text-lg font-black text-stone-900">
              1. Reservation Dates
            </h2>

            <div className="grid sm:grid-cols-2 gap-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">
                  Check-In
                </label>

                <input
                  type="date"
                  required
                  min={toDateInput(new Date())}
                  value={checkInDate}
                  onChange={(e) => {
                    setCheckInDate(e.target.value);

                    if (
                      checkOutDate &&
                      e.target.value >= checkOutDate
                    ) {
                      setCheckOutDate("");
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">
                  Check-Out
                </label>

                <input
                  type="date"
                  required
                  min={
                    checkInDate ||
                    toDateInput(new Date())
                  }
                  value={checkOutDate}
                  onChange={(e) =>
                    setCheckOutDate(e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            {nightsCount > 0 && (
              <div className="mt-4 bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-800 font-semibold">
                {nightsCount} night
                {nightsCount !== 1 ? "s" : ""} selected
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
            <h2 className="text-lg font-black text-stone-900">
              2. Select Payment Method
            </h2>

            <div className="grid sm:grid-cols-2 gap-4 mt-5">
              <button
                type="button"
                onClick={() => setPaymentMethod("TELEBIRR")}
                className={`p-5 rounded-2xl border-2 text-left transition ${
                  paymentMethod === "TELEBIRR"
                    ? "border-blue-600 bg-blue-50"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <Smartphone className="w-7 h-7 text-blue-600 mb-3" />

                <div className="font-black text-stone-900">
                  Telebirr
                </div>

                <p className="text-xs text-stone-500 mt-1">
                  Pay using your Telebirr mobile account.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CBE_BIRR")}
                className={`p-5 rounded-2xl border-2 text-left transition ${
                  paymentMethod === "CBE_BIRR"
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <CreditCard className="w-7 h-7 text-emerald-600 mb-3" />

                <div className="font-black text-stone-900">
                  Bank Transfer
                </div>

                <p className="text-xs text-stone-500 mt-1">
                  Transfer from an Ethiopian bank account.
                </p>
              </button>
            </div>

            {paymentMethod === "TELEBIRR" && (
              <div className="mt-6">
                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">
                  Mobile Number for Confirmation
                </label>

                <input
                  type="tel"
                  required
                  value={telebirrPhone}
                  onChange={(e) =>
                    setTelebirrPhone(e.target.value)
                  }
                  placeholder="09XXXXXXXX"
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <p className="text-xs text-stone-500 mt-2">
                  Enter the phone number connected to your Telebirr account.
                </p>
              </div>
            )}

            {paymentMethod === "CBE_BIRR" && (
              <div className="mt-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase mb-2">
                    Select Bank
                  </label>

                  <select
                    required
                    value={selectedBank}
                    onChange={(e) =>
                      setSelectedBank(e.target.value)
                    }
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">
                      Select your bank
                    </option>

                    {ETHIOPIAN_BANKS.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase mb-2">
                    Account Number
                  </label>

                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) =>
                      setAccountNumber(e.target.value)
                    }
                    placeholder="Enter your bank account number"
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {selectedBank && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800">
                    You selected{" "}
                    <strong>{selectedBank}</strong>.
                    Enter your account number above to continue.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="bg-stone-900 text-white rounded-3xl p-6 sticky top-24">
            <h2 className="text-lg font-black">
              Booking Summary
            </h2>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-stone-400">
                  Room
                </span>

                <span className="font-bold text-right">
                  {room.roomNumber}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-stone-400">
                  Price / night
                </span>

                <span className="font-bold">
                  {pricePerNight.toLocaleString()} ETB
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-stone-400">
                  Nights
                </span>

                <span className="font-bold">
                  {nightsCount}
                </span>
              </div>

              <div className="border-t border-stone-700 pt-5 flex justify-between">
                <span className="font-bold">
                  Total
                </span>

                <span className="text-xl font-black text-amber-400">
                  {totalPrice.toLocaleString()} ETB
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={nightsCount <= 0}
              className="w-full mt-7 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-stone-600 disabled:text-stone-400 text-stone-950 font-black text-sm transition"
            >
              Payment & Confirmation
            </button>

            <div className="mt-5 flex items-start gap-2 text-xs text-stone-400">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />

              <span>
                Your room is checked for availability before the reservation is confirmed.
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-stone-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-stone-900">
        {value || "-"}
      </p>
    </div>
  );
}

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default Booking;