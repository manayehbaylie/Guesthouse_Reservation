import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api.js';
import {
  MapPin,
  Star,
  Users,
  Bed,
  CheckCircle2,
  Phone,
  Mail,
  ShieldCheck,
  ChevronLeft,
  Calendar,
} from 'lucide-react';

export function GuesthouseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [guesthouse, setGuesthouse] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const gh = await ApiService.getGuesthouseById(id);
        setGuesthouse(gh);
        if (gh) {
          const rmList = await ApiService.getRoomsForGuesthouse(gh.id);
          setRooms(rmList);
        }
      } catch (err) {
        console.error('Error fetching details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-96 bg-stone-200 animate-pulse rounded-3xl"></div>
      </div>
    );
  }

  if (!guesthouse) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-800">Guesthouse Not Found</h2>
        <button
          onClick={() => navigate('/search')}
          className="px-4 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs"
        >
          Back to Search
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-stone-900"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to listings</span>
      </button>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 text-[11px] font-bold uppercase tracking-wider">
              {guesthouse.city} Property
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{guesthouse.rating} ({guesthouse.reviewCount} reviews)</span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">{guesthouse.name}</h1>
          <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-stone-400" />
            <span>{guesthouse.location}, {guesthouse.city}</span>
          </p>
        </div>
      </div>

      {/* Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-80 sm:h-96 rounded-3xl overflow-hidden bg-stone-100 shadow-sm border border-stone-200">
          <img
            src={guesthouse.images[activeImageIndex] || guesthouse.images[0]}
            alt={guesthouse.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 h-80 sm:h-96">
          {guesthouse.images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImageIndex(idx)}
              className={`rounded-2xl overflow-hidden h-full border-2 transition-all ${
                activeImageIndex === idx ? 'border-amber-500 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Details & Amenities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-3">
            <h3 className="text-lg font-bold text-stone-900">About this Guesthouse</h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{guesthouse.description}</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-3">
            <h3 className="text-lg font-bold text-stone-900">Amenities & Services</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {guesthouse.amenities?.map((am) => (
                <div key={am} className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-xs font-semibold text-stone-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{am}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rooms Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-stone-900">Available Rooms</h2>
            {rooms.length === 0 ? (
              <p className="text-xs text-stone-500 bg-white p-6 rounded-2xl border border-stone-200">
                No rooms listed for this property yet.
              </p>
            ) : (
              <div className="space-y-4">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-stone-900">
                          Room {room.roomNumber} ({room.type})
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            room.availabilityStatus === 'available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {room.availabilityStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-stone-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-stone-400" /> Max Guests: {room.capacity}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5 text-stone-400" /> {room.type} Bed
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-100">
                      <div>
                        <div className="text-base font-black text-stone-900">
                          {room.pricePerNight.toLocaleString()} ETB
                        </div>
                        <div className="text-[10px] text-stone-400">per night</div>
                      </div>

                      <button
                        onClick={() => navigate(`/booking?guesthouseId=${guesthouse.id}&roomId=${room.id}`)}
                        disabled={room.availabilityStatus !== 'available'}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-xs ${
                          room.availabilityStatus === 'available'
                            ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                            : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        }`}
                      >
                        {room.availabilityStatus === 'available' ? 'Select & Book' : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="bg-stone-900 text-stone-100 p-6 rounded-3xl space-y-4 shadow-lg">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Verified Guarantee</span>
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              Bookings made on this platform include automated confirmation, zero double-booking risk, and instant digital receipt generation.
            </p>
            <div className="pt-3 border-t border-stone-800 space-y-2 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400" />
                <span>+251 91 100 2233</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" />
                <span>support@guesthouse.et</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
