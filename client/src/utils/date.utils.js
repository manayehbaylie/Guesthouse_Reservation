export const parseCalendarDate = (value) => {
  const text = String(value || '').trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);

  if (match) {
    return new Date(
      Date.UTC(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3])
      )
    );
  }

  return new Date(value);
};

export const calculateCalendarNights = (checkIn, checkOut) => {
  const start = parseCalendarDate(checkIn);
  const end = parseCalendarDate(checkOut);

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
