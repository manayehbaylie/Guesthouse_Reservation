import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Hash,
  FileText,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ShieldCheck,
  Save,
  Send,
  Loader2,
  X,
} from 'lucide-react';

export function GuesthouseManage() {
  const { user, switchUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [city, setCity] = useState('Addis Ababa');
  const [location, setLocation] = useState('');
  const [subCity, setSubCity] = useState('');
  const [woreda, setWoreda] = useState('');
  const [guesthousePhone, setGuesthousePhone] = useState('');
  const [guesthouseEmail, setGuesthouseEmail] = useState('');
  const [numberOfRooms, setNumberOfRooms] = useState('');
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState(
    'Free Wi-Fi, Breakfast Included, Generator Backup'
  );
  const [licenseNumber, setLicenseNumber] = useState('');

  /*
   * IMPORTANT:
   * mainImage can be:
   * - File object when owner selects a new image
   * - string when an existing image comes from backend
   */
  const [mainImage, setMainImage] = useState(null);

  /*
   * License can be:
   * - File object when a new document is selected
   * - null when using the existing backend document
   */
  const [licenseDocument, setLicenseDocument] = useState(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [existingGuesthouse, setExistingGuesthouse] = useState(null);

  /*
   * ---------------------------------------------------------
   * IMAGE PREVIEW
   * ---------------------------------------------------------
   */
  const [mainImagePreview, setMainImagePreview] = useState('');

  useEffect(() => {
    if (!mainImage) {
      setMainImagePreview('');
      return;
    }

    if (typeof mainImage === 'string') {
      setMainImagePreview(mainImage);
      return;
    }

    if (mainImage instanceof File) {
      const objectUrl = URL.createObjectURL(mainImage);

      setMainImagePreview(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    setMainImagePreview('');
  }, [mainImage]);

  /*
   * ---------------------------------------------------------
   * IMAGE URL HELPER
   * ---------------------------------------------------------
   *
   * If backend returns:
   * /uploads/guesthouses/example.jpg
   *
   * the browser needs the backend server URL when frontend
   * and backend run on different ports.
   */
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';

    if (
      imagePath.startsWith('http://') ||
      imagePath.startsWith('https://') ||
      imagePath.startsWith('blob:')
    ) {
      return imagePath;
    }

    const apiBase =
      import.meta.env.VITE_API_URL ||
      'http://localhost:5175';

    return `${apiBase.replace(/\/$/, '')}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  /*
   * ---------------------------------------------------------
   * LOAD OWNER GUESTHOUSE
   * ---------------------------------------------------------
   */
  useEffect(() => {
    let mounted = true;

    const fetchProperty = async () => {
      try {
        const gh = await ApiService.getMyGuesthouse();

        if (!mounted || !gh) {
          return;
        }

        setExistingGuesthouse(gh);

        setName(gh.name || '');
        setCity(gh.city || 'Addis Ababa');

        /*
         * Backend normally returns address.
         * Keep compatibility with location if available.
         */
        setLocation(gh.address || gh.location || '');

        setSubCity(gh.subCity || '');
        setWoreda(gh.woreda || '');
        setGuesthousePhone(gh.phone || '');
        setGuesthouseEmail(gh.email || '');
        setNumberOfRooms(gh.numberOfRooms || '');
        setDescription(gh.description || '');

        setLicenseNumber(gh.licenseNumber || '');

        setAmenities(
          Array.isArray(gh.amenities)
            ? gh.amenities.join(', ')
            : gh.amenities || 'Free Wi-Fi, Breakfast Included, Generator Backup'
        );

        /*
         * IMPORTANT:
         * Use the backend's main image first.
         *
         * Do NOT use additional photos because the owner form
         * no longer has an Additional Photos field.
         */
        setMainImage(gh.image || '');
      } catch (err) {
        console.error('Failed to load my guesthouse:', err);

        if (mounted) {
          setError('Could not load your guesthouse information.');
        }
      }
    };

    if (user?.role === 'OWNER') {
      fetchProperty();
    }

    return () => {
      mounted = false;
    };
  }, [user]);

  /*
   * ---------------------------------------------------------
   * FORM VALIDATION
   * ---------------------------------------------------------
   */
  const validateForm = () => {
    if (!name.trim()) {
      setError('Please enter a guesthouse name.');
      return false;
    }

    if (!location.trim()) {
      setError('Please enter a location / address.');
      return false;
    }

    if (!city.trim()) {
      setError('Please enter a city.');
      return false;
    }

    if (!numberOfRooms || Number(numberOfRooms) < 1) {
      setError('Number of rooms must be at least 1.');
      return false;
    }

    return true;
  };

  /*
   * ---------------------------------------------------------
   * BUILD PAYLOAD
   * ---------------------------------------------------------
   *
   * NO "photos" field.
   *
   * Main image is the only guesthouse image uploaded from
   * this form.
   */
  const buildGuesthouseData = () => {
    return {
      name: name.trim(),
      city: city.trim(),
      address: location.trim(),

      image:
        mainImage instanceof File
          ? mainImage
          : undefined,

      subCity: subCity.trim(),
      woreda: woreda.trim(),

      phone: guesthousePhone.trim(),
      email: guesthouseEmail.trim(),

      numberOfRooms: numberOfRooms
        ? Number(numberOfRooms)
        : undefined,

      description:
        description.trim() ||
        'A welcoming guesthouse offering quality accommodations and excellent service.',

      licenseNumber: licenseNumber.trim(),

      /*
       * This is the actual File object when a new license
       * document is selected.
       */
      licenseDocument,
    };
  };

  /*
   * ---------------------------------------------------------
   * SAVE DRAFT
   * ---------------------------------------------------------
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const data = buildGuesthouseData();

      if (existingGuesthouse) {
        const updated = await ApiService.saveGuesthouseDraft(data);

        setExistingGuesthouse(updated || existingGuesthouse);

        /*
         * If the API returns the newly saved image,
         * update the local image reference.
         */
        if (updated?.image) {
          setMainImage(updated.image);
        }

        setSuccess('Guesthouse draft saved successfully.');
      } else {
        const registered = await ApiService.registerGuesthouse(data);

        setExistingGuesthouse(registered);

        if (registered?.image) {
          setMainImage(registered.image);
        }

        setSuccess(
          'Guesthouse registered successfully! Your property is now pending administrator review.'
        );

        if (user) {
          switchUser({
            ...user,
            guesthouseId: registered?.id,
          });
        }
      }
    } catch (err) {
      console.error('Save guesthouse error:', err);

      setError(
        err?.message ||
          err?.response?.data?.message ||
          'Error saving guesthouse.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * SUBMIT FOR ADMINISTRATOR REVIEW
   * ---------------------------------------------------------
   */
  const handleSubmitForReview = async () => {
    if (!validateForm()) {
      return;
    }

    /*
     * License is required for administrator verification.
     *
     * If an existing document already exists, we do not
     * require the owner to upload it again.
     */
    const existingLicense =
      existingGuesthouse?.licenseDocument;

    if (!licenseDocument && !existingLicense) {
      setError('License document is required.');
      return;
    }

    /*
     * Main image is also required for a proper public property.
     */
    const existingImage =
      existingGuesthouse?.image;

    if (!mainImage && !existingImage) {
      setError('Please upload a main guesthouse image.');
      return;
    }

    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const data = buildGuesthouseData();

      /*
       * New guesthouse
       */
      if (!existingGuesthouse) {
        const registered =
          await ApiService.registerGuesthouse(data);

        setExistingGuesthouse(registered);

        if (registered?.image) {
          setMainImage(registered.image);
        }

        if (user) {
          switchUser({
            ...user,
            guesthouseId: registered?.id,
          });
        }
      }

      /*
       * Rejected guesthouse
       */
      else if (
        String(existingGuesthouse.status || '').toUpperCase() ===
        'REJECTED'
      ) {
        const resubmitted =
          await ApiService.resubmitGuesthouse(data);

        setExistingGuesthouse(resubmitted);

        if (resubmitted?.image) {
          setMainImage(resubmitted.image);
        }
      }

      /*
       * Draft / existing guesthouse
       */
      else {
        const updated =
          await ApiService.submitGuesthouseForReview(data);

        setExistingGuesthouse(updated);

        if (updated?.image) {
          setMainImage(updated.image);
        }
      }

      setSuccess(
        'Guesthouse submitted for administrator review successfully.'
      );

      /*
       * Keep your existing dashboard workflow.
       */
      setTimeout(() => {
        navigate('/owner');
      }, 1500);
    } catch (err) {
      console.error('Submit guesthouse error:', err);

      setError(
        err?.message ||
          err?.response?.data?.message ||
          'Error submitting guesthouse for review.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * REMOVE SELECTED NEW IMAGE
   * ---------------------------------------------------------
   *
   * If the current image comes from the database, don't
   * delete it from the database accidentally.
   */
  const handleRemoveNewImage = () => {
    if (mainImage instanceof File) {
      setMainImage(existingGuesthouse?.image || '');
    }
  };

  /*
   * Remove selected new license.
   * Existing backend license remains untouched.
   */
  const handleRemoveNewLicense = () => {
    setLicenseDocument(null);
  };

  /*
   * ---------------------------------------------------------
   * FILE HANDLERS
   * ---------------------------------------------------------
   */
  const handleMainImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    /*
     * 5MB maximum.
     */
    if (file.size > 5 * 1024 * 1024) {
      setError('Main image must be 5MB or smaller.');
      return;
    }

    setError('');
    setMainImage(file);
  };

  const handleLicenseChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        'License document must be PDF, JPG, JPEG, or PNG.'
      );
      return;
    }

    /*
     * 5MB maximum.
     */
    if (file.size > 5 * 1024 * 1024) {
      setError('License document must be 5MB or smaller.');
      return;
    }

    setError('');
    setLicenseDocument(file);
  };

  /*
   * ---------------------------------------------------------
   * STATUS
   * ---------------------------------------------------------
   */
  const status = String(
    existingGuesthouse?.status || 'DRAFT'
  ).toUpperCase();

  const statusLabel = status.replace(/_/g, ' ');

  const isPending = status === 'PENDING';
  const isApproved = status === 'APPROVED';
  const isRejected = status === 'REJECTED';

  /*
   * Current image URL.
   */
  const displayImageUrl = useMemo(() => {
    if (!mainImagePreview) {
      return '';
    }

    return getImageUrl(mainImagePreview);
  }, [mainImagePreview]);

  /*
   * ---------------------------------------------------------
   * REUSABLE INPUT STYLE
   * ---------------------------------------------------------
   */
  const inputClass =
    'w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0a4263] focus:ring-4 focus:ring-[#0a4263]/10 placeholder:text-slate-400';

  const textareaClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#0a4263] focus:ring-4 focus:ring-[#0a4263]/10 placeholder:text-slate-400 resize-none';

  const labelClass =
    'mb-2 block text-[11px] font-black uppercase tracking-wide text-[#0a4263]';

  return (
    <div className="min-h-screen bg-[#063e60] px-3 py-6 sm:px-5 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">

        {/* --------------------------------------------------
            BACK BUTTON
        -------------------------------------------------- */}
        <button
          type="button"
          onClick={() => navigate('/owner')}
          className="mb-4 flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-white/90 transition hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" />
          Back to Owner Dashboard
        </button>

        {/* ==================================================
            ONE MAIN CONTAINER
        ================================================== */}
        <div className="overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl">

          {/* ------------------------------------------------
              HEADER
          ------------------------------------------------ */}
          <div className="bg-[#063e60] px-5 py-6 sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#ffbd08] text-[#063e60] shadow-lg">
                  <Building2 className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#ffbd08]">
                    Property Console
                  </p>

                  <h1 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">
                    Guesthouse Registration
                  </h1>

                  <p className="mt-1 text-xs font-medium text-white/70">
                    Manage your property information and submit it for verification.
                  </p>
                </div>
              </div>

              {/* STATUS */}
              <div className="flex items-center gap-2 self-start rounded-full border border-[#ffbd08]/40 bg-white/10 px-4 py-2 sm:self-auto">
                <span className="h-2 w-2 rounded-full bg-[#ffbd08]" />

                <span className="text-xs font-black uppercase tracking-wide text-[#ffbd08]">
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------
              ADMIN VERIFICATION NOTICE
          ------------------------------------------------ */}
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-8">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#063e60] text-[#ffbd08]">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-sm font-black text-[#063e60]">
                  Administrator verification
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Your guesthouse becomes publicly visible after administrator approval.
                  The uploaded main image and license document are saved with your
                  property information for administrator review.
                </p>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------
              ALERTS
          ------------------------------------------------ */}
          <div className="space-y-3 px-5 pt-5 sm:px-8">

            {success && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                <div>
                  <p className="text-sm font-black">
                    Success
                  </p>

                  <p className="mt-0.5 text-xs font-semibold">
                    {success}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-800"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                <div>
                  <p className="text-sm font-black">
                    Please check this form
                  </p>

                  <p className="mt-0.5 text-xs font-semibold">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {isRejected &&
              existingGuesthouse?.rejectionReason && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
                  <p className="text-sm font-black text-red-800">
                    Administrator rejection reason
                  </p>

                  <p className="mt-1 text-xs font-semibold leading-5 text-red-700">
                    {existingGuesthouse.rejectionReason}
                  </p>
                </div>
              )}
          </div>

          {/* ==================================================
              FORM
          ================================================== */}
          <form
            onSubmit={handleSubmit}
            className="px-5 pb-8 pt-6 sm:px-8"
          >

            {/* ------------------------------------------------
                PROPERTY INFORMATION
            ------------------------------------------------ */}
            <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6">

              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#063e60] text-[#ffbd08]">
                  <Building2 className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-base font-black text-[#063e60]">
                    Property Information
                  </h2>

                  <p className="text-xs font-medium text-slate-500">
                    Basic guesthouse information
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* NAME */}
                <div>
                  <label className={labelClass}>
                    Guesthouse Name *
                  </label>

                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter guesthouse name"
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>

                {/* CITY */}
                <div>
                  <label className={labelClass}>
                    City *
                  </label>

                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Addis Ababa"
                    className={inputClass}
                  />
                </div>

                {/* ADDRESS */}
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Address / Location *
                  </label>

                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter complete address"
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>

                {/* SUB CITY */}
                <div>
                  <label className={labelClass}>
                    Sub-city
                  </label>

                  <input
                    type="text"
                    value={subCity}
                    onChange={(e) => setSubCity(e.target.value)}
                    placeholder="Enter sub-city"
                    className={inputClass}
                  />
                </div>

                {/* WOREDA */}
                <div>
                  <label className={labelClass}>
                    Woreda
                  </label>

                  <input
                    type="text"
                    value={woreda}
                    onChange={(e) => setWoreda(e.target.value)}
                    placeholder="Enter woreda"
                    className={inputClass}
                  />
                </div>

                {/* PHONE */}
                <div>
                  <label className={labelClass}>
                    Phone
                  </label>

                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="tel"
                      value={guesthousePhone}
                      onChange={(e) =>
                        setGuesthousePhone(e.target.value)
                      }
                      placeholder="+251 ..."
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>

                {/* EMAIL */}
                <div>
                  <label className={labelClass}>
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="email"
                      value={guesthouseEmail}
                      onChange={(e) =>
                        setGuesthouseEmail(e.target.value)
                      }
                      placeholder="guesthouse@example.com"
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>

                {/* ROOMS */}
                <div>
                  <label className={labelClass}>
                    Number of Rooms *
                  </label>

                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="number"
                      min="1"
                      required
                      value={numberOfRooms}
                      onChange={(e) =>
                        setNumberOfRooms(e.target.value)
                      }
                      placeholder="15"
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>

                {/* LICENSE NUMBER */}
                <div>
                  <label className={labelClass}>
                    Business / License Number
                  </label>

                  <div className="relative">
                    <FileText className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) =>
                        setLicenseNumber(e.target.value)
                      }
                      placeholder="Enter license number"
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------
                  DESCRIPTION
              ------------------------------------------------ */}
              <div className="mt-5">
                <label className={labelClass}>
                  Guesthouse Description
                </label>

                <textarea
                  rows={5}
                  maxLength={500}
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Describe your guesthouse, rooms, services and environment..."
                  className={textareaClass}
                />

                <div className="mt-1 text-right text-[10px] font-bold text-slate-400">
                  {description.length} / 500
                </div>
              </div>

              {/* ------------------------------------------------
                  AMENITIES
              ------------------------------------------------ */}
              <div className="mt-4">
                <label className={labelClass}>
                  Amenities
                  <span className="ml-1 normal-case font-semibold text-slate-400">
                    (comma separated)
                  </span>
                </label>

                <input
                  type="text"
                  value={amenities}
                  onChange={(e) =>
                    setAmenities(e.target.value)
                  }
                  placeholder="Free Wi-Fi, Breakfast, Parking..."
                  className={inputClass}
                />
              </div>
            </section>

            {/* ==================================================
                DOCUMENTS & MAIN IMAGE
            ================================================== */}
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">

              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#063e60] text-[#ffbd08]">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-base font-black text-[#063e60]">
                    Verification Documents
                  </h2>

                  <p className="text-xs font-medium text-slate-500">
                    Upload the property image and license document for administrator review.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* ==================================================
                    MAIN IMAGE
                ================================================== */}
                <div>
                  <label className={labelClass}>
                    Upload Main Image *
                  </label>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">

                    {/* IMAGE PREVIEW */}
                    <div className="relative flex min-h-[210px] items-center justify-center overflow-hidden bg-slate-100">

                      {displayImageUrl ? (
                        <>
                          <img
                            src={displayImageUrl}
                            alt="Guesthouse main preview"
                            className="h-[210px] w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />

                          {/* New file remove button */}
                          {mainImage instanceof File && (
                            <button
                              type="button"
                              onClick={handleRemoveNewImage}
                              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
                              title="Remove selected image"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
                          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
                            <ImageIcon className="h-7 w-7" />
                          </div>

                          <p className="text-sm font-black text-slate-600">
                            No main image selected
                          </p>

                          <p className="mt-1 text-xs font-medium text-slate-400">
                            Upload the guesthouse image below
                          </p>
                        </div>
                      )}
                    </div>

                    {/* FILE INFORMATION */}
                    <div className="border-t border-slate-200 bg-white p-4">

                      {mainImage instanceof File ? (
                        <div className="mb-3 flex items-center gap-3 rounded-xl bg-emerald-50 px-3 py-3">
                          <ImageIcon className="h-5 w-5 shrink-0 text-emerald-600" />

                          <div className="min-w-0">
                            <p className="truncate text-xs font-black text-emerald-800">
                              {mainImage.name}
                            </p>

                            <p className="text-[10px] font-semibold text-emerald-600">
                              {(mainImage.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      ) : existingGuesthouse?.image ? (
                        <div className="mb-3 rounded-xl bg-slate-50 px-3 py-3">
                          <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                            Current uploaded image
                          </p>

                          <p className="mt-1 truncate text-xs font-bold text-[#063e60]">
                            {existingGuesthouse.image}
                          </p>
                        </div>
                      ) : null}

                      <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#063e60] px-4 text-xs font-black text-white transition hover:bg-[#052f4a]">
                        <Upload className="h-4 w-4" />

                        {mainImage instanceof File
                          ? 'Change Main Image'
                          : 'Upload Main Image'}

                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleMainImageChange}
                          className="hidden"
                        />
                      </label>

                      <p className="mt-2 text-[10px] font-semibold text-slate-400">
                        JPG, PNG or WEBP • Maximum 5MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* ==================================================
                    LICENSE DOCUMENT
                ================================================== */}
                <div>
                  <label className={labelClass}>
                    Uploaded License Document *
                  </label>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                    {/* DOCUMENT DISPLAY */}
                    <div className="mb-4 flex min-h-[210px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-5">

                      {licenseDocument ? (
                        <>
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                            <FileText className="h-8 w-8" />
                          </div>

                          <p className="mt-4 max-w-full truncate text-sm font-black text-[#063e60]">
                            {licenseDocument.name}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            {(licenseDocument.size / 1024 / 1024).toFixed(2)} MB
                          </p>

                          <button
                            type="button"
                            onClick={handleRemoveNewLicense}
                            className="mt-4 flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                            Remove selected document
                          </button>
                        </>
                      ) : existingGuesthouse?.licenseDocument ? (
                        <>
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                            <FileText className="h-8 w-8" />
                          </div>

                          <p className="mt-4 text-xs font-black text-[#063e60]">
                            License document uploaded
                          </p>

                          <p className="mt-1 max-w-full truncate text-[10px] font-semibold text-slate-400">
                            {existingGuesthouse.licenseDocument}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
                            <FileText className="h-8 w-8" />
                          </div>

                          <p className="mt-4 text-sm font-black text-slate-600">
                            No license document
                          </p>

                          <p className="mt-1 text-xs font-medium text-slate-400">
                            Upload a valid business/license document
                          </p>
                        </>
                      )}
                    </div>

                    {/* UPLOAD */}
                    <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-[#063e60] bg-white px-4 text-xs font-black text-[#063e60] transition hover:bg-[#063e60] hover:text-white">
                      <Upload className="h-4 w-4" />

                      {licenseDocument
                        ? 'Change License Document'
                        : existingGuesthouse?.licenseDocument
                          ? 'Replace License Document'
                          : 'Upload License Document'}

                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleLicenseChange}
                        className="hidden"
                      />
                    </label>

                    <p className="mt-2 text-[10px] font-semibold text-slate-400">
                      PDF, JPG, JPEG or PNG • Maximum 5MB
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ==================================================
                IMPORTANT: NO ADDITIONAL PHOTOS SECTION
            ================================================== */}

            {/* ==================================================
                ACTION BUTTONS
            ================================================== */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">

              {/* SAVE DRAFT */}
              <button
                type="submit"
                disabled={loading}
                className="flex h-14 items-center justify-center gap-2 rounded-xl border-2 border-[#063e60] bg-white px-5 text-sm font-black text-[#063e60] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}

                <span>
                  {loading ? 'Saving...' : 'Save Draft'}
                </span>
              </button>

              {/* SUBMIT */}
              <button
                type="button"
                disabled={loading || isPending}
                onClick={handleSubmitForReview}
                className="flex h-14 items-center justify-center gap-2 rounded-xl bg-[#ffbd08] px-5 text-sm font-black text-[#063e60] shadow-lg transition hover:bg-[#f7b500] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}

                <span>
                  {isPending
                    ? 'Pending Administrator Review'
                    : isRejected
                      ? 'Resubmit for Review'
                      : isApproved
                        ? 'Update Property'
                        : 'Submit for Review'}
                </span>
              </button>
            </div>

            {/* ------------------------------------------------
                SECURITY NOTE
            ------------------------------------------------ */}
            <div className="mt-5 flex items-center justify-center gap-2 text-center text-[10px] font-bold text-slate-400">
              <ShieldCheck className="h-4 w-4" />

              <span>
                Your property information and verification documents are securely stored.
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default GuesthouseManage;