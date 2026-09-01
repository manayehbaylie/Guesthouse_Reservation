import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { ApiService } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { DashboardLayout } from "../../components/DashboardLayout.jsx";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  CreditCard,
  Printer,
  ShieldCheck,
  Smartphone,
  Users,
  Calendar,
  ChevronDown,
  Landmark,
} from "lucide-react";

const ETHIOPIAN_BANKS = [
  "CBE",
  "Awash Bank",
  "Dashen Bank",
  "Bank of Abyssinia",
  "Zemen Bank",
  "PRIDE Microfinance",
];

export function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const guesthouseId = searchParams.get("guesthouseId");
  const roomIdFromUrl = searchParams.get("roomId");

  const [guesthouse, setGuesthouse] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [maxGuests, setMaxGuests] = useState(4);

  const [paymentMethod, setPaymentMethod] = useState("TELEBIRR");
  const [telebirrPhone, setTelebirrPhone] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const [step, setStep] = useState("checkout");
  const [error, setError] = useState("");
  const [resultData, setResultData] = useState(null);

  const cameFromLogin = location.state?.fromLogin || false;
  const showConfirmation = location.state?.showConfirmation || false;

  // Brand Colors
  const brandColors = {
    primary: "#043658",      // Navy Blue
    secondary: "#FFC107",    // Amber/Gold
    lightBg: "#f5f8fa",      // Light Gray
    border: "#e5edf2",       // Border Gray
    text: "#043658",         // Navy Text
    textSecondary: "#647b8a", // Slate Text
    white: "#ffffff",
  };

  useEffect(() => {
    if (cameFromLogin && showConfirmation && resultData) {
      setStep("success");
    }
  }, [cameFromLogin, showConfirmation, resultData]);

  useEffect(() => {
    if (cameFromLogin && location.state?.bookingData && !resultData && !loading) {
      const savedData = location.state.bookingData;
      
      setGuesthouse(savedData.guesthouse || null);
      setRoom(savedData.room || null);
      setCheckInDate(savedData.checkInDate || "");
      setCheckOutDate(savedData.checkOutDate || "");
      setNumberOfGuests(savedData.numberOfGuests || 1);
      setPaymentMethod(savedData.paymentMethod || "TELEBIRR");
      setTelebirrPhone(savedData.telebirrPhone || "");
      setSelectedBank(savedData.selectedBank || "");
      setAccountNumber(savedData.accountNumber || "");
      
      if (savedData.room?.maxGuests) {
        setMaxGuests(savedData.room.maxGuests);
      } else if (savedData.room?.capacity) {
        setMaxGuests(savedData.room.capacity);
      }
    }
  }, [cameFromLogin, location.state, resultData, loading]);

  useEffect(() => {
    let mounted = true;

    const loadBookingData = async () => {
      setLoading(true);
      setError("");

      try {
        if (cameFromLogin && location.state?.bookingData) {
          const savedData = location.state.bookingData;
          
          setGuesthouse(savedData.guesthouse || null);
          setRoom(savedData.room || null);
          setCheckInDate(savedData.checkInDate || "");
          setCheckOutDate(savedData.checkOutDate || "");
          setNumberOfGuests(savedData.numberOfGuests || 1);
          setPaymentMethod(savedData.paymentMethod || "TELEBIRR");
          setTelebirrPhone(savedData.telebirrPhone || "");
          setSelectedBank(savedData.selectedBank || "");
          setAccountNumber(savedData.accountNumber || "");
          
          if (savedData.room?.maxGuests) {
            setMaxGuests(savedData.room.maxGuests);
          } else if (savedData.room?.capacity) {
            setMaxGuests(savedData.room.capacity);
          }
          
          setLoading(false);
          return;
        }

        if (!guesthouseId) {
          throw new Error("Guesthouse was not selected.");
        }

        const gh = await ApiService.getGuesthouseById(guesthouseId);

        if (!gh) {
          throw new Error("Guesthouse not found.");
        }

        if (!mounted) return;
        setGuesthouse(gh);

        const rooms = await ApiService.getRoomsForGuesthouse(gh.id);

        if (!Array.isArray(rooms) || rooms.length === 0) {
          throw new Error("No room is available for this guesthouse.");
        }

        const selectedRoom =
          rooms.find(
            (item) =>
              String(item.id) === String(roomIdFromUrl)
          ) || rooms[0];

        if (!selectedRoom) {
          throw new Error("No room is available.");
        }

        if (!mounted) return;

        setRoom(selectedRoom);
        
        if (selectedRoom.maxGuests) {
          setMaxGuests(selectedRoom.maxGuests);
        } else if (selectedRoom.capacity) {
          setMaxGuests(selectedRoom.capacity);
        }

        if (user?.phone) {
          setTelebirrPhone(user.phone);
        }
      } catch (err) {
        console.error("Failed to load booking data:", err);

        if (mounted) {
          setError(
            err?.message ||
              "Unable to load booking information."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadBookingData();

    return () => {
      mounted = false;
    };
  }, [guesthouseId, roomIdFromUrl, cameFromLogin, location.state]);

  useEffect(() => {
    if (user?.phone && !telebirrPhone) {
      setTelebirrPhone(user.phone);
    }
  }, [user?.phone]);

  const nightsCount = useMemo(() => {
    if (!checkInDate || !checkOutDate) {
      return 0;
    }

    const start = new Date(`${checkInDate}T12:00:00`);
    const end = new Date(`${checkOutDate}T12:00:00`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return 0;
    }

    const difference =
      (end.getTime() - start.getTime()) /
      (1000 * 60 * 60 * 24);

    return Math.max(0, Math.round(difference));
  }, [checkInDate, checkOutDate]);

  const pricePerNight = Number(
    room?.pricePerNight ??
      room?.price ??
      room?.amount ??
      0
  );

  const totalPrice = pricePerNight * nightsCount;

  const todayString = toDateInput(new Date());

  const minimumCheckOutDate = checkInDate
    ? getNextDate(checkInDate)
    : todayString;

  function validatePayment() {
    if (!checkInDate || !checkOutDate) {
      return "Please select your check-in and check-out dates.";
    }

    if (checkInDate < todayString) {
      return "Check-in date cannot be in the past.";
    }

    if (checkOutDate <= checkInDate) {
      return "Check-out date must be after check-in date.";
    }

    if (nightsCount <= 0) {
      return "Please select a valid stay duration.";
    }

    if (numberOfGuests < 1) {
      return "Please select at least 1 guest.";
    }

    if (numberOfGuests > maxGuests) {
      return `Maximum ${maxGuests} guests allowed for this room.`;
    }

    if (!room?.id) {
      return "The selected room could not be identified.";
    }

    if (pricePerNight <= 0) {
      return "The selected room does not have a valid price.";
    }

    if (paymentMethod === "TELEBIRR") {
      if (!telebirrPhone.trim()) {
        return "Please enter your Telebirr mobile number.";
      }
    }

    if (paymentMethod === "BANK_TRANSFER") {
      if (!selectedBank) {
        return "Please select your bank.";
      }

      if (!accountNumber.trim()) {
        return "Please enter your bank account number.";
      }
    }

    return null;
  }

  const handlePaymentAndConfirmation = async (event) => {
    event.preventDefault();

    setError("");

    const validationError = validatePayment();

    if (validationError) {
      setError(validationError);
      return;
    }

    const reservationData = {
      guesthouse: guesthouse,
      room: room,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      numberOfGuests: numberOfGuests,
      paymentMethod: paymentMethod,
      telebirrPhone: telebirrPhone,
      selectedBank: selectedBank,
      accountNumber: accountNumber,
      guesthouseId: guesthouse?.id,
      roomId: room?.id,
      nightsCount: nightsCount,
      totalPrice: totalPrice,
      pricePerNight: pricePerNight,
    };

    if (!user) {
      sessionStorage.setItem('pendingReservation', JSON.stringify(reservationData));
      
      navigate("/login", {
        state: {
          from: `/booking?guesthouseId=${guesthouse?.id}&roomId=${room?.id}`,
          reservationData: reservationData,
          pendingReservation: true,
        },
      });
      return;
    }

    try {
      setStep("processing");

      const selectedRoomId = room.id;

      const paymentPhone =
        paymentMethod === "TELEBIRR"
          ? telebirrPhone.trim()
          : accountNumber.trim();

      const bookingPayload = {
        guesthouseId: guesthouse.id,
        roomId: selectedRoomId,
        checkInDate,
        checkOutDate,
        nightsCount,
        numberOfGuests,
        paymentMethod,
        phone: paymentPhone,
        bankName:
          paymentMethod === "BANK_TRANSFER"
            ? selectedBank
            : null,
        accountNumber:
          paymentMethod === "BANK_TRANSFER"
            ? accountNumber.trim()
            : null,
      };

      console.log(
        "Creating booking with payload:",
        bookingPayload
      );

      const result =
        await ApiService.createBookingAndPay(
          bookingPayload
        );

      console.log(
        "Booking created successfully:",
        result
      );

      if (!result) {
        throw new Error(
          "The booking request completed but no booking information was returned."
        );
      }

      setResultData(result);

      window.dispatchEvent(
        new CustomEvent("reservation-created", {
          detail: {
            reservation:
              result?.reservation || null,
            payment:
              result?.payment || null,
            result,
          },
        })
      );

      sessionStorage.removeItem('pendingReservation');

      setStep("success");
    } catch (err) {
      console.error(
        "Booking/payment error:",
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Booking or payment failed. Please try again.";

      setError(message);
      setStep("checkout");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#e5edf2] border-t-[#FFC107] rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-base text-[#647b8a]">
            Loading booking details...
          </p>
        </div>
      </div>
    );
  }

  if (!guesthouse || !room) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-white border border-[#e5edf2] rounded-3xl p-8 shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-2xl font-black text-[#043658]">
            Booking unavailable
          </h2>
          <p className="mt-2 text-base text-[#647b8a]">
            {error ||
              "The selected room could not be found."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/search")}
            className="mt-6 px-6 py-4 rounded-xl bg-[#043658] text-white font-bold text-base hover:bg-[#0b2f4a] transition"
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
        <div className="bg-white border border-[#e5edf2] rounded-3xl p-10 text-center shadow-sm">
          <div className="w-16 h-16 border-4 border-[#e5edf2] border-t-[#FFC107] rounded-full animate-spin mx-auto" />
          <h2 className="mt-6 text-2xl font-black text-[#043658]">
            Processing your booking
          </h2>
          <p className="mt-2 text-base text-[#647b8a]">
            Please wait while we confirm your payment and
            reserve the room.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-emerald-600 font-semibold">
            <ShieldCheck className="w-5 h-5" />
            Double-booking protection enabled
          </div>
        </div>
      </div>
    );
  }

  if (step === "success" && resultData) {
    const reservation =
      resultData.reservation || {};
    const payment =
      resultData.payment || {};
    const confirmedTotal = Number(
      reservation.totalPrice ??
        reservation.totalAmount ??
        payment.amount ??
        totalPrice
    );

    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-emerald-200 rounded-3xl shadow-xl overflow-hidden">

            <div className="bg-emerald-50 px-6 py-10 text-center">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h1 className="mt-4 text-3xl font-black text-[#043658]">
                Booking Confirmed!
              </h1>
              <p className="mt-2 text-base text-[#647b8a]">
                Your room has been reserved successfully.
              </p>
            </div>

            <div className="p-8 space-y-6">
              {(reservation.id || reservation.reservationId) && (
                <div className="bg-[#FFC107]/10 border border-[#FFC107]/20 rounded-2xl p-4">
                  <p className="text-sm text-[#FFC107] font-semibold">Reservation ID</p>
                  <p className="mt-1 font-mono font-black text-[#043658] text-lg">
                    {reservation.id || reservation.reservationId}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4">
                <Building2 className="w-6 h-6 text-[#FFC107]" />
                <div>
                  <p className="text-sm text-[#647b8a]">Guesthouse</p>
                  <p className="text-xl font-bold text-[#043658]">
                    {reservation.guesthouseName || guesthouse.name}
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 bg-[#f5f8fa] rounded-2xl p-6">
                <InfoItem label="Room" value={`Room ${reservation.roomNumber || room.roomNumber || "-"}`} />
                <InfoItem label="Room Type" value={reservation.roomType || room.type || room.roomType} />
                <InfoItem label="Guests" value={String(reservation.numberOfGuests || numberOfGuests)} />
                <InfoItem label="Check-in" value={reservation.checkInDate || checkInDate} />
                <InfoItem label="Check-out" value={reservation.checkOutDate || checkOutDate} />
                <InfoItem label="Nights" value={String(reservation.nightsCount ?? nightsCount)} />
                <InfoItem label="Payment" value={paymentMethod === "TELEBIRR" ? "Telebirr" : paymentMethod === "BANK_TRANSFER" ? "Bank Transfer" : paymentMethod === "CHAPA" ? "Chapa" : "Card"} />
              </div>

              <div className="border-t border-[#e5edf2] pt-5">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-[#043658]">Total Paid</span>
                  <span className="text-3xl font-black text-emerald-600">
                    {Number(confirmedTotal || 0).toLocaleString()} ETB
                  </span>
                </div>
              </div>

              {(payment.referenceNumber || payment.reference || reservation.paymentReference || reservation.referenceNumber) && (
                <div className="bg-[#f5f8fa] rounded-2xl p-4">
                  <p className="text-sm text-[#647b8a]">Payment Reference</p>
                  <p className="font-mono font-bold text-[#043658] mt-1 text-lg">
                    {payment.referenceNumber || payment.reference || reservation.paymentReference || reservation.referenceNumber}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-4 rounded-xl bg-[#043658] text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-[#0b2f4a] transition"
                >
                  <Printer className="w-5 h-5" />
                  Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/reservations")}
                  className="flex-1 py-4 rounded-xl bg-[#FFC107] hover:bg-[#ffb300] text-[#043658] font-bold text-base transition"
                >
                  View My Reservations
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ============================================================
  // CHECKOUT - MAIN RESERVATION FORM WITH BRAND COLORS
  // ============================================================

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">

        {error && (
          <div className="mb-6 p-5 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <span className="text-base font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handlePaymentAndConfirmation}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ============================================================
                LEFT COLUMN - Check Your Stay (WITH BRAND COLORS)
            ============================================================ */}
            <div className="bg-white rounded-3xl border border-[#e5edf2] p-6 shadow-sm">
              <h2 className="text-xl font-black text-[#043658] flex items-center gap-2 mb-4">
                <Calendar className="w-6 h-6 text-[#FFC107]" />
                Check Your Stay
              </h2>

              <p className="text-sm text-[#647b8a] mb-4">
                Select your dates and number of guests before continuing.
              </p>

              {/* DATES */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#043658] uppercase mb-1">Check-in</label>
                  <input
                    type="date"
                    required
                    min={todayString}
                    value={checkInDate}
                    onChange={(e) => {
                      const newCheckIn = e.target.value;
                      setCheckInDate(newCheckIn);
                      if (!checkOutDate || checkOutDate <= newCheckIn) {
                        setCheckOutDate(getNextDate(newCheckIn));
                      }
                    }}
                    className="w-full px-3 py-3 rounded-xl border border-[#e5edf2] text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#043658] uppercase mb-1">Check-out</label>
                  <input
                    type="date"
                    required
                    min={minimumCheckOutDate}
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-[#e5edf2] text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
                  />
                </div>
              </div>

              {/* NUMBER OF GUESTS */}
              <div className="mt-4">
                <label className="block text-xs font-bold text-[#043658] uppercase mb-1">Number of Guests</label>
                <div className="relative">
                  <select
                    value={numberOfGuests}
                    onChange={(e) => setNumberOfGuests(Number(e.target.value))}
                    className="w-full px-3 py-3 rounded-xl border border-[#e5edf2] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107] appearance-none"
                  >
                    {[...Array(Math.min(maxGuests, 10))].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} {i === 0 ? "guest" : "guests"}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#647b8a] pointer-events-none" />
                </div>
                <p className="text-xs text-[#647b8a] mt-1">
                  Maximum {maxGuests} guests for this room.
                </p>
              </div>

              {nightsCount > 0 && (
                <div className="mt-3 bg-[#FFC107]/10 rounded-xl px-3 py-2 text-sm text-[#043658] font-semibold">
                  {nightsCount} night{nightsCount !== 1 ? "s" : ""} selected
                </div>
              )}
            </div>

            {/* ============================================================
                RIGHT COLUMN - Payment Method (WITH BRAND COLORS)
            ============================================================ */}
            <div className="bg-white rounded-3xl border border-[#e5edf2] p-6 shadow-sm flex flex-col">
              <h2 className="text-xl font-black text-[#043658] mb-4">Payment Method</h2>

              <div className="space-y-3 flex-1">
                {/* TELEBIRR */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("TELEBIRR")}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition flex items-center gap-3 ${
                    paymentMethod === "TELEBIRR"
                      ? "border-blue-600 bg-blue-50"
                      : "border-[#e5edf2] hover:border-[#FFC107]"
                  }`}
                >
                  <Smartphone className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="font-bold text-[#043658]">Telebirr</div>
                    <div className="text-xs text-[#647b8a]">Pay using your Telebirr mobile account.</div>
                  </div>
                </button>

                {/* CHAPA */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CHAPA")}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition flex items-center gap-3 ${
                    paymentMethod === "CHAPA"
                      ? "border-purple-600 bg-purple-50"
                      : "border-[#e5edf2] hover:border-[#FFC107]"
                  }`}
                >
                  <CreditCard className="w-6 h-6 text-purple-600" />
                  <div>
                    <div className="font-bold text-[#043658]">Chapa</div>
                    <div className="text-xs text-[#647b8a]">Pay using Chapa payment gateway.</div>
                  </div>
                </button>

                {/* BANK TRANSFER */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("BANK_TRANSFER")}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition flex items-center gap-3 ${
                    paymentMethod === "BANK_TRANSFER"
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-[#e5edf2] hover:border-[#FFC107]"
                  }`}
                >
                  <Landmark className="w-6 h-6 text-emerald-600" />
                  <div>
                    <div className="font-bold text-[#043658]">Bank Transfer</div>
                    <div className="text-xs text-[#647b8a]">Transfer from any Ethiopian bank account.</div>
                  </div>
                </button>
              </div>

              {/* PAYMENT DETAILS */}
              <div className="mt-4">
                {paymentMethod === "TELEBIRR" && (
                  <div className="pt-4 border-t border-[#e5edf2]">
                    <label className="block text-xs font-bold text-[#043658] uppercase mb-1">
                      Mobile Number for Confirmation
                    </label>
                    <input
                      type="tel"
                      required
                      value={telebirrPhone}
                      onChange={(e) => setTelebirrPhone(e.target.value)}
                      placeholder="+251 9XXXXXXXX"
                      className="w-full px-3 py-3 rounded-xl border border-[#e5edf2] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-[#647b8a] mt-1">
                      Enter the phone number connected to your Telebirr account.
                    </p>
                  </div>
                )}

                {paymentMethod === "CHAPA" && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <p className="text-sm text-purple-800 font-medium">
                      You will be redirected to Chapa to complete your payment securely.
                    </p>
                  </div>
                )}

                {paymentMethod === "BANK_TRANSFER" && (
                  <div className="pt-4 border-t border-[#e5edf2] space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-[#043658] uppercase mb-1">Select Bank</label>
                      <select
                        required
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full px-3 py-3 rounded-xl border border-[#e5edf2] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select your bank</option>
                        {ETHIOPIAN_BANKS.map((bank) => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#043658] uppercase mb-1">Account Number</label>
                      <input
                        type="text"
                        required
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Enter your bank account number"
                        className="w-full px-3 py-3 rounded-xl border border-[#e5edf2] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    {selectedBank && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800">
                        You selected <strong>{selectedBank}</strong>. Enter your account number above to continue.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* PAYMENT & CONFIRMATION - INSIDE PAYMENT METHOD BOX */}
              <div className="mt-6 pt-6 border-t border-[#e5edf2]">
                <div className="bg-[#f5f8fa] rounded-2xl p-4">
                  <button
                    type="submit"
                    disabled={nightsCount <= 0 || pricePerNight <= 0 || !room?.id}
                    className="w-full py-4 rounded-xl bg-[#FFC107] hover:bg-[#ffb300] disabled:bg-[#e5edf2] disabled:text-[#647b8a] text-[#043658] font-black text-base transition"
                  >
                    Payment & Confirmation
                  </button>

                  <div className="mt-3 flex items-start gap-2 text-xs text-[#647b8a]">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Your room is checked for availability before the reservation is confirmed.</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-sm text-[#647b8a]">{label}</p>
      <p className="mt-1 text-lg font-bold text-[#043658]">{value || "-"}</p>
    </div>
  );
}

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getNextDate(dateString) {
  if (!dateString) return toDateInput(new Date());
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return toDateInput(date);
}

export default Booking;