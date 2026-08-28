import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ApiService } from '../../services/api.js';
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
  Eye,
  EyeOff,
  ArrowRight,
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
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ============================================================
  // OWNER IDENTIFICATION
  // ============================================================

  const [address, setAddress] = useState('');
  const [idType, setIdType] = useState('National ID');
  const [idNumber, setIdNumber] = useState('');
  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);

  // ============================================================
  // GUESTHOUSE INFORMATION
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
  // AUTO-BOOKING FUNCTION
  // ============================================================

  const createAutoBooking = async (userId) => {
    try {
      console.log('Creating auto-booking for user:', userId);
      
      const guesthouses = await ApiService.getGuesthouses({ limit: 10 });
      if (guesthouses.length === 0) {
        console.log('No guesthouses found for auto-booking');
        return null;
      }
      
      const gh = guesthouses[0];
      console.log('Using guesthouse:', gh.name);
      
      const rooms = await ApiService.getRoomsForGuesthouse(gh.id);
      if (rooms.length === 0) {
        console.log('No rooms found for auto-booking');
        return null;
      }
      
      const room = rooms[0];
      console.log('Using room:', room.roomNumber);
      
      const today = new Date();
      const checkIn = new Date(today);
      checkIn.setDate(today.getDate() + 1);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkIn.getDate() + 2);
      
      const checkInStr = checkIn.toISOString().split('T')[0];
      const checkOutStr = checkOut.toISOString().split('T')[0];

      const bookingData = {
        guesthouseId: gh.id,
        roomId: room.id,
        checkInDate: checkInStr,
        checkOutDate: checkOutStr,
        nightsCount: 1,
        numberOfGuests: 1,
        paymentMethod: 'TELEBIRR',
        phone: '+251911111111',
      };

      const result = await ApiService.createBookingAndPay(bookingData);
      console.log('✅ Auto-booking created successfully:', result);
      return result;

    } catch (error) {
      console.error('❌ Failed to auto-create booking:', error);
      return null;
    }
  };

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
    setPhone('');
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
  // GUEST REGISTRATION - ✅ Redirects to Login
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

      // Auto-create booking for new user
      if (newUser?.id) {
        await createAutoBooking(newUser.id);
      }

      if (newUser?.role === 'Owner' || newUser?.role === 'OWNER') {
        navigate('/owner');
      } else {
        // ✅ Redirect to login page instead of dashboard
        navigate('/login', {
          replace: true,
          state: {
            message: 'Registration successful! Please login to continue.',
          },
        });
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

    const passwordError = validatePassword();
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (!agreedToTerms) {
      setError('You must agree to the verification terms before submitting.');
      return;
    }

    if (!idFront) {
      setError('Please upload the front side of your identification document.');
      return;
    }
    if (!idBack) {
      setError('Please upload the back side of your identification document.');
      return;
    }
    if (!businessLicense) {
      setError('Please upload your business registration/license document.');
      return;
    }
    if (!guesthousePhotos.length) {
      setError('Please upload at least one guesthouse photo.');
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
    if (!address.trim()) {
      setError('Residential address is required.');
      return;
    }
    if (!idNumber.trim()) {
      setError('ID number is required.');
      return;
    }
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
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        address: address.trim(),
        idType,
        idNumber: idNumber.trim(),
        idFront,
        idBack,
        guesthouseName: guesthouseName.trim(),
        guesthouseAddress: guesthouseAddress.trim(),
        city: city.trim(),
        subCity: subCity.trim(),
        woreda: woreda.trim(),
        guesthousePhone: guesthousePhone.trim(),
        guesthouseEmail: guesthouseEmail.trim(),
        numberOfRooms: Number(numberOfRooms),
        description: description.trim(),
        businessLicenseNumber: businessLicenseNumber.trim(),
        businessLicense,
        guesthousePhotos,
        agreedToTerms: true,
      };

      console.log('Submitting owner application:', ownerApplication);

      const result = await register(ownerApplication);
      console.log('Owner registration result:', result);

      navigate('/login', {
        state: {
          message: 'Your owner registration has been submitted successfully. Please wait for administrator verification.',
        },
      });

      resetForm();
    } catch (err) {
      console.error('Owner registration error:', err);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 px-4 py-12">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 lg:p-10">

          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-2xl font-black text-stone-900">Guesthouse</span>
              <span className="text-2xl font-black text-stone-900"> Platform</span>
            </div>
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black text-stone-900">Create an Account</h2>
            <p className="mt-2 text-stone-500">Join Ethiopia's premier guesthouse platform</p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setRegistrationType('guest');
                setError('');
              }}
              className="w-full p-6 rounded-2xl border-2 border-stone-200 hover:border-amber-500 hover:bg-amber-50 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center group-hover:bg-amber-100 transition">
                  <User className="w-6 h-6 text-stone-700 group-hover:text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-stone-900">Register as Guest</h3>
                  <p className="text-sm text-stone-500">Book stays and manage reservations</p>
                </div>
                <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-amber-500 group-hover:translate-x-1 transition" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setRegistrationType('owner');
                setError('');
              }}
              className="w-full p-6 rounded-2xl border-2 border-stone-200 hover:border-amber-500 hover:bg-amber-50 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center group-hover:bg-amber-100 transition">
                  <Building2 className="w-6 h-6 text-stone-700 group-hover:text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-stone-900">Register as Owner</h3>
                  <p className="text-sm text-stone-500">List and manage your guesthouse</p>
                </div>
                <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-amber-500 group-hover:translate-x-1 transition" />
              </div>
            </button>
          </div>

          <p className="mt-8 text-center text-stone-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-amber-600 hover:text-amber-700 hover:underline">
              Sign In
            </Link>
          </p>

          <div className="mt-8 pt-6 border-t border-stone-200 text-center">
            <p className="text-sm text-stone-400">
              © 2026 Guesthouse Platform. All rights reserved.
            </p>
          </div>

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 lg:p-10">

          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-2xl font-black text-stone-900">Guesthouse</span>
              <span className="text-2xl font-black text-stone-900"> Platform</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBackToOptions}
            className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to options
          </button>

          <div className="mb-6 text-center">
            <h2 className="text-3xl font-black text-stone-900">Register as Guest</h2>
            <p className="mt-2 text-stone-500">Create your guest account to start booking</p>
          </div>

          {errorMessage}

          <form onSubmit={handleGuestSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Abebe Bikila"
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-stone-300 text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="guest@example.com"
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-stone-300 text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 9XXXXXXXX"
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-stone-300 text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-12 pr-12 py-4 rounded-xl border border-stone-300 text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full pl-12 pr-12 py-4 rounded-xl border border-stone-300 text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-lg rounded-xl transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Register as Guest</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-stone-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-amber-600 hover:text-amber-700 hover:underline">
              Sign In
            </Link>
          </p>

          <div className="mt-8 pt-6 border-t border-stone-200 text-center">
            <p className="text-sm text-stone-400">
              © 2026 Guesthouse Platform. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    );
  }

  // ============================================================
  // OWNER REGISTRATION PAGE
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={handleBackToOptions}
            className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to options
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 lg:p-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-2xl font-black text-stone-900">Guesthouse</span>
                <span className="text-2xl font-black text-stone-900"> Platform</span>
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-stone-900">Owner Registration</h2>
              <p className="mt-2 text-stone-500">
                Submit your guesthouse information for administrator verification
              </p>
            </div>

            {errorMessage}

            <form onSubmit={handleOwnerSubmit} className="space-y-8">
              <section>
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

              <section>
                <SectionHeader
                  icon={<CreditCard className="w-5 h-5" />}
                  title="Identification"
                  description="Used by administrators to verify your identity"
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">ID Type</label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="w-full px-4 py-4 rounded-xl border border-stone-300 text-base bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                    >
                      <option value="National ID">National ID</option>
                      <option value="Passport">Passport</option>
                      <option value="Driver's License">Driver's License</option>
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

              <section>
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
                    <label className="block text-sm font-bold text-stone-700 mb-2">Guesthouse Description</label>
                    <textarea
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      placeholder="Describe your guesthouse, location, services and facilities..."
                      className="w-full px-4 py-4 rounded-xl border border-stone-300 text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition resize-none"
                    />
                  </div>
                </div>
              </section>

              <section>
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

              <section>
                <SectionHeader
                  icon={<ImageIcon className="w-5 h-5" />}
                  title="Guesthouse Photos"
                  description="Upload photos of your property for verification"
                />

                <label className="block">
                  <div className="border-2 border-dashed border-stone-300 hover:border-amber-400 rounded-xl p-8 text-center cursor-pointer transition-colors">
                    <ImageIcon className="w-12 h-12 mx-auto text-stone-400 mb-3" />
                    <p className="text-base font-bold text-stone-700">Upload Guesthouse Photos</p>
                    <p className="text-sm text-stone-500 mt-1">
                      Exterior, rooms, reception, bathroom, facilities, etc.
                    </p>

                    {guesthousePhotos.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {guesthousePhotos.map((photo, index) => (
                          <div key={`${photo.name}-${index}`} className="relative group">
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
                                  previous.filter((_, photoIndex) => photoIndex !== index)
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
                    onChange={(e) => setGuesthousePhotos(Array.from(e.target.files || []))}
                    className="hidden"
                  />
                </label>
              </section>

              <section>
                <div className="rounded-xl bg-stone-50 border border-stone-200 p-6">
                  <div className="flex gap-3">
                    <ShieldCheck className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-base font-bold text-stone-900">Verification Agreement</h3>
                      <p className="text-sm text-stone-500 mt-1">
                        Your application will be reviewed by an administrator before your owner account is approved.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 mt-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 w-5 h-5 accent-amber-500"
                    />
                    <span className="text-sm text-stone-600">
                      I confirm that the information and documents I provide are accurate, that I am authorized
                      to register this guesthouse, and that I agree to the platform's verification process and terms.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-lg rounded-xl transition flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Submit Owner Application</span>
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-stone-500 mt-4">
                  Already registered?{' '}
                  <Link to="/login" className="font-bold text-amber-600 hover:text-amber-700 hover:underline">
                    Sign In Here
                  </Link>
                </p>
              </section>
            </form>

            <div className="mt-8 pt-6 border-t border-stone-200 text-center">
              <p className="text-sm text-stone-400">
                © 2026 Guesthouse Platform. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SECTION HEADER
// ============================================================

function SectionHeader({ icon, title, description }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-stone-900">{title}</h3>
        <p className="text-sm text-stone-500">{description}</p>
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
      <label className="block text-sm font-bold text-stone-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">{icon}</span>}
        <input
          type={type}
          required={required}
          min={min}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${icon ? 'pl-12' : 'px-4'} pr-4 py-4 rounded-xl border border-stone-300 text-base focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition`}
        />
      </div>
    </div>
  );
}

// ============================================================
// FILE INPUT
// ============================================================

function FileField({ label, file, onChange, required = false }) {
  return (
    <div>
      <label className="block text-sm font-bold text-stone-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <label className="flex items-center gap-3 w-full px-4 py-4 rounded-xl border border-stone-300 hover:border-amber-400 cursor-pointer transition-colors">
        <FileText className="w-5 h-5 text-stone-400 flex-shrink-0" />
        <span className="text-sm text-stone-500 truncate">
          {file ? file.name : 'Choose document...'}
        </span>
        <input
          type="file"
          required={required && !file}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
        />
      </label>
    </div>
  );
}

export default Register;