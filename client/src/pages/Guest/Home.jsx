import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiService } from "../../services/api.js";
import {
  MapPin,
  ShieldCheck,
  Star,
  Building2,
  ArrowRight,
  Mail,
  Phone,
  Send,
  Users,
  CalendarCheck,
  Receipt,
  ChevronDown,
} from "lucide-react";

const MAX_GUESTHOUSES = 20;

/*
 * ============================================================
 * HERO IMAGES
 * ============================================================
 *
 * These images are only used as static visual references for
 * the Home page hero section.
 *
 * IMPORTANT:
 * Guesthouse cards are NOT created from these images.
 * Real guesthouses must always come from the database/API.
 */
const HERO_IMAGES = [
  {
    image:
      "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=2000&q=85",
    title: "Discover Ethiopia",
  },
  {
    image:
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=2000&q=85",
    title: "Explore Ethiopia's Heritage",
  },
  {
    image:
      "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=2000&q=85",
    title: "Experience Nature",
  },
  {
    image:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2000&q=85",
    title: "Travel Across Ethiopia",
  },
  {
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2000&q=85",
    title: "Find Your Perfect Stay",
  },
];

/*
 * IMPORTANT:
 * Do not put fake guesthouse IDs such as:
 *
 * "demo-lalibela-1"
 *
 * Guesthouses must come from the database through the API.
 *
 * Lalibela Heritage Guesthouse should therefore use its
 * real database ID, which is expected to be 14.
 */

/*
 * ============================================================
 * BACKEND URL
 * ============================================================
 */
const getBackendBaseUrl = () => {
  const configuredUrl =
    import.meta.env.VITE_API_BASE_URL || "";

  const apiUrl = /^https?:\/\//.test(configuredUrl)
    ? configuredUrl
    : "http://localhost:5000/api";

  return apiUrl
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");
};

/*
 * ============================================================
 * IMAGE URL RESOLVER
 * ============================================================
 */
const resolveImageUrl = (image) => {
  if (!image || typeof image !== "string") {
    return "";
  }

  const trimmed = image.trim();

  if (!trimmed) {
    return "";
  }

  /*
   * Already complete URLs.
   */
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/")
  ) {
    return trimmed;
  }

  /*
   * Protocol-relative URL.
   */
  if (trimmed.startsWith("//")) {
    return `${window.location.protocol}${trimmed}`;
  }

  const baseUrl = getBackendBaseUrl();

  /*
   * Absolute backend path.
   *
   * Example:
   * /uploads/guesthouses/image.jpg
   *
   * becomes:
   * http://localhost:5000/uploads/guesthouses/image.jpg
   */
  if (trimmed.startsWith("/")) {
    return baseUrl
      ? `${baseUrl}${trimmed}`
      : trimmed;
  }

  /*
   * Relative backend path.
   */
  return baseUrl
    ? `${baseUrl}/${trimmed}`
    : `/${trimmed}`;
};

/*
 * ============================================================
 * GET GUESTHOUSE IMAGE
 * ============================================================
 */
const getGuesthouseImage = (guesthouse) => {
  if (!guesthouse) {
    return "";
  }

  const possibleImages = [
    guesthouse.image,
    guesthouse.imageUrl,
    guesthouse.photo,
    guesthouse.photoUrl,
    guesthouse.coverImage,
    guesthouse.thumbnail,
  ];

  if (Array.isArray(guesthouse.images)) {
    possibleImages.push(...guesthouse.images);
  }

  if (Array.isArray(guesthouse.photos)) {
    possibleImages.push(...guesthouse.photos);
  }

  const image = possibleImages.find(
    (item) =>
      typeof item === "string" &&
      item.trim() !== ""
  );

  return resolveImageUrl(image);
};

/*
 * ============================================================
 * VERIFIED GUESTHOUSE CHECK
 * ============================================================
 */
const isVerifiedGuesthouse = (guesthouse) => {
  if (!guesthouse) {
    return false;
  }

  const status = String(
    guesthouse?.status || ""
  )
    .trim()
    .toUpperCase();

  return (
    status === "APPROVED" ||
    status === "VERIFIED" ||
    guesthouse?.approved === true ||
    guesthouse?.verified === true
  );
};

/*
 * ============================================================
 * NORMALIZE GUESTHOUSE
 * ============================================================
 */
const normalizeGuesthouse = (guesthouse) => {
  if (!guesthouse) {
    return null;
  }

  const image = getGuesthouseImage(
    guesthouse
  );

  const allImages = [
    ...(Array.isArray(guesthouse.images)
      ? guesthouse.images
      : []),

    ...(Array.isArray(guesthouse.photos)
      ? guesthouse.photos
      : []),

    image,
  ]
    .map(resolveImageUrl)
    .filter(Boolean);

  const numericRating = Number(
    guesthouse.rating ??
      guesthouse.averageRating ??
      4.5
  );

  const numericPrice = Number(
    guesthouse.price ??
      guesthouse.minPrice ??
      guesthouse.priceRange?.min ??
      guesthouse.rooms?.[0]?.price ??
      guesthouse.rooms?.[0]?.pricePerNight ??
      0
  );

  return {
    ...guesthouse,

    city:
      guesthouse.city ||
      guesthouse.location ||
      "",

    address:
      guesthouse.address ||
      guesthouse.location ||
      guesthouse.city ||
      "Ethiopia",

    description:
      guesthouse.description ||
      "A comfortable guesthouse offering quality accommodation.",

    rating: Number.isFinite(numericRating)
      ? numericRating
      : 0,

    price: Number.isFinite(numericPrice)
      ? numericPrice
      : 0,

    image,

    images: Array.from(
      new Set(allImages)
    ),
  };
};

/*
 * ============================================================
 * REMOVE DUPLICATES
 * ============================================================
 */
const removeDuplicates = (guesthouses) => {
  const seen = new Set();

  return guesthouses.filter((guesthouse) => {
    if (!guesthouse) {
      return false;
    }

    const name = String(
      guesthouse.name || ""
    )
      .trim()
      .toLowerCase();

    const city = String(
      guesthouse.city || ""
    )
      .trim()
      .toLowerCase();

    const id =
      guesthouse.id !== undefined &&
      guesthouse.id !== null &&
      guesthouse.id !== ""
        ? String(guesthouse.id)
        : "";

    const key = id
      ? `id:${id}`
      : `${name}|${city}`;

    /*
     * Guesthouse must have a name.
     */
    if (!name) {
      return false;
    }

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
};

/*
 * ============================================================
 * IMAGE ERROR HANDLER
 * ============================================================
 */
const handleImageError = (event) => {
  if (
    event.currentTarget.dataset
      .fallbackApplied === "true"
  ) {
    return;
  }

  event.currentTarget.dataset.fallbackApplied =
    "true";

  event.currentTarget.style.display = "none";

  const fallback =
    event.currentTarget.parentElement?.querySelector(
      "[data-image-fallback]"
    );

  if (fallback) {
    fallback.classList.remove("hidden");
  }
};

/*
 * ============================================================
 * HOME COMPONENT
 * ============================================================
 */
export function Home() {
  const navigate = useNavigate();

  const [guesthouses, setGuesthouses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  /*
   * ==========================================================
   * SCROLL TO SECTION
   * ==========================================================
   */
  const scrollToSection = (sectionId) => {
    const section =
      document.getElementById(sectionId);

    if (!section) {
      return;
    }

    window.history.pushState(
      null,
      "",
      `/#${sectionId}`
    );

    requestAnimationFrame(() => {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  /*
   * ==========================================================
   * HANDLE HASH NAVIGATION
   * ==========================================================
   */
  useEffect(() => {
    const scrollToHashSection = () => {
      const sectionId =
        window.location.hash.replace(
          "#",
          ""
        );

      if (!sectionId) {
        return;
      }

      window.setTimeout(() => {
        const section =
          document.getElementById(
            sectionId
          );

        if (section) {
          section.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    };

    scrollToHashSection();

    window.addEventListener(
      "hashchange",
      scrollToHashSection
    );

    return () => {
      window.removeEventListener(
        "hashchange",
        scrollToHashSection
      );
    };
  }, []);

  /*
   * ==========================================================
   * LOAD GUESTHOUSES FROM DATABASE
   * ==========================================================
   */
  useEffect(() => {
    let mounted = true;

    const loadGuesthouses = async () => {
      try {
        setLoading(true);

        console.log(
          "🔍 Loading guesthouses from database..."
        );

        const response =
          await ApiService.getGuesthouses({});

        console.log(
          "📦 Guesthouse API Response:",
          response
        );

        let result = [];

        /*
         * Support different API response structures.
         */
        if (Array.isArray(response)) {
          result = response;
        } else if (
          Array.isArray(response?.data)
        ) {
          result = response.data;
        } else if (
          Array.isArray(
            response?.guesthouses
          )
        ) {
          result = response.guesthouses;
        } else if (
          Array.isArray(
            response?.data?.guesthouses
          )
        ) {
          result =
            response.data.guesthouses;
        }

        console.log(
          "🏠 Guesthouses received from database:",
          result
        );

        /*
         * Normalize API guesthouses.
         */
        const normalizedApiGuesthouses =
          result
            .map(normalizeGuesthouse)
            .filter(Boolean);

        /*
         * Remove duplicate database records.
         */
        const uniqueGuesthouses =
          removeDuplicates(
            normalizedApiGuesthouses
          );

        /*
         * ======================================================
         * CHECK LALIBELA
         * ======================================================
         *
         * Correct database record should be:
         *
         * id: 14
         * name: Lalibela Heritage Guesthouse
         */
        const lalibela =
          uniqueGuesthouses.find(
            (guesthouse) =>
              guesthouse.name
                ?.toLowerCase()
                .includes("lalibela")
          );

        if (lalibela) {
          console.log(
            "✅ Lalibela found from DATABASE:",
            lalibela
          );

          console.log(
            "🆔 Lalibela database ID:",
            lalibela.id
          );

          if (
            Number(lalibela.id) === 14
          ) {
            console.log(
              "✅ Correct Lalibela ID 14 detected."
            );
          } else {
            console.warn(
              "⚠️ Lalibela was found, but its ID is not 14:",
              lalibela.id
            );
          }
        } else {
          console.warn(
            "⚠️ Lalibela Heritage Guesthouse was NOT returned by the API."
          );
        }

        /*
         * Only approved / verified guesthouses
         * should be displayed.
         */
        const verified =
          uniqueGuesthouses.filter(
            isVerifiedGuesthouse
          );

        console.log(
          "✅ Verified guesthouses:",
          verified.length
        );

        if (mounted) {
          setGuesthouses(verified);
        }
      } catch (error) {
        console.error(
          "❌ Failed to load guesthouses from API:",
          error
        );

        /*
         * IMPORTANT:
         *
         * Do NOT create fake guesthouses here.
         *
         * This prevents fake IDs such as:
         * "demo-lalibela-1"
         *
         * from reaching GuesthouseDetail.jsx.
         */
        if (mounted) {
          setGuesthouses([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadGuesthouses();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * ==========================================================
   * VERIFIED GUESTHOUSES TO DISPLAY
   * ==========================================================
   */
  const verifiedGuesthouses = useMemo(() => {
    const filtered =
      guesthouses.filter(
        isVerifiedGuesthouse
      );

    const unique =
      removeDuplicates(filtered);

    console.log(
      "🔍 Displaying guesthouses:",
      unique.length
    );

    return unique.slice(
      0,
      MAX_GUESTHOUSES
    );
  }, [guesthouses]);

  /*
   * ==========================================================
   * DEBUG DISPLAY LIST
   * ==========================================================
   */
  useEffect(() => {
    console.log(
      "📋 Displaying guesthouses:",
      verifiedGuesthouses.length
    );

    if (
      verifiedGuesthouses.length > 0
    ) {
      console.log(
        "📋 Guesthouses:",
        verifiedGuesthouses.map(
          (guesthouse) => ({
            id: guesthouse.id,
            name: guesthouse.name,
            city: guesthouse.city,
          })
        )
      );

      const lalibela =
        verifiedGuesthouses.find(
          (guesthouse) =>
            guesthouse.name
              ?.toLowerCase()
              .includes("lalibela")
        );

      if (lalibela) {
        console.log(
          "🏠 Lalibela in display list:",
          lalibela
        );
      }
    }
  }, [verifiedGuesthouses]);

  /*
   * ==========================================================
   * VIEW AND BOOK GUESTHOUSE
   * ==========================================================
   */
  const handleViewAndBook = (
    guesthouse
  ) => {
    if (!guesthouse?.id) {
      console.error(
        "❌ Cannot open guesthouse because the ID is missing.",
        guesthouse
      );

      return;
    }

    /*
     * GuesthouseDetail.jsx expects a numeric
     * database ID.
     *
     * Example:
     * Lalibela Heritage Guesthouse -> 14
     */
    const guesthouseId = Number(
      guesthouse.id
    );

    if (
      !Number.isInteger(guesthouseId) ||
      guesthouseId <= 0
    ) {
      console.error(
        "❌ Cannot open guesthouse because the ID is not a valid database ID:",
        guesthouse.id,
        guesthouse
      );

      return;
    }

    console.log(
      "➡️ Opening guesthouse:",
      guesthouse.name,
      "ID:",
      guesthouseId
    );

    navigate(
      `/guesthouses/${guesthouseId}`,
      {
        state: {
          guesthouse,
        },
      }
    );
  };

  /*
   * ==========================================================
   * CONTACT FORM
   * ==========================================================
   */
  const handleContactSubmit = (
    event
  ) => {
    event.preventDefault();

    const formData =
      new FormData(
        event.currentTarget
      );

    const name =
      formData.get("name");

    const email =
      formData.get("email");

    const message =
      formData.get("message");

    const subject =
      encodeURIComponent(
        `Guesthouse Platform Contact - ${name}`
      );

    const body =
      encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
      );

    window.location.href =
      `mailto:guesthouseplatform@gmail.com?subject=${subject}&body=${body}`;
  };

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */
  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* ======================================================
          HERO
      ======================================================= */}

      <section
        id="home"
        className="relative flex min-h-[680px] items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 bg-[#043658]">
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(135deg,transparent_0%,#FFC107_50%,transparent_100%)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-3xl flex-col items-center">

            <div className="mb-6 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur-md">
              <Building2 className="h-4 w-4 text-[#FFC107]" />
              Verified Guesthouse Reservation Platform
            </div>

            <h1
              className="text-5xl font-normal leading-tight text-white sm:text-6xl lg:text-7xl"
              style={{
                fontFamily:
                  "'Times New Roman', Times, serif",
              }}
            >
              Discover & Book Verified
              Guesthouses Across Ethiopia
            </h1>

            <p
              className="mt-7 max-w-2xl text-base leading-8 text-white/90 sm:text-lg"
              style={{
                fontFamily:
                  "'Times New Roman', Times, serif",
              }}
            >
              Find trusted guesthouses, explore
              comfortable rooms, check availability,
              and reserve your stay with confidence.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    "explore"
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#FFC107] px-6 py-3.5 text-sm font-bold text-[#043658] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#ffca28]"
              >
                Explore Guesthouses
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    "about"
                  )
                }
                className="rounded-xl border border-white/50 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                Learn More
              </button>
            </div>

          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            scrollToSection(
              "explore"
            )
          }
          className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/80 transition hover:text-white"
          aria-label="Scroll down"
        >
          <ChevronDown className="h-7 w-7 animate-bounce" />
        </button>
      </section>

      {/* ======================================================
          EXPLORE
      ======================================================= */}

      <section
        id="explore"
        className="scroll-mt-20 bg-slate-50 px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">

          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FFC107]">
              EXPLORE
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#043658] sm:text-4xl">
              Find a Guesthouse You Can Trust
            </h2>

            <p className="mt-5 text-base leading-8 text-slate-600">
              Directly reserve guest rooms with
              real-time double-booking prevention
              and instant receipt generation via
              Telebirr or bank transfer.
            </p>
          </div>

          {/* FEATURES */}

          <div className="mt-12 grid gap-5 md:grid-cols-3">

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#043658] text-[#FFC107]">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-lg font-black text-[#043658]">
                Verified Guesthouses
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Discover guesthouses that have passed
                the platform verification process.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#043658] text-[#FFC107]">
                <CalendarCheck className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-lg font-black text-[#043658]">
                Easy Reservations
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Search available rooms and reserve your
                preferred stay without unnecessary phone
                calls or walk-ins.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#043658] text-[#FFC107]">
                <Receipt className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-lg font-black text-[#043658]">
                Clear Confirmation
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                Complete payment and receive your
                reservation confirmation and receipt.
              </p>
            </div>

          </div>

          {/* GUESTHOUSES */}

          <div className="mt-16">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FFC107]">
                  VERIFIED STAYS
                </p>

                <h3 className="mt-2 text-2xl font-black text-[#043658] sm:text-3xl">
                  Guesthouses Across Ethiopia
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Showing{" "}
                  {verifiedGuesthouses.length}{" "}
                  verified guesthouses
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/search")
                }
                className="inline-flex items-center gap-2 self-start rounded-xl bg-[#043658] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#064b78] sm:self-auto"
              >
                View All Guesthouses
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* LOADING */}

            {loading ? (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({
                  length: 6,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="h-56 animate-pulse bg-slate-200" />

                    <div className="space-y-3 p-5">
                      <div className="h-5 animate-pulse rounded bg-slate-200" />

                      <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />

                      <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : verifiedGuesthouses.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

                {verifiedGuesthouses.map(
                  (guesthouse) => (
                    <article
                      key={guesthouse.id}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >

                      {/* IMAGE */}

                      <div className="relative h-56 overflow-hidden bg-slate-100">

                        {guesthouse.image ? (
                          <img
                            src={
                              guesthouse.image
                            }
                            alt={
                              guesthouse.name
                            }
                            onError={
                              handleImageError
                            }
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : null}

                        <div
                          data-image-fallback
                          className={`absolute inset-0 flex items-center justify-center ${
                            guesthouse.image
                              ? "hidden"
                              : ""
                          }`}
                        >
                          <Building2 className="h-12 w-12 text-slate-300" />
                        </div>

                        <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#043658] shadow">
                          <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                          Verified
                        </div>
                      </div>

                      {/* CARD CONTENT */}

                      <div className="p-5">

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <h4 className="truncate text-lg font-black text-[#043658]">
                              {guesthouse.name}
                            </h4>

                            <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                              <MapPin className="h-4 w-4 shrink-0 text-[#FFC107]" />

                              <span className="truncate">
                                {
                                  guesthouse.address
                                }
                              </span>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-black text-amber-700">
                            <Star className="h-3.5 w-3.5 fill-current" />

                            {Number(
                              guesthouse.rating ||
                                0
                            ).toFixed(1)}
                          </div>
                        </div>

                        <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
                          {
                            guesthouse.description
                          }
                        </p>

                        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">

                          <div>
                            <p className="text-xs text-slate-500">
                              Starting from
                            </p>

                            <p className="mt-1 text-lg font-black text-[#043658]">
                              {guesthouse.price >
                              0
                                ? `${guesthouse.price.toLocaleString()} ETB`
                                : "Contact for price"}
                            </p>

                            {guesthouse.price >
                              0 && (
                              <p className="text-xs text-slate-400">
                                per night
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleViewAndBook(
                                guesthouse
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-[#043658] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#064b78]"
                          >
                            View & Book
                            <ArrowRight className="h-4 w-4" />
                          </button>

                        </div>
                      </div>
                    </article>
                  )
                )}

              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">

                <Building2 className="mx-auto h-12 w-12 text-slate-300" />

                <h4 className="mt-4 text-lg font-black text-[#043658]">
                  No verified guesthouses found
                </h4>

                <p className="mt-2 text-sm text-slate-500">
                  Please check again later.
                </p>

              </div>
            )}

          </div>

          <div className="mt-12 text-center">

            <button
              type="button"
              onClick={() =>
                navigate("/search")
              }
              className="inline-flex items-center gap-2 rounded-xl border border-[#043658] px-6 py-3.5 text-sm font-black text-[#043658] transition hover:bg-[#043658] hover:text-white"
            >
              Explore All Guesthouses
              <ArrowRight className="h-4 w-4" />
            </button>

          </div>
        </div>
      </section>

      {/* ======================================================
          ABOUT
      ======================================================= */}

      <section
        id="about"
        className="scroll-mt-20 bg-[#043658] px-4 py-24 text-white sm:px-6 lg:px-8"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">

          <div>

            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FFC107]">
              ABOUT US
            </p>

            <h2
              className="mt-3 text-4xl font-normal tracking-tight sm:text-5xl"
              style={{
                fontFamily:
                  "'Times New Roman', Times, serif",
              }}
            >
              About Guesthouse Platform
            </h2>

            <p className="mt-6 text-base leading-8 text-white/80">
              Guesthouse Platform is an Ethiopian
              reservation platform designed to make
              finding and booking guesthouses easier,
              safer, and more convenient.
            </p>

            <p className="mt-5 text-base leading-8 text-white/80">
              Instead of relying only on phone calls,
              walk-ins, or informal booking methods,
              guests can explore available guesthouses,
              view rooms, make reservations, and
              receive confirmation through the platform.
            </p>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "explore"
                )
              }
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#FFC107] px-6 py-3.5 text-sm font-black text-[#043658] transition hover:bg-[#ffca28]"
            >
              Explore Guesthouses
              <ArrowRight className="h-4 w-4" />
            </button>

          </div>

          <div className="grid gap-5 sm:grid-cols-2">

            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-sm">
              <ShieldCheck className="h-8 w-8 text-[#FFC107]" />

              <h3 className="mt-5 text-lg font-black">
                Verified Stays
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/70">
                Guests can discover guesthouses that
                have passed the platform's verification
                process.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-sm">
              <Users className="h-8 w-8 text-[#FFC107]" />

              <h3 className="mt-5 text-lg font-black">
                Built for Everyone
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/70">
                Designed for guests, owners,
                receptionists, and administrators.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-sm">
              <CalendarCheck className="h-8 w-8 text-[#FFC107]" />

              <h3 className="mt-5 text-lg font-black">
                Reliable Booking
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/70">
                Reservations are managed digitally to
                help prevent double-booking.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-sm">
              <Receipt className="h-8 w-8 text-[#FFC107]" />

              <h3 className="mt-5 text-lg font-black">
                Clear Receipts
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/70">
                Guests can receive clear booking and
                payment information after making
                reservations.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================
          CONTACT
      ======================================================= */}

      <section
        id="contact"
        className="scroll-mt-20 bg-[#043658] px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">

          <div className="flex flex-col justify-center text-white">

            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FFC107]">
              CONTACT
            </p>

            <h2
              className="mt-3 text-5xl font-normal"
              style={{
                fontFamily:
                  "'Times New Roman', Times, serif",
              }}
            >
              Get in Touch
            </h2>

            <p className="mt-6 max-w-xl text-base leading-8 text-white/80">
              Have a question about a guesthouse,
              reservation, payment, or the platform?
              Send us a message and our team will be
              happy to help.
            </p>

            <div className="mt-9 space-y-6">

              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                  <Mail className="h-5 w-5 text-[#FFC107]" />
                </div>

                <div>
                  <p className="text-sm text-white/60">
                    Email
                  </p>

                  <p className="font-bold">
                    guesthouseplatform@gmail.com
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                  <Phone className="h-5 w-5 text-[#FFC107]" />
                </div>

                <div>
                  <p className="text-sm text-white/60">
                    Phone
                  </p>

                  <p className="font-bold">
                    +251 9XX XXX XXX
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                  <MapPin className="h-5 w-5 text-[#FFC107]" />
                </div>

                <div>
                  <p className="text-sm text-white/60">
                    Location
                  </p>

                  <p className="font-bold">
                    Addis Ababa, Ethiopia
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className="rounded-3xl bg-white p-7 shadow-2xl sm:p-10">

            <h3 className="text-2xl font-black text-[#043658]">
              Send us a message
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              We would love to hear from you.
            </p>

            <form
              onSubmit={
                handleContactSubmit
              }
              className="mt-7 space-y-5"
            >

              <div>
                <label className="mb-2 block text-sm font-bold text-[#043658]">
                  Name
                </label>

                <input
                  type="text"
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-[#FFC107] focus:ring-2 focus:ring-[#FFC107]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#043658]">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-[#FFC107] focus:ring-2 focus:ring-[#FFC107]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#043658]">
                  Message
                </label>

                <textarea
                  name="message"
                  required
                  rows="5"
                  placeholder="How can we help you?"
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-[#FFC107] focus:ring-2 focus:ring-[#FFC107]/20"
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#043658] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#FFC107] hover:text-[#043658]"
              >
                <Mail className="h-4 w-4" />
                Send Email
                <Send className="h-4 w-4" />
              </button>

            </form>
          </div>

        </div>
      </section>

      {/* ======================================================
          FOOTER
      ======================================================= */}

      <footer className="bg-[#032944] px-4 py-8 text-white sm:px-6 lg:px-8">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">

          <div>
            <h3 className="text-lg font-black">
              Guesthouse Platform
            </h3>
          </div>

          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} Guesthouse Platform.
            All rights reserved.
          </p>

        </div>
      </footer>

    </div>
  );
}

export default Home;