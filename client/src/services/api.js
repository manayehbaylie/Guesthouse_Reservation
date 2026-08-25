import axios from 'axios';

// ============================================================
// API CONFIGURATION
// ============================================================

const DEFAULT_API_URL =
  import.meta.env.VITE_API_BASE_URL || '/api';

const BACKEND_MODE_KEY = 'gh_backend_mode';
const API_URL_KEY = 'gh_api_url';
const CURRENT_USER_KEY = 'gh_current_user';
const TOKEN_KEY = 'token';

// ============================================================
// API URL / BACKEND MODE
// ============================================================

export function getBackendMode() {
  return (
    localStorage.getItem(BACKEND_MODE_KEY) || 'api'
  );
}

export function getApiUrl() {
  return (
    localStorage.getItem(API_URL_KEY) ||
    DEFAULT_API_URL
  );
}

export function setBackendMode(
  mode = 'api',
  apiUrl = DEFAULT_API_URL
) {
  localStorage.setItem(
    BACKEND_MODE_KEY,
    mode
  );

  localStorage.setItem(
    API_URL_KEY,
    apiUrl
  );

  api.defaults.baseURL = apiUrl;
}

// ============================================================
// AXIOS INSTANCE
// ============================================================

export const api = axios.create({
  baseURL: DEFAULT_API_URL,

  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) =>
    Promise.reject(error)
);

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Request failed';

    error.message = message;

    return Promise.reject(error);
  }
);

// ============================================================
// HELPERS
// ============================================================

function unwrap(response) {
  return (
    response?.data?.data ??
    response?.data
  );
}

// ============================================================
// ROLE HELPERS
// ============================================================

function normalizeRole(role) {
  if (!role) return 'GUEST';

  const normalized =
    String(role).toUpperCase();

  const validRoles = [
    'GUEST',
    'OWNER',
    'RECEPTIONIST',
    'ADMIN',
  ];

  return validRoles.includes(normalized)
    ? normalized
    : 'GUEST';
}

function mapRoleToBackend(role) {
  if (!role) return 'GUEST';

  const map = {
    Guest: 'GUEST',
    Owner: 'OWNER',
    Receptionist: 'RECEPTIONIST',
    Admin: 'ADMIN',
  };

  return (
    map[role] ||
    String(role).toUpperCase()
  );
}

// ============================================================
// USER MAPPING
// ============================================================

function mapUserFromBackend(user) {
  if (!user) return null;

  return {
    id: user.id,

    name:
      user.fullName ||
      user.name ||
      '',

    email:
      user.email || '',

    phone:
      user.phone || '',

    role:
      normalizeRole(user.role),

    guesthouseId:
      user.guesthouseId ?? null,

    createdAt:
      user.createdAt,
  };
}

// ============================================================
// GUESTHOUSE STATUS
// ============================================================

function mapGuesthouseStatus(status) {
  if (!status) return 'pending';

  return String(status).toLowerCase();
}

// ============================================================
// IMAGE HELPERS
// ============================================================

function normalizeImageUrl(image) {
  if (!image) {
    return '';
  }

  if (typeof image !== 'string') {
    return '';
  }

  const trimmed =
    image.trim();

  if (!trimmed) {
    return '';
  }

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return `/${trimmed}`;
}

function getGuesthouseImages(
  guesthouse
) {
  if (!guesthouse) {
    return [];
  }

  const result = [];

  const singleImage =
    normalizeImageUrl(
      guesthouse.image
    );

  if (singleImage) {
    result.push(singleImage);
  }

  if (
    Array.isArray(
      guesthouse.images
    )
  ) {
    guesthouse.images.forEach(
      (image) => {
        const normalized =
          normalizeImageUrl(image);

        if (
          normalized &&
          !result.includes(normalized)
        ) {
          result.push(normalized);
        }
      }
    );
  }

  if (
    Array.isArray(
      guesthouse.photos
    )
  ) {
    guesthouse.photos.forEach(
      (image) => {
        const normalized =
          normalizeImageUrl(image);

        if (
          normalized &&
          !result.includes(normalized)
        ) {
          result.push(normalized);
        }
      }
    );
  }

  const imageUrl =
    normalizeImageUrl(
      guesthouse.imageUrl
    );

  if (
    imageUrl &&
    !result.includes(imageUrl)
  ) {
    result.push(imageUrl);
  }

  return result;
}

// ============================================================
// GUESTHOUSE MAPPING
// ============================================================

function mapGuesthouseFromBackend(
  guesthouse,
  rooms = []
) {
  if (!guesthouse) {
    return null;
  }

  const guesthouseRooms =
    rooms.filter(
      (room) =>
        String(
          room.guesthouseId
        ) ===
        String(
          guesthouse.id
        )
    );

  const prices =
    guesthouseRooms
      .map((room) =>
        Number(
          room.pricePerNight ??
          room.price ??
          0
        )
      )
      .filter(
        (price) => price > 0
      );

  const minPrice =
    prices.length > 0
      ? Math.min(...prices)
      : 0;

  const maxPrice =
    prices.length > 0
      ? Math.max(...prices)
      : 0;

  const images =
    getGuesthouseImages(
      guesthouse
    );

  const image =
    images[0] || '';

  return {
    id:
      guesthouse.id,

    ownerId:
      guesthouse.ownerId,

    name:
      guesthouse.name || '',

    description:
      guesthouse.description || '',

    location:
      guesthouse.location ||
      guesthouse.address ||
      '',

    city:
      guesthouse.city || '',

    address:
      guesthouse.address ||
      guesthouse.location ||
      '',

    phone:
      guesthouse.phone || '',

    email:
      guesthouse.email || '',

    status:
      mapGuesthouseStatus(
        guesthouse.status
      ),

    image,

    images,

    amenities:
      Array.isArray(
        guesthouse.amenities
      )
        ? guesthouse.amenities
        : [],

    rating:
      Number(
        guesthouse.rating ?? 0
      ),

    reviewCount:
      Number(
        guesthouse.reviewCount ?? 0
      ),

    createdAt:
      guesthouse.createdAt,

    priceRange: {
      min: minPrice,
      max: maxPrice,
    },
  };
}

// ============================================================
// ROOM MAPPING
// ============================================================

function mapRoomFromBackend(room) {
  if (!room) return null;

  return {
    id:
      room.id,

    guesthouseId:
      room.guesthouseId,

    roomNumber:
      room.roomNumber,

    type:
      room.type ||
      room.roomType,

    capacity:
      room.capacity,

    pricePerNight:
      Number(
        room.pricePerNight ??
        room.price ??
        0
      ),

    availabilityStatus:
      room.availabilityStatus ??
      (
        room.available === false
          ? 'occupied'
          : 'available'
      ),
  };
}

// ============================================================
// RESERVATION MAPPING
// ============================================================

function mapReservationStatus(
  status
) {
  if (!status) return 'pending';

  return String(status).toLowerCase();
}

function mapReservationFromBackend(
  reservation
) {
  if (!reservation) return null;

  const room =
    reservation.room || {};

  const guesthouse =
    room.guesthouse ||
    reservation.guesthouse ||
    {};

  const guest =
    reservation.guest || {};

  const checkIn =
    reservation.checkInDate ||
    reservation.checkIn;

  const checkOut =
    reservation.checkOutDate ||
    reservation.checkOut;

  return {
    id:
      reservation.id,

    guesthouseId:
      reservation.guesthouseId ||
      guesthouse.id ||
      room.guesthouseId,

    guesthouseName:
      reservation.guesthouseName ||
      guesthouse.name ||
      '',

    guesthouseLocation:
      reservation.guesthouseLocation ||
      guesthouse.address ||
      guesthouse.location ||
      '',

    roomId:
      reservation.roomId ||
      room.id,

    roomNumber:
      reservation.roomNumber ||
      room.roomNumber ||
      '',

    roomType:
      reservation.roomType ||
      room.roomType ||
      room.type ||
      '',

    guestId:
      reservation.guestId ||
      guest.id,

    guestName:
      reservation.guestName ||
      guest.fullName ||
      guest.name ||
      '',

    guestPhone:
      reservation.guestPhone ||
      guest.phone ||
      '',

    checkInDate:
      checkIn
        ? String(checkIn).slice(0, 10)
        : '',

    checkOutDate:
      checkOut
        ? String(checkOut).slice(0, 10)
        : '',

    nightsCount:
      reservation.nightsCount ??
      calculateNights(
        checkIn,
        checkOut
      ),

    // Prefer an actual recorded payment amount (what the guest was really charged).
    // Fall back to room rate x nights (not just a single night) so multi-night
    // stays without a payment record yet still show an accurate total.
    totalPrice:
      Number(
        reservation.totalPrice ??
        reservation.payment?.amount ??
        (
          (room.price ?? 0) *
          Math.max(
            1,
            reservation.nightsCount ??
            calculateNights(checkIn, checkOut)
          )
        ) ??
        0
      ),

    paymentStatus:
      reservation.paymentStatus ||
      (
        reservation.payment?.status ===
        'PAID'
          ? 'paid'
          : 'pending'
      ),

    status:
      mapReservationStatus(
        reservation.status
      ),

    createdAt:
      reservation.createdAt,
  };
}

// ============================================================
// CALCULATE NIGHTS
// ============================================================

function calculateNights(
  checkIn,
  checkOut
) {
  if (!checkIn || !checkOut) {
    return 0;
  }

  const start =
    new Date(checkIn);

  const end =
    new Date(checkOut);

  const difference =
    end.getTime() -
    start.getTime();

  const nights =
    Math.ceil(
      difference /
        (1000 * 60 * 60 * 24)
    );

  return nights > 0
    ? nights
    : 0;
}

// ============================================================
// PAYMENT MAPPING
// ============================================================

function mapPaymentFromBackend(
  payment
) {
  if (!payment) return null;

  return {
    id:
      payment.id,

    reservationId:
      payment.reservationId,

    guesthouseId:
      payment.guesthouseId ||
      payment.reservation?.room
        ?.guesthouseId,

    guestName:
      payment.guestName ||
      payment.reservation?.guest
        ?.fullName ||
      '',

    amount:
      Number(
        payment.amount ?? 0
      ),

    method:
      String(
        payment.method ||
        payment.paymentMethod ||
        'telebirr'
      ).toLowerCase(),

    referenceNumber:
      payment.referenceNumber ||
      `REF-${payment.id}`,

    status:
      String(
        payment.status ||
        'completed'
      ).toLowerCase(),

    createdAt:
      payment.createdAt,
  };
}

function mapPaymentMethodToBackend(method) {
  const normalized =
    String(
      method || 'TELEBIRR'
    ).toUpperCase();

  if (
    normalized === 'CBE_BIRR' ||
    normalized === 'BANK' ||
    normalized === 'BANK_TRANSFER'
  ) {
    return 'BANK_TRANSFER';
  }

  if (normalized === 'CHAPA') {
    return 'CHAPA';
  }

  return 'TELEBIRR';
}

// ============================================================
// PHONE / DATE HELPERS
// ============================================================

function formatEthiopianPhone(phone) {
  if (!phone) return '';

  let cleaned = String(phone)
    .replace(/\s+/g, '')
    .replace(/-/g, '');

  // +251912345678
  if (/^\+2519\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  // 251912345678
  if (/^2519\d{8}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // 0912345678
  if (/^09\d{8}$/.test(cleaned)) {
    return `+251${cleaned.slice(1)}`;
  }

  // 912345678
  if (/^9\d{8}$/.test(cleaned)) {
    return `+251${cleaned}`;
  }

  return cleaned;
}

function toIsoDateTime(
  dateString
) {
  if (!dateString) {
    return new Date()
      .toISOString();
  }

  if (
    dateString.includes('T')
  ) {
    return dateString;
  }

  return `${dateString}T12:00:00.000Z`;
}

// ============================================================
// AUTH / CURRENT USER
// ============================================================

function getCurrentUser() {
  const raw =
    localStorage.getItem(
      CURRENT_USER_KEY
    );

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(
      CURRENT_USER_KEY
    );

    return null;
  }
}

function setCurrentUser(
  user,
  token = null
) {
  if (!user) {
    localStorage.removeItem(
      CURRENT_USER_KEY
    );

    localStorage.removeItem(
      TOKEN_KEY
    );

    return;
  }

  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(user)
  );

  if (token) {
    localStorage.setItem(
      TOKEN_KEY,
      token
    );
  }
}

function logoutUser() {
  localStorage.removeItem(
    CURRENT_USER_KEY
  );

  localStorage.removeItem(
    TOKEN_KEY
  );
}

// ============================================================
// HEALTH CHECK
// ============================================================

export async function checkBackendHealth() {
  try {
    const response =
      await api.get('/health');

    const data =
      response.data;

    return (
      data?.success === true ||
      data?.status === 'ok'
    );
  } catch {
    return false;
  }
}

// ============================================================
// API SERVICE
// ============================================================

export const ApiService = {

  // ----------------------------------------------------------
  // SETTINGS
  // ----------------------------------------------------------

  getBackendMode,

  setBackendMode,

  getApiUrl,


  // ----------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------

  getCurrentUser() {
    return getCurrentUser();
  },


  setCurrentUser(
    user,
    token
  ) {
    setCurrentUser(
      user,
      token
    );
  },


  logoutUser() {
    logoutUser();
  },

  
   // ==========================================================
  // UPDATE CURRENT ADMIN/USER PROFILE
  // ==========================================================

  async updateProfile(data) {
  if (!data) {
    throw new Error('Profile data is required.');
  }

  const currentUser = getCurrentUser();

  const role = String(
    currentUser?.role || ''
  ).toUpperCase();

  let endpoint = '/admin/profile';

  if (role === 'RECEPTIONIST') {
    endpoint = '/receptionist/profile';
  }

  const response = await api.put(
    endpoint,
    {
      fullName: data.name ?? '',
      email: data.email ?? '',
      phone: data.phone ?? '',
      ...(data.password?.trim()
        ? {
            password: data.password.trim(),
          }
        : {}),
    }
  );

  const updatedUser = mapUserFromBackend(
    unwrap(response)
  );

  if (!updatedUser) {
    throw new Error(
      'Profile update returned no user data.'
    );
  }

  setCurrentUser({
    ...(currentUser || {}),
    ...updatedUser,
  });

  return updatedUser;
},


  async loginUser(
    email,
    password
  ) {
    const response =
      await api.post(
        '/auth/login',
        {
          email,
          password,
        }
      );

    const payload =
      unwrap(response) || {};

    const user =
      mapUserFromBackend(
        payload.user
      );

    setCurrentUser(
      user,
      payload.token
    );

    return user;
  },

  async registerUser(
    payload
  ) {
    const role =
      mapRoleToBackend(
        payload.role || 'Guest'
      );

    const body = {
      fullName:
        payload.name,

      email:
        payload.email,

      phone:
        payload.phone,

      password:
        payload.password ||
        'password123',

      role,
    };

    if (role === 'OWNER') {
      body.guesthouseName =
        payload.guesthouseName;

      body.guesthouseAddress =
        payload.guesthouseAddress;

      body.city =
        payload.city;

      body.guesthouseDescription =
        payload.description;

      body.guesthouseImage =
        payload.guesthousePhotos?.[0] ||
        null;
    }

    const response =
      await api.post(
        '/auth/register',
        body
      );

    const result =
      unwrap(response) || {};

    if (
      result.requiresApproval ||
      !result.token
    ) {
      return {
        ...mapUserFromBackend(
          result.user
        ),

        requiresApproval:
          Boolean(
            result.requiresApproval
          ),

        message:
          result.message,

        guesthouse:
          result.guesthouse,
      };
    }

    const user =
      mapUserFromBackend({
        ...result.user,

        guesthouseId:
          payload.guesthouseId,
      });

    setCurrentUser(
      user,
      result.token
    );

    return user;
  },

  // ----------------------------------------------------------
  // USERS
  // ----------------------------------------------------------

  async getAllUsers() {
    const response =
      await api.get(
        '/admin/users'
      );

    const users =
      unwrap(response) || [];

    return users.map(
      mapUserFromBackend
    );
  },

  async fetchAdminUsers() {
    return this.getAllUsers();
  },

  // ----------------------------------------------------------
  // GUESTHOUSES
  // ----------------------------------------------------------

  async getGuesthouses(
    filters = {}
  ) {
    const response =
      await api.get(
        '/guesthouses',
        {
          params: filters,
        }
      );

    const guesthouses =
      unwrap(response) || [];

    let rooms = [];

    try {
      const roomsResponse =
        await api.get('/rooms');

      rooms =
        unwrap(
          roomsResponse
        ) || [];
    } catch {
      rooms = [];
    }

    let list =
      guesthouses
        .map(
          (guesthouse) =>
            mapGuesthouseFromBackend(
              guesthouse,
              rooms
            )
        )
        .filter(Boolean);

    if (filters.city) {
      list =
        list.filter(
          (guesthouse) =>
            guesthouse.city
              ?.toLowerCase() ===
            String(
              filters.city
            ).toLowerCase()
        );
    }

    if (filters.maxPrice) {
      list =
        list.filter(
          (guesthouse) =>
            guesthouse.priceRange
              .min <=
            Number(
              filters.maxPrice
            )
        );
    }

    return list;
  },

  async getGuesthouseById(
    id
  ) {
    const response =
      await api.get(
        `/guesthouses/${id}`
      );

    const guesthouse =
      unwrap(response);

    if (!guesthouse) {
      return null;
    }

    let rooms = [];

    try {
      const roomsResponse =
        await api.get('/rooms');

      rooms =
        unwrap(
          roomsResponse
        ) || [];
    } catch {
      rooms = [];
    }

    return mapGuesthouseFromBackend(
      guesthouse,
      rooms
    );
  },

  async registerGuesthouse(
    data
  ) {
    const images =
      Array.isArray(data.images)
        ? data.images
        : [];

    const image =
      images[0] ||
      data.image ||
      null;

    const response =
      await api.post(
        '/guesthouses',
        {
          name:
            data.name,

          address:
            data.location ||
            data.address,

          city:
            data.city,

          description:
            data.description,

          image,
        }
      );

    return mapGuesthouseFromBackend(
      unwrap(response)
    );
  },

  // ----------------------------------------------------------
  // ROOMS
  // ----------------------------------------------------------

  async getRoomsForGuesthouse(
    guesthouseId
  ) {
    const response =
      await api.get('/rooms');

    const rooms =
      unwrap(response) || [];

    return rooms
      .filter(
        (room) =>
          String(
            room.guesthouseId
          ) ===
          String(
            guesthouseId
          )
      )
      .map(
        mapRoomFromBackend
      );
  },

  async addRoom(
    roomData
  ) {
    const response =
      await api.post(
        `/rooms/${roomData.guesthouseId}`,
        {
          roomNumber:
            roomData.roomNumber,

          roomType:
            String(
              roomData.type ||
              'DOUBLE'
            ).toUpperCase(),

          price:
            Number(
              roomData.pricePerNight
            ),

          capacity:
            Number(
              roomData.capacity
            ),

          available:
            roomData.availabilityStatus !==
            'occupied',
        }
      );

    return mapRoomFromBackend(
      unwrap(response)
    );
  },

  async updateRoomAvailability(
    roomId,
    status
  ) {
    const response =
      await api.put(
        `/rooms/${roomId}`,
        {
          available:
            status === 'available',
        }
      );

    return mapRoomFromBackend(
      unwrap(response)
    );
  },

  async updateRoom(
    roomId,
    roomData
  ) {
    const payload = {};

    if (
      roomData.roomNumber !== undefined
    ) {
      payload.roomNumber =
        String(
          roomData.roomNumber
        );
    }

    if (
      roomData.roomType ||
      roomData.type
    ) {
      payload.roomType =
        String(
          roomData.roomType ||
          roomData.type
        ).toUpperCase();
    }

    if (
      roomData.price !== undefined ||
      roomData.pricePerNight !== undefined
    ) {
      payload.price =
        Number(
          roomData.price !== undefined
            ? roomData.price
            : roomData.pricePerNight
        );
    }

    if (
      roomData.capacity !== undefined
    ) {
      payload.capacity =
        Number(
          roomData.capacity
        );
    }

    if (
      roomData.available !== undefined
    ) {
      payload.available =
        Boolean(
          roomData.available
        );
    }

    if (
      roomData.availabilityStatus !==
      undefined
    ) {
      payload.available =
        roomData.availabilityStatus ===
        'available';
    }

    const response =
      await api.put(
        `/rooms/${roomId}`,
        payload
      );

    return mapRoomFromBackend(
      unwrap(response)
    );
  },

  async deleteRoom(
    roomId
  ) {
    const response =
      await api.delete(
        `/rooms/${roomId}`
      );

    return unwrap(response);
  },

  // ----------------------------------------------------------
  // RESERVATIONS
  // ----------------------------------------------------------

  async createBookingAndPay({
    guesthouseId,
    roomId,
    checkInDate,
    checkOutDate,
    nightsCount,
    paymentMethod,
    phone,
    bankName,
    accountNumber,
  }) {
    const reservationResponse =
      await api.post(
        '/reservations',
        {
          roomId:
            Number(roomId),

          checkIn:
            toIsoDateTime(
              checkInDate
            ),

          checkOut:
            toIsoDateTime(
              checkOutDate
            ),
        }
      );

    const reservation =
      unwrap(
        reservationResponse
      );

    if (!reservation?.id) {
      throw new Error(
        'Reservation was not created.'
      );
    }

    const roomResponse =
      await api.get(
        `/rooms/${roomId}`
      );

    const room =
      mapRoomFromBackend(
        unwrap(roomResponse)
      );

    const totalPrice =
      Number(
        room?.pricePerNight || 0
      ) *
      Number(
        nightsCount || 0
      );

  const backendPaymentMethod =
  mapPaymentMethodToBackend(paymentMethod);

const initiatePayload = {
  reservationId: reservation.id,

  method: backendPaymentMethod,

  phone: formatEthiopianPhone(phone),

  bankName:
    bankName || undefined,

  accountNumber:
    accountNumber || undefined,
};

    const paymentResponse =
      await api.post(
        '/payments/initiate',
        initiatePayload
      );

    const payment =
      mapPaymentFromBackend(
        unwrap(paymentResponse)
      );

    const guesthouse =
      await this.getGuesthouseById(
        guesthouseId
      );

    const currentUser =
      getCurrentUser();

    return {
      reservation:
        mapReservationFromBackend({
          ...reservation,

          guesthouseId,

          guesthouseName:
            guesthouse?.name || '',

          guesthouseLocation:
            guesthouse?.location || '',

          roomNumber:
            room?.roomNumber || '',

          roomType:
            room?.type || '',

          guestName:
            currentUser?.name || '',

          guestPhone:
            phone || '',

          nightsCount,

          totalPrice,

          paymentStatus:
            payment?.status ||
            'pending',

          status:
            reservation.status ||
            'pending',
        }),

      payment,
    };
  },

  async getReservations(
    filters = {}
  ) {
    const response =
      await api.get(
        '/reservations'
      );

    let list =
      (
        unwrap(response) || []
      ).map(
        mapReservationFromBackend
      );

    if (filters.guestId) {
      list =
        list.filter(
          (reservation) =>
            String(
              reservation.guestId
            ) ===
            String(
              filters.guestId
            )
        );
    }

    if (filters.guesthouseId) {
      list =
        list.filter(
          (reservation) =>
            String(
              reservation.guesthouseId
            ) ===
            String(
              filters.guesthouseId
            )
        );
    }

    return list;
  },

  // ----------------------------------------------------------
  // RECEPTIONIST
  // ----------------------------------------------------------

  async getReceptionistDashboardStats() {
    // Hits the real server-computed stats endpoint (server/src/services/receptionist.service.js:getDashboardStats)
    // which returns { arrivals, departures, inHouse, availableRooms, totalRooms } straight from the database.
    const response =
      await api.get(
        '/receptionist/dashboard'
      );

    const stats = unwrap(response) || {};

    return {
      arrivals: stats.arrivals ?? 0,
      departures: stats.departures ?? 0,
      inHouse: stats.inHouse ?? 0,
      availableRooms: stats.availableRooms ?? 0,
      totalRooms: stats.totalRooms ?? 0,
    };
  },

  async searchReceptionistReservations(term) {
    const response =
      await api.get(
        `/receptionist/reservations/search?term=${encodeURIComponent(term ?? '')}`
      );

    return (
      unwrap(response) || []
    ).map(
      mapReservationFromBackend
    );
  },

  async getReceptionistArrivals(
    guesthouseId
  ) {
    const response =
      await api.get(
        '/receptionist/today-arrivals'
      );

    const list =
      (
        unwrap(response) || []
      ).map(
        mapReservationFromBackend
      );

    if (!guesthouseId) {
      return list;
    }

    return list.filter(
      (reservation) =>
        String(
          reservation.guesthouseId
        ) ===
        String(
          guesthouseId
        )
    );
  },

  async getReceptionistDepartures(
    guesthouseId
  ) {
    const response =
      await api.get(
        '/receptionist/today-departures'
      );

    const list =
      (
        unwrap(response) || []
      ).map(
        mapReservationFromBackend
      );

    if (!guesthouseId) {
      return list;
    }

    return list.filter(
      (reservation) =>
        String(
          reservation.guesthouseId
        ) ===
        String(
          guesthouseId
        )
    );
  },

  async getReceptionistInHouse() {
    const response =
      await api.get(
        '/receptionist/in-house'
      );

    return (
      unwrap(response) || []
    ).map(
      mapReservationFromBackend
    );
  },

  async getReceptionistReservations(
    guesthouseId
  ) {
    const response =
      await api.get(
        '/receptionist/reservations'
      );

    const list =
      (
        unwrap(response) || []
      ).map(
        mapReservationFromBackend
      );

    if (!guesthouseId) {
      return list;
    }

    return list.filter(
      (reservation) =>
        String(
          reservation.guesthouseId
        ) ===
        String(
          guesthouseId
        )
    );
  },

  async getReceptionistRooms() {
    const response =
      await api.get(
        '/receptionist/rooms'
      );

    return (
      unwrap(response) || []
    );
  },

  async updateReceptionistRoomAvailability(
    roomId,
    maintenanceStatus
  ) {
    const response =
      await api.patch(
        `/receptionist/rooms/${roomId}/availability`,
        {
          maintenanceStatus,
        }
      );

    return unwrap(response);
  },

  async performCheckIn(
    reservationId
  ) {
    const response =
      await api.patch(
        `/receptionist/reservations/${reservationId}/check-in`
      );

    return mapReservationFromBackend(
      unwrap(response)
    );
  },

  async checkInGuest(
    reservationId
  ) {
    const response =
      await api.patch(
        `/receptionist/reservations/${reservationId}/check-in`
      );

    return mapReservationFromBackend(
      unwrap(response)
    );
  },

  async performCheckOut(
    reservationId
  ) {
    const response =
      await api.patch(
        `/receptionist/reservations/${reservationId}/check-out`
      );

    return mapReservationFromBackend(
      unwrap(response)
    );
  },

  async checkOutGuest(
    reservationId
  ) {
    const response =
      await api.patch(
        `/receptionist/reservations/${reservationId}/check-out`
      );

    return mapReservationFromBackend(
      unwrap(response)
    );
  },

  async deleteReceptionistReservation(
    reservationId
  ) {
    if (!reservationId) {
      throw new Error(
        'Reservation ID is required.'
      );
    }

    const response =
      await api.delete(
        `/receptionist/reservations/${reservationId}`
      );

    return unwrap(response);
  },
  // ----------------------------------------------------------
  // OWNER
  // ----------------------------------------------------------

  api,

  async getMyGuesthouse() {
    try {
      const response =
        await api.get(
          '/owner/guesthouse'
        );

      const data =
        unwrap(response);

      if (!data) return null;

      let rooms = [];

      try {
        const roomsRes =
          await api.get(
            `/rooms/guesthouse/${data.id}`
          );

        rooms =
          unwrap(roomsRes) || [];
      } catch {
        rooms = [];
      }

      return mapGuesthouseFromBackend(
        data,
        rooms
      );
    } catch {
      try {
        const fallbackRes =
          await api.get(
            '/guesthouses/owner/me'
          );

        const data =
          unwrap(fallbackRes);

        if (!data) return null;

        return mapGuesthouseFromBackend(
          data
        );
      } catch {
        return null;
      }
    }
  },

  async updateMyGuesthouse(
    data
  ) {
    const response =
      await api.put(
        '/owner/guesthouse',
        {
          name:
            data.name,

          address:
            data.location ||
            data.address,

          city:
            data.city,

          description:
            data.description,

          image:
            data.images?.[0] ||
            data.image ||
            null,
        }
      );

    return mapGuesthouseFromBackend(
      unwrap(response)
    );
  },

  async getOwnerReceptionists(
    guesthouseId
  ) {
    const response =
      await api.get(
        '/owner/receptionists'
      );

    const staff =
      unwrap(response) || [];

    return staff.map(
      mapUserFromBackend
    );
  },

  async registerReceptionist(
    staffData
  ) {
    const response =
      await api.post(
        '/owner/receptionists',
        {
          fullName:
            staffData.fullName ||
            staffData.name,

          name:
            staffData.fullName ||
            staffData.name,

          email:
            staffData.email,

          phone:
            staffData.phone,

          password:
            staffData.password ||
            'Reception@123',
        }
      );

    return mapUserFromBackend(
      unwrap(response)
    );
  },

  async removeReceptionistFromGuesthouse(
    staffId
  ) {
    const response =
      await api.delete(
        `/owner/receptionists/${staffId}`
      );

    return unwrap(response);
  },

  async assignReceptionistToGuesthouse(
    staffId
  ) {
    const response =
      await api.post(
        '/owner/receptionists/assign',
        {
          staffId:
            Number(staffId),
        }
      );

    return unwrap(response);
  },

  async getOwnerDashboardStats() {
    const response =
      await api.get(
        '/dashboard/owner'
      );

    return unwrap(response) || {};
  },

  async getOwnerDashboardRevenue() {
    const response =
      await api.get(
        '/dashboard/owner/revenue'
      );

    const data =
      unwrap(response) || {};

    return {
      totalRevenue:
        Number(
          data.totalRevenue ?? 0
        ),

      breakdown: {
        telebirr:
          Number(
            data.breakdown?.telebirr ?? 0
          ),

        chapa:
          Number(
            data.breakdown?.chapa ?? 0
          ),

        cbe_birr:
          Number(
            data.breakdown?.cbe_birr ?? 0
          ),
      },
    };
  },

  async getOwnerDashboardMonthlyRevenue() {
    const response =
      await api.get(
        '/dashboard/owner/monthly-revenue'
      );

    return unwrap(response) || [];
  },

  async getOwnerDashboardRecentReservations() {
    const response =
      await api.get(
        '/dashboard/owner/recent-reservations'
      );

    const list =
      unwrap(response) || [];

    return list.map(
      mapReservationFromBackend
    );
  },

  async getOwnerDashboardRecentPayments() {
    const response =
      await api.get(
        '/dashboard/owner/recent-payments'
      );

    const list =
      unwrap(response) || [];

    return list.map(
      mapPaymentFromBackend
    );
  },

  async getOwnerPayments(
    guesthouseId
  ) {
    const response =
      await api.get(
        '/dashboard/owner/recent-payments'
      );

    const payments =
      (
        unwrap(response) || []
      ).map(
        mapPaymentFromBackend
      );

    if (!guesthouseId) {
      return payments;
    }

    return payments.filter(
      (payment) =>
        String(
          payment.guesthouseId
        ) ===
        String(
          guesthouseId
        )
    );
  },

  async getOwnerRevenueReport(
    guesthouseId
  ) {
    const response =
      await api.get(
        '/dashboard/owner/revenue'
      );

    const data =
      unwrap(response) || {};

    const payments =
      await this.getOwnerPayments(
        guesthouseId
      );

    const telebirr =
      data.breakdown?.telebirr ??
      payments
        .filter(
          (p) =>
            p.method ===
            'telebirr'
        )
        .reduce(
          (sum, p) =>
            sum + p.amount,
          0
        );

    const chapa =
      data.breakdown?.chapa ??
      payments
        .filter(
          (p) =>
            p.method === 'chapa' ||
            p.method === 'card'
        )
        .reduce(
          (sum, p) =>
            sum + p.amount,
          0
        );

    const cbe_birr =
      data.breakdown?.cbe_birr ??
      payments
        .filter(
          (p) =>
            p.method === 'cbe_birr' ||
            p.method ===
              'bank_transfer'
        )
        .reduce(
          (sum, p) =>
            sum + p.amount,
          0
        );

    return {
      totalRevenue:
        Number(
          data.totalRevenue ??
          (
            telebirr +
            chapa +
            cbe_birr
          )
        ),

      totalTransactions:
        payments.length,

      paymentMethodBreakdown: {
        telebirr,
        chapa,
        cbe_birr,
        card: chapa,
      },

      occupancyRate:
        Number(
          data.occupancyRate ?? 0
        ),
    };
  },

  // ----------------------------------------------------------
  // REVIEWS
  // ----------------------------------------------------------

  async getOwnerReviews() {
    const response =
      await api.get(
        '/reviews/owner-reviews'
      );

    return unwrap(response) || [];
  },

  async getGuesthouseReviews(
    guesthouseId
  ) {
    if (!guesthouseId) {
      throw new Error(
        'Guesthouse ID is required.'
      );
    }

    const response =
      await api.get(
        `/reviews/guesthouse/${guesthouseId}`
      );

    return unwrap(response) || [];
  },

  // ----------------------------------------------------------
  // CREATE GUEST REVIEW
  // ----------------------------------------------------------

  async createReview({
    guesthouseId,
    reservationId,
    rating,
    comment,
  }) {
    if (!guesthouseId) {
      throw new Error(
        'Guesthouse ID is required.'
      );
    }

    if (!reservationId) {
      throw new Error(
        'Reservation ID is required.'
      );
    }

    if (!rating) {
      throw new Error(
        'Rating is required.'
      );
    }

    const numericRating =
      Number(rating);

    if (
      numericRating < 1 ||
      numericRating > 5
    ) {
      throw new Error(
        'Rating must be between 1 and 5.'
      );
    }

    if (
      !comment ||
      !String(comment).trim()
    ) {
      throw new Error(
        'Please write a review before submitting.'
      );
    }

    const response =
      await api.post(
        '/reviews',
        {
          guesthouseId:
            Number(guesthouseId),

          reservationId:
            Number(reservationId),

          rating:
            numericRating,

          comment:
            String(comment).trim(),
        }
      );

    return unwrap(response);
  },

  // ----------------------------------------------------------
  // GET REVIEW FOR ONE RESERVATION
  // ----------------------------------------------------------

  async getReviewForReservation(
    reservationId
  ) {
    if (!reservationId) {
      throw new Error(
        'Reservation ID is required.'
      );
    }

    const response =
      await api.get(
        `/reviews/reservation/${reservationId}`
      );

    return unwrap(response);
  },

  // ----------------------------------------------------------
  // UPDATE GUEST REVIEW
  // ----------------------------------------------------------

  async updateReview(
    reviewId,
    {
      rating,
      comment,
    }
  ) {
    if (!reviewId) {
      throw new Error(
        'Review ID is required.'
      );
    }

    const numericRating =
      Number(rating);

    if (
      numericRating < 1 ||
      numericRating > 5
    ) {
      throw new Error(
        'Rating must be between 1 and 5.'
      );
    }

    const response =
      await api.put(
        `/reviews/${reviewId}`,
        {
          rating:
            numericRating,

          comment:
            String(
              comment || ''
            ).trim(),
        }
      );

    return unwrap(response);
  },

  // ----------------------------------------------------------
  // DELETE GUEST REVIEW
  // ----------------------------------------------------------

  async deleteReview(
    reviewId
  ) {
    if (!reviewId) {
      throw new Error(
        'Review ID is required.'
      );
    }

    const response =
      await api.delete(
        `/reviews/${reviewId}`
      );

    return unwrap(response);
  },

  // ----------------------------------------------------------
  // OWNER RESPONSE TO REVIEW
  // ----------------------------------------------------------

  async respondToReview(
    reviewId,
    responseText
  ) {
    if (!reviewId) {
      throw new Error(
        'Review ID is required.'
      );
    }

    const response =
      await api.put(
        `/reviews/${reviewId}/respond`,
        {
          response:
            responseText,
        }
      );

    return unwrap(response);
  },

  // ----------------------------------------------------------
  // ADMIN
  // ----------------------------------------------------------

  async deleteGuesthouse(id) {
    if (!id) {
      throw new Error(
        'Guesthouse ID is required.'
      );
    }

    const response =
      await api.delete(
        `/admin/guesthouses/${id}`
      );

    return unwrap(response);
  },

  async getAdminPlatformStats() {
    const response =
      await api.get(
        '/dashboard'
      );

    const stats =
      unwrap(response) || {};

    const pending =
      await this.getAdminPendingGuesthouses();

    return {
      totalGuesthouses:
        Number(
          stats.totalGuesthouses ??
          0
        ),

      approvedGuesthouses:
        Math.max(
          0,
          Number(
            stats.totalGuesthouses ??
            0
          ) -
          pending.length
        ),

      pendingGuesthouses:
        pending.length,

      totalReservations:
        Number(
          stats.totalReservations ??
          0
        ),

      totalPlatformRevenue:
        Number(
          stats.totalRevenue ??
          0
        ),

      totalUsers:
        Number(
          stats.totalUsers ??
          0
        ),
    };
  },

  async getAdminPendingGuesthouses() {
    const response =
      await api.get(
        '/guesthouses/pending'
      );

    const guesthouses =
      unwrap(response) || [];

    return guesthouses
      .map(
        (guesthouse) =>
          mapGuesthouseFromBackend(
            guesthouse
          )
      )
      .filter(Boolean);
  },

  async deleteUser(id) {
    if (!id) {
      throw new Error(
        'User ID is required'
      );
    }

    const response =
      await api.delete(
        `/admin/users/${id}`
      );

    return unwrap(response);
  },

  async updateUserRole(
  userId,
  role
) {
  if (!userId) {
    throw new Error(
      'User ID is required'
    );
  }

  const response =
    await api.patch(
      `/admin/users/${userId}/role`,
      {
        role:
          String(role).toUpperCase(),
      }
    );

  return mapUserFromBackend(
    unwrap(response)
  );
},

  async rejectGuesthouse(
    id,
    reason =
      'Does not meet platform standards'
  ) {
    if (!id) {
      throw new Error(
        'Guesthouse ID is required'
      );
    }

    const response =
      await api.put(
        `/admin/guesthouses/${id}/reject`,
        {
          reason,
        }
      );

    return mapGuesthouseFromBackend(
      unwrap(response)
    );
  },

  async approveGuesthouse(
    id
  ) {
    const response =
      await api.put(
        `/admin/guesthouses/${id}/approve`
      );

    return mapGuesthouseFromBackend(
      unwrap(response)
    );
  },

  // ==========================================================
  // NOTIFICATIONS API
  // ==========================================================

  async getNotifications() {
    try {
      const response = await api.get('/notifications');
      const rawList = unwrap(response) || [];
      return rawList.map(mapNotificationFromBackend).filter(Boolean);
    } catch (error) {
      console.warn('Failed to fetch notifications:', error.message);
      return [];
    }
  },

  async getUnreadNotifications() {
    try {
      const response = await api.get('/notifications/unread');
      const rawList = unwrap(response) || [];
      return rawList.map(mapNotificationFromBackend).filter(Boolean);
    } catch (error) {
      console.warn('Failed to fetch unread notifications:', error.message);
      return [];
    }
  },

  async getUnreadNotificationCount() {
    try {
      const response = await api.get('/notifications/count');
      const data = unwrap(response);
      if (typeof data?.count === 'number') {
        return data.count;
      }
      const unreadList = await this.getUnreadNotifications();
      return unreadList.length;
    } catch (error) {
      console.warn('Failed to fetch unread notification count:', error.message);
      return 0;
    }
  },

  async markNotificationAsRead(id) {
    if (!id) return null;
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      return mapNotificationFromBackend(unwrap(response));
    } catch (error) {
      console.error(`Failed to mark notification ${id} as read:`, error);
      throw error;
    }
  },

  async markAllNotificationsAsRead() {
    try {
      const response = await api.patch('/notifications/read-all');
      return unwrap(response);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  },

  async deleteNotification(id) {
    if (!id) return null;
    try {
      const response = await api.delete(`/notifications/${id}`);
      return unwrap(response);
    } catch (error) {
      console.error(`Failed to delete notification ${id}:`, error);
      throw error;
    }
  },

  async deleteAllNotifications() {
    try {
      const response = await api.delete('/notifications');
      return unwrap(response);
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      throw error;
    }
  },
};

// ============================================================
// NOTIFICATION MAPPING HELPER
// ============================================================

function mapNotificationFromBackend(notification) {
  if (!notification) return null;

  const title = String(notification.title || '').trim();
  const message = String(notification.message || '').trim();

  let category = 'system';
  const lowerTitle = title.toLowerCase();
  const lowerMsg = message.toLowerCase();

  if (
    lowerTitle.includes('payment') ||
    lowerTitle.includes('chapa') ||
    lowerTitle.includes('telebirr') ||
    lowerMsg.includes('payment') ||
    lowerMsg.includes('paid')
  ) {
    category = 'payment';
  } else if (
    lowerTitle.includes('reservation') ||
    lowerTitle.includes('booking') ||
    lowerTitle.includes('check-in') ||
    lowerTitle.includes('check-out') ||
    lowerTitle.includes('checked in') ||
    lowerTitle.includes('checked out') ||
    lowerMsg.includes('reservation') ||
    lowerMsg.includes('booking')
  ) {
    category = 'reservation';
  } else if (
    lowerTitle.includes('review') ||
    lowerMsg.includes('review') ||
    lowerMsg.includes('rating')
  ) {
    category = 'review';
  } else if (
    lowerTitle.includes('guesthouse') ||
    lowerTitle.includes('staff') ||
    lowerTitle.includes('property') ||
    lowerMsg.includes('guesthouse')
  ) {
    category = 'guesthouse';
  }

  return {
    id: notification.id,
    title: notification.title || 'Notification',
    message: notification.message || '',
    isRead: Boolean(notification.isRead),
    category,
    createdAt: notification.createdAt || new Date().toISOString(),
    updatedAt: notification.updatedAt || new Date().toISOString(),
  };
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default ApiService;