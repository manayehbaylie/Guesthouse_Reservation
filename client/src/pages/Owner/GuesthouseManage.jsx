import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

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
  const { t } = useLanguage();
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
  const [roomImageRecords, setRoomImageRecords] = useState([]);
  const [pendingRoomImages, setPendingRoomImages] = useState([]);
  const [roomMediaError, setRoomMediaError] = useState('');
  const [roomMediaMessage, setRoomMediaMessage] = useState('');
  const [uploadingRoomImages, setUploadingRoomImages] = useState(false);
  const [deletingRoomImageId, setDeletingRoomImageId] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoError, setVideoError] = useState('');
  const [videoMessage, setVideoMessage] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const previewUrls = useRef(new Set());

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

  useEffect(() => () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.current.clear();
  }, []);

  useEffect(() => {
    if (!videoFile) {
      setVideoPreview('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(videoFile);
    setVideoPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [videoFile]);

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
        setRoomImageRecords(
          (gh.rooms || []).flatMap((room) =>
            (room.images || []).map((image) => ({
              ...image,
              roomId: room.id,
              roomNumber: room.roomNumber,
            }))
          )
        );

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

  const getRoomImageCount = (roomId, excludingId = null) =>
    roomImageRecords.filter(
      (image) => String(image.roomId) === String(roomId)
    ).length +
    pendingRoomImages.filter(
      (image) =>
        image.id !== excludingId &&
        String(image.roomId) === String(roomId)
    ).length;

  const handleRoomImageSelection = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    setRoomMediaError('');
    setRoomMediaMessage('');

    if (pendingRoomImages.length + files.length > 30) {
      setRoomMediaError('You can upload at most 30 room images at a time.');
      return;
    }

    const acceptedFiles = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setRoomMediaError(`${file.name} is not a supported image file.`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setRoomMediaError(`${file.name} exceeds the 5MB image limit.`);
        continue;
      }

      const preview = URL.createObjectURL(file);
      previewUrls.current.add(preview);
      acceptedFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview,
        roomId: '',
        progress: 0,
        uploaded: null,
        status: '',
      });
    }

    if (acceptedFiles.length) {
      setPendingRoomImages((current) => [...current, ...acceptedFiles]);
    }
  };

  const handleRoomAssignment = (imageId, roomId) => {
    if (roomId && getRoomImageCount(roomId, imageId) >= 10) {
      setRoomMediaError('Each room can have a maximum of 10 images.');
      return;
    }

    setRoomMediaError('');
    setPendingRoomImages((current) =>
      current.map((image) =>
        image.id === imageId ? { ...image, roomId } : image
      )
    );
  };

  const removePendingRoomImage = (imageId) => {
    const image = pendingRoomImages.find((item) => item.id === imageId);
    if (image?.preview) {
      URL.revokeObjectURL(image.preview);
      previewUrls.current.delete(image.preview);
    }

    setPendingRoomImages((current) =>
      current.filter((item) => item.id !== imageId)
    );
  };

  const refreshRoomImages = async () => {
    const guesthouse = await ApiService.getMyGuesthouse();
    if (!guesthouse) return;

    setExistingGuesthouse(guesthouse);
    setRoomImageRecords(
      (guesthouse.rooms || []).flatMap((room) =>
        (room.images || []).map((image) => ({
          ...image,
          roomId: room.id,
          roomNumber: room.roomNumber,
        }))
      )
    );
  };

  const handleUploadRoomImages = async () => {
    if (!existingGuesthouse?.id || pendingRoomImages.length === 0) {
      setRoomMediaError('Choose one or more images to upload.');
      return;
    }

    if (pendingRoomImages.some((image) => !image.roomId)) {
      setRoomMediaError('Choose a room for every selected image.');
      return;
    }

    for (const image of pendingRoomImages) {
      const roomId = String(image.roomId);
      if (getRoomImageCount(roomId) > 10) {
        setRoomMediaError('Each room can have a maximum of 10 images.');
        return;
      }
    }

    setUploadingRoomImages(true);
    setRoomMediaError('');
    setRoomMediaMessage('');

    const uploaded = new Map(
      pendingRoomImages
        .filter((image) => image.uploaded)
        .map((image) => [image.id, image.uploaded])
    );

    try {
      await Promise.all(
        pendingRoomImages
          .filter((image) => !image.uploaded)
          .map(async (image) => {
            try {
              const result = await ApiService.uploadMediaToCloudinary(
                image.file,
                'image',
                (progress) => {
                  setPendingRoomImages((current) =>
                    current.map((item) =>
                      item.id === image.id
                        ? { ...item, progress, status: 'Uploading' }
                        : item
                    )
                  );
                }
              );

              if (!result.secure_url || !result.public_id) {
                throw new Error('Cloudinary did not return the image URL and public ID.');
              }

              const asset = {
                url: result.secure_url,
                publicId: result.public_id,
              };
              uploaded.set(image.id, asset);
              setPendingRoomImages((current) =>
                current.map((item) =>
                  item.id === image.id
                    ? { ...item, uploaded: asset, progress: 100, status: 'Uploaded' }
                    : item
                )
              );
            } catch (uploadError) {
              setPendingRoomImages((current) =>
                current.map((item) =>
                  item.id === image.id
                    ? { ...item, status: uploadError.message }
                    : item
                )
              );
            }
          })
      );

      const readyImages = pendingRoomImages
        .filter((image) => uploaded.has(image.id))
        .map((image) => ({
          id: image.id,
          roomId: Number(image.roomId),
          ...uploaded.get(image.id),
        }));

      if (readyImages.length === 0) {
        setRoomMediaError('No images were uploaded successfully. Please retry.');
        return;
      }

      setPendingRoomImages((current) =>
        current.map((image) =>
          uploaded.has(image.id)
            ? { ...image, uploaded: uploaded.get(image.id) }
            : image
        )
      );

      await ApiService.createRoomImages(
        readyImages.map(({ roomId, url, publicId }) => ({
          roomId,
          url,
          publicId,
        }))
      );

      readyImages.forEach(({ id }) => removePendingRoomImage(id));
      const failedCount = pendingRoomImages.length - readyImages.length;
      setRoomMediaMessage(
        `${readyImages.length} room image${readyImages.length === 1 ? '' : 's'} uploaded successfully.${failedCount ? ` ${failedCount} image${failedCount === 1 ? '' : 's'} need a retry.` : ''}`
      );

      try {
        await refreshRoomImages();
      } catch (refreshError) {
        console.error('Saved room images but could not refresh the list:', refreshError);
        setRoomMediaError('Images were saved, but the room image list could not refresh. Reload this page.');
      }
    } catch (uploadError) {
      console.error('Room image upload failed:', uploadError);
      setRoomMediaError(uploadError.message || 'Could not save room images.');
    } finally {
      setUploadingRoomImages(false);
    }
  };

  const handleDeleteRoomImage = async (image) => {
    setDeletingRoomImageId(image.id);
    setRoomMediaError('');
    setRoomMediaMessage('');

    try {
      await ApiService.deleteRoomImage(image.id);
      setRoomImageRecords((current) =>
        current.filter((item) => item.id !== image.id)
      );
      setRoomMediaMessage('Room image deleted successfully.');
    } catch (deleteError) {
      console.error('Room image deletion failed:', deleteError);
      setRoomMediaError(deleteError.message || 'Could not delete room image.');
    } finally {
      setDeletingRoomImageId(null);
    }
  };

  const handleVideoSelection = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setVideoError('');
    setVideoMessage('');

    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setVideoError('The video exceeds the 50MB limit.');
      return;
    }

    const isSupportedVideo =
      ['video/mp4', 'video/webm'].includes(file.type) ||
      /\.(mp4|webm)$/i.test(file.name);

    if (!isSupportedVideo) {
      setVideoError('Choose an MP4 or WebM video.');
      return;
    }

    setVideoFile(file);
    setVideoProgress(0);
  };

  const handleUploadVideo = async () => {
    if (!videoFile) {
      setVideoError('Choose an MP4 or WebM video first.');
      return;
    }

    setUploadingVideo(true);
    setVideoError('');
    setVideoMessage('');

    try {
      const result = await ApiService.uploadMediaToCloudinary(
        videoFile,
        'video',
        setVideoProgress
      );

      if (!result.secure_url || !result.public_id) {
        throw new Error('Cloudinary did not return the video URL and public ID.');
      }

      const updated = await ApiService.updateGuesthouseVideo({
        url: result.secure_url,
        publicId: result.public_id,
      });

      setExistingGuesthouse((current) => ({
        ...current,
        videoUrl: updated?.videoUrl || result.secure_url,
        videoPublicId: updated?.videoPublicId || result.public_id,
      }));
      setVideoFile(null);
      setVideoProgress(100);
      setVideoMessage('Guesthouse video uploaded successfully.');
    } catch (uploadError) {
      console.error('Guesthouse video upload failed:', uploadError);
      setVideoError(uploadError.message || 'Could not upload the video.');
    } finally {
      setUploadingVideo(false);
    }
  };

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
          : typeof mainImage === 'string' && mainImage.trim()
            ? mainImage.trim()
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

  const statusLabel = t(status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase()));

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
          {t('Back to Owner Dashboard')}
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
                    {t('Property Console')}
                  </p>

                  <h1 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">
                    {t('Guesthouse Registration')}
                  </h1>

                  <p className="mt-1 text-xs font-medium text-white/70">
                    {t('Manage your property information and submit it for verification.')}
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
                  {t('Administrator verification')}
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {t('Your guesthouse becomes publicly visible after administrator approval.')}
                  {' '}{t('The uploaded main image and license document are saved with your property information for administrator review.')}
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
                    {t('Success')}
                  </p>

                  <p className="mt-0.5 text-xs font-semibold">
                    {t(success)}
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
                    {t('Please check this form')}
                  </p>

                  <p className="mt-0.5 text-xs font-semibold">
                    {t(error)}
                  </p>
                </div>
              </div>
            )}

            {isRejected &&
              existingGuesthouse?.rejectionReason && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
                  <p className="text-sm font-black text-red-800">
                    {t('Administrator rejection reason')}
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
                    {t('Property Information')}
                  </h2>

                  <p className="text-xs font-medium text-slate-500">
                    {t('Basic guesthouse information')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* NAME */}
                <div>
                  <label className={labelClass}>
                    {t('Guesthouse Name')} *
                  </label>

                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('Enter guesthouse name')}
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>

                {/* CITY */}
                <div>
                  <label className={labelClass}>
                    {t('City *')}
                  </label>

                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t('Addis Ababa')}
                    className={inputClass}
                  />
                </div>

                {/* ADDRESS */}
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    {t('Address / Location *')}
                  </label>

                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={t('Enter complete address')}
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>

                {/* SUB CITY */}
                <div>
                  <label className={labelClass}>
                    {t('Sub-city')}
                  </label>

                  <input
                    type="text"
                    value={subCity}
                    onChange={(e) => setSubCity(e.target.value)}
                    placeholder={t('Enter sub-city')}
                    className={inputClass}
                  />
                </div>

                {/* WOREDA */}
                <div>
                  <label className={labelClass}>
                    {t('Woreda')}
                  </label>

                  <input
                    type="text"
                    value={woreda}
                    onChange={(e) => setWoreda(e.target.value)}
                    placeholder={t('Enter woreda')}
                    className={inputClass}
                  />
                </div>

                {/* PHONE */}
                <div>
                  <label className={labelClass}>
                    {t('Phone')}
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
                    {t('Email Address')}
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
                    {t('Number of Rooms *')}
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
                    {t('Business / License Number')}
                  </label>

                  <div className="relative">
                    <FileText className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) =>
                        setLicenseNumber(e.target.value)
                      }
                      placeholder={t('Enter license number')}
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
                  {t('Guesthouse Description')}
                </label>

                <textarea
                  rows={5}
                  maxLength={500}
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder={t('Describe your guesthouse, rooms, services and environment...')}
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
                  {t('Amenities')}
                  <span className="ml-1 normal-case font-semibold text-slate-400">
                    ({t('comma separated')})
                  </span>
                </label>

                <input
                  type="text"
                  value={amenities}
                  onChange={(e) =>
                    setAmenities(e.target.value)
                  }
                  placeholder={t('Free Wi-Fi, Breakfast, Parking...')}
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
                    {t('Verification Documents')}
                  </h2>

                  <p className="text-xs font-medium text-slate-500">
                    {t('Upload the property image and license document for administrator review.')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* ==================================================
                    MAIN IMAGE
                ================================================== */}
                <div>
                  <label className={labelClass}>
                    {t('Upload Main Image *')}
                  </label>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">

                    {/* IMAGE PREVIEW */}
                    <div className="relative flex min-h-[210px] items-center justify-center overflow-hidden bg-slate-100">

                      {displayImageUrl ? (
                        <>
                          <img
                            src={displayImageUrl}
                            alt={t('Guesthouse main preview')}
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
                              title={t('Remove selected image')}
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
                            {t('No main image selected')}
                          </p>

                          <p className="mt-1 text-xs font-medium text-slate-400">
                            {t('Upload the guesthouse image below')}
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
                            {t('Current uploaded image')}
                          </p>

                          <p className="mt-1 truncate text-xs font-bold text-[#063e60]">
                            {existingGuesthouse.image}
                          </p>
                        </div>
                      ) : null}

                      <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#063e60] px-4 text-xs font-black text-white transition hover:bg-[#052f4a]">
                        <Upload className="h-4 w-4" />

                        {mainImage instanceof File
                          ? t('Change Main Image')
                          : t('Upload Main Image')}

                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleMainImageChange}
                          className="hidden"
                        />
                      </label>

                      <p className="mt-2 text-[10px] font-semibold text-slate-400">
                        {t('JPG, PNG or WEBP • Maximum 5MB')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ==================================================
                    LICENSE DOCUMENT
                ================================================== */}
                <div>
                  <label className={labelClass}>
                    {t('Uploaded License Document *')}
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
                            {t('Remove selected document')}
                          </button>
                        </>
                      ) : existingGuesthouse?.licenseDocument ? (
                        <>
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                            <FileText className="h-8 w-8" />
                          </div>

                          <p className="mt-4 text-xs font-black text-[#063e60]">
                            {t('License document uploaded')}
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
                            {t('No license document')}
                          </p>

                          <p className="mt-1 text-xs font-medium text-slate-400">
                            {t('Upload a valid business/license document')}
                          </p>
                        </>
                      )}
                    </div>

                    {/* UPLOAD */}
                    <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-[#063e60] bg-white px-4 text-xs font-black text-[#063e60] transition hover:bg-[#063e60] hover:text-white">
                      <Upload className="h-4 w-4" />

                      {licenseDocument
                        ? t('Change License Document')
                        : existingGuesthouse?.licenseDocument
                          ? t('Replace License Document')
                          : t('Upload License Document')}

                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleLicenseChange}
                        className="hidden"
                      />
                    </label>

                    <p className="mt-2 text-[10px] font-semibold text-slate-400">
                      {t('PDF, JPG, JPEG or PNG • Maximum 5MB')}
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
                  {loading ? t('Saving...') : t('Save Draft')}
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
                    ? t('Pending Administrator Review')
                    : isRejected
                      ? t('Resubmit for Review')
                      : isApproved
                        ? t('Update Property')
                        : t('Submit for Review')}
                </span>
              </button>
            </div>

            {/* ------------------------------------------------
                SECURITY NOTE
            ------------------------------------------------ */}
            <div className="mt-5 flex items-center justify-center gap-2 text-center text-[10px] font-bold text-slate-400">
              <ShieldCheck className="h-4 w-4" />

              <span>
                {t('Your property information and verification documents are securely stored.')}
              </span>
            </div>
          </form>

          {existingGuesthouse && (
            <section className="space-y-6 border-t border-slate-200 px-5 py-6 sm:px-8">
              <div>
                <h2 className="text-lg font-black text-[#063e60]">
                  {t('Room images and guesthouse video')}
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {t('Upload room images directly to Cloudinary and assign each image to a room.')}
                </p>
              </div>

              {(roomMediaError || roomMediaMessage) && (
                <p
                  role={roomMediaError ? 'alert' : 'status'}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                    roomMediaError
                      ? 'border border-red-200 bg-red-50 text-red-700'
                      : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                  }`}
                >
                  {t(roomMediaError || roomMediaMessage)}
                </p>
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-black text-[#063e60]">
                      {t('Room image library')}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {t('Maximum 5MB per image, 10 images per room, and 30 images per upload.')}
                    </p>
                  </div>
                  <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#063e60] px-4 text-xs font-black text-white transition hover:bg-[#052f4a]">
                    <Upload className="h-4 w-4" />
                    {t('Select room images')}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={!existingGuesthouse.rooms?.length || uploadingRoomImages}
                      onChange={handleRoomImageSelection}
                      className="hidden"
                    />
                  </label>
                </div>

                {pendingRoomImages.length > 0 && (
                  <div className="mt-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {pendingRoomImages.map((image) => (
                        <div key={image.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                          <div className="relative aspect-square bg-slate-100">
                            <img
                              src={image.preview}
                              alt={image.file.name}
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              disabled={uploadingRoomImages}
                              onClick={() => removePendingRoomImage(image.id)}
                              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow disabled:opacity-50"
                              aria-label={t('Remove selected image')}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="space-y-2 p-3">
                            <p className="truncate text-[11px] font-bold text-slate-700">
                              {image.file.name}
                            </p>
                            <select
                              value={image.roomId}
                              disabled={uploadingRoomImages}
                              onChange={(event) =>
                                handleRoomAssignment(image.id, event.target.value)
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs"
                            >
                              <option value="">{t('Choose a room')}</option>
                              {(existingGuesthouse.rooms || []).map((room) => (
                                <option
                                  key={room.id}
                                  value={room.id}
                                  disabled={
                                    getRoomImageCount(room.id, image.id) >= 10 &&
                                    String(room.id) !== String(image.roomId)
                                  }
                                >
                                  {t('Room')} {room.roomNumber || room.id} ({getRoomImageCount(room.id, image.id)}/10)
                                </option>
                              ))}
                            </select>
                            {image.status && (
                              <p className="truncate text-[10px] font-semibold text-slate-500">
                                {image.status}
                              </p>
                            )}
                            {image.progress > 0 && image.progress < 100 && (
                              <progress
                                className="h-2 w-full accent-[#063e60]"
                                max="100"
                                value={image.progress}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={uploadingRoomImages}
                      onClick={handleUploadRoomImages}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ffbd08] px-5 text-xs font-black text-[#063e60] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {uploadingRoomImages && <Loader2 className="h-4 w-4 animate-spin" />}
                      {uploadingRoomImages ? t('Uploading images...') : t('Upload all')}
                    </button>
                  </div>
                )}

                {(!existingGuesthouse.rooms || existingGuesthouse.rooms.length === 0) && (
                  <p className="mt-4 rounded-xl bg-white px-4 py-3 text-xs font-semibold text-slate-500">
                    {t('Add rooms before uploading room images.')}
                  </p>
                )}

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(existingGuesthouse.rooms || []).map((room) => {
                    const images = roomImageRecords.filter(
                      (image) => String(image.roomId) === String(room.id)
                    );

                    return (
                      <div key={room.id} className="rounded-xl border border-slate-200 bg-white p-4">
                        <h4 className="text-xs font-black text-[#063e60]">
                          {t('Room')} {room.roomNumber || room.id} · {images.length}/10
                        </h4>
                        {images.length > 0 ? (
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {images.map((image) => (
                              <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                                <img
                                  src={getImageUrl(image.url)}
                                  alt={`${t('Room')} ${room.roomNumber || room.id}`}
                                  loading="lazy"
                                  className="h-full w-full object-cover"
                                />
                                <button
                                  type="button"
                                  disabled={deletingRoomImageId === image.id}
                                  onClick={() => handleDeleteRoomImage(image)}
                                  className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow disabled:opacity-50"
                                  aria-label={t('Delete room image')}
                                >
                                  {deletingRoomImageId === image.id
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <X className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-[11px] text-slate-400">
                            {t('No images uploaded for this room yet.')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {(videoError || videoMessage) && (
                <p
                  role={videoError ? 'alert' : 'status'}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                    videoError
                      ? 'border border-red-200 bg-red-50 text-red-700'
                      : 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                  }`}
                >
                  {t(videoError || videoMessage)}
                </p>
              )}

              <div className="grid grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 sm:p-5">
                <div>
                  <h3 className="text-sm font-black text-[#063e60]">
                    {t('Guesthouse video')}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {t('One video per guesthouse · MP4 or WebM · Maximum 50MB')}
                  </p>
                  <label className="mt-4 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#063e60] px-4 text-xs font-black text-white transition hover:bg-[#052f4a]">
                    <Upload className="h-4 w-4" />
                    {existingGuesthouse.videoUrl ? t('Replace video') : t('Choose video')}
                    <input
                      type="file"
                      accept="video/mp4,video/webm,.mp4,.webm"
                      disabled={uploadingVideo}
                      onChange={handleVideoSelection}
                      className="hidden"
                    />
                  </label>
                  {videoFile && (
                    <p className="mt-3 truncate text-xs font-semibold text-slate-600">
                      {videoFile.name} · {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                  {uploadingVideo && (
                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <progress className="h-2 flex-1 accent-[#063e60]" max="100" value={videoProgress} />
                      {videoProgress}%
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={!videoFile || uploadingVideo}
                    onClick={handleUploadVideo}
                    className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#ffbd08] px-4 text-xs font-black text-[#063e60] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploadingVideo && <Loader2 className="h-4 w-4 animate-spin" />}
                    {uploadingVideo ? t('Uploading video...') : t('Upload video')}
                  </button>
                </div>
                <div className="flex min-h-40 items-center justify-center overflow-hidden rounded-xl bg-slate-900">
                  {(videoPreview || existingGuesthouse.videoUrl) ? (
                    <video
                      src={videoPreview || existingGuesthouse.videoUrl}
                      controls
                      preload="metadata"
                      className="max-h-72 w-full"
                    />
                  ) : (
                    <p className="px-4 text-center text-xs font-semibold text-white/60">
                      {t('No guesthouse video uploaded.')}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default GuesthouseManage;