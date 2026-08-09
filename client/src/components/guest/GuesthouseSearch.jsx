import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import { Search, MapPin, Calendar, Users, Star, Coffee, Wifi, Car, Shield, Sparkles, Filter, ChevronRight, Map, LayoutGrid, Navigation } from 'lucide-react';

export const GuesthouseSearch = ({ onSelectGuesthouse }) => {
  const [guesthouses, setGuesthouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Mode
  const [viewMode, setViewMode] = useState('grid');
  const [selectedMapProperty, setSelectedMapProperty] = useState(null);

  // Search Filters
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState('2026-08-06');
  const [checkOut, setCheckOut] = useState('2026-08-09');
  const [guests, setGuests] = useState(2);
  const [maxPrice, setMaxPrice] = useState(6000);
  const [selectedAmenity, setSelectedAmenity] = useState('All');

  const CITIES = ['All Cities', 'Addis Ababa', 'Hawassa', 'Bishoftu', 'Bahir Dar', 'Lalibela'];
  const AMENITIES_FILTER = ['All', 'Free Wi-Fi', 'Breakfast Included', 'Airport Shuttle', 'Lake View', 'Generator Backup'];

  const loadGuesthouses = async () => {
    setLoading(true);
    try {
      const filters = {
        city: city === 'All Cities' ? '' : city,
        checkIn,
        checkOut,
        guests,
        minPrice: 0,
        maxPrice,
        roomType: '',
        selectedAmenities: selectedAmenity === 'All' ? [] : [selectedAmenity],
      };
      
      const results = await ApiService.getGuesthouses(filters);
      // Only show approved guesthouses in public search per SRS 5.2
      setGuesthouses(results.filter((g) => g.status === 'approved'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuesthouses();
  }, [city, maxPrice, selectedAmenity]);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Hero Banner with Search Card */}
      <div className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 text-white py-12 px-4 sm:px-6 lg:px-8 rounded-3xl shadow-xl overflow-hidden border border-amber-900/30">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Verified Ethiopian Guesthouse Accommodation
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif text-amber-50 tracking-tight leading-tight">
            Find & Book Authentic Guesthouses Across Ethiopia
          </h1>
          <p className="text-stone-300 text-sm sm:text-base max-w-2xl mx-auto">
            Instant online booking with real-time room availability, automatic payment verification via Telebirr, Chapa, or Card, and instant digital vouchers.
          </p>
        </div>

        {/* Search Bar Inputs */}
        <div className="relative max-w-4xl mx-auto mt-8 bg-white/95 backdrop-blur-md p-4 sm:p-6 rounded-2xl shadow-2xl text-stone-900 border border-amber-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadGuesthouses();
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
          >
            {/* Location / City */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-700" /> Destination
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-600"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Check-In Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-700" /> Check-In
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            {/* Check-Out Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-700" /> Check-Out
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            {/* Search Submit */}
            <div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-amber-800 hover:bg-amber-900 text-white font-bold text-sm rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" /> Search Available Rooms
              </button>
            </div>
          </form>

          {/* Quick Filters */}
          <div className="mt-4 pt-4 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="font-semibold text-stone-500 uppercase tracking-wider text-[11px] flex items-center gap-1">
                <Filter className="w-3 h-3 text-amber-700" /> Amenity:
              </span>
              {AMENITIES_FILTER.map((am) => (
                <button
                  key={am}
                  onClick={() => setSelectedAmenity(am)}
                  className={`px-3 py-1 rounded-full font-medium transition-colors whitespace-nowrap ${
                    selectedAmenity === am
                      ? 'bg-amber-800 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {am}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-500">Max Price:</span>
              <span className="font-mono font-bold text-amber-900">{maxPrice.toLocaleString()} ETB</span>
              <input
                type="range"
                min="1000"
                max="8000"
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-24 accent-amber-800 cursor-pointer"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-stone-900">
            Available Guesthouses {city && city !== 'All Cities' ? `in ${city}` : ''}
          </h2>
          <p className="text-xs text-stone-500">
            Showing {guesthouses.length} approved property list{guesthouses.length !== 1 ? 's' : ''} with verified online booking.
          </p>
        </div>

        {/* Grid vs Map Mode Toggle */}
        <div className="flex bg-stone-200 p-1 rounded-xl text-xs font-bold w-fit">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'grid' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Grid View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              viewMode === 'map' ? 'bg-amber-800 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Map className="w-3.5 h-3.5" /> Interactive Map
          </button>
        </div>
      </div>

      {/* Interactive Map View */}
      {viewMode === 'map' && !loading && (
        <div className="bg-stone-900 rounded-3xl p-6 text-white border border-stone-800 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-stone-800 pb-4">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-bold text-amber-100 text-base">Ethiopia Regional Guesthouse Map</h3>
                <p className="text-xs text-stone-400">Click pins to inspect property cards and book instantly.</p>
              </div>
            </div>
            <span className="text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full">
              GPS Map Enabled
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Map Canvas Visualizer */}
            <div className="lg:col-span-2 relative h-[380px] bg-stone-950/80 rounded-2xl border border-stone-800 p-4 flex flex-col justify-between overflow-hidden">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px]"></div>
              
              <div className="relative z-10 flex justify-between text-[11px] text-stone-400 font-mono">
                <span>ETHIOPIA TERRITORY MAP</span>
                <span>ADDIS ABABA HUB & REGIONAL HUBS</span>
              </div>

              {/* Map Pin Locations */}
              <div className="relative z-10 my-auto h-64 w-full border border-stone-800/80 rounded-xl bg-stone-900/60 p-4 flex items-center justify-around">
                
                {guesthouses.map((gh) => {
                  const isSelected = selectedMapProperty?.id === gh.id;
                  return (
                    <div
                      key={gh.id}
                      onClick={() => setSelectedMapProperty(gh)}
                      className="group relative cursor-pointer flex flex-col items-center"
                    >
                      <div className={`p-2.5 rounded-full border shadow-lg transition-all transform hover:scale-110 ${
                        isSelected
                          ? 'bg-amber-500 text-stone-950 border-amber-300 ring-4 ring-amber-500/30 scale-110'
                          : 'bg-stone-800 text-amber-400 border-stone-700 hover:bg-amber-900 hover:text-white'
                      }`}>
                        <MapPin className="w-5 h-5" />
                      </div>

                      <span className="mt-1 text-[10px] font-bold font-mono bg-stone-900/90 text-amber-200 px-2 py-0.5 rounded border border-stone-700 whitespace-nowrap shadow-md">
                        {gh.city}
                      </span>
                    </div>
                  );
                })}

              </div>

              <div className="relative z-10 text-[11px] text-stone-400 flex items-center justify-between">
                <span>Select any pin above to view accommodation card</span>
                <span className="text-amber-400 font-mono font-semibold">
                  {selectedMapProperty ? `Selected: ${selectedMapProperty.name}` : 'Click pin'}
                </span>
              </div>
            </div>

            {/* Selected Property Preview Drawer */}
            <div className="bg-stone-800 p-5 rounded-2xl border border-stone-700 space-y-4">
              {selectedMapProperty ? (
                <>
                  <div className="h-36 rounded-xl overflow-hidden bg-stone-900">
                    <img
                      src={selectedMapProperty.images[0]}
                      alt={selectedMapProperty.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950 border border-amber-800/60 px-2 py-0.5 rounded">
                      {selectedMapProperty.city}
                    </span>
                    <h4 className="font-bold text-white text-lg mt-1">{selectedMapProperty.name}</h4>
                    <p className="text-xs text-stone-300 mt-1">{selectedMapProperty.location}</p>
                  </div>
                  <p className="text-xs text-stone-400 line-clamp-3">{selectedMapProperty.description}</p>
                  <button
                    onClick={() => onSelectGuesthouse(selectedMapProperty)}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    View Rooms & Book Online <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="py-12 text-center text-stone-400 space-y-2">
                  <MapPin className="w-8 h-8 text-amber-500 mx-auto opacity-80" />
                  <p className="text-xs font-semibold">Select any guesthouse pin on the map to preview accommodation details.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Guesthouses Grid */}
      {viewMode === 'grid' && (loading ? (
        <div className="text-center py-16 text-stone-500 space-y-3">
          <div className="w-8 h-8 border-4 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium">Checking real-time room availability...</p>
        </div>
      ) : guesthouses.length === 0 ? (
        <div className="bg-stone-50 rounded-2xl p-12 text-center border border-stone-200 space-y-3">
          <p className="text-stone-600 font-semibold text-base">No guesthouses matched your criteria.</p>
          <p className="text-xs text-stone-500">Try adjusting your price slider or location filter.</p>
          <button
            onClick={() => {
              setCity('');
              setMaxPrice(6000);
              setSelectedAmenity('All');
            }}
            className="px-4 py-2 bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-amber-900 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guesthouses.map((gh) => (
            <div
              key={gh.id}
              className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Image & Badge */}
                <div className="relative h-48 bg-stone-200 overflow-hidden">
                  <img
                    src={gh.images[0]}
                    alt={gh.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-md text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 border border-amber-400/20">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {gh.rating} ({gh.reviewCount} reviews)
                  </div>
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Shield className="w-3 h-3" /> System Verified
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                        {gh.city}
                      </span>
                      <h3 className="font-bold text-stone-900 text-lg leading-snug group-hover:text-amber-900 transition-colors">
                        {gh.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-stone-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    {gh.location}
                  </p>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {gh.description}
                  </p>

                  {/* Amenities Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {gh.amenities.slice(0, 4).map((am) => (
                      <span
                        key={am}
                        className="text-[10px] font-medium bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md border border-stone-200"
                      >
                        {am}
                      </span>
                    ))}
                    {gh.amenities.length > 4 && (
                      <span className="text-[10px] font-medium text-stone-400 px-1 py-0.5">
                        +{gh.amenities.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer / Book Trigger */}
              <div className="p-5 pt-0 mt-auto border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Starting From</span>
                  <span className="text-lg font-mono font-extrabold text-amber-900">
                    1,900 <span className="text-xs font-normal text-stone-500">ETB / night</span>
                  </span>
                </div>

                <button
                  onClick={() => onSelectGuesthouse(gh)}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                >
                  View Rooms & Book <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      ))}

    </div>
  );
};
