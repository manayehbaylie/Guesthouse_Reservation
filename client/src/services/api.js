import axios from 'axios';
import { INITIAL_GUESTHOUSES, INITIAL_ROOMS, INITIAL_RESERVATIONS, INITIAL_USERS, INITIAL_PAYMENTS } from '../data/mockData.js';

// Axios Instance with JWT Interceptor
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization Bearer token from localStorage
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

// Data Getters/Setters
function getStoredData(key) {
  initDatabase();
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function setStoredData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export const ApiService = {
  // --- Auth Services ---
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

  // --- Guesthouse Services ---
  async getGuesthouses(filters = {}) {
    let list = getStoredData(STORAGE_KEYS.GUESTHOUSES);
    const rooms = getStoredData(STORAGE_KEYS.ROOMS);

    if (filters.city) {
      list = list.filter((g) => g.city.toLowerCase() === filters.city.toLowerCase());
    }

    // Attach price ranges
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
    return list.find((g) => g.id === id) || null;
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

  // --- Room Services ---
  async getRoomsForGuesthouse(guesthouseId) {
    const rooms = getStoredData(STORAGE_KEYS.ROOMS);
    return rooms.filter((r) => r.guesthouseId === guesthouseId);
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
    const idx = rooms.findIndex((r) => r.id === roomId);
    if (idx !== -1) {
      rooms[idx].availabilityStatus = status;
      setStoredData(STORAGE_KEYS.ROOMS, rooms);
      return rooms[idx];
    }
    throw new Error('Room not found');
  },

  // --- Booking & Payment Services ---
  async createBookingAndPay({ guesthouseId, roomId, checkInDate, checkOutDate, nightsCount, paymentMethod, phone }) {
    const guesthouses = getStoredData(STORAGE_KEYS.GUESTHOUSES);
    const rooms = getStoredData(STORAGE_KEYS.ROOMS);
    const reservations = getStoredData(STORAGE_KEYS.RESERVATIONS);
    const payments = getStoredData(STORAGE_KEYS.PAYMENTS);
    const currentUser = this.getCurrentUser();

    const room = rooms.find((r) => r.id === roomId);
    const guesthouse = guesthouses.find((g) => g.id === guesthouseId);

    if (!room || !guesthouse) throw new Error('Selected room or property not found.');

    // Check overlap double-booking prevention
    const existingConflict = reservations.find(
      (res) =>
        res.roomId === roomId &&
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
    if (filters.guestId) list = list.filter((r) => r.guestId === filters.guestId);
    if (filters.guesthouseId) list = list.filter((r) => r.guesthouseId === filters.guesthouseId);
    return list;
  },

  async performCheckIn(resId) {
    const reservations = getStoredData(STORAGE_KEYS.RESERVATIONS);
    const rooms = getStoredData(STORAGE_KEYS.ROOMS);

    const idx = reservations.findIndex((r) => r.id === resId);
    if (idx !== -1) {
      reservations[idx].status = 'checked_in';
      setStoredData(STORAGE_KEYS.RESERVATIONS, reservations);

      // set room occupied
      const roomIdx = rooms.findIndex((r) => r.id === reservations[idx].roomId);
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

    const idx = reservations.findIndex((r) => r.id === resId);
    if (idx !== -1) {
      reservations[idx].status = 'checked_out';
      setStoredData(STORAGE_KEYS.RESERVATIONS, reservations);

      // liberate room
      const roomIdx = rooms.findIndex((r) => r.id === reservations[idx].roomId);
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

  // --- Owner & Admin Services ---
  async getOwnerPayments(guesthouseId) {
    const payments = getStoredData(STORAGE_KEYS.PAYMENTS);
    return payments.filter((p) => p.guesthouseId === guesthouseId);
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
    const idx = guesthouses.findIndex((g) => g.id === id);
    if (idx !== -1) {
      guesthouses[idx].status = 'approved';
      setStoredData(STORAGE_KEYS.GUESTHOUSES, guesthouses);
      return guesthouses[idx];
    }
    throw new Error('Guesthouse not found');
  },
};
