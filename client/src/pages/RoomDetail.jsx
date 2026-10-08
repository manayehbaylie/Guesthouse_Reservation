import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Bed, Building2, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { ApiService } from '../services/api.js';
import { RoomDetailGallery } from '../components/RoomGallery.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { calculateCalendarNights } from '../utils/date.utils.js';

const getImageUrl = (image) => {
  if (!image || typeof image !== 'string') return '';
  const value = image.trim();
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  const configuredUrl = import.meta.env.VITE_API_URL || '';
  const apiUrl = /^https?:\/\//.test(configuredUrl)
    ? configuredUrl
    : 'http://localhost:5000/api';
  const cleanApiUrl = apiUrl.replace(/\/api\/?$/, '');
  return value.startsWith('/') ? `${cleanApiUrl}${value}` : `${cleanApiUrl}/${value}`;
};

const getCloudinaryImageUrl = (image, transformation) => {
  const imageUrl = getImageUrl(image);
  const uploadPath = '/image/upload/';
  const uploadIndex = imageUrl.indexOf(uploadPath);
  if (!/^https?:\/\/res\.cloudinary\.com\//i.test(imageUrl) || uploadIndex < 0) {
    return imageUrl;
  }
  const uploadEnd = uploadIndex + uploadPath.length;
  return `${imageUrl.slice(0, uploadEnd)}f_auto,q_auto,${transformation}/${imageUrl.slice(uploadEnd)}`;
};

const getRoomAvailability = (room) => {
  const status = String(room?.availabilityStatus || room?.status || '').toLowerCase();
  if (room?.available === false || ['unavailable', 'occupied', 'reserved', 'booked', 'cleaning', 'maintenance'].includes(status)) {
    return status === 'occupied' ? 'occupied' : 'unavailable';
  }
  return 'available';
};

export function RoomDetail() {
  const { guesthouseId, roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const [guesthouse, setGuesthouse] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkInDate, setCheckInDate] = useState(searchParams.get('checkIn') || '');
  const [checkOutDate, setCheckOutDate] = useState(searchParams.get('checkOut') || '');
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadRoom = async () => {
      setLoading(true);
      setGuesthouse(null);
      setRoom(null);
      try {
        const result = await ApiService.getGuesthouseById(Number(guesthouseId));
        if (!mounted) return;
        const foundRoom = (result?.rooms || []).find(
          (item) => String(item.id) === String(roomId)
        );
        setGuesthouse(result);
        setRoom(foundRoom || null);
      } catch (loadError) {
        console.error('Room details could not be loaded:', loadError);
        if (mounted) {
          setGuesthouse(null);
          setRoom(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (Number(guesthouseId) > 0 && Number(roomId) > 0) loadRoom();
    else setLoading(false);
    return () => {
      mounted = false;
    };
  }, [guesthouseId, roomId]);

  const roomImages = useMemo(() => (
    Array.isArray(room?.images)
      ? room.images
          .map((image, sourceIndex) => ({ ...image, sourceIndex }))
          .filter((image) => image.url)
          .sort((first, second) =>
            Number(first.sortOrder ?? first.sourceIndex) -
            Number(second.sortOrder ?? second.sourceIndex)
          )
      : []
  ), [room]);

  const roomNumber = room?.roomNumber || room?.number || room?.id;
  const roomType = room?.type || room?.roomType || 'ROOM';
  const roomPrice = Number(room?.pricePerNight ?? room?.price ?? room?.roomPrice ?? 0);
  const roomCapacity = Number(room?.maxGuests ?? room?.capacity ?? 4);
  const availability = room ? getRoomAvailability(room) : 'unavailable';
  const checkInMin = new Date().toISOString().slice(0, 10);

  const handleBookRoom = () => {
    if (!guesthouse || !room || availability !== 'available') return;
    if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
      setDateError(t('Select a check-in and check-out date before choosing a room.'));
      return;
    }
    if (!roomPrice || roomPrice <= 0) {
      setDateError(t('The price for this room is not available.'));
      return;
    }

    setDateError('');
    const nightsCount = calculateCalendarNights(checkInDate, checkOutDate);
    const bookingData = {
      guesthouseId: Number(guesthouse.id),
      roomId: Number(room.id),
      guesthouse,
      room,
      roomPrice,
      pricePerNight: roomPrice,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      checkInDate,
      checkOutDate,
      nights: nightsCount,
      nightsCount,
      amount: roomPrice * nightsCount,
      totalPrice: roomPrice * nightsCount,
      numberOfGuests: 1,
      paymentMethod: 'CARD',
      telebirrPhone: '',
      selectedBank: '',
      accountNumber: '',
    };
    const token = localStorage.getItem('token');
    const currentUser = ApiService.getCurrentUser();
    const returnUrl = `/booking?guesthouseId=${guesthouse.id}&roomId=${room.id}`;

    if (!token || !currentUser) {
      sessionStorage.setItem('pendingReservation', JSON.stringify(bookingData));
      navigate('/login', {
        state: {
          from: `/guesthouse/${guesthouse.id}`,
          bookingData,
          reservationData: bookingData,
          pendingReservation: true,
          returnTo: 'payment',
          returnUrl,
        },
      });
      return;
    }

    try {
      sessionStorage.setItem('selectedBooking', JSON.stringify(bookingData));
    } catch (storageError) {
      console.warn('Could not save selected booking:', storageError);
    }
    localStorage.setItem(`selectedGuesthouseId:${currentUser.id}`, String(guesthouse.id));
    navigate(`/guest/dashboard?guesthouseId=${guesthouse.id}`, {
      replace: true,
      state: { bookingData, showPayment: true },
    });
  };

  const backControl = location.state?.fromGuesthouse ? (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="inline-flex items-center gap-2 text-sm font-bold text-[#063e60] hover:text-amber-700"
    >
      <ArrowLeft className="h-4 w-4" />
      {t('Back to guesthouse')}
    </button>
  ) : (
    <Link
      to={`/guesthouses/${guesthouseId}`}
      className="inline-flex items-center gap-2 text-sm font-bold text-[#063e60] hover:text-amber-700"
    >
      <ArrowLeft className="h-4 w-4" />
      {t('Back to guesthouse')}
    </Link>
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <div className="h-6 w-44 animate-pulse rounded bg-stone-200" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
          <div className="aspect-[16/10] animate-pulse rounded-2xl bg-stone-200" />
          <div className="space-y-4 rounded-2xl border border-stone-200 p-6">
            <div className="h-7 w-2/3 animate-pulse rounded bg-stone-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-stone-200" />
            <div className="h-28 animate-pulse rounded bg-stone-100" />
            <div className="h-11 animate-pulse rounded-xl bg-stone-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!guesthouse || !room) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-3xl border border-stone-200 bg-white p-8">
          <Building2 className="mx-auto h-12 w-12 text-stone-300" />
          <h1 className="mt-4 text-2xl font-bold text-stone-900">{t('Room not found')}</h1>
          <p className="mt-2 text-sm text-stone-500">{t('This room could not be found at this guesthouse.')}</p>
          <Link
            to={`/guesthouses/${guesthouseId}`}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-amber-500 px-5 text-sm font-bold text-stone-950 hover:bg-amber-400"
          >
            {t('Back to guesthouse')}
          </Link>
        </div>
      </div>
    );
  }

  const city = guesthouse.city || guesthouse.location || guesthouse.address || '';

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5">{backControl}</div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
        <section className="min-w-0">
          {roomImages.length > 0 ? (
            <RoomDetailGallery
              images={roomImages}
              roomNumber={roomNumber}
              getImageUrl={getCloudinaryImageUrl}
            />
          ) : (
            <div className="flex aspect-[16/10] flex-col items-center justify-center gap-3 rounded-2xl bg-stone-100 text-stone-400">
              <Building2 className="h-10 w-10" />
              <span className="text-sm font-semibold">{t('No room photos available')}</span>
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-black text-[#063e60]">
              {`Room ${roomNumber} (${roomType})`}
            </h1>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
              availability === 'available'
                ? 'bg-emerald-100 text-emerald-700'
                : availability === 'occupied'
                  ? 'bg-stone-200 text-stone-700'
                  : 'bg-red-100 text-red-700'
            }`}>
              {t(availability === 'available' ? 'Available' : availability === 'occupied' ? 'Occupied' : 'Unavailable')}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-600">
            <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" />{t('Max')} {roomCapacity}</span>
            <span className="inline-flex items-center gap-2"><Bed className="h-4 w-4" />{roomType}</span>
          </div>

          <div className="mt-5 border-t border-stone-100 pt-4">
            <Link to={`/guesthouses/${guesthouse.id}`} className="font-bold text-[#063e60] hover:text-amber-700">
              {guesthouse.name}
            </Link>
            {city && <p className="mt-1 text-sm text-stone-500">{city}</p>}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-stone-600">
              {t('Check-in date')}
              <input
                type="date"
                min={checkInMin}
                value={checkInDate}
                onChange={(event) => {
                  setCheckInDate(event.target.value);
                  if (checkOutDate && checkOutDate <= event.target.value) setCheckOutDate('');
                  setDateError('');
                }}
                className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
              />
            </label>
            <label className="text-xs font-semibold text-stone-600">
              {t('Check-out date')}
              <input
                type="date"
                min={checkInDate
                  ? new Date(Date.parse(`${checkInDate}T00:00:00Z`) + 86400000).toISOString().slice(0, 10)
                  : checkInMin}
                value={checkOutDate}
                onChange={(event) => {
                  setCheckOutDate(event.target.value);
                  setDateError('');
                }}
                className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
              />
            </label>
          </div>

          {dateError && <p role="alert" className="mt-3 text-xs font-semibold text-red-700">{dateError}</p>}

          <div className="mt-5 flex items-end justify-between gap-4 border-t border-stone-100 pt-4">
            <div className="shrink-0">
              <b className="whitespace-nowrap text-lg text-stone-900">{roomPrice.toLocaleString()} ETB</b>
              <p className="text-[10px] text-stone-400">{t('per night')}</p>
            </div>
            <button
              type="button"
              onClick={handleBookRoom}
              disabled={availability !== 'available'}
              className="min-h-11 whitespace-nowrap rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500"
            >
              {t('Select & Book')}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}