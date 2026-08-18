import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ApiService } from '../../services/api.js';
import {
  Search,
  MapPin,
  Calendar,
  Filter,
  Star,
  Coffee,
  Wifi,
  Car,
  ChevronRight,
  Building2,
  SlidersHorizontal,
  Check,
  ShieldCheck,
  ArrowUpDown
} from 'lucide-react';

export function GuesthouseSearch() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [guesthouses, setGuesthouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('q') || '');
  const [city, setCity] = useState(searchParams.get('city') || 'All Cities');
  const [maxPrice, setMaxPrice] = useState(10000);
  const [selectedAmenity, setSelectedAmenity] = useState('All');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('recommended'); // 'recommended', 'price_asc', 'price_desc', 'rating'

  const CITIES = ['All Cities', 'Addis Ababa', 'Hawassa', 'Bishoftu', 'Bahir Dar', 'Lalibela'];
  const AMENITIES_FILTER = ['All', 'Free Wi-Fi', 'Breakfast Included', 'Airport Shuttle', 'Lake View', 'Generator Backup', 'Hot Shower'];

  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);
      try {
        const list = await ApiService.getGuesthouses({
          city: city === 'All Cities' ? '' : city,
          maxPrice: Number(maxPrice),
        });
        setGuesthouses(list);
      } catch (err) {
        console.error('Failed to load properties:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, [city, maxPrice]);

  // Client-side filtering & sorting
  const filteredGuesthouses = guesthouses
    .filter((gh) => {
      // Keyword match
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const matchesName = gh.name.toLowerCase().includes(q);
        const matchesLoc = gh.location.toLowerCase().includes(q);
        const matchesDesc = gh.description.toLowerCase().includes(q);
        if (!matchesName && !matchesLoc && !matchesDesc) return false;
      }

      // Amenity match
      if (selectedAmenity !== 'All') {
        if (!gh.amenities || !gh.amenities.includes(selectedAmenity)) return false;
      }

      // Min rating match
      if (minRating > 0 && gh.rating < minRating) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') {
        return (a.priceRange?.min || 1500) - (b.priceRange?.min || 1500);
      }
      if (sortBy === 'price_desc') {
        return (b.priceRange?.min || 1500) - (a.priceRange?.min || 1500);
      }
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      return 0; // default recommended
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-stone-900 text-stone-100 p-8 rounded-3xl border border-stone-800 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Guesthouses Platform</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Find Your Ideal Guesthouse
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
            Directly reserve verified rooms with instant double-booking protection and seamless local payment integration (Telebirr, Chapa, CBE Birr).
          </p>
        </div>
      </div>

      {/* Main Search Controls */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-6">
        {/* Search Input Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="md:col-span-2 relative">
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Location or Keyword Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="e.g. Bole, Lakeview, Atlas, Babogaya..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 bg-stone-50/50"
              />
            </div>
          </div>

          {/* City Selector */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              City
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Sort Results
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-stone-50/50 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
            >
              <option value="recommended">Recommended</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated ★</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Bar */}
        <div className="pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center text-xs font-semibold">
          {/* Price Range Slider */}
          <div>
            <div className="flex justify-between text-stone-600 mb-1">
              <span>Max Price Per Night:</span>
              <strong className="text-amber-700 font-bold">{maxPrice.toLocaleString()} ETB</strong>
            </div>
            <input
              type="range"
              min="1000"
              max="15000"
              step="500"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Amenities Selector */}
          <div>
            <label className="block text-stone-600 mb-1">Required Amenity</label>
            <select
              value={selectedAmenity}
              onChange={(e) => setSelectedAmenity(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-semibold focus:ring-2 focus:ring-amber-500"
            >
              {AMENITIES_FILTER.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Minimum Rating Buttons */}
          <div>
            <label className="block text-stone-600 mb-1">Minimum Rating</label>
            <div className="flex gap-1.5">
              {[0, 4.5, 4.8].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    minRating === r
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {r === 0 ? 'All Ratings' : `${r}★+`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-stone-500 px-1">
        <div>
          Showing <span className="font-bold text-stone-900">{filteredGuesthouses.length}</span> properties
          {city !== 'All Cities' && <span> in <strong className="text-stone-800">{city}</strong></span>}
        </div>

        {(searchKeyword || city !== 'All Cities' || selectedAmenity !== 'All' || minRating > 0) && (
          <button
            onClick={() => {
              setSearchKeyword('');
              setCity('All Cities');
              setMaxPrice(15000);
              setSelectedAmenity('All');
              setMinRating(0);
              setSortBy('recommended');
            }}
            className="text-amber-700 hover:underline font-bold"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Property Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-80 bg-stone-200 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredGuesthouses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 space-y-4">
          <Building2 className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">No Guesthouses Found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            We couldn't find any properties matching your current filters. Try expanding your search location or price limit.
          </p>
          <button
            onClick={() => {
              setSearchKeyword('');
              setCity('All Cities');
              setMaxPrice(15000);
              setSelectedAmenity('All');
              setMinRating(0);
            }}
            className="px-5 py-2.5 bg-amber-500 text-stone-950 rounded-xl font-bold text-xs shadow-xs"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuesthouses.map((gh) => (
            <div
              key={gh.id}
              onClick={() => navigate(`/guesthouse/${gh.id}`)}
              className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col group"
            >
              <div className="relative h-52 bg-stone-100 overflow-hidden">
                <img
                  src={gh.images[0]}
                  alt={gh.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-stone-900/80 text-amber-400 text-xs font-bold flex items-center gap-1 backdrop-blur-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{gh.rating}</span>
                  <span className="text-stone-400 text-[10px]">({gh.reviewCount || 10})</span>
                </div>
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-stone-900/80 text-stone-100 text-[11px] font-semibold flex items-center gap-1 backdrop-blur-xs">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>{gh.city}</span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="text-[10px] font-bold uppercase text-amber-700 tracking-wider mb-1">
                    {gh.location}
                  </div>
                  <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                    {gh.name}
                  </h3>
                  <p className="text-xs text-stone-500 line-clamp-2 mt-1">{gh.description}</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {gh.amenities?.slice(0, 3).map((am) => (
                    <span key={am} className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-semibold">
                      {am}
                    </span>
                  ))}
                  {gh.amenities && gh.amenities.length > 3 && (
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-400 text-[10px] font-medium">
                      +{gh.amenities.length - 3} more
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 block font-medium">Starting from</span>
                    <span className="text-sm font-black text-stone-900">
                      {gh.priceRange ? `${gh.priceRange.min.toLocaleString()} ETB` : '1,500 ETB'}
                      <span className="text-[10px] text-stone-400 font-normal"> / night</span>
                    </span>
                  </div>
                  <button className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-colors flex items-center gap-1 shadow-xs">
                    <span>View & Book</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
