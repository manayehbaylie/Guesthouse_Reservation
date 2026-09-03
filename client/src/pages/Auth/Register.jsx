import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

import {
  User,
  UserPlus,
  Mail,
  Phone,
  Lock,
  Building2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  X,
  BriefcaseBusiness,
  ChevronDown,
} from "lucide-react";

// ============================================================
// MAIN REGISTER COMPONENT
// ============================================================

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [residentialAddress, setResidentialAddress] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [accountType, setAccountType] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // ==========================================================
  // UI STATE
  // ==========================================================

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const errorRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hasError = error || Object.values(fieldErrors).some(Boolean);
    if (hasError) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error, fieldErrors]);

  // ==========================================================
  // VALIDATE PERSONAL INFORMATION
  // ==========================================================

  const validatePersonalInformation = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    // Full name
    if (!trimmedName) {
      return { field: "name", message: "Full name is required." };
    }

    if (trimmedName.length < 3) {
      return { field: "name", message: "Full name must be at least 3 characters." };
    }

    // Email is OPTIONAL
    if (trimmedEmail) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(trimmedEmail)) {
        return { field: "email", message: "Please enter a valid email address." };
      }
    }

    // Phone
    if (!trimmedPhone) {
      return { field: "phone", message: "Phone number is required." };
    }

    const phoneDigits = trimmedPhone.replace(/\D/g, "");

    if (phoneDigits.length < 9) {
      return { field: "phone", message: "Please enter a valid phone number." };
    }

    return null;
  };

  // ==========================================================
  // PASSWORD VALIDATION
  // ==========================================================

  const validatePassword = () => {
    if (!password) {
      return { field: "password", message: "Password is required." };
    }

    if (password.length < 6) {
      return { field: "password", message: "Password must be at least 6 characters." };
    }

    if (!confirmPassword) {
      return { field: "confirmPassword", message: "Please confirm your password." };
    }

    if (password !== confirmPassword) {
      return { field: "confirmPassword", message: "Passwords do not match." };
    }

    return null;
  };

  // ==========================================================
  // ACCOUNT TYPE VALIDATION
  // ==========================================================

  const validateAccountType = () => {
    if (!accountType) {
      return { field: "accountType", message: "Please select how you want to use the platform." };
    }

    return null;
  };

  // ==========================================================
  // OWNER REGISTRATION VALIDATION
  // ==========================================================

  const validateOwnerRegistration = () => {
    if (accountType !== "Owner") {
      return null;
    }

    if (!residentialAddress.trim()) {
      return { field: "residentialAddress", message: "Residential address is required for owner accounts." };
    }

    if (!idType) {
      return { field: "idType", message: "Please select your ID type." };
    }

    if (!idNumber.trim()) {
      return { field: "idNumber", message: "ID number is required for owner accounts." };
    }

    return null;
  };

  // ==========================================================
  // RESET FORM
  // ==========================================================

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setResidentialAddress("");
    setIdType("");
    setIdNumber("");
    setPassword("");
    setConfirmPassword("");
    setAccountType("");

    setShowPassword(false);
    setShowConfirmPassword(false);

    setAgreedToTerms(false);
    setError("");
    setFieldErrors({});
  };

  // ==========================================================
  // SUBMIT REGISTRATION
  // ==========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setFieldErrors({});

    const showFieldError = (validationError) => {
      setFieldErrors({ [validationError.field]: validationError.message });
      setError("");
    };

    // --------------------------------------------------------
    // PERSONAL INFORMATION
    // --------------------------------------------------------

    const personalError = validatePersonalInformation();

    if (personalError) {
      showFieldError(personalError);
      return;
    }

    // --------------------------------------------------------
    // PASSWORD
    // --------------------------------------------------------

    const passwordError = validatePassword();

    if (passwordError) {
      showFieldError(passwordError);
      return;
    }

    // --------------------------------------------------------
    // ACCOUNT TYPE
    // --------------------------------------------------------

    const accountTypeError = validateAccountType();

    if (accountTypeError) {
      showFieldError(accountTypeError);
      return;
    }

    const ownerRegistrationError = validateOwnerRegistration();

    if (ownerRegistrationError) {
      showFieldError(ownerRegistrationError);
      return;
    }

    // --------------------------------------------------------
    // TERMS
    // --------------------------------------------------------

    if (!agreedToTerms) {
      setFieldErrors({ terms: "Please agree to the Terms of Service and Privacy Policy." });
      setError("");
      return;
    }

    setLoading(true);

    try {
      // ------------------------------------------------------
      // ROLE: keep the normalized backend enum value intact.
      // OWNER and GUEST are the only public self-service roles.
      // ------------------------------------------------------

      const role =
        accountType === "Owner"
          ? "OWNER"
          : accountType === "Guest"
            ? "GUEST"
            : String(accountType || "").toUpperCase();

      // ------------------------------------------------------
      // REGISTRATION DATA
      //
      // We send both "name" and "fullName" for compatibility
      // with different backend registration implementations.
      //
      // Email is optional. When empty, we send an empty string.
      // ------------------------------------------------------

      const registrationData = {
        name: name.trim(),
        fullName: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        residentialAddress:
          accountType === "Owner"
            ? residentialAddress.trim()
            : "",
        idType: accountType === "Owner" ? idType : "",
        idNumber: accountType === "Owner" ? idNumber.trim() : "",
        password,
        role,
      };

      console.log(
        "Submitting registration:",
        registrationData
      );

      const newUser = await register(registrationData);

      console.log(
        "Registration successful:",
        newUser
      );

      // ------------------------------------------------------
      // RESET
      // ------------------------------------------------------

      resetForm();

      // ------------------------------------------------------
      // SUCCESS MESSAGE
      // ------------------------------------------------------

      const successMessage =
        role === "OWNER"
          ? "Owner account created successfully. Please login to access your owner dashboard."
          : "Guest account created successfully. Please login to continue.";

      navigate("/login", {
        replace: true,
        state: {
          message: successMessage,
        },
      });
    } catch (err) {
      console.error(
        "Registration error:",
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        "Registration failed. Please try again.";

      const backendErrors = err?.response?.data?.errors;
      if (backendErrors && typeof backendErrors === "object") {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(backendErrors).map(([field, value]) => [
              field,
              Array.isArray(value) ? value[0] : String(value),
            ])
          )
        );
        setError("");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // ERROR MESSAGE
  // ==========================================================

  // ==========================================================
  // MAIN REGISTER PAGE
  // ==========================================================

  return (
    <RegisterLayout>
      <div className="w-full max-w-xl">

        {/* ==================================================
            BACK TO LOGIN
        =================================================== */}

        <BackButton />

        {/* ==================================================
            PAGE HEADER
        =================================================== */}

        <div className="mb-8">

          <div className="mb-5 flex items-center gap-4">

            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#E0A800] text-[#082F49] shadow-sm">
              <UserPlus className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#082F49] sm:text-4xl">
                Create your account
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Register once and start using the platform.
              </p>
            </div>

          </div>

        </div>

        {/* ==================================================
            REGISTRATION FORM
        =================================================== */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* ==================================================
              PERSONAL INFORMATION
          =================================================== */}

          <FormSection
            icon={<User className="h-5 w-5" />}
            title="Personal Information"
            description="Enter your basic account information."
          >

            <div className="space-y-5">

              {/* ACCOUNT TYPE */}

              <SelectField
                label="Register as"
                value={accountType}
                onChange={(value) => {
                  setAccountType(value);
                  setFieldErrors((previous) => ({ ...previous, accountType: undefined }));
                }}
                error={fieldErrors.accountType}
                required
              />

              {/* FULL NAME */}

              <InputField
                label="Full Name"
                value={name}
                onChange={(value) => {
                  setName(value);
                  setFieldErrors((previous) => ({ ...previous, name: undefined }));
                }}
                error={fieldErrors.name}
                placeholder="Enter your full name"
                required
                autoComplete="name"
                icon={
                  <User className="h-4 w-4" />
                }
              />

              {/* EMAIL */}

              <InputField
                label="Email Address"
                type="email"
                value={email}
                onChange={(value) => {
                  setEmail(value);
                  setFieldErrors((previous) => ({ ...previous, email: undefined }));
                }}
                error={fieldErrors.email}
                placeholder="Enter your email address (optional)"
                autoComplete="email"
                icon={
                  <Mail className="h-4 w-4" />
                }
              />

              {/* PHONE */}

              <InputField
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(value) => {
                  setPhone(value);
                  setFieldErrors((previous) => ({ ...previous, phone: undefined }));
                }}
                error={fieldErrors.phone}
                placeholder="+251 9XX XXX XXX"
                required
                autoComplete="tel"
                icon={
                  <Phone className="h-4 w-4" />
                }
              />

              {accountType === "Owner" && (
                <>
                  <InputField
                    label="Residential Address"
                    value={residentialAddress}
                    onChange={(value) => {
                      setResidentialAddress(value);
                      setFieldErrors((previous) => ({ ...previous, residentialAddress: undefined }));
                    }}
                    error={fieldErrors.residentialAddress}
                    placeholder="Enter your residential address"
                    required
                    autoComplete="street-address"
                    icon={<Building2 className="h-4 w-4" />}
                  />

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#173B53]">
                      ID Type
                      <span className="ml-1 text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <BriefcaseBusiness className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <select
                        value={idType}
                        onChange={(event) => {
                          setIdType(event.target.value);
                          setFieldErrors((previous) => ({ ...previous, idType: undefined }));
                        }}
                        aria-invalid={Boolean(fieldErrors.idType)}
                        aria-describedby={fieldErrors.idType ? "register-idType-error" : undefined}
                        required
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-11 text-sm text-[#082F49] outline-none transition focus:border-[#D8A000] focus:ring-4 focus:ring-[#E0A800]/10"
                      >
                        <option value="">Select ID type</option>
                        <option value="National ID">National ID</option>
                        <option value="Passport">Passport</option>
                        <option value="Driver License">Driver License</option>
                      </select>


                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <InputField
                    label="ID Number"
                    value={idNumber}
                    onChange={(value) => {
                      setIdNumber(value);
                      setFieldErrors((previous) => ({ ...previous, idNumber: undefined }));
                    }}
                    error={fieldErrors.idNumber}
                    placeholder="Enter your ID number"
                    required
                    autoComplete="off"
                    icon={<BriefcaseBusiness className="h-4 w-4" />}
                  />
                </>
              )}

              {/* PASSWORD */}

              <PasswordField
                label="Password"
                value={password}
                onChange={(value) => {
                  setPassword(value);
                  setFieldErrors((previous) => ({ ...previous, password: undefined }));
                }}
                error={fieldErrors.password}
                placeholder="Minimum 6 characters"
                show={showPassword}
                onToggle={() =>
                  setShowPassword(
                    (previous) => !previous
                  )
                }
                required
                autoComplete="new-password"
              />

              {/* CONFIRM PASSWORD */}

              <PasswordField
                label="Confirm Password"
                value={confirmPassword}
                onChange={(value) => {
                  setConfirmPassword(value);
                  setFieldErrors((previous) => ({ ...previous, confirmPassword: undefined }));
                }}
                error={fieldErrors.confirmPassword}
                placeholder="Re-enter your password"
                show={showConfirmPassword}
                onToggle={() =>
                  setShowConfirmPassword(
                    (previous) => !previous
                  )
                }
                required
                autoComplete="new-password"
              />

            </div>

          </FormSection>

          {/* ==================================================
              TERMS
          =================================================== */}

          <TermsBox
            checked={agreedToTerms}
            onChange={(checked) => {
              setAgreedToTerms(checked);
              setFieldErrors((previous) => ({ ...previous, terms: undefined }));
            }}
            error={fieldErrors.terms}
          />

          {/* ==================================================
              CREATE ACCOUNT BUTTON
          =================================================== */}

          <div className="flex justify-center pt-1">

            <SubmitButton
              loading={loading}
              loadingText="Creating account..."
              icon={
                <UserPlus className="h-4 w-4" />
              }
            >
              Create Account
            </SubmitButton>

          </div>

          {(error || Object.values(fieldErrors).some(Boolean)) && (
            <div ref={errorRef}>
              <FieldError>
              {error || Object.values(fieldErrors).find(Boolean)}
              </FieldError>
            </div>
          )}

          {/* ==================================================
              LOGIN LINK
          =================================================== */}

          <LoginLink />

        </form>

      </div>
    </RegisterLayout>
  );
}

// ============================================================
// REGISTER PAGE LAYOUT
// ============================================================

function RegisterLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F7F7F5]">

      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">

        {/* ==================================================
            LEFT IMAGE
        =================================================== */}

        <div className="relative hidden min-h-screen overflow-hidden bg-[#062F49] lg:block lg:w-[43%]">

          <img
            src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
            alt="Modern guesthouse exterior"
            className="absolute inset-0 h-full w-full object-cover scale-105 brightness-75 saturate-75"
          />

          {/* DARK OVERLAY */}

          <div className="absolute inset-0 bg-[#062F49]/60" />

          {/* GRADIENT */}

          <div className="absolute inset-0 bg-gradient-to-t from-[#021E2F] via-[#062F49]/35 to-[#062F49]/15" />

          {/* LIGHT ACCENT OVERLAY */}

          <div className="absolute inset-0 bg-gradient-to-br from-[#E0A800]/10 via-transparent to-[#082F49]/20" />

          {/* CONTENT */}

          <div className="relative z-10 flex min-h-screen flex-col justify-between p-10 xl:p-14">

            {/* BRAND */}

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E0A800] text-[#082F49] shadow-lg shadow-[#E0A800]/20">
                <Building2 className="h-6 w-6" />
              </div>

              <div>

                <div className="text-xl font-extrabold tracking-tight text-white">
                  GUESTHOUSE RESERVATION
                </div>

              </div>

            </div>

            {/* MAIN IMAGE CONTENT */}

            <div className="max-w-xl">

              <div className="mb-4 flex items-center gap-2">

                <span className="h-1 w-10 rounded-full bg-[#E0A800]" />

                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#E0A800]">
                  Guesthouse Reservation
                </span>

              </div>

              <h2 className="text-4xl font-extrabold leading-tight text-white xl:text-5xl">

                Find a comfortable place

                <span className="text-[#E0A800]">
                  {" "}to stay.
                </span>

              </h2>

              <p className="mt-5 max-w-lg text-base leading-7 text-white/75">
                Discover comfortable guesthouses,
                reserve rooms and manage your stays
                through one simple platform.
              </p>

              {/* FEATURE CARD */}

              <div className="mt-8 flex max-w-md items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-lg shadow-[#021E2F]/20 backdrop-blur-sm">

                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#E0A800] text-[#082F49] shadow-md shadow-[#E0A800]/20">

                  <CheckCircle2 className="h-5 w-5" />

                </div>

                <div>

                  <p className="text-sm font-bold text-white">
                    Simple & Secure
                  </p>

                  <p className="mt-0.5 text-xs leading-5 text-white/65">
                    Easy registration and secure
                    reservation management.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ==================================================
            RIGHT FORM SIDE
        =================================================== */}

        <main className="flex min-h-screen flex-1 items-start justify-center overflow-y-auto px-5 py-8 sm:px-8 lg:px-10 xl:px-14">

          <div className="w-full max-w-xl">

            {/* MOBILE BRAND */}

            <div className="mb-8 flex items-center gap-3 lg:hidden">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E0A800] text-[#082F49]">

                <Building2 className="h-5 w-5" />

              </div>

              <div>

                <div className="font-extrabold text-[#082F49]">
                  Guesthouse Platform
                </div>

                <div className="text-xs text-slate-500">
                  Reservation Platform
                </div>

              </div>

            </div>

            {children}

          </div>

        </main>

      </div>

    </div>
  );
}

// ============================================================
// BACK BUTTON
// ============================================================

function BackButton() {
  return (
    <Link
      to="/login"
      className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#082F49]"
    >
      <ArrowLeft className="h-4 w-4" />

      Back to login
    </Link>
  );
}

// ============================================================
// FORM SECTION
// ============================================================

function FormSection({
  icon,
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">

      {/* HEADER */}

      <div className="mb-6 flex items-center gap-4">

        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#F9F2D8] text-[#B78103]">

          {icon}

        </div>

        <div>

          <h2 className="text-lg font-extrabold text-[#082F49]">
            {title}
          </h2>

          <p className="mt-0.5 text-sm text-slate-500">
            {description}
          </p>

        </div>

      </div>

      {children}

    </section>
  );
}

// ============================================================
// INPUT FIELD
// ============================================================

function InputField({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder = "",
  required = false,
  icon,
  autoComplete = "off",
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-bold text-[#173B53]">

        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}

        {!required && (
          <span className="ml-2 text-xs font-normal text-slate-400">
            Optional
          </span>
        )}

      </label>

      <div className="relative">

        {icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-xl border bg-white py-3.5 text-sm text-[#082F49] outline-none transition placeholder:text-slate-400 focus:border-[#D8A000] focus:ring-4 focus:ring-[#E0A800]/10 ${
            error ? "border-red-400" : "border-slate-200"
          } ${
            icon
              ? "pl-11 pr-4"
              : "px-4"
          }`}
        />

      </div>

    </div>
  );
}

// ============================================================
// SELECT FIELD
// ============================================================

function SelectField({
  label,
  value,
  onChange,
  error,
  required = false,
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-bold text-[#173B53]">

        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}

      </label>

      <div className="relative">

        {/* ICON */}

        <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400">
          <BriefcaseBusiness className="h-4 w-4" />
        </span>

        {/* SELECT */}

        <select
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          required={required}
          aria-invalid={Boolean(error)}
          className={`w-full appearance-none rounded-xl border bg-white py-3.5 pl-11 pr-11 text-sm outline-none transition focus:border-[#D8A000] focus:ring-4 focus:ring-[#E0A800]/10 ${
            error ? "border-red-400" : "border-slate-200"
          } ${
            value
              ? "text-[#082F49]"
              : "text-slate-400"
          }`}
        >

          <option value="">
            Select account type
          </option>

          <option value="Guest">
            Guest — Book comfortable stays
          </option>

          <option value="Owner">
            Owner — Manage your guesthouse
          </option>

        </select>

        {/* DROPDOWN ICON */}

        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

      </div>

    </div>
  );
}

// ============================================================
// PASSWORD FIELD
// ============================================================

function PasswordField({
  label,
  value,
  onChange,
  error,
  placeholder,
  show,
  onToggle,
  required = false,
  autoComplete = "new-password",
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-bold text-[#173B53]">

        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}

      </label>

      <div className="relative">

        {/* LOCK ICON */}

        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        {/* PASSWORD INPUT */}

        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-xl border bg-white py-3.5 pl-11 pr-12 text-sm text-[#082F49] outline-none transition placeholder:text-slate-400 focus:border-[#D8A000] focus:ring-4 focus:ring-[#E0A800]/10 ${error ? "border-red-400" : "border-slate-200"}`}
        />

        {/* SHOW / HIDE */}

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#082F49]"
          aria-label={
            show
              ? "Hide password"
              : "Show password"
          }
        >

          {show ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}

        </button>

      </div>

    </div>
  );
}

// ============================================================
// TERMS BOX
// ============================================================

function TermsBox({
  checked,
  onChange,
  error,
}) {
  return (
    <div>
      <label className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-4 transition hover:border-slate-300 ${error ? "border-red-400" : "border-slate-200"}`}>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="mt-1 h-4 w-4 rounded border-slate-300 text-[#B78103] focus:ring-[#E0A800]"
      />

      <span className="text-sm leading-6 text-slate-600">

        I agree to the platform's{" "}

        <span className="font-semibold text-[#082F49]">
          Terms of Service
        </span>{" "}

        and{" "}

        <span className="font-semibold text-[#082F49]">
          Privacy Policy
        </span>.

      </span>

      </label>
    </div>
  );
}

function FieldError({ children }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
      <X className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}

// ============================================================
// LOGIN LINK
// ============================================================

function LoginLink() {
  return (
    <p className="mt-6 text-center text-sm text-slate-500">

      Already have an account?{" "}

      <Link
        to="/login"
        className="font-bold text-[#B78103] transition hover:text-[#8F6500]"
      >
        Sign in
      </Link>

    </p>
  );
}

// ============================================================
// SUBMIT BUTTON
// ============================================================

function SubmitButton({
  loading,
  loadingText,
  icon,
  children,
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex min-w-[210px] items-center justify-center gap-2 rounded-xl bg-[#E0A800] px-6 py-3.5 text-sm font-extrabold text-[#082F49] shadow-sm transition hover:bg-[#C99500] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
    >

      {loading ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#082F49] border-t-transparent" />

          <span>
            {loadingText}
          </span>
        </>
      ) : (
        <>
          {icon}

          <span>
            {children}
          </span>

          <ArrowRight className="h-4 w-4" />
        </>
      )}

    </button>
  );
}

export default Register;