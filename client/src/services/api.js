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

    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
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
  // If response is undefined or null
  if (!response) {
    console.warn('⚠️ unwrap: No response provided');
    return null;
  }
  
  // If response.data is undefined or null
  if (!response.data) {
    console.warn('⚠️ unwrap: No response.data');
    return null;
  }
  
  // If response.data.data exists, use it
  if (response.data.data !== undefined && response.data.data !== null) {
    return response.data.data;
  }
  
  // Otherwise return response.data
  return response.data;
}

function guesthouseFormData(data = {}, status) {
  const formData = new FormData();
  const fields = [
    'name', 'address', 'city', 'subCity', 'woreda', 'phone', 'email',
    'numberOfRooms', 'description', 'licenseNumber',
  ];

  fields.forEach((field) => {
    if (data[field] !== undefined && data[field] !== null) {
      formData.append(field, data[field]);
    }
  });

  if (status) formData.append('status', status);
  if (
    data.licenseDocument &&
    typeof data.licenseDocument === 'object' &&
    typeof data.licenseDocument.name === 'string'
  ) {
    formData.append('licenseDocument', data.licenseDocument);
  }
  (data.photos || []).forEach((photo) => {
    if (
      photo &&
      typeof photo === 'object' &&
      typeof photo.name === 'string'
    ) {
      formData.append('photos', photo);
    }
  });

  return formData;
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

    residentialAddress:
      user.residentialAddress || '',

    idType:
      user.idType || '',

    idNumber:
      user.idNumber || '',

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
  if (!status) return 'draft';

  const normalized = String(status).toLowerCase();

  return normalized === 'pending_review'
    ? 'pending'
    : normalized;
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
    console.warn('⚠️ mapGuesthouseFromBackend: No guesthouse provided');
    return null;
  }

  // Check if guesthouse has an id
  if (!guesthouse.id) {
    console.warn('⚠️ mapGuesthouseFromBackend: Guesthouse has no id', guesthouse);
    return null;
  }

  console.log('🏠 Mapping guesthouse:', guesthouse.id, guesthouse.name);

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

  const mapped = {
    id: guesthouse.id,
    ownerId: guesthouse.ownerId || guesthouse.owner?.id || null,
    owner: guesthouse.owner ? mapUserFromBackend(guesthouse.owner) : null,
    rooms: Array.isArray(guesthouse.rooms)
      ? guesthouse.rooms.map(mapRoomFromBackend).filter(Boolean)
      : guesthouseRooms.map(mapRoomFromBackend),
    name: guesthouse.name || '',
    description: guesthouse.description || '',
    location: guesthouse.location || guesthouse.address || '',
    city: guesthouse.city || '',
    subCity: guesthouse.subCity || '',
    woreda: guesthouse.woreda || '',
    address: guesthouse.address || guesthouse.location || '',
    phone: guesthouse.phone || '',
    email: guesthouse.email || '',
    numberOfRooms: guesthouse.numberOfRooms ?? rooms.length,
    licenseNumber: guesthouse.licenseNumber || '',
    licenseDocument: guesthouse.licenseDocument || '',
    photos: Array.isArray(guesthouse.photos) ? guesthouse.photos : [],
    rejectionReason: guesthouse.rejectionReason || '',
    status: mapGuesthouseStatus(guesthouse.status),
    image: image,
    images: images,
    amenities: Array.isArray(guesthouse.amenities) ? guesthouse.amenities : [],
    rating: Number(guesthouse.rating ?? 0),
    reviewCount: Number(guesthouse.reviewCount ?? 0),
    createdAt: guesthouse.createdAt,
    priceRange: {
      min: minPrice,
      max: maxPrice,
    },
  };

  console.log('✅ Mapped guesthouse:', mapped.id, mapped.name);
  return mapped;
}

// ============================================================
// ROOM MAPPING
// ============================================================

function normalizeRoomStatus(room) {
  if (!room) return 'available';

  const rawStatus =
    room.availabilityStatus ??
    room.maintenanceStatus ??
    room.status ??
    null;

  if (rawStatus) {
    const status = String(rawStatus).toLowerCase().trim();

    const statusMap = {
      available: 'available',
      unavailable: 'unavailable',
      cleaning: 'cleaning',
      maintenance: 'maintenance',
      occupied: 'occupied',
      reserved: 'reserved',
      booking: 'reserved',
      booked: 'reserved',
    };

    if (statusMap[status]) {
      return statusMap[status];
    }
  }

  // Backward compatibility with old boolean database field
  if (room.available === false) {
    return 'unavailable';
  }

  return 'available';
}

function mapRoomFromBackend(room) {
  if (!room) return null;

  const availabilityStatus =
    normalizeRoomStatus(room);

  return {
    id: room.id,

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

    availabilityStatus,

    // Keep these for compatibility with existing components
    available:
      availabilityStatus === 'available',

    maintenanceStatus:
      availabilityStatus,

    status:
      availabilityStatus,
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

    numberOfGuests:
      reservation.numberOfGuests ||
      reservation.guestCount ||
      1,

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

  paymentMethod:
  reservation.paymentMethod ||
  reservation.payment_method ||
  reservation.payment?.method ||
  reservation.payment?.paymentMethod ||
  null,

paymentStatus:
  reservation.paymentStatus ||
  reservation.payment_status ||
  reservation.payment?.status ||
  'pending',

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
    normalized === 'BANK_TRANSFER' ||
    normalized === 'BANK' ||
    normalized === 'CBE_BIRR' ||
    normalized === 'CBE'
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

  if (/^\+2519\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  if (/^2519\d{8}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  if (/^09\d{8}$/.test(cleaned)) {
    return `+251${cleaned.slice(1)}`;
  }

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

    window.dispatchEvent(new CustomEvent('auth-state-change', {
      detail: { user: null, isLoggedIn: false }
    }));

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

  window.dispatchEvent(new CustomEvent('auth-state-change', {
    detail: { user, isLoggedIn: true }
  }));
}

function logoutUser() {
  localStorage.removeItem(
    CURRENT_USER_KEY
  );

  localStorage.removeItem(
    TOKEN_KEY
  );

  window.dispatchEvent(new CustomEvent('auth-state-change', {
    detail: { user: null, isLoggedIn: false }
  }));
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


  async loginUser(
    email,
    password
  ) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    try {
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

      if (!payload.user) {
        throw new Error('Invalid login response - no user data');
      }

      const user =
        mapUserFromBackend(
          payload.user
        );

      if (!user) {
        throw new Error('Failed to map user data');
      }

      setCurrentUser(
        user,
        payload.token
      );

      return user;

    } catch (error) {
      console.error('Login error:', error);
      
      logoutUser();
      
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        'Login failed. Please check your credentials.'
      );
    }
  },


  async registerUser(
    payload
  ) {
    if (!payload) {
      throw new Error('Registration data is required');
    }

    try {
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

        residentialAddress:
          payload.address,

        idType:
          payload.idType,

        idNumber:
          payload.idNumber,

        password:
          payload.password ||
          'password123',

        role,
      };

      const response =
        await api.post(
          '/auth/register',
          body
        );

      const result =
        unwrap(response) || {};

      const user = mapUserFromBackend(result.user);

      if (user && result.token) {
        setCurrentUser(user, result.token);
      }

      return {
        ...user,
        requiresApproval: false,
        message: result.message,
      };

    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        'Registration failed. Please try again.'
      );
    }
  },


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


  async checkAuthStatus() {
    try {
      const response = await api.get('/auth/status');
      const data = unwrap(response);
      const user = data?.user ? mapUserFromBackend(data.user) : null;
      
      if (user) {
        setCurrentUser(user);
        return user;
      }
      
      return null;
    } catch (error) {
      if (error?.response?.status === 401) {
        logoutUser();
      }
      return null;
    }
  },


  async refreshToken() {
    try {
      const response = await api.post('/auth/refresh-token');
      const data = unwrap(response);
      
      if (data?.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        return data.token;
      }
      
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      logoutUser();
      return null;
    }
  },


  async forgotPassword(email) {
    if (!email) {
      throw new Error('Email is required');
    }

    try {
      const response = await api.post('/auth/forgot-password', { email });
      return unwrap(response);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to send password reset email.'
      );
    }
  },


  async resetPassword(token, newPassword) {
    if (!token || !newPassword) {
      throw new Error('Token and new password are required');
    }

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword,
      });
      return unwrap(response);
    } catch (error) {
      console.error('Reset password error:', error);
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to reset password.'
      );
    }
  },


  async verifyEmail(token) {
    if (!token) {
      throw new Error('Verification token is required');
    }

    try {
      const response = await api.post('/auth/verify-email', { token });
      return unwrap(response);
    } catch (error) {
      console.error('Email verification error:', error);
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to verify email.'
      );
    }
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
  // GUESTHOUSES - FIXED
  // ----------------------------------------------------------

  async getGuesthouses(
    filters = {}
  ) {
    try {
      console.log('🔍 Fetching all guesthouses with filters:', filters);
      
      const response = await api.get('/guesthouses', {
        params: filters,
      });
      
      console.log('📦 Raw API response status:', response.status);
      console.log('📦 Raw API response data:', response.data);
      
      const guesthouses = unwrap(response) || [];
      console.log('📦 Unwrapped guesthouses:', guesthouses);
      console.log('📦 Number of guesthouses from API:', guesthouses.length);
      
      // Fetch rooms for all guesthouses
      let rooms = [];
      try {
        console.log('🛏️ Fetching rooms...');
        const roomsResponse = await api.get('/rooms');
        rooms = unwrap(roomsResponse) || [];
        console.log('🛏️ Rooms fetched:', rooms.length);
      } catch (error) {
        console.warn('⚠️ Could not fetch rooms:', error);
        rooms = [];
      }

      // Map each guesthouse
      let list = guesthouses
        .map((guesthouse) => {
          const mapped = mapGuesthouseFromBackend(guesthouse, rooms);
          console.log(`🏠 Mapping guesthouse: ${guesthouse.id} - ${guesthouse.name}`, mapped);
          return mapped;
        })
        .filter(Boolean);

      console.log('📊 Mapped guesthouses before filters:', list.length);

      // Apply city filter
      if (filters.city) {
        list = list.filter(
          (guesthouse) =>
            guesthouse.city?.toLowerCase() === String(filters.city).toLowerCase()
        );
        console.log(`📍 Filtered by city ${filters.city}: ${list.length}`);
      }

      // Apply max price filter
      if (filters.maxPrice) {
        list = list.filter(
          (guesthouse) => guesthouse.priceRange.min <= Number(filters.maxPrice)
        );
        console.log(`💰 Filtered by max price ${filters.maxPrice}: ${list.length}`);
      }

      // ✅ FIX: Only return APPROVED guesthouses
      const approved = list.filter(g => 
        g.status === 'approved' || 
        g.status === 'APPROVED' ||
        g.status === 'verified' ||
        g.status === 'VERIFIED'
      );
      console.log(`✅ Approved guesthouses: ${approved.length}`);
      
      // ✅ FIX: Log if Lalibela is in the list
      const lalibela = approved.find(g => 
        g.name && g.name.toLowerCase().includes('lalibela')
      );
      if (lalibela) {
        console.log('🏠✅ Lalibela Heritage Guesthouse found in API response!', lalibela);
      } else {
        console.warn('⚠️ Lalibela Heritage Guesthouse NOT found in API response');
        // Check if it exists in the unfiltered list
        const lalibelaUnfiltered = list.find(g => 
          g.name && g.name.toLowerCase().includes('lalibela')
        );
        if (lalibelaUnfiltered) {
          console.warn('⚠️ Lalibela found but filtered out. Status:', lalibelaUnfiltered.status);
        }
      }

      return approved;
    } catch (error) {
      console.error('❌ Error in getGuesthouses:', error);
      return [];
    }
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

  // ==========================================================
  // REGISTER GUESTHOUSE
  // ==========================================================

  async registerGuesthouse(
    data
  ) {
    const response =
      await api.post(
        '/owner/guesthouse',
        guesthouseFormData({
          ...data,
          address: data.location || data.address,
        }),
        undefined
      );

    return mapGuesthouseFromBackend(unwrap(response));
  },

  async saveGuesthouseDraft(data) {
    const response = await api.put(
      '/owner/guesthouse',
      guesthouseFormData(data, 'DRAFT'),
      undefined
    );

    return mapGuesthouseFromBackend(unwrap(response));
  },

  async submitGuesthouseForReview(data) {
    const response = await api.put(
      '/owner/guesthouse/submit',
      guesthouseFormData(data, 'PENDING'),
      undefined
    );

    return mapGuesthouseFromBackend(unwrap(response));
  },

  async resubmitGuesthouse(
    data
  ) {
    const response =
      await api.put(
        '/owner/guesthouse/resubmit',
        guesthouseFormData({
          ...data,
          address: data.location || data.address,
        }, 'PENDING'),
        undefined
      );

    return unwrap(response);
  },

  // ============================================================
  // GET MY GUESTHOUSE - FIXED
  // ============================================================

  async getMyGuesthouse() {
    try {
      console.log('🔍 Fetching owner guesthouse...');
      const response = await api.get('/owner/guesthouse');
      console.log('📦 Raw response status:', response.status);
      console.log('📦 Raw response data:', response.data);
      
      const data = unwrap(response);
      console.log('📦 Unwrapped data:', data);
      
      // ✅ FIX: Check for empty object, null, undefined, or missing id
      if (!data) {
        console.warn('⚠️ No data returned from API');
        return null;
      }
      
      // ✅ FIX: Check if it's an empty object
      if (typeof data === 'object' && Object.keys(data).length === 0) {
        console.warn('⚠️ API returned empty object - no guesthouse exists');
        return null;
      }
      
      // ✅ FIX: Check if it has an id
      if (!data.id) {
        console.warn('⚠️ API returned data without id:', data);
        return null;
      }

      let rooms = [];
      try {
        console.log('📦 Fetching rooms for guesthouse:', data.id);
        const roomsRes = await api.get(`/rooms/guesthouse/${data.id}`);
        rooms = unwrap(roomsRes) || [];
        console.log('🛏️ Rooms fetched:', rooms.length);
      } catch (error) {
        console.error('❌ Error fetching rooms:', error);
        rooms = [];
      }

      const mappedGuesthouse = mapGuesthouseFromBackend(data, rooms);
      console.log('🏠 Mapped guesthouse:', mappedGuesthouse?.id, mappedGuesthouse?.name);
      
      // ✅ FIX: Make sure mapped guesthouse has an id
      if (!mappedGuesthouse || !mappedGuesthouse.id) {
        console.warn('⚠️ Mapped guesthouse has no id');
        return null;
      }
      
      return mappedGuesthouse;
    } catch (error) {
      console.error('❌ Error in getMyGuesthouse:', error);
      // If it's a 404, that means no guesthouse exists - return null
      if (error?.response?.status === 404) {
        console.log('ℹ️ No guesthouse found (404)');
        return null;
      }
      return null;
    }
  },

  // ----------------------------------------------------------
  // ROOMS
  // ----------------------------------------------------------

  async getRoomsForGuesthouse(
    guesthouseId
  ) {
    if (!guesthouseId) {
      console.warn('⚠️ getRoomsForGuesthouse: No guesthouseId provided');
      return [];
    }

    try {
      const response = await api.get('/rooms');
      const rooms = unwrap(response) || [];

      const filtered = rooms
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
      
      console.log(`📦 Found ${filtered.length} rooms for guesthouse ${guesthouseId}`);
      return filtered;
    } catch (error) {
      console.error('❌ Error fetching rooms:', error);
      return [];
    }
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
              roomData.capacity || 4
            ),

          maxGuests:
            Number(
              roomData.maxGuests ||
              roomData.capacity ||
              4
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

  async updateRoomAvailability(roomId, status) {
    if (!roomId) {
      throw new Error("Room ID is required.");
    }

    const normalizedStatus = String(status || "")
      .toLowerCase()
      .trim();

    const allowedStatuses = [
      "available",
      "unavailable",
    ];

    if (!allowedStatuses.includes(normalizedStatus)) {
      throw new Error(
        `Invalid room status: ${status}`
      );
    }

    const response = await api.patch(
      `/rooms/${roomId}/availability`,
      {
        available: normalizedStatus === "available",
      }
    );

    return mapRoomFromBackend(
      unwrap(response)
    );
  },

  async updateRoom(roomId, data) {
    if (!roomId) {
      throw new Error("Room ID is required.");
    }

    const response = await api.put(
      `/rooms/${roomId}`,
      {
        roomNumber: data.roomNumber,
        roomType: data.roomType,
        capacity: data.capacity,
        pricePerNight: data.pricePerNight,
        available: data.available,
      }
    );

    return mapRoomFromBackend(
      unwrap(response)
    );
  },

  async deleteRoom(roomId) {
    if (!roomId) {
      throw new Error("Room ID is required.");
    }

    const response = await api.delete(
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
    numberOfGuests = 1,
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

          numberOfGuests:
            Number(numberOfGuests || 1),
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

          numberOfGuests:
            numberOfGuests || 1,

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
    const response =
      await api.get(
        '/receptionist/dashboard'
      );

    const stats =
      unwrap(response) || {};

    return {
      arrivals:
        Number(stats.arrivals ?? 0),

      departures:
        Number(stats.departures ?? 0),

      inHouse:
        Number(stats.inHouse ?? 0),

      availableRooms:
        Number(
          stats.availableRooms ?? 0
        ),

      totalRooms:
        Number(
          stats.totalRooms ?? 0
        ),

      guesthouse:
        stats.guesthouse ??
        stats.property ??
        stats.assignedGuesthouse ??
        stats.assignedProperty ??
        null,
    };
  },

  async getReceptionistGuesthouse() {
    try {
      const response =
        await api.get(
          '/receptionist/guesthouse'
        );

      const data =
        unwrap(response);

      if (!data) {
        return null;
      }

      return mapGuesthouseFromBackend(
        data
      );
    } catch (error) {
      console.warn(
        'Receptionist guesthouse endpoint unavailable:',
        error
      );

      return null;
    }
  },

  async searchReceptionistReservations(
    term
  ) {
    const response =
      await api.get(
        `/receptionist/reservations/search?term=${encodeURIComponent(
          term ?? ''
        )}`
      );

    const list =
      unwrap(response) || [];

    return list.map(
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

  async getReceptionistInHouse(
    guesthouseId
  ) {
    const response =
      await api.get(
        '/receptionist/in-house'
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

  async getReceptionistRooms(
    guesthouseId
  ) {
    const response =
      await api.get(
        '/receptionist/rooms'
      );

    const list =
      unwrap(response) || [];

    const mapped =
      list.map(
        mapRoomFromBackend
      );

    if (!guesthouseId) {
      return mapped;
    }

    return mapped.filter(
      (room) =>
        String(
          room.guesthouseId
        ) ===
        String(
          guesthouseId
        )
    );
  },

  async updateReceptionistRoomAvailability(
    roomId,
    status
  ) {
    if (!roomId) {
      throw new Error(
        'Room ID is required.'
      );
    }

    const normalizedStatus =
      String(
        status || ''
      )
        .trim()
        .toUpperCase();

    const allowedStatuses = [
      'AVAILABLE',
      'UNAVAILABLE',
      'CLEANING',
      'MAINTENANCE',
    ];

    if (
      !allowedStatuses.includes(
        normalizedStatus
      )
    ) {
      throw new Error(
        `Invalid room status: ${status}. Allowed values are AVAILABLE, UNAVAILABLE, CLEANING, and MAINTENANCE.`
      );
    }

    const response =
      await api.patch(
        `/receptionist/rooms/${roomId}/availability`,
        {
          availabilityStatus:
            normalizedStatus,

          maintenanceStatus:
            normalizedStatus,

          available:
            normalizedStatus ===
            'AVAILABLE',
        }
      );

    return mapRoomFromBackend(
      unwrap(response)
    );
  },

  async checkInGuest(
    reservationId
  ) {
    if (!reservationId) {
      throw new Error(
        'Reservation ID is required.'
      );
    }

    const response =
      await api.patch(
        `/receptionist/reservations/${reservationId}/check-in`
      );

    return mapReservationFromBackend(
      unwrap(response)
    );
  },

  async checkOutGuest(
    reservationId
  ) {
    if (!reservationId) {
      throw new Error(
        'Reservation ID is required.'
      );
    }

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
    if (!guesthouseId) {
      console.warn('⚠️ getOwnerReceptionists: No guesthouseId provided');
      return [];
    }

    try {
      const response =
        await api.get(
          '/owner/receptionists'
        );

      const staff =
        unwrap(response) || [];

      return staff.map(
        mapUserFromBackend
      );
    } catch (error) {
      console.error('❌ Error fetching staff:', error);
      return [];
    }
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

        bank_transfer:
          Number(
            data.breakdown?.bank_transfer ?? 0
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
    try {
      const reservationResponse = await api.get(
        '/dashboard/owner/recent-reservations'
      );

      const reservationList =
        unwrap(reservationResponse) || [];

      const paymentResponse = await api.get(
        '/dashboard/owner/recent-payments'
      );

      const paymentList =
        unwrap(paymentResponse) || [];

      const payments = paymentList.map(
        mapPaymentFromBackend
      );

      const reservations = reservationList.map(
        (reservation) => {
          const payment = payments.find(
            (p) =>
              String(p.reservationId) ===
              String(reservation.id)
          );

          return mapReservationFromBackend({
            ...reservation,

            payment: payment
              ? {
                  id: payment.id,
                  reservationId:
                    payment.reservationId,
                  amount: payment.amount,
                  method: payment.method,
                  status: payment.status,
                  referenceNumber:
                    payment.referenceNumber,
                  createdAt: payment.createdAt,
                }
              : reservation.payment,

            paymentMethod:
              payment?.method ||
              reservation.paymentMethod ||
              reservation.payment_method ||
              null,

            paymentStatus:
              payment?.status ||
              reservation.paymentStatus ||
              reservation.payment_status ||
              'pending',
          });
        }
      );

      return reservations;
    } catch (error) {
      console.error('❌ Error fetching reservations:', error);
      return [];
    }
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
    if (!guesthouseId) {
      console.warn('⚠️ getOwnerPayments: No guesthouseId provided');
      return [];
    }

    try {
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

      return payments.filter(
        (payment) =>
          String(
            payment.guesthouseId
          ) ===
          String(
            guesthouseId
          )
      );
    } catch (error) {
      console.error('❌ Error fetching payments:', error);
      return [];
    }
  },

  async getOwnerRevenueReport(
    guesthouseId
  ) {
    if (!guesthouseId) {
      console.warn('⚠️ getOwnerRevenueReport: No guesthouseId provided');
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        paymentMethodBreakdown: { telebirr: 0, chapa: 0, bank_transfer: 0, card: 0 },
        occupancyRate: 0,
      };
    }

    try {
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

      const bank_transfer =
        data.breakdown?.bank_transfer ??
        payments
          .filter(
            (p) =>
              p.method === 'bank_transfer' ||
              p.method === 'cbe_birr'
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
              bank_transfer
            )
          ),

        totalTransactions:
          payments.length,

        paymentMethodBreakdown: {
          telebirr,
          chapa,
          bank_transfer,
          card: chapa,
        },

        occupancyRate:
          Number(
            data.occupancyRate ?? 0
          ),
      };
    } catch (error) {
      console.error('❌ Error fetching revenue report:', error);
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        paymentMethodBreakdown: { telebirr: 0, chapa: 0, bank_transfer: 0, card: 0 },
        occupancyRate: 0,
      };
    }
  },

  // ----------------------------------------------------------
  // REVIEWS
  // ----------------------------------------------------------

  async getOwnerReviews() {
    try {
      console.log('🔍 Fetching owner reviews...');
      const response = await api.get('/reviews/owner-reviews');
      console.log('📦 Owner reviews response:', response);
      const data = unwrap(response);
      console.log('📝 Owner reviews data:', data);
      
      if (!data) {
        console.warn('⚠️ No reviews data returned');
        return [];
      }
      
      if (Array.isArray(data)) {
        return data;
      }
      
      if (data.reviews && Array.isArray(data.reviews)) {
        return data.reviews;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error fetching owner reviews:', error);
      return [];
    }
  },

  async getGuesthouseReviews(guesthouseId) {
    if (!guesthouseId) {
      throw new Error('Guesthouse ID is required.');
    }

    try {
      console.log('🔍 Fetching reviews for guesthouse:', guesthouseId);
      const response = await api.get(`/reviews/guesthouse/${guesthouseId}`);
      const data = unwrap(response);
      console.log('📝 Guesthouse reviews:', data);
      
      if (!data) {
        return [];
      }
      
      if (Array.isArray(data)) {
        return data;
      }
      
      if (data.reviews && Array.isArray(data.reviews)) {
        return data.reviews;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error fetching guesthouse reviews:', error);
      return [];
    }
  },

  async createReview({
    guesthouseId,
    reservationId,
    rating,
    comment,
  }) {
    if (!guesthouseId) {
      throw new Error('Guesthouse ID is required.');
    }

    if (!reservationId) {
      throw new Error('Reservation ID is required.');
    }

    if (!rating) {
      throw new Error('Rating is required.');
    }

    const numericRating = Number(rating);

    if (numericRating < 1 || numericRating > 5) {
      throw new Error('Rating must be between 1 and 5.');
    }

    if (!comment || !String(comment).trim()) {
      throw new Error('Please write a review before submitting.');
    }

    try {
      console.log('📝 Creating review for reservation:', reservationId);
      const response = await api.post('/reviews', {
        guesthouseId: Number(guesthouseId),
        reservationId: Number(reservationId),
        rating: numericRating,
        comment: String(comment).trim(),
      });
      
      const data = unwrap(response);
      console.log('✅ Review created:', data);
      return data;
    } catch (error) {
      console.error('❌ Error creating review:', error);
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to submit review. Please try again.'
      );
    }
  },

  async getReviewForReservation(reservationId) {
    if (!reservationId) {
      throw new Error('Reservation ID is required.');
    }

    try {
      console.log('🔍 Fetching review for reservation:', reservationId);
      const response = await api.get(`/reviews/reservation/${reservationId}`);
      const data = unwrap(response);
      console.log('📝 Review data:', data);
      return data || null;
    } catch (error) {
      if (error?.response?.status === 404) {
        console.log('ℹ️ No review found for reservation:', reservationId);
        return null;
      }
      console.error('❌ Error fetching review for reservation:', error);
      return null;
    }
  },

  async updateReview(reviewId, { rating, comment }) {
    if (!reviewId) {
      throw new Error('Review ID is required.');
    }

    const numericRating = Number(rating);

    if (numericRating < 1 || numericRating > 5) {
      throw new Error('Rating must be between 1 and 5.');
    }

    try {
      const response = await api.put(`/reviews/${reviewId}`, {
        rating: numericRating,
        comment: String(comment || '').trim(),
      });
      return unwrap(response);
    } catch (error) {
      console.error('❌ Error updating review:', error);
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update review.'
      );
    }
  },

  async deleteReview(reviewId) {
    if (!reviewId) {
      throw new Error('Review ID is required.');
    }

    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      return unwrap(response);
    } catch (error) {
      console.error('❌ Error deleting review:', error);
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete review.'
      );
    }
  },

  async respondToReview(reviewId, responseText) {
    if (!reviewId) {
      throw new Error('Review ID is required.');
    }

    if (!responseText || !String(responseText).trim()) {
      throw new Error('Response text is required.');
    }

    if (String(responseText).trim().length < 10) {
      throw new Error('Response must be at least 10 characters long.');
    }

    try {
      console.log('📝 Submitting response for review:', reviewId);
      const response = await api.put(`/reviews/${reviewId}/respond`, {
        response: String(responseText).trim(),
      });
      
      const data = unwrap(response);
      console.log('✅ Review response submitted:', data);
      return data;
    } catch (error) {
      console.error('❌ Error responding to review:', error);
      throw new Error(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to submit response. Please try again.'
      );
    }
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

  async getAdminGuesthouses() {
    const response = await api.get('/admin/guesthouses');
    const guesthouses = unwrap(response) || [];

    return guesthouses
      .map((guesthouse) => mapGuesthouseFromBackend(guesthouse))
      .filter(Boolean);
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
      await api.patch(
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
    if (!localStorage.getItem(TOKEN_KEY)) return [];
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
    if (!localStorage.getItem(TOKEN_KEY)) return [];
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
    if (!localStorage.getItem(TOKEN_KEY)) return 0;
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