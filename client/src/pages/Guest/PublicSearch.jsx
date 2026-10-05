import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ApiService } from "../../services/api.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import {
  Search as SearchIcon,
  MapPin,
  Mail,
  Phone,
  Star,
  ShieldCheck,
  ChevronRight,
  Building2,
} from "lucide-react";

const DEFAULT_MAX_PRICE = 15000;

export function PublicSearch() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [params, setParams] = useSearchParams();

  const [keyword, setKeyword] = useState(params.get("q") || "");
  const [city, setCity] = useState(
    canonicalizeCity(params.get("city")) || "All Cities"
  );
  const [maxPrice, setMaxPrice] = useState(
    Number(
      params.get("maxPrice") || DEFAULT_MAX_PRICE
    )
  );

  const [guesthouses, setGuesthouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadGuesthouses = async () => {
      setLoading(true);
      setError("");

      try {
        const list =
          await ApiService.getGuesthouses({
            // Load all approved records so the city list and local filters
            // include every city entered by an owner and approved by admin.
          });

        if (!mounted) return;

        const verified =
          uniqueVerifiedGuesthouses(
            Array.isArray(list)
              ? list
              : []
          );

        setGuesthouses(verified);
      } catch (err) {
        console.error(
          "Guesthouse search failed:",
          err
        );

        if (!mounted) return;

        setGuesthouses([]);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load guesthouses."
        );
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
  }, [
  ]);

  const cityOptions = useMemo(() => {
    const approvedCities = guesthouses
      .map((guesthouse) => canonicalizeCity(guesthouse.city))
      .filter(Boolean);

    const uniqueCities = new Map();
    const addCity = (value) => {
      const label = canonicalizeCity(value);
      const key = normalizeCityKey(label);

      if (label && key && !uniqueCities.has(key)) {
        uniqueCities.set(key, label);
      }
    };

    approvedCities.forEach(addCity);
    addCity(city !== "All Cities" ? city : "");

    return [
      "All Cities",
      ...Array.from(uniqueCities.values()).sort((first, second) =>
        first.localeCompare(second)
      ),
    ];
  }, [guesthouses, city]);

  const results = useMemo(() => {
    let list =
      uniqueVerifiedGuesthouses(
        guesthouses
      );

    if (keyword.trim()) {
      const search = normalizeSearchText(keyword);

      list = list.filter((gh) => {
        const searchableFields = [
          gh.name,
          gh.city,
          gh.subCity,
          gh.address,
          gh.location,
          gh.woreda,
          gh.description,
          gh.phone,
          gh.email,
          ...(Array.isArray(gh.amenities) ? gh.amenities : []),
        ];

        return searchableFields.some((field) =>
          normalizeSearchText(field).includes(search)
        );
      });
    }

    if (city !== "All Cities") {
      list = list.filter(
        (gh) =>
          normalizeCityKey(gh.city) ===
          normalizeCityKey(city)
      );
    }

    list = list.filter((gh) => {
      const price =
        getMinimumRoomPrice(gh);

      if (price === null) {
        return true;
      }

      return (
        price <=
        Number(maxPrice)
      );
    });

    return list;
  }, [
    guesthouses,
    keyword,
    city,
    maxPrice,
  ]);

  const submit = (event) => {
    event.preventDefault();

    const next =
      new URLSearchParams();

    if (keyword.trim()) {
      next.set(
        "q",
        keyword.trim()
      );
    }

    if (city !== "All Cities") {
      next.set(
        "city",
        city
      );
    }

    next.set(
      "maxPrice",
      String(maxPrice)
    );

    setParams(next);
  };

  const clearFilters = () => {
    setKeyword("");
    setCity("All Cities");
    setMaxPrice(
      DEFAULT_MAX_PRICE
    );

    setParams({});
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        <section className="bg-stone-900 text-stone-100 p-8 sm:p-10 rounded-3xl shadow-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-bold border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t('Verified Guesthouses Only')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mt-4">
            {t('Search Guesthouses')}
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm mt-2 max-w-2xl">
            {t('Find administrator-approved')} guesthouses across Addis Ababa,
            Hawassa, Bishoftu, Bahir Dar and Lalibela.
          </p>
        </section>

        <form
          onSubmit={submit}
          className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            <Field label={t('Location or Keyword')}>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-amber-600" />
                <input
                  value={keyword}
                  onChange={(e) =>
                    setKeyword(
                      e.target.value
                    )
                  }
                  placeholder={t('Example locations')}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-xs outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </Field>

            <Field label={t('City')}>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-amber-600" />
                <select
                  value={city}
                  onChange={(e) =>
                    setCity(
                      e.target.value
                    )
                  }
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-xs outline-none bg-white"
                >
                  {cityOptions.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item === 'All Cities' ? t('All Cities') : item}
                      </option>
                    )
                  )}
                </select>
              </div>
            </Field>

            <Field
              label={`${t('Max Price')}: ${Number(
                maxPrice
              ).toLocaleString()} ETB`}
            >
              <input
                type="range"
                min="500"
                max="15000"
                step="500"
                value={maxPrice}
                onChange={(e) =>
                  setMaxPrice(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="w-full accent-amber-500 mt-3"
              />
              <div className="flex justify-between text-[9px] text-stone-400 mt-1">
                <span>500 ETB</span>
                <span>15,000 ETB</span>
              </div>
            </Field>
          </div>

         
        </form>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-stone-900">
              {t('Showing {{count}} guesthouses', { count: results.length })}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              {t('Only unique administrator-approved properties are displayed.')}
            </p>
          </div>
          {city !==
            "All Cities" && (
            <div className="text-xs font-bold text-amber-700">
              {city}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-80 bg-stone-200 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-red-200">
            <Building2 className="w-12 h-12 text-red-300 mx-auto" />
            <h3 className="text-base font-bold mt-3 text-red-700">{t('Unable to Load Guesthouses')}</h3>
            <p className="text-xs text-stone-500 mt-1 px-4">{error}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-4 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold">{t('Try Again')}</button>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-stone-200">
            <Building2 className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="text-base font-bold mt-3">{t('No Verified Guesthouses Found')}</h3>
            <p className="text-xs text-stone-500 mt-1">{t('Try another city, keyword, date, or maximum price.')}</p>
            <button type="button" onClick={clearFilters} className="mt-4 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold">{t('Show All Guesthouses')}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((gh) => (
              <PublicGuesthouseCard
                key={gh.id}
                guesthouse={gh}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function PublicGuesthouseCard({ guesthouse: gh, navigate }) {
  const { t } = useLanguage();
  const image = gh.image || gh.images?.[0] || gh.photos?.[0] || "";
  const price = getMinimumRoomPrice(gh);
  const displayPrice = price === null ? null : price;
  const locationParts = [
    gh.subCity,
    gh.address || gh.location,
    gh.woreda,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .filter((part, index, parts) => parts.indexOf(part) === index);

  return (
    <div
      onClick={() => navigate(`/guesthouse/${gh.id}`)}
      className="group bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer"
    >
      <div className="relative h-52 overflow-hidden bg-stone-100">
        {image ? (
          <img src={image} alt={gh.name || "Guesthouse"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 className="h-12 w-12 text-stone-300" />
          </div>
        )}
        <div className="absolute top-3 right-3 bg-stone-900/80 text-amber-400 rounded-full px-2 py-1 text-xs font-bold flex gap-1 items-center">
          <Star className="w-3 h-3 fill-amber-400" /> {Number(gh.rating ?? gh.averageRating ?? gh.average_rating ?? 0).toFixed(1)}
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
          {gh.city || "Ethiopia"}
        </div>
        <h3 className="font-bold text-stone-900 group-hover:text-amber-700 transition">{gh.name || "Unnamed Guesthouse"}</h3>
        <p className="text-xs text-stone-500 flex items-start gap-1.5 min-h-[32px]">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
          <span className="line-clamp-2">
            {locationParts.join(", ") || t('Location not specified')}
          </span>
        </p>
        <p className="text-xs text-stone-500 line-clamp-2 min-h-[32px]">
          {gh.description || "Administrator-approved guesthouse available for booking."}
        </p>
        {(gh.phone || gh.email) && (
          <div className="space-y-1 border-t border-stone-100 pt-3 text-[10px] text-stone-500">
            {gh.phone && (
              <p className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-amber-600" />
                <span className="truncate">{gh.phone}</span>
              </p>
            )}
            {gh.email && (
              <p className="flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-amber-600" />
                <span className="truncate">{gh.email}</span>
              </p>
            )}
          </div>
        )}
        {Array.isArray(gh.amenities) && gh.amenities.length > 0 && (
          <p className="truncate text-[10px] font-semibold text-stone-400">
            {gh.amenities.slice(0, 3).join(" | ")}
          </p>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-stone-100 gap-3">
          <div>
            <span className="text-[10px] text-stone-400 block">{t('Starting from')}</span>
            {displayPrice !== null ? (
              <>
                <span className="text-sm font-black text-stone-900">{displayPrice.toLocaleString()} ETB</span>
                <span className="text-[10px] text-stone-400 ml-1">/ {t('per night')}</span>
              </>
            ) : (
              <span className="text-xs font-bold text-stone-500">{t('View rooms')}</span>
            )}
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/guesthouse/${gh.id}`);
            }}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 rounded-xl text-xs font-bold flex items-center gap-1 transition"
          >
            {t('View & Book')} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function uniqueVerifiedGuesthouses(list = []) {
  const seen = new Set();
  return list.filter((guesthouse) => {
    if (!guesthouse) return false;
    const status = String(guesthouse.status || "").toUpperCase();
    if (status !== "APPROVED") return false;
    const key = guesthouse.id != null ? String(guesthouse.id) : `${String(guesthouse.name || "").trim().toLowerCase()}-${String(guesthouse.city || "").trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeSearchText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeCityKey(value) {
  return normalizeSearchText(value).replace(/[^a-z0-9]/g, "");
}

function canonicalizeCity(value) {
  const label = String(value || "").trim();
  const key = normalizeCityKey(label);

  if (!key || key === "allcities") {
    return key === "allcities" ? "All Cities" : "";
  }

  const aliases = {
    addisabba: "Addis Ababa",
    addisababa: "Addis Ababa",
    awassa: "Hawassa",
    hawassa: "Hawassa",
    dessie: "Dessie",
    desie: "Dessie",
  };

  return aliases[key] || label;
}

function getMinimumRoomPrice(guesthouse) {
  if (!guesthouse) return null;
  if (guesthouse.priceRange && guesthouse.priceRange.min != null) {
    const value = Number(guesthouse.priceRange.min);
    if (Number.isFinite(value)) return value;
  }
  if (Array.isArray(guesthouse.rooms) && guesthouse.rooms.length > 0) {
    const prices = guesthouse.rooms.map((room) => Number(room?.price ?? room?.pricePerNight)).filter((price) => Number.isFinite(price));
    if (prices.length > 0) return Math.min(...prices);
  }
  if (guesthouse.startingPrice != null) {
    const value = Number(guesthouse.startingPrice);
    if (Number.isFinite(value)) return value;
  }
  if (guesthouse.minPrice != null) {
    const value = Number(guesthouse.minPrice);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

export default PublicSearch;