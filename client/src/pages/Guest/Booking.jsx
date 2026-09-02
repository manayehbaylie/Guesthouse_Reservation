import React, { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";

import { ApiService } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { DashboardLayout } from "../../components/DashboardLayout.jsx";
import PaymentScreen from "../../components/PaymentScreen.jsx";

import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Printer,
  ShieldCheck,
  Calendar,
  ChevronDown,
} from "lucide-react";

export function Booking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { guesthouseId, roomId } = useParams();

  const guesthouseId = searchParams.get("guesthouseId");
  const roomIdFromUrl = searchParams.get("roomId");

  // ============================================================
  // BOOKING DATA
  // ============================================================

  const [guesthouse, setGuesthouse] = useState(bookingData.guesthouse || null);
  const [room, setRoom] = useState(bookingData.room || null);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // STAY INFORMATION
  // ============================================================

  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [maxGuests, setMaxGuests] = useState(4);

  // ============================================================
  // PAYMENT / BOOKING STATE
  // ============================================================

  const [step, setStep] = useState("checkout");
  const [error, setError] = useState("");
  const [resultData, setResultData] = useState(null);

  const [paymentData, setPaymentData] = useState({
    paymentMethod: "TELEBIRR",
    telebirrPhone: "",
    selectedBank: "",
    accountNumber: "",
  });

  // ============================================================
  // RESTORE BOOKING DATA
  // ============================================================

  const restoredBooking =
    location.state?.bookingData ||
    location.state?.reservationData ||
    null;

  // ============================================================
  // LOAD BOOKING DATA
  // ============================================================

  useEffect(() => {
    let mounted = true;

    const loadBookingData = async () => {
      setLoading(true);
      setError("");

      try {
        // ========================================================
        // 1. TRY TO RESTORE BOOKING AFTER LOGIN
        // ========================================================

        let savedData = restoredBooking;

        if (!savedData) {
          const stored = sessionStorage.getItem(
            "pendingReservation"
          );

          if (stored) {
            try {
              savedData = JSON.parse(stored);
            } catch (parseError) {
              console.error(
                "Could not parse pending reservation:",
                parseError
              );
            }
          }
        }

        if (savedData) {
          console.log(
            "Restoring pending booking:",
            savedData
          );

          const restoredGuesthouse =
            savedData.guesthouse || null;

          const restoredRoom =
            savedData.room || null;

          if (mounted) {
            setGuesthouse(restoredGuesthouse);
            setRoom(restoredRoom);

            setCheckInDate(
              savedData.checkInDate ||
                savedData.checkIn ||
                ""
            );

            setCheckOutDate(
              savedData.checkOutDate ||
                savedData.checkOut ||
                ""
            );

            setNumberOfGuests(
              Number(savedData.numberOfGuests || 1)
            );

            const restoredMaxGuests = Number(
              restoredRoom?.maxGuests ||
                restoredRoom?.capacity ||
                4
            );

            setMaxGuests(restoredMaxGuests);

            setPaymentData({
              paymentMethod:
                savedData.paymentMethod ||
                "TELEBIRR",

              telebirrPhone:
                savedData.telebirrPhone ||
                user?.phone ||
                "",

              selectedBank:
                savedData.selectedBank ||
                "",

              accountNumber:
                savedData.accountNumber ||
                "",
            });

            setLoading(false);
          }

          return;
        }

        // ========================================================
        // 2. VALIDATE GUESTHOUSE ID
        // ========================================================

        if (!guesthouseId) {
          throw new Error(
            "Guesthouse was not selected."
          );
        }

        // ========================================================
        // 3. LOAD GUESTHOUSE
        // ========================================================

        const gh =
          await ApiService.getGuesthouseById(
            guesthouseId
          );

        if (!gh) {
          throw new Error(
            "Guesthouse not found."
          );
        }

        if (!mounted) {
          return;
        }

        setGuesthouse(gh);

        // ========================================================
        // 4. LOAD ROOMS
        // ========================================================

        const roomList =
          await ApiService.getRoomsForGuesthouse(
            gh.id
          );

        if (
          !Array.isArray(roomList) ||
          roomList.length === 0
        ) {
          throw new Error(
            "No room is available for this guesthouse."
          );
        }

        // ========================================================
        // 5. SELECT ROOM
        // ========================================================

        const selectedRoom =
          roomList.find(
            (item) =>
              String(item.id) ===
              String(roomIdFromUrl)
          ) || roomList[0];

        if (!selectedRoom) {
          throw new Error(
            "No room is available."
          );
        }

        if (!mounted) {
          return;
        }

        setRoom(selectedRoom);

        // ========================================================
        // 6. MAXIMUM GUESTS
        // ========================================================

        const roomCapacity = Number(
          selectedRoom.maxGuests ||
            selectedRoom.capacity ||
            4
        );

        setMaxGuests(roomCapacity);

        // ========================================================
        // 7. USER PHONE
        // ========================================================

        if (user?.phone) {
          setPaymentData((previous) => ({
            ...previous,
            telebirrPhone:
              previous.telebirrPhone ||
              user.phone,
          }));
        }
      } catch (err) {
        console.error(
          "Failed to load booking data:",
          err
        );

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
  }, [
    guesthouseId,
    roomIdFromUrl,
    restoredBooking,
    user?.phone,
  ]);

  // ============================================================
  // PREFILL PHONE
  // ============================================================

  useEffect(() => {
    if (
      user?.phone &&
      !paymentData.telebirrPhone
    ) {
      setPaymentData((previous) => ({
        ...previous,
        telebirrPhone: user.phone,
      }));
    }
  }, [
    user?.phone,
    paymentData.telebirrPhone,
  ]);

  // ============================================================
  // CALCULATE NIGHTS
  // ============================================================

  const nightsCount = useMemo(() => {
    if (
      !checkInDate ||
      !checkOutDate
    ) {
      return 0;
    }

    const start = new Date(
      `${checkInDate}T12:00:00`
    );

    const end = new Date(
      `${checkOutDate}T12:00:00`
    );

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return 0;
    }

    const difference =
      (end.getTime() - start.getTime()) /
      (1000 * 60 * 60 * 24);

    return Math.max(
      0,
      Math.round(difference)
    );
  }, [
    checkInDate,
    checkOutDate,
  ]);

  // ============================================================
  // ROOM PRICE
  // ============================================================

  const pricePerNight = useMemo(() => {
    if (!room) {
      return 0;
    }

    return Number(
      room.pricePerNight ??
        room.price ??
        room.amount ??
        room.roomPrice ??
        0
    );
  }, [room]);

  // ============================================================
  // TOTAL PRICE
  // ============================================================

  const totalPrice = useMemo(() => {
    return pricePerNight * nightsCount;
  }, [
    pricePerNight,
    nightsCount,
  ]);

  // ============================================================
  // DEBUG
  // ============================================================

  useEffect(() => {
    if (!room) {
      return;
    }

    console.log(
      "========================================"
    );

    console.log(
      "BOOKING PAGE - CURRENT DATA"
    );

    console.log(
      "guesthouseId:",
      guesthouse?.id
    );

    console.log(
      "roomId:",
      room?.id
    );

    console.log(
      "checkInDate:",
      checkInDate
    );

    console.log(
      "checkOutDate:",
      checkOutDate
    );

    console.log(
      "numberOfGuests:",
      numberOfGuests
    );

    console.log(
      "nightsCount:",
      nightsCount
    );

    console.log(
      "pricePerNight:",
      pricePerNight
    );

    console.log(
      "totalPrice:",
      totalPrice
    );

    console.log(
      "room:",
      room
    );

    console.log(
      "========================================"
    );
  }, [
    guesthouse,
    room,
    checkInDate,
    checkOutDate,
    numberOfGuests,
    nightsCount,
    pricePerNight,
    totalPrice,
  ]);

  // ============================================================
  // DATE HELPERS
  // ============================================================

  const todayString = toDateInput(
    new Date()
  );

  const minimumCheckOutDate = checkInDate
    ? getNextDate(checkInDate)
    : todayString;

  // ============================================================
  // VALIDATE BOOKING
  // ============================================================

  function validateBooking() {
    if (
      !checkInDate ||
      !checkOutDate
    ) {
      return (
        "Please select your check-in and check-out dates."
      );
    }

    if (checkInDate < todayString) {
      return (
        "Check-in date cannot be in the past."
      );
    }

    if (checkOutDate <= checkInDate) {
      return (
        "Check-out date must be after check-in date."
      );
    }

    if (nightsCount <= 0) {
      return (
        "Please select a valid stay duration."
      );
    }

    if (numberOfGuests < 1) {
      return (
        "Please select at least 1 guest."
      );
    }

    if (numberOfGuests > maxGuests) {
      return `Maximum ${maxGuests} guests allowed for this room.`;
    }

    if (!room?.id) {
      return (
        "The selected room could not be identified."
      );
    }

    if (pricePerNight <= 0) {
      return (
        "The selected room does not have a valid price."
      );
    }

    if (!guesthouse?.id) {
      return (
        "The selected guesthouse could not be identified."
      );
    }

    return null;
  }

  // ============================================================
  // CREATE RESERVATION DATA
  // ============================================================

  const createReservationData = () => {
    return {
      guesthouse,
      room,

      guesthouseId: Number(
        guesthouse?.id
      ),

      roomId: Number(
        room?.id
      ),

      checkInDate,
      checkOutDate,

      numberOfGuests: Number(
        numberOfGuests
      ),

      nightsCount: Number(
        nightsCount
      ),

      pricePerNight: Number(
        pricePerNight
      ),

      totalPrice: Number(
        totalPrice
      ),

      // Compatibility fields
      checkIn: checkInDate,
      checkOut: checkOutDate,

      roomPrice: Number(
        pricePerNight
      ),

      amount: Number(
        totalPrice
      ),

      // Payment
      paymentMethod:
        paymentData?.paymentMethod ||
        "TELEBIRR",

      telebirrPhone:
        paymentData?.telebirrPhone ||
        "",

      selectedBank:
        paymentData?.selectedBank ||
        "",

      accountNumber:
        paymentData?.accountNumber ||
        "",
    };
  };

  // ============================================================
  // CONTINUE TO PAYMENT
  // ============================================================

  const handleContinueToPayment = () => {
    setError("");

    const validationError =
      validateBooking();

    if (validationError) {
      setError(validationError);
      return;
    }

    const reservationData =
      createReservationData();

    console.log(
      "========================================"
    );

    console.log(
      "BOOKING DATA BEFORE PAYMENT"
    );

    console.log(
      reservationData
    );

    console.log(
      "checkIn:",
      reservationData.checkIn
    );

    console.log(
      "checkOut:",
      reservationData.checkOut
    );

    console.log(
      "roomPrice:",
      reservationData.roomPrice
    );

    console.log(
      "amount:",
      reservationData.amount
    );

    console.log(
      "guesthouseId:",
      reservationData.guesthouseId
    );

    console.log(
      "roomId:",
      reservationData.roomId
    );

    console.log(
      "========================================"
    );

    // ========================================================
    // USER NOT LOGGED IN
    // ========================================================

    if (!user) {
      sessionStorage.setItem(
        "pendingReservation",
        JSON.stringify(
          reservationData
        )
      );

      navigate("/login", {
        state: {
          from:
            `/booking?guesthouseId=${guesthouse?.id}&roomId=${room?.id}`,

          bookingData:
            reservationData,

          reservationData:
            reservationData,

          pendingReservation: true,
        },
      });

      return;
    }

    // ========================================================
    // USER LOGGED IN
    // ========================================================

    setStep("payment");
  };

  // ============================================================
  // PAYMENT SUCCESS
  // ============================================================

  const handlePaymentSuccess = (
    result
  ) => {
    console.log(
      "Payment/booking completed:",
      result
    );

    if (!result) {
      setError(
        "The booking request completed but no booking information was returned."
      );
      return;
    }

    setResultData(result);

    window.dispatchEvent(
      new CustomEvent(
        "reservation-created",
        {
          detail: {
            reservation:
              result?.reservation ||
              null,

            payment:
              result?.payment ||
              null,

            result,
          },
        }
      )
    );

    sessionStorage.removeItem(
      "pendingReservation"
    );

    setStep("success");
  };

  // ============================================================
  // PAYMENT ERROR
  // ============================================================

  const handlePaymentError = (
    paymentError
  ) => {
    console.error(
      "Payment error:",
      paymentError
    );

    const message =
      paymentError?.response?.data
        ?.message ||
      paymentError?.response?.data
        ?.error ||
      paymentError?.message ||
      "Payment failed. Please try again.";

    setError(message);
    setStep("payment");
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin mx-auto" />

            <p className="mt-4 text-base text-stone-500">
              Loading booking details...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ============================================================
  // BOOKING NOT AVAILABLE
  // ============================================================

  if (!guesthouse || !room) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />

            <h2 className="mt-4 text-2xl font-black text-stone-900">
              Booking unavailable
            </h2>

            <p className="mt-2 text-base text-stone-500">
              {error ||
                "The selected room could not be found."}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/search")
              }
              className="mt-6 px-6 py-4 rounded-xl bg-stone-900 text-white font-bold text-base"
            >
              Back to Guesthouses
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ============================================================
  // PAYMENT SCREEN
  // ============================================================

  if (step === "payment") {
    return (
      <PaymentScreen
        guesthouse={guesthouse}
        room={room}
        guesthouseId={Number(
          guesthouse.id
        )}
        roomId={Number(room.id)}
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
        numberOfGuests={Number(
          numberOfGuests
        )}
        nightsCount={Number(
          nightsCount
        )}
        pricePerNight={Number(
          pricePerNight
        )}
        totalPrice={Number(
          totalPrice
        )}
        paymentData={paymentData}
        setPaymentData={
          setPaymentData
        }
        onSuccess={
          handlePaymentSuccess
        }
        onError={
          handlePaymentError
        }
        onBack={() =>
          setStep("checkout")
        }
      />
    );
  }

  // ============================================================
  // SUCCESS
  // ============================================================

  if (
    step === "success" &&
    resultData
  ) {
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
            {/* SUCCESS HEADER */}

            <div className="bg-emerald-50 px-6 py-10 text-center">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <h1 className="mt-4 text-3xl font-black text-stone-900">
                Booking Confirmed!
              </h1>

              <p className="mt-2 text-base text-stone-600">
                Your room has been reserved successfully.
              </p>
            </div>

            {/* SUCCESS CONTENT */}

            <div className="p-8 space-y-6">
              {/* RESERVATION ID */}

              {(reservation.id ||
                reservation.reservationId) && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <p className="text-sm text-amber-700 font-semibold">
                    Reservation ID
                  </p>

                  <p className="mt-1 font-mono font-black text-stone-900 text-lg">
                    {reservation.id ||
                      reservation.reservationId}
                  </p>
                </div>
              )}

              {/* GUESTHOUSE */}

              <div className="flex items-center gap-4">
                <Building2 className="w-6 h-6 text-amber-600" />

                <div>
                  <p className="text-sm text-stone-500">
                    Guesthouse
                  </p>

                  <p className="text-xl font-bold text-stone-900">
                    {reservation.guesthouseName ||
                      guesthouse.name ||
                      "-"}
                  </p>
                </div>
              </div>

              {/* BOOKING INFORMATION */}

              <div className="grid sm:grid-cols-2 gap-4 bg-stone-50 rounded-2xl p-6">
                <InfoItem
                  label="Room"
                  value={`Room ${
                    reservation.roomNumber ||
                    room.roomNumber ||
                    "-"
                  }`}
                />

                <InfoItem
                  label="Room Type"
                  value={
                    reservation.roomType ||
                    room.type ||
                    room.roomType ||
                    "-"
                  }
                />

                <InfoItem
                  label="Guests"
                  value={String(
                    reservation.numberOfGuests ||
                      numberOfGuests
                  )}
                />

                <InfoItem
                  label="Check-in"
                  value={
                    reservation.checkInDate ||
                    reservation.checkIn ||
                    checkInDate
                  }
                />

                <InfoItem
                  label="Check-out"
                  value={
                    reservation.checkOutDate ||
                    reservation.checkOut ||
                    checkOutDate
                  }
                />

                <InfoItem
                  label="Nights"
                  value={String(
                    reservation.nightsCount ??
                      nightsCount
                  )}
                />

                <InfoItem
                  label="Payment"
                  value={
                    paymentData.paymentMethod ===
                    "TELEBIRR"
                      ? "Telebirr"
                      : paymentData.paymentMethod ===
                        "BANK_TRANSFER"
                      ? "Bank Transfer"
                      : paymentData.paymentMethod ===
                        "CHAPA"
                      ? "Chapa"
                      : "Card"
                  }
                />
              </div>

              {/* TOTAL */}

              <div className="border-t border-stone-200 pt-5">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-stone-700">
                    Total Paid
                  </span>

                  <span className="text-3xl font-black text-emerald-600">
                    {Number(
                      confirmedTotal || 0
                    ).toLocaleString()}{" "}
                    ETB
                  </span>
                </div>
              </div>

              {/* PAYMENT REFERENCE */}

              {(payment.referenceNumber ||
                payment.reference ||
                reservation.paymentReference ||
                reservation.referenceNumber) && (
                <div className="bg-stone-50 rounded-2xl p-4">
                  <p className="text-sm text-stone-500">
                    Payment Reference
                  </p>

                  <p className="font-mono font-bold text-stone-900 mt-1 text-lg">
                    {payment.referenceNumber ||
                      payment.reference ||
                      reservation.paymentReference ||
                      reservation.referenceNumber}
                  </p>
                </div>
              )}

              {/* BUTTONS */}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() =>
                    window.print()
                  }
                  className="flex-1 py-4 rounded-xl bg-stone-900 text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-stone-800 transition"
                >
                  <Printer className="w-5 h-5" />
                  Print Receipt
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/reservations")
                  }
                  className="flex-1 py-4 rounded-xl bg-amber-500 text-stone-950 font-bold text-base hover:bg-amber-400 transition"
                >
                  View My Reservations
                </button>
              </div>
            </div>
            <span className="text-xs font-bold">Confirm</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ============================================================
  // CHECKOUT
  // ============================================================

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* BACK */}

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-base font-semibold text-stone-600 hover:text-stone-900 mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* ERROR */}

        {error && (
          <div className="mb-6 p-5 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 shrink-0" />

            <span className="text-base font-medium">
              {error}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ====================================================
              LEFT COLUMN
          ==================================================== */}

          <div className="lg:col-span-2 space-y-8">
            {/* STAY DETAILS */}

            <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-stone-900 flex items-center gap-3">
                  <Calendar className="w-7 h-7 text-amber-500" />
                  Check Your Stay
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    navigate(-1)
                  }
                  className="text-2xl text-stone-400 hover:text-stone-600"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <p className="text-sm text-stone-500 mb-6">
                Select your dates and number
                of guests before continuing.
              </p>

              {/* SELECTED ROOM */}

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-sm text-stone-500 font-bold">
                      SELECTED ROOM
                    </p>

                    <h3 className="text-2xl font-black text-stone-900">
                      Room{" "}
                      {room.roomNumber ||
                        room.id}
                    </h3>

                    <p className="text-base text-stone-600">
                      {room.type ||
                        room.roomType ||
                        "Room"}{" "}
                      · Maximum{" "}
                      {maxGuests} guests
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-black text-amber-600">
                      {pricePerNight.toLocaleString()}{" "}
                      ETB
                    </p>

                    <p className="text-sm text-stone-500">
                      per night
                    </p>
                  </div>
                </div>
              </div>

              {/* DATES */}

              <div className="grid sm:grid-cols-2 gap-6">
                {/* CHECK-IN */}

                <div>
                  <label className="block text-sm font-bold text-stone-500 uppercase mb-2">
                    Check-in
                  </label>

                  <input
                    type="date"
                    required
                    min={todayString}
                    value={checkInDate}
                    onChange={(e) => {
                      const newCheckIn =
                        e.target.value;

                      setCheckInDate(
                        newCheckIn
                      );

                      if (
                        !checkOutDate ||
                        checkOutDate <=
                          newCheckIn
                      ) {
                        setCheckOutDate(
                          getNextDate(
                            newCheckIn
                          )
                        );
                      }

                      setError("");
                    }}
                    className="w-full px-5 py-4 rounded-xl border border-stone-300 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* CHECK-OUT */}

                <div>
                  <label className="block text-sm font-bold text-stone-500 uppercase mb-2">
                    Check-out
                  </label>

                  <input
                    type="date"
                    required
                    min={
                      minimumCheckOutDate
                    }
                    value={checkOutDate}
                    onChange={(e) => {
                      setCheckOutDate(
                        e.target.value
                      );
                      setError("");
                    }}
                    className="w-full px-5 py-4 rounded-xl border border-stone-300 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* GUESTS */}

              <div className="mt-6">
                <label className="block text-sm font-bold text-stone-500 uppercase mb-2">
                  Number of Guests
                </label>

                <div className="relative">
                  <select
                    value={
                      numberOfGuests
                    }
                    onChange={(e) =>
                      setNumberOfGuests(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    className="w-full px-5 py-4 rounded-xl border border-stone-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-amber-400 appearance-none"
                  >
                    {Array.from(
                      {
                        length: Math.min(
                          maxGuests,
                          10
                        ),
                      },
                      (_, i) => (
                        <option
                          key={i + 1}
                          value={i + 1}
                        >
                          {i + 1}{" "}
                          {i === 0
                            ? "guest"
                            : "guests"}
                        </option>
                      )
                    )}
                  </select>

                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-400 pointer-events-none" />
                </div>

                <p className="text-sm text-stone-500 mt-2">
                  Maximum {maxGuests} guests
                  for this room.
                </p>
              </div>

              {/* NIGHTS */}

              {nightsCount > 0 && (
                <div className="mt-4 bg-amber-50 rounded-xl px-5 py-4 text-base text-amber-800 font-semibold">
                  {nightsCount} night
                  {nightsCount !== 1
                    ? "s"
                    : ""}{" "}
                  selected
                </div>
              )}
            </div>

            {/* SECURE PAYMENT */}

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />

                <div>
                  <h3 className="font-bold text-blue-900">
                    Secure Payment
                  </h3>

                  <p className="mt-1 text-sm text-blue-800">
                    After checking your stay
                    details, continue to the
                    payment screen to select
                    Telebirr, Chapa, or Bank
                    Transfer.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================
              RIGHT COLUMN
          ==================================================== */}

          <div>
            <div className="bg-stone-900 text-white rounded-3xl p-8 sticky top-24">
              <h2 className="text-2xl font-black">
                Booking Summary
              </h2>

              <div className="mt-8 space-y-5 text-base">
                {/* ROOM */}

                <div className="flex justify-between gap-4">
                  <span className="text-stone-400">
                    Room
                  </span>

                  <span className="font-bold text-right text-lg">
                    {room.roomNumber ||
                      room.id}
                  </span>
                </div>

                {/* PRICE */}

                <div className="flex justify-between gap-4">
                  <span className="text-stone-400">
                    Price / night
                  </span>

                  <span className="font-bold text-lg">
                    {pricePerNight.toLocaleString()}{" "}
                    ETB
                  </span>
                </div>

                {/* NIGHTS */}

                <div className="flex justify-between gap-4">
                  <span className="text-stone-400">
                    Nights
                  </span>

                  <span className="font-bold text-lg">
                    {nightsCount}
                  </span>
                </div>

                {/* GUESTS */}

                <div className="flex justify-between gap-4">
                  <span className="text-stone-400">
                    Guests
                  </span>

                  <span className="font-bold text-lg">
                    {numberOfGuests}
                  </span>
                </div>

                {/* TOTAL */}

                <div className="border-t border-stone-700 pt-5 flex justify-between">
                  <span className="text-xl font-bold">
                    Total
                  </span>

                  <span className="text-3xl font-black text-amber-400">
                    {totalPrice.toLocaleString()}{" "}
                    ETB
                  </span>
                </div>
              </div>

              {/* CONTINUE */}

              <button
                type="button"
                onClick={
                  handleContinueToPayment
                }
                disabled={
                  nightsCount <= 0 ||
                  pricePerNight <= 0 ||
                  !room?.id ||
                  !guesthouse?.id
                }
                className="w-full mt-8 py-5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-stone-600 disabled:text-stone-400 text-stone-950 font-black text-lg transition"
              >
                Continue to Payment
              </button>

              <div className="mt-6 flex items-start gap-3 text-sm text-stone-400">
                <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />

                <span>
                  Your room is checked for
                  availability before the
                  reservation is confirmed.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ============================================================
// INFO ITEM
// ============================================================

function InfoItem({
  label,
  value,
}) {
  return (
    <div>
      <p className="text-sm text-stone-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-stone-900">
        {value || "-"}
      </p>
    </div>
  );
}

// ============================================================
// DATE HELPERS
// ============================================================

function toDateInput(date) {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getNextDate(dateString) {
  if (!dateString) {
    return toDateInput(
      new Date()
    );
  }

  const date = new Date(
    `${dateString}T12:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return toDateInput(
      new Date()
    );
  }

  date.setDate(
    date.getDate() + 1
  );

  return toDateInput(date);
}

export default Booking;