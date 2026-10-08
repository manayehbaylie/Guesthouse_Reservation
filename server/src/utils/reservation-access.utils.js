export const buildReservationAccessWhere = (user) => {
  if (!user?.id) return null;

  switch (user.role) {
    case "GUEST":
      return { guestId: user.id };
    case "OWNER":
      return { room: { guesthouse: { ownerId: user.id } } };
    case "RECEPTIONIST":
      return {
        room: {
          guesthouse: {
            staffAssignments: { some: { staffId: user.id } },
          },
        },
      };
    case "ADMIN":
      return {};
    default:
      return null;
  }
};
