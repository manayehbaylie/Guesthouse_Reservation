import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  Landmark,
  Loader2,
  Phone,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { ApiService } from "../services/api.js";

function PaymentScreen({
  guesthouse,
  room,

  guesthouseId,
  roomId,

  checkInDate,
  checkOutDate,

  numberOfGuests = 1,
  nightsCount = 0,

  pricePerNight,
  totalPrice,

  paymentData,
  setPaymentData,

  onSuccess,
  onError,
  onBack,
}) {
  // ============================================================
  // NORMALIZE BOOKING DATA
  // ============================================================

  const normalizedGuesthouseId =
    guesthouseId ??
    guesthouse?.id ??
    null;

  const normalizedRoomId =
    roomId ??
    room?.id ??
    null;

  const normalizedCheckIn =
    checkInDate ||
    "";

  const normalizedCheckOut =
    checkOutDate ||
    "";

  const normalizedPricePerNight =
    Number(
      pricePerNight ??
        room?.pricePerNight ??
        room?.price ??
        room?.amount ??
        0
    );

  const normalizedNights =
    Number(nightsCount || 0);

  const calculatedTotal =
    normalizedPricePerNight *
    normalizedNights;

  const normalizedTotalPrice =
    Number(
      totalPrice ??
        calculatedTotal ??
        0
    );

  // ============================================================
  // LOCAL STATE
  // ============================================================

  const [processing, setProcessing] =
    useState(false);

  const [localError, setLocalError] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState(
      paymentData?.paymentMethod === "CHAPA"
        ? "TELEBIRR"
        : paymentData?.paymentMethod || "TELEBIRR"
    );

  const [telebirrPhone, setTelebirrPhone] =
    useState(
      paymentData?.telebirrPhone || ""
    );

  const [selectedBank, setSelectedBank] =
    useState(
      paymentData?.selectedBank || ""
    );

  const [accountNumber, setAccountNumber] =
    useState(
      paymentData?.accountNumber || ""
    );

  // ============================================================
  // KEEP PAYMENT DATA IN PARENT BOOKING COMPONENT
  // ============================================================

  useEffect(() => {
    if (!setPaymentData) {
      return;
    }

    setPaymentData((previous) => ({
      ...previous,

      paymentMethod,

      telebirrPhone,

      selectedBank,

      accountNumber,
    }));
  }, [
    paymentMethod,
    telebirrPhone,
    selectedBank,
    accountNumber,
    setPaymentData,
  ]);

  // ============================================================
  // DEBUG - CORRECT BOOKING DATA
  // ============================================================

  useEffect(() => {
    console.log(
      "========================================"
    );

    console.log(
      "PAYMENT SCREEN - BOOKING DATA"
    );

    console.log(
      "guesthouseId:",
      normalizedGuesthouseId
    );

    console.log(
      "roomId:",
      normalizedRoomId
    );

    console.log(
      "checkInDate:",
      normalizedCheckIn
    );

    console.log(
      "checkOutDate:",
      normalizedCheckOut
    );

    console.log(
      "pricePerNight:",
      normalizedPricePerNight
    );

    console.log(
      "nightsCount:",
      normalizedNights
    );

    console.log(
      "totalPrice:",
      normalizedTotalPrice
    );

    console.log(
      "paymentMethod:",
      paymentMethod
    );

    console.log(
      "========================================"
    );
  }, [
    normalizedGuesthouseId,
    normalizedRoomId,
    normalizedCheckIn,
    normalizedCheckOut,
    normalizedPricePerNight,
    normalizedNights,
    normalizedTotalPrice,
    paymentMethod,
  ]);

  // ============================================================
  // BANKS
  // ============================================================

  const banks = useMemo(
    () => [
      "CBE",
      "Awash Bank",
      "Bank of Abyssinia",
      "Zemen Bank",
      "Dashen Bank",
      "PRIDE Microfinance",
    ],
    []
  );

  // ============================================================
  // FORMAT MONEY
  // ============================================================

  const formattedTotal =
    Number(
      normalizedTotalPrice || 0
    ).toLocaleString();

  const formattedPrice =
    Number(
      normalizedPricePerNight || 0
    ).toLocaleString();

  // ============================================================
  // VALIDATE PAYMENT
  // ============================================================

  const validatePayment = () => {
    if (!normalizedGuesthouseId) {
      return "Guesthouse information is missing.";
    }

    if (!normalizedRoomId) {
      return "Room information is missing.";
    }

    if (!normalizedCheckIn) {
      return "Check-in date is missing.";
    }

    if (!normalizedCheckOut) {
      return "Check-out date is missing.";
    }

    if (normalizedNights <= 0) {
      return "Invalid number of nights.";
    }

    if (
      !normalizedPricePerNight ||
      normalizedPricePerNight <= 0
    ) {
      return "The room price is invalid.";
    }

    if (
      !normalizedTotalPrice ||
      normalizedTotalPrice <= 0
    ) {
      return "The total booking amount is invalid.";
    }

    if (!paymentMethod) {
      return "Please select a payment method.";
    }

    // ----------------------------------------------------------
    // TELEBIRR
    // ----------------------------------------------------------

    if (
      paymentMethod === "TELEBIRR"
    ) {
      const phone =
        telebirrPhone.trim();

      if (!phone) {
        return "Please enter your Telebirr phone number.";
      }

      const normalizedPhone =
        normalizeEthiopianPhone(phone);

      if (!normalizedPhone) {
        return "Please enter a valid Ethiopian phone number.";
      }
    }

    // ----------------------------------------------------------
    // BANK TRANSFER
    // ----------------------------------------------------------

    if (
      paymentMethod ===
      "BANK_TRANSFER"
    ) {
      if (!selectedBank) {
        return "Please select your bank.";
      }

      if (!accountNumber.trim()) {
        return "Please enter your bank account number.";
      }
    }

    return null;
  };

  // ============================================================
  // PAYMENT
  // ============================================================

  const handlePayment = async () => {
    if (processing) {
      return;
    }

    setLocalError("");

    const validationError =
      validatePayment();

    if (validationError) {
      setLocalError(
        validationError
      );
      return;
    }

    setProcessing(true);

    try {
      // ========================================================
      // IMPORTANT:
      // Reservation must be created first.
      // ========================================================

      const reservationPayload = {
        guesthouseId:
          Number(
            normalizedGuesthouseId
          ),

        roomId:
          Number(
            normalizedRoomId
          ),

        checkInDate:
          normalizedCheckIn,

        checkOutDate:
          normalizedCheckOut,

        numberOfGuests:
          Number(
            numberOfGuests || 1
          ),

        nightsCount:
          Number(
            normalizedNights
          ),

        pricePerNight:
          Number(
            normalizedPricePerNight
          ),

        totalPrice:
          Number(
            normalizedTotalPrice
          ),
      };

      console.log(
        "Creating reservation with:",
        reservationPayload
      );

      // ========================================================
      // CREATE RESERVATION
      // ========================================================

      let reservationResponse;

      /*
       * Your ApiService may expose one of these methods.
       * The first available method will be used.
       */

      if (
        typeof ApiService.createReservation ===
        "function"
      ) {
        reservationResponse =
          await ApiService.createReservation(
            reservationPayload
          );
      } else if (
        typeof ApiService.createBooking ===
        "function"
      ) {
        reservationResponse =
          await ApiService.createBooking(
            reservationPayload
          );
      } else {
        throw new Error(
          "ApiService.createReservation() is not available. Please check services/api.js."
        );
      }

      console.log(
        "Reservation response:",
        reservationResponse
      );

      // ========================================================
      // UNWRAP API RESPONSE
      // ========================================================

      const reservation =
        unwrapResponse(
          reservationResponse
        );

      const reservationId =
        reservation?.id ??
        reservation?.reservationId ??
        reservation?.reservation?.id ??
        reservation?.data?.id;

      if (!reservationId) {
        console.error(
          "Reservation response does not contain an ID:",
          reservationResponse
        );

        throw new Error(
          "Reservation was created, but the reservation ID was not returned by the server."
        );
      }

      // ========================================================
      // PAYMENT PAYLOAD
      // ========================================================

      const paymentPayload = {
        reservationId:
          Number(reservationId),

        method:
          paymentMethod,

        phone:
          paymentMethod ===
          "TELEBIRR"
            ? normalizeEthiopianPhone(
                telebirrPhone
              )
            : undefined,

        mobileNumber:
          paymentMethod ===
          "TELEBIRR"
            ? normalizeEthiopianPhone(
                telebirrPhone
              )
            : undefined,

        bankName:
          paymentMethod ===
          "BANK_TRANSFER"
            ? selectedBank
            : undefined,

        accountNumber:
          paymentMethod ===
          "BANK_TRANSFER"
            ? accountNumber.trim()
            : undefined,
      };

      console.log(
        "Payment payload:",
        paymentPayload
      );

      // ========================================================
      // INITIATE PAYMENT
      // ========================================================

      let paymentResponse;

      if (
        typeof ApiService.initiatePayment ===
        "function"
      ) {
        paymentResponse =
          await ApiService.initiatePayment(
            paymentPayload
          );
      } else {
        throw new Error(
          "ApiService.initiatePayment() is not available. Please check services/api.js."
        );
      }

      console.log(
        "Payment response:",
        paymentResponse
      );

      const paymentResult =
        unwrapResponse(
          paymentResponse
        );

      // ========================================================
      // CHAPA
      // ========================================================

      const checkoutUrl =
        paymentResult?.checkoutUrl ||
        paymentResult?.checkout_url ||
        paymentResult?.data?.checkoutUrl ||
        paymentResult?.data?.checkout_url;

      if (checkoutUrl) {
        console.log(
          "Redirecting to Chapa:",
          checkoutUrl
        );

        window.location.href =
          checkoutUrl;

        return;
      }

      // ========================================================
      // FINAL SUCCESS RESULT
      // ========================================================

      const finalResult = {
        reservation:
          paymentResult?.reservation ||
          reservation?.reservation ||
          reservation,

        payment:
          paymentResult?.payment ||
          paymentResult,

        reservationId,

        paymentMethod,

        amount:
          Number(
            normalizedTotalPrice
          ),

        checkInDate:
          normalizedCheckIn,

        checkOutDate:
          normalizedCheckOut,

        nightsCount:
          normalizedNights,

        pricePerNight:
          normalizedPricePerNight,

        totalPrice:
          normalizedTotalPrice,
      };

      console.log(
        "FINAL BOOKING RESULT:",
        finalResult
      );

      if (
        typeof onSuccess ===
        "function"
      ) {
        onSuccess(
          finalResult
        );
      }
    } catch (error) {
      console.error(
        "Payment/booking failed:",
        error
      );

      if (
        typeof onError ===
        "function"
      ) {
        onError(error);
      } else {
        setLocalError(
          getApiErrorMessage(
            error
          )
        );
      }
    } finally {
      setProcessing(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-stone-50 px-4 sm:px-6 lg:px-8 py-8">

      <div className="max-w-6xl mx-auto">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-8">

          <button
            type="button"
            onClick={onBack}
            disabled={processing}
            className="flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 disabled:opacity-50 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Booking
          </button>

          <h1 className="text-3xl sm:text-4xl font-black text-stone-900">
            Complete Payment
          </h1>

          <p className="mt-2 text-stone-500">
                    Review your booking and choose how to pay securely through Chapa.
          </p>

        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {localError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 flex items-start gap-3">

            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />

            <div>
              <p className="font-bold text-red-800">
                Payment Error
              </p>

              <p className="mt-1 text-sm text-red-700">
                {localError}
              </p>
            </div>

          </div>
        )}

        {/* ======================================================
            MAIN GRID
        ====================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ====================================================
              PAYMENT FORM
          ==================================================== */}

          <div className="lg:col-span-2 space-y-6">

            {/* BOOKING INFORMATION */}

            <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm">

              <div className="flex items-center gap-3 mb-6">

                <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">

                  <Building2 className="w-6 h-6" />

                </div>

                <div>

                  <h2 className="text-xl font-black text-stone-900">
                    Booking Information
                  </h2>

                  <p className="text-sm text-stone-500">
                    Review your selected room and dates.
                  </p>

                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <InfoCard
                  icon={
                    <Building2 className="w-5 h-5" />
                  }
                  label="Guesthouse"
                  value={
                    guesthouse?.name ||
                    "Guesthouse"
                  }
                />

                <InfoCard
                  icon={
                    <Building2 className="w-5 h-5" />
                  }
                  label="Room"
                  value={`Room ${
                    room?.roomNumber ||
                    room?.number ||
                    room?.id ||
                    "-"
                  }`}
                />

                <InfoCard
                  icon={
                    <Calendar className="w-5 h-5" />
                  }
                  label="Check-in"
                  value={
                    normalizedCheckIn ||
                    "-"
                  }
                />

                <InfoCard
                  icon={
                    <Calendar className="w-5 h-5" />
                  }
                  label="Check-out"
                  value={
                    normalizedCheckOut ||
                    "-"
                  }
                />

                <InfoCard
                  icon={
                    <Calendar className="w-5 h-5" />
                  }
                  label="Nights"
                  value={`${normalizedNights} ${
                    normalizedNights === 1
                      ? "night"
                      : "nights"
                  }`}
                />

                <InfoCard
                  icon={
                    <Smartphone className="w-5 h-5" />
                  }
                  label="Guests"
                  value={`${numberOfGuests}`}
                />

              </div>

            </div>

            {/* PAYMENT METHOD */}

            <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm">

              <div className="flex items-center gap-3 mb-6">

                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">

                  <CreditCard className="w-6 h-6" />

                </div>

                <div>

                  <h2 className="text-xl font-black text-stone-900">
                    Payment Method
                  </h2>

                  <p className="text-sm text-stone-500">
                    Select a payment method. You will securely complete your payment through Chapa.
                  </p>

                </div>

              </div>

              {/* PAYMENT OPTIONS */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <PaymentMethodButton
                  selected={
                    paymentMethod ===
                    "TELEBIRR"
                  }
                  onClick={() =>
                    setPaymentMethod(
                      "TELEBIRR"
                    )
                  }
                  icon={
                    <Smartphone className="w-6 h-6" />
                  }
                  title="Telebirr"
                  description="Mobile payment"
                />

                <PaymentMethodButton
                  selected={
                    paymentMethod ===
                    "BANK_TRANSFER"
                  }
                  onClick={() =>
                    setPaymentMethod(
                      "BANK_TRANSFER"
                    )
                  }
                  icon={
                    <Landmark className="w-6 h-6" />
                  }
                  title="Bank Transfer"
                  description="Pay from your bank"
                />

                <PaymentMethodButton
                  selected={paymentMethod === "CARD"}
                  onClick={() => setPaymentMethod("CARD")}
                  icon={<CreditCard className="w-6 h-6" />}
                  title="Card"
                  description="Debit or credit card"
                />

              </div>

              {/* ==================================================
                  TELEBIRR
              ================================================== */}

              {paymentMethod ===
                "TELEBIRR" && (

                <div className="mt-6 rounded-2xl bg-stone-50 border border-stone-200 p-5">

                  <label className="block text-sm font-bold text-stone-700 mb-2">

                    Telebirr Phone Number

                  </label>

                  <div className="relative">

                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />

                    <input
                      type="tel"
                      value={
                        telebirrPhone
                      }
                      onChange={(e) =>
                        setTelebirrPhone(
                          e.target.value
                        )
                      }
                      placeholder="+251 9XXXXXXXX"
                      disabled={
                        processing
                      }
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />

                  </div>

                  <p className="mt-2 text-xs text-stone-500">
                    Enter the Ethiopian phone number registered with Telebirr.
                  </p>

                </div>
              )}

              {/* ==================================================
                  BANK TRANSFER
              ================================================== */}

              {paymentMethod ===
                "BANK_TRANSFER" && (

                <div className="mt-6 rounded-2xl bg-stone-50 border border-stone-200 p-5 space-y-5">

                  <div>

                    <label className="block text-sm font-bold text-stone-700 mb-2">
                      Select Bank
                    </label>

                    <select
                      value={
                        selectedBank
                      }
                      onChange={(e) =>
                        setSelectedBank(
                          e.target.value
                        )
                      }
                      disabled={
                        processing
                      }
                      className="w-full px-4 py-4 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >

                      <option value="">
                        Select your bank
                      </option>

                      {banks.map(
                        (bank) => (
                          <option
                            key={bank}
                            value={bank}
                          >
                            {bank}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div>

                    <label className="block text-sm font-bold text-stone-700 mb-2">
                      Account Number
                    </label>

                    <input
                      type="text"
                      value={
                        accountNumber
                      }
                      onChange={(e) =>
                        setAccountNumber(
                          e.target.value
                        )
                      }
                      placeholder="Enter your bank account number"
                      disabled={
                        processing
                      }
                      className="w-full px-4 py-4 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />

                  </div>

                </div>
              )}

            </div>

            {/* SECURITY */}

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">

              <div className="flex items-start gap-3">

                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />

                <div>

                  <h3 className="font-bold text-emerald-900">
                    Secure Payment
                  </h3>

                  <p className="mt-1 text-sm text-emerald-800">
                    Your payment is processed securely. The reservation is checked before it is confirmed.
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* ====================================================
              ORDER SUMMARY
          ==================================================== */}

          <div>

            <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 sticky top-24">

              <h2 className="text-2xl font-black">
                Payment Summary
              </h2>

              <div className="mt-7 space-y-5">

                <div className="flex justify-between gap-4">

                  <span className="text-stone-400">
                    Guesthouse
                  </span>

                  <span className="font-bold text-right">
                    {guesthouse?.name ||
                      "Guesthouse"}
                  </span>

                </div>

                <div className="flex justify-between gap-4">

                  <span className="text-stone-400">
                    Room
                  </span>

                  <span className="font-bold">
                    {room?.roomNumber ||
                      room?.number ||
                      room?.id ||
                      "-"}
                  </span>

                </div>

                <div className="flex justify-between gap-4">

                  <span className="text-stone-400">
                    Price / Night
                  </span>

                  <span className="font-bold">
                    {formattedPrice} ETB
                  </span>

                </div>

                <div className="flex justify-between gap-4">

                  <span className="text-stone-400">
                    Nights
                  </span>

                  <span className="font-bold">
                    {normalizedNights}
                  </span>

                </div>

                <div className="flex justify-between gap-4">

                  <span className="text-stone-400">
                    Guests
                  </span>

                  <span className="font-bold">
                    {numberOfGuests}
                  </span>

                </div>

                <div className="border-t border-stone-700 pt-5">

                  <div className="flex justify-between items-center gap-4">

                    <span className="text-xl font-bold">
                      Total
                    </span>

                    <span className="text-2xl sm:text-3xl font-black text-amber-400 text-right">
                      {formattedTotal} ETB
                    </span>

                  </div>

                </div>

              </div>

              {/* PAY BUTTON */}

              <button
                type="button"
                onClick={
                  handlePayment
                }
                disabled={
                  processing ||
                  !normalizedRoomId ||
                  !normalizedCheckIn ||
                  !normalizedCheckOut ||
                  normalizedNights <= 0 ||
                  normalizedPricePerNight <=
                    0 ||
                  normalizedTotalPrice <=
                    0
                }
                className="w-full mt-8 py-5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-stone-700 disabled:text-stone-500 text-stone-950 font-black text-lg transition flex items-center justify-center gap-2"
              >

                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />

                    Continue to Payment
                  </>
                )}

              </button>

              <div className="mt-6 flex items-start gap-3 text-sm text-stone-400">

                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />

                <span>
                  Your booking information is securely processed and the room availability is checked before confirmation.
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

// ============================================================
// PAYMENT METHOD BUTTON
// ============================================================

function PaymentMethodButton({
  selected,
  onClick,
  icon,
  title,
  description,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl border-2 p-4 transition ${
        selected
          ? "border-amber-500 bg-amber-50"
          : "border-stone-200 bg-white hover:border-stone-300"
      }`}
    >

      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          selected
            ? "bg-amber-500 text-stone-950"
            : "bg-stone-100 text-stone-600"
        }`}
      >
        {icon}
      </div>

      <p className="mt-3 font-black text-stone-900">
        {title}
      </p>

      <p className="mt-1 text-xs text-stone-500">
        {description}
      </p>

    </button>
  );
}

// ============================================================
// INFORMATION CARD
// ============================================================

function InfoCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl bg-stone-50 border border-stone-200 p-4">

      <div className="flex items-center gap-2 text-stone-400">

        {icon}

        <span className="text-xs font-bold uppercase tracking-wider">
          {label}
        </span>

      </div>

      <p className="mt-2 font-bold text-stone-900">
        {value || "-"}
      </p>

    </div>
  );
}

// ============================================================
// NORMALIZE ETHIOPIAN PHONE
// ============================================================

function normalizeEthiopianPhone(
  phone
) {
  if (!phone) {
    return "";
  }

  let value = String(
    phone
  ).trim();

  value = value.replace(
    /[\s()-]/g,
    ""
  );

  if (
    value.startsWith(
      "+251"
    )
  ) {
    value =
      "0" +
      value.slice(4);
  } else if (
    value.startsWith(
      "251"
    )
  ) {
    value =
      "0" +
      value.slice(3);
  }

  if (
    /^09\d{8}$/.test(
      value
    )
  ) {
    return value;
  }

  if (
    /^07\d{8}$/.test(
      value
    )
  ) {
    return value;
  }

  return "";
}

// ============================================================
// API RESPONSE UNWRAPPER
// ============================================================

function unwrapResponse(
  response
) {
  if (!response) {
    return null;
  }

  if (
    response.data !==
    undefined
  ) {
    return response.data;
  }

  return response;
}

// ============================================================
// API ERROR MESSAGE
// ============================================================

function getApiErrorMessage(
  error
) {
  return (
    error?.response?.data
      ?.message ||
    error?.response?.data
      ?.error ||
    error?.response?.data
      ?.errors?.[0]
      ?.message ||
    error?.message ||
    "Payment failed. Please try again."
  );
}

export default PaymentScreen;