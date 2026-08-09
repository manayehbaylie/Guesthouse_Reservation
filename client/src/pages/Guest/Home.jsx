import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ApiService } from '../../services/api.js';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  Star,
  Building2,
  Sparkles,
  ArrowRight,
  Coffee,
  Wifi,
  Car,
  ChevronRight,
  SlidersHorizontal,
  CheckCircle2,
  Smartphone,
  CreditCard,
  Phone,
} from 'lucide-react';

export function Home() {
  const navigate = useNavigate();
  const [allGuesthouses, setAllGuesthouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick & Deep Search Controls State
  const [city, setCity] = useState('All Cities');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [checkIn, setCheckIn] = useState('2026-08-07');
  const [checkOut, setCheckOut] = useState('2026-08-10');
  const [maxPrice, setMaxPrice] = useState(15000);
  const [selectedAmenity, setSelectedAmenity] = useState('All');

  const CITIES = ['All Cities', 'Addis Ababa', 'Hawassa', 'Bishoftu', 'Bahir Dar', 'Lalibela'];
  const AMENITIES_LIST = ['All', 'Free Wi-Fi', 'Breakfast Included', 'Airport Shuttle', 'Lake View', 'Generator Backup', 'Hot Shower'];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const list = await ApiService.getGuesthouses({
          city: city === 'All Cities' ? '' : city,
          maxPrice: Number(maxPrice),
        });
        setAllGuesthouses(list.filter((g) => g.status === 'approved'));
      } catch (err) {
        console.error('Error loading guesthouses:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [city, maxPrice]);

  // Client-side search filtering for instant live feedback
  const filteredGuesthouses = allGuesthouses.filter((gh) => {
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      const matchName = gh.name.toLowerCase().includes(q);
      const matchLoc = gh.location.toLowerCase().includes(q);
      const matchCity = gh.city.toLowerCase().includes(q);
      const matchDesc = gh.description.toLowerCase().includes(q);
      if (!matchName && !matchLoc && !matchCity && !matchDesc) return false;
    }

    if (selectedAmenity !== 'All') {
      if (!gh.amenities || !gh.amenities.includes(selectedAmenity)) return false;
    }

    return true;
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(
      `/search?city=${encodeURIComponent(city)}&q=${encodeURIComponent(
        searchKeyword
      )}&checkIn=${checkIn}&checkOut=${checkOut}&maxPrice=${maxPrice}&amenity=${encodeURIComponent(selectedAmenity)}`
    );
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-stone-900 via-stone-850 to-stone-900 text-stone-100 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden rounded-b-3xl shadow-xl">
        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Verified Local Payment Support: Telebirr & Chapa Direct Integration</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Discover & Book Verified Guesthouses Across Ethiopia
          </h1>

          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-stone-300 leading-relaxed">
            Directly reserve boutique guest rooms with real-time double-booking prevention and instant receipt generation via Telebirr, Chapa, or CBE Birr.
          </p>

          {/* Search Box Widget */}
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl text-stone-900 border border-stone-200 max-w-5xl mx-auto text-left space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search Keyword */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Location or Keyword
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-amber-600 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Bole, Atlas, Hawassa..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50/50"
                  />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  City
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-amber-600 absolute left-3 top-3" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50/50"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Check In Date */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Check-In Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-amber-600 absolute left-3 top-3" />
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50/50"
                  />
                </div>
              </div>

              {/* Check Out Date */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Check-Out Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-amber-600 absolute left-3 top-3" />
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50/50"
                  />
                </div>
              </div>
            </div>

            {/* Quick Filter Controls */}
            <div className="pt-3 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
              <div className="flex items-center gap-4 flex-1 max-w-xs">
                <span className="text-stone-500 text-[11px]">Max Price: <strong className="text-amber-700">{maxPrice.toLocaleString()} ETB</strong></span>
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

              <div className="flex items-center gap-2">
                <span className="text-stone-500 text-[11px]">Amenity:</span>
                <select
                  value={selectedAmenity}
                  onChange={(e) => setSelectedAmenity(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-stone-50 font-semibold"
                >
                  {AMENITIES_LIST.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Find Guesthouses ({filteredGuesthouses.length})</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Live Available Guesthouses Catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">Verified Guesthouses ({filteredGuesthouses.length})</h2>
            <p className="text-xs text-stone-500">Instant room locking with reception sync and local payment options</p>
          </div>
          <Link
            to="/search"
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 group"
          >
            <span>Open Advanced Filter Search</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-3xl bg-stone-200 animate-pulse"></div>
            ))}
          </div>
        ) : filteredGuesthouses.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3">
            <Building2 className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="text-base font-bold text-stone-800">No Matching Guesthouses</h3>
            <p className="text-xs text-stone-500">Try adjusting your keyword or city filter above.</p>
            <button
              onClick={() => {
                setCity('All Cities');
                setSearchKeyword('');
                setMaxPrice(15000);
                setSelectedAmenity('All');
              }}
              className="px-4 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredGuesthouses.map((gh) => (
              <div
                key={gh.id}
                onClick={() => navigate(`/guesthouse/${gh.id}`)}
                className="group bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 overflow-hidden bg-stone-100">
                    <img
                      src={gh.images[0]}
                      alt={gh.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-stone-900/80 backdrop-blur-md text-amber-400 text-xs font-bold flex items-center gap-1 shadow-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{gh.rating}</span>
                    </div>
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-stone-900/80 text-stone-100 text-[11px] font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span>{gh.city}</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">{gh.location}</div>
                    <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                      {gh.name}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-2">{gh.description}</p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {gh.amenities?.slice(0, 3).map((am) => (
                        <span key={am} className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 text-[10px] font-semibold">
                          {am}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-stone-100 mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Starting from</span>
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
            ))}
          </div>
        )}
      </section>

      {/* Feature Guarantee & System Capabilities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-stone-900 text-stone-100 rounded-3xl p-8 sm:p-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Double-Booking Prevention</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Real-time room calendar locking prevents room overbooking automatically during checkout.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Local Ethiopian Payment Gateways</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Direct integration with Telebirr and Chapa API gateways for instant ETB digital payments and mobile receipts.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Reception Desk Operational Sync</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Reservations automatically sync to property front-desk reception consoles for one-click guest check-in.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
