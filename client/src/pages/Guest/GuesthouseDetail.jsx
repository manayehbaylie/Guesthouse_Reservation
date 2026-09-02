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
  Wifi,
  Coffee,
  Car,
  Bath,
  Tv,
  Utensils,
  Wind,
  Maximize,
  Mountain,
  Lock,
  Calendar,
  Image,
  ChevronRight,
  ChevronLeft as ChevronLeftIcon,
  Clock,
  CreditCard,
  Home,
  Sparkles,
} from 'lucide-react';

export function GuesthouseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [guesthouse, setGuesthouse] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  const [roomImageIndices, setRoomImageIndices] = useState({});

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

        // Initialize room image indices
        const initialIndices = {};
        roomList.forEach((room) => {
          initialIndices[room.id] = 0;
        });
        setRoomImageIndices(initialIndices);

        // Load reviews
        try {
          setReviewsLoading(true);
          const reviewList = await ApiService.getGuesthouseReviews(gh.id);
          if (mounted) {
            setReviews(reviewList || []);
          }
        } catch (reviewError) {
          console.warn('Could not load reviews:', reviewError);
          if (mounted) {
            setReviews([]);
          }
        } finally {
          if (mounted) {
            setReviewsLoading(false);
          }
        }

      } catch (error) {
        console.error(
          'Failed to load guesthouse:',
          error
        );

        if (mounted) {
          setGuesthouse(null);
          setRooms([]);
          setReservations([]);
          setReviews([]);
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

  const handleNextImage = (roomId, totalImages) => {
    setRoomImageIndices(prev => ({
      ...prev,
      [roomId]: (prev[roomId] + 1) % totalImages
    }));
  };

  const handlePrevImage = (roomId, totalImages) => {
    setRoomImageIndices(prev => ({
      ...prev,
      [roomId]: (prev[roomId] - 1 + totalImages) % totalImages
    }));
  };

  const handleSetImageIndex = (roomId, index) => {
    setRoomImageIndices(prev => ({
      ...prev,
      [roomId]: index
    }));
  };

  const renderStars = (rating, size = 'w-4 h-4') => {
    const stars = [];
    const roundedRating = Math.round(rating || 0);
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`${size} ${
            i <= roundedRating
              ? 'fill-amber-400 text-amber-400'
              : 'text-stone-200'
          }`}
        />
      );
    }
    
    return stars;
  };

  // 5 Professional hotel room images for each room type
  const getRoomImages = (roomType) => {
    const images = {
      'SINGLE': [
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
      ],
      'DOUBLE': [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80',
      ],
      'TWIN': [
        'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80',
      ],
      'FAMILY': [
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?auto=format&fit=crop&w=600&q=80',
      ],
      'SUITE': [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?auto=format&fit=crop&w=600&q=80',
      ],
      'STANDARD': [
        'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80',
      ],
      'DELUXE': [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?auto=format&fit=crop&w=600&q=80',
      ],
      'LUXURY': [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?auto=format&fit=crop&w=600&q=80',
      ],
    };
    return images[roomType?.toUpperCase()] || images['STANDARD'];
  };

  const getRoomAmenities = (roomType) => {
    const amenities = {
      'SINGLE': ['Free Wi-Fi', 'Air Conditioning', 'Smart TV', 'Private Bathroom', 'Work Desk'],
      'DOUBLE': ['Free Wi-Fi', 'Air Conditioning', 'Smart TV', 'Private Bathroom', 'Mini Bar', 'Coffee Maker'],
      'TWIN': ['Free Wi-Fi', 'Air Conditioning', 'Smart TV', 'Private Bathroom', 'Work Desk', 'Wardrobe'],
      'FAMILY': ['Free Wi-Fi', 'Air Conditioning', 'Smart TV', 'Private Bathroom', 'Kitchenette', 'Living Area', 'Dining Table'],
      'SUITE': ['Free Wi-Fi', 'Air Conditioning', 'Smart TV', 'Private Bathroom', 'Mini Bar', 'Living Room', 'Balcony', 'Bathtub'],
      'STANDARD': ['Free Wi-Fi', 'Air Conditioning', 'Smart TV', 'Private Bathroom'],
      'DELUXE': ['Free Wi-Fi', 'Air Conditioning', 'Smart TV', 'Private Bathroom', 'Mini Bar', 'Balcony', 'Bathtub'],
      'LUXURY': ['Free Wi-Fi', 'Air Conditioning', 'Smart TV', 'Private Bathroom', 'Mini Bar', 'Living Room', 'Balcony', 'Bathtub', 'Jacuzzi'],
    };
    return amenities[roomType?.toUpperCase()] || amenities['STANDARD'];
  };

  const getStatusBadge = (status) => {
    if (status === 'available') {
      return { text: 'Available', color: 'bg-emerald-500' };
    } else if (status === 'occupied') {
      return { text: 'Occupied', color: 'bg-stone-500' };
    } else {
      return { text: 'Unavailable', color: 'bg-red-500' };
    }
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
          <span className="text-xs text-stone-400">
            ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
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

      {/* Main Content - Full width */}
      <div className="space-y-6">

        {/* About Section */}
        <div className="bg-white p-6 rounded-3xl border space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold">About this Guesthouse</h3>
          </div>
          
          <div className="space-y-3 text-sm text-stone-600 leading-relaxed">
            <p>
              {guesthouse.description || 'No description is available for this guesthouse.'}
            </p>
            
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-stone-100">
              {guesthouse.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Location</p>
                    <p className="text-xs text-stone-700">{guesthouse.address}</p>
                  </div>
                </div>
              )}
              {guesthouse.city && (
                <div className="flex items-start gap-2">
                  <Home className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-wider">City</p>
                    <p className="text-xs text-stone-700">{guesthouse.city}</p>
                  </div>
                </div>
              )}
              {guesthouse.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Phone</p>
                    <p className="text-xs text-stone-700">{guesthouse.phone}</p>
                  </div>
                </div>
              )}
              {guesthouse.email && (
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Email</p>
                    <p className="text-xs text-stone-700">{guesthouse.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================
            ROOMS SECTION - GRID LAYOUT (SIDE BY SIDE)
            ========================================================= */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Rooms</h2>
            <p className="text-xs text-stone-500 mt-1">
              Select your preferred room and book your stay.
            </p>
          </div>

          {rooms.length === 0 ? (
            <p className="text-xs text-stone-500 bg-white p-6 rounded-2xl border">
              No rooms have been registered for this guesthouse.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => {
                const status = getRoomStatus(room);
                const isAvailable = status === 'available';
                const roomImages = getRoomImages(room.type);
                const roomAmenities = getRoomAmenities(room.type);
                const statusBadge = getStatusBadge(status);
                const currentImageIndex = roomImageIndices[room.id] || 0;

                return (
                  <div
                    key={room.id}
                    className={`bg-white rounded-2xl border overflow-hidden transition ${
                      isAvailable ? 'hover:shadow-xl hover:-translate-y-1' : 'opacity-75'
                    } duration-300 flex flex-col`}
                  >
                    {/* Image */}
                    <div className="relative w-full bg-stone-100 h-[220px]">
                      <img
                        src={roomImages[currentImageIndex]}
                        alt={`Room ${room.roomNumber} - ${room.type}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {roomImages.length > 1 && (
                        <>
                          <button
                            onClick={() => handlePrevImage(room.id, roomImages.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition text-xs"
                          >
                            <ChevronLeftIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleNextImage(room.id, roomImages.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition text-xs"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {roomImages.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {roomImages.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSetImageIndex(room.id, idx)}
                              className={`w-1.5 h-1.5 rounded-full transition ${
                                idx === currentImageIndex
                                  ? 'bg-white'
                                  : 'bg-white/50 hover:bg-white/70'
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      <div className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-white text-[9px] font-bold ${statusBadge.color}`}>
                        {statusBadge.text}
                      </div>

                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-white text-[10px] font-bold">
                        <Bed className="w-3 h-3" />
                        <span>{room.type}</span>
                      </div>

                      {roomImages.length > 1 && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[9px] font-bold">
                          {currentImageIndex + 1}/{roomImages.length}
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-black text-stone-900">
                            Room {room.roomNumber}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {room.capacity}
                            </span>
                            <span className="flex items-center gap-1">
                              <Maximize className="w-3 h-3" />
                              {room.type}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-black text-amber-600">
                            {Number(room.pricePerNight || 0).toLocaleString()} ETB
                          </p>
                          <p className="text-[9px] text-stone-400">/ night</p>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {roomAmenities.slice(0, 4).map((amenity, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 rounded-lg bg-stone-100 text-stone-500 text-[9px] font-medium flex items-center gap-0.5"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                            {amenity}
                          </span>
                        ))}
                        {roomAmenities.length > 4 && (
                          <span className="px-2 py-0.5 rounded-lg bg-stone-100 text-stone-400 text-[9px] font-medium">
                            +{roomAmenities.length - 4} more
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-xs text-stone-500 leading-relaxed line-clamp-2 flex-1">
                        {room.description || `A comfortable ${room.type} room.`}
                      </p>

                      {!isAvailable && (
                        <p className="text-[9px] text-red-500 mt-1.5 font-medium">
                          {status === 'occupied' ? 'Occupied' : 'Unavailable'}
                        </p>
                      )}

                      <div className="mt-3 pt-3 border-t border-stone-100">
                        {isAvailable ? (
                          <button
                            type="button"
                            onClick={() => handleBookRoom(room)}
                            className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors"
                          >
                            Select & Book
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="w-full py-2 rounded-xl bg-stone-200 text-stone-500 font-bold text-xs cursor-not-allowed"
                          >
                            {status === 'occupied' ? 'Occupied' : 'Unavailable'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GuesthouseDetail;