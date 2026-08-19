import axios from "axios";

// ============================================================
// AXIOS CONFIGURATION
// ============================================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// JWT INTERCEPTOR
// ============================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
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
  (response) => {
    /*
      Backend responses may look like:

      {
        success: true,
        message: "...",
        data: {...}
      }

      OR directly:

      {
        user: {...},
        token: "..."
      }
    */

    if (
      response.data &&
      response.data.success !== undefined
    ) {
      return response.data.data ?? response.data;
    }

    return response.data;
  },

  (error) => {
    if (error.response?.data) {
      const message =
        error.response.data.message ||
        error.response.data.error ||
        error.message ||
        "Something went wrong.";

      return Promise.reject(new Error(message));
    }

    return Promise.reject(error);
  }
);

// ============================================================
// STORAGE KEYS
// ============================================================

const STORAGE_KEYS = {
  CURRENT_USER: "gh_current_user",
  TOKEN: "token",
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function unwrap(response) {
  return response?.data?.data ?? response?.data;
}

function mapRoleFromBackend(role) {
  if (!role) return "Guest";

  const normalized = String(role).toUpperCase();

  const roles = {
    GUEST: "Guest",
    OWNER: "Owner",
    RECEPTIONIST: "Receptionist",
    ADMIN: "Admin",
  };

  return roles[normalized] || role;
}

function mapRoleToBackend(role) {
  if (!role) return "GUEST";

  const roles = {
    Guest: "GUEST",
    Owner: "OWNER",
    Receptionist: "RECEPTIONIST",
    Admin: "ADMIN",
  };

  return roles[role] || String(role).toUpperCase();
}

function mapUserFromBackend(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.fullName || user.name || "",
    fullName: user.fullName || user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    role: mapRoleFromBackend(user.role),
    guesthouseId: user.guesthouseId ?? null,
    createdAt: user.createdAt,
  };
}

function mapGuesthouseStatus(status) {
  if (!status) return "pending";

  return String(status).toLowerCase();
}

function mapGuesthouseFromBackend(
  guesthouse,
  rooms = []
) {
  if (!guesthouse) return null;

  const guesthouseRooms = rooms.filter(
    (room) =>
      String(room.guesthouseId) ===
      String(guesthouse.id)
  );

  const prices = guesthouseRooms
    .map((room) =>
      Number(
        room.pricePerNight ??
          room.price ??
          0
      )
    )
    .filter((price) => price > 0);

  const minPrice = prices.length
    ? Math.min(...prices)
    : 0;

  const maxPrice = prices.length
    ? Math.max(...prices)
    : 0;

  return {
    id: guesthouse.id,

    ownerId: guesthouse.ownerId,

    name: guesthouse.name,

    description:
      guesthouse.description || "",

    location:
      guesthouse.location ||
      guesthouse.address ||
      "",

    city: guesthouse.city || "",

    address:
      guesthouse.address ||
      guesthouse.location ||
      "",

    phone: guesthouse.phone || "",

    email: guesthouse.email || "",

    status: mapGuesthouseStatus(
      guesthouse.status
    ),

    images:
      guesthouse.images ||
      (guesthouse.image
        ? [guesthouse.image]
        : []),

    amenities:
      guesthouse.amenities || [],

    rating:
      guesthouse.rating ?? 0,

    reviewCount:
      guesthouse.reviewCount ?? 0,

    createdAt: guesthouse.createdAt,

    priceRange: {
      min: minPrice,
      max: maxPrice,
    },
  };
}

function mapRoomFromBackend(room) {
  if (!room) return null;

  return {
    ...room,

    id: room.id,

    guesthouseId:
      room.guesthouseId,

    roomNumber:
      room.roomNumber,

    type:
      room.type ||
      room.roomType,

    roomType:
      room.roomType ||
      room.type,

    capacity:
      room.capacity,

    pricePerNight: Number(
      room.pricePerNight ??
        room.price ??
        0
    ),

    availabilityStatus:
      room.availabilityStatus ??
      (room.available === false
        ? "occupied"
        : "available"),

    available:
      room.available,
  };
}

function mapReservationFromBackend(
  reservation
) {
  if (!reservation) return null;

  const room =
    reservation.room || {};

  const guesthouse =
    room.guesthouse || {};

  const guest =
    reservation.guest || {};

  const checkIn =
    reservation.checkInDate ||
    reservation.checkIn;

  const checkOut =
    reservation.checkOutDate ||
    reservation.checkOut;

  return {
    ...reservation,

    id: reservation.id,

    guesthouseId:
      reservation.guesthouseId ||
      guesthouse.id ||
      room.guesthouseId,

    guesthouseName:
      reservation.guesthouseName ||
      guesthouse.name ||
      "Guesthouse",

    guesthouseLocation:
      reservation.guesthouseLocation ||
      guesthouse.address ||
      "",

    roomId:
      reservation.roomId ||
      room.id,

    roomNumber:
      reservation.roomNumber ||
      room.roomNumber ||
      "N/A",

    roomType:
      reservation.roomType ||
      room.roomType ||
      room.type ||
      "STANDARD",

    guestId:
      reservation.guestId ||
      guest.id,

    guestName:
      reservation.guestName ||
      guest.fullName ||
      guest.name ||
      "Guest",

    guestPhone:
      reservation.guestPhone ||
      guest.phone ||
      "N/A",

    checkInDate:
      checkIn
        ? String(checkIn).slice(0, 10)
        : "N/A",

    checkOutDate:
      checkOut
        ? String(checkOut).slice(0, 10)
        : "N/A",

    nightsCount:
      reservation.nightsCount ??
      (
        checkIn &&
        checkOut
          ? Math.max(
              1,
              Math.round(
                (
                  new Date(checkOut) -
                  new Date(checkIn)
                ) /
                  (1000 * 60 * 60 * 24)
              )
            )
          : 1
      ),

    totalPrice: Number(
      reservation.totalPrice ??
        reservation.payment?.amount ??
        room.price ??
        0
    ),

    paymentStatus:
      reservation.paymentStatus ||
      (
        reservation.payment?.status ===
        "PAID"
          ? "paid"
          : "pending"
      ),

    status:
      reservation.status
        ? String(
            reservation.status
          ).toLowerCase()
        : "pending",

    createdAt:
      reservation.createdAt,
  };
}

function mapPaymentFromBackend(
  payment
) {
  if (!payment) return null;

  return {
    ...payment,

    id: payment.id,

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
      "Guest",

    amount: Number(
      payment.amount || 0
    ),

    method: String(
      payment.method ||
        payment.paymentMethod ||
        "telebirr"
    ).toLowerCase(),

    referenceNumber:
      payment.referenceNumber ||
      `REF-${payment.id}`,

    status: String(
      payment.status ||
        "pending"
    ).toLowerCase(),

    createdAt:
      payment.createdAt,
  };
}

function mapPaymentMethodToBackend(
  method
) {
  const methods = {
    telebirr: "TELEBIRR",
    chapa: "CHAPA",
    card: "CARD",
    cash: "CASH",
    bank: "BANK",
    cbe_birr: "CBE_BIRR",
  };

  return (
    methods[
      String(method || "telebirr")
        .toLowerCase()
    ] || "TELEBIRR"
  );
}

function toIsoDateTime(date) {
  if (!date) {
    return new Date().toISOString();
  }

  if (String(date).includes("T")) {
    return date;
  }

  return `${date}T12:00:00.000Z`;
}

// ============================================================
// AUTH SERVICES
// ============================================================

const AuthService = {
  getCurrentUser() {
    try {
      const raw = localStorage.getItem(
        STORAGE_KEYS.CURRENT_USER
      );

      return raw
        ? JSON.parse(raw)
        : null;
    } catch (error) {
      console.error(
        "Failed to read current user:",
        error
      );

      return null;
    }
  },

  setCurrentUser(user, token = null) {
    if (!user) {
      localStorage.removeItem(
        STORAGE_KEYS.CURRENT_USER
      );

      localStorage.removeItem(
        STORAGE_KEYS.TOKEN
      );

      return;
    }

    localStorage.setItem(
      STORAGE_KEYS.CURRENT_USER,
      JSON.stringify(user)
    );

    if (token) {
      localStorage.setItem(
        STORAGE_KEYS.TOKEN,
        token
      );
    }
  },

  async loginUser(
    email,
    password
  ) {
    const response =
      await api.post(
        "/auth/login",
        {
          email,
          password,
        }
      );

    const payload =
      unwrap(response);

    if (
      !payload?.user ||
      !payload?.token
    ) {
      throw new Error(
        "Invalid login response from server."
      );
    }

    const user =
      mapUserFromBackend(
        payload.user
      );

    this.setCurrentUser(
      user,
      payload.token
    );

    return user;
  },

  async registerUser({
    name,
    fullName,
    email,
    phone,
    password,
    role,
    guesthouseId,
  }) {
    const response =
      await api.post(
        "/auth/register",
        {
          fullName:
            fullName || name,

          email,

          phone,

          password,

          role:
            mapRoleToBackend(
              role || "Guest"
            ),
        }
      );

    const payload =
      unwrap(response);

    if (
      !payload?.user ||
      !payload?.token
    ) {
      throw new Error(
        "Invalid registration response from server."
      );
    }

    const user =
      mapUserFromBackend({
        ...payload.user,
        guesthouseId,
      });

    this.setCurrentUser(
      user,
      payload.token
    );

    return user;
  },
};

// ============================================================
// GUESTHOUSE SERVICES
// ============================================================

const GuesthouseService = {
  async getGuesthouses(
    filters = {}
  ) {
    const response =
      await api.get(
        "/guesthouses",
        {
          params: filters,
        }
      );

    const guesthouses =
      unwrap(response) || [];

    return guesthouses.map(
      (guesthouse) =>
        mapGuesthouseFromBackend(
          guesthouse
        )
    );
  },

  async getGuesthouseById(id) {
    const response =
      await api.get(
        `/guesthouses/${id}`
      );

    const guesthouse =
      unwrap(response);

    return mapGuesthouseFromBackend(
      guesthouse
    );
  },

  async getMyGuesthouse() {
    const response =
      await api.get(
        "/guesthouses/owner/me"
      );

    return mapGuesthouseFromBackend(
      unwrap(response)
    );
  },

  async registerGuesthouse(data) {
    const formData =
      new FormData();

    formData.append(
      "name",
      data.name
    );

    formData.append(
      "address",
      data.location ||
        data.address ||
        ""
    );

    formData.append(
      "city",
      data.city || ""
    );

    formData.append(
      "description",
      data.description || ""
    );

    if (data.image) {
      formData.append(
        "image",
        data.image
      );
    }

    const response =
      await api.post(
        "/guesthouses",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

    return mapGuesthouseFromBackend(
      unwrap(response)
    );
  },
};

// ============================================================
// ROOM SERVICES
// ============================================================

const RoomService = {
  async getRoomsForGuesthouse(
    guesthouseId
  ) {
    const response =
      await api.get(
        `/rooms/guesthouse/${guesthouseId}`
      );

    return (
      unwrap(response) || []
    ).map(mapRoomFromBackend);
  },

  async getRoomById(roomId) {
    const response =
      await api.get(
        `/rooms/${roomId}`
      );

    return mapRoomFromBackend(
      unwrap(response)
    );
  },

  async addRoom(roomData) {
    const response =
      await api.post(
        `/rooms/${roomData.guesthouseId}`,
        {
          roomNumber:
            roomData.roomNumber,

          roomType:
            String(
              roomData.type ||
                roomData.roomType ||
                "DOUBLE"
            ).toUpperCase(),

          price:
            roomData.pricePerNight ??
            roomData.price,

          capacity:
            roomData.capacity,

          available:
            roomData.availabilityStatus !==
            "occupied",
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
    const response =
      await api.put(
        `/rooms/${roomId}`,
        {
          roomNumber:
            roomData.roomNumber,

          roomType:
            String(
              roomData.roomType ||
                roomData.type ||
                "DOUBLE"
            ).toUpperCase(),

          price:
            roomData.price ??
            roomData.pricePerNight,

          capacity:
            roomData.capacity,

          available:
            roomData.available ??
            roomData.availabilityStatus !==
              "occupied",
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
            status !== "occupied",
        }
      );

    return mapRoomFromBackend(
      unwrap(response)
    );
  },

  async deleteRoom(roomId) {
    const response =
      await api.delete(
        `/rooms/${roomId}`
      );

    return unwrap(response);
  },
};

// ============================================================
// RESERVATION & PAYMENT SERVICES
// ============================================================

const BookingService = {
  async createBookingAndPay({
    guesthouseId,
    roomId,
    checkInDate,
    checkOutDate,
    nightsCount,
    paymentMethod,
    phone,
  }) {
    // Create reservation
    const reservationResponse =
      await api.post(
        "/reservations",
        {
          roomId: Number(roomId),

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

    // Get room
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
        room.pricePerNight
      ) *
      Number(
        nightsCount || 1
      );

    // Create payment
    const paymentResponse =
      await api.post(
        "/payments",
        {
          reservationId:
            reservation.id,

          amount:
            totalPrice,

          paymentMethod:
            mapPaymentMethodToBackend(
              paymentMethod
            ),
        }
      );

    const payment =
      mapPaymentFromBackend(
        unwrap(paymentResponse)
      );

    const guesthouse =
      await GuesthouseService
        .getGuesthouseById(
          guesthouseId
        );

    const currentUser =
      AuthService.getCurrentUser();

    return {
      reservation:
        mapReservationFromBackend({
          ...reservation,

          guesthouseId,

          guesthouseName:
            guesthouse?.name,

          guesthouseLocation:
            guesthouse?.location,

          roomNumber:
            room.roomNumber,

          roomType:
            room.type,

          guestName:
            currentUser?.name ||
            currentUser?.fullName ||
            "Guest",

          guestPhone:
            phone,

          nightsCount,

          totalPrice,

          paymentStatus:
            payment?.status ||
            "pending",
        }),

      payment,
    };
  },

  async getReservations(
    filters = {}
  ) {
    const currentUser =
      AuthService.getCurrentUser();

    const role =
      currentUser?.role;

    let response;

    if (role === "Guest") {
      response =
        await api.get(
          "/guest/reservations"
        );
    } else if (
      role === "Receptionist"
    ) {
      response =
        await api.get(
          "/receptionist/reservations"
        );
    } else {
      response =
        await api.get(
          "/reservations"
        );
    }

    let reservations =
      (
        unwrap(response) || []
      ).map(
        mapReservationFromBackend
      );

    if (filters.guestId) {
      reservations =
        reservations.filter(
          (reservation) =>
            String(
              reservation.guestId
            ) ===
            String(
              filters.guestId
            )
        );
    }

    if (
      filters.guesthouseId
    ) {
      reservations =
        reservations.filter(
          (reservation) =>
            String(
              reservation.guesthouseId
            ) ===
            String(
              filters.guesthouseId
            )
        );
    }

    return reservations;
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
};

// ============================================================
// RECEPTIONIST SERVICES
// ============================================================

const ReceptionistService = {
  async getReceptionistDashboardStats() {
    const response =
      await api.get(
        "/receptionist/dashboard"
      );

    return unwrap(response);
  },

  async getReceptionistReservations() {
    const response =
      await api.get(
        "/receptionist/reservations"
      );

    return (
      unwrap(response) || []
    ).map(
      mapReservationFromBackend
    );
  },

  async getReceptionistArrivals() {
    const response =
      await api.get(
        "/receptionist/today-arrivals"
      );

    return (
      unwrap(response) || []
    ).map(
      mapReservationFromBackend
    );
  },

  async getReceptionistDepartures() {
    const response =
      await api.get(
        "/receptionist/today-departures"
      );

    return (
      unwrap(response) || []
    ).map(
      mapReservationFromBackend
    );
  },

  async getReceptionistInHouse() {
    const response =
      await api.get(
        "/receptionist/in-house"
      );

    return (
      unwrap(response) || []
    ).map(
      mapReservationFromBackend
    );
  },

  async getReceptionistRooms() {
    const response =
      await api.get(
        "/receptionist/rooms"
      );

    return (
      unwrap(response) || []
    ).map((room) => ({
      ...mapRoomFromBackend(
        room
      ),

      maintenanceStatus:
        room.maintenanceStatus ||
        "AVAILABLE",
    }));
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

  async searchReceptionistReservations(
    term
  ) {
    const response =
      await api.get(
        "/receptionist/reservations/search",
        {
          params: {
            term,
          },
        }
      );

    return (
      unwrap(response) || []
    ).map(
      mapReservationFromBackend
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
};

// ============================================================
// ADMIN SERVICES
// ============================================================

const AdminService = {
  async getAllUsers() {
    const response =
      await api.get(
        "/admin/users"
      );

    return (
      unwrap(response) || []
    ).map(
      mapUserFromBackend
    );
  },

  async updateUserRole(
    userId,
    newRole
  ) {
    const response =
      await api.patch(
        `/admin/users/${userId}/role`,
        {
          role:
            mapRoleToBackend(
              newRole
            ),
        }
      );

    return mapUserFromBackend(
      unwrap(response)
    );
  },

  async getAdminPlatformStats() {
    const [
      guesthousesResponse,
      reservationsResponse,
      paymentsResponse,
      usersResponse,
    ] = await Promise.all([
      api.get("/guesthouses"),
      api.get("/reservations"),
      api.get("/payments"),
      api.get("/admin/users"),
    ]);

    const guesthouses =
      unwrap(
        guesthousesResponse
      ) || [];

    const reservations =
      unwrap(
        reservationsResponse
      ) || [];

    const payments =
      unwrap(
        paymentsResponse
      ) || [];

    const users =
      unwrap(
        usersResponse
      ) || [];

    const totalRevenue =
      payments.reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amount || 0
          ),
        0
      );

    return {
      totalGuesthouses:
        guesthouses.length,

      approvedGuesthouses:
        guesthouses.filter(
          (guesthouse) =>
            String(
              guesthouse.status
            ).toUpperCase() ===
            "APPROVED"
        ).length,

      pendingGuesthouses:
        guesthouses.filter(
          (guesthouse) =>
            String(
              guesthouse.status
            ).toUpperCase() ===
            "PENDING"
        ).length,

      totalReservations:
        reservations.length,

      totalPlatformRevenue:
        totalRevenue,

      totalUsers:
        users.length,
    };
  },

  async getAdminPendingGuesthouses() {
    const response =
      await api.get(
        "/guesthouses/pending"
      );

    return (
      unwrap(response) || []
    ).map(
      (guesthouse) =>
        mapGuesthouseFromBackend(
          guesthouse
        )
    );
  },

  async approveGuesthouse(id) {
    const response =
      await api.patch(
        `/guesthouses/${id}/approve`
      );

    return mapGuesthouseFromBackend(
      unwrap(response)
    );
  },
};

// ============================================================
// OWNER SERVICES
// ============================================================

const OwnerService = {
  async getOwnerPayments(
    guesthouseId
  ) {
    const response =
      await api.get(
        "/payments"
      );

    let payments =
      (
        unwrap(response) || []
      ).map(
        mapPaymentFromBackend
      );

    if (guesthouseId) {
      payments =
        payments.filter(
          (payment) =>
            String(
              payment.guesthouseId
            ) ===
            String(
              guesthouseId
            )
        );
    }

    return payments;
  },

  async getOwnerRevenueReport(
    guesthouseId
  ) {
    const payments =
      await this.getOwnerPayments(
        guesthouseId
      );

    const totalRevenue =
      payments.reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amount
          ),
        0
      );

    const telebirr =
      payments
        .filter(
          (p) =>
            p.method ===
            "telebirr"
        )
        .reduce(
          (sum, p) =>
            sum +
            Number(p.amount),
          0
        );

    const chapa =
      payments
        .filter(
          (p) =>
            p.method ===
            "chapa"
        )
        .reduce(
          (sum, p) =>
            sum +
            Number(p.amount),
          0
        );

    const cbeBirr =
      payments
        .filter(
          (p) =>
            p.method ===
            "cbe_birr"
        )
        .reduce(
          (sum, p) =>
            sum +
            Number(p.amount),
          0
        );

    return {
      totalRevenue,

      totalTransactions:
        payments.length,

      paymentMethodBreakdown: {
        telebirr,
        chapa,
        cbe_birr: cbeBirr,
      },

      occupancyRate: 0,
    };
  },

  async registerReceptionist({
    name,
    fullName,
    email,
    phone,
    guesthouseId,
  }) {
    const response =
      await api.post(
        "/owner/receptionists",
        {
          fullName:
            fullName || name,

          email,

          phone,

          guesthouseId,
        }
      );

    return mapUserFromBackend(
      unwrap(response)
    );
  },

  async assignReceptionist({
    staffId,
  }) {
    const response =
      await api.post(
        "/owner/receptionists/assign",
        {
          staffId,
        }
      );

    return unwrap(response);
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

  async getOwnerReceptionists() {
    const response =
      await api.get(
        "/owner/receptionists"
      );

    return (
      unwrap(response) || []
    ).map(
      mapUserFromBackend
    );
  },

  async getOwnerDashboardStats() {
    const response =
      await api.get(
        "/dashboard/owner"
      );

    return unwrap(response);
  },

  async getOwnerDashboardRevenue() {
    const response =
      await api.get(
        "/dashboard/owner/revenue"
      );

    return unwrap(response);
  },

  async getOwnerDashboardRecentReservations() {
    const response =
      await api.get(
        "/dashboard/owner/recent-reservations"
      );

    return (
      unwrap(response) || []
    ).map(
      mapReservationFromBackend
    );
  },

  async getOwnerDashboardRecentPayments() {
    const response =
      await api.get(
        "/dashboard/owner/recent-payments"
      );

    return (
      unwrap(response) || []
    ).map(
      mapPaymentFromBackend
    );
  },

  async createReview(
    reviewData
  ) {
    const response =
      await api.post(
        "/reviews",
        reviewData
      );

    return unwrap(response);
  },

  async getOwnerReviews() {
    const response =
      await api.get(
        "/reviews/owner-reviews"
      );

    return unwrap(response);
  },

  async respondToReview(
    reviewId,
    ownerResponse
  ) {
    const response =
      await api.put(
        `/reviews/${reviewId}/respond`,
        {
          response:
            ownerResponse,
        }
      );

    return unwrap(response);
  },
};

// ============================================================
// API SERVICE
// ============================================================

export const ApiService = {
  // ---------------- AUTH ----------------

  getCurrentUser() {
    return AuthService.getCurrentUser();
  },

  setCurrentUser(user) {
    AuthService.setCurrentUser(
      user
    );
  },

  async loginUser(
    email,
    password
  ) {
    return AuthService.loginUser(
      email,
      password
    );
  },

  async registerUser(
    userData
  ) {
    return AuthService.registerUser(
      userData
    );
  },

  // ---------------- GUESTHOUSES ----------------

  async getGuesthouses(
    filters = {}
  ) {
    return GuesthouseService
      .getGuesthouses(
        filters
      );
  },

  async getGuesthouseById(
    id
  ) {
    return GuesthouseService
      .getGuesthouseById(id);
  },

  async getMyGuesthouse() {
    return GuesthouseService
      .getMyGuesthouse();
  },

  async registerGuesthouse(
    data
  ) {
    return GuesthouseService
      .registerGuesthouse(data);
  },

  // ---------------- ROOMS ----------------

  async getRoomsForGuesthouse(
    guesthouseId
  ) {
    return RoomService
      .getRoomsForGuesthouse(
        guesthouseId
      );
  },

  async getRoomById(roomId) {
    return RoomService
      .getRoomById(roomId);
  },

  async addRoom(roomData) {
    return RoomService
      .addRoom(roomData);
  },

  async updateRoom(
    roomId,
    roomData
  ) {
    return RoomService
      .updateRoom(
        roomId,
        roomData
      );
  },

  async updateRoomAvailability(
    roomId,
    status
  ) {
    return RoomService
      .updateRoomAvailability(
        roomId,
        status
      );
  },

  async deleteRoom(
    roomId
  ) {
    return RoomService
      .deleteRoom(roomId);
  },

  // ---------------- BOOKINGS ----------------

  async createBookingAndPay(
    data
  ) {
    return BookingService
      .createBookingAndPay(data);
  },

  async getReservations(
    filters = {}
  ) {
    return BookingService
      .getReservations(
        filters
      );
  },

  async performCheckIn(
    reservationId
  ) {
    return BookingService
      .performCheckIn(
        reservationId
      );
  },

  async performCheckOut(
    reservationId
  ) {
    return BookingService
      .performCheckOut(
        reservationId
      );
  },

  // ---------------- RECEPTIONIST ----------------

  async getReceptionistDashboardStats() {
    return ReceptionistService
      .getReceptionistDashboardStats();
  },

  async getReceptionistReservations() {
    return ReceptionistService
      .getReceptionistReservations();
  },

  async getReceptionistArrivals() {
    return ReceptionistService
      .getReceptionistArrivals();
  },

  async getReceptionistDepartures() {
    return ReceptionistService
      .getReceptionistDepartures();
  },

  async getReceptionistInHouse() {
    return ReceptionistService
      .getReceptionistInHouse();
  },

  async getReceptionistRooms() {
    return ReceptionistService
      .getReceptionistRooms();
  },

  async updateReceptionistRoomAvailability(
    roomId,
    maintenanceStatus
  ) {
    return ReceptionistService
      .updateReceptionistRoomAvailability(
        roomId,
        maintenanceStatus
      );
  },

  async searchReceptionistReservations(
    term
  ) {
    return ReceptionistService
      .searchReceptionistReservations(
        term
      );
  },

  async checkInGuest(
    reservationId
  ) {
    return ReceptionistService
      .checkInGuest(
        reservationId
      );
  },

  async checkOutGuest(
    reservationId
  ) {
    return ReceptionistService
      .checkOutGuest(
        reservationId
      );
  },

  // ---------------- ADMIN ----------------

  async getAllUsers() {
    return AdminService
      .getAllUsers();
  },

  async fetchAdminUsers() {
    return AdminService
      .getAllUsers();
  },

  async updateUserRole(
    userId,
    newRole
  ) {
    return AdminService
      .updateUserRole(
        userId,
        newRole
      );
  },

  async getAdminPlatformStats() {
    return AdminService
      .getAdminPlatformStats();
  },

  async getAdminPendingGuesthouses() {
    return AdminService
      .getAdminPendingGuesthouses();
  },

  async approveGuesthouse(
    id
  ) {
    return AdminService
      .approveGuesthouse(id);
  },

  // ---------------- OWNER ----------------

  async getOwnerPayments(
    guesthouseId
  ) {
    return OwnerService
      .getOwnerPayments(
        guesthouseId
      );
  },

  async getOwnerRevenueReport(
    guesthouseId
  ) {
    return OwnerService
      .getOwnerRevenueReport(
        guesthouseId
      );
  },

  async registerReceptionist(
    data
  ) {
    return OwnerService
      .registerReceptionist(
        data
      );
  },

  async assignReceptionist(
    data
  ) {
    return OwnerService
      .assignReceptionist(
        data
      );
  },

  async removeReceptionistFromGuesthouse(
    staffId
  ) {
    return OwnerService
      .removeReceptionistFromGuesthouse(
        staffId
      );
  },

  async getOwnerReceptionists() {
    return OwnerService
      .getOwnerReceptionists();
  },

  async getOwnerDashboardStats() {
    return OwnerService
      .getOwnerDashboardStats();
  },

  async getOwnerDashboardRevenue() {
    return OwnerService
      .getOwnerDashboardRevenue();
  },

  async getOwnerDashboardRecentReservations() {
    return OwnerService
      .getOwnerDashboardRecentReservations();
  },

  async getOwnerDashboardRecentPayments() {
    return OwnerService
      .getOwnerDashboardRecentPayments();
  },

  // ---------------- REVIEWS ----------------

  async createReview(
    reviewData
  ) {
    return OwnerService
      .createReview(
        reviewData
      );
  },

  async getOwnerReviews() {
    return OwnerService
      .getOwnerReviews();
  },

  async respondToReview(
    reviewId,
    ownerResponse
  ) {
    return OwnerService
      .respondToReview(
        reviewId,
        ownerResponse
      );
  },
};