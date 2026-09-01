
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Star,
  Sparkles,
  Home,
} from 'lucide-react';

import { ApiService } from '../../services/api.js';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';

export function AllGuesthouses() {
  const navigate = useNavigate();

  const [guesthouses, setGuesthouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ---------------------------------------------------------
  // LOAD APPROVED GUESTHOUSES
  // ---------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const loadGuesthouses = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await ApiService.getGuesthouses({});

        /*
         * ApiService implementations can return:
         *   1. an array
         *   2. { data: [...] }
         *   3. { success: true, data: [...] }
         *   4. { guesthouses: [...] }
         *
         * Normalize all common formats here.
         */
        let list = [];

        if (Array.isArray(response)) {
          list = response;
        } else if (Array.isArray(response?.data)) {
          list = response.data;
        } else if (Array.isArray(response?.data?.data)) {
          list = response.data.data;
        } else if (Array.isArray(response?.guesthouses)) {
          list = response.guesthouses;
        } else if (Array.isArray(response?.data?.guesthouses)) {
          list = response.data.guesthouses;
        }

        // Only show approved guesthouses.
        const approved = list.filter((guesthouse) => {
          const status = String(
            guesthouse?.status ||
              guesthouse?.approvalStatus ||
              ''
          )
            .trim()
            .toLowerCase();

          return status === 'approved';
        });

        if (mounted) {
          setGuesthouses(approved);
        }
      } catch (err) {
        console.error('Failed to load guesthouses:', err);

        if (mounted) {
          setGuesthouses([]);
          setError(
            err?.response?.data?.message ||
              err?.message ||
              'Failed to load guesthouses.'
          );
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

  // ---------------------------------------------------------
  // VIEW GUESTHOUSE
  // ---------------------------------------------------------
  const handleViewGuesthouse = (guesthouseId) => {
    if (!guesthouseId) {
      console.error('Guesthouse ID is missing.');
      return;
    }

    navigate(`/guesthouses/${guesthouseId}`);
  };

  // ---------------------------------------------------------
  // GET GUESTHOUSE ID
  // ---------------------------------------------------------
  const getGuesthouseId = (guesthouse) => {
    return (
      guesthouse?.id ||
      guesthouse?._id ||
      guesthouse?.guesthouseId ||
      guesthouse?.guesthouse_id
    );
  };

  // ---------------------------------------------------------
  // GET GUESTHOUSE IMAGE
  // ---------------------------------------------------------
  const getGuesthouseImage = (guesthouse) => {
    const candidates = [];

    // Single image fields
    candidates.push(
      guesthouse?.image,
      guesthouse?.imageUrl,
      guesthouse?.coverImage,
      guesthouse?.coverImageUrl,
      guesthouse?.photo,
      guesthouse?.photoUrl
    );

    // Array image fields
    if (Array.isArray(guesthouse?.images)) {
      candidates.push(...guesthouse.images);
    }

    if (Array.isArray(guesthouse?.photos)) {
      candidates.push(...guesthouse.photos);
    }

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }

      // Support image objects such as:
      // { url: "..." }
      // { imageUrl: "..." }
      // { path: "..." }
      if (candidate && typeof candidate === 'object') {
        const url =
          candidate?.url ||
          candidate?.imageUrl ||
          candidate?.path ||
          candidate?.src;

        if (typeof url === 'string' && url.trim()) {
          return url.trim();
        }
      }
    }

    return FALLBACK_IMAGE;
  };

  // ---------------------------------------------------------
  // IMAGE ERROR HANDLER
  // ---------------------------------------------------------
  const handleImageError = (event) => {
    if (event.currentTarget.src !== FALLBACK_IMAGE) {
      event.currentTarget.src = FALLBACK_IMAGE;
    }
  };

  // ---------------------------------------------------------
  // GET RATING
  // ---------------------------------------------------------
  const getRating = (guesthouse) => {
    const rating = Number(
      guesthouse?.rating ??
        guesthouse?.averageRating ??
        guesthouse?.average_rating ??
        4.5
    );

    if (!Number.isFinite(rating)) {
      return '4.5';
    }

    return Math.min(5, Math.max(0, rating)).toFixed(1);
  };

  // ---------------------------------------------------------
  // GET ROOM COUNT
  // ---------------------------------------------------------
  const getRoomCount = (guesthouse) => {
    const value =
      guesthouse?.numberOfRooms ??
      guesthouse?.number_of_rooms ??
      guesthouse?.roomCount ??
      guesthouse?.rooms?.length;

    if (value === undefined || value === null || value === '') {
      return 'N/A';
    }

    return value;
  };

  // ---------------------------------------------------------
  // GET LOCATION
  // ---------------------------------------------------------
  const getLocation = (guesthouse) => {
    return (
      guesthouse?.location ||
      guesthouse?.address ||
      guesthouse?.city ||
      'Ethiopia'
    );
  };

  // ---------------------------------------------------------
  // GET CITY
  // ---------------------------------------------------------
  const getCity = (guesthouse) => {
    return (
      guesthouse?.city ||
      guesthouse?.town ||
      guesthouse?.location ||
      'Ethiopia'
    );
  };

  // ---------------------------------------------------------
  // GET DESCRIPTION
  // ---------------------------------------------------------
  const getDescription = (guesthouse) => {
    return (
      guesthouse?.description ||
      'Comfortable and verified guesthouse accommodation in a great location.'
    );
  };

  // ---------------------------------------------------------
  // GET UNIQUE CITIES
  // ---------------------------------------------------------
  const cityCount = new Set(
    guesthouses.map((guesthouse) =>
      String(getCity(guesthouse)).trim().toLowerCase()
    )
  ).size;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* =====================================================
          HERO SECTION
      ====================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            All Verified Guesthouses
          </div>

          <h1 className="mt-5 font-serif text-4xl font-black tracking-tight sm:text-5xl">
            Discover Every Public Guesthouse
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm text-stone-200 sm:text-base">
            Explore all approved guesthouses and find the right place for your
            next stay.
          </p>
        </div>
      </section>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-stone-900">
              Guesthouse Directory
            </h2>

            <p className="mt-1 text-sm text-stone-600">
              Showing {guesthouses.length} approved guesthouse
              {guesthouses.length === 1 ? '' : 's'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
          >
            <Home className="h-4 w-4" />
            Back Home
          </button>
        </div>

        {/* ===================================================
            LOADING
        ==================================================== */}
        {loading && (
          <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-amber-700 border-t-transparent" />

            <p className="text-sm font-medium text-stone-600">
              Loading guesthouses...
            </p>
          </div>
        )}

        {/* ===================================================
            ERROR
        ==================================================== */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <h3 className="text-lg font-bold text-red-800">
              Unable to load guesthouses
            </h3>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-red-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-800"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ===================================================
            EMPTY STATE
        ==================================================== */}
        {!loading && !error && guesthouses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <Home className="h-7 w-7 text-amber-700" />
            </div>

            <h3 className="mt-4 text-xl font-bold text-stone-900">
              No Guesthouses Available
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
              No approved public guesthouses are available right now.
              Please check again later.
            </p>
          </div>
        )}

        {/* ===================================================
            GUESTHOUSE CARDS
        ==================================================== */}
        {!loading && !error && guesthouses.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {guesthouses.map((guesthouse, index) => {
              const guesthouseId = getGuesthouseId(guesthouse);

              return (
                <article
                  key={guesthouseId || index}
                  className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* IMAGE */}
                  <div className="relative h-56 overflow-hidden bg-stone-200">
                    <img
                      src={getGuesthouseImage(guesthouse)}
                      alt={guesthouse?.name || 'Guesthouse'}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={handleImageError}
                    />

                    {/* RATING */}
                    <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-stone-900/80 px-2.5 py-1 text-xs font-semibold text-amber-300 backdrop-blur-sm">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />

                      {getRating(guesthouse)}
                    </div>

                    {/* VERIFIED */}
                    <div className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                      Verified
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="flex h-full flex-col p-5">
                    {/* CITY / ROOMS */}
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="max-w-[60%] truncate rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                        {getCity(guesthouse)}
                      </span>

                      <span className="shrink-0 text-xs font-medium text-stone-500">
                        {getRoomCount(guesthouse)} rooms
                      </span>
                    </div>

                    {/* NAME */}
                    <h3 className="line-clamp-2 text-xl font-black text-stone-900">
                      {guesthouse?.name || 'Unnamed Guesthouse'}
                    </h3>

                    {/* LOCATION */}
                    <div className="mt-3 flex items-start gap-2 text-sm text-stone-600">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />

                      <span className="line-clamp-2">
                        {getLocation(guesthouse)}
                      </span>
                    </div>

                    {/* DESCRIPTION */}
                    <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-stone-600">
                      {getDescription(guesthouse)}
                    </p>

                    {/* CONTACT INFORMATION */}
                    {(guesthouse?.phone || guesthouse?.email) && (
                      <div className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-xs text-stone-600">
                        {guesthouse?.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-amber-700" />

                            <span className="truncate">
                              {guesthouse.phone}
                            </span>
                          </div>
                        )}

                        {guesthouse?.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-amber-700" />

                            <span className="truncate">
                              {guesthouse.email}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* VIEW DETAILS */}
                    <button
                      type="button"
                      disabled={!guesthouseId}
                      onClick={() =>
                        handleViewGuesthouse(guesthouseId)
                      }
                      className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-900 disabled:cursor-not-allowed disabled:bg-stone-400"
                    >
                      View Details

                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ===================================================
            STATISTICS
        ==================================================== */}
        {!loading && !error && guesthouses.length > 0 && (
          <section className="mt-10 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="grid gap-6 text-center sm:grid-cols-4">
              {/* APPROVED */}
              <div>
                <div className="text-3xl font-black text-amber-900">
                  {guesthouses.length}
                </div>

                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                  Approved
                </div>
              </div>

              {/* VERIFIED */}
              <div>
                <div className="text-3xl font-black text-emerald-700">
                  ✓
                </div>

                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                  Verified
                </div>
              </div>

              {/* CITIES */}
              <div>
                <div className="text-3xl font-black text-blue-700">
                  {cityCount}
                </div>

                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                  Cities
                </div>
              </div>

              {/* BOOKING */}
              <div>
                <div className="text-3xl font-black text-purple-700">
                  24/7
                </div>

                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                  Booking
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default AllGuesthouses;

