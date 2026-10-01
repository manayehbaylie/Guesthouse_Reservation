export const parseDateOnly = (value) => {
  const text = String(value || '').trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);

  if (!match) {
    return new Date(value);
  }

  return new Date(
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    )
  );
};

export const calculateNights = (checkIn, checkOut) => {
  const start = parseDateOnly(checkIn);
  const end = parseDateOnly(checkOut);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    return 0;
  }

  return Math.round(
    (end.getTime() - start.getTime()) /
      (1000 * 60 * 60 * 24)
  );
};
