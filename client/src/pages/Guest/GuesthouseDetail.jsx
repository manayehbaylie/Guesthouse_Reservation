import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ApiService } from "../../services/api.js";

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
} from "lucide-react";

export function GuesthouseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [guesthouse, setGuesthouse] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

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

  // ============================================================
  // LOAD GUESTHOUSE DATA
  // ============================================================

  useEffect(() => {
    let mounted = true;

    const loadGuesthouseData = async () => {
      try {
        setLoading(true);

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

        if (!mounted) {
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
              gh.id
            );

          if (!Array.isArray(roomList)) {
            roomList = [];
          }

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
        // LOAD RESERVATIONS
        // --------------------------------------------------------
        //
        // Reservations are protected in many systems.
        // Only request them when a token exists.
        //
        // If the request returns 401/403, the guesthouse
        // page continues working and room availability
        // falls back to the room's own availability data.
        // --------------------------------------------------------

        let reservationList = [];

        const token =
          localStorage.getItem("token");

        if (token) {
          try {
            reservationList =
              await ApiService.getReservations({
                guesthouseId: gh.id,
              });

            if (
              !Array.isArray(
                reservationList
              )
            ) {
              reservationList = [];
            }

            console.log(
              "Guesthouse reservations:",
              reservationList
            );
          } catch (reservationError) {
            console.warn(
              "Could not load reservations:",
              reservationError
            );

            reservationList = [];
          }
        }

        // --------------------------------------------------------
        // LOAD REVIEWS
        // --------------------------------------------------------

        let reviewList = [];

        try {
          if (mounted) {
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
          if (mounted) {
            setReviewsLoading(false);
          }
        }

        if (!mounted) {
          return;
        }

        setRooms(roomList);
        setReservations(reservationList);
        setReviews(reviewList);
        setActiveImageIndex(0);
      } catch (error) {
        console.error(
          "Failed to load guesthouse:",
          error
        );

        if (mounted) {
          setGuesthouse(null);
          setRooms([]);
          setReservations([]);
          setReviews([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadGuesthouseData();

    return () => {
      mounted = false;
    };
  }, [id]);

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

    const roomId = String(room.id);

    // ----------------------------------------------------------
    // Check active reservations when available
    // ----------------------------------------------------------

    const activeReservation =
      reservations.find((reservation) => {
        if (
          String(reservation.roomId) !==
          roomId
        ) {
          return false;
        }

        const status = String(
          reservation.status || ""
        )
          .trim()
          .toLowerCase();

        return [
          "pending",
          "confirmed",
          "checked_in",
        ].includes(status);
      });

    if (activeReservation) {
      const reservationStatus =
        String(
          activeReservation.status || ""
        )
          .trim()
          .toLowerCase();

      if (
        reservationStatus ===
        "checked_in"
      ) {
        return "occupied";
      }

      if (
        reservationStatus ===
          "confirmed" ||
        reservationStatus ===
          "pending"
      ) {
        return "unavailable";
      }
    }

    // ----------------------------------------------------------
    // Check room's own availability information
    // ----------------------------------------------------------

    const availabilityStatus =
      String(
        room.availabilityStatus ||
          room.status ||
          ""
      )
        .trim()
        .toLowerCase();

    // Explicit room availability flag
    if (room.available === false) {
      return "unavailable";
    }

    // Occupied takes priority over other unavailable states
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
        "booked" ||
      availabilityStatus ===
        "maintenance"
    ) {
      return "unavailable";
    }

    // If the backend explicitly provides a status
    // and it is not available, treat it as unavailable.
    if (
      availabilityStatus &&
      availabilityStatus !== "available"
    ) {
      return "unavailable";
    }

    return "available";
  };

  // ============================================================
  // BOOK ROOM
  // ============================================================

  const handleBookRoom = (room) => {
    if (!guesthouse || !room) {
      return;
    }

    const status = getRoomStatus(room);

    if (status !== "available") {
      return;
    }

    const roomPrice = Number(
      room.pricePerNight ??
        room.price ??
        room.roomPrice ??
        room.price_per_night ??
        room.amount ??
        0
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
      guesthouseId: Number(
        guesthouse.id
      ),

      roomId: Number(room.id),

      guesthouse,

      room,

      roomPrice,

      pricePerNight: roomPrice,

      checkIn: null,

      checkOut: null,

      checkInDate: "",

      checkOutDate: "",

      nights: 0,

      nightsCount: 0,

      amount: 0,

      totalPrice: 0,

      numberOfGuests: 1,

      paymentMethod: "TELEBIRR",

      telebirrPhone: "",

      selectedBank: "",

      accountNumber: "",
    };

    console.log(
      "========================================"
    );

    console.log(
      "GUESTHOUSE DETAIL - SELECTED ROOM"
    );

    console.log(
      "guesthouseId:",
      bookingData.guesthouseId
    );

    console.log(
      "roomId:",
      bookingData.roomId
    );

    console.log(
      "roomPrice:",
      bookingData.roomPrice
    );

    console.log(
      "bookingData:",
      bookingData
    );

    console.log(
      "========================================"
    );

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

    navigate(
      `/booking?guesthouseId=${guesthouse.id}&roomId=${room.id}`,
      {
        state: {
          bookingData,
        },
      }
    );
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

  const safeImageIndex =
    images.length > 0
      ? Math.min(
          Math.max(
            activeImageIndex,
            0
          ),
          images.length - 1
        )
      : 0;

  const activeImage =
    images.length > 0
      ? getImageUrl(
          images[safeImageIndex]
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
            Verified guesthouse not found
          </h2>

          <p className="mt-2 text-sm text-stone-500">
            This guesthouse may not be
            approved or may no longer
            exist.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/search")
            }
            className="mt-6 px-6 py-3 bg-amber-500 rounded-xl text-sm font-bold"
          >
            Back to Search
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
        Back to listings
      </button>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="relative">
        <div className="flex items-center gap-3 flex-wrap">

          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Verified
          </span>

          <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />

            {guesthouseRating.toFixed(1)}
          </span>

          <span className="text-xs text-stone-400">
            ({reviews.length}{" "}
            {reviews.length === 1
              ? "review"
              : "reviews"})
          </span>

        </div>

        <h1 className="text-3xl font-black mt-2">
          {guesthouse.name ||
            "Guesthouse"}
        </h1>

        {(guesthouseAddress ||
          guesthouseCity) && (
          <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5" />

            {guesthouseAddress}

            {guesthouseAddress &&
            guesthouseCity
              ? ", "
              : ""}

            {guesthouseCity}
          </p>
        )}
      </div>

      {/* ======================================================
          IMAGE GALLERY
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* MAIN IMAGE */}

        <div className="lg:col-span-2 h-80 sm:h-96 rounded-3xl overflow-hidden bg-stone-100">

          {activeImage ? (
            <img
              src={activeImage}
              alt={
                guesthouse.name ||
                "Guesthouse"
              }
              className="w-full h-full object-cover"
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
                  No guesthouse image available
                </p>
              </div>
            </div>
          )}

        </div>

        {/* THUMBNAILS */}

        <div className="grid grid-cols-2 gap-3 h-80 sm:h-96">

          {images
            .slice(0, 4)
            .map((image, index) => {
              const imageUrl =
                getImageUrl(image);

              if (!imageUrl) {
                return null;
              }

              return (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() =>
                    setActiveImageIndex(
                      index
                    )
                  }
                  className={`rounded-2xl overflow-hidden border-2 ${
                    safeImageIndex === index
                      ? "border-amber-500"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />
                </button>
              );
            })}

          {images.length === 0 && (
            <div className="col-span-2 rounded-2xl bg-stone-100 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-stone-300" />
            </div>
          )}

        </div>
      </div>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-6">

          {/* ==================================================
              ABOUT
          ================================================== */}

          <div className="bg-white p-6 rounded-3xl border space-y-3">

            <h3 className="text-lg font-bold">
              About this Guesthouse
            </h3>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {guesthouseDescription ||
                "No description is available for this guesthouse."}
            </p>

          </div>

          {/* ==================================================
              AMENITIES
          ================================================== */}

          <div className="bg-white p-6 rounded-3xl border space-y-3">

            <h3 className="text-lg font-bold">
              Amenities & Services
            </h3>

            {Array.isArray(
              guesthouse.amenities
            ) &&
            guesthouse.amenities.length >
              0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                {guesthouse.amenities.map(
                  (amenity, index) => (
                    <div
                      key={`${amenity}-${index}`}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 text-xs font-semibold"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />

                      {amenity}
                    </div>
                  )
                )}

              </div>
            ) : (
              <p className="text-xs text-stone-500">
                No amenities have been
                listed.
              </p>
            )}

          </div>

          {/* ==================================================
              REVIEWS
          ================================================== */}

          <div className="bg-white p-6 rounded-3xl border space-y-4">

            <div className="flex items-center justify-between gap-4">

              <div>
                <h3 className="text-lg font-bold">
                  Guest Reviews
                </h3>

                <p className="text-xs text-stone-500">
                  What guests are saying about
                  this guesthouse
                </p>
              </div>

              <div className="flex items-center gap-2">

                <div className="flex items-center gap-0.5">
                  {renderStars(
                    guesthouseRating,
                    "w-4 h-4"
                  )}
                </div>

                <span className="text-sm font-bold text-stone-900">
                  {guesthouseRating.toFixed(
                    1
                  )}
                </span>

              </div>

            </div>

            {reviewsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 border-t border-stone-100">

                <div className="flex justify-center mb-3">
                  <Star className="w-12 h-12 text-stone-200" />
                </div>

                <p className="text-sm font-medium text-stone-600">
                  No reviews yet
                </p>

                <p className="text-xs text-stone-400 mt-1">
                  Be the first to share your
                  experience at this
                  guesthouse!
                </p>

              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">

                {reviews.map((review) => (

                  <div
                    key={review.id}
                    className="border-t border-stone-100 pt-4 first:border-t-0 first:pt-0"
                  >

                    <div className="flex items-start justify-between">

                      <div className="flex-1">

                        <div className="flex items-center gap-2 flex-wrap">

                          <span className="font-bold text-sm text-stone-900">
                            {review.guest?.name ||
                              review.guest
                                ?.fullName ||
                              review.user?.name ||
                              review.user
                                ?.fullName ||
                              "Guest"}
                          </span>

                          <div className="flex items-center gap-0.5">
                            {renderStars(
                              review.rating ||
                                0,
                              "w-3.5 h-3.5"
                            )}
                          </div>

                          <span className="text-xs font-medium text-amber-600">
                            {Number(
                              review.rating ||
                                0
                            ).toFixed(1)}
                          </span>

                        </div>

                        <p className="text-xs text-stone-400 mt-0.5">
                          {review.createdAt
                            ? new Date(
                                review.createdAt
                              ).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "Recent stay"}
                        </p>

                      </div>

                    </div>

                    <p className="text-sm text-stone-700 mt-2 leading-relaxed">
                      {review.comment ||
                        "No comment provided."}
                    </p>

                    {review.ownerResponse && (
                      <div className="mt-3 bg-stone-50 p-3 rounded-xl border border-stone-100">

                        <div className="flex items-center gap-2 mb-1">

                          <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider">
                            Owner Response
                          </span>

                          <div className="flex-1 h-px bg-stone-200" />

                        </div>

                        <p className="text-sm text-stone-700">
                          {review.ownerResponse}
                        </p>

                      </div>
                    )}

                  </div>

                ))}

              </div>
            )}

            {reviews.length > 0 && (
              <div className="border-t border-stone-100 pt-4 mt-2">

                <div className="flex items-center justify-between text-xs text-stone-500">

                  <span>
                    Based on{" "}
                    <strong className="text-stone-700">
                      {reviews.length}
                    </strong>{" "}
                    {reviews.length === 1
                      ? "review"
                      : "reviews"}
                  </span>

                  <span className="flex items-center gap-1">

                    <span className="font-bold text-stone-700">
                      {guesthouseRating.toFixed(
                        1
                      )}
                    </span>

                    / 5.0

                  </span>

                </div>

              </div>
            )}

          </div>

          {/* ==================================================
              ROOMS
          ================================================== */}

          <div className="space-y-4">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold">
                  Rooms
                </h2>

                <p className="text-xs text-stone-500 mt-1">
                  Room availability is updated
                  from the reservation system.
                </p>

              </div>

            </div>

            {rooms.length === 0 ? (
              <p className="text-xs text-stone-500 bg-white p-6 rounded-2xl border">
                No rooms have been
                registered for this
                guesthouse.
              </p>
            ) : (
              <div className="space-y-4">

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
                    "Room";

                  return (
                    <div
                      key={room.id}
                      className={`bg-white p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        !isAvailable
                          ? "bg-stone-50"
                          : ""
                      }`}
                    >

                      <div>

                        <div className="flex items-center gap-3 flex-wrap">

                          <b>
                            Room{" "}
                            {room.roomNumber ||
                              room.number ||
                              room.id}{" "}
                            ({roomType})
                          </b>

                          {isAvailable && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                              Available
                            </span>
                          )}

                          {isUnavailable && (
                            <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                              Unavailable
                            </span>
                          )}

                          {isOccupied && (
                            <span className="px-2.5 py-1 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold">
                              Occupied
                            </span>
                          )}

                        </div>

                        <div className="flex items-center gap-4 text-xs text-stone-500 mt-2">

                          <span>
                            <Users className="inline w-3.5 h-3.5" />

                            {" "}
                            Max{" "}
                            {roomCapacity}
                          </span>

                          <span>
                            <Bed className="inline w-3.5 h-3.5" />

                            {" "}
                            {roomType}
                          </span>

                        </div>

                        {isUnavailable && (
                          <p className="text-[10px] text-red-600 mt-2 font-medium">
                            This room has
                            already been
                            booked and
                            cannot be
                            selected.
                          </p>
                        )}

                        {isOccupied && (
                          <p className="text-[10px] text-stone-600 mt-2 font-medium">
                            This room is
                            currently
                            occupied by a
                            guest.
                          </p>
                        )}

                      </div>

                      <div className="flex items-center justify-between gap-4">

                        <div>

                          <b className="text-base">
                            {roomPrice.toLocaleString()}{" "}
                            ETB
                          </b>

                          <div className="text-[10px] text-stone-400">
                            per night
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
                            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors"
                          >
                            Select & Book
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

        {/* ====================================================
            SIDEBAR
        ==================================================== */}

        <aside>

          <div className="bg-stone-900 text-stone-100 p-6 rounded-3xl space-y-4">

            <h3 className="font-bold flex gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              Verified Guarantee
            </h3>

            <p className="text-xs text-stone-300">
              Only administrator-approved
              properties appear in guest
              search. Room availability is
              checked before booking.
            </p>

            <div className="pt-3 border-t border-stone-800 space-y-2">

              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />

                <span className="text-stone-300">
                  Available
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />

                <span className="text-stone-300">
                  Unavailable / Booked
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-400" />

                <span className="text-stone-300">
                  Occupied
                </span>
              </div>

            </div>

            {/* ==================================================
                CONTACT INFORMATION
                Do NOT use fake/default contact information.
            ================================================== */}

            {(guesthousePhone ||
              guesthouseEmail) && (
              <div className="pt-3 border-t border-stone-800 space-y-2 text-xs text-stone-400">

                {guesthousePhone && (
                  <div>
                    <Phone className="inline w-4 h-4 text-amber-400 mr-2" />

                    {guesthousePhone}
                  </div>
                )}

                {guesthouseEmail && (
                  <div className="break-all">
                    <Mail className="inline w-4 h-4 text-amber-400 mr-2" />

                    {guesthouseEmail}
                  </div>
                )}

              </div>
            )}

          </div>

        </aside>

      </div>

    </div>
  );
}

export default GuesthouseDetail;