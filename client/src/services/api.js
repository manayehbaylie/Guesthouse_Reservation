import axios from 'axios';

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

// Response interceptor to handle backend response format
api.interceptors.response.use(
  (response) => {
    // Backend returns { success, message, data }
    // We want to return the data directly for easier use
    if (response.data && response.data.success !== undefined) {
      return response.data.data || response.data;
    }
    return response.data;
  },
  (error) => {
    // Handle error responses
    if (error.response && error.response.data) {
      const errorMessage = error.response.data.message || error.message;
      throw new Error(errorMessage);
    }
    throw error;
  }
);

// Storage keys for token and user
const STORAGE_KEYS = {
  CURRENT_USER: 'gh_current_user',
  TOKEN: 'token',
};

export const ApiService = {
  // --- Auth Services ---
  getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  },

  setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  },

  async loginUser(email, password) {
    const response = await api.post('/auth/login', { email, password });
    // Backend returns { user, token }
    if (response.user && response.token) {
      this.setCurrentUser(response.user);
      this.setToken(response.token);
      return response.user;
    }
    throw new Error('Invalid response from server');
  },

  async registerUser({ fullName, email, phone, password, role }) {
    const response = await api.post('/auth/register', { 
      fullName, 
      email, 
      phone, 
      password, 
      role: role?.toUpperCase() || 'GUEST' 
    });
    // Backend returns { user, token }
    if (response.user && response.token) {
      this.setCurrentUser(response.user);
      this.setToken(response.token);
      return response.user;
    }
    throw new Error('Invalid response from server');
  },

  // --- Guesthouse Services ---
  async getGuesthouses(filters = {}) {
    const params = new URLSearchParams();
    if (filters.city) params.append('city', filters.city);
    
    const response = await api.get(`/guesthouses?${params.toString()}`);
    
    // Backend returns only APPROVED guesthouses by default
    // We need to add price range calculation since backend doesn't include it
    return response.map(gh => ({
      ...gh,
      // Use address as location for frontend compatibility
      location: gh.address,
      // Backend doesn't include images array, add default
      images: gh.image ? [gh.image] : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800'],
      // Backend doesn't include amenities, add empty array
      amenities: [],
      // Backend doesn't include rating, add default
      rating: 5.0,
      reviewCount: 1,
      // Convert status to lowercase for frontend compatibility
      status: gh.status?.toLowerCase() || 'approved',
    }));
  },

  async getGuesthouseById(id) {
    const response = await api.get(`/guesthouses/${id}`);
    return {
      ...response,
      location: response.address,
      images: response.image ? [response.image] : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800'],
      amenities: [],
      rating: 5.0,
      reviewCount: 1,
      status: response.status?.toLowerCase() || 'approved',
    };
  },

  getMyGuesthouse: async () => {
    const response = await api.get("/guesthouses/owner/me");
    return {
      ...response,
      location: response.address,
      images: response.image ? [response.image] : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800'],
      amenities: [],
      rating: 5.0,
      reviewCount: 1,
      status: response.status?.toLowerCase() || 'pending',
    };
  },

  async registerGuesthouse(data) {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('address', data.location || data.address);
    formData.append('city', data.city);
    formData.append('description', data.description);
    
    if (data.image) {
      formData.append('image', data.image);
    }

    const response = await api.post('/guesthouses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return {
      ...response,
      location: response.address,
      images: response.image ? [response.image] : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800'],
      amenities: [],
      rating: 5.0,
      reviewCount: 1,
      status: response.status?.toLowerCase() || 'pending',
    };
  },

  // --- Room Services ---
  async getRoomsForGuesthouse(guesthouseId) {
    const response = await api.get(`/rooms/guesthouse/${guesthouseId}`);
    
    return response.map(room => ({
      ...room,
      // Map backend fields to frontend expected fields
      type: room.roomType,
      pricePerNight: Number(room.price),
      availabilityStatus: room.available ? 'available' : 'occupied',
    }));
  },

  async getRoomById(roomId) {
    const response = await api.get(`/rooms/${roomId}`);
    return {
      ...response,
      type: response.roomType,
      pricePerNight: Number(response.price),
      availabilityStatus: response.available ? 'available' : 'occupied',
    };
  },

  async addRoom(roomData) {
    const response = await api.post(`/rooms/${roomData.guesthouseId}`, {
      roomNumber: roomData.roomNumber,
      roomType: roomData.type,
      price: roomData.pricePerNight,
      capacity: roomData.capacity,
      available: roomData.availabilityStatus !== 'occupied',
    });

    return {
      ...response,
      type: response.roomType,
      pricePerNight: Number(response.price),
      availabilityStatus: response.available ? 'available' : 'occupied',
    };
  },

  async updateRoomAvailability(roomId, status) {
    const response = await api.put(`/rooms/${roomId}`, {
      available: status !== 'occupied',
    });

    return {
      ...response,
      type: response.roomType,
      pricePerNight: Number(response.price),
      availabilityStatus: response.available ? 'available' : 'occupied',
    };
  },

  // --- Booking & Payment Services ---
  async createBookingAndPay({ guesthouseId, roomId, checkInDate, checkOutDate, nightsCount, paymentMethod, phone }) {
    // First create reservation
    const reservation = await api.post('/reservations', {
      checkIn: checkInDate,
      checkOut: checkOutDate,
      roomId: Number(roomId),
    });

    // Then create payment
    const roomData = await this.getRoomById(roomId);
    const totalPrice = Number(roomData.pricePerNight) * nightsCount;
    
    const payment = await api.post('/payments', {
      amount: totalPrice,
      method: paymentMethod?.toUpperCase() || 'TELEBIRR',
      reservationId: reservation.id,
    });

    return {
      reservation: {
        ...reservation,
        guesthouseId,
        guesthouseName: 'Guesthouse', // Will be filled from guesthouse data
        guesthouseLocation: 'Location', // Will be filled from guesthouse data
        roomNumber: roomData.roomNumber,
        roomType: roomData.type,
        guestName: this.getCurrentUser()?.fullName || 'Guest',
        guestPhone: phone,
        nightsCount,
        totalPrice,
        paymentStatus: payment.status === 'PAID' ? 'paid' : 'pending',
        status: reservation.status?.toLowerCase() || 'pending',
      },
      payment: {
        ...payment,
        guesthouseId,
        guestName: this.getCurrentUser()?.fullName || 'Guest',
        method: payment.method?.toLowerCase() || 'telebirr',
        status: payment.status?.toLowerCase() || 'pending',
      },
    };
  },

  async getReservations(filters = {}) {
    const response = await api.get('/reservations');
    let list = response;
    
    if (filters.guestId) {
      list = list.filter((r) => r.guestId === Number(filters.guestId));
    }
    if (filters.guesthouseId) {
      list = list.filter((r) => r.room?.guesthouseId === Number(filters.guesthouseId));
    }

    return list.map(res => ({
      ...res,
      status: res.status?.toLowerCase() || 'pending',
      guestName: res.guest?.fullName || 'Guest',
      roomNumber: res.room?.roomNumber || 'N/A',
      roomType: res.room?.roomType || 'STANDARD',
    }));
  },

  async performCheckIn(resId) {
    const response = await api.patch(`/reservations/${resId}/status`, {
      status: 'CHECKED_IN',
    });

    return {
      ...response,
      status: response.status?.toLowerCase() || 'checked_in',
    };
  },

  async performCheckOut(resId) {
    const response = await api.patch(`/reservations/${resId}/status`, {
      status: 'CHECKED_OUT',
    });

    return {
      ...response,
      status: response.status?.toLowerCase() || 'checked_out',
    };
  },

  async getReceptionistArrivals(guesthouseId) {
    const response = await api.get('/receptionist/today-arrivals');
    return response.map(res => ({
      ...res,
      status: res.status?.toLowerCase() || 'confirmed',
    }));
  },

  async getReceptionistDepartures(guesthouseId) {
    const response = await api.get('/receptionist/today-departures');
    return response.map(res => ({
      ...res,
      status: res.status?.toLowerCase() || 'checked_in',
    }));
  },

  // --- Owner & Admin Services ---
  async getOwnerPayments(guesthouseId) {
    const response = await api.get('/payments');
    return response
      .filter(p => p.reservation?.room?.guesthouseId === Number(guesthouseId))
      .map(p => ({
        ...p,
        method: p.method?.toLowerCase() || 'telebirr',
        status: p.status?.toLowerCase() || 'pending',
      }));
  },

  async getOwnerRevenueReport(guesthouseId) {
    const payments = await this.getOwnerPayments(guesthouseId);
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    const telebirrSum = payments.filter((p) => p.method === 'telebirr').reduce((sum, p) => sum + Number(p.amount), 0);
    const chapaSum = payments.filter((p) => p.method === 'chapa').reduce((sum, p) => sum + Number(p.amount), 0);
    const cbeBirrSum = payments.filter((p) => p.method === 'cbe_birr').reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalRevenue,
      totalTransactions: payments.length,
      paymentMethodBreakdown: {
        telebirr: telebirrSum,
        chapa: chapaSum,
        cbe_birr: cbeBirrSum,
      },
      occupancyRate: 78, // This would need to be calculated from actual data
    };
  },

  async getAdminPlatformStats() {
    const guesthouses = await api.get('/guesthouses');
    const reservations = await api.get('/reservations');
    const payments = await api.get('/payments');
    const users = await api.get('/admin/users');

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalGuesthouses: guesthouses.length,
      approvedGuesthouses: guesthouses.filter((g) => g.status === 'APPROVED').length,
      pendingGuesthouses: guesthouses.filter((g) => g.status === 'PENDING').length,
      totalReservations: reservations.length,
      totalPlatformRevenue: totalRevenue,
      totalUsers: users.length,
    };
  },

  async getAdminPendingGuesthouses() {
    const response = await api.get('/guesthouses/pending');
    return response.map(gh => ({
      ...gh,
      location: gh.address,
      images: gh.image ? [gh.image] : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800'],
      status: gh.status?.toLowerCase() || 'pending',
    }));
  },

  async approveGuesthouse(id) {
    const response = await api.patch(`/guesthouses/${id}/approve`);
    return {
      ...response,
      location: response.address,
      status: response.status?.toLowerCase() || 'approved',
    };
  },

  // --- Admin Services ---
  async getAllUsers() {
    const response = await api.get('/admin/users');
    return response.map(user => ({
      ...user,
      name: user.fullName, // Map fullName to name for frontend compatibility
    }));
  },
};
