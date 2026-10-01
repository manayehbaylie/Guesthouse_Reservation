export const reservationOverlapWhere = (
  roomId,
  checkIn,
  checkOut,
  excludeReservationId
) => ({
  ...(roomId !== null && { roomId }),
  ...(excludeReservationId !== undefined && {
    id: { not: excludeReservationId },
  }),
  checkIn: { lt: checkOut },
  checkOut: { gt: checkIn },
  OR: [
    { status: "PENDING" },
    { status: "CHECKED_IN" },
    {
      status: "CONFIRMED",
      payment: { is: { status: "PAID" } },
    },
  ],
});