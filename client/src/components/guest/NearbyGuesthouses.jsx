import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
} from "lucide-react";
import { ApiService } from "../../services/api.js";
import GuesthouseLocationMap from "../common/GuesthouseLocationMap.jsx";

const RADII_KM = [1, 5, 10, 25, 50];

function geolocationErrorMessage(error) {
  if (error.code === 1) {
    return "Location permission was denied. Allow location access in your browser, or search by city or place.";
  }
  if (error.code === 2) {
    return "Your current location is unavailable. Try again or search by city or place.";
  }
  if (error.code === 3) {
    return "Finding your location timed out. Try again or search by city or place.";
  }
  return "Could not determine your location. Try again or search by city or place.";
}

export function GuesthouseNearbyPanel({ onSelectGuesthouse }) {
  const navigate = useNavigate();
  const [radiusKm, setRadiusKm] = useState(5);
  const [place, setPlace] = useState("");
  const [position, setPosition] = useState(null);
  const [guesthouses, setGuesthouses] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mapMarkers = useMemo(
    () =>
      guesthouses.filter(
        (guesthouse) =>
          guesthouse.latitude !== null &&
          guesthouse.latitude !== undefined &&
          guesthouse.longitude !== null &&
          guesthouse.longitude !== undefined &&
          Number.isFinite(Number(guesthouse.latitude)) &&
          Number.isFinite(Number(guesthouse.longitude)) &&
          Number(guesthouse.latitude) >= -90 &&
          Number(guesthouse.latitude) <= 90 &&
          Number(guesthouse.longitude) >= -180 &&
          Number(guesthouse.longitude) <= 180
      ),
    [guesthouses]
  );

  const search = async (criteria) => {
    setLoading(true);
    setError("");
    try {
      const results = await ApiService.getNearbyGuesthouses(criteria);
      setGuesthouses(results);
      setSearched(true);
    } catch (searchError) {
      setError(searchError.message || "Nearby guesthouses could not be loaded.");
      setGuesthouses([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const findNearby = () => {
    if (!navigator.geolocation) {
      setError(
        "This browser does not support location access. Search by city or place instead."
      );
      return;
    }

    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const currentPosition = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
        setPosition(currentPosition);
        setPlace("");
        search({ ...currentPosition, radiusKm });
      },
      (geolocationError) => {
        setLoading(false);
        setError(geolocationErrorMessage(geolocationError));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const searchByPlace = (event) => {
    event.preventDefault();
    const location = place.trim();
    if (!location) {
      setError("Enter a city or place to search.");
      return;
    }
    setPosition(null);
    search({ place: location });
  };

  const openGuesthouse = (guesthouse) => {
    if (onSelectGuesthouse) {
      onSelectGuesthouse(guesthouse);
    } else {
      navigate(`/guesthouses/${guesthouse.id}`);
    }
  };

  const center = position
    ? position
    : mapMarkers[0]
      ? {
          latitude: mapMarkers[0].latitude,
          longitude: mapMarkers[0].longitude,
        }
      : undefined;
  const mapZoom = !position
    ? 13
    : radiusKm === 1
      ? 13
      : radiusKm === 5
        ? 11
        : radiusKm === 10
          ? 10
          : radiusKm === 25
            ? 9
            : 8;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-700">
            <MapPin className="h-4 w-4" />
            Location search
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#043658]">
            Find Nearby Guesthouses
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Search real, administrator-approved stays by distance or place.
            Your location is only requested when you choose to use GPS.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            Within
            <select
              aria-label="Search radius in kilometers"
              value={radiusKm}
              onChange={(event) => {
                const selectedRadius = Number(event.target.value);
                setRadiusKm(selectedRadius);
                if (position) {
                  search({ ...position, radiusKm: selectedRadius });
                }
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2"
            >
              {RADII_KM.map((radius) => (
                <option key={radius} value={radius}>
                  {radius} km
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={findNearby}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#043658] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0b2f4a] disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            )}
            Use my location
          </button>
        </div>
      </div>

      <form
        onSubmit={searchByPlace}
        className="mt-4 flex flex-col gap-2 sm:flex-row"
      >
        <label className="sr-only" htmlFor="nearby-place">
          Search by city or place
        </label>
        <input
          id="nearby-place"
          value={place}
          onChange={(event) => setPlace(event.target.value)}
          placeholder="Search by city, neighborhood, or place"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-[#043658] hover:bg-amber-400 disabled:opacity-60"
        >
          <Search className="h-4 w-4" />
          Search place
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {loading && (
        <div role="status" className="mt-5 flex items-center gap-2 text-sm text-slate-600">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Searching approved guesthouses…
        </div>
      )}

      {searched && !loading && guesthouses.length === 0 && (
        <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          No approved guesthouses matched this search. Try a larger radius or a
          different city or place.
        </p>
      )}

      {searched && guesthouses.length > 0 && (
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <GuesthouseLocationMap
            markers={mapMarkers}
            center={center}
            radiusKm={position ? radiusKm : undefined}
            height="min(62vh, 520px)"
            zoom={mapZoom}
          />
          <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {guesthouses.map((guesthouse) => (
              <article
                key={guesthouse.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-[#043658]">
                      {guesthouse.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {[guesthouse.address, guesthouse.city]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                  {guesthouse.distanceKm !== null &&
                    guesthouse.distanceKm !== undefined && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
                        {Number(guesthouse.distanceKm).toFixed(1)} km
                      </span>
                    )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openGuesthouse(guesthouse)}
                    className="rounded-lg bg-[#043658] px-3 py-2 text-xs font-bold text-white hover:bg-[#0b2f4a]"
                  >
                    View guesthouse
                  </button>
                  {guesthouse.latitude !== null &&
                    guesthouse.latitude !== undefined &&
                    guesthouse.longitude !== null &&
                    guesthouse.longitude !== undefined &&
                    Number.isFinite(Number(guesthouse.latitude)) &&
                    Number.isFinite(Number(guesthouse.longitude)) &&
                    Number(guesthouse.latitude) >= -90 &&
                    Number(guesthouse.latitude) <= 90 &&
                    Number(guesthouse.longitude) >= -180 &&
                    Number(guesthouse.longitude) <= 180 && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${guesthouse.latitude},${guesthouse.longitude}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        Get directions
                      </a>
                    )}
                </div>
              </article>
            ))}
            {mapMarkers.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                These approved stays do not have saved map coordinates yet, so
                they cannot be pinned accurately.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default GuesthouseNearbyPanel;
