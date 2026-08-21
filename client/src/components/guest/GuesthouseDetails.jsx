import React, { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../../services/api';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Star,
  CheckCircle,
  Users,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';

export const GuesthouseDetails = ({
  guesthouse,
  onBack,
  onBookRoom,
}) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(
    guesthouse.images?.[0] || ''
  );

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);

      const roomList = await ApiService.getRoomsForGuesthouse(
        guesthouse.id
      );

      setRooms(Array.isArray(roomList) ? roomList : []);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [guesthouse.id]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Refresh room availability whenever the guest returns to this page/tab.
  useEffect(() => {
    const handleFocus = () => {
      fetchRooms();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchRooms();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );
    };
  }, [fetchRooms]);

  return (
    <div className="space-y-8 pb-16">

      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-3.5 py-2 rounded-xl shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search Results
        </button>

        <span className="text-xs text-stone-500 font-mono">
          Property ID: {guesthouse.id}
        </span>
      </div>

      {/* Main Header */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm p-6 sm:p-8 space-y-6">

        {/* Title & Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
                {guesthouse.city}
              </span>

              <span className="flex items-center gap-1 text-xs font-bold text-amber-900">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {guesthouse.rating} ({guesthouse.reviewCount} Guest Ratings)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-stone-900">
              {guesthouse.name}
            </h1>

            <p className="text-xs sm:text-sm text-stone-500 flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-amber-800 shrink-0" />
              {guesthouse.address}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-medium text-stone-600">
            <div className="bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-amber-800" />
              <span>{guesthouse.phone}</span>
            </div>

            <div className="bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-amber-800" />
              <span>{guesthouse.email}</span>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 h-72 sm:h-96 rounded-2xl overflow-hidden bg-stone-100 shadow-inner">
            <img
              src={activeImage || guesthouse.images?.[0]}
              alt={guesthouse.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
          </div>

          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto">
            {(guesthouse.images || []).map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`relative h-20 sm:h-28 rounded-xl overflow-hidden border-2 transition-all shrink-0 md:shrink ${
                  activeImage === img
                    ? 'border-amber-700 ring-2 ring-amber-500/20'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`Gallery ${idx}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Description & Amenities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold font-serif text-stone-900">
              About {guesthouse.name}
            </h2>

            <p className="text-sm text-stone-700 leading-relaxed">
              {guesthouse.description}
            </p>

            <div className="pt-4 border-t border-stone-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
                Property Amenities
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(guesthouse.amenities || []).map((am) => (
                  <div
                    key={am}
                    className="flex items-center gap-2 text-xs font-medium text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{am}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Guarantee */}
          <div className="bg-amber-50/60 p-6 rounded-2xl border border-amber-200/80 space-y-4 h-fit">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-amber-800" />
              Automated Booking Protection
            </div>

            <ul className="text-xs text-amber-950 space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-800 mt-1.5 shrink-0" />
                <span>
                  <strong>No Double Booking:</strong> Rooms are automatically
                  locked in real-time upon verified payment.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-800 mt-1.5 shrink-0" />
                <span>
                  <strong>Accepted Payments:</strong> Telebirr, CBE,
                  Bank Transfer.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-800 mt-1.5 shrink-0" />
                <span>
                  <strong>Instant Confirmation:</strong> Your reservation
                  is confirmed after successful payment.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Rooms */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-serif text-stone-900">
              Available Accommodations & Rooms
            </h2>

            <p className="text-xs text-stone-500">
              Select a room to proceed with online booking and instant confirmation.
            </p>
          </div>

          <span className="text-xs font-mono font-semibold bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
            {rooms.length} Room Types
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-stone-500">
            Loading rooms...
          </div>
        ) : rooms.length === 0 ? (
          <div className="bg-stone-50 p-8 rounded-2xl text-center border text-stone-600 text-sm">
            No rooms have been listed for this property yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rooms.map((room) => {

              // Support both possible API formats.
              const isAvailable =
                room.available === true ||
                room.availabilityStatus === 'available';

              return (
                <div
                  key={room.id}
                  className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between ${
                    isAvailable
                      ? 'border-stone-200 hover:border-amber-700 shadow-sm hover:shadow-md'
                      : 'border-red-200 opacity-70 bg-stone-50/80'
                  }`}
                >
                  <div className="space-y-4">

                    {/* Room Header */}
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                            Room {room.roomNumber}
                          </span>

                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              isAvailable
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            {isAvailable
                              ? 'Available'
                              : 'Occupied'}
                          </span>
                        </div>

                        <h3 className="font-bold text-stone-900 text-lg mt-1">
                          {room.type}
                        </h3>
                      </div>

                      <div className="text-right">
                        <span className="text-xl font-mono font-extrabold text-amber-900">
                          {Number(
                            room.pricePerNight ?? room.price ?? 0
                          ).toLocaleString()}
                        </span>

                        <span className="block text-[10px] text-stone-500 font-normal">
                          ETB / night
                        </span>
                      </div>
                    </div>

                    {/* Room Image */}
                    {room.image && (
                      <div className="h-40 rounded-xl overflow-hidden bg-stone-100">
                        <img
                          src={room.image}
                          alt={room.type}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <p className="text-xs text-stone-600 leading-relaxed">
                      {room.description}
                    </p>

                    {/* Room Specs */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 border-t border-stone-100 pt-3">
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-stone-400" />
                        Up to {room.capacity} Guests
                      </span>

                      {room.amenities &&
                        room.amenities.map((ram) => (
                          <span
                            key={ram}
                            className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded"
                          >
                            {ram}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Book Button */}
                  <div className="pt-5 mt-4 border-t border-stone-100 flex justify-end">
                    <button
                      disabled={!isAvailable}
                      onClick={() => {
                        if (isAvailable) {
                          onBookRoom(guesthouse, room);
                        }
                      }}
                      className={`w-full sm:w-auto px-6 py-2.5 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 ${
                        isAvailable
                          ? 'bg-amber-800 hover:bg-amber-900 text-white cursor-pointer'
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />

                      {isAvailable
                        ? 'Book & Pay Online'
                        : 'Occupied / Unavailable'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};