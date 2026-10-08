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

const MAX_VIDEO_MB = 100;

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
  const [roomUploadProgress, setRoomUploadProgress] = useState(0);
  const [uploadingRoomImages, setUploadingRoomImages] = useState(false);
  const [roomUploadStatuses, setRoomUploadStatuses] = useState({});
  const [deletingRoomImageId, setDeletingRoomImageId] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoError, setVideoError] = useState('');
  const [videoMessage, setVideoMessage] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const videoUploadController = useRef(null);
  const previewUrls = useRef(new Set());

  /*
   * ---------------------------------------------------------
   * IMAGE PREVIEW
   * ---------------------------------------------------------
   */
  const [mainImagePreview, setMainImagePreview] = useState('');

  useEffect(() => () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.current.clear();
  }, []);

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

  const rooms = existingGuesthouse?.rooms || [];

  const getSortedRoomImages = (roomId) =>
    roomImageRecords
      .filter((image) => String(image.roomId) === String(roomId))
      .sort((first, second) => Number(first.sortOrder || 0) - Number(second.sortOrder || 0));

  const handleRoomImageSelection = (room, kind, event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    setRoomMediaError('');
    setRoomMediaMessage('');

    if (!files.length) return;

    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const savedImages = getSortedRoomImages(room.id);
    const queuedForRoom = pendingRoomImages.filter(
      (image) => String(image.roomId) === String(room.id)
    );
    const replacement = kind === 'main'
      ? queuedForRoom.find((image) => image.kind === 'main')
      : null;
    const existingCount = savedImages.length + queuedForRoom.length - (replacement ? 1 : 0);
    const availableSlots = Math.max(0, 10 - existingCount);
    const acceptedFiles = [];

    for (const file of files) {
      if (!acceptedTypes.includes(file.type)) {
        setRoomMediaError(`${file.name} must be a JPEG, PNG, or WEBP image.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setRoomMediaError(`${file.name} exceeds the 5MB image limit.`);
        continue;
      }

      const isDuplicateSaved = savedImages.some((image) => {
        const savedName = image.fileName || image.originalName || image.name;
        const savedSize = Number(image.fileSize ?? image.size);
        return savedName === file.name && savedSize === file.size;
      });
      const isDuplicate = isDuplicateSaved || [...queuedForRoom, ...acceptedFiles].some(
        (image) => image.file.name === file.name && image.file.size === file.size
      );
      if (isDuplicate && !(replacement && replacement.file.name === file.name && replacement.file.size === file.size)) {
        setRoomMediaError(`${file.name} is already selected for Room ${room.roomNumber}.`);
        continue;
      }
      if (acceptedFiles.length >= availableSlots) {
        setRoomMediaError(`Room ${room.roomNumber} can have up to 10 photos. Delete a saved photo before adding more.`);
        break;
      }
      acceptedFiles.push(file);
      if (kind === 'main') break;
    }

    const newImages = acceptedFiles.map((file) => {
      const preview = URL.createObjectURL(file);
      previewUrls.current.add(preview);
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview,
        roomId: String(room.id),
        kind,
        status: 'pending',
      };
    });

    if (kind === 'main' && replacement) {
      URL.revokeObjectURL(replacement.preview);
      previewUrls.current.delete(replacement.preview);
      setPendingRoomImages((current) => [
        ...current.filter((image) => image.id !== replacement.id),
        ...newImages,
      ]);
    } else if (newImages.length) {
      setPendingRoomImages((current) => [...current, ...newImages]);
    }

    if (newImages.length) {
      setRoomUploadStatuses((current) => ({ ...current, [room.id]: 'pending' }));
    }
  };

  const handleRemovePendingRoomImage = (imageId) => {
    const image = pendingRoomImages.find((item) => item.id === imageId);
    if (!image) return;
    URL.revokeObjectURL(image.preview);
    previewUrls.current.delete(image.preview);
    setPendingRoomImages((current) => current.filter((item) => item.id !== imageId));
    setRoomUploadStatuses((current) => {
      const hasRoomItems = pendingRoomImages.some(
        (item) => item.id !== imageId && String(item.roomId) === String(image.roomId)
      );
      if (hasRoomItems) return current;
      const next = { ...current };
      delete next[image.roomId];
      return next;
    });
  };

  const handleUploadRoomImages = async (onlyRoomId) => {
    const candidates = pendingRoomImages.filter((image) =>
      image.status !== 'uploading' &&
      (onlyRoomId === undefined || String(image.roomId) === String(onlyRoomId))
    );
    if (!candidates.length) return;

    setUploadingRoomImages(true);
    setRoomUploadProgress(0);
    setRoomMediaError('');
    setRoomMediaMessage('');
    const totalBytes = candidates.reduce((total, image) => total + image.file.size, 0);
    let completedBytes = 0;
    let failedCount = 0;
    const failedRoomIds = new Set();
    const readyToSave = [];

    try {
      for (const pendingImage of candidates) {
        setRoomUploadStatuses((current) => ({
          ...current,
          [pendingImage.roomId]: 'uploading',
        }));
        setPendingRoomImages((current) => current.map((image) =>
          image.id === pendingImage.id ? { ...image, status: 'uploading' } : image
        ));

        try {
          let asset = pendingImage.asset;
          if (!asset) {
            asset = await ApiService.uploadMediaToCloudinary(
              pendingImage.file,
              'image',
              (fileProgress) => {
                setRoomUploadProgress(Math.round(
                  ((completedBytes + (pendingImage.file.size * fileProgress) / 100) / totalBytes) * 100
                ));
              }
            );
          }
          completedBytes += pendingImage.file.size;
          setRoomUploadProgress(Math.round((completedBytes / totalBytes) * 100));
          readyToSave.push({ pendingImage, asset });
          setPendingRoomImages((current) => current.map((image) =>
            image.id === pendingImage.id ? { ...image, asset, status: 'pending' } : image
          ));
        } catch (uploadError) {
          failedCount += 1;
          failedRoomIds.add(String(pendingImage.roomId));
          setPendingRoomImages((current) => current.map((image) =>
            image.id === pendingImage.id ? { ...image, status: 'failed' } : image
          ));
          setRoomUploadStatuses((current) => ({
            ...current,
            [pendingImage.roomId]: 'failed',
          }));
          console.error(`Room ${pendingImage.roomId} photo upload failed:`, uploadError);
        }
      }

      if (readyToSave.length) {
        const items = readyToSave.map(({ pendingImage, asset }) => ({
          roomId: Number(pendingImage.roomId),
          url: asset.secure_url,
          publicId: asset.public_id,
        }));
        try {
          await ApiService.createRoomImages(items);
          const savedIds = new Set(readyToSave.map(({ pendingImage }) => pendingImage.id));
          readyToSave.forEach(({ pendingImage }) => {
            URL.revokeObjectURL(pendingImage.preview);
            previewUrls.current.delete(pendingImage.preview);
          });
          setPendingRoomImages((current) => current.filter((image) => !savedIds.has(image.id)));

          const savedRoomIds = [...new Set(readyToSave.map(({ pendingImage }) => pendingImage.roomId))];
          savedRoomIds.forEach((roomId) => {
            setRoomUploadStatuses((current) => ({
              ...current,
              [roomId]: failedRoomIds.has(String(roomId)) ? 'failed' : 'done',
            }));
          });

          try {
            const updatedGuesthouse = await ApiService.getMyGuesthouse();
            if (updatedGuesthouse) {
              setExistingGuesthouse(updatedGuesthouse);
              setRoomImageRecords(
                (updatedGuesthouse.rooms || []).flatMap((room) =>
                  (room.images || []).map((image) => ({
                    ...image,
                    roomId: room.id,
                    roomNumber: room.roomNumber,
                  }))
                )
              );
            }
          } catch (refreshError) {
            console.warn('Room photos saved, but owner data could not be refreshed:', refreshError);
          }
        } catch (saveError) {
          failedCount += readyToSave.length;
          setPendingRoomImages((current) => current.map((image) =>
            readyToSave.some(({ pendingImage }) => pendingImage.id === image.id)
              ? { ...image, asset: readyToSave.find(({ pendingImage }) => pendingImage.id === image.id).asset, status: 'failed' }
              : image
          ));
          readyToSave.forEach(({ pendingImage }) => {
            failedRoomIds.add(String(pendingImage.roomId));
            setRoomUploadStatuses((current) => ({
              ...current,
              [pendingImage.roomId]: 'failed',
            }));
          });
          throw saveError;
        }
      }

      setRoomUploadProgress(100);
      if (failedCount) {
        setRoomMediaError('Some room photos failed. Retry failed rooms.');
      } else {
        setRoomMediaMessage('Room photos uploaded successfully.');
      }
    } catch (uploadError) {
      console.error('Room photo batch could not be saved:', uploadError);
      setRoomMediaError(
        uploadError?.response?.data?.message ||
          uploadError?.message ||
          'Room photos could not be uploaded.'
      );
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
        current.filter((record) => record.id !== image.id)
      );
      setExistingGuesthouse((current) => current ? ({
        ...current,
        rooms: (current.rooms || []).map((room) => ({
          ...room,
          images: (room.images || []).filter(
            (record) => record.id !== image.id
          ),
        })),
      }) : current);
      setRoomMediaMessage('Room photo deleted successfully.');
    } catch (deleteError) {
      console.error('Room photo deletion failed:', deleteError);
      setRoomMediaError(
        deleteError?.response?.data?.message ||
          deleteError?.message ||
          'Room photo could not be deleted.'
      );
    } finally {
      setDeletingRoomImageId(null);
    }
  };

  const handleVideoSelection = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setVideoError('');
    setVideoMessage('');

    if (!file) {
      return;
    }

    setVideoFile(null);

    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) {
      setVideoError('Select an MP4, WEBM, or MOV video.');
      return;
    }

    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      setVideoError(`Guesthouse video must be ${MAX_VIDEO_MB}MB or smaller.`);
      return;
    }

    setVideoFile(file);
    setVideoProgress(0);
  };

  const handleUploadVideo = async () => {
    if (!videoFile) {
      setVideoError('Select a video file to upload.');
      return;
    }

    setUploadingVideo(true);
    setVideoError('');
    setVideoMessage('');
    setVideoProgress(0);
    const controller = new AbortController();
    videoUploadController.current = controller;
    try {
      const uploaded = await ApiService.uploadVideoToCloudinaryInChunks(
        videoFile,
        setVideoProgress,
        controller.signal
      );
      const savedVideo = await ApiService.updateGuesthouseVideo({
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
      });
      setExistingGuesthouse((current) => ({
        ...current,
        videoUrl: savedVideo?.videoUrl || uploaded.secure_url,
        videoPublicId: savedVideo?.videoPublicId || uploaded.public_id,
      }));
      setVideoFile(null);
      setVideoProgress(100);
      setVideoMessage('Guesthouse video uploaded successfully.');
    } catch (uploadError) {
      if (controller.signal.aborted || uploadError?.code === 'ERR_CANCELED') {
        setVideoError('Video upload cancelled.');
        return;
      }
      console.error('Guesthouse video upload failed:', uploadError);
      setVideoError(
        uploadError?.response?.data?.message ||
          uploadError?.message ||
          'Guesthouse video could not be uploaded.'
      );
    } finally {
      videoUploadController.current = null;
      setUploadingVideo(false);
    }
  };

  const handleCancelVideoUpload = () => {
    videoUploadController.current?.abort();
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
                ROOM PHOTOS
            ================================================== */}
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#063e60] text-[#ffbd08]">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#063e60]">
                    {t('Room Photos')}
                  </h2>
                  <p className="text-xs font-medium text-slate-500">
                    {t('Add up to 10 photos for each room.')}
                  </p>
                </div>
              </div>

              {!rooms.length ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                  {t('Add rooms to your guesthouse before uploading room photos.')}
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[10px] font-semibold text-slate-400">
                      {t('JPEG, PNG or WEBP • Maximum 5MB per image • 10 photos per room')}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleUploadRoomImages()}
                      disabled={uploadingRoomImages || pendingRoomImages.length === 0}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ffbd08] px-4 text-xs font-black text-[#063e60] transition hover:bg-[#f7b500] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {uploadingRoomImages ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {t('Upload all rooms')}
                    </button>
                  </div>

                  {pendingRoomImages.length > 0 && (
                    <div
                      className="h-2 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={roomUploadProgress}
                    >
                      <div
                        className="h-full rounded-full bg-[#ffbd08] transition-all"
                        style={{ width: `${roomUploadProgress}%` }}
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    {rooms.map((room) => {
                      const savedImages = getSortedRoomImages(room.id);
                      const mainImage = savedImages[0];
                      const roomPending = pendingRoomImages.filter(
                        (image) => String(image.roomId) === String(room.id)
                      );
                      const pendingMain = roomPending.find((image) => image.kind === 'main');
                      const pendingExtras = roomPending.filter((image) => image.kind === 'extra');
                      const status = roomUploadStatuses[room.id];
                      const roomType = room.type || room.roomType || 'ROOM';
                      const statusStyle = {
                        pending: 'bg-amber-100 text-amber-800',
                        uploading: 'bg-sky-100 text-sky-800',
                        done: 'bg-emerald-100 text-emerald-800',
                        failed: 'bg-red-100 text-red-800',
                      }[status];

                      return (
                        <article key={room.id} className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-24 sm:w-36">
                              {pendingMain ? (
                                <img src={pendingMain.preview} alt={pendingMain.file.name} className="h-full w-full object-cover" />
                              ) : mainImage ? (
                                <img src={getImageUrl(mainImage.url)} alt={`Room ${room.roomNumber} main photo`} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
                                  {t('No room photo')}
                                </div>
                              )}
                              {pendingMain && (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePendingRoomImage(pendingMain.id)}
                                  disabled={uploadingRoomImages}
                                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow disabled:opacity-50"
                                  aria-label={t('Remove pending room photo')}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-black text-[#063e60]">
                                  {`Room ${room.roomNumber} (${roomType})`}
                                </h3>
                                {status && (
                                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyle}`}>
                                    {t(status)}
                                  </span>
                                )}
                              </div>
                              {pendingMain && (
                                <p className="mt-1 truncate text-[10px] font-semibold text-slate-500">
                                  {pendingMain.file.name} ({pendingMain.status})
                                </p>
                              )}
                              <label className="mt-3 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#063e60] px-3 text-xs font-bold text-[#063e60] transition hover:bg-slate-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
                                <Upload className="h-3.5 w-3.5" />
                                {mainImage ? t('Replace photo') : t('Choose photo')}
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  onChange={(event) => handleRoomImageSelection(room, 'main', event)}
                                  disabled={uploadingRoomImages}
                                  className="hidden"
                                />
                              </label>

                              <details className="mt-4 border-t border-slate-100 pt-3">
                                <summary className="cursor-pointer text-xs font-bold text-[#063e60]">
                                  {t('More photos')} ({Math.max(0, savedImages.length - 1) + pendingExtras.length})
                                </summary>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {savedImages.map((image, index) => (
                                    <div key={image.id} className="group relative h-16 w-20 overflow-hidden rounded-lg bg-slate-100">
                                      <img
                                        src={getImageUrl(image.url)}
                                        alt={`Room ${room.roomNumber} photo ${index + 1}`}
                                        className="h-full w-full object-cover"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteRoomImage(image)}
                                        disabled={deletingRoomImageId === image.id || uploadingRoomImages}
                                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow disabled:opacity-50"
                                        aria-label={t('Delete room photo')}
                                      >
                                        {deletingRoomImageId === image.id ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <X className="h-3.5 w-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  ))}
                                  {pendingExtras.map((image) => (
                                    <div key={image.id} className="relative h-16 w-20 overflow-hidden rounded-lg bg-slate-100">
                                      <img src={image.preview} alt={image.file.name} className="h-full w-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => handleRemovePendingRoomImage(image.id)}
                                        disabled={uploadingRoomImages}
                                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow disabled:opacity-50"
                                        aria-label={t('Remove pending room photo')}
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <label className="mt-3 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#063e60] px-3 text-xs font-bold text-white transition hover:bg-[#052f4a] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
                                  <Upload className="h-3.5 w-3.5" />
                                  {t('Add extra photos')}
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    multiple
                                    onChange={(event) => handleRoomImageSelection(room, 'extra', event)}
                                    disabled={uploadingRoomImages || savedImages.length + roomPending.length >= 10}
                                    className="hidden"
                                  />
                                </label>
                              </details>
                            </div>
                          </div>
                          {status === 'failed' && (
                            <button
                              type="button"
                              onClick={() => handleUploadRoomImages(room.id)}
                              disabled={uploadingRoomImages}
                              className="mt-3 h-9 rounded-lg border border-red-200 px-3 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              {t('Retry failed room')}
                            </button>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}

              {roomMediaError && (
                <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">
                  {t(roomMediaError)}
                </p>
              )}
              {roomMediaMessage && (
                <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
                  {t(roomMediaMessage)}
                </p>
              )}

              <div className="mt-6 space-y-5">
                {rooms.map((room) => {
                  const images = roomImageRecords.filter(
                    (image) => String(image.roomId) === String(room.id)
                  );
                  return (
                    <div key={room.id}>
                      <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-[#063e60]">
                        {`Room ${room.roomNumber}`}
                      </h3>
                      {images.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                          {images.map((image) => (
                            <div
                              key={image.id}
                              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                            >
                              <img
                                src={getImageUrl(image.url)}
                                alt={`Room ${room.roomNumber}`}
                                className="h-32 w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteRoomImage(image)}
                                disabled={deletingRoomImageId === image.id}
                                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow transition hover:bg-red-700 disabled:opacity-60"
                                aria-label={t('Delete room photo')}
                                title={t('Delete room photo')}
                              >
                                {deletingRoomImageId === image.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs font-medium text-slate-400">
                          {t('No photos saved for this room yet.')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ==================================================
                GUESTHOUSE VIDEO
            ================================================== */}
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#063e60] text-[#ffbd08]">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#063e60]">
                    {t('Guesthouse Video')}
                  </h2>
                  <p className="text-xs font-medium text-slate-500">
                    {t('Upload a short video of your guesthouse.')}
                  </p>
                </div>
              </div>

              {existingGuesthouse?.videoUrl && (
                <video
                  src={getImageUrl(existingGuesthouse.videoUrl)}
                  controls
                  preload="metadata"
                  className="mb-4 max-h-80 w-full rounded-xl bg-slate-950"
                />
              )}

              {videoFile && (
                <p className="mb-3 truncate rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-700">
                  {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-[#063e60] bg-white px-4 text-xs font-black text-[#063e60] transition hover:bg-[#063e60] hover:text-white">
                  <Upload className="h-4 w-4" />
                  {existingGuesthouse?.videoUrl
                    ? t('Replace video')
                    : t('Choose video')}
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,.mov"
                    onChange={handleVideoSelection}
                    disabled={uploadingVideo}
                    className="hidden"
                  />
                </label>
                {videoFile && (
                  <button
                    type="button"
                    onClick={handleUploadVideo}
                    disabled={uploadingVideo}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ffbd08] px-4 text-xs font-black text-[#063e60] transition hover:bg-[#f7b500] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploadingVideo && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {uploadingVideo
                      ? `${t('Uploading')} ${videoProgress}%`
                      : t('Upload video')}
                  </button>
                )}
                {uploadingVideo && (
                  <button
                    type="button"
                    onClick={handleCancelVideoUpload}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 text-xs font-black text-red-700 transition hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                    {t('Cancel')}
                  </button>
                )}
              </div>
              <p className="mt-2 text-[10px] font-semibold text-slate-400">
                {t(`MP4, WEBM or MOV • Maximum ${MAX_VIDEO_MB}MB`)}
              </p>

              {uploadingVideo && (
                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={videoProgress}
                >
                  <div
                    className="h-full rounded-full bg-[#ffbd08] transition-all"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>
              )}
              {videoError && (
                <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">
                  {t(videoError)}
                </p>
              )}
              {videoMessage && (
                <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
                  {t(videoMessage)}
                </p>
              )}
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

        </div>
      </div>
    </div>
  );
}

export default GuesthouseManage;