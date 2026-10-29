import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ApiService } from "../../services/api.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  calculateCalendarNights,
} from "../../utils/date.utils.js";

import {
  MapPin,
  Star,
  Users,
  Bed,
  Building2,
  CheckCircle2,
  Phone,
  Mail,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Navigation,
} from "lucide-react";
import GuesthouseNearbyPanel from "../../components/guest/NearbyGuesthouses.jsx";
import GuesthouseLocationMap from "../../components/common/GuesthouseLocationMap.jsx";

export function GuesthouseDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [guesthouse, setGuesthouse] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [checkInDate, setCheckInDate] = useState(
    searchParams.get("checkIn") || ""
  );
  const [checkOutDate, setCheckOutDate] = useState(
    searchParams.get("checkOut") || ""
  );
  const [dateError, setDateError] = useState("");
  const datesRef = useRef(null);
  const loadRequestRef = useRef(0);

  const selectGuesthouse = () => {
    if (!guesthouse?.id) return;

    const currentUser = ApiService.getCurrentUser();
    const selectionKey = currentUser?.id
      ? `selectedGuesthouseId:${currentUser.id}`
      : 'selectedGuesthouseId';
    localStorage.setItem(selectionKey, String(guesthouse.id));
    navigate(`/guest/dashboard?guesthouseId=${guesthouse.id}`);
  };

  // ============================================================
  // IMAGE URL HELPER
  // ============================================================

  const getImageUrl = (image) => {
    if (!image) {
      return "";
    }

    if (typeof image !== "string") {
      return "";
    }

    const value = image.trim();

    if (!value) {
      return "";
    }

    // Already a complete URL
    if (
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("data:") ||
      value.startsWith("blob:")
    ) {
      return value;
    }

    const configuredUrl = import.meta.env.VITE_API_URL || "";

    const apiUrl = /^https?:\/\//.test(configuredUrl)
      ? configuredUrl
      : "http://localhost:5000/api";

    const cleanApiUrl = apiUrl.replace(/\/api\/?$/, "");

    // Backend absolute path such as:
    // /uploads/guesthouses/image.jpg
    if (value.startsWith("/")) {
      return `${cleanApiUrl}${value}`;
    }

    // Relative path such as:
    // uploads/guesthouses/image.jpg
    return `${cleanApiUrl}/${value}`;
  };

  const getCloudinaryImageUrl = (image, width) => {
    const imageUrl = getImageUrl(image);
    const uploadPath = "/upload/";
    const uploadIndex = imageUrl.indexOf(uploadPath);

    if (
      !/^https?:\/\/res\.cloudinary\.com\//i.test(imageUrl) ||
      uploadIndex === -1
    ) {
      return imageUrl;
    }

    const uploadPathEnd = uploadIndex + uploadPath.length;
    const transformation = typeof width === 'string' ? width : `w_${width}`;
    return `${imageUrl.slice(0, uploadPathEnd)}f_auto,q_auto,${transformation}/${imageUrl.slice(uploadPathEnd)}`;
  };

  const getCloudinaryVideoUrls = (videoPath) => {
    const videoUrl = getImageUrl(videoPath);
    const uploadPath = '/video/upload/';
    const uploadIndex = videoUrl.indexOf(uploadPath);

    if (
      !/^https?:\/\/res\.cloudinary\.com\//i.test(videoUrl) ||
      uploadIndex === -1
    ) {
      return { src: videoUrl, poster: undefined };
    }

    const uploadPathEnd = uploadIndex + uploadPath.length;
    const urlBeforeAsset = videoUrl.slice(0, uploadPathEnd);
    const assetPath = videoUrl.slice(uploadPathEnd).replace(/\.(mp4|webm|mov)(\?.*)?$/i, '');
    return {
      src: `${urlBeforeAsset}f_auto,q_auto/${videoUrl.slice(uploadPathEnd)}`,
      poster: `${urlBeforeAsset}so_0,f_jpg,w_1200/${assetPath}.jpg`,
    };
  };

  // ============================================================
  // LOAD GUESTHOUSE DATA
  // ============================================================

  useEffect(() => {
    let mounted = true;
    const requestId = ++loadRequestRef.current;
    const isCurrentRequest = () =>
      mounted && requestId === loadRequestRef.current;

    const loadGuesthouseData = async () => {
      const isInitialLoad = !guesthouse;

      try {
        if (isInitialLoad) {
          setLoading(true);
        }

        // --------------------------------------------------------
        // VALIDATE GUESTHOUSE ID
        // --------------------------------------------------------

        if (!id) {
          throw new Error("Guesthouse ID is missing.");
        }

        // Guesthouse IDs in the database are integers.
        const guesthouseId = Number(id);

        if (
          !Number.isInteger(guesthouseId) ||
          guesthouseId <= 0
        ) {
          throw new Error(
            `Invalid guesthouse ID: ${id}`
          );
        }

        console.log(
          "========================================"
        );
        console.log(
          "GUESTHOUSE DETAIL - LOADING"
        );
        console.log(
          "Guesthouse ID:",
          guesthouseId
        );
        console.log(
          "========================================"
        );

        // --------------------------------------------------------
        // LOAD GUESTHOUSE
        // --------------------------------------------------------

        const gh =
          await ApiService.getGuesthouseById(
            guesthouseId
          );

        console.log(
          "========================================"
        );
        console.log(
          "GUESTHOUSE DETAIL - API RESPONSE"
        );
        console.log(
          "Guesthouse ID:",
          guesthouseId
        );
        console.log(
          "Guesthouse:",
          gh
        );
        console.log(
          "========================================"
        );

        if (!gh || !gh.id) {
          throw new Error(
            "Guesthouse could not be found."
          );
        }

        // Only administrator-approved guesthouses
        // should be publicly visible.
        const guesthouseStatus = String(
          gh.status || ""
        )
          .trim()
          .toLowerCase();

        if (
          guesthouseStatus !== "approved"
        ) {
          throw new Error(
            "Guesthouse is not verified."
          );
        }

        if (!isCurrentRequest()) {
          return;
        }

        setGuesthouse(gh);

        // --------------------------------------------------------
        // LOAD ROOMS
        // --------------------------------------------------------

        let roomList = [];

        try {
          roomList =
            await ApiService.getRoomsForGuesthouse(
              gh.id,
              checkInDate,
              checkOutDate,
              true
            );

          if (!Array.isArray(roomList)) {
            roomList = [];
          }

          roomList = roomList.map((room) => {
            const guesthouseRoom = (gh.rooms || []).find(
              (item) => String(item.id) === String(room.id)
            );
            return {
              ...room,
              images: room.images?.length
                ? room.images
                : guesthouseRoom?.images || [],
            };
          });

          console.log(
            "Guesthouse rooms:",
            roomList
          );
        } catch (roomError) {
          console.warn(
            "Could not load rooms:",
            roomError
          );

          roomList = [];
        }

        // --------------------------------------------------------
        // LOAD REVIEWS
        // --------------------------------------------------------

        let reviewList = [];

        try {
          if (isCurrentRequest()) {
            setReviewsLoading(true);
          }

          reviewList =
            await ApiService.getGuesthouseReviews(
              gh.id
            );

          if (!Array.isArray(reviewList)) {
            reviewList = [];
          }

          console.log(
            "Guesthouse reviews:",
            reviewList
          );
        } catch (reviewError) {
          console.warn(
            "Could not load reviews:",
            reviewError
          );

          reviewList = [];
        } finally {
          if (isCurrentRequest()) {
            setReviewsLoading(false);
          }
        }

        if (!isCurrentRequest()) {
          return;
        }

        setRooms(roomList);
        setReviews(reviewList);
      } catch (error) {
        console.error(
          "Failed to load guesthouse:",
          error
        );

        if (isCurrentRequest() && isInitialLoad) {
          setGuesthouse(null);
          setRooms([]);
          setReviews([]);
        }
      } finally {
        if (isCurrentRequest() && isInitialLoad) {
          setLoading(false);
        }
      }
    };

    loadGuesthouseData();

    return () => {
      mounted = false;
    };
  }, [id, checkInDate, checkOutDate]);

  // ============================================================
  // RENDER STARS
  // ============================================================

  const renderStars = (
    rating,
    size = "w-4 h-4"
  ) => {
    const stars = [];

    const roundedRating = Math.max(
      0,
      Math.min(
        5,
        Math.round(Number(rating) || 0)
      )
    );

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`${size} ${
            i <= roundedRating
              ? "fill-amber-400 text-amber-400"
              : "text-stone-200"
          }`}
        />
      );
    }

    return stars;
  };

  // ============================================================
  // ROOM STATUS
  // ============================================================

  const getRoomStatus = (room) => {
    if (!room) {
      return "unavailable";
    }

    const availabilityStatus =
      String(
        room.availabilityStatus ||
          room.status ||
          ""
      )
        .trim()
        .toLowerCase();

    if (
      availabilityStatus ===
      "occupied"
    ) {
      return "occupied";
    }

    // Known unavailable states
    if (
      availabilityStatus ===
        "unavailable" ||
      availabilityStatus ===
        "reserved" ||
      availabilityStatus ===
        "booked" ||
      availabilityStatus ===
        "maintenance" ||
      room.available === false
    ) {
      return "unavailable";
    }

    if (
      availabilityStatus &&
      availabilityStatus !== "available"
    ) {
      return "unavailable";
    }

    return "available";
  };

  // ============================================================
  // BOOK ROOM - UPDATED
  // ============================================================

  const handleBookRoom = (room) => {
    if (!guesthouse || !room) {
      return;
    }

    const status = getRoomStatus(room);

    if (status !== "available") {
      return;
    }

    if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
      setDateError("Select a check-in and check-out date before choosing a room.");
      datesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setDateError("");

    const roomPrice = Number(
      room.pricePerNight ??
        room.price ??
        room.roomPrice ??
        room.price_per_night ??
        room.amount ??
        0
    );

    const nightsCount = calculateCalendarNights(
      checkInDate,
      checkOutDate
    );

    if (!roomPrice || roomPrice <= 0) {
      console.error(
        "Room price is missing or invalid:",
        room
      );

      alert(
        "The price for this room is not available."
      );

      return;
    }

    const bookingData = {
      guesthouseId: Number(guesthouse.id),
      roomId: Number(room.id),
      guesthouse,
      room,
      roomPrice,
      pricePerNight: roomPrice,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      checkInDate,
      checkOutDate,
      nights: nightsCount,
      nightsCount,
      amount: roomPrice * nightsCount,
      totalPrice: roomPrice * nightsCount,
      numberOfGuests: 1,
      paymentMethod: "CARD",
      telebirrPhone: "",
      selectedBank: "",
      accountNumber: "",
    };

    console.log("========================================");
    console.log("GUESTHOUSE DETAIL - SELECTED ROOM");
    console.log("guesthouseId:", bookingData.guesthouseId);
    console.log("roomId:", bookingData.roomId);
    console.log("roomPrice:", bookingData.roomPrice);
    console.log("bookingData:", bookingData);
    console.log("========================================");

    // ========================================================
    // ✅ CHECK IF USER IS LOGGED IN
    // ========================================================

    const token = localStorage.getItem("token");
    const currentUser = ApiService.getCurrentUser();

    if (!token || !currentUser) {
      // Save booking data to sessionStorage
      sessionStorage.setItem(
        "pendingReservation",
        JSON.stringify(bookingData)
      );

      // Redirect to login with booking data
      navigate("/login", {
        state: {
          from: `/guesthouse/${guesthouse.id}`,
          bookingData: bookingData,
          reservationData: bookingData,
          pendingReservation: true,
          returnTo: "payment",
          returnUrl: `/booking?guesthouseId=${guesthouse.id}&roomId=${room.id}`,
        },
      });

      return;
    }

    // ✅ USER LOGGED IN - OPEN PAYMENT IN THE GUEST DASHBOARD
    try {
      sessionStorage.setItem(
        "selectedBooking",
        JSON.stringify(bookingData)
      );
    } catch (storageError) {
      console.warn(
        "Could not save selected booking:",
        storageError
      );
    }

    localStorage.setItem(
      `selectedGuesthouseId:${currentUser.id}`,
      String(guesthouse.id)
    );

    navigate(`/guest/dashboard?guesthouseId=${guesthouse.id}`, {
      replace: true,
      state: {
        bookingData,
        showPayment: true,
      },
    });
  };

  // ============================================================
  // BUILD GUESTHOUSE IMAGES
  // ============================================================

  const images = useMemo(() => {
    if (!guesthouse) {
      return [];
    }

    const result = [];

    // Main image first
    if (
      typeof guesthouse.image ===
        "string" &&
      guesthouse.image.trim()
    ) {
      result.push(
        guesthouse.image.trim()
      );
    }

    // Additional images
    if (
      Array.isArray(
        guesthouse.images
      )
    ) {
      guesthouse.images.forEach(
        (image) => {
          if (
            typeof image ===
              "string" &&
            image.trim()
          ) {
            const cleanImage =
              image.trim();

            const exists =
              result.some(
                (existing) =>
                  existing ===
                  cleanImage
              );

            if (!exists) {
              result.push(
                cleanImage
              );
            }
          }
        }
      );
    }

    return result;
  }, [guesthouse]);

  // ============================================================
  // SAFE ACTIVE IMAGE
  // ============================================================

  const activeImage =
    images.length > 0
      ? getImageUrl(
          images[0]
        )
      : "";

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-96 bg-stone-200 animate-pulse rounded-3xl" />
      </div>
    );
  }

  // ============================================================
  // NOT FOUND
  // ============================================================

  if (!guesthouse) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-stone-200 rounded-3xl p-8">
          <Building2 className="w-12 h-12 text-stone-300 mx-auto" />

          <h2 className="mt-4 text-2xl font-bold">
            {t('Verified guesthouse not found')}
          </h2>

          <p className="mt-2 text-sm text-stone-500">
            {t('This guesthouse may not be approved or may no longer exist.')}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/search")
            }
            className="mt-6 px-6 py-3 bg-amber-500 rounded-xl text-sm font-bold"
          >
            {t('Back to Search')}
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // DISPLAY VALUES
  // ============================================================

  const guesthouseRating = Number(
    guesthouse.rating || 0
  );

  const guesthousePhone =
    guesthouse.phone ||
    guesthouse.phoneNumber ||
    "";

  const guesthouseEmail =
    guesthouse.email || "";

  const guesthouseAddress =
    guesthouse.address ||
    guesthouse.location ||
    "";

  const guesthouseCity =
    guesthouse.city || "";

  const guesthouseDescription =
    guesthouse.description || "";
  const hasGuesthouseCoordinates =
    guesthouse.latitude !== null &&
    guesthouse.latitude !== undefined &&
    guesthouse.latitude !== "" &&
    guesthouse.longitude !== null &&
    guesthouse.longitude !== undefined &&
    guesthouse.longitude !== "" &&
    Number.isFinite(Number(guesthouse.latitude)) &&
    Number.isFinite(Number(guesthouse.longitude)) &&
    Number(guesthouse.latitude) >= -90 &&
    Number(guesthouse.latitude) <= 90 &&
    Number(guesthouse.longitude) >= -180 &&
    Number(guesthouse.longitude) <= 180;
  const directionsDestination = hasGuesthouseCoordinates
    ? `${guesthouse.latitude},${guesthouse.longitude}`
    : [guesthouseAddress, guesthouseCity].filter(Boolean).join(", ");

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ======================================================
          BACK BUTTON
      ====================================================== */}

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-stone-900"
      >
        <ChevronLeft className="w-4 h-4" />
        {t('Back to listings')}
      </button>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="relative mx-auto w-full max-w-4xl text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">

          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            {t('Verified')}
          </span>

          <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />

            {guesthouseRating.toFixed(1)}
          </span>

          <span className="text-xs text-stone-400">
            ({reviews.length}{" "}
            {reviews.length === 1
              ? t("review")
              : t("reviews")})
          </span>

        </div>

        <h1 className="mt-2 text-center text-3xl font-black">
          {guesthouse.name ||
            t('Guesthouse')}
        </h1>

        {(guesthouseAddress ||
          guesthouseCity) && (
          <p className="mt-1 flex items-center justify-center gap-1 text-center text-xs text-stone-500">
            <MapPin className="w-3.5 h-3.5" />

            {[
              guesthouseCity,
              guesthouse.subCity,
              guesthouseAddress,
              guesthouse.woreda,
            ]
              .map((part) => String(part || '').trim())
              .filter(Boolean)
              .filter((part, index, parts) => parts.indexOf(part) === index)
              .join(", ")}
          </p>
        )}

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={selectGuesthouse}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 transition-colors hover:bg-amber-400"
          >
            <Building2 className="h-4 w-4" />
            {t('Use this guesthouse')}
          </button>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(directionsDestination)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-[#043658] px-4 py-2.5 text-xs font-bold text-[#043658] transition-colors hover:bg-slate-50"
          >
            <Navigation className="h-4 w-4" />
            {t('Get Directions')}
          </a>
        </div>
      </div>

      {hasGuesthouseCoordinates && (
        <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div>
            <h2 className="text-xl font-black text-[#043658]">
              {t('Guesthouse location')}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {Number(guesthouse.latitude).toFixed(6)},{" "}
              {Number(guesthouse.longitude).toFixed(6)}
            </p>
          </div>
          <GuesthouseLocationMap
            markers={[
              {
                id: guesthouse.id,
                name: guesthouse.name,
                latitude: guesthouse.latitude,
                longitude: guesthouse.longitude,
              },
            ]}
            height="min(55vh, 440px)"
            zoom={15}
          />
        </section>
      )}

      {/* ======================================================
          IMAGE GALLERY
      ====================================================== */}

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4">

        {/* MAIN IMAGE */}

        <div className="mx-auto w-full max-w-4xl space-y-3">
          <div className="mx-auto h-80 w-full overflow-hidden rounded-3xl bg-stone-100 sm:h-96">
            {activeImage ? (
              <img
                src={activeImage}
                alt={
                  guesthouse.name ||
                  "Guesthouse"
                }
                className="h-full w-full object-cover object-center"
                onError={(event) => {
                  console.error(
                    "Guesthouse image failed to load:",
                    event.currentTarget.src
                  );

                  event.currentTarget.style.display =
                    "none";
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Building2 className="h-16 w-16 text-stone-300 mx-auto" />

                  <p className="text-xs text-stone-400 mt-3">
                    {t('No guesthouse image available')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {guesthouse.videoUrl && (
            (() => {
              const video = getCloudinaryVideoUrls(guesthouse.videoUrl);
              return (
                <video
                  src={video.src}
                  poster={video.poster}
                  controls
                  preload="metadata"
                  playsInline
                  className="mx-auto block max-h-[28rem] w-full max-w-4xl rounded-3xl bg-black object-contain"
                />
              );
            })()
          )}
        </div>

      </div>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="space-y-8">

        <div className="space-y-6">

          {/* ==================================================
              ABOUT
          ================================================== */}

          <div className="mx-auto w-fit max-w-xl space-y-1.5 rounded-xl border bg-white px-5 py-3 text-center">

            <h3 className="text-base font-bold">
              {t('About this Guesthouse')}
            </h3>

            <p className="text-xs leading-relaxed text-stone-600 sm:text-sm">
              {guesthouseDescription ||
                t('No description is available for this guesthouse.')}
            </p>

          </div>

          {/* ==================================================
              ❌ AMENITIES & SERVICES - REMOVED
          ================================================== */}

          {/* ==================================================
              ❌ GUEST REVIEWS - REMOVED
          ================================================== */}

          {/* ==================================================
              ROOMS
          ================================================== */}

          <div className="space-y-4">

            <div
              ref={datesRef}
              className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 shadow-sm sm:grid-cols-2"
            >
              <label className="text-xs font-semibold text-stone-700">
                {t('Check-in date')}
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={checkInDate}
                  onChange={(event) => {
                    const nextCheckIn = event.target.value;
                    setCheckInDate(nextCheckIn);
                    if (checkOutDate && checkOutDate <= nextCheckIn) {
                      setCheckOutDate("");
                    }
                    setDateError("");
                  }}
                  className="mt-1.5 min-h-10 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </label>
              <label className="text-xs font-semibold text-stone-700">
                {t('Check-out date')}
                <input
                  type="date"
                  min={checkInDate
                    ? new Date(Date.parse(`${checkInDate}T00:00:00Z`) + 86400000)
                        .toISOString()
                        .slice(0, 10)
                    : new Date().toISOString().slice(0, 10)}
                  value={checkOutDate}
                  onChange={(event) => {
                    setCheckOutDate(event.target.value);
                    setDateError("");
                  }}
                  className="mt-1.5 min-h-10 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </label>
            </div>

            {dateError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {dateError}
              </p>
            )}

            {rooms.length === 0 ? (
              <p className="text-xs text-stone-500 bg-white p-6 rounded-2xl border">
                {t('No rooms have been registered for this guesthouse.')}
              </p>
            ) : (
              <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">

                {rooms.map((room) => {

                  const status =
                    getRoomStatus(room);

                  const isAvailable =
                    status === "available";

                  const isOccupied =
                    status === "occupied";

                  const isUnavailable =
                    status ===
                    "unavailable";

                  const isBookedForDates =
                    String(room.availabilityStatus || "").toLowerCase() ===
                    "reserved";

                  const roomPrice = Number(
                    room.pricePerNight ??
                      room.price ??
                      room.roomPrice ??
                      room.price_per_night ??
                      room.amount ??
                      0
                  );

                  const roomCapacity =
                    Number(
                      room.maxGuests ??
                        room.capacity ??
                        4
                    );

                  const roomType =
                    room.type ||
                    room.roomType ||
                            t('Room');
                  const roomImages = Array.isArray(room.images)
                    ? room.images
                        .map((image, sourceIndex) => ({
                          ...image,
                          sourceIndex,
                          url: getImageUrl(image.url),
                        }))
                        .filter((image) => image.url)
                        .sort((first, second) =>
                          Number(first.sortOrder ?? first.sourceIndex) -
                          Number(second.sortOrder ?? second.sourceIndex)
                        )
                    : [];
                  const roomNumber = room.roomNumber || room.number || room.id;
                  const roomDetailPath = `/guesthouses/${guesthouse.id}/rooms/${room.id}${
                    checkInDate && checkOutDate
                      ? `?checkIn=${encodeURIComponent(checkInDate)}&checkOut=${encodeURIComponent(checkOutDate)}`
                      : ''
                  }`;

                  return (
                    <div
                      key={room.id}
                      className={`flex h-full flex-col gap-2 rounded-2xl border bg-white p-3 transition duration-200 ease-out hover:-translate-y-1 hover:border-amber-400 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none ${
                        !isAvailable
                          ? "bg-stone-50"
                          : ""
                      }`}
                    >

                      {roomImages.length > 0 && (
                        <Link
                          to={roomDetailPath}
                          state={{ fromGuesthouse: true }}
                          className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-stone-100"
                          aria-label={`${t('View details')} for Room ${roomNumber}`}
                        >
                          <img
                            src={getCloudinaryImageUrl(roomImages[0].url, 'w_1000')}
                            alt={`${t('Room')} ${roomNumber} photo 1`}
                            loading="lazy"
                            className="h-full w-full object-cover object-center"
                          />
                          {roomImages.length > 1 && (
                            <span className="absolute bottom-3 left-3 rounded-lg bg-stone-950/80 px-2.5 py-1.5 text-xs font-bold text-white">
                              +{roomImages.length - 1} photos
                            </span>
                          )}
                        </Link>
                      )}

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <b>
                            Room{" "}
                            {room.roomNumber ||
                              room.number ||
                              room.id}{" "}
                            ({roomType})
                          </b>

                          {isAvailable && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                              {t('Available')}
                            </span>
                          )}

                          {isUnavailable && (
                            <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                              {t('Unavailable')}
                            </span>
                          )}

                          {isOccupied && (
                            <span className="px-2.5 py-1 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold">
                              {t('Occupied')}
                            </span>
                          )}

                        </div>

                        <div className="mt-1 flex items-center gap-4 text-xs text-stone-500">

                          <span>
                            <Users className="inline w-3.5 h-3.5" />

                            {" "}
                            {t('Max')}{" "}
                            {roomCapacity}
                          </span>

                          <span>
                            <Bed className="inline w-3.5 h-3.5" />

                            {" "}
                            {roomType}
                          </span>

                        </div>

                        {isUnavailable && isBookedForDates && (
                          <p className="text-[10px] text-red-600 mt-2 font-medium">
                            {t('This room has already been booked and cannot be selected.')}
                          </p>
                        )}

                        {isOccupied && (
                          <p className="text-[10px] text-stone-600 mt-2 font-medium">
                            {t('This room is currently occupied by a guest.')}
                          </p>
                        )}

                        <Link
                          to={roomDetailPath}
                          state={{ fromGuesthouse: true }}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#063e60] hover:text-amber-700"
                        >
                          {t('View details')}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>

                      </div>

                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-stone-100 pt-3">

                        <div className="shrink-0">

                          <b className="whitespace-nowrap text-base">
                            {roomPrice.toLocaleString()}{" "}
                            ETB
                          </b>

                          <div className="text-[10px] text-stone-400">
                            {t('per night')}
                          </div>

                        </div>

                        {isAvailable && (
                          <button
                            type="button"
                            onClick={() =>
                              handleBookRoom(
                                room
                              )
                            }
                            className="whitespace-nowrap rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 transition-colors hover:bg-amber-400"
                          >
                            {t('Select & Book')}
                          </button>
                        )}

                        {isUnavailable && (
                          <button
                            type="button"
                            disabled
                            className="w-full py-2 rounded-xl bg-stone-200 text-stone-500 font-bold text-xs cursor-not-allowed"
                          >
                            Unavailable
                          </button>
                        )}

                        {isOccupied && (
                          <button
                            type="button"
                            disabled
                            className="px-4 py-2.5 rounded-xl bg-stone-300 text-stone-600 font-bold text-xs cursor-not-allowed"
                          >
                            Occupied
                          </button>
                        )}

                      </div>

                    </div>
                  );
                })}

              </div>

            )}

          </div>

        </div>

      </div>

      <GuesthouseNearbyPanel
        onSelectGuesthouse={(nearbyGuesthouse) =>
          navigate(`/guesthouse/${nearbyGuesthouse.id}`)
        }
      />

      <section className="mx-auto mt-8 max-w-5xl rounded-2xl bg-stone-900 p-5 text-stone-100 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl space-y-2">
            <h3 className="flex items-center gap-2 font-bold">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
              {t('Verified Guarantee')}
            </h3>
            <p className="text-xs leading-relaxed text-stone-300">
              {t('Only administrator-approved properties appear in guest search. Room availability is checked before booking.')}
            </p>
          </div>

          <div className="grid shrink-0 grid-cols-1 gap-x-6 gap-y-2 border-t border-stone-700 pt-4 text-xs sm:grid-cols-3 md:border-l md:border-t-0 md:pl-5 md:pt-1">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="text-stone-300">{t('Available')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="text-stone-300">{t('Unavailable / Booked')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-stone-400" />
              <span className="text-stone-300">{t('Occupied')}</span>
            </div>
          </div>
        </div>

        {(guesthousePhone || guesthouseEmail) && (
          <div className="mt-4 flex flex-col gap-2 border-t border-stone-700 pt-4 text-xs text-stone-300 sm:flex-row sm:gap-6">
            {guesthousePhone && (
              <div>
                <Phone className="mr-2 inline h-4 w-4 text-amber-400" />
                {guesthousePhone}
              </div>
            )}
            {guesthouseEmail && (
              <div className="break-all">
                <Mail className="mr-2 inline h-4 w-4 text-amber-400" />
                {guesthouseEmail}
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  );
}

export default GuesthouseDetail;