
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

import {
  UserPlus,
  Mail,
  Phone,
  User,
  Lock,
  Building2,
  CheckCircle2,
  ArrowLeft,
  CreditCard,
  MapPin,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  X,
} from 'lucide-react';

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  // ============================================================
  // REGISTRATION TYPE
  // ============================================================

  const [registrationType, setRegistrationType] = useState(null);

  // ============================================================
  // COMMON USER INFORMATION
  // ============================================================

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+251 9');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ============================================================
  // OWNER IDENTIFICATION
  // Date of Birth removed
  // ============================================================

  const [address, setAddress] = useState('');

  const [idType, setIdType] = useState('National ID');
  const [idNumber, setIdNumber] = useState('');

  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);

  // ============================================================
  // GUESTHOUSE INFORMATION
  // Guesthouse Type removed
  // ============================================================

  const [guesthouseName, setGuesthouseName] = useState('');
  const [guesthouseAddress, setGuesthouseAddress] = useState('');
  const [city, setCity] = useState('');
  const [subCity, setSubCity] = useState('');
  const [woreda, setWoreda] = useState('');
  const [guesthousePhone, setGuesthousePhone] = useState('');
  const [guesthouseEmail, setGuesthouseEmail] = useState('');
  const [numberOfRooms, setNumberOfRooms] = useState('');
  const [description, setDescription] = useState('');

  // ============================================================
  // BUSINESS INFORMATION
  // Ownership Type removed
  // Proof of Ownership removed
  // Authorization Letter removed
  // ============================================================

  const [businessLicenseNumber, setBusinessLicenseNumber] = useState('');
  const [businessLicense, setBusinessLicense] = useState(null);

  // ============================================================
  // GUESTHOUSE PHOTOS
  // ============================================================

  const [guesthousePhotos, setGuesthousePhotos] = useState([]);

  // ============================================================
  // AGREEMENT
  // ============================================================

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // ============================================================
  // UI STATE
  // ============================================================

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ============================================================
  // PASSWORD VALIDATION
  // ============================================================

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

  // ============================================================
  // RESET FORM
  // ============================================================

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('+251 9');

    setPassword('');
    setConfirmPassword('');

    setAddress('');

    setIdType('National ID');
    setIdNumber('');

    setIdFront(null);
    setIdBack(null);

    setGuesthouseName('');
    setGuesthouseAddress('');
    setCity('');
    setSubCity('');
    setWoreda('');
    setGuesthousePhone('');
    setGuesthouseEmail('');
    setNumberOfRooms('');
    setDescription('');

    setBusinessLicenseNumber('');
    setBusinessLicense(null);

    setGuesthousePhotos([]);

    setAgreedToTerms(false);

    setError('');
  };

  // ============================================================
  // BACK TO REGISTRATION OPTIONS
  // ============================================================

  const handleBackToOptions = () => {
    setRegistrationType(null);
    setError('');
  };

  // ============================================================
  // GUEST REGISTRATION
  // ============================================================

  const handleGuestSubmit = async (e) => {
    e.preventDefault();

    setError('');

    const passwordError = validatePassword();

    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (!phone.trim()) {
      setError('Phone number is required.');
      return;
    }

    setLoading(true);

    try {
      const newUser = await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role: 'Guest',
      });

      console.log('Guest registration successful:', newUser);

      if (
        newUser?.role === 'Owner' ||
        newUser?.role === 'OWNER'
      ) {
        navigate('/owner');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Guest registration error:', err);

      setError(
        err?.message ||
          err?.response?.data?.message ||
          'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // OWNER REGISTRATION
  // ============================================================

  const handleOwnerSubmit = async (e) => {
    e.preventDefault();

    setError('');

    // PASSWORD
    const passwordError = validatePassword();

    if (passwordError) {
      setError(passwordError);
      return;
    }

    // TERMS
    if (!agreedToTerms) {
      setError(
        'You must agree to the verification terms before submitting.'
      );
      return;
    }

    // ID DOCUMENTS
    if (!idFront) {
      setError(
        'Please upload the front side of your identification document.'
      );
      return;
    }

    if (!idBack) {
      setError(
        'Please upload the back side of your identification document.'
      );
      return;
    }

    // BUSINESS LICENSE
    if (!businessLicense) {
      setError(
        'Please upload your business registration/license document.'
      );
      return;
    }

    // GUESTHOUSE PHOTOS
    if (!guesthousePhotos.length) {
      setError('Please upload at least one guesthouse photo.');
      return;
    }

    // BASIC OWNER VALIDATION

    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (!phone.trim()) {
      setError('Phone number is required.');
      return;
    }

    if (!address.trim()) {
      setError('Residential address is required.');
      return;
    }

    if (!idNumber.trim()) {
      setError('ID number is required.');
      return;
    }

    // GUESTHOUSE VALIDATION

    if (!guesthouseName.trim()) {
      setError('Guesthouse name is required.');
      return;
    }

    if (!guesthouseAddress.trim()) {
      setError('Guesthouse address is required.');
      return;
    }

    if (!city.trim()) {
      setError('City is required.');
      return;
    }

    if (!subCity.trim()) {
      setError('Sub-city is required.');
      return;
    }

    if (!woreda.trim()) {
      setError('Woreda is required.');
      return;
    }

    if (!guesthousePhone.trim()) {
      setError('Guesthouse phone number is required.');
      return;
    }

    if (!numberOfRooms || Number(numberOfRooms) < 1) {
      setError('Number of rooms must be at least 1.');
      return;
    }

    if (!description.trim()) {
      setError('Guesthouse description is required.');
      return;
    }

    if (!businessLicenseNumber.trim()) {
      setError('Business/license number is required.');
      return;
    }

    setLoading(true);

    try {
      const ownerApplication = {
        role: 'Owner',

        // ACCOUNT INFORMATION
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,

        // PERSONAL INFORMATION
        address: address.trim(),

        // IDENTIFICATION
        idType,
        idNumber: idNumber.trim(),
        idFront,
        idBack,

        // GUESTHOUSE
        guesthouseName: guesthouseName.trim(),
        guesthouseAddress: guesthouseAddress.trim(),
        city: city.trim(),
        subCity: subCity.trim(),
        woreda: woreda.trim(),
        guesthousePhone: guesthousePhone.trim(),
        guesthouseEmail: guesthouseEmail.trim(),
        numberOfRooms: Number(numberOfRooms),
        description: description.trim(),

        // BUSINESS
        businessLicenseNumber: businessLicenseNumber.trim(),
        businessLicense,

        // PROPERTY PHOTOS
        guesthousePhotos,

        // AGREEMENT
        agreedToTerms: true,
      };

      console.log(
        'Submitting owner application:',
        ownerApplication
      );

      const result = await register(ownerApplication);

      console.log(
        'Owner registration result:',
        result
      );

      navigate('/login', {
        state: {
          message:
            'Your owner registration has been submitted successfully. Please wait for administrator verification.',
        },
      });

      resetForm();
    } catch (err) {
      console.error(
        'Owner registration error:',
        err
      );

      setError(
        err?.message ||
          err?.response?.data?.message ||
          'Owner registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // REGISTRATION TYPE SELECTION
  // ============================================================

  if (!registrationType) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-stone-50">
        <div className="max-w-2xl w-full space-y-6">

          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-md mb-3">
              <UserPlus className="w-6 h-6" />
            </div>

            <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
              Create an Account
            </h2>

            <p className="mt-1 text-sm text-stone-500">
              Choose how you want to register
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">

            {/* GUEST OPTION */}

            <button
              type="button"
              onClick={() => {
                setRegistrationType('guest');
                setError('');
              }}
              className="text-left bg-white p-6 rounded-2xl border-2 border-stone-200 hover:border-amber-500 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-stone-700" />
              </div>

              <h3 className="text-lg font-bold text-stone-900">
                Register as Guest
              </h3>

              <p className="text-sm text-stone-500 mt-2">
                Create an account to search for guesthouses,
                make reservations, and pay online.
              </p>

              <div className="mt-5 text-sm font-semibold text-amber-600">
                Continue as Guest →
              </div>
            </button>

            {/* OWNER OPTION */}

            <button
              type="button"
              onClick={() => {
                setRegistrationType('owner');
                setError('');
              }}
              className="text-left bg-white p-6 rounded-2xl border-2 border-stone-200 hover:border-amber-500 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-amber-600" />
              </div>

              <h3 className="text-lg font-bold text-stone-900">
                Register as Owner
              </h3>

              <p className="text-sm text-stone-500 mt-2">
                Submit your guesthouse information for
                administrator verification and approval.
              </p>

              <div className="mt-5 text-sm font-semibold text-amber-600">
                Continue as Owner →
              </div>
            </button>

          </div>

          <p className="text-center text-xs text-stone-500">
            Already registered?{' '}
            <Link
              to="/login"
              className="font-semibold text-amber-600 hover:underline"
            >
              Sign In Here
            </Link>
          </p>

        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR MESSAGE
  // ============================================================

  const errorMessage = error ? (
    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
      {error}
    </div>
  ) : null;

  // ============================================================
  // GUEST REGISTRATION PAGE
  // ============================================================

  if (registrationType === 'guest') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-stone-50">
        <div className="max-w-md w-full space-y-6">

          <button
            type="button"
            onClick={handleBackToOptions}
            className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to registration options
          </button>

          <div className="text-center">

            <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-md mb-3">
              <UserPlus className="w-6 h-6" />
            </div>

            <h2 className="text-2xl font-bold text-stone-900">
              Register as Guest
            </h2>

            <p className="mt-1 text-xs text-stone-500">
              Create your guest account
            </p>

          </div>

          {errorMessage}

          <form
            onSubmit={handleGuestSubmit}
            className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 space-y-4"
          >

            <InputField
              label="Full Name"
              value={name}
              onChange={setName}
              placeholder="Abebe Bikila"
              required
              icon={<User className="w-4 h-4" />}
            />

            <InputField
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="abebe@example.com"
              required
              icon={<Mail className="w-4 h-4" />}
            />

            <InputField
              label="Phone Number"
              value={phone}
              onChange={setPhone}
              placeholder="+251 91 123 4567"
              required
              icon={<Phone className="w-4 h-4" />}
            />

            <InputField
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Enter at least 6 characters"
              required
              icon={<Lock className="w-4 h-4" />}
            />

            <InputField
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter your password"
              required
              icon={<Lock className="w-4 h-4" />}
            />

            <div className="rounded-xl bg-stone-50 border border-stone-200 p-3">
              <p className="text-xs text-stone-500">
                Password must contain at least 6 characters.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />

              <span>
                {loading
                  ? 'Creating Account...'
                  : 'Register as Guest'}
              </span>
            </button>

          </form>

          <p className="text-center text-xs text-stone-500">
            Already registered?{' '}
            <Link
              to="/login"
              className="font-semibold text-amber-600 hover:underline"
            >
              Sign In Here
            </Link>
          </p>

        </div>
      </div>
    );
  }

  // ============================================================
  // OWNER REGISTRATION PAGE
  // ============================================================

  return (
    <div className="min-h-screen px-4 py-10 bg-stone-50">
      <div className="max-w-4xl mx-auto space-y-6">

        <button
          type="button"
          onClick={handleBackToOptions}
          className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to registration options
        </button>

        <div className="text-center">

          <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-md mb-3">
            <Building2 className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
            Owner Registration
          </h2>

          <p className="mt-1 text-sm text-stone-500">
            Submit your guesthouse information for administrator verification
          </p>

        </div>

        {errorMessage}

        <form
          onSubmit={handleOwnerSubmit}
          className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden"
        >

          {/* ==================================================
              PERSONAL INFORMATION
          ================================================== */}

          <section className="p-6 border-b border-stone-200">

            <SectionHeader
              icon={<User className="w-5 h-5" />}
              title="Personal Information"
              description="Information about the property owner"
            />

            <div className="grid md:grid-cols-2 gap-4">

              <InputField
                label="Full Name"
                value={name}
                onChange={setName}
                placeholder="Abebe Bikila"
                required
                icon={<User className="w-4 h-4" />}
              />

              <InputField
                label="Email Address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="abebe@example.com"
                required
                icon={<Mail className="w-4 h-4" />}
              />

              <InputField
                label="Phone Number"
                value={phone}
                onChange={setPhone}
                placeholder="+251 91 123 4567"
                required
                icon={<Phone className="w-4 h-4" />}
              />

              <InputField
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="At least 6 characters"
                required
                icon={<Lock className="w-4 h-4" />}
              />

              <InputField
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Re-enter password"
                required
                icon={<Lock className="w-4 h-4" />}
              />

              {/* DATE OF BIRTH REMOVED */}

              <div className="md:col-span-2">

                <InputField
                  label="Residential Address"
                  value={address}
                  onChange={setAddress}
                  placeholder="Bole, Addis Ababa"
                  required
                  icon={<MapPin className="w-4 h-4" />}
                />

              </div>

            </div>

          </section>

          {/* ==================================================
              IDENTIFICATION
          ================================================== */}

          <section className="p-6 border-b border-stone-200">

            <SectionHeader
              icon={<CreditCard className="w-5 h-5" />}
              title="Identification"
              description="Used by administrators to verify your identity"
            />

            <div className="grid md:grid-cols-2 gap-4">

              <div>

                <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                  ID Type
                </label>

                <select
                  value={idType}
                  onChange={(e) =>
                    setIdType(e.target.value)
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="National ID">
                    National ID
                  </option>

                  <option value="Passport">
                    Passport
                  </option>

                  <option value="Driver's License">
                    Driver's License
                  </option>
                </select>

              </div>

              <InputField
                label="ID Number"
                value={idNumber}
                onChange={setIdNumber}
                placeholder="Enter your ID number"
                required
              />

              <FileField
                label="ID Front"
                file={idFront}
                onChange={setIdFront}
                required
              />

              <FileField
                label="ID Back"
                file={idBack}
                onChange={setIdBack}
                required
              />

            </div>

          </section>

          {/* ==================================================
              GUESTHOUSE INFORMATION
          ================================================== */}

          <section className="p-6 border-b border-stone-200">

            <SectionHeader
              icon={<Building2 className="w-5 h-5" />}
              title="Guesthouse Information"
              description="Details about the property you want to register"
            />

            <div className="grid md:grid-cols-2 gap-4">

              <InputField
                label="Guesthouse Name"
                value={guesthouseName}
                onChange={setGuesthouseName}
                placeholder="Bole Comfort Guesthouse"
                required
                icon={<Building2 className="w-4 h-4" />}
              />

              {/* GUESTHOUSE TYPE REMOVED */}

              <InputField
                label="Guesthouse Address"
                value={guesthouseAddress}
                onChange={setGuesthouseAddress}
                placeholder="Bole, Addis Ababa"
                required
                icon={<MapPin className="w-4 h-4" />}
              />

              <InputField
                label="City"
                value={city}
                onChange={setCity}
                placeholder="Addis Ababa"
                required
              />

              <InputField
                label="Sub-City"
                value={subCity}
                onChange={setSubCity}
                placeholder="Bole"
                required
              />

              <InputField
                label="Woreda"
                value={woreda}
                onChange={setWoreda}
                placeholder="Woreda number"
                required
              />

              <InputField
                label="Guesthouse Phone"
                value={guesthousePhone}
                onChange={setGuesthousePhone}
                placeholder="+251 91 123 4567"
                required
                icon={<Phone className="w-4 h-4" />}
              />

              <InputField
                label="Guesthouse Email"
                type="email"
                value={guesthouseEmail}
                onChange={setGuesthouseEmail}
                placeholder="info@guesthouse.com"
              />

              <InputField
                label="Number of Rooms"
                type="number"
                min="1"
                value={numberOfRooms}
                onChange={setNumberOfRooms}
                placeholder="10"
                required
              />

              <div className="md:col-span-2">

                <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                  Guesthouse Description
                </label>

                <textarea
                  required
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  rows={4}
                  placeholder="Describe your guesthouse, location, services and facilities..."
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                />

              </div>

            </div>

          </section>

          {/* ==================================================
              BUSINESS VERIFICATION
          ================================================== */}

          <section className="p-6 border-b border-stone-200">

            <SectionHeader
              icon={<FileText className="w-5 h-5" />}
              title="Business Verification"
              description="Documents required for administrator approval"
            />

            <div className="grid md:grid-cols-2 gap-4">

              <InputField
                label="Business / License Number"
                value={businessLicenseNumber}
                onChange={setBusinessLicenseNumber}
                placeholder="Business registration number"
                required
              />

              <FileField
                label="Business Registration / License"
                file={businessLicense}
                onChange={setBusinessLicense}
                required
              />

            </div>

          </section>

          {/* ==================================================
              GUESTHOUSE PHOTOS
          ================================================== */}

          <section className="p-6 border-b border-stone-200">

            <SectionHeader
              icon={<ImageIcon className="w-5 h-5" />}
              title="Guesthouse Photos"
              description="Upload photos of your property for verification"
            />

            <label className="block">

              <div className="border-2 border-dashed border-stone-300 hover:border-amber-400 rounded-xl p-6 text-center cursor-pointer transition-colors">

                <ImageIcon className="w-8 h-8 mx-auto text-stone-400 mb-2" />

                <p className="text-sm font-semibold text-stone-700">
                  Upload Guesthouse Photos
                </p>

                <p className="text-xs text-stone-500 mt-1">
                  Exterior, rooms, reception, bathroom,
                  facilities, etc.
                </p>

                {guesthousePhotos.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {guesthousePhotos.map((photo, index) => (
                      <div
                        key={`${photo.name}-${index}`}
                        className="relative group"
                      >

                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Guesthouse ${index + 1}`}
                          className="w-full h-28 object-cover rounded-lg border border-stone-200"
                        />

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();

                            setGuesthousePhotos((previous) =>
                              previous.filter(
                                (_, photoIndex) =>
                                  photoIndex !== index
                              )
                            );
                          }}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>

                      </div>
                    ))}
                  </div>
                )}

              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  setGuesthousePhotos(
                    Array.from(e.target.files || [])
                  )
                }
                className="hidden"
              />

            </label>

          </section>

          {/* ==================================================
              AGREEMENT
          ================================================== */}

          <section className="p-6">

            <div className="rounded-xl bg-stone-50 border border-stone-200 p-4">

              <div className="flex gap-3">

                <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />

                <div>

                  <h3 className="text-sm font-bold text-stone-900">
                    Verification Agreement
                  </h3>

                  <p className="text-xs text-stone-500 mt-1">
                    Your application will be reviewed by an
                    administrator before your owner account is approved.
                  </p>

                </div>

              </div>

              <label className="flex items-start gap-3 mt-4 cursor-pointer">

                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) =>
                    setAgreedToTerms(e.target.checked)
                  }
                  className="mt-1 accent-amber-500"
                />

                <span className="text-xs text-stone-600">
                  I confirm that the information and documents
                  I provide are accurate, that I am authorized
                  to register this guesthouse, and that I agree
                  to the platform's verification process and terms.
                </span>

              </label>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-5 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />

              <span>
                {loading
                  ? 'Submitting Application...'
                  : 'Submit Owner Application'}
              </span>

            </button>

            <p className="text-center text-xs text-stone-500 mt-4">

              Already registered?{' '}

              <Link
                to="/login"
                className="font-semibold text-amber-600 hover:underline"
              >
                Sign In Here
              </Link>

            </p>

          </section>

        </form>

      </div>
    </div>
  );
}

// ============================================================
// SECTION HEADER
// ============================================================

function SectionHeader({
  icon,
  title,
  description,
}) {
  return (
    <div className="flex items-center gap-3 mb-5">

      <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
        {icon}
      </div>

      <div>

        <h3 className="font-bold text-stone-900">
          {title}
        </h3>

        <p className="text-xs text-stone-500">
          {description}
        </p>

      </div>

    </div>
  );
}

// ============================================================
// REUSABLE INPUT
// ============================================================

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  min,
  icon,
}) {
  return (
    <div>

      <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
        {label}

        {required && (
          <span className="text-red-500 ml-1">
            *
          </span>
        )}
      </label>

      <div className="relative">

        {icon && (
          <span className="absolute left-3 top-3 text-stone-400">
            {icon}
          </span>
        )}

        <input
          type={type}
          required={required}
          min={min}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          placeholder={placeholder}
          className={`w-full ${
            icon ? 'pl-9' : 'px-3'
          } pr-3 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none`}
        />

      </div>

    </div>
  );
}

// ============================================================
// FILE INPUT
// ============================================================

function FileField({
  label,
  file,
  onChange,
  required = false,
}) {
  return (
    <div>

      <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">

        {label}

        {required && (
          <span className="text-red-500 ml-1">
            *
          </span>
        )}

      </label>

      <label className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border border-stone-300 hover:border-amber-400 cursor-pointer transition-colors">

        <FileText className="w-4 h-4 text-stone-400 flex-shrink-0" />

        <span className="text-xs text-stone-500 truncate">

          {file
            ? file.name
            : 'Choose document...'}

        </span>

        <input
          type="file"
          required={required && !file}
          onChange={(e) =>
            onChange(
              e.target.files?.[0] || null
            )
          }
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
        />

      </label>

    </div>
  );
}

export default Register;

