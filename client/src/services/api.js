
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
  return localStorage.getItem(BACKEND_MODE_KEY) || 'api';
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
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
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
// RESPONSE HELPER
// ============================================================

function unwrap(response) {
  if (!response) {
    console.warn('⚠️ unwrap: No response provided');
    return null;
  }

  if (
    response.data === undefined ||
    response.data === null
  ) {
    console.warn('⚠️ unwrap: No response.data');
    return null;
  }

  const data = response.data;

  if (
    data &&
    typeof data === 'object' &&
    data.data !== undefined &&
    data.data !== null
  ) {
    return data.data;
  }

  return data;
}

// ============================================================
// ROLE HELPERS
// ============================================================

function normalizeRole(role) {
  if (!role) {
    return 'GUEST';
  }

  const normalized = String(role)
    .toUpperCase()
    .trim();

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
  if (!role) {
    return 'GUEST';
  }

  const value = String(role).trim();

  const map = {
    Guest: 'GUEST',
    guest: 'GUEST',
    GUEST: 'GUEST',

    Owner: 'OWNER',
    owner: 'OWNER',
    OWNER: 'OWNER',

    Receptionist: 'RECEPTIONIST',
    receptionist: 'RECEPTIONIST',
    RECEPTIONIST: 'RECEPTIONIST',

    Admin: 'ADMIN',
    admin: 'ADMIN',
    ADMIN: 'ADMIN',
  };

  return (
    map[value] ||
    value.toUpperCase()
  );
}

// ============================================================
// USER MAPPING
// ============================================================

function mapUserFromBackend(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,

    name:
      user.fullName ||
      user.name ||
      '',

    fullName:
      user.fullName ||
      user.name ||
      '',

    email:
      user.email ||
      '',

    phone:
      user.phone ||
      '',

    address:
      user.address ||
      user.residentialAddress ||
      '',

    role:
      normalizeRole(user.role),

    guesthouseId:
      user.guesthouseId ??
      user.guesthouse?.id ??
      null,

    createdAt:
      user.createdAt,
  };
}

// ============================================================
// GUESTHOUSE STATUS
// ============================================================

function mapGuesthouseStatus(status) {
  if (!status) {
    return 'pending';
  }

  return String(status)
    .toLowerCase()
    .trim();
}

// ============================================================
// IMAGE HELPERS
// ============================================================
function normalizeImageUrl(image) {
  if (!image) return '';
  if (typeof image !== 'string') return '';

  const trimmed = image.trim();

  if (!trimmed) return '';

  // Already a complete URL or browser-generated URL
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const apiBaseUrl = getApiUrl();

  // If API URL is something like:
  // http://localhost:5000/api
  // then images should use:
  // http://localhost:5000/uploads/...
  if (
    apiBaseUrl.startsWith('http://') ||
    apiBaseUrl.startsWith('https://')
  ) {
    const cleanBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

    const cleanPath = trimmed.startsWith('/')
      ? trimmed
      : `/${trimmed}`;

    return `${cleanBaseUrl}${cleanPath}`;
  }

  // If using Vite proxy /api
  return trimmed.startsWith('/')
    ? trimmed
    : `/${trimmed}`;
}

function getGuesthouseImages(guesthouse) {
  if (!guesthouse) return [];

  const result = [];

  const addImage = (image) => {
    const normalized = normalizeImageUrl(image);

    if (normalized && !result.includes(normalized)) {
      result.push(normalized);
    }
  };

  // IMPORTANT:
  // The database main image must come first.
  addImage(guesthouse.image);

  addImage(guesthouse.imageUrl);

  if (Array.isArray(guesthouse.images)) {
    guesthouse.images.forEach(addImage);
  }

  if (Array.isArray(guesthouse.photos)) {
    guesthouse.photos.forEach(addImage);
  }

  return result;
}

// ============================================================
// GUESTHOUSE FORM DATA
// ============================================================

function guesthouseFormData(
  data = {},
  status
) {
  const formData = new FormData();

  const fields = [
    'name',
    'address',
    'city',
    'subCity',
    'woreda',
    'phone',
    'email',
    'numberOfRooms',
    'description',
    'licenseNumber',
  ];

  fields.forEach((field) => {
    if (
      data[field] !== undefined &&
      data[field] !== null
    ) {
      formData.append(
        field,
        data[field]
      );
    }
  });

  if (status) {
    formData.append(
      'status',
      status
    );
  }

  if (
    data.licenseDocument &&
    typeof data.licenseDocument === 'object' &&
    typeof data.licenseDocument.name === 'string'
  ) {
    formData.append(
      'licenseDocument',
      data.licenseDocument
    );
  }

  if (
    Array.isArray(data.photos)
  ) {
    data.photos.forEach((photo) => {
      if (photo instanceof File) {
        formData.append(
          'photos',
          photo
        );
      }
    });
  }

  if (data.image instanceof File) {
  formData.append(
    'image',
    data.image
  );
}

  if (
    Array.isArray(data.images)
  ) {
    data.images.forEach((image) => {
      if (image instanceof File) {
        formData.append(
          'images',
          image
        );
      }
    });
  }

  return formData;
}

// ============================================================
// GUESTHOUSE MAPPING
// ============================================================

function mapGuesthouseFromBackend(
  guesthouse,
  rooms = []
) {
  if (!guesthouse) {
    console.warn(
      '⚠️ mapGuesthouseFromBackend: No guesthouse provided'
    );

    return null;
  }

  if (!guesthouse.id) {
    console.warn(
      '⚠️ mapGuesthouseFromBackend: Guesthouse has no id',
      guesthouse
    );

    return null;
  }

  const guesthouseRooms =
    Array.isArray(rooms)
      ? rooms.filter(
          (room) =>
            String(
              room.guesthouseId
            ) ===
            String(
              guesthouse.id
            )
        )
      : [];

  const mappedNestedRooms =
    Array.isArray(
      guesthouse.rooms
    )
      ? guesthouse.rooms
          .map(
            mapRoomFromBackend
          )
          .filter(Boolean)
      : [];

  const finalRooms =
    mappedNestedRooms.length > 0
      ? mappedNestedRooms
      : guesthouseRooms
          .map(
            mapRoomFromBackend
          )
          .filter(Boolean);

  const prices = finalRooms
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

  const mapped = {
    id: guesthouse.id,

    ownerId:
      guesthouse.ownerId ??
      guesthouse.owner?.id ??
      null,

    owner:
      guesthouse.owner
        ? mapUserFromBackend(
            guesthouse.owner
          )
        : null,

    rooms: finalRooms,

    name:
      guesthouse.name ||
      '',

    description:
      guesthouse.description ||
      '',

    location:
      guesthouse.location ||
      guesthouse.address ||
      '',

    city:
      guesthouse.city ||
      '',

    subCity:
      guesthouse.subCity ||
      '',

    woreda:
      guesthouse.woreda ||
      '',

    address:
      guesthouse.address ||
      guesthouse.location ||
      '',

    phone:
      guesthouse.phone ||
      '',

    email:
      guesthouse.email ||
      '',

    numberOfRooms:
      guesthouse.numberOfRooms ??
      finalRooms.length,

    licenseNumber:
      guesthouse.licenseNumber ||
      '',

    licenseDocument:
      guesthouse.licenseDocument ||
      '',

    photos:
      Array.isArray(
        guesthouse.photos
      )
        ? guesthouse.photos
        : [],

    rejectionReason:
      guesthouse.rejectionReason ||
      '',

    status:
      mapGuesthouseStatus(
        guesthouse.status
      ),

    image:
      images[0] ||
      '',

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

    updatedAt:
      guesthouse.updatedAt,

    priceRange: {
      min: minPrice,
      max: maxPrice,
    },
  };

  return mapped;
}

// ============================================================
// ROOM MAPPING
// ============================================================

function normalizeRoomStatus(room) {
  if (!room) {
    return 'available';
  }

  const rawStatus =
    room.availabilityStatus ??
    room.maintenanceStatus ??
    room.status ??
    null;

  if (rawStatus) {
    const status =
      String(rawStatus)
        .toLowerCase()
        .trim();

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

  if (room.available === false) {
    return 'unavailable';
  }

  return 'available';
}

function mapRoomFromBackend(room) {
  if (!room) {
    return null;
  }

  const availabilityStatus =
    normalizeRoomStatus(
      room
    );

  return {
    id: room.id,

    guesthouseId:
      room.guesthouseId,

    roomNumber:
      room.roomNumber,

    type:
      room.type ||
      room.roomType ||
      '',

    roomType:
      room.roomType ||
      room.type ||
      '',

    capacity:
      Number(
        room.capacity ?? 0
      ),

    maxGuests:
      Number(
        room.maxGuests ??
        room.capacity ??
        0
      ),

    pricePerNight:
      Number(
        room.pricePerNight ??
        room.price ??
        0
      ),

    price:
      Number(
        room.price ??
        room.pricePerNight ??
        0
      ),

    availabilityStatus,

    available:
      availabilityStatus ===
      'available',

    maintenanceStatus:
      availabilityStatus,

    status:
      availabilityStatus,

    createdAt:
      room.createdAt,

    updatedAt:
      room.updatedAt,
  };
}

// ============================================================
// RESERVATION HELPERS
// ============================================================

function mapReservationStatus(status) {
  if (!status) {
    return 'pending';
  }

  return String(status)
    .toLowerCase()
    .trim();
}

function calculateNights(
  checkIn,
  checkOut
) {
  if (
    !checkIn ||
    !checkOut
  ) {
    return 0;
  }

  const start =
    new Date(checkIn);

  const end =
    new Date(checkOut);

  if (
    Number.isNaN(
      start.getTime()
    ) ||
    Number.isNaN(
      end.getTime()
    )
  ) {
    return 0;
  }

  const difference =
    end.getTime() -
    start.getTime();

  const nights = Math.ceil(
    difference /
      (1000 *
        60 *
        60 *
        24)
  );

  return nights > 0
    ? nights
    : 0;
}

// ============================================================
// RESERVATION MAPPING
// ============================================================

function mapReservationFromBackend(
  reservation
) {
  if (!reservation) {
    return null;
  }

  const room =
    reservation.room || {};

  const guesthouse =
    room.guesthouse ||
    reservation.guesthouse ||
    {};

  const guest =
    reservation.guest || {};

  const payment =
    reservation.payment || {};

  const checkIn =
    reservation.checkInDate ||
    reservation.checkIn ||
    reservation.startDate;

  const checkOut =
    reservation.checkOutDate ||
    reservation.checkOut ||
    reservation.endDate;

  const calculatedNights =
    calculateNights(
      checkIn,
      checkOut
    );

  const nights = Number(
    reservation.nightsCount ??
    reservation.nights ??
    calculatedNights
  );

  const roomPrice =
    Number(
      reservation.pricePerNight ??
      reservation.roomPrice ??
      room.pricePerNight ??
      room.price ??
      0
    );

  const totalPrice =
    Number(
      reservation.totalPrice ??
      reservation.totalAmount ??
      payment.amount ??
      roomPrice *
        Math.max(
          1,
          nights
        )
    );

  return {
    id:
      reservation.id,

    guesthouseId:
      reservation.guesthouseId ??
      guesthouse.id ??
      room.guesthouseId ??
      null,

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
      reservation.roomId ??
      room.id ??
      null,

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
      reservation.guestId ??
      guest.id ??
      null,

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
      Number(
        reservation.numberOfGuests ??
        reservation.guestCount ??
        1
      ),

    checkInDate:
      checkIn
        ? String(checkIn).slice(
            0,
            10
          )
        : '',

    checkOutDate:
      checkOut
        ? String(checkOut).slice(
            0,
            10
          )
        : '',

    checkIn:
      checkIn || null,

    checkOut:
      checkOut || null,

    nightsCount:
      nights,

    pricePerNight:
      roomPrice,

    totalPrice,

    paymentMethod:
      reservation.paymentMethod ||
      reservation.payment_method ||
      payment.method ||
      payment.paymentMethod ||
      null,

    paymentStatus:
      reservation.paymentStatus ||
      reservation.payment_status ||
      payment.status ||
      'pending',

    payment:
      reservation.payment
        ? mapPaymentFromBackend(
            reservation.payment
          )
        : null,

    status:
      mapReservationStatus(
        reservation.status
      ),

    createdAt:
      reservation.createdAt,

    updatedAt:
      reservation.updatedAt,
  };
}

// ============================================================
// PAYMENT MAPPING
// ============================================================

function mapPaymentFromBackend(
  payment
) {
  if (!payment) {
    return null;
  }

  return {
    id:
      payment.id,

    reservationId:
      payment.reservationId,

    guesthouseId:
      payment.guesthouseId ??
      payment.reservation?.room
        ?.guesthouseId ??
      null,

    guestName:
      payment.guestName ||
      payment.reservation?.guest
        ?.fullName ||
      payment.reservation?.guest
        ?.name ||
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

    paymentMethod:
      String(
        payment.paymentMethod ||
        payment.method ||
        'telebirr'
      ).toLowerCase(),

    referenceNumber:
      payment.referenceNumber ||
      payment.txRef ||
      payment.transactionReference ||
      (
        payment.id
          ? `REF-${payment.id}`
          : ''
      ),

    status:
      String(
        payment.status ||
        'pending'
      ).toLowerCase(),

    checkoutUrl:
      payment.checkoutUrl ||
      payment.checkout_url ||
      null,

    createdAt:
      payment.createdAt,

    updatedAt:
      payment.updatedAt,
  };
}

function mapPaymentMethodToBackend(
  method
) {
  const normalized =
    String(
      method || 'TELEBIRR'
    )
      .toUpperCase()
      .trim();

  if (
    normalized ===
      'BANK_TRANSFER' ||
    normalized === 'BANK' ||
    normalized === 'CBE_BIRR' ||
    normalized === 'CBE'
  ) {
    return 'BANK_TRANSFER';
  }

  if (
    normalized === 'CHAPA' ||
    normalized === 'CARD'
  ) {
    return 'CHAPA';
  }

  return 'TELEBIRR';
}

// ============================================================
// PHONE / DATE HELPERS
// ============================================================

function formatEthiopianPhone(
  phone
) {
  if (!phone) {
    return '';
  }

  const cleaned =
    String(phone)
      .replace(/\s+/g, '')
      .replace(/-/g, '');

  if (
    /^\+2519\d{8}$/.test(
      cleaned
    )
  ) {
    return cleaned;
  }

  if (
    /^2519\d{8}$/.test(
      cleaned
    )
  ) {
    return `+${cleaned}`;
  }

  if (
    /^09\d{8}$/.test(
      cleaned
    )
  ) {
    return `+251${cleaned.slice(
      1
    )}`;
  }

  if (
    /^9\d{8}$/.test(
      cleaned
    )
  ) {
    return `+251${cleaned}`;
  }

  return cleaned;
}

function toIsoDateTime(
  dateString
) {
  if (!dateString) {
    throw new Error(
      'Date is required.'
    );
  }

  const value =
    String(dateString);

  if (
    value.includes('T')
  ) {
    return value;
  }

  return `${value}T12:00:00.000Z`;
}

// ============================================================
// AUTH / CURRENT USER
// ============================================================

function getCurrentUser() {
  const raw =
    localStorage.getItem(
      CURRENT_USER_KEY
    );

  if (!raw) {
    return null;
  }

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

    window.dispatchEvent(
      new CustomEvent(
        'auth-state-change',
        {
          detail: {
            user: null,
            isLoggedIn: false,
          },
        }
      )
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

  window.dispatchEvent(
    new CustomEvent(
      'auth-state-change',
      {
        detail: {
          user,
          isLoggedIn: true,
        },
      }
    )
  );
}

function logoutUser() {
  localStorage.removeItem(
    CURRENT_USER_KEY
  );

  localStorage.removeItem(
    TOKEN_KEY
  );

  window.dispatchEvent(
    new CustomEvent(
      'auth-state-change',
      {
        detail: {
          user: null,
          isLoggedIn: false,
        },
      }
    )
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
  // ==========================================================
  // SETTINGS
  // ==========================================================

  api,

  getBackendMode,

  setBackendMode,

  getApiUrl,

  // ==========================================================
  // AUTH
  // ==========================================================

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
  // LOGIN
  // ==========================================================

  async loginUser(
    email,
    password
  ) {
    if (!email || !password) {
      throw new Error(
        'Email and password are required.'
      );
    }

    try {
      const response =
        await api.post(
          '/auth/login',
          {
            email:
              String(email).trim(),

            password,
          }
        );

      const payload =
        unwrap(response) || {};

      if (!payload.user) {
        throw new Error(
          'Invalid login response - no user data.'
        );
      }

      const user =
        mapUserFromBackend(
          payload.user
        );

      if (!user) {
        throw new Error(
          'Failed to process user data.'
        );
      }

      setCurrentUser(
        user,
        payload.token
      );

      return user;
    } catch (error) {
      console.error(
        'Login error:',
        error
      );

      logoutUser();

      throw new Error(
        error?.response?.data
          ?.message ||
        error?.message ||
        'Login failed. Please check your credentials.'
      );
    }
  },

  // ==========================================================
  // REGISTER
  // ==========================================================

  async registerUser(
    payload
  ) {
    if (!payload) {
      throw new Error(
        'Registration data is required.'
      );
    }

    try {
      const role =
        mapRoleToBackend(
          payload.role ||
          'Guest'
        );

      const body = {
        fullName:
          payload.fullName ||
          payload.name ||
          '',

        name:
          payload.name ||
          payload.fullName ||
          '',

        email:
          payload.email ||
          '',

        phone:
          formatEthiopianPhone(
            payload.phone ||
            ''
          ),

        address:
          payload.address ||
          payload.residentialAddress ||
          '',

        residentialAddress:
          payload.residentialAddress ||
          payload.address ||
          '',

        idType:
          payload.idType ||
          '',

        idNumber:
          payload.idNumber ||
          '',

        password:
          payload.password ||
          '',

        role,
      };

      if (role === 'OWNER') {
        if (
          payload.guesthouseName
        ) {
          body.guesthouseName =
            payload.guesthouseName;
        }

        if (
          payload.guesthouseAddress
        ) {
          body.guesthouseAddress =
            payload.guesthouseAddress;
        }

        if (payload.city) {
          body.city =
            payload.city;
        }

        if (
          payload.description
        ) {
          body.guesthouseDescription =
            payload.description;
        }

        if (
          payload.guesthouseImage
        ) {
          body.guesthouseImage =
            payload.guesthouseImage;
        }
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
          ...(
            mapUserFromBackend(
              result.user
            ) || {}
          ),

          requiresApproval:
            Boolean(
              result.requiresApproval
            ),

          message:
            result.message ||
            '',

          guesthouse:
            result.guesthouse ||
            null,
        };
      }

      const user =
        mapUserFromBackend(
          result.user
        );

      if (user) {
        setCurrentUser(
          user,
          result.token
        );
      }

      return user;
    } catch (error) {
      console.error(
        'Registration error:',
        error
      );

      throw new Error(
        error?.response?.data
          ?.message ||
        error?.message ||
        'Registration failed. Please try again.'
      );
    }
  },

  // ==========================================================
  // UPDATE PROFILE
  // ==========================================================

  async updateProfile(
    data
  ) {
    if (!data) {
      throw new Error(
        'Profile data is required.'
      );
    }

    const currentUser =
      getCurrentUser();

    const role =
      String(
        currentUser?.role || ''
      ).toUpperCase();

    let endpoint =
      '/admin/profile';

    if (
      role === 'RECEPTIONIST'
    ) {
      endpoint =
        '/receptionist/profile';
    }

    if (role === 'OWNER') {
      endpoint =
        '/owner/profile';
    }

    if (role === 'GUEST') {
      endpoint =
        '/guest/profile';
    }

    const response =
      await api.put(
        endpoint,
        {
          fullName:
            data.fullName ??
            data.name ??
            '',

          email:
            data.email ?? '',

          phone:
            formatEthiopianPhone(
              data.phone ?? ''
            ),

          address:
            data.address ??
            data.residentialAddress ??
            '',

          ...(data.password?.trim()
            ? {
                password:
                  data.password.trim(),
              }
            : {}),
        }
      );

    const updatedUser =
      mapUserFromBackend(
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

  // ==========================================================
  // AUTH STATUS
  // ==========================================================

  async checkAuthStatus() {
    try {
      const response =
        await api.get(
          '/auth/status'
        );

      const data =
        unwrap(response);

      const user =
        data?.user
          ? mapUserFromBackend(
              data.user
            )
          : null;

      if (user) {
        setCurrentUser(user);

        return user;
      }

      return null;
    } catch (error) {
      if (
        error?.response?.status ===
        401
      ) {
        logoutUser();
      }

      return null;
    }
  },

  // ==========================================================
  // REFRESH TOKEN
  // ==========================================================

  async refreshToken() {
    try {
      const response =
        await api.post(
          '/auth/refresh-token'
        );

      const data =
        unwrap(response);

      if (data?.token) {
        localStorage.setItem(
          TOKEN_KEY,
          data.token
        );

        return data.token;
      }

      return null;
    } catch (error) {
      console.error(
        'Token refresh error:',
        error
      );

      logoutUser();

      return null;
    }
  },

  // ==========================================================
  // FORGOT PASSWORD
  // ==========================================================

  async forgotPassword(
    email
  ) {
    if (!email) {
      throw new Error(
        'Email is required.'
      );
    }

    const response =
      await api.post(
        '/auth/forgot-password',
        {
          email:
            String(email).trim(),
        }
      );

    return unwrap(response);
  },

  // ==========================================================
  // RESET PASSWORD
  // ==========================================================

  async resetPassword(
    token,
    newPassword
  ) {
    if (
      !token ||
      !newPassword
    ) {
      throw new Error(
        'Token and new password are required.'
      );
    }

    const response =
      await api.post(
        '/auth/reset-password',
        {
          token,
          newPassword,
        }
      );

    return unwrap(response);
  },

  // ==========================================================
  // VERIFY EMAIL
  // ==========================================================

  async verifyEmail(
    token
  ) {
    if (!token) {
      throw new Error(
        'Verification token is required.'
      );
    }

    const response =
      await api.post(
        '/auth/verify-email',
        {
          token,
        }
      );

    return unwrap(response);
  },

  // ==========================================================
  // USERS
  // ==========================================================

  async getAllUsers() {
    const response =
      await api.get(
        '/admin/users'
      );

    const users =
      unwrap(response) || [];

    return Array.isArray(users)
      ? users.map(
          mapUserFromBackend
        )
      : [];
  },

  async fetchAdminUsers() {
    return this.getAllUsers();
  },

  // ==========================================================
  // GUESTHOUSES
  // ==========================================================

  async getGuesthouses(
    filters = {}
  ) {
    try {
      console.log(
        '🔍 Fetching guesthouses:',
        filters
      );

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
          await api.get(
            '/rooms'
          );

        rooms =
          unwrap(
            roomsResponse
          ) || [];
      } catch (roomError) {
        console.warn(
          '⚠️ Could not fetch rooms:',
          roomError
        );

        rooms = [];
      }

      let list =
        Array.isArray(
          guesthouses
        )
          ? guesthouses
              .map(
                (guesthouse) =>
                  mapGuesthouseFromBackend(
                    guesthouse,
                    rooms
                  )
              )
              .filter(Boolean)
          : [];

      if (
        filters.city
      ) {
        list =
          list.filter(
            (guesthouse) =>
              String(
                guesthouse.city ||
                  ''
              ).toLowerCase() ===
              String(
                filters.city
              ).toLowerCase()
          );
      }

      if (
        filters.maxPrice !==
        undefined &&
        filters.maxPrice !==
        null &&
        filters.maxPrice !==
        ''
      ) {
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

      const approved =
        list.filter(
          (guesthouse) => {
            const status =
              String(
                guesthouse.status ||
                  ''
              ).toLowerCase();

            return (
              status ===
                'approved' ||
              status ===
                'verified'
            );
          }
        );

      console.log(
        `✅ Approved guesthouses: ${approved.length}`
      );

      return approved;
    } catch (error) {
      console.error(
        '❌ Error in getGuesthouses:',
        error
      );

      return [];
    }
  },

  // ==========================================================
  // GET GUESTHOUSE BY ID
  // ==========================================================

  async getGuesthouseById(
    id
  ) {
    if (!id) {
      throw new Error(
        'Guesthouse ID is required.'
      );
    }

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
        await api.get(
          '/rooms'
        );

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
    if (!data) {
      throw new Error(
        'Guesthouse data is required.'
      );
    }

    const payload = guesthouseFormData(
      {
        ...data,
        address: data.location || data.address,
      },
      'PENDING'
    );

    try {
      const response =
        await api.post(
          '/owner/guesthouse',
          payload
        );

      return mapGuesthouseFromBackend(
        unwrap(response)
      );
    } catch (ownerError) {
      console.warn(
        'POST /owner/guesthouse failed, trying /guesthouses:',
        ownerError
      );

      const response =
        await api.post(
          '/guesthouses',
          payload
        );

      return mapGuesthouseFromBackend(
        unwrap(response)
      );
    }
  },

  // ==========================================================
  // SAVE GUESTHOUSE DRAFT
  // ==========================================================

  async saveGuesthouseDraft(
    data
  ) {
    if (!data) {
      throw new Error(
        'Guesthouse data is required.'
      );
    }

    const payload = guesthouseFormData(
      {
        ...data,
        address: data.location || data.address,
      },
      'DRAFT'
    );

    const response =
      await api.put(
        '/owner/guesthouse',
        payload
      );

    return unwrap(response);
  },

  // ==========================================================
  // SUBMIT GUESTHOUSE FOR REVIEW
  // ==========================================================

  async submitGuesthouseForReview(
    data
  ) {
    if (!data) {
      throw new Error(
        'Guesthouse data is required.'
      );
    }

    const payload = guesthouseFormData(
      {
        ...data,
        address: data.location || data.address,
      },
      'PENDING'
    );

    const response =
      await api.put(
        '/owner/guesthouse/submit',
        payload
      );

    return unwrap(response);
  },

  // ==========================================================
  // UPDATE MY GUESTHOUSE
  // ==========================================================

 async updateMyGuesthouse(data) {
  if (!data) {
    throw new Error('Guesthouse data is required.');
  }

  const payload = guesthouseFormData({
    ...data,
    address: data.location || data.address,
  });

  const response = await api.put(
    '/owner/guesthouse',
    payload
  );

  return mapGuesthouseFromBackend(unwrap(response));
},
  // ==========================================================
  // RESUBMIT GUESTHOUSE
  // ==========================================================

  async resubmitGuesthouse(
    data
  ) {
    if (!data) {
      throw new Error(
        'Guesthouse data is required.'
      );
    }

    const response =
      await api.put(
        '/owner/guesthouse/resubmit',
        guesthouseFormData(
          {
            ...data,

            address:
              data.location ||
              data.address,
          },
          'PENDING'
        )
      );

    return unwrap(response);
  },

  // ==========================================================
  // GET MY GUESTHOUSE
  // ==========================================================

  async getMyGuesthouse() {
    try {
      const response =
        await api.get(
          '/owner/guesthouse'
        );

      const data =
        unwrap(response);

      if (!data) {
        return null;
      }

      if (
        typeof data === 'object' &&
        Object.keys(data).length === 0
      ) {
        return null;
      }

      if (!data.id) {
        return null;
      }

      let rooms = [];

      try {
        const roomsResponse =
          await api.get(
            `/rooms/guesthouse/${data.id}`
          );

        rooms =
          unwrap(
            roomsResponse
          ) || [];
      } catch (error) {
        console.warn(
          '⚠️ Could not fetch owner guesthouse rooms:',
          error
        );

        rooms = [];
      }

      return mapGuesthouseFromBackend(
        data,
        rooms
      );
    } catch (error) {
      console.error(
        '❌ Error in getMyGuesthouse:',
        error
      );

      if (
        error?.response?.status ===
        404
      ) {
        return null;
      }

      return null;
    }
  },

  // ==========================================================
  // ROOMS
  // ==========================================================

  async getRoomsForGuesthouse(
    guesthouseId
  ) {
    if (!guesthouseId) {
      throw new Error(
        'Guesthouse ID is required.'
      );
    }

    try {
      const response =
        await api.get(
          '/rooms'
        );

      const rooms =
        unwrap(response) || [];

      return Array.isArray(rooms)
        ? rooms
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
            )
            .filter(Boolean)
        : [];
    } catch (error) {
      console.error(
        '❌ Error fetching rooms:',
        error
      );

      return [];
    }
  },

  // ==========================================================
  // GET ROOM BY ID
  // ==========================================================

  async getRoomById(
    roomId
  ) {
    if (!roomId) {
      throw new Error(
        'Room ID is required.'
      );
    }

    const response =
      await api.get(
        `/rooms/${roomId}`
      );

    return mapRoomFromBackend(
      unwrap(response)
    );
  },

  // ==========================================================
  // ADD ROOM
  // ==========================================================

  async addRoom(
    roomData
  ) {
    if (!roomData?.guesthouseId) {
      throw new Error(
        'Guesthouse ID is required.'
      );
    }

    const response =
      await api.post(
        `/rooms/${roomData.guesthouseId}`,
        {
          roomNumber:
            roomData.roomNumber,

          roomType:
            String(
              roomData.roomType ||
              roomData.type ||
              'DOUBLE'
            ).toUpperCase(),

          price:
            Number(
              roomData.price ??
              roomData.pricePerNight ??
              0
            ),

          pricePerNight:
            Number(
              roomData.pricePerNight ??
              roomData.price ??
              0
            ),

          capacity:
            Number(
              roomData.capacity ||
              4
            ),

          maxGuests:
            Number(
              roomData.maxGuests ??
              roomData.capacity ??
              4
            ),

          available:
            roomData.available ??
            roomData.availabilityStatus !==
              'occupied',
        }
      );

    return mapRoomFromBackend(
      unwrap(response)
    );
  },
  // ==========================================================
  // ROOMS
  // ==========================================================

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
        available:
          normalizedStatus === "available",
      }
    );

    return mapRoomFromBackend(
      unwrap(response)
    );
  },

  async updateRoom(roomId, roomData) {
    if (!roomId) {
      throw new Error(
        "Room ID is required."
      );
    }

    const payload = {};

    if (
      roomData?.roomNumber !==
      undefined
    ) {
      payload.roomNumber = String(
        roomData.roomNumber
      );
    }

    if (
      roomData?.roomType ||
      roomData?.type
    ) {
      payload.roomType = String(
        roomData.roomType ||
        roomData.type
      ).toUpperCase();
    }

    if (
      roomData?.price !== undefined ||
      roomData?.pricePerNight !== undefined
    ) {
      payload.price =
        Number(
          roomData.price !== undefined
            ? roomData.price
            : roomData.pricePerNight
        );
    }

    if (
      roomData?.pricePerNight !== undefined &&
      roomData?.price === undefined
    ) {
      payload.pricePerNight =
        Number(roomData.pricePerNight);
    }

    if (
      roomData?.capacity !==
      undefined
    ) {
      payload.capacity =
        Number(roomData.capacity);
    }

    if (
      roomData?.maxGuests !==
      undefined
    ) {
      payload.maxGuests =
        Number(roomData.maxGuests);
    }

    if (
      roomData?.available !==
      undefined
    ) {
      payload.available =
        Boolean(roomData.available);
    }

    if (
      roomData?.availabilityStatus !==
      undefined
    ) {
      payload.available =
        String(
          roomData.availabilityStatus
        ).toLowerCase() === "available";
    }

    console.log(
      "========================================"
    );
    console.log(
      "API SERVICE - UPDATE ROOM"
    );
    console.log(
      "Room ID:",
      roomId
    );
    console.log(
      "Room payload:",
      payload
    );
    console.log(
      "========================================"
    );

    try {
      const response =
        await api.put(
          `/rooms/${roomId}`,
          payload
        );

      return mapRoomFromBackend(
        unwrap(response)
      );
    } catch (error) {
      console.error(
        "❌ Error updating room:",
        error
      );

      throw new Error(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to update room."
      );
    }
  },

  async deleteRoom(roomId) {
    if (!roomId) {
      throw new Error(
        "Room ID is required."
      );
    }

    const response =
      await api.delete(
        `/rooms/${roomId}`
      );

    return unwrap(response);
  },

  // ==========================================================
  // RESERVATIONS
  // ==========================================================

  async createReservation({
    guesthouseId,
    roomId,
    checkIn,
    checkOut,
    checkInDate,
    checkOutDate,
    numberOfGuests = 1,
    nightsCount,
    totalPrice,
    pricePerNight,
  }) {
    if (!roomId) {
      throw new Error(
        "Room ID is required."
      );
    }

    const finalCheckIn =
      checkInDate || checkIn;

    const finalCheckOut =
      checkOutDate || checkOut;

    if (!finalCheckIn) {
      throw new Error(
        "Check-in date is required."
      );
    }

    if (!finalCheckOut) {
      throw new Error(
        "Check-out date is required."
      );
    }

    const guestCount =
      Number(
        numberOfGuests || 1
      );

    if (guestCount < 1) {
      throw new Error(
        "Number of guests must be at least 1."
      );
    }

    const payload = {
      roomId:
        Number(roomId),

      checkIn:
        toIsoDateTime(
          finalCheckIn
        ),

      checkOut:
        toIsoDateTime(
          finalCheckOut
        ),

      numberOfGuests:
        guestCount,
    };

    console.log(
      "========================================"
    );
    console.log(
      "API SERVICE - CREATE RESERVATION"
    );
    console.log(
      "Reservation payload:",
      payload
    );
    console.log(
      "========================================"
    );

    try {
      const response =
        await api.post(
          "/reservations",
          payload
        );

      const reservation =
        unwrap(response);

      console.log(
        "Reservation created:",
        reservation
      );

      if (!reservation?.id) {
        throw new Error(
          "Reservation was not created. The server did not return a reservation ID."
        );
      }

      const mappedReservation =
        mapReservationFromBackend({
          ...reservation,

          guesthouseId:
            guesthouseId ??
            reservation.guesthouseId,

          numberOfGuests:
            guestCount,

          nightsCount:
            nightsCount ??
            calculateNights(
              finalCheckIn,
              finalCheckOut
            ),

          totalPrice:
            totalPrice ??
            reservation.totalPrice ??
            0,

          pricePerNight:
            pricePerNight ??
            reservation.pricePerNight ??
            0,
        });

      return {
        ...mappedReservation,

        raw:
          reservation,

        guesthouseId:
          guesthouseId ??
          reservation.guesthouseId,

        roomId:
          reservation.roomId ??
          Number(roomId),

        reservationId:
          reservation.id,
      };
    } catch (error) {
      console.error(
        "❌ Create reservation error:",
        error
      );

      throw new Error(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to create reservation."
      );
    }
  },

  async createBooking(data) {
    return this.createReservation(
      data
    );
  },

  async getReservationById(
    reservationId
  ) {
    if (!reservationId) {
      throw new Error(
        "Reservation ID is required."
      );
    }

    const response =
      await api.get(
        `/reservations/${reservationId}`
      );

    return mapReservationFromBackend(
      unwrap(response)
    );
  },

  async getReservation(
    reservationId
  ) {
    return this.getReservationById(
      reservationId
    );
  },

  async getReservationDetails(
    reservationId
  ) {
    return this.getReservationById(
      reservationId
    );
  },

  async getReservations(
    filters = {}
  ) {
    const response =
      await api.get(
        "/reservations"
      );

    const raw =
      unwrap(response) || [];

    let list =
      Array.isArray(raw)
        ? raw.map(
            mapReservationFromBackend
          )
        : [];

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

    if (filters.roomId) {
      list =
        list.filter(
          (reservation) =>
            String(
              reservation.roomId
            ) ===
            String(
              filters.roomId
            )
        );
    }

    return list;
  },

  // ==========================================================
  // PAYMENT
  // ==========================================================

  async initializePayment({
    reservationId,
    paymentMethod,
    method,
    amount,
    phone,
    bankName,
    accountNumber,
  }) {
    if (!reservationId) {
      throw new Error(
        "Reservation ID is required."
      );
    }

    const selectedMethod =
      mapPaymentMethodToBackend(
        paymentMethod || method
      );

    const payload = {
      reservationId:
        Number(reservationId),

      method:
        selectedMethod,

      amount:
        amount !== undefined
          ? Number(amount)
          : undefined,

      phone:
        formatEthiopianPhone(
          phone
        ),

      ...(bankName
        ? { bankName }
        : {}),

      ...(accountNumber
        ? { accountNumber }
        : {}),
    };

    Object.keys(payload).forEach(
      (key) => {
        if (
          payload[key] ===
          undefined
        ) {
          delete payload[key];
        }
      }
    );

    console.log(
      "========================================"
    );
    console.log(
      "API SERVICE - INITIALIZE PAYMENT"
    );
    console.log(
      "Payment payload:",
      payload
    );
    console.log(
      "========================================"
    );

    try {
      const response =
        await api.post(
          "/payments/initiate",
          payload
        );

      const data =
        unwrap(response);

      console.log(
        "Payment API response:",
        data
      );

      const checkoutUrl =
        data?.checkoutUrl ||
        data?.checkout_url ||
        data?.data?.checkoutUrl ||
        data?.data?.checkout_url ||
        data?.payment?.checkoutUrl ||
        data?.payment?.checkout_url ||
        null;

      const payment =
        data?.payment ||
        data;

      return {
        ...data,

        payment:
          mapPaymentFromBackend(
            payment
          ),

        checkoutUrl,

        checkout_url:
          checkoutUrl,

        message:
          data?.message ||
          "Payment request completed successfully.",
      };
    } catch (error) {
      console.error(
        "❌ Initialize payment error:",
        error
      );

      throw new Error(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Payment initialization failed."
      );
    }
  },

  async initiatePayment(
    payload
  ) {
    return this.initializePayment(
      payload
    );
  },

  async createPayment(
    payload
  ) {
    return this.initializePayment(
      payload
    );
  },

  async payReservation(
    payload
  ) {
    return this.initializePayment(
      payload
    );
  },

  // ==========================================================
  // CREATE BOOKING + PAYMENT
  // ==========================================================

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
    const reservation =
      await this.createReservation({
        guesthouseId,
        roomId,
        checkInDate,
        checkOutDate,
        nightsCount,
        numberOfGuests,
      });

    const payment =
      await this.initializePayment({
        reservationId:
          reservation.id ||
          reservation.reservationId,

        paymentMethod,

        phone,

        bankName,

        accountNumber,
      });

    return {
      reservation,

      payment:
        payment.payment ||
        payment,

      checkoutUrl:
        payment.checkoutUrl ||
        null,
    };
  },

  // ==========================================================
  // RECEPTIONIST
  // ==========================================================

  async getReceptionistDashboardStats() {
    const response =
      await api.get(
        "/receptionist/dashboard"
      );

    const stats =
      unwrap(response) || {};

    return {
      arrivals:
        stats.arrivals ?? 0,

      departures:
        stats.departures ?? 0,

      inHouse:
        stats.inHouse ?? 0,

      availableRooms:
        stats.availableRooms ?? 0,

      totalRooms:
        stats.totalRooms ?? 0,
    };
  },

  async getReceptionistGuesthouse() {
    try {
      const response =
        await api.get(
          "/receptionist/guesthouse"
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
        "⚠️ Receptionist guesthouse endpoint unavailable:",
        error?.message || error
      );

      return null;
    }
  },

  async searchReceptionistReservations(
    term
  ) {
    const response =
      await api.get(
        "/receptionist/reservations/search",
        {
          params: {
            term:
              term ?? "",
          },
        }
      );

    const list =
      unwrap(response) || [];

    return Array.isArray(list)
      ? list.map(
          mapReservationFromBackend
        )
      : [];
  },

  async getReceptionistArrivals(
    guesthouseId
  ) {
    const response =
      await api.get(
        "/receptionist/today-arrivals"
      );

    const list =
      unwrap(response) || [];

    const mapped =
      Array.isArray(list)
        ? list.map(
            mapReservationFromBackend
          )
        : [];

    if (!guesthouseId) {
      return mapped;
    }

    return mapped.filter(
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
        "/receptionist/today-departures"
      );

    const list =
      unwrap(response) || [];

    const mapped =
      Array.isArray(list)
        ? list.map(
            mapReservationFromBackend
          )
        : [];

    if (!guesthouseId) {
      return mapped;
    }

    return mapped.filter(
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
        "/receptionist/in-house"
      );

    const list =
      unwrap(response) || [];

    const mapped =
      Array.isArray(list)
        ? list.map(
            mapReservationFromBackend
          )
        : [];

    if (!guesthouseId) {
      return mapped;
    }

    return mapped.filter(
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
        "/receptionist/reservations"
      );

    const list =
      unwrap(response) || [];

    const mapped =
      Array.isArray(list)
        ? list.map(
            mapReservationFromBackend
          )
        : [];

    if (!guesthouseId) {
      return mapped;
    }

    return mapped.filter(
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
        "/receptionist/rooms"
      );

    const list =
      unwrap(response) || [];

    const mapped =
      Array.isArray(list)
        ? list.map(
            mapRoomFromBackend
          )
        : [];

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
        "Room ID is required."
      );
    }

    const normalizedStatus =
      String(status || "")
        .toLowerCase()
        .trim();

    const allowedStatuses = [
      "available",
      "unavailable",
      "cleaning",
      "maintenance",
    ];

    if (
      !allowedStatuses.includes(
        normalizedStatus
      )
    ) {
      throw new Error(
        `Invalid room status: ${status}`
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
            "available",
        }
      );

    return mapRoomFromBackend(
      unwrap(response)
    );
  },

  async performCheckIn(
    reservationId
  ) {
    if (!reservationId) {
      throw new Error(
        "Reservation ID is required."
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

  async checkInGuest(
    reservationId
  ) {
    return this.performCheckIn(
      reservationId
    );
  },

  async performCheckOut(
    reservationId
  ) {
    if (!reservationId) {
      throw new Error(
        "Reservation ID is required."
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

  async checkOutGuest(
    reservationId
  ) {
    return this.performCheckOut(
      reservationId
    );
  },

  async deleteReceptionistReservation(
    reservationId
  ) {
    if (!reservationId) {
      throw new Error(
        "Reservation ID is required."
      );
    }

    const response =
      await api.delete(
        `/receptionist/reservations/${reservationId}`
      );

    return unwrap(response);
  },

  // ==========================================================
  // OWNER
  // ==========================================================

  async getMyGuesthouse() {
    try {
      const response =
        await api.get(
          "/owner/guesthouse"
        );

      const data =
        unwrap(response);

      if (!data || !data.id) {
        return null;
      }

      let rooms = [];

      try {
        const roomsRes =
          await api.get(
            `/rooms/guesthouse/${data.id}`
          );

        rooms =
          unwrap(roomsRes) || [];
      } catch (roomError) {
        console.warn(
          "⚠️ Could not load owner guesthouse rooms:",
          roomError?.message ||
            roomError
        );

        rooms = [];
      }

      return mapGuesthouseFromBackend(
        data,
        rooms
      );
    } catch (error) {
      console.warn(
        "⚠️ Primary owner guesthouse endpoint failed:",
        error?.message || error
      );

      try {
        const fallbackRes =
          await api.get(
            "/guesthouses/owner/me"
          );

        const data =
          unwrap(fallbackRes);

        if (!data) {
          return null;
        }

        return mapGuesthouseFromBackend(
          data
        );
      } catch (fallbackError) {
        console.error(
          "❌ Could not load owner guesthouse:",
          fallbackError
        );

        return null;
      }
    }
  },

  async updateMyGuesthouse(
    data
  ) {
    const response =
      await api.put(
        "/owner/guesthouse",
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
      console.warn(
        "⚠️ getOwnerReceptionists: No guesthouseId provided"
      );
    }

    try {
      const response =
        await api.get(
          "/owner/receptionists"
        );

      const staff =
        unwrap(response) || [];

      return Array.isArray(staff)
        ? staff.map(
            mapUserFromBackend
          )
        : [];
    } catch (error) {
      console.error(
        "❌ Error fetching staff:",
        error
      );

      return [];
    }
  },

  async registerReceptionist(
    staffData
  ) {
    const response =
      await api.post(
        "/owner/receptionists",
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
            "Reception@123",
        }
      );

    return mapUserFromBackend(
      unwrap(response)
    );
  },

  async removeReceptionistFromGuesthouse(
    staffId
  ) {
    if (!staffId) {
      throw new Error(
        "Staff ID is required."
      );
    }

    const response =
      await api.delete(
        `/owner/receptionists/${staffId}`
      );

    return unwrap(response);
  },

  async assignReceptionistToGuesthouse(
    staffId
  ) {
    if (!staffId) {
      throw new Error(
        "Staff ID is required."
      );
    }

    const response =
      await api.post(
        "/owner/receptionists/assign",
        {
          staffId:
            Number(staffId),
        }
      );

    return unwrap(response);
  },

  // ==========================================================
  // OWNER DASHBOARD
  // ==========================================================

  async getOwnerDashboardStats() {
    const response =
      await api.get(
        "/dashboard/owner"
      );

    return unwrap(response) || {};
  },

  async getOwnerDashboardRevenue() {
    const response =
      await api.get(
        "/dashboard/owner/revenue"
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
            data.breakdown?.telebirr ??
            0
          ),

        chapa:
          Number(
            data.breakdown?.chapa ??
            0
          ),

        bank_transfer:
          Number(
            data.breakdown?.bank_transfer ??
            0
          ),
      },
    };
  },

  async getOwnerDashboardMonthlyRevenue() {
    const response =
      await api.get(
        "/dashboard/owner/monthly-revenue"
      );

    return unwrap(response) || [];
  },

  async getOwnerDashboardRecentReservations() {
    try {
      const reservationResponse =
        await api.get(
          "/dashboard/owner/recent-reservations"
        );

      const reservationList =
        unwrap(
          reservationResponse
        ) || [];

      const paymentResponse =
        await api.get(
          "/dashboard/owner/recent-payments"
        );

      const paymentList =
        unwrap(
          paymentResponse
        ) || [];

      const payments =
        Array.isArray(paymentList)
          ? paymentList.map(
              mapPaymentFromBackend
            )
          : [];

      if (
        !Array.isArray(
          reservationList
        )
      ) {
        return [];
      }

      return reservationList.map(
        (reservation) => {
          const payment =
            payments.find(
              (p) =>
                String(
                  p.reservationId
                ) ===
                String(
                  reservation.id
                )
            );

          return mapReservationFromBackend(
            {
              ...reservation,

              payment:
                payment
                  ? {
                      id:
                        payment.id,

                      reservationId:
                        payment.reservationId,

                      amount:
                        payment.amount,

                      method:
                        payment.method,

                      status:
                        payment.status,

                      referenceNumber:
                        payment.referenceNumber,

                      createdAt:
                        payment.createdAt,
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
                "pending",
            }
          );
        }
      );
    } catch (error) {
      console.error(
        "❌ Error fetching owner reservations:",
        error
      );

      return [];
    }
  },

  async getOwnerDashboardRecentPayments() {
    try {
      const response =
        await api.get(
          "/dashboard/owner/recent-payments"
        );

      const list =
        unwrap(response) || [];

      return Array.isArray(list)
        ? list.map(
            mapPaymentFromBackend
          )
        : [];
    } catch (error) {
      console.error(
        "❌ Error fetching recent owner payments:",
        error
      );

      return [];
    }
  },

  async getOwnerPayments(
    guesthouseId
  ) {
    try {
      const response =
        await api.get(
          "/dashboard/owner/recent-payments"
        );

      const payments =
        unwrap(response) || [];

      const mapped =
        Array.isArray(payments)
          ? payments.map(
              mapPaymentFromBackend
            )
          : [];

      if (!guesthouseId) {
        return mapped;
      }

      return mapped.filter(
        (payment) =>
          String(
            payment.guesthouseId
          ) ===
          String(
            guesthouseId
          )
      );
    } catch (error) {
      console.error(
        "❌ Error fetching owner payments:",
        error
      );

      return [];
    }
  },

  async getOwnerRevenueReport(
    guesthouseId
  ) {
    if (!guesthouseId) {
      console.warn(
        "⚠️ getOwnerRevenueReport: No guesthouseId provided"
      );

      return {
        totalRevenue: 0,

        totalTransactions: 0,

        paymentMethodBreakdown: {
          telebirr: 0,
          chapa: 0,
          bank_transfer: 0,
          card: 0,
        },

        occupancyRate: 0,
      };
    }

    try {
      const response =
        await api.get(
          "/dashboard/owner/revenue"
        );

      const data =
        unwrap(response) || {};

      const payments =
        await this.getOwnerPayments(
          guesthouseId
        );

      const telebirr =
        Number(
          data.breakdown?.telebirr ??
          payments
            .filter(
              (p) =>
                p.method ===
                "telebirr"
            )
            .reduce(
              (sum, p) =>
                sum +
                Number(
                  p.amount || 0
                ),
              0
            )
        );

      const chapa =
        Number(
          data.breakdown?.chapa ??
          payments
            .filter(
              (p) =>
                p.method ===
                  "chapa" ||
                p.method ===
                  "card"
            )
            .reduce(
              (sum, p) =>
                sum +
                Number(
                  p.amount || 0
                ),
              0
            )
        );

      const bankTransfer =
        Number(
          data.breakdown?.bank_transfer ??
          payments
            .filter(
              (p) =>
                p.method ===
                  "bank_transfer" ||
                p.method ===
                  "cbe_birr"
            )
            .reduce(
              (sum, p) =>
                sum +
                Number(
                  p.amount || 0
                ),
              0
            )
        );

      const calculatedRevenue =
        telebirr +
        chapa +
        bankTransfer;

      return {
        totalRevenue:
          Number(
            data.totalRevenue ??
            calculatedRevenue
          ),

        totalTransactions:
          payments.length,

        paymentMethodBreakdown: {
          telebirr,

          chapa,

          bank_transfer:
            bankTransfer,

          card:
            chapa,
        },

        occupancyRate:
          Number(
            data.occupancyRate ?? 0
          ),
      };
    } catch (error) {
      console.error(
        "❌ Error fetching revenue report:",
        error
      );

      return {
        totalRevenue: 0,

        totalTransactions: 0,

        paymentMethodBreakdown: {
          telebirr: 0,
          chapa: 0,
          bank_transfer: 0,
          card: 0,
        },

        occupancyRate: 0,
      };
    }
  },

  // ==========================================================
  // REVIEWS
  // ==========================================================

  async getOwnerReviews() {
    try {
      console.log(
        "🔍 Fetching owner reviews..."
      );

      const response =
        await api.get(
          "/reviews/owner-reviews"
        );

      const data =
        unwrap(response);

      console.log(
        "📝 Owner reviews data:",
        data
      );

      if (!data) {
        return [];
      }

      if (Array.isArray(data)) {
        return data;
      }

      if (
        Array.isArray(
          data.reviews
        )
      ) {
        return data.reviews;
      }

      return [];
    } catch (error) {
      console.error(
        "❌ Error fetching owner reviews:",
        error
      );

      return [];
    }
  },

  async getGuesthouseReviews(
    guesthouseId
  ) {
    if (!guesthouseId) {
      throw new Error(
        "Guesthouse ID is required."
      );
    }

    try {
      console.log(
        "🔍 Fetching reviews for guesthouse:",
        guesthouseId
      );

      const response =
        await api.get(
          `/reviews/guesthouse/${guesthouseId}`
        );

      const data =
        unwrap(response);

      if (!data) {
        return [];
      }

      if (Array.isArray(data)) {
        return data;
      }

      if (
        Array.isArray(
          data.reviews
        )
      ) {
        return data.reviews;
      }

      return [];
    } catch (error) {
      console.error(
        "❌ Error fetching guesthouse reviews:",
        error
      );

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
      throw new Error(
        "Guesthouse ID is required."
      );
    }

    if (!reservationId) {
      throw new Error(
        "Reservation ID is required."
      );
    }

    if (
      rating ===
      undefined ||
      rating ===
      null ||
      rating === ""
    ) {
      throw new Error(
        "Rating is required."
      );
    }

    const numericRating =
      Number(rating);

    if (
      !Number.isFinite(
        numericRating
      ) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      throw new Error(
        "Rating must be between 1 and 5."
      );
    }

    if (
      !comment ||
      !String(comment).trim()
    ) {
      throw new Error(
        "Please write a review before submitting."
      );
    }

    try {
      console.log(
        "📝 Creating review for reservation:",
        reservationId
      );

      const response =
        await api.post(
          "/reviews",
          {
            guesthouseId:
              Number(
                guesthouseId
              ),

            reservationId:
              Number(
                reservationId
              ),

            rating:
              numericRating,

            comment:
              String(
                comment
              ).trim(),
          }
        );

      const data =
        unwrap(response);

      console.log(
        "✅ Review created:",
        data
      );

      return data;
    } catch (error) {
      console.error(
        "❌ Error creating review:",
        error
      );

      throw new Error(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to submit review. Please try again."
      );
    }
  },

  async getReviewForReservation(
    reservationId
  ) {
    if (!reservationId) {
      throw new Error(
        "Reservation ID is required."
      );
    }

    try {
      const response =
        await api.get(
          `/reviews/reservation/${reservationId}`
        );

      const data =
        unwrap(response);

      return data || null;
    } catch (error) {
      if (
        error?.response?.status ===
        404
      ) {
        return null;
      }

      console.error(
        "❌ Error fetching review for reservation:",
        error
      );

      return null;
    }
  },

  async updateReview(
    reviewId,
    {
      rating,
      comment,
    }
  ) {
    if (!reviewId) {
      throw new Error(
        "Review ID is required."
      );
    }

    const numericRating =
      Number(rating);

    if (
      !Number.isFinite(
        numericRating
      ) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      throw new Error(
        "Rating must be between 1 and 5."
      );
    }

    try {
      const response =
        await api.put(
          `/reviews/${reviewId}`,
          {
            rating:
              numericRating,

            comment:
              String(
                comment || ""
              ).trim(),
          }
        );

      return unwrap(response);
    } catch (error) {
      console.error(
        "❌ Error updating review:",
        error
      );

      throw new Error(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to update review."
      );
    }
  },

  async deleteReview(
    reviewId
  ) {
    if (!reviewId) {
      throw new Error(
        "Review ID is required."
      );
    }

    try {
      const response =
        await api.delete(
          `/reviews/${reviewId}`
        );

      return unwrap(response);
    } catch (error) {
      console.error(
        "❌ Error deleting review:",
        error
      );

      throw new Error(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to delete review."
      );
    }
  },

  async respondToReview(
    reviewId,
    responseText
  ) {
    if (!reviewId) {
      throw new Error(
        "Review ID is required."
      );
    }

    if (
      !responseText ||
      !String(responseText).trim()
    ) {
      throw new Error(
        "Response text is required."
      );
    }

    if (
      String(
        responseText
      ).trim().length < 10
    ) {
      throw new Error(
        "Response must be at least 10 characters long."
      );
    }

    try {
      console.log(
        "📝 Submitting response for review:",
        reviewId
      );

      const response =
        await api.put(
          `/reviews/${reviewId}/respond`,
          {
            response:
              String(
                responseText
              ).trim(),
          }
        );

      const data =
        unwrap(response);

      console.log(
        "✅ Review response submitted:",
        data
      );

      return data;
    } catch (error) {
      console.error(
        "❌ Error responding to review:",
        error
      );

      throw new Error(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to submit response. Please try again."
      );
    }
  },

  // ==========================================================
  // ADMIN
  // ==========================================================

  async deleteGuesthouse(id) {
    if (!id) {
      throw new Error(
        "Guesthouse ID is required."
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
        "/dashboard"
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

      totalRevenue: Number(stats.totalRevenue ?? 0),
      grossRevenue: Number(stats.grossRevenue ?? stats.totalRevenue ?? 0),
      commissionRate: Number(stats.commissionRate ?? 10),
      commissionRevenue: Number(stats.commissionRevenue ?? 0),
      ownerPayouts: Number(stats.ownerPayouts ?? 0),

      totalUsers:
        Number(
          stats.totalUsers ??
          0
        ),
    };
  },

  async downloadAdminBackup() {
    const response = await api.get('/admin/backup');
    return unwrap(response);
  },

  async restoreAdminBackup(backup) {
    const response = await api.post('/admin/backup/restore', backup);
    return unwrap(response);
  },

  async getAdminPendingGuesthouses() {
    const response =
      await api.get(
        "/guesthouses/pending"
      );

    const guesthouses =
      unwrap(response) || [];

    return Array.isArray(
      guesthouses
    )
      ? guesthouses
          .map(
            (guesthouse) =>
              mapGuesthouseFromBackend(
                guesthouse
              )
          )
          .filter(Boolean)
      : [];
  },

  async getAdminGuesthouses() {
    const response =
      await api.get(
        "/admin/guesthouses"
      );

    const guesthouses =
      unwrap(response) || [];

    return Array.isArray(
      guesthouses
    )
      ? guesthouses
          .map(
            (guesthouse) =>
              mapGuesthouseFromBackend(
                guesthouse
              )
          )
          .filter(Boolean)
      : [];
  },

  async fetchAdminGuesthouses() {
    return this.getAdminGuesthouses();
  },

  async deleteUser(id) {
    if (!id) {
      throw new Error(
        "User ID is required."
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
        "User ID is required."
      );
    }

    const response =
      await api.patch(
        `/admin/users/${userId}/role`,
        {
          role:
            String(
              role
            ).toUpperCase(),
        }
      );

    return mapUserFromBackend(
      unwrap(response)
    );
  },

  async rejectGuesthouse(
    id,
    reason =
      "Does not meet platform standards"
  ) {
    if (!id) {
      throw new Error(
        "Guesthouse ID is required."
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
    if (!id) {
      throw new Error(
        "Guesthouse ID is required."
      );
    }

    const response =
      await api.put(
        `/admin/guesthouses/${id}/approve`
      );

    return mapGuesthouseFromBackend(
      unwrap(response)
    );
  },

  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================

  async getNotifications() {
    try {
      const response =
        await api.get(
          "/notifications"
        );

      const rawList =
        unwrap(response) || [];

      const list = Array.isArray(
        rawList
      )
        ? rawList
            .map(
              mapNotificationFromBackend
            )
            .filter(Boolean)
        : [];

      if (list.length > 0) {
        const currentUser = getCurrentUser();
        if (currentUser) {
          localStorage.setItem(
            `gh_notifications:${currentUser.id || currentUser.email || 'guest'}`,
            JSON.stringify(list)
          );
        }
      }

      return list;
    } catch (error) {
      console.warn(
        "Failed to fetch notifications:",
        error?.message || error
      );

      const currentUser = getCurrentUser();
      const storageKey = currentUser
        ? `gh_notifications:${currentUser.id || currentUser.email || 'guest'}`
        : null;

      if (!storageKey) {
        return [];
      }

      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
        return Array.isArray(saved) ? saved : [];
      } catch {
        return [];
      }
    }
  },

  async getUnreadNotifications() {
    try {
      const response =
        await api.get(
          "/notifications/unread"
        );

      const rawList =
        unwrap(response) || [];

      return Array.isArray(
        rawList
      )
        ? rawList
            .map(
              mapNotificationFromBackend
            )
            .filter(Boolean)
        : [];
    } catch (error) {
      console.warn(
        "Failed to fetch unread notifications:",
        error?.message || error
      );

      return [];
    }
  },

  async getUnreadNotificationCount() {
    try {
      const response =
        await api.get(
          "/notifications/count"
        );

      const data =
        unwrap(response);

      if (
        typeof data?.count ===
        "number"
      ) {
        return data.count;
      }

      const unread =
        await this.getUnreadNotifications();

      return unread.length;
    } catch (error) {
      console.warn(
        "Failed to fetch unread notification count:",
        error?.message || error
      );

      return 0;
    }
  },

  async markNotificationAsRead(
    id
  ) {
    if (!id) {
      return null;
    }

    const response =
      await api.patch(
        `/notifications/${id}/read`
      );

    return mapNotificationFromBackend(
      unwrap(response)
    );
  },

  async markAllNotificationsAsRead() {
    const response =
      await api.patch(
        "/notifications/read-all"
      );

    return unwrap(response);
  },

  async deleteNotification(
    id
  ) {
    if (!id) {
      return null;
    }

    const response =
      await api.delete(
        `/notifications/${id}`
      );

    return unwrap(response);
  },

  async deleteAllNotifications() {
    const response =
      await api.delete(
        "/notifications"
      );

    return unwrap(response);
  },
};

// ============================================================
// NOTIFICATION MAPPING
// ============================================================

function mapNotificationFromBackend(
  notification
) {
  if (!notification) {
    return null;
  }

  const title =
    String(
      notification.title || ""
    ).trim();

  const message =
    String(
      notification.message || ""
    ).trim();

  const lowerTitle =
    title.toLowerCase();

  const lowerMessage =
    message.toLowerCase();

  let category =
    "system";

  if (
    lowerTitle.includes(
      "payment"
    ) ||
    lowerTitle.includes(
      "chapa"
    ) ||
    lowerTitle.includes(
      "telebirr"
    ) ||
    lowerMessage.includes(
      "payment"
    ) ||
    lowerMessage.includes(
      "paid"
    )
  ) {
    category =
      "payment";
  } else if (
    lowerTitle.includes(
      "reservation"
    ) ||
    lowerTitle.includes(
      "booking"
    ) ||
    lowerTitle.includes(
      "check-in"
    ) ||
    lowerTitle.includes(
      "check-out"
    ) ||
    lowerTitle.includes(
      "checked in"
    ) ||
    lowerTitle.includes(
      "checked out"
    ) ||
    lowerMessage.includes(
      "reservation"
    ) ||
    lowerMessage.includes(
      "booking"
    )
  ) {
    category =
      "reservation";
  } else if (
    lowerTitle.includes(
      "review"
    ) ||
    lowerMessage.includes(
      "review"
    ) ||
    lowerMessage.includes(
      "rating"
    )
  ) {
    category =
      "review";
  } else if (
    lowerTitle.includes(
      "guesthouse"
    ) ||
    lowerTitle.includes(
      "staff"
    ) ||
    lowerTitle.includes(
      "property"
    ) ||
    lowerMessage.includes(
      "guesthouse"
    )
  ) {
    category =
      "guesthouse";
  }

  return {
    id:
      notification.id,

    title:
      notification.title ||
      "Notification",

    message:
      notification.message ||
      "",

    isRead:
      Boolean(
        notification.isRead ??
        notification.read
      ),

    category,

    createdAt:
      notification.createdAt ||
      new Date().toISOString(),

    updatedAt:
      notification.updatedAt ||
      new Date().toISOString(),
  };
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default ApiService;