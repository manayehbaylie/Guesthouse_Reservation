import axios from "axios";

// ============================================================
// AXIOS INSTANCE
// ============================================================

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "/api",

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
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// RESPONSE HELPERS
// ============================================================

function getResponseData(response) {
  return response?.data?.data ?? response?.data ?? null;
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.details ||
    error?.message ||
    fallback
  );
}

// ============================================================
// NORMALIZERS
// ============================================================

function normalizeUser(user) {
  if (!user) return null;

  return {
    ...user,

    id: user.id != null ? Number(user.id) : user.id,

    name:
      user.name ||
      user.fullName ||
      "",

    fullName:
      user.fullName ||
      user.name ||
      "",

    role:
      user.role ||
      "GUEST",
  };
}

function normalizeGuesthouse(guesthouse) {
  if (!guesthouse) return null;

  const image =
    guesthouse.image ||
    guesthouse.images?.[0] ||
    "";

  return {
    ...guesthouse,

    id:
      guesthouse.id != null
        ? Number(guesthouse.id)
        : guesthouse.id,

    ownerId:
      guesthouse.ownerId != null
        ? Number(guesthouse.ownerId)
        : guesthouse.ownerId,

    name:
      guesthouse.name ||
      "",

    address:
      guesthouse.address ||
      guesthouse.location ||
      "",

    location:
      guesthouse.location ||
      guesthouse.address ||
      "",

    city:
      guesthouse.city ||
      "",

    description:
      guesthouse.description ||
      "",

    image,

    images:
      image
        ? [image]
        : [],

    status:
      String(
        guesthouse.status ||
        (guesthouse.approved
          ? "APPROVED"
          : "PENDING")
      ).toUpperCase(),

    amenities:
      Array.isArray(guesthouse.amenities)
        ? guesthouse.amenities
        : [],

    rooms:
      Array.isArray(guesthouse.rooms)
        ? guesthouse.rooms.map(normalizeRoom)
        : [],
  };
}

function normalizeRoom(room) {
  if (!room) return null;

  return {
    ...room,

    id:
      room.id != null
        ? Number(room.id)
        : room.id,

    guesthouseId:
      room.guesthouseId != null
        ? Number(room.guesthouseId)
        : room.guesthouseId,

    roomNumber:
      room.roomNumber ||
      "",

    roomType:
      room.roomType ||
      room.type ||
      "SINGLE",

    type:
      room.type ||
      room.roomType ||
      "SINGLE",

    price:
      room.price != null
        ? Number(room.price)
        : 0,

    pricePerNight:
      room.pricePerNight != null
        ? Number(room.pricePerNight)
        : Number(room.price || 0),

    capacity:
      room.capacity != null
        ? Number(room.capacity)
        : 1,

    available:
      room.available !== false,

    availabilityStatus:
      room.available === false
        ? "unavailable"
        : "available",

    guesthouse:
      room.guesthouse
        ? normalizeGuesthouseWithoutRooms(
            room.guesthouse
          )
        : room.guesthouse,
  };
}

function normalizeGuesthouseWithoutRooms(
  guesthouse
) {
  if (!guesthouse) return null;

  return {
    ...guesthouse,

    id:
      guesthouse.id != null
        ? Number(guesthouse.id)
        : guesthouse.id,

    ownerId:
      guesthouse.ownerId != null
        ? Number(guesthouse.ownerId)
        : guesthouse.ownerId,

    name:
      guesthouse.name || "",

    address:
      guesthouse.address ||
      guesthouse.location ||
      "",

    location:
      guesthouse.location ||
      guesthouse.address ||
      "",

    city:
      guesthouse.city ||
      "",

    description:
      guesthouse.description ||
      "",

    image:
      guesthouse.image ||
      guesthouse.images?.[0] ||
      "",

    status:
      String(
        guesthouse.status ||
        "PENDING"
      ).toUpperCase(),
  };
}

function normalizeReservation(
  reservation
) {
  if (!reservation) return null;

  return {
    ...reservation,

    id:
      reservation.id != null
        ? Number(reservation.id)
        : reservation.id,

    guestId:
      reservation.guestId != null
        ? Number(reservation.guestId)
        : reservation.guestId,

    roomId:
      reservation.roomId != null
        ? Number(reservation.roomId)
        : reservation.roomId,

    status:
      String(
        reservation.status ||
        "PENDING"
      ).toUpperCase(),

    guest:
      reservation.guest
        ? normalizeUser(
            reservation.guest
          )
        : reservation.guest,

    room:
      reservation.room
        ? normalizeRoom(
            reservation.room
          )
        : reservation.room,

    payment:
      reservation.payment
        ? {
            ...reservation.payment,

            id:
              reservation.payment.id != null
                ? Number(
                    reservation.payment.id
                  )
                : reservation.payment.id,

            amount:
              reservation.payment.amount != null
                ? Number(
                    reservation.payment.amount
                  )
                : 0,

            method:
              String(
                reservation.payment.method ||
                ""
              ).toUpperCase(),

            status:
              String(
                reservation.payment.status ||
                ""
              ).toUpperCase(),
          }
        : reservation.payment,
  };
}

// ============================================================
// API SERVICE
// ============================================================

export const ApiService = {

  // ==========================================================
  // AUTH
  // ==========================================================

  getCurrentUser() {
    const raw =
      localStorage.getItem(
        "currentUser"
      );

    if (!raw) {
      return null;
    }

    try {
      return normalizeUser(
        JSON.parse(raw)
      );
    } catch {
      localStorage.removeItem(
        "currentUser"
      );

      return null;
    }
  },

  setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem(
        "currentUser"
      );

      localStorage.removeItem(
        "token"
      );

      return;
    }

    localStorage.setItem(
      "currentUser",
      JSON.stringify(
        normalizeUser(user)
      )
    );
  },

  logout() {
    localStorage.removeItem(
      "currentUser"
    );

    localStorage.removeItem(
      "token"
    );
  },

  // ==========================================================
  // LOGIN
  // ==========================================================

  async loginUser(
    email,
    password
  ) {
    try {
      const response =
        await api.post(
          "/auth/login",
          {
            email,
            password,
          }
        );

      const result =
        getResponseData(response);

      if (!result) {
        throw new Error(
          "Invalid response from server."
        );
      }

      if (result.token) {
        localStorage.setItem(
          "token",
          result.token
        );
      }

      const user =
        normalizeUser(
          result.user ||
          result
        );

      if (user) {
        this.setCurrentUser(
          user
        );
      }

      return {
        ...result,
        user,
      };
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      throw new Error(
        getErrorMessage(
          error,
          "Login failed."
        )
      );
    }
  },

  // ==========================================================
  // REGISTER
  // ==========================================================

  async registerUser(
    userData = {}
  ) {
    try {
      const payload = {
        fullName:
          userData.fullName ||
          userData.name ||
          "",

        email:
          userData.email,

        password:
          userData.password,

        phone:
          userData.phone,

        role:
          String(
            userData.role ||
            "GUEST"
          ).toUpperCase(),
      };

      if (
        payload.role === "OWNER"
      ) {
        if (
          userData.guesthouseName
        ) {
          payload.guesthouseName =
            userData.guesthouseName;
        }

        if (
          userData.guesthouseAddress
        ) {
          payload.guesthouseAddress =
            userData.guesthouseAddress;
        }

        if (userData.city) {
          payload.city =
            userData.city;
        }

        if (
          userData.guesthouseDescription
        ) {
          payload.guesthouseDescription =
            userData.guesthouseDescription;
        }

        if (
          userData.guesthouseImage
        ) {
          payload.guesthouseImage =
            userData.guesthouseImage;
        }
      }

      const response =
        await api.post(
          "/auth/register",
          payload
        );

      const result =
        getResponseData(response);

      if (!result) {
        throw new Error(
          "Invalid response from server."
        );
      }

      if (result.token) {
        localStorage.setItem(
          "token",
          result.token
        );
      }

      if (result.user) {
        const user =
          normalizeUser(
            result.user
          );

        this.setCurrentUser(
          user
        );

        return {
          ...result,
          user,
        };
      }

      return result;
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      throw new Error(
        getErrorMessage(
          error,
          "Registration failed."
        )
      );
    }
  },

  // ==========================================================
  // USERS
  // ==========================================================

  async getAllUsers() {
    try {
      const response =
        await api.get(
          "/admin/users"
        );

      const users =
        getResponseData(
          response
        ) || [];

      return Array.isArray(users)
        ? users.map(
            normalizeUser
          )
        : [];
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Failed to load users."
        )
      );
    }
  },

  // ==========================================================
  // GUESTHOUSES - PUBLIC
  // ==========================================================

  async getGuesthouses(
    filters = {}
  ) {
    try {
      const params = {};

      // Backend /api/guesthouses reads:
      // q, city, checkIn, checkOut, maxPrice, minPrice (see guesthouse.service.js)
      if (
        filters.city &&
        filters.city !== "All Cities"
      ) {
        params.city =
          filters.city;
      }

      if (filters.keyword) {
        params.q =
          filters.keyword;
      }

      if (
        filters.checkIn &&
        filters.checkIn !== ""
      ) {
        params.checkIn =
          filters.checkIn;
      }

      if (
        filters.checkOut &&
        filters.checkOut !== ""
      ) {
        params.checkOut =
          filters.checkOut;
      }

      if (
        filters.maxPrice !==
        undefined &&
        filters.maxPrice !== null &&
        filters.maxPrice !== ""
      ) {
        params.maxPrice =
          filters.maxPrice;
      }

      if (
        filters.minPrice !==
        undefined &&
        filters.minPrice !== null &&
        filters.minPrice !== ""
      ) {
        params.minPrice =
          filters.minPrice;
      }

      const response =
        await api.get(
          "/guesthouses",
          {
            params,
          }
        );

      let list =
        getResponseData(
          response
        ) || [];

      if (!Array.isArray(list)) {
        return [];
      }

      return list
        .map(
          normalizeGuesthouse
        )
        .filter(Boolean);
    } catch (error) {
      console.error(
        "Get guesthouses error:",
        error
      );

      throw new Error(
        getErrorMessage(
          error,
          "Failed to load guesthouses."
        )
      );
    }
  },

  // ==========================================================
  // OWNER GUESTHOUSES
  // ==========================================================

  async getOwnerGuesthouses(
    ownerId
  ) {
    try {
      const numericOwnerId =
        Number(ownerId);

      if (
        !Number.isInteger(
          numericOwnerId
        )
      ) {
        return [];
      }

      /*
       * Important:
       * Do NOT use getGuesthouses() here because
       * the public endpoint may only return APPROVED
       * guesthouses.
       *
       * Owners need to see:
       * PENDING
       * APPROVED
       * REJECTED
       */

      const response =
        await api.get(
          "/guesthouses",
          {
            params: {
              ownerId:
                numericOwnerId,
            },
          }
        );

      let list =
        getResponseData(
          response
        ) || [];

      if (!Array.isArray(list)) {
        return [];
      }

      list =
        list.filter(
          (guesthouse) =>
            Number(
              guesthouse.ownerId
            ) ===
            numericOwnerId
        );

      return list
        .map(
          normalizeGuesthouse
        )
        .filter(Boolean);
    } catch (error) {
      console.error(
        "Get owner guesthouses error:",
        error
      );

      throw new Error(
        getErrorMessage(
          error,
          "Failed to load your guesthouses."
        )
      );
    }
  },

  // ==========================================================
  // SINGLE GUESTHOUSE
  // ==========================================================

  async getGuesthouseById(
    id
  ) {
    try {
      const numericId =
        Number(id);

      if (
        !Number.isInteger(
          numericId
        )
      ) {
        return null;
      }

      const response =
        await api.get(
          `/guesthouses/${numericId}`
        );

      return normalizeGuesthouse(
        getResponseData(
          response
        )
      );
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Failed to load guesthouse."
        )
      );
    }
  },

  // ==========================================================
  // CREATE GUESTHOUSE
  // ==========================================================

  async registerGuesthouse(
    data = {}
  ) {
    try {
      const payload = {
        name:
          data.name ||
          "",

        address:
          data.address ||
          data.location ||
          "",

        city:
          data.city ||
          "",

        description:
          data.description ||
          "",

        image:
          data.image ||
          data.images?.[0] ||
          null,
      };

      const response =
        data.id
          ? await api.put(
              `/guesthouses/${Number(
                data.id
              )}`,
              payload
            )
          : await api.post(
              "/guesthouses",
              payload
            );

      return normalizeGuesthouse(
        getResponseData(
          response
        )
      );
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Failed to save guesthouse."
        )
      );
    }
  },

  // ==========================================================
  // ROOMS
  // ==========================================================

  async getRoomsForGuesthouse(
    guesthouseId
  ) {
    try {
      const id =
        Number(guesthouseId);

      if (
        !Number.isInteger(id)
      ) {
        return [];
      }

      const response =
        await api.get(
          "/rooms",
          {
            params: {
              guesthouseId: id,
            },
          }
        );

      const rooms =
        getResponseData(
          response
        ) || [];

      if (!Array.isArray(rooms)) {
        return [];
      }

      return rooms
        .map(normalizeRoom)
        .filter(Boolean);
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Failed to load rooms."
        )
      );
    }
  },

  async getRoomById(
    roomId
  ) {
    try {
      const response =
        await api.get(
          `/rooms/${Number(
            roomId
          )}`
        );

      return normalizeRoom(
        getResponseData(
          response
        )
      );
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Failed to load room."
        )
      );
    }
  },

  // ==========================================================
  // ADD ROOM
  // ==========================================================

  async addRoom(
    roomData = {}
  ) {
    try {
      const roomTypeMap = {
        Single: "SINGLE",
        "Single Room": "SINGLE",

        Double: "DOUBLE",
        "Double Room": "DOUBLE",

        Twin: "TWIN",
        "Twin Room": "TWIN",

        Family: "FAMILY",
        "Family Room": "FAMILY",

        Suite: "SUITE",
        "Deluxe Suite": "SUITE",
      };

      const rawType =
        roomData.roomType ||
        roomData.type ||
        "SINGLE";

      const roomType =
        roomTypeMap[rawType] ||
        String(rawType)
          .toUpperCase()
          .replace(
            /\s+ROOM$/,
            ""
          )
          .replace(
            /\s+SUITE$/,
            ""
          );

      const validTypes = [
        "SINGLE",
        "DOUBLE",
        "TWIN",
        "FAMILY",
        "SUITE",
      ];

      const payload = {
        roomNumber:
          roomData.roomNumber,

        roomType:
          validTypes.includes(
            roomType
          )
            ? roomType
            : "SINGLE",

        price:
          Number(
            roomData.pricePerNight ??
            roomData.price ??
            0
          ),

        capacity:
          Number(
            roomData.capacity ||
            1
          ),

        available:
          roomData.availabilityStatus !==
          "unavailable",
      };

      const response =
        await api.post(
          `/rooms/${Number(
            roomData.guesthouseId
          )}`,
          payload
        );

      return normalizeRoom(
        getResponseData(
          response
        )
      );
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Failed to add room."
        )
      );
    }
  },

  // ==========================================================
  // UPDATE ROOM
  // ==========================================================

  async updateRoomAvailability(
    roomId,
    status
  ) {
    try {
      const existing =
        await this.getRoomById(
          roomId
        );

      if (!existing) {
        throw new Error(
          "Room not found."
        );
      }

      const response =
        await api.put(
          `/rooms/${Number(
            roomId
          )}`,
          {
            roomNumber:
              existing.roomNumber,

            roomType:
              existing.roomType,

            price:
              Number(
                existing.price
              ),

            capacity:
              Number(
                existing.capacity
              ),

            available:
              status ===
              "available",
          }
        );

      return normalizeRoom(
        getResponseData(
          response
        )
      );
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Failed to update room."
        )
      );
    }
  },

  // ==========================================================
  // RESERVATIONS
  // ==========================================================

  async createReservation({
    roomId,
    checkInDate,
    checkOutDate,
    checkIn,
    checkOut,
  }) {
    try {
      const response =
        await api.post(
          "/reservations",
          {
            roomId:
              Number(roomId),

            checkIn:
              checkIn ||
              checkInDate,

            checkOut:
              checkOut ||
              checkOutDate,

            status:
              "PENDING",
          }
        );

      return normalizeReservation(
        getResponseData(
          response
        )
      );
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Failed to create reservation."
        )
      );
    }
  },

  // ==========================================================
  // ALL RESERVATIONS
  // ==========================================================

  async getReservations(
    filters = {}
  ) {
    try {
      const params = {};

      if (filters.guestId) {
        params.guestId =
          Number(
            filters.guestId
          );
      }

      if (filters.guesthouseId) {
        params.guesthouseId =
          Number(
            filters.guesthouseId
          );
      }

      if (filters.ownerId) {
        params.ownerId =
          Number(
            filters.ownerId
          );
      }

      const response =
        await api.get(
          "/reservations",
          {
            params,
          }
        );

      const list =
        getResponseData(
          response
        ) || [];

      if (!Array.isArray(list)) {
        return [];
      }

      return list
        .map(
          normalizeReservation
        )
        .filter(Boolean);
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Failed to load reservations."
        )
      );
    }
  },

  // ==========================================================
  // OWNER RESERVATIONS
  // ==========================================================

  async getOwnerReservations(
    ownerId
  ) {
    try {
      const numericOwnerId =
        Number(ownerId);

      if (
        !Number.isInteger(
          numericOwnerId
        )
      ) {
        return [];
      }

      const response =
        await api.get(
          "/reservations",
          {
            params: {
              ownerId:
                numericOwnerId,
            },
          }
        );

      const list =
        getResponseData(
          response
        ) || [];

      if (!Array.isArray(list)) {
        return [];
      }

      return list
        .map(
          normalizeReservation
        )
        .filter(Boolean);
    } catch (error) {
      console.error(
        "Get owner reservations error:",
        error
      );

      throw new Error(
        getErrorMessage(
          error,
          "Failed to load owner reservations."
        )
      );
    }
  },

  async getReservationById(
    reservationId
  ) {
    try {
      const response =
        await api.get(
          `/reservations/${Number(
            reservationId
          )}`
        );

      return normalizeReservation(
        getResponseData(
          response
        )
      );
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Failed to load reservation."
        )
      );
    }
  },

  // ==========================================================
  // CHECK IN
  // ==========================================================

  async performCheckIn(
    reservationId
  ) {
    try {
      const response =
        await api.put(
          `/reservations/${Number(
            reservationId
          )}/checkin`
        );

      return getResponseData(
        response
      );
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Check-in failed."
        )
      );
    }
  },

  // ==========================================================
  // CHECK OUT
  // ==========================================================

  async performCheckOut(
    reservationId
  ) {
    try {
      const response =
        await api.put(
          `/reservations/${Number(
            reservationId
          )}/checkout`
        );

      return getResponseData(
        response
      );
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Check-out failed."
        )
      );
    }
  },

  // ==========================================================
  // BOOKING + PAYMENT
  // ==========================================================

  async createBookingAndPay({
    roomId,
    checkInDate,
    checkOutDate,
    paymentMethod,
    phone,
    accountNumber,
  }) {
    try {
      const reservation =
        await this.createReservation({
          roomId,
          checkInDate,
          checkOutDate,
        });

      if (!reservation) {
        throw new Error(
          "Reservation was not created."
        );
      }

      const payment =
        await this.initiatePayment({
          reservationId:
            reservation.id,

          method:
            paymentMethod,

          phone,

          accountNumber,
        });

      return {
        reservation,
        payment,
      };
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Booking failed."
        )
      );
    }
  },

  // ==========================================================
  // PAYMENT
  // ==========================================================

  async initiatePayment({
    reservationId,
    method,
    phone,
    accountNumber,
  }) {
    try {
      const response =
        await api.post(
          "/payments/initiate",
          {
            reservationId:
              Number(
                reservationId
              ),

            method:
              String(
                method || ""
              ).toUpperCase(),

            phone:
              phone ||
              undefined,

            accountNumber:
              accountNumber ||
              undefined,
          }
        );

      return getResponseData(
        response
      );
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Payment initiation failed."
        )
      );
    }
  },

  async getPaymentHistory() {
    try {
      const response =
        await api.get(
          "/payments/history"
        );

      return (
        getResponseData(
          response
        ) || []
      );
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Failed to load payment history."
        )
      );
    }
  },

  // ==========================================================
  // OWNER PAYMENTS
  // ==========================================================

  async getOwnerPayments(
    guesthouseId
  ) {
    try {
      const response =
        await api.get(
          "/payments"
        );

      let payments =
        getResponseData(
          response
        ) || [];

      if (!Array.isArray(payments)) {
        return [];
      }

      if (guesthouseId) {
        payments =
          payments.filter(
            (payment) =>
              Number(
                payment.reservation
                  ?.room
                  ?.guesthouseId
              ) ===
              Number(
                guesthouseId
              )
          );
      }

      return payments.map(
        (payment) => ({
          ...payment,

          id:
            payment.id != null
              ? Number(
                  payment.id
                )
              : payment.id,

          amount:
            payment.amount != null
              ? Number(
                  payment.amount
                )
              : 0,

          method:
            String(
              payment.method ||
              ""
            ).toLowerCase(),

          status:
            String(
              payment.status ||
              ""
            ).toLowerCase(),

          guestName:
            payment.reservation
              ?.guest
              ?.fullName ||
            "Guest",
        })
      );
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Failed to load payments."
        )
      );
    }
  },

  // ==========================================================
  // OWNER REVENUE
  // ==========================================================

  async getOwnerRevenueReport(
    guesthouseId
  ) {
    const payments =
      await this.getOwnerPayments(
        guesthouseId
      );

    const paid =
      payments.filter(
        (payment) =>
          payment.status ===
          "paid"
      );

    const totalRevenue =
      paid.reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amount || 0
          ),
        0
      );

    return {
      totalRevenue,

      totalTransactions:
        paid.length,

      paymentMethodBreakdown: {
        telebirr:
          paid
            .filter(
              (payment) =>
                payment.method ===
                "telebirr"
            )
            .reduce(
              (sum, payment) =>
                sum +
                Number(
                  payment.amount ||
                  0
                ),
              0
            ),

        bank_transfer:
          paid
            .filter(
              (payment) =>
                payment.method ===
                "bank_transfer"
            )
            .reduce(
              (sum, payment) =>
                sum +
                Number(
                  payment.amount ||
                  0
                ),
              0
            ),
      },
    };
  },

  // ==========================================================
  // RECEPTIONIST
  // ==========================================================

  async getReceptionistArrivals(
    guesthouseId
  ) {
    try {
      const response =
        await api.get(
          "/receptionist/arrivals",
          {
            params:
              guesthouseId
                ? {
                    guesthouseId:
                      Number(
                        guesthouseId
                      ),
                  }
                : {},
          }
        );

      return (
        getResponseData(
          response
        ) || []
      );
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Failed to load arrivals."
        )
      );
    }
  },

  async getReceptionistDepartures(
    guesthouseId
  ) {
    try {
      const response =
        await api.get(
          "/receptionist/departures",
          {
            params:
              guesthouseId
                ? {
                    guesthouseId:
                      Number(
                        guesthouseId
                      ),
                  }
                : {},
          }
        );

      return (
        getResponseData(
          response
        ) || []
      );
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Failed to load departures."
        )
      );
    }
  },

  // ==========================================================
  // ADMIN
  // ==========================================================

  async getAdminPlatformStats() {
    try {
      const response =
        await api.get(
          "/admin/reports"
        );

      return (
        getResponseData(
          response
        ) || {}
      );
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Failed to load admin statistics."
        )
      );
    }
  },

  async getAdminReport() {
    try {
      const response =
        await api.get(
          "/admin/reports"
        );

      return (
        getResponseData(
          response
        ) || {}
      );
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Failed to load platform report."
        )
      );
    }
  },

  async getSystemActivity() {
    try {
      const response =
        await api.get(
          "/admin/activity"
        );

      return (
        getResponseData(
          response
        ) || []
      );
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Failed to load system activity."
        )
      );
    }
  },

  async getAdminPendingGuesthouses() {
    try {
      const response =
        await api.get(
          "/guesthouses",
          {
            params: {
              status:
                "PENDING",
            },
          }
        );

      const list =
        getResponseData(
          response
        ) || [];

      if (!Array.isArray(list)) {
        return [];
      }

      return list
        .map(
          normalizeGuesthouse
        )
        .filter(
          (guesthouse) =>
            guesthouse.status ===
            "PENDING"
        );
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Failed to load pending guesthouses."
        )
      );
    }
  },

  async approveGuesthouse(
    id
  ) {
    try {
      const response =
        await api.put(
          `/admin/guesthouses/${Number(
            id
          )}/approve`
        );

      return normalizeGuesthouse(
        getResponseData(
          response
        )
      );
    } catch (error) {
      throw new Error(
        getErrorMessage(
          error,
          "Failed to approve guesthouse."
        )
      );
    }
  },

  // ==========================================================
  // SEARCH
  // ==========================================================

  async searchGuesthouses({
    location = "",
    city = "",
    maxPrice = "",
    keyword = "",
  } = {}) {
    return this.getGuesthouses({
      location,
      city,
      maxPrice,
      keyword,
    });
  },
};

// ============================================================
// NAMED EXPORTS
// ============================================================

export const getGuesthouses =
  (...args) =>
    ApiService.getGuesthouses(
      ...args
    );

export const getGuesthouseById =
  (...args) =>
    ApiService.getGuesthouseById(
      ...args
    );

export const getRoomsForGuesthouse =
  (...args) =>
    ApiService.getRoomsForGuesthouse(
      ...args
    );

export const createReservation =
  (...args) =>
    ApiService.createReservation(
      ...args
    );

export const createBookingAndPay =
  (...args) =>
    ApiService.createBookingAndPay(
      ...args
    );

export const loginUser =
  (...args) =>
    ApiService.loginUser(
      ...args
    );

export const registerUser =
  (...args) =>
    ApiService.registerUser(
      ...args
    );