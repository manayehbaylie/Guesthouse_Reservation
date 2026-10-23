import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { ApiService } from "../../services/api.js";

import {
  Mail,
  Lock,
  Building2,
  Eye,
  EyeOff,
  X,
  ArrowRight,
  ArrowLeft,
  Phone,
  MapPin,
  ShieldCheck,
  BedDouble,
  Send,
} from "lucide-react";

export function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();

  const navigate = useNavigate();
  const location = useLocation();

  // ---------------------------------------------------------
  // FORM STATE
  // ---------------------------------------------------------

  const [loginMethod, setLoginMethod] = useState("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [systemLocked, setSystemLocked] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [telegramLoginInfo, setTelegramLoginInfo] = useState(null);
  const [telegramNonce, setTelegramNonce] = useState("");
  const [telegramLoading, setTelegramLoading] = useState(false);

  const [hasPendingReservation, setHasPendingReservation] =
    useState(false);

  // ---------------------------------------------------------
  // ROUTE STATE
  // ---------------------------------------------------------

  const from = location.state?.from?.pathname || "/";

  const reservationData =
    location.state?.reservationData || null;

  const bookingData =
    location.state?.bookingData || null;

  const pendingReservation =
    location.state?.pendingReservation || false;

  const returnTo = location.state?.returnTo || null;
  const registrationSuccess = location.state?.registrationSuccess === true;
  const fromPath = location.state?.from || null;
  const profileReturnTarget = typeof fromPath === "string"
    ? (fromPath.startsWith("/profile") ? fromPath : null)
    : fromPath?.pathname === "/profile"
      ? `${fromPath.pathname}${fromPath.search || ""}`
      : from === "/profile" ? "/profile" : null;
  const returnToProfile = Boolean(profileReturnTarget);

  useEffect(() => {
    let active = true;
    if (location.state?.systemLockError) {
      setError(t('System locked by system admin'));
    }
    ApiService.getSystemLockStatus()
      .then((status) => { if (active) setSystemLocked(status.systemLocked); })
      .catch(() => {});
    return () => { active = false; };
  }, [location.state, t]);

  // ---------------------------------------------------------
  // CHECK PENDING BOOKING
  // ---------------------------------------------------------

  useEffect(() => {
    const pendingData =
      sessionStorage.getItem("pendingReservation");

    if (!pendingData) return;

    try {
      JSON.parse(pendingData);
      setHasPendingReservation(true);
    } catch (error) {
      console.error(
        "Failed to parse pending reservation:",
        error
      );

      sessionStorage.removeItem("pendingReservation");
    }
  }, []);

  useEffect(() => {
    let active = true;
    let refreshTimer;

    const prepareTelegramLogin = async () => {
      try {
        const info = await ApiService.getTelegramLoginInfo();
        if (!active) return;
        setTelegramLoginInfo(info);
        if (!info?.configured) return;

        const challenge = await ApiService.createTelegramLoginNonce();
        if (active) setTelegramNonce(challenge.nonce);
      } catch {
        if (active) setTelegramLoginInfo({ configured: false });
      }
    };

    const loadTelegramSdk = () => {
      if (window.Telegram?.Login?.auth) return Promise.resolve();

      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://oauth.telegram.org/js/telegram-login.js?version=1";
        script.async = true;
        script.onload = () => window.Telegram?.Login?.auth
          ? resolve()
          : reject(new Error("Telegram login could not be loaded."));
        script.onerror = () => reject(new Error("Telegram login could not be loaded."));
        document.head.appendChild(script);
      });
    };

    void (async () => {
      try {
        const info = await ApiService.getTelegramLoginInfo();
        if (!active) return;
        setTelegramLoginInfo(info);
        if (!info?.configured) return;
        await loadTelegramSdk();
        if (!active) return;
        await prepareTelegramLogin();
        refreshTimer = window.setInterval(() => {
          void prepareTelegramLogin();
        }, 3 * 60 * 1000);
      } catch {
        if (active) setTelegramLoginInfo({ configured: false });
      }
    })();

    return () => {
      active = false;
      if (refreshTimer) window.clearInterval(refreshTimer);
    };
  }, []);

  // ---------------------------------------------------------
  // CHECK WHETHER LOGIN CAME FROM BOOKING
  // ---------------------------------------------------------

  const isComingFromBooking = () => {
    if (
      reservationData ||
      bookingData ||
      pendingReservation
    ) {
      return true;
    }

    if (hasPendingReservation) {
      return true;
    }

    const fromState = location.state?.from;

    if (!fromState) {
      return false;
    }

    if (typeof fromState === "string") {
      return fromState.includes("/booking");
    }

    if (
      typeof fromState === "object" &&
      fromState.pathname
    ) {
      return fromState.pathname.includes("/booking");
    }

    return false;
  };

  // ---------------------------------------------------------
  // NORMALIZE ETHIOPIAN PHONE
  // ---------------------------------------------------------

  const normalizePhoneNumber = (phone) => {
    let value = phone.trim();

    // Remove spaces, hyphens and brackets
    value = value.replace(/[\s\-()]/g, "");

    // 09XXXXXXXX -> +2519XXXXXXXX
    if (/^09\d{8}$/.test(value)) {
      return `+251${value.substring(1)}`;
    }

    // 9XXXXXXXX -> +2519XXXXXXXX
    if (/^9\d{8}$/.test(value)) {
      return `+251${value}`;
    }

    // 2519XXXXXXXX -> +2519XXXXXXXX
    if (/^2519\d{8}$/.test(value)) {
      return `+${value}`;
    }

    // +2519XXXXXXXX
    if (/^\+2519\d{8}$/.test(value)) {
      return value;
    }

    return value;
  };

  // ---------------------------------------------------------
  // VALIDATE LOGIN INPUT
  // ---------------------------------------------------------

  const validateInput = () => {
    if (!identifier.trim()) {
      return {
        field: "identifier",
        message: loginMethod === "email"
          ? t("Please enter your email address.")
          : t("Please enter your phone number."),
      };
    }

    if (!password) {
      return { field: "password", message: t("Please enter your password.") };
    }

    // Email validation
    if (loginMethod === "email") {
      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(identifier.trim())) {
        return { field: "identifier", message: t("Please enter a valid email address.") };
      }
    }

    // Ethiopian phone validation
    if (loginMethod === "phone") {
      const normalizedPhone =
        normalizePhoneNumber(identifier);

      if (!/^\+2519\d{8}$/.test(normalizedPhone)) {
        return {
          field: "identifier",
          message: t("Please enter a valid Ethiopian phone number. Example: +251 9XXXXXXXX"),
        };
      }
    }

    return null;
  };

  // ---------------------------------------------------------
  // CHANGE LOGIN METHOD
  // ---------------------------------------------------------

  const handleLoginMethodChange = (method) => {
    setLoginMethod(method);
    setIdentifier("");
    setError("");
    setFieldErrors({});
  };

  // ---------------------------------------------------------
  // HANDLE LOGIN
  // ---------------------------------------------------------

  const handleTelegramLogin = () => {
    if (!telegramLoginInfo?.clientId || !telegramNonce || !window.Telegram?.Login?.auth) {
      setError("Telegram login is not ready. Please try again in a moment.");
      return;
    }

    const nonce = telegramNonce;
    setTelegramNonce("");
    setError("");
    setTelegramLoading(true);

    try {
      window.Telegram.Login.auth({
        client_id: telegramLoginInfo.clientId,
        scope: ["openid", "profile"],
        nonce,
      }, async (result) => {
        try {
          if (result?.error) throw new Error(result.error);
          if (!result?.id_token) throw new Error("Telegram did not return a login token.");

          const user = await ApiService.loginWithTelegram(result.id_token, nonce);
          if (returnToProfile) {
            navigate(profileReturnTarget, { replace: true });
            return;
          }
          const pendingData = sessionStorage.getItem("pendingReservation");
          let booking = reservationData || bookingData;
          if (pendingData) {
            try {
              booking = JSON.parse(pendingData);
              sessionStorage.removeItem("pendingReservation");
            } catch {
              sessionStorage.removeItem("pendingReservation");
            }
          }

          const role = String(user.role || "").toUpperCase();
          if (role === "GUEST" && booking?.guesthouseId && booking?.roomId) {
            navigate("/guest/dashboard", {
              replace: true,
              state: { bookingData: booking, fromLogin: true, user, showPayment: true },
            });
          } else if (role === "ADMIN") {
            navigate("/admin", { replace: true });
          } else if (role === "OWNER") {
            navigate("/owner", { replace: true });
          } else if (role === "RECEPTIONIST") {
            navigate("/receptionist", { replace: true });
          } else if (role === "GUEST") {
            navigate("/guest/dashboard", {
              replace: true,
              state: { fromLogin: true, user },
            });
          } else {
            navigate(from, { replace: true });
          }
        } catch (loginError) {
          setError(loginError?.message || "Telegram login failed. Please try again.");
        } finally {
          setTelegramLoading(false);
          ApiService.createTelegramLoginNonce()
            .then((challenge) => setTelegramNonce(challenge.nonce))
            .catch(() => setTelegramNonce(""));
        }
      });
    } catch (loginError) {
      setTelegramLoading(false);
      setError(loginError?.message || "Telegram login could not be started.");
      ApiService.createTelegramLoginNonce()
        .then((challenge) => setTelegramNonce(challenge.nonce))
        .catch(() => setTelegramNonce(""));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setFieldErrors({});

    const validationError = validateInput();

    if (validationError) {
      setFieldErrors({ [validationError.field]: validationError.message });
      return;
    }

    setLoading(true);

    try {
      let loginIdentifier = identifier.trim();

      // Normalize phone before sending
      if (loginMethod === "phone") {
        loginIdentifier = normalizePhoneNumber(loginIdentifier);
      }

      const user = await login(loginIdentifier, password, loginMethod);

      if (!user) {
        throw new Error("Login failed. User information was not returned.");
      }

      // ========================================================
      // ✅ STEP 1: CHECK FOR PENDING RESERVATION IN SESSION STORAGE
      // ========================================================

      const pendingData = sessionStorage.getItem("pendingReservation");

      if (pendingData) {
        try {
          const data = JSON.parse(pendingData);
          sessionStorage.removeItem("pendingReservation");

          if (!data.guesthouseId || !data.roomId) {
            throw new Error("Invalid pending reservation data.");
          }

          // ✅ Redirect to Guest Dashboard with booking data and showPayment flag
          navigate("/guest/dashboard", {
            replace: true,
            state: {
              bookingData: data,
              fromLogin: true,
              user,
              showPayment: true,
            },
          });

          return;
        } catch (bookingError) {
          console.error("Failed to process pending reservation:", bookingError);
          sessionStorage.removeItem("pendingReservation");
        }
      }

      // ========================================================
      // ✅ STEP 2: CHECK FOR RETURN TO PAYMENT FLAG
      // ========================================================

      const returnTo = location.state?.returnTo;
      const fromPath = location.state?.from;

      if (returnTo === "payment" && fromPath) {
        // Check if there's data in sessionStorage again
        const storedData = sessionStorage.getItem("pendingReservation");
        
        if (storedData) {
          try {
            const data = JSON.parse(storedData);
            sessionStorage.removeItem("pendingReservation");
            
            // Navigate to Guest Dashboard with payment flag
            navigate("/guest/dashboard", {
              replace: true,
              state: {
                bookingData: data,
                fromLogin: true,
                user,
                showPayment: true,
              },
            });
            return;
          } catch (e) {
            console.error("Error parsing stored booking:", e);
          }
        }
        
        // If no stored data, try to use bookingData from state
        const bookingDataFromState = location.state?.bookingData || location.state?.reservationData;
        if (bookingDataFromState) {
          navigate("/guest/dashboard", {
            replace: true,
            state: {
              bookingData: bookingDataFromState,
              fromLogin: true,
              user,
              showPayment: true,
            },
          });
          return;
        }
        
        // Fallback: go to dashboard
        navigate("/guest/dashboard", {
          replace: true,
          state: {
            fromLogin: true,
            user,
          },
        });
        return;
      }

      // ========================================================
      // ✅ STEP 3: CHECK FOR BOOKING DATA IN STATE
      // ========================================================

      if (reservationData || bookingData) {
        const data = reservationData || bookingData;

        const guesthouseId = data.guesthouseId || data.guesthouse?.id;
        const roomId = data.roomId || data.room?.id;

        if (guesthouseId && roomId) {
          // ✅ Redirect to Guest Dashboard with booking data
          navigate("/guest/dashboard", {
            replace: true,
            state: {
              bookingData: data,
              fromLogin: true,
              user,
              showPayment: true,
            },
          });

          return;
        }
      }

      // ========================================================
      // ✅ STEP 4: CHECK IF COMING FROM BOOKING
      // ========================================================

      if (isComingFromBooking()) {
        navigate("/guest/dashboard", {
          replace: true,
          state: {
            fromLogin: true,
            user,
            showPayment: true,
          },
        });
        return;
      }

      if (returnToProfile) {
        navigate(profileReturnTarget, { replace: true });
        return;
      }

      // ========================================================
      // ✅ STEP 5: ROLE BASED REDIRECTION
      // ========================================================

      switch (String(user.role || "").toUpperCase()) {
        case "ADMIN":
          navigate("/admin", { replace: true });
          break;

        case "OWNER":
          navigate("/owner", { replace: true });
          break;

        case "RECEPTIONIST":
          navigate("/receptionist", { replace: true });
          break;

        case "GUEST":
          // Normal login opens the regular dashboard. Payment is opened only
          // by the room-selection booking flow above.
          navigate("/guest/dashboard", {
            replace: true,
            state: {
              fromLogin: true,
              user,
            },
          });
          break;

        default:
          navigate(from, { replace: true });
      }
    } catch (err) {
      if (err?.code === "SYSTEM_LOCKED") {
        setError(t("System locked by system admin"));
        return;
      }

      const message = err?.status === 429 || err?.response?.status === 429
        ? t("Too many login attempts. Please wait 15 minutes before trying again.")
        : err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          err?.message ||
          t("Login failed. Please check your credentials.");

      setError(message);

      const lowerMessage = String(message).toLowerCase();

      if (lowerMessage.includes("password")) {
        setFieldErrors({ password: message });
      } else if (
        lowerMessage.includes("email") ||
        lowerMessage.includes("phone")
      ) {
        setFieldErrors({ identifier: message });
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // UI STATE
  // ---------------------------------------------------------

  const isFromBooking = isComingFromBooking();

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">

      {/* =====================================================
          MAIN LOGIN CONTAINER
      ===================================================== */}

      <div className="w-full max-w-6xl bg-white rounded-[2rem] shadow-2xl overflow-hidden">

        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[680px]">

          {/* =================================================
              LEFT SIDE - GUESTHOUSE IMAGE
          ================================================= */}

          <div className="relative hidden lg:block overflow-hidden">

            {/* Modern guesthouse hero image */}

            <img
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"
              alt="Modern guesthouse exterior"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Image overlay */}

            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/35 to-stone-950/10" />

            {/* Brand */}

            <div className="absolute top-8 left-8 right-8">

              <div className="max-w-xs">

                <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-300/90 mb-3">
                  {t('Welcome')}
                </p>

                <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight">
                  {t('Modern guesthouse reservation platform')}
                </h2>

              </div>

            </div>

            {/* Bottom content */}

            <div className="absolute left-8 right-8 bottom-8 text-white">

              <div className="flex items-center gap-2 mb-4">

                <span className="px-3 py-1.5 rounded-full bg-amber-500 text-stone-950 text-xs font-black">
                  SMART
                </span>

                <span className="text-sm font-semibold text-white/80">
                  {t('Guesthouse Reservation Platform')}
                </span>

              </div>

              <h1 className="text-4xl xl:text-5xl font-black leading-tight mb-5">
                {t('Stay comfortable.')}
                <br />
                {t('Book with confidence.')}
              </h1>

              <p className="text-white/80 text-base leading-7 max-w-lg mb-7">
                {t('Discover beautiful guesthouses, manage reservations seamlessly, and enjoy a smooth, secure booking experience in a modern platform.')}
              </p>

              {/* Features */}

              <div className="grid grid-cols-2 gap-3 max-w-lg">

                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/90 flex items-center justify-center">
                    <BedDouble className="w-5 h-5 text-stone-950" />
                  </div>

                  <div>
                    <p className="text-sm font-bold">
                      {t('Easy Booking')}
                    </p>

                    <p className="text-xs text-white/60">
                      {t('Find your stay')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/90 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-stone-950" />
                  </div>

                  <div>
                    <p className="text-sm font-bold">
                      {t('Secure')}
                    </p>

                    <p className="text-xs text-white/60">
                      {t('Protected account')}
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* =================================================
              RIGHT SIDE - LOGIN FORM
          ================================================= */}

          <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16">

            <div className="w-full max-w-md">

              {/* Mobile brand */}

              <div className="flex lg:hidden items-center justify-center gap-3 mb-8">

                <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-md">
                  <Building2 className="w-7 h-7 text-stone-950" />
                </div>

                <div>
                  <p className="text-2xl font-black text-stone-950">
                    {t('Guesthouse')}
                  </p>

                  <p className="text-sm font-bold text-stone-500">
                    {t('Reservation Platform')}
                  </p>
                </div>

              </div>

              {/* Back to homepage */}

              <div className="mb-8 flex justify-start">

                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-700 shadow-sm transition hover:border-stone-300 hover:text-stone-950"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('Back to homepage')}
                </button>

              </div>

              {/* =================================================
                  LOGIN METHOD
              ================================================= */}

              <div className="mb-6">

                <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-stone-100 rounded-2xl">

                  <button
                    type="button"
                    onClick={() =>
                      handleLoginMethodChange("email")
                    }
                    disabled={loading}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                      loginMethod === "email"
                        ? "bg-white text-stone-950 shadow-sm"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    {t('Email')}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleLoginMethodChange("phone")
                    }
                    disabled={loading}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                      loginMethod === "phone"
                        ? "bg-white text-stone-950 shadow-sm"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    {t('Phone')}
                  </button>

                </div>

              </div>

              {/* =================================================
                  LOGIN FORM
              ================================================= */}

              {systemLocked && (
                <p role="status" className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                  {t('System locked by system admin')}
                </p>
              )}

              {registrationSuccess && (
                <p role="status" className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                  {t('Registration successful. Please sign in with your new account.')}
                </p>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {(error || fieldErrors.identifier || fieldErrors.password) && (
                  <FieldError>
                    {error || fieldErrors.identifier || fieldErrors.password}
                  </FieldError>
                )}

                {/* Identifier */}

                <div>

                  <label
                    htmlFor="login-identifier"
                    className="block text-sm font-bold text-stone-800 mb-2"
                  >
                    {loginMethod === "email"
                      ? t("Email Address")
                      : t("Phone Number")}
                  </label>

                  <div className="relative">

                    {loginMethod === "email" ? (
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 pointer-events-none" />
                    ) : (
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 pointer-events-none" />
                    )}

                    <input
                      id="login-identifier"
                      name={
                        loginMethod === "email"
                          ? "email"
                          : "phone"
                      }
                      type={
                        loginMethod === "email"
                          ? "email"
                          : "tel"
                      }
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setFieldErrors((previous) => ({ ...previous, identifier: undefined }));
                      }}
                      aria-invalid={Boolean(fieldErrors.identifier)}
                      required
                      autoComplete={
                        loginMethod === "email"
                          ? "email"
                          : "tel"
                      }
                      inputMode={
                        loginMethod === "phone"
                          ? "tel"
                          : "email"
                      }
                      placeholder={
                        loginMethod === "email"
                          ? "you@example.com"
                          : "+251 9XXXXXXXX"
                      }
                      className={`w-full h-14 pl-12 pr-4 rounded-xl border bg-white text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 ${fieldErrors.identifier ? "border-red-400" : "border-stone-300"}`}
                    />

                  </div>

                  {loginMethod === "phone" && (
                    <p className="mt-2 text-xs text-stone-400">
                      
                    </p>
                  )}

                </div>

                {/* Password */}

                <div>

                  <div className="flex items-center justify-between mb-2">

                    <label
                      htmlFor="login-password"
                      className="block text-sm font-bold text-stone-800"
                    >
                      Password
                    </label>

                    <Link
                      to="/forgot-password"
                      className="text-sm font-bold text-amber-600 hover:text-amber-700 hover:underline"
                    >
                      {t('Forgot Password?')}
                    </Link>

                  </div>

                  <div className="relative">

                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 pointer-events-none" />

                    <input
                      id="login-password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldErrors((previous) => ({ ...previous, password: undefined }));
                      }}
                      aria-invalid={Boolean(fieldErrors.password)}
                      required
                      autoComplete="current-password"
                      placeholder={t('Enter your password')}
                      className={`w-full h-14 pl-12 pr-12 rounded-xl border bg-white text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 ${fieldErrors.password ? "border-red-400" : "border-stone-300"}`}
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? t("Hide password")
                          : t("Show password")
                      }
                      onClick={() =>
                        setShowPassword(
                          (previous) => !previous
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>

                  </div>

                </div>

                {/* Submit */}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-black rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-amber-500"
                >

                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />

                      <span>
                        {t('Signing in...')}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        {isFromBooking
                          ? t("Login & Continue Booking")
                          : t("Sign In")}
                      </span>

                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}

                </button>

              </form>

              {telegramLoginInfo?.configured && (
                <div className="mt-6">
                  <div className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase text-stone-400">
                    <span className="h-px flex-1 bg-stone-200" />
                    <span>{t("Or continue with")}</span>
                    <span className="h-px flex-1 bg-stone-200" />
                  </div>
                  <button
                    type="button"
                    onClick={handleTelegramLogin}
                    disabled={loading || telegramLoading || !telegramNonce}
                    className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-stone-300 bg-white font-bold text-stone-800 transition hover:border-sky-500 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {telegramLoading ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
                    ) : (
                      <Send className="h-5 w-5 text-sky-600" />
                    )}
                    {telegramLoading ? t("Connecting to Telegram...") : t("Continue with Telegram")}
                  </button>
                </div>
              )}

              {/* Register */}

              <div className="mt-7 text-center">

                <p className="text-sm text-stone-500">

                  {t("Don't have an account?")} {" "}

                  <Link
                    to="/register"
                    className="font-black text-amber-600 hover:text-amber-700 hover:underline"
                  >
                    {t('Create Account')}
                  </Link>

                </p>

              </div>

              {/* Platform information */}

              <div className="mt-8 pt-6 border-t border-stone-200">

                <div className="flex items-center justify-center gap-5 text-xs text-stone-400">

                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    {t('Secure Login')}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    Ethiopia
                  </span>

                </div>

                <p className="text-center text-xs text-stone-400 mt-4">
                  © 2026 Guesthouse Platform.
                  All rights reserved.
                </p>

              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function FieldError({ children }) {
  const { t } = useLanguage();
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
      <X className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>{t(children)}</span>
    </div>
  );
}

export default Login;