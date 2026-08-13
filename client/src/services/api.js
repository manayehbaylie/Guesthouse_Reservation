import axios from 'axios';
import { INITIAL_GUESTHOUSES, INITIAL_ROOMS, INITIAL_RESERVATIONS, INITIAL_USERS, INITIAL_PAYMENTS } from '../data/mockData.js';

// ─── Backend / Mock configuration ───────────────────────────────────────────
const BACKEND_MODE_KEY = 'gh_backend_mode';
const API_URL_KEY = 'gh_api_url';
const DEFAULT_MODE = import.meta.env.VITE_DEFAULT_BACKEND_MODE || 'api';
const DEFAULT_API_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const FALLBACK_ENABLED = import.meta.env.VITE_API_FALLBACK !== 'false';
const DEFAULT_PASSWORD = import.meta.env.VITE_DEFAULT_PASSWORD || 'Password123';

let backendCircuitOpen = false;

function openBackendCircuit(reason) {
  if (!backendCircuitOpen) {
    backendCircuitOpen = true;
    console.warn(`[ApiService] Backend unavailable (${reason}). Using mock data for this session.`);
  }
}

function hasBackendAuth() {
  const token = localStorage.getItem('token');
  return Boolean(token && !token.startsWith('jwt_token_'));
}

function syncApiBaseUrl() {
  api.defaults.baseURL = getApiUrl();
}

export function getBackendMode() {
  return localStorage.getItem(BACKEND_MODE_KEY) || DEFAULT_MODE;
}

export function getApiUrl() {
  return localStorage.getItem(API_URL_KEY) || DEFAULT_API_URL;
}

export function setBackendMode(mode, apiUrl = DEFAULT_API_URL) {
  localStorage.setItem(BACKEND_MODE_KEY, mode);
  localStorage.setItem(API_URL_KEY, apiUrl);
  backendCircuitOpen = false;
  syncApiBaseUrl();
}

function shouldUseBackend() {
  return getBackendMode() === 'api' && !backendCircuitOpen;
}

async function withBackendFallback(label, apiFn, mockFn) {
  if (!shouldUseBackend()) {
    return mockFn();
  }
  try {
    return await apiFn();
  } catch (error) {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || error.message || 'Request failed';

    if (!status || status >= 500) {
      openBackendCircuit(message);
    }

    console.warn(`[ApiService] ${label} failed (${message}). Using mock fallback.`);
    if (!FALLBACK_ENABLED) {
      throw error;
    }
    return mockFn();
  }
}

async function fetchRoomsSafely() {
  try {
    const roomsResponse = await api.get('/rooms');
    return (unwrap(roomsResponse) || []).map(mapRoomFromBackend);
  } catch {
    return [];
  }
}

function unwrap(response) {
  return response?.data?.data ?? response?.data;
}

function mapRoleFromBackend(role) {
  if (!role) return 'Guest';
  const normalized = String(role).toUpperCase();
  const map = { GUEST: 'Guest', OWNER: 'Owner', RECEPTIONIST: 'Receptionist', ADMIN: 'Admin' };
  return map[normalized] || role;
}

function mapRoleToBackend(role) {
  if (!role) return 'GUEST';
  const map = { Guest: 'GUEST', Owner: 'OWNER', Receptionist: 'RECEPTIONIST', Admin: 'ADMIN' };
  return map[role] || String(role).toUpperCase();
}

function mapUserFromBackend(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.fullName || user.name,
    email: user.email,
    phone: user.phone,
    role: mapRoleFromBackend(user.role),
    guesthouseId: user.guesthouseId ?? null,
    createdAt: user.createdAt,
  };
}

function mapGuesthouseStatus(status) {
  if (!status) return 'pending';
  return String(status).toLowerCase();
}

function mapGuesthouseFromBackend(gh, rooms = []) {
  const ghRooms = rooms.filter((r) => String(r.guesthouseId) === String(gh.id));
  const prices = ghRooms.map((r) => Number(r.pricePerNight ?? r.price ?? 0)).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) : 1500;
  const maxPrice = prices.length ? Math.max(...prices) : 4000;

  return {
    id: gh.id,
    ownerId: gh.ownerId,
    name: gh.name,
    description: gh.description || '',
    location: gh.location || gh.address || '',
    city: gh.city,
    address: gh.address || gh.location || '',
    phone: gh.phone || '',
    email: gh.email || '',
    status: mapGuesthouseStatus(gh.status),
    images: gh.images || (gh.image ? [gh.image] : []),
    amenities: gh.amenities || [],
    rating: gh.rating ?? 4.5,
    reviewCount: gh.reviewCount ?? 0,
    createdAt: gh.createdAt,
    priceRange: { min: minPrice, max: maxPrice },
  };
}

function mapRoomFromBackend(room) {
  return {
    id: room.id,
    guesthouseId: room.guesthouseId,
    roomNumber: room.roomNumber,
    type: room.type || room.roomType,
    capacity: room.capacity,
    pricePerNight: Number(room.pricePerNight ?? room.price ?? 0),
    availabilityStatus: room.availabilityStatus ?? (room.available === false ? 'occupied' : 'available'),
  };
}

function mapReservationStatus(status) {
  if (!status) return 'pending';
  return String(status).toLowerCase();
}

function mapReservationFromBackend(res) {
  const room = res.room || {};
  const guesthouse = room.guesthouse || {};
  const guest = res.guest || {};
  const checkIn = res.checkInDate || res.checkIn;
  const checkOut = res.checkOutDate || res.checkOut;

  return {
    id: res.id,
    guesthouseId: res.guesthouseId || guesthouse.id || room.guesthouseId,
    guesthouseName: res.guesthouseName || guesthouse.name || '',
    guesthouseLocation: res.guesthouseLocation || guesthouse.address || '',
    roomId: res.roomId || room.id,
    roomNumber: res.roomNumber || room.roomNumber || '',
    roomType: res.roomType || room.roomType || room.type || '',
    guestId: res.guestId || guest.id,
    guestName: res.guestName || guest.fullName || guest.name || '',
    guestPhone: res.guestPhone || guest.phone || '',
    checkInDate: checkIn ? String(checkIn).slice(0, 10) : '',
    checkOutDate: checkOut ? String(checkOut).slice(0, 10) : '',
    nightsCount: res.nightsCount,
    totalPrice: Number(res.totalPrice ?? res.payment?.amount ?? room.price ?? 0),
    paymentStatus: res.paymentStatus || (res.payment?.status === 'PAID' ? 'paid' : 'pending'),
    status: mapReservationStatus(res.status),
    createdAt: res.createdAt,
  };
}

function mapPaymentFromBackend(payment) {
  return {
    id: payment.id,
    reservationId: payment.reservationId,
    guesthouseId: payment.guesthouseId || payment.reservation?.room?.guesthouseId,
    guestName: payment.guestName || payment.reservation?.guest?.fullName || '',
    amount: Number(payment.amount ?? 0),
    method: String(payment.method || payment.paymentMethod || 'telebirr').toLowerCase(),
    referenceNumber: payment.referenceNumber || `REF-${payment.id}`,
    status: String(payment.status || 'completed').toLowerCase(),
    createdAt: payment.createdAt,
  };
}

function mapPaymentMethodToBackend(method) {
  const map = { telebirr: 'TELEBIRR', chapa: 'CARD', card: 'CARD', cash: 'CASH', bank: 'BANK' };
  return map[String(method || 'telebirr').toLowerCase()] || 'TELEBIRR';
}

function toIsoDateTime(dateStr) {
  if (!dateStr) return new Date().toISOString();
  if (dateStr.includes('T')) return dateStr;
  return `${dateStr}T12:00:00.000Z`;
}

// Axios Instance with JWT Interceptor
export const api = axios.create({
  baseURL: DEFAULT_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

syncApiBaseUrl();

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export async function checkBackendHealth() {
  try {
    const response = await api.get('/health');
    const data = response.data;
    return data?.success === true || data?.status === 'ok';
  } catch {
    return false;
  }
}

// Database initialization & Persistence Helper
const STORAGE_KEYS = {
  GUESTHOUSES: 'gh_db_guesthouses_v2',
  ROOMS: 'gh_db_rooms_v2',
  RESERVATIONS: 'gh_db_reservations_v2',
  USERS: 'gh_db_users_v2',
  PAYMENTS: 'gh_db_payments_v2',
  CURRENT_USER: 'gh_current_user_v2',
  TOKEN: 'token',
};

export function initDatabase() {
  if (!localStorage.getItem(STORAGE_KEYS.GUESTHOUSES)) {
    localStorage.setItem(STORAGE_KEYS.GUESTHOUSES, JSON.stringify(INITIAL_GUESTHOUSES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ROOMS)) {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(INITIAL_ROOMS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.RESERVATIONS)) {
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(INITIAL_RESERVATIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
    localStorage.setItem(STORAGE_KEYS.TOKEN, 'jwt_token_sample_guest_1');
  }
}

function getStoredData(key) {
  initDatabase();
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function setStoredData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

const MockService = {
  getCurrentUser() {
    initDatabase();
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : INITIAL_USERS[0];
  },

  setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.TOKEN, `jwt_token_${user.id}`);
    }
  },

  getAllUsers() {
    return getStoredData(STORAGE_KEYS.USERS);
  },

  async loginUser(email) {
    const users = getStoredData(STORAGE_KEYS.USERS);
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('User account not found with this email.');
    }
    this.setCurrentUser(user);
    return user;
  },

  async registerUser({ name, email, phone, role, guesthouseId }) {
    const users = getStoredData(STORAGE_KEYS.USERS);
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account already exists with this email address.');
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      name,
      email,
      phone,
      role: role || 'Guest',
      guesthouseId: guesthouseId || null,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    setStoredData(STORAGE_KEYS.USERS, users);
    this.setCurrentUser(newUser);
    return newUser;
  },

  async getGuesthouses(filters = {}) {
    let list = getStoredData(STORAGE_KEYS.GUESTHOUSES);
    const rooms = getStoredData(STORAGE_KEYS.ROOMS);

    if (filters.city) {
      list = list.filter((g) => g.city.toLowerCase() === filters.city.toLowerCase());
    }

    list = list.map((gh) => {
      const ghRooms = rooms.filter((r) => r.guesthouseId === gh.id);
      const prices = ghRooms.map((r) => r.pricePerNight);
      const minPrice = prices.length ? Math.min(...prices) : 1500;
      const maxPrice = prices.length ? Math.max(...prices) : 4000;
      return {
        ...gh,
        priceRange: { min: minPrice, max: maxPrice },
      };
    });

    if (filters.maxPrice) {
      list = list.filter((gh) => gh.priceRange.min <= filters.maxPrice);
    }

    return list;
  },

  async getGuesthouseById(id) {
    const list = await this.getGuesthouses();
    return list.find((g) => String(g.id) === String(id)) || null;
  },

  async registerGuesthouse(data) {
    const list = getStoredData(STORAGE_KEYS.GUESTHOUSES);
    const newGh = {
      id: `gh-${Date.now()}`,
      name: data.name,
      city: data.city,
      location: data.location,
      description: data.description,
      amenities: data.amenities || [],
      images: data.images || ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800'],
      status: 'pending',
      ownerId: data.ownerId,
      rating: 5.0,
      reviewCount: 1,
      createdAt: new Date().toISOString(),
    };

    list.push(newGh);
    setStoredData(STORAGE_KEYS.GUESTHOUSES, list);
    return newGh;
  },

  async getRoomsForGuesthouse(guesthouseId) {
    const rooms = getStoredData(STORAGE_KEYS.ROOMS);
    return rooms.filter((r) => String(r.guesthouseId) === String(guesthouseId));
  },

  async addRoom(roomData) {
    const rooms = getStoredData(STORAGE_KEYS.ROOMS);
    const newRoom = {
      id: `room-${Date.now()}`,
      guesthouseId: roomData.guesthouseId,
      roomNumber: roomData.roomNumber,
      type: roomData.type,
      capacity: roomData.capacity,
      pricePerNight: roomData.pricePerNight,
      availabilityStatus: roomData.availabilityStatus || 'available',
    };
    rooms.push(newRoom);
    setStoredData(STORAGE_KEYS.ROOMS, rooms);
    return newRoom;
  },

  async updateRoomAvailability(roomId, status) {
    const rooms = getStoredData(STORAGE_KEYS.ROOMS);
    const idx = rooms.findIndex((r) => String(r.id) === String(roomId));
    if (idx !== -1) {
      rooms[idx].availabilityStatus = status;
      setStoredData(STORAGE_KEYS.ROOMS, rooms);
      return rooms[idx];
    }
    throw new Error('Room not found');
  },

  async createBookingAndPay({ guesthouseId, roomId, checkInDate, checkOutDate, nightsCount, paymentMethod, phone }) {
    const guesthouses = getStoredData(STORAGE_KEYS.GUESTHOUSES);
    const rooms = getStoredData(STORAGE_KEYS.ROOMS);
    const reservations = getStoredData(STORAGE_KEYS.RESERVATIONS);
    const payments = getStoredData(STORAGE_KEYS.PAYMENTS);
    const currentUser = this.getCurrentUser();

    const room = rooms.find((r) => String(r.id) === String(roomId));
    const guesthouse = guesthouses.find((g) => String(g.id) === String(guesthouseId));

    if (!room || !guesthouse) throw new Error('Selected room or property not found.');

    const existingConflict = reservations.find(
      (res) =>
        String(res.roomId) === String(roomId) &&
        res.status !== 'cancelled' &&
        res.checkInDate === checkInDate
    );

    if (existingConflict) {
      throw new Error('Double-booking Prevention: This room is already booked for these dates!');
    }

    const totalPrice = room.pricePerNight * nightsCount;
    const resId = `RES-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReservation = {
      id: resId,
      guesthouseId,
      guesthouseName: guesthouse.name,
      guesthouseLocation: guesthouse.location,
      roomId,
      roomNumber: room.roomNumber,
      roomType: room.type,
      guestId: currentUser?.id || 'usr-guest-1',
      guestName: currentUser?.name || 'Walk-In Guest',
      guestPhone: phone,
      checkInDate,
      checkOutDate,
      nightsCount,
      totalPrice,
      paymentStatus: 'paid',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    const newPayment = {
      id: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
      reservationId: resId,
      guesthouseId,
      guestName: newReservation.guestName,
      amount: totalPrice,
      method: paymentMethod,
      referenceNumber: `${paymentMethod.toUpperCase()}-REF-${Date.now().toString().slice(-6)}`,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };

    reservations.push(newReservation);
    payments.push(newPayment);

    setStoredData(STORAGE_KEYS.RESERVATIONS, reservations);
    setStoredData(STORAGE_KEYS.PAYMENTS, payments);

    return { reservation: newReservation, payment: newPayment };
  },

  async getReservations(filters = {}) {
    let list = getStoredData(STORAGE_KEYS.RESERVATIONS);
    if (filters.guestId) list = list.filter((r) => String(r.guestId) === String(filters.guestId));
    if (filters.guesthouseId) list = list.filter((r) => String(r.guesthouseId) === String(filters.guesthouseId));
    return list;
  },

  async performCheckIn(resId) {
    const reservations = getStoredData(STORAGE_KEYS.RESERVATIONS);
    const rooms = getStoredData(STORAGE_KEYS.ROOMS);

    const idx = reservations.findIndex((r) => String(r.id) === String(resId));
    if (idx !== -1) {
      reservations[idx].status = 'checked_in';
      setStoredData(STORAGE_KEYS.RESERVATIONS, reservations);

      const roomIdx = rooms.findIndex((r) => String(r.id) === String(reservations[idx].roomId));
      if (roomIdx !== -1) {
        rooms[roomIdx].availabilityStatus = 'occupied';
        setStoredData(STORAGE_KEYS.ROOMS, rooms);
      }
      return reservations[idx];
    }
    throw new Error('Reservation not found');
  },

  async performCheckOut(resId) {
    const reservations = getStoredData(STORAGE_KEYS.RESERVATIONS);
    const rooms = getStoredData(STORAGE_KEYS.ROOMS);

    const idx = reservations.findIndex((r) => String(r.id) === String(resId));
    if (idx !== -1) {
      reservations[idx].status = 'checked_out';
      setStoredData(STORAGE_KEYS.RESERVATIONS, reservations);

      const roomIdx = rooms.findIndex((r) => String(r.id) === String(reservations[idx].roomId));
      if (roomIdx !== -1) {
        rooms[roomIdx].availabilityStatus = 'available';
        setStoredData(STORAGE_KEYS.ROOMS, rooms);
      }
      return reservations[idx];
    }
    throw new Error('Reservation not found');
  },

  async getReceptionistArrivals(guesthouseId) {
    const list = await this.getReservations({ guesthouseId });
    return list.filter((r) => r.status === 'confirmed');
  },

  async getReceptionistDepartures(guesthouseId) {
    const list = await this.getReservations({ guesthouseId });
    return list.filter((r) => r.status === 'checked_in');
  },

  async getOwnerPayments(guesthouseId) {
    const payments = getStoredData(STORAGE_KEYS.PAYMENTS);
    return payments.filter((p) => String(p.guesthouseId) === String(guesthouseId));
  },

  async getOwnerRevenueReport(guesthouseId) {
    const payments = await this.getOwnerPayments(guesthouseId);
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    const telebirrSum = payments.filter((p) => p.method === 'telebirr').reduce((sum, p) => sum + p.amount, 0);
    const chapaSum = payments.filter((p) => p.method === 'chapa').reduce((sum, p) => sum + p.amount, 0);
    const cardSum = payments.filter((p) => p.method === 'card').reduce((sum, p) => sum + p.amount, 0);

    return {
      totalRevenue,
      totalTransactions: payments.length,
      paymentMethodBreakdown: {
        telebirr: telebirrSum,
        chapa: chapaSum,
        card: cardSum,
      },
      occupancyRate: 78,
    };
  },

  async getAdminPlatformStats() {
    const guesthouses = getStoredData(STORAGE_KEYS.GUESTHOUSES);
    const reservations = getStoredData(STORAGE_KEYS.RESERVATIONS);
    const payments = getStoredData(STORAGE_KEYS.PAYMENTS);
    const users = getStoredData(STORAGE_KEYS.USERS);

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalGuesthouses: guesthouses.length,
      approvedGuesthouses: guesthouses.filter((g) => g.status === 'approved').length,
      pendingGuesthouses: guesthouses.filter((g) => g.status === 'pending').length,
      totalReservations: reservations.length,
      totalPlatformRevenue: totalRevenue,
      totalUsers: users.length,
    };
  },

  async getAdminPendingGuesthouses() {
    const guesthouses = getStoredData(STORAGE_KEYS.GUESTHOUSES);
    return guesthouses.filter((g) => g.status === 'pending');
  },

  async approveGuesthouse(id) {
    const guesthouses = getStoredData(STORAGE_KEYS.GUESTHOUSES);
    const idx = guesthouses.findIndex((g) => String(g.id) === String(id));
    if (idx !== -1) {
      guesthouses[idx].status = 'approved';
      setStoredData(STORAGE_KEYS.GUESTHOUSES, guesthouses);
      return guesthouses[idx];
    }
    throw new Error('Guesthouse not found');
  },
};

const BackendService = {
  getCurrentUser() {
    initDatabase();
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  },

  setCurrentUser(user, token) {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      return;
    }
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    }
  },

  async loginUser(email, password = DEFAULT_PASSWORD) {
    const response = await api.post('/auth/login', { email, password });
    const payload = unwrap(response);
    const user = mapUserFromBackend(payload.user);
    this.setCurrentUser(user, payload.token);
    return user;
  },

  async registerUser({ name, email, phone, role, guesthouseId, password = DEFAULT_PASSWORD }) {
    const response = await api.post('/auth/register', {
      fullName: name,
      email,
      phone,
      password,
      role: mapRoleToBackend(role || 'Guest'),
    });
    const payload = unwrap(response);
    const user = mapUserFromBackend({ ...payload.user, guesthouseId });
    this.setCurrentUser(user, payload.token);
    return user;
  },

  async getAllUsers() {
    const response = await api.get('/admin/users');
    const users = unwrap(response) || [];
    return users.map(mapUserFromBackend);
  },

  async getGuesthouses(filters = {}) {
    const ghResponse = await api.get('/guesthouses', { params: filters });
    const guesthouses = unwrap(ghResponse) || [];
    const rooms = await fetchRoomsSafely();

    let list = guesthouses.map((gh) => mapGuesthouseFromBackend(gh, rooms));

    if (filters.city) {
      list = list.filter((g) => g.city.toLowerCase() === filters.city.toLowerCase());
    }
    if (filters.maxPrice) {
      list = list.filter((gh) => gh.priceRange.min <= filters.maxPrice);
    }

    return list;
  },

  async getGuesthouseById(id) {
    const ghResponse = await api.get(`/guesthouses/${id}`);
    const guesthouse = unwrap(ghResponse);
    if (!guesthouse) return null;
    const rooms = await fetchRoomsSafely();
    return mapGuesthouseFromBackend(guesthouse, rooms);
  },

  async registerGuesthouse(data) {
    const response = await api.post('/guesthouses', {
      name: data.name,
      address: data.location || data.address,
      city: data.city,
      description: data.description,
      image: data.images?.[0],
    });
    return mapGuesthouseFromBackend(unwrap(response));
  },

  async getRoomsForGuesthouse(guesthouseId) {
    const response = await api.get('/rooms');
    const rooms = unwrap(response) || [];
    return rooms
      .filter((room) => String(room.guesthouseId) === String(guesthouseId))
      .map(mapRoomFromBackend);
  },

  async addRoom(roomData) {
    const response = await api.post(`/rooms/${roomData.guesthouseId}`, {
      roomNumber: roomData.roomNumber,
      roomType: String(roomData.type || 'DOUBLE').toUpperCase(),
      price: roomData.pricePerNight,
      capacity: roomData.capacity,
      available: roomData.availabilityStatus !== 'occupied',
    });
    return mapRoomFromBackend(unwrap(response));
  },

  async updateRoomAvailability(roomId, status) {
    const response = await api.put(`/rooms/${roomId}`, {
      available: status === 'available',
    });
    return mapRoomFromBackend(unwrap(response));
  },

  async createBookingAndPay({ guesthouseId, roomId, checkInDate, checkOutDate, nightsCount, paymentMethod, phone }) {
    const reservationResponse = await api.post('/reservations', {
      roomId: Number(roomId),
      checkIn: toIsoDateTime(checkInDate),
      checkOut: toIsoDateTime(checkOutDate),
    });
    const reservation = unwrap(reservationResponse);

    const roomResponse = await api.get(`/rooms/${roomId}`);
    const room = mapRoomFromBackend(unwrap(roomResponse));
    const totalPrice = room.pricePerNight * nightsCount;

    const paymentResponse = await api.post('/payments', {
      reservationId: reservation.id,
      amount: totalPrice,
      paymentMethod: mapPaymentMethodToBackend(paymentMethod),
    });
    const payment = mapPaymentFromBackend(unwrap(paymentResponse));

    const guesthouse = await this.getGuesthouseById(guesthouseId);
    const currentUser = this.getCurrentUser();

    return {
      reservation: mapReservationFromBackend({
        ...reservation,
        guesthouseId,
        guesthouseName: guesthouse?.name,
        guesthouseLocation: guesthouse?.location,
        roomNumber: room.roomNumber,
        roomType: room.type,
        guestName: currentUser?.name,
        guestPhone: phone,
        nightsCount,
        totalPrice,
        paymentStatus: 'paid',
      }),
      payment,
    };
  },

  async getReservations(filters = {}) {
    const currentUser = this.getCurrentUser();
    const role = currentUser?.role;

    let response;
    if (role === 'Guest') {
      response = await api.get('/guest/reservations');
    } else if (role === 'Receptionist') {
      response = await api.get('/receptionist/reservations');
    } else {
      response = await api.get('/reservations');
    }

    let list = (unwrap(response) || []).map(mapReservationFromBackend);

    if (filters.guestId) {
      list = list.filter((r) => String(r.guestId) === String(filters.guestId));
    }
    if (filters.guesthouseId) {
      list = list.filter((r) => String(r.guesthouseId) === String(filters.guesthouseId));
    }

    return list;
  },

  async performCheckIn(resId) {
    const response = await api.patch(`/receptionist/reservations/${resId}/check-in`);
    return mapReservationFromBackend(unwrap(response));
  },

  async performCheckOut(resId) {
    const response = await api.patch(`/receptionist/reservations/${resId}/check-out`);
    return mapReservationFromBackend(unwrap(response));
  },

  async getReceptionistArrivals(guesthouseId) {
    const response = await api.get('/receptionist/today-arrivals');
    const list = (unwrap(response) || []).map(mapReservationFromBackend);
    return guesthouseId ? list.filter((r) => String(r.guesthouseId) === String(guesthouseId)) : list;
  },

  async getReceptionistDepartures(guesthouseId) {
    const response = await api.get('/receptionist/today-departures');
    const list = (unwrap(response) || []).map(mapReservationFromBackend);
    return guesthouseId ? list.filter((r) => String(r.guesthouseId) === String(guesthouseId)) : list;
  },

  async getOwnerPayments(guesthouseId) {
    const response = await api.get('/dashboard/owner/recent-payments');
    const payments = (unwrap(response) || []).map(mapPaymentFromBackend);
    return guesthouseId
      ? payments.filter((p) => String(p.guesthouseId) === String(guesthouseId))
      : payments;
  },

  async getOwnerRevenueReport(guesthouseId) {
    const response = await api.get('/dashboard/owner/revenue');
    const data = unwrap(response) || {};
    const payments = await this.getOwnerPayments(guesthouseId);

    const telebirrSum = payments.filter((p) => p.method === 'telebirr').reduce((sum, p) => sum + p.amount, 0);
    const chapaSum = payments.filter((p) => p.method === 'chapa').reduce((sum, p) => sum + p.amount, 0);
    const cardSum = payments.filter((p) => p.method === 'card').reduce((sum, p) => sum + p.amount, 0);

    return {
      totalRevenue: Number(data.totalRevenue ?? 0),
      totalTransactions: payments.length,
      paymentMethodBreakdown: {
        telebirr: telebirrSum,
        chapa: chapaSum,
        card: cardSum,
      },
      occupancyRate: data.occupancyRate ?? 0,
    };
  },

  async getAdminPlatformStats() {
    const response = await api.get('/dashboard');
    const stats = unwrap(response) || {};
    const pending = await this.getAdminPendingGuesthouses();

    return {
      totalGuesthouses: stats.totalGuesthouses ?? 0,
      approvedGuesthouses: (stats.totalGuesthouses ?? 0) - pending.length,
      pendingGuesthouses: pending.length,
      totalReservations: stats.totalReservations ?? 0,
      totalPlatformRevenue: Number(stats.totalRevenue ?? 0),
      totalUsers: stats.totalUsers ?? 0,
    };
  },

  async getAdminPendingGuesthouses() {
    const response = await api.get('/guesthouses/pending');
    const guesthouses = unwrap(response) || [];
    return guesthouses.map((gh) => mapGuesthouseFromBackend(gh));
  },

  async approveGuesthouse(id) {
    const response = await api.put(`/admin/guesthouses/${id}/approve`);
    return mapGuesthouseFromBackend(unwrap(response));
  },
};

export const ApiService = {
  getBackendMode,
  setBackendMode,
  getApiUrl,

  getCurrentUser() {
    return shouldUseBackend() ? BackendService.getCurrentUser() : MockService.getCurrentUser();
  },

  setCurrentUser(user) {
    if (shouldUseBackend()) {
      BackendService.setCurrentUser(user);
    } else {
      MockService.setCurrentUser(user);
    }
  },

  getAllUsers() {
    return MockService.getAllUsers();
  },

  async fetchAdminUsers() {
    if (!hasBackendAuth()) {
      return MockService.getAllUsers();
    }
    return withBackendFallback(
      'fetchAdminUsers',
      () => BackendService.getAllUsers(),
      () => MockService.getAllUsers()
    );
  },

  async loginUser(email, password) {
    return withBackendFallback(
      'loginUser',
      () => BackendService.loginUser(email, password),
      () => MockService.loginUser(email)
    );
  },

  async registerUser(payload) {
    return withBackendFallback(
      'registerUser',
      () => BackendService.registerUser(payload),
      () => MockService.registerUser(payload)
    );
  },

  async getGuesthouses(filters) {
    return withBackendFallback(
      'getGuesthouses',
      () => BackendService.getGuesthouses(filters),
      () => MockService.getGuesthouses(filters)
    );
  },

  async getGuesthouseById(id) {
    return withBackendFallback(
      'getGuesthouseById',
      () => BackendService.getGuesthouseById(id),
      () => MockService.getGuesthouseById(id)
    );
  },

  async registerGuesthouse(data) {
    return withBackendFallback(
      'registerGuesthouse',
      () => BackendService.registerGuesthouse(data),
      () => MockService.registerGuesthouse(data)
    );
  },

  async getRoomsForGuesthouse(guesthouseId) {
    return withBackendFallback(
      'getRoomsForGuesthouse',
      () => BackendService.getRoomsForGuesthouse(guesthouseId),
      () => MockService.getRoomsForGuesthouse(guesthouseId)
    );
  },

  async addRoom(roomData) {
    return withBackendFallback(
      'addRoom',
      () => BackendService.addRoom(roomData),
      () => MockService.addRoom(roomData)
    );
  },

  async updateRoomAvailability(roomId, status) {
    return withBackendFallback(
      'updateRoomAvailability',
      () => BackendService.updateRoomAvailability(roomId, status),
      () => MockService.updateRoomAvailability(roomId, status)
    );
  },

  async createBookingAndPay(payload) {
    return withBackendFallback(
      'createBookingAndPay',
      () => BackendService.createBookingAndPay(payload),
      () => MockService.createBookingAndPay(payload)
    );
  },

  async getReservations(filters) {
    return withBackendFallback(
      'getReservations',
      () => BackendService.getReservations(filters),
      () => MockService.getReservations(filters)
    );
  },

  async performCheckIn(resId) {
    return withBackendFallback(
      'performCheckIn',
      () => BackendService.performCheckIn(resId),
      () => MockService.performCheckIn(resId)
    );
  },

  async performCheckOut(resId) {
    return withBackendFallback(
      'performCheckOut',
      () => BackendService.performCheckOut(resId),
      () => MockService.performCheckOut(resId)
    );
  },

  async getReceptionistArrivals(guesthouseId) {
    return withBackendFallback(
      'getReceptionistArrivals',
      () => BackendService.getReceptionistArrivals(guesthouseId),
      () => MockService.getReceptionistArrivals(guesthouseId)
    );
  },

  async getReceptionistDepartures(guesthouseId) {
    return withBackendFallback(
      'getReceptionistDepartures',
      () => BackendService.getReceptionistDepartures(guesthouseId),
      () => MockService.getReceptionistDepartures(guesthouseId)
    );
  },

  async getOwnerPayments(guesthouseId) {
    return withBackendFallback(
      'getOwnerPayments',
      () => BackendService.getOwnerPayments(guesthouseId),
      () => MockService.getOwnerPayments(guesthouseId)
    );
  },

  async getOwnerRevenueReport(guesthouseId) {
    return withBackendFallback(
      'getOwnerRevenueReport',
      () => BackendService.getOwnerRevenueReport(guesthouseId),
      () => MockService.getOwnerRevenueReport(guesthouseId)
    );
  },

  async getAdminPlatformStats() {
    return withBackendFallback(
      'getAdminPlatformStats',
      () => BackendService.getAdminPlatformStats(),
      () => MockService.getAdminPlatformStats()
    );
  },

  async getAdminPendingGuesthouses() {
    return withBackendFallback(
      'getAdminPendingGuesthouses',
      () => BackendService.getAdminPendingGuesthouses(),
      () => MockService.getAdminPendingGuesthouses()
    );
  },

  async approveGuesthouse(id) {
    return withBackendFallback(
      'approveGuesthouse',
      () => BackendService.approveGuesthouse(id),
      () => MockService.approveGuesthouse(id)
    );
  },
};
