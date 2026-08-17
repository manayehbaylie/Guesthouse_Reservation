import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiService } from "../../services/api.js";
import {
  MapPin,
  ShieldCheck,
  Star,
  Building2,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

const MAX_GUESTHOUSES = 10;

const FALLBACK_GUESTHOUSES = [
  {
    id: "demo-addis-1",
    name: "Bole Comfort Guesthouse",
    address: "Bole, Addis Ababa",
    city: "Addis Ababa",
    description:
      "A comfortable verified guesthouse located in Bole with clean rooms and modern facilities.",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945",
    status: "APPROVED",
    verified: true,
    rating: 4.8,
    price: 1200,
  },
  {
    id: "demo-addis-2",
    name: "Addis Garden Guesthouse",
    address: "Kazanchis, Addis Ababa",
    city: "Addis Ababa",
    description:
      "A peaceful verified guesthouse offering comfortable accommodation in the heart of Addis Ababa.",
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791",
    status: "APPROVED",
    verified: true,
    rating: 4.7,
    price: 1400,
  },
  {
    id: "demo-hawassa-1",
    name: "Hawassa Lake View",
    address: "Hawassa, Sidama",
    city: "Hawassa",
    description:
      "A relaxing verified guesthouse close to Lake Hawassa with beautiful surroundings.",
    image:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
    status: "APPROVED",
    verified: true,
    rating: 4.9,
    price: 1300,
  },
  {
    id: "demo-hawassa-2",
    name: "Hawassa Green Stay",
    address: "Central Hawassa",
    city: "Hawassa",
    description:
      "A clean and comfortable verified guesthouse suitable for short and long stays.",
    image:
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a",
    status: "APPROVED",
    verified: true,
    rating: 4.6,
    price: 1100,
  },
  {
    id: "demo-bishoftu-1",
    name: "Bishoftu Lakeside Guesthouse",
    address: "Bishoftu, Oromia",
    city: "Bishoftu",
    description:
      "A verified guesthouse offering a peaceful stay near Bishoftu's beautiful lakes.",
    image:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
    status: "APPROVED",
    verified: true,
    rating: 4.8,
    price: 1250,
  },
  {
    id: "demo-bishoftu-2",
    name: "Bishoftu Family Stay",
    address: "Bishoftu Town",
    city: "Bishoftu",
    description:
      "A family-friendly verified guesthouse with comfortable rooms and convenient access to the city.",
    image:
      "https://images.unsplash.com/photo-1590490360182-c33d57733427",
    status: "APPROVED",
    verified: true,
    rating: 4.5,
    price: 1000,
  },
  {
    id: "demo-bahir-1",
    name: "Bahir Dar Lakeside Guesthouse",
    address: "Bahir Dar",
    city: "Bahir Dar",
    description:
      "A comfortable verified guesthouse close to Lake Tana and the city center.",
    image:
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7",
    status: "APPROVED",
    verified: true,
    rating: 4.8,
    price: 1300,
  },
  {
    id: "demo-bahir-2",
    name: "Blue Nile Guesthouse",
    address: "Bahir Dar",
    city: "Bahir Dar",
    description:
      "A modern verified guesthouse with comfortable rooms for travelers visiting Bahir Dar.",
    image:
      "https://images.unsplash.com/photo-1601918774946-25832a4be0d6",
    status: "APPROVED",
    verified: true,
    rating: 4.6,
    price: 1150,
  },
  {
    id: "demo-lalibela-1",
    name: "Lalibela Heritage Stay",
    address: "Lalibela, Amhara",
    city: "Lalibela",
    description:
      "A verified guesthouse located near Lalibela's historic attractions.",
    image:
      "https://images.unsplash.com/photo-1548013146-72479768bada",
    status: "APPROVED",
    verified: true,
    rating: 4.9,
    price: 1400,
  },
  {
    id: "demo-lalibela-2",
    name: "Lalibela Mountain Guesthouse",
    address: "Lalibela",
    city: "Lalibela",
    description:
      "A peaceful verified guesthouse with comfortable rooms and mountain surroundings.",
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d",
    status: "APPROVED",
    verified: true,
    rating: 4.7,
    price: 1200,
  },
];

/*
|--------------------------------------------------------------------------
| CHECK WHETHER A GUESTHOUSE IS VERIFIED
|--------------------------------------------------------------------------
*/

const isVerifiedGuesthouse = (guesthouse) => {
  const status = String(guesthouse?.status || "").toUpperCase();

  return (
    status === "APPROVED" ||
    guesthouse?.approved === true ||
    guesthouse?.verified === true
  );
};

/*
|--------------------------------------------------------------------------
| NORMALIZE API DATA
|--------------------------------------------------------------------------
*/

const normalizeGuesthouse = (guesthouse) => ({
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

  rating: Number(
    guesthouse.rating ||
      guesthouse.averageRating ||
      4.5
  ),

  price: Number(
    guesthouse.price ||
      guesthouse.minPrice ||
      guesthouse.rooms?.[0]?.price ||
      0
  ),
});

/*
|--------------------------------------------------------------------------
| REMOVE DUPLICATE GUESTHOUSES
|--------------------------------------------------------------------------
*/

const removeDuplicates = (guesthouses) => {
  const seen = new Set();

  return guesthouses.filter((guesthouse) => {
    const name = String(guesthouse.name || "")
      .trim()
      .toLowerCase();

    const city = String(guesthouse.city || "")
      .trim()
      .toLowerCase();

    const key = `${name}|${city}`;

    if (!name || seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
};

/*
|--------------------------------------------------------------------------
| HOME PAGE
|--------------------------------------------------------------------------
*/

export function Home() {
  const navigate = useNavigate();

  const [guesthouses, setGuesthouses] = useState([]);
  const [loading, setLoading] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | LOAD VERIFIED GUESTHOUSES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadGuesthouses();
  }, []);

  const loadGuesthouses = async () => {
    try {
      setLoading(true);

      let result = [];

      /*
      |--------------------------------------------------------------------------
      | LOAD FROM BACKEND
      |--------------------------------------------------------------------------
      */

      try {
        const response = await ApiService.getGuesthouses?.({});

        if (Array.isArray(response)) {
          result = response;
        } else if (Array.isArray(response?.data)) {
          result = response.data;
        } else if (Array.isArray(response?.guesthouses)) {
          result = response.guesthouses;
        }
      } catch (apiError) {
        console.warn(
          "Could not load guesthouses from API. Using available data.",
          apiError
        );
      }

      /*
      |--------------------------------------------------------------------------
      | ONLY VERIFIED API GUESTHOUSES
      |--------------------------------------------------------------------------
      */

      const normalizedApiGuesthouses = result
        .map(normalizeGuesthouse)
        .filter(isVerifiedGuesthouse);

      /*
      |--------------------------------------------------------------------------
      | VERIFIED FALLBACK GUESTHOUSES
      |--------------------------------------------------------------------------
      */

      const normalizedFallbackGuesthouses =
        FALLBACK_GUESTHOUSES
          .map(normalizeGuesthouse)
          .filter(isVerifiedGuesthouse);

      /*
      |--------------------------------------------------------------------------
      | COMBINE API + FALLBACK
      |--------------------------------------------------------------------------
      */

      const combined = removeDuplicates([
        ...normalizedApiGuesthouses,
        ...normalizedFallbackGuesthouses,
      ]);

      setGuesthouses(combined);
    } catch (error) {
      console.error(
        "Failed to load guesthouses:",
        error
      );

      /*
      |--------------------------------------------------------------------------
      | FALLBACK DATA
      |--------------------------------------------------------------------------
      */

      setGuesthouses(
        removeDuplicates(
          FALLBACK_GUESTHOUSES
            .map(normalizeGuesthouse)
            .filter(isVerifiedGuesthouse)
        )
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FINAL VERIFIED LIST
  |--------------------------------------------------------------------------
  */

  const verifiedGuesthouses = useMemo(() => {
    return removeDuplicates(
      guesthouses.filter(isVerifiedGuesthouse)
    ).slice(0, MAX_GUESTHOUSES);
  }, [guesthouses]);

  /*
  |--------------------------------------------------------------------------
  | VIEW GUESTHOUSE
  |--------------------------------------------------------------------------
  */

  const handleViewAndBook = (guesthouse) => {
    navigate(`/guesthouses/${guesthouse.id}`, {
      state: {
        guesthouse,
      },
    });
  };

  /*
  |--------------------------------------------------------------------------
  | HOME PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-stone-50 pb-16">

      {/* =========================================================
          HERO
      ========================================================= */}

      <section className="relative overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800 px-4 py-20 text-white sm:px-6 lg:px-8">

        <div className="mx-auto max-w-5xl">

          <div className="mx-auto max-w-4xl text-center">

            {/* MAIN TITLE */}

            <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Discover & Book Verified Guesthouses Across Ethiopia
            </h1>

            {/* DESCRIPTION */}

            <p className="mx-auto mt-6 max-w-3xl text-sm leading-7 text-stone-300 sm:text-base">
              Directly reserve boutique guest rooms with real-time
              double-booking prevention and instant receipt generation via
              Telebirr or bank transfer.
            </p>

          </div>

        </div>

      </section>

      {/* =========================================================
          VERIFIED GUESTHOUSES
      ========================================================= */}

      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">

        {/* SECTION HEADER */}

        <div className="mb-7 flex items-center justify-between">

          <div className="flex items-center gap-2">

            <ShieldCheck className="h-6 w-6 text-green-600" />

            <h2 className="text-2xl font-black tracking-tight text-stone-900">
              Verified Guesthouses
            </h2>

          </div>

          {/* VIEW ALL */}

          <button
            type="button"
            onClick={() => navigate("/search")}
            className="flex items-center gap-1 text-sm font-bold text-amber-700 transition hover:text-amber-800"
          >
            View all

            <ChevronRight className="h-4 w-4" />
          </button>

        </div>

        {/* =======================================================
            LOADING
        ======================================================= */}

        {loading ? (

          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-amber-500" />

            <p className="mt-4 text-sm font-medium text-stone-500">
              Loading verified guesthouses...
            </p>

          </div>

        ) : verifiedGuesthouses.length === 0 ? (

          /* =====================================================
             NO GUESTHOUSES
          ===================================================== */

          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">

            <Building2 className="mx-auto h-12 w-12 text-stone-300" />

            <h3 className="mt-4 text-lg font-bold text-stone-900">
              No verified guesthouses available
            </h3>

          </div>

        ) : (

          /* =====================================================
             GUESTHOUSE CARDS
          ===================================================== */

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {verifiedGuesthouses.map((guesthouse) => (

              <article
                key={guesthouse.id}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >

                {/* =================================================
                    IMAGE
                ================================================= */}

                <div className="relative h-52 overflow-hidden bg-stone-200">

                  {guesthouse.image ? (

                    <img
                      src={guesthouse.image}
                      alt={guesthouse.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />

                  ) : (

                    <div className="flex h-full items-center justify-center">

                      <Building2 className="h-16 w-16 text-stone-400" />

                    </div>

                  )}

                  {/* VERIFIED BADGE */}

                  <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-xs font-bold text-white shadow">

                    <CheckCircle2 className="h-3.5 w-3.5" />

                    Verified

                  </div>

                  {/* CITY BADGE */}

                  <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-stone-800 shadow">

                    {guesthouse.city}

                  </div>

                </div>

                {/* =================================================
                    CARD CONTENT
                ================================================= */}

                <div className="p-5">

                  {/* NAME + RATING */}

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <h3 className="text-lg font-black text-stone-900">
                        {guesthouse.name}
                      </h3>

                      <div className="mt-1 flex items-center gap-1 text-xs text-stone-500">

                        <MapPin className="h-3.5 w-3.5" />

                        {guesthouse.address}

                      </div>

                    </div>

                    {/* RATING */}

                    <div className="flex items-center gap-1 whitespace-nowrap text-xs font-bold text-amber-600">

                      <Star className="h-3.5 w-3.5 fill-current" />

                      {guesthouse.rating.toFixed(1)}

                    </div>

                  </div>

                  {/* DESCRIPTION */}

                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-500">

                    {guesthouse.description}

                  </p>

                  {/* PRICE + BUTTON */}

                  <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">

                    <div>

                      <span className="text-xs text-stone-500">
                        Starting from
                      </span>

                      <div className="text-lg font-black text-stone-900">

                        {guesthouse.price > 0
                          ? `${guesthouse.price.toLocaleString()} ETB`
                          : "View rooms"}

                        {guesthouse.price > 0 && (

                          <span className="ml-1 text-xs font-normal text-stone-400">
                            / night
                          </span>

                        )}

                      </div>

                    </div>

                    {/* VIEW & BOOK */}

                    <button
                      type="button"
                      onClick={() =>
                        handleViewAndBook(guesthouse)
                      }
                      className="flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-black text-white transition hover:bg-amber-500 hover:text-stone-950"
                    >

                      View & Book

                      <ArrowRight className="h-4 w-4" />

                    </button>

                  </div>

                </div>

              </article>

            ))}

          </div>

        )}

      </section>

    </div>
  );
}

export default Home;