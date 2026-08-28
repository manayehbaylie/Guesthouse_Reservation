import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';

export function GuesthouseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [guesthouse, setGuesthouse] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadGuesthouseData = async () => {
      try {
        setLoading(true);

        const gh = await ApiService.getGuesthouseById(id);

        if (
          !gh ||
          String(gh.status).toLowerCase() !== 'approved'
        ) {
          throw new Error('Guesthouse is not verified.');
        }

        if (!mounted) return;

        setGuesthouse(gh);

        const roomList =
          await ApiService.getRoomsForGuesthouse(gh.id);

        let reservationList = [];

        try {
          reservationList =
            await ApiService.getReservations({
              guesthouseId: gh.id,
            });
        } catch (reservationError) {
          console.warn(
            'Could not load reservations:',
            reservationError
          );
          reservationList = [];
        }

        if (!mounted) return;

        setRooms(
          Array.isArray(roomList)
            ? roomList
            : []
        );

        setReservations(
          Array.isArray(reservationList)
            ? reservationList
            : []
        );
      } catch (error) {
        console.error(
          'Failed to load guesthouse:',
          error
        );

        if (mounted) {
          setGuesthouse(null);
          setRooms([]);
          setReservations([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadGuesthouseData();

    return () => {
      mounted = false;
    };
  }, [id]);

  const getRoomStatus = (room) => {
    const roomId = String(room.id);

    const activeReservation =
      reservations.find((reservation) => {
        if (
          String(reservation.roomId) !== roomId
        ) {
          return false;
        }

        const status =
          String(
            reservation.status || ''
          ).toLowerCase();

        return [
          'pending',
          'confirmed',
          'checked_in',
        ].includes(status);
      });

    if (
      activeReservation &&
      String(
        activeReservation.status
      ).toLowerCase() === 'checked_in'
    ) {
      return 'occupied';
    }

    if (
      activeReservation &&
      String(
        activeReservation.status
      ).toLowerCase() === 'confirmed'
    ) {
      return 'unavailable';
    }

    if (
      activeReservation &&
      String(
        activeReservation.status
      ).toLowerCase() === 'pending'
    ) {
      return 'unavailable';
    }

    if (
      room.available === false ||
      String(
        room.availabilityStatus || ''
      ).toLowerCase() !== 'available'
    ) {
      return 'unavailable';
    }

    return 'available';
  };

  const handleBookRoom = (room) => {
    const status = getRoomStatus(room);

    if (status !== 'available') {
      return;
    }

    navigate(
      `/booking?guesthouseId=${guesthouse.id}&roomId=${room.id}`,
      {
        state: {
          bookingData: {
            guesthouseId: guesthouse.id,
            roomId: room.id,
            guesthouse: guesthouse,
            room: room,
          }
        },
      }
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-96 bg-stone-200 animate-pulse rounded-3xl" />
      </div>
    );
  }

  if (!guesthouse) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">
          Verified guesthouse not found
        </h2>
        <button
          onClick={() => navigate('/search')}
          className="mt-4 px-4 py-2 bg-amber-500 rounded-xl text-xs font-bold"
        >
          Back to Search
        </button>
      </div>
    );
  }

  const images =
    guesthouse.images?.length
      ? guesthouse.images
      : [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-stone-900"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to listings
      </button>

      {/* Guesthouse Header */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex gap-1">
            <ShieldCheck className="w-3 h-3" />
            Verified
          </span>
          <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            {Number(guesthouse.rating || 0).toFixed(1)}
          </span>
        </div>

        <h1 className="text-3xl font-black mt-2">
          {guesthouse.name}
        </h1>

        <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
          <MapPin className="w-3.5 h-3.5" />
          {guesthouse.address || guesthouse.location}
          {guesthouse.city ? `, ${guesthouse.city}` : ''}
        </p>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-80 sm:h-96 rounded-3xl overflow-hidden bg-stone-100">
          <img
            src={images[activeImageIndex]}
            alt={guesthouse.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 h-80 sm:h-96">
          {images.slice(0, 4).map((img, index) => (
            <button
              key={`${img}-${index}`}
              type="button"
              onClick={() => setActiveImageIndex(index)}
              className={`rounded-2xl overflow-hidden border-2 ${
                activeImageIndex === index
                  ? 'border-amber-500'
                  : 'border-transparent'
              }`}
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-6">

          {/* About */}
          <div className="bg-white p-6 rounded-3xl border space-y-3">
            <h3 className="text-lg font-bold">About this Guesthouse</h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {guesthouse.description ||
                'No description is available for this guesthouse.'}
            </p>
          </div>

          {/* Amenities */}
          <div className="bg-white p-6 rounded-3xl border space-y-3">
            <h3 className="text-lg font-bold">Amenities & Services</h3>
            {guesthouse.amenities?.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {guesthouse.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 text-xs font-semibold"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {amenity}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500">
                No amenities have been listed.
              </p>
            )}
          </div>

          {/* Rooms - No Reviews Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Rooms</h2>
                <p className="text-xs text-stone-500 mt-1">
                  Room availability is updated from the reservation system.
                </p>
              </div>
            </div>

            {rooms.length === 0 ? (
              <p className="text-xs text-stone-500 bg-white p-6 rounded-2xl border">
                No rooms have been registered for this guesthouse.
              </p>
            ) : (
              <div className="space-y-4">
                {rooms.map((room) => {
                  const status = getRoomStatus(room);
                  const isAvailable = status === 'available';
                  const isOccupied = status === 'occupied';
                  const isUnavailable = status === 'unavailable';

                  return (
                    <div
                      key={room.id}
                      className={`bg-white p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        !isAvailable ? 'bg-stone-50' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <b>Room {room.roomNumber} ({room.type})</b>
                          {isAvailable && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                              Available
                            </span>
                          )}
                          {isUnavailable && (
                            <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                              Unavailable
                            </span>
                          )}
                          {isOccupied && (
                            <span className="px-2.5 py-1 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold">
                              Occupied
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-stone-500 mt-2">
                          <span>
                            <Users className="inline w-3.5 h-3.5" /> Max {room.capacity}
                          </span>
                          <span>
                            <Bed className="inline w-3.5 h-3.5" /> {room.type}
                          </span>
                        </div>
                        {isUnavailable && (
                          <p className="text-[10px] text-red-600 mt-2 font-medium">
                            This room has already been booked and cannot be selected.
                          </p>
                        )}
                        {isOccupied && (
                          <p className="text-[10px] text-stone-600 mt-2 font-medium">
                            This room is currently occupied by a guest.
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <b className="text-base">
                            {Number(room.pricePerNight || 0).toLocaleString()} ETB
                          </b>
                          <div className="text-[10px] text-stone-400">per night</div>
                        </div>
                        {isAvailable && (
                          <button
                            type="button"
                            onClick={() => handleBookRoom(room)}
                            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors"
                          >
                            Select & Book
                          </button>
                        )}
                        {isUnavailable && (
                          <button
                            type="button"
                            disabled
                            className="px-4 py-2.5 rounded-xl bg-stone-200 text-stone-500 font-bold text-xs cursor-not-allowed"
                          >
                            Unavailable
                          </button>
                        )}
                        {isOccupied && (
                          <button
                            type="button"
                            disabled
                            className="px-4 py-2.5 rounded-xl bg-stone-300 text-stone-600 font-bold text-xs cursor-not-allowed"
                          >
                            Occupied
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside>
          <div className="bg-stone-900 text-stone-100 p-6 rounded-3xl space-y-4">
            <h3 className="font-bold flex gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              Verified Guarantee
            </h3>
            <p className="text-xs text-stone-300">
              Only administrator-approved properties appear in guest search. Room availability is checked before booking.
            </p>

            <div className="pt-3 border-t border-stone-800 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-stone-300">Available</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="text-stone-300">Unavailable / Booked</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-400" />
                <span className="text-stone-300">Occupied</span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800 space-y-2 text-xs text-stone-400">
              <div>
                <Phone className="inline w-4 h-4 text-amber-400 mr-2" />
                {guesthouse.phone || '+251 91 100 2233'}
              </div>
              <div>
                <Mail className="inline w-4 h-4 text-amber-400 mr-2" />
                {guesthouse.email || 'support@guesthouse.et'}
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}

export default GuesthouseDetail;