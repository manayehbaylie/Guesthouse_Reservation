import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

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
  MapPin,
  Eye,
  EyeOff,
  X,
  CreditCard,
  Upload,
  FileImage,
  List,
} from 'lucide-react';

// ============================================================
// MAIN REGISTER COMPONENT
// ============================================================

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  // ==========================================================
  // REGISTRATION TYPE
  // ==========================================================

  const [registrationType, setRegistrationType] = useState(null);

  // ==========================================================
  // PERSONAL INFORMATION
  // ==========================================================

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // ==========================================================
  // PASSWORD
  // ==========================================================

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ==========================================================
  // OWNER IDENTIFICATION
  // ==========================================================

  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');

  const [idFrontPhoto, setIdFrontPhoto] = useState(null);
  const [idBackPhoto, setIdBackPhoto] = useState(null);

  const [idFrontPreview, setIdFrontPreview] = useState('');
  const [idBackPreview, setIdBackPreview] = useState('');

  // ==========================================================
  // TERMS
  // ==========================================================

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // ==========================================================
  // UI STATE
  // ==========================================================

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ==========================================================
  // CLEANUP IMAGE PREVIEWS
  // ==========================================================

  useEffect(() => {
    return () => {
      if (idFrontPreview) {
        URL.revokeObjectURL(idFrontPreview);
      }

      if (idBackPreview) {
        URL.revokeObjectURL(idBackPreview);
      }
    };
  }, [idFrontPreview, idBackPreview]);

  // ==========================================================
  // RESET FORM
  // ==========================================================

  const resetForm = () => {
    if (idFrontPreview) {
      URL.revokeObjectURL(idFrontPreview);
    }

    if (idBackPreview) {
      URL.revokeObjectURL(idBackPreview);
    }

    setName('');
    setEmail('');
    setPhone('');
    setAddress('');

    setPassword('');
    setConfirmPassword('');

    setIdType('');
    setIdNumber('');

    setIdFrontPhoto(null);
    setIdBackPhoto(null);

    setIdFrontPreview('');
    setIdBackPreview('');

    setShowPassword(false);
    setShowConfirmPassword(false);

    setAgreedToTerms(false);
    setError('');
  };

  // ==========================================================
  // BACK TO OPTIONS
  // ==========================================================

  const handleBackToOptions = () => {
    setRegistrationType(null);
    setError('');
  };

  // ==========================================================
  // PERSONAL VALIDATION
  // ==========================================================

  const validatePersonalInformation = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      return 'Full name is required.';
    }

    if (trimmedName.length < 3) {
      return 'Full name must be at least 3 characters.';
    }

    if (!trimmedEmail) {
      return 'Email address is required.';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(trimmedEmail)) {
      return 'Please enter a valid email address.';
    }

    if (!trimmedPhone) {
      return 'Phone number is required.';
    }

    const phoneDigits = trimmedPhone.replace(/\D/g, '');

    if (phoneDigits.length < 9) {
      return 'Please enter a valid phone number.';
    }

    return null;
  };

  // ==========================================================
  // PASSWORD VALIDATION
  // ==========================================================

  const validatePassword = () => {
    if (!password) {
      return 'Password is required.';
    }

    if (password.length < 6) {
      return 'Password must be at least 6 characters.';
    }

    if (!confirmPassword) {
      return 'Please confirm your password.';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }

    return null;
  };

  // ==========================================================
  // OWNER IDENTIFICATION VALIDATION
  // ==========================================================

  const validateIdentification = () => {
    if (!idType.trim()) {
      return 'ID type is required.';
    }

    if (!idNumber.trim()) {
      return 'ID number is required.';
    }

    if (!idFrontPhoto) {
      return 'ID front photo is required.';
    }

    if (!idBackPhoto) {
      return 'ID back photo is required.';
    }

    return null;
  };

  // ==========================================================
  // IMAGE VALIDATION
  // ==========================================================

  const validateImage = (file) => {
    if (!file) {
      return 'Please select an image.';
    }

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      return 'Only JPG, JPEG, PNG, or WEBP images are allowed.';
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return 'Image size must be less than 5 MB.';
    }

    return null;
  };

  // ==========================================================
  // FRONT ID IMAGE
  // ==========================================================

  const handleFrontPhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validationError = validateImage(file);

    if (validationError) {
      setError(validationError);
      event.target.value = '';
      return;
    }

    if (idFrontPreview) {
      URL.revokeObjectURL(idFrontPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setError('');
    setIdFrontPhoto(file);
    setIdFrontPreview(previewUrl);
  };

  // ==========================================================
  // BACK ID IMAGE
  // ==========================================================

  const handleBackPhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validationError = validateImage(file);

    if (validationError) {
      setError(validationError);
      event.target.value = '';
      return;
    }

    if (idBackPreview) {
      URL.revokeObjectURL(idBackPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setError('');
    setIdBackPhoto(file);
    setIdBackPreview(previewUrl);
  };

  // ==========================================================
  // GUEST REGISTRATION
  // ==========================================================

  const handleGuestSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError('');

    const personalError = validatePersonalInformation();

    if (personalError) {
      setError(personalError);
      return;
    }

    const passwordError = validatePassword();

    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (!agreedToTerms) {
      setError(
        'Please agree to the Terms of Service and Privacy Policy.'
      );
      return;
    }

    setLoading(true);

    try {
      const guestData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role: 'Guest',
      };

      console.log(
        'Submitting guest registration:',
        guestData
      );

      const newUser = await register(guestData);

      console.log(
        'Guest registration successful:',
        newUser
      );

      resetForm();

      navigate('/login', {
        replace: true,
        state: {
          message:
            'Registration successful! Please login to continue.',
        },
      });
    } catch (err) {
      console.error(
        'Guest registration error:',
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Registration failed. Please try again.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // OWNER REGISTRATION
  // ==========================================================

  const handleOwnerSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError('');

    const personalError = validatePersonalInformation();

    if (personalError) {
      setError(personalError);
      return;
    }

    if (!address.trim()) {
      setError('Residential address is required.');
      return;
    }

    const passwordError = validatePassword();

    if (passwordError) {
      setError(passwordError);
      return;
    }

    const identificationError =
      validateIdentification();

    if (identificationError) {
      setError(identificationError);
      return;
    }

    if (!agreedToTerms) {
      setError(
        'Please agree to the Terms of Service and Privacy Policy.'
      );
      return;
    }

    setLoading(true);

    try {
      const ownerData = {
        fullName: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        residentialAddress: address.trim(),
        password,
        role: 'Owner',
        idType: idType.trim(),
        idNumber: idNumber.trim(),
      };

      console.log(
        'Submitting owner registration:',
        ownerData
      );

      const newOwner =
        await register(ownerData);

      console.log(
        'Owner registration successful:',
        newOwner
      );

      resetForm();

      navigate('/login', {
        replace: true,
        state: {
          message:
            'Owner registration submitted successfully. Please login after your account is approved.',
        },
      });
    } catch (err) {
      console.error(
        'Owner registration error:',
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Owner registration failed. Please try again.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // ERROR MESSAGE
  // ==========================================================

  const errorMessage = error ? (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      <X className="mt-0.5 h-5 w-5 flex-shrink-0" />

      <span>{error}</span>
    </div>
  ) : null;

  // ==========================================================
  // REGISTRATION OPTIONS
  // ==========================================================

  if (!registrationType) {
    return (
      <RegisterLayout>
        <div className="w-full max-w-xl">

          <div className="mb-8">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#E0A800] text-[#082F49] shadow-sm">
              <UserPlus className="h-6 w-6" />
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-[#082F49] sm:text-4xl">
              Create your account
            </h1>

            <p className="mt-3 text-base leading-7 text-slate-500">
              Choose how you want to use the guesthouse
              reservation platform.
            </p>
          </div>

          <div className="space-y-4">

            <RegistrationOption
              icon={<User className="h-6 w-6" />}
              title="Register as Guest"
              description="Create an account to discover guesthouses, reserve rooms and manage your bookings."
              onClick={() => {
                setRegistrationType('guest');
                setError('');
              }}
            />

            <RegistrationOption
              icon={<Building2 className="h-6 w-6" />}
              title="Register as Owner"
              description="Create your owner account and manage your guesthouse through the reservation platform."
              onClick={() => {
                setRegistrationType('owner');
                setError('');
              }}
            />

          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}

            <Link
              to="/login"
              className="font-bold text-[#B78103] transition hover:text-[#8F6500]"
            >
              Sign in
            </Link>
          </p>

          <p className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
            © 2026 Guesthouse Reservation Platform.
            All rights reserved.
          </p>

        </div>
      </RegisterLayout>
    );
  }

  // ==========================================================
  // GUEST FORM
  // ==========================================================

  if (registrationType === 'guest') {
    return (
      <RegisterLayout>

        <div className="w-full max-w-xl">

          <BackButton
            onClick={handleBackToOptions}
          />

          <div className="mb-7">

            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#E0A800] text-[#082F49]">
              <User className="h-6 w-6" />
            </div>

            <h1 className="text-3xl font-extrabold text-[#082F49] sm:text-4xl">
              Register as Guest
            </h1>

            <p className="mt-2 text-slate-500">
              Create your guest account and start
              discovering comfortable stays.
            </p>

          </div>

          {errorMessage}

          <form
            onSubmit={handleGuestSubmit}
            className="space-y-5"
          >

            <InputField
              label="Full Name"
              value={name}
              onChange={setName}
              placeholder="Enter your full name"
              required
              autoComplete="name"
              icon={<User className="h-4 w-4" />}
            />

            <InputField
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="Enter your email address"
              required
              autoComplete="email"
              icon={<Mail className="h-4 w-4" />}
            />

            <InputField
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={setPhone}
              placeholder="+251 9XX XXX XXX"
              required
              autoComplete="tel"
              icon={<Phone className="h-4 w-4" />}
            />

            <PasswordField
              label="Password"
              value={password}
              onChange={setPassword}
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

            <PasswordField
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
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

            <TermsBox
              checked={agreedToTerms}
              onChange={setAgreedToTerms}
            />

            {/* CENTERED COMPACT GUEST BUTTON */}

            <div className="flex justify-center pt-1">

              <SubmitButton
                loading={loading}
                loadingText="Creating account..."
                icon={
                  <UserPlus className="h-4 w-4" />
                }
              >
                Create Guest Account
              </SubmitButton>

            </div>

          </form>

          <LoginLink />

        </div>

      </RegisterLayout>
    );
  }

  // ==========================================================
  // OWNER FORM
  // ==========================================================

  return (
    <RegisterLayout>

      <div className="w-full max-w-3xl">

        <BackButton
          onClick={handleBackToOptions}
        />

        <div className="mb-7">

          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#E0A800] text-[#082F49]">
            <Building2 className="h-6 w-6" />
          </div>

          <h1 className="text-3xl font-extrabold text-[#082F49] sm:text-4xl">
            Register as Owner
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Create your owner account using your personal
            and identification information.
          </p>

        </div>

        {errorMessage}

        <form
          onSubmit={handleOwnerSubmit}
          encType="multipart/form-data"
          className="space-y-6"
        >

          {/* ==================================================
              01 PERSONAL INFORMATION
          =================================================== */}

          <FormSection
            icon={<User className="h-5 w-5" />}
            number="01"
            title="Personal Information"
            description="Provide your personal information as the property owner."
          >

            <div className="grid gap-5 md:grid-cols-2">

              <InputField
                label="Full Name"
                value={name}
                onChange={setName}
                placeholder="Enter your full name"
                required
                autoComplete="name"
                icon={<User className="h-4 w-4" />}
              />

              <InputField
                label="Email Address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="owner@example.com"
                required
                autoComplete="email"
                icon={<Mail className="h-4 w-4" />}
              />

              <InputField
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={setPhone}
                placeholder="+251 9XX XXX XXX"
                required
                autoComplete="tel"
                icon={<Phone className="h-4 w-4" />}
              />

              <InputField
                label="Residential Address"
                value={address}
                onChange={setAddress}
                placeholder="Enter your residential address"
                required
                autoComplete="street-address"
                icon={<MapPin className="h-4 w-4" />}
              />

              <PasswordField
                label="Password"
                value={password}
                onChange={setPassword}
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

              <PasswordField
                label="Confirm Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
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
              02 IDENTIFICATION
          =================================================== */}

          <FormSection
            icon={<CreditCard className="h-5 w-5" />}
            number="02"
            title="Identification"
            description="Provide your identification information for owner account verification."
          >

            <div className="space-y-5">

              <div className="grid gap-5 md:grid-cols-2">

                <SelectField
                  label="ID Type"
                  value={idType}
                  onChange={setIdType}
                  required
                  icon={
                    <CreditCard className="h-4 w-4" />
                  }
                />

                {/* ID NUMBER WITH LIST ICON */}

                <InputField
                  label="ID Number"
                  value={idNumber}
                  onChange={setIdNumber}
                  placeholder="Enter your ID number"
                  required
                  autoComplete="off"
                  icon={
                    <List className="h-4 w-4" />
                  }
                />

              </div>

              <div className="grid gap-5 md:grid-cols-2">

                <PhotoUpload
                  label="ID Front Photo"
                  file={idFrontPhoto}
                  preview={idFrontPreview}
                  onChange={handleFrontPhotoChange}
                  inputId="id-front-photo"
                />

                <PhotoUpload
                  label="ID Back Photo"
                  file={idBackPhoto}
                  preview={idBackPreview}
                  onChange={handleBackPhotoChange}
                  inputId="id-back-photo"
                />

              </div>

            </div>

          </FormSection>

          {/* ==================================================
              TERMS
          =================================================== */}

          <TermsBox
            checked={agreedToTerms}
            onChange={setAgreedToTerms}
          />

          {/* ==================================================
              CENTERED COMPACT OWNER BUTTON
          =================================================== */}

          <div className="flex justify-center pt-1">

            <SubmitButton
              loading={loading}
              loadingText="Creating account..."
              icon={
                <CheckCircle2 className="h-4 w-4" />
              }
            >
              Create Owner Account
            </SubmitButton>

          </div>

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
            LEFT MODERN GUESTHOUSE IMAGE
        =================================================== */}

        <div className="relative hidden min-h-screen overflow-hidden bg-[#062F49] lg:block lg:w-[43%]">

          <img
            src="/images/guesthouse-register.jpg"
            alt="Modern guesthouse"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* MAIN DARK OVERLAY */}

          <div className="absolute inset-0 bg-[#062F49]/55" />

          {/* MODERN GRADIENT */}

          <div className="absolute inset-0 bg-gradient-to-t from-[#03253A] via-[#062F49]/30 to-[#062F49]/10" />

          {/* SUBTLE LIGHT OVERLAY */}

          <div className="absolute inset-0 bg-gradient-to-br from-[#062F49]/20 via-transparent to-[#E0A800]/10" />

          <div className="relative z-10 flex min-h-screen flex-col justify-between p-10 xl:p-14">

            {/* ==================================================
                BRAND
            =================================================== */}

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E0A800] text-[#082F49] shadow-lg">

                <Building2 className="h-6 w-6" />

              </div>

              <div>

                <div className="text-xl font-extrabold tracking-tight text-white">
                  Guesthouse
                </div>

                <div className="text-sm font-medium text-white/70">
                  Reservation Platform
                </div>

              </div>

            </div>

            {/* ==================================================
                IMAGE CONTENT
            =================================================== */}

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
                  {' '}to stay.
                </span>

              </h2>

              <p className="mt-5 max-w-lg text-base leading-7 text-white/75">
                Discover comfortable guesthouses,
                reserve rooms and manage your stays
                through one simple platform.
              </p>

              {/* MODERN FEATURE CARD */}

              <div className="mt-8 flex max-w-md items-center gap-4 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">

                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#E0A800] text-[#082F49]">

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
            RIGHT SIDE
        =================================================== */}

        <main className="flex min-h-screen flex-1 items-start justify-center overflow-y-auto px-5 py-10 sm:px-8 lg:px-10 xl:px-14">

          <div className="w-full max-w-3xl">

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

function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#082F49]"
    >
      <ArrowLeft className="h-4 w-4" />

      Back to registration options
    </button>
  );
}

// ============================================================
// REGISTRATION OPTION
// ============================================================

function RegistrationOption({
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#D8A000] hover:shadow-lg sm:p-6"
    >

      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-[#F9F2D8] text-[#B78103] transition group-hover:bg-[#E0A800] group-hover:text-[#082F49]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <h2 className="text-lg font-extrabold text-[#082F49]">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>

      </div>

      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition group-hover:bg-[#F9F2D8] group-hover:text-[#B78103]">

        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />

      </div>

    </button>
  );
}

// ============================================================
// FORM SECTION
// ============================================================

function FormSection({
  icon,
  number,
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

      <div className="mb-6 flex items-start gap-4">

        <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#F9F2D8] text-[#B78103]">

          {icon}

          <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#082F49] px-1 text-[10px] font-bold text-white">
            {number}
          </span>

        </div>

        <div>

          <h2 className="text-lg font-extrabold text-[#082F49]">
            {title}
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
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
  type = 'text',
  placeholder = '',
  required = false,
  icon,
  autoComplete = 'off',
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
          className={`w-full rounded-xl border border-slate-200 bg-white py-3.5 text-sm text-[#082F49] outline-none transition placeholder:text-slate-400 focus:border-[#D8A000] focus:ring-4 focus:ring-[#E0A800]/10 ${
            icon
              ? 'pl-11 pr-4'
              : 'px-4'
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
  required = false,
  icon,
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

        {icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}

        <select
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          required={required}
          className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-[#082F49] outline-none transition focus:border-[#D8A000] focus:ring-4 focus:ring-[#E0A800]/10"
        >

          <option value="">
            Select ID type
          </option>

          <option value="National ID">
            National ID
          </option>

          <option value="Passport">
            Passport
          </option>

          <option value="Driving License">
            Driving License
          </option>

          <option value="Other">
            Other
          </option>

        </select>

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
  placeholder,
  show,
  onToggle,
  required = false,
  autoComplete = 'new-password',
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

        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm text-[#082F49] outline-none transition placeholder:text-slate-400 focus:border-[#D8A000] focus:ring-4 focus:ring-[#E0A800]/10"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#082F49]"
          aria-label={
            show
              ? 'Hide password'
              : 'Show password'
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
// PHOTO UPLOAD
// ============================================================

function PhotoUpload({
  label,
  file,
  preview,
  onChange,
  inputId,
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-bold text-[#173B53]">

        {label}

        <span className="ml-1 text-red-500">
          *
        </span>

      </label>

      <label
        htmlFor={inputId}
        className="group block cursor-pointer overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 transition hover:border-[#D8A000] hover:bg-[#FFFDF5]"
      >

        {preview ? (
          <div className="relative">

            <img
              src={preview}
              alt={`${label} preview`}
              className="h-48 w-full object-cover"
            />

            <div className="absolute inset-x-0 bottom-0 bg-[#082F49]/85 px-4 py-2">

              <p className="truncate text-xs font-semibold text-white">
                {file?.name}
              </p>

            </div>

          </div>
        ) : (
          <div className="flex min-h-[190px] flex-col items-center justify-center px-5 text-center">

            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F9F2D8] text-[#B78103] transition group-hover:bg-[#E0A800] group-hover:text-[#082F49]">

              <FileImage className="h-6 w-6" />

            </div>

            <p className="text-sm font-bold text-[#082F49]">
              Upload {label}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              JPG, PNG or WEBP · Max 5 MB
            </p>

            <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#B78103] shadow-sm">

              <Upload className="h-4 w-4" />

              Choose file

            </span>

          </div>
        )}

        <input
          id={inputId}
          name={inputId}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={onChange}
          className="hidden"
        />

      </label>

    </div>
  );
}

// ============================================================
// TERMS BOX
// ============================================================

function TermsBox({
  checked,
  onChange,
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="mt-1 h-4 w-4 rounded border-slate-300 text-[#B78103] focus:ring-[#E0A800]"
      />

      <span className="text-sm leading-6 text-slate-600">

        I agree to the platform's{' '}

        <span className="font-semibold text-[#082F49]">
          Terms of Service
        </span>{' '}

        and{' '}

        <span className="font-semibold text-[#082F49]">
          Privacy Policy
        </span>.

      </span>

    </label>
  );
}

// ============================================================
// LOGIN LINK
// ============================================================

function LoginLink() {
  return (
    <p className="mt-6 text-center text-sm text-slate-500">

      Already registered?{' '}

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
// COMPACT SUBMIT BUTTON
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
      className="inline-flex min-w-[210px] items-center justify-center gap-2 rounded-xl bg-[#E0A800] px-5 py-3 text-sm font-extrabold text-[#082F49] shadow-sm transition hover:bg-[#C99500] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
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