export const parseOptionalCoordinates = (input = {}) => {
  const hasLatitude = input.latitude !== undefined;
  const hasLongitude = input.longitude !== undefined;

  if (!hasLatitude && !hasLongitude) {
    return {};
  }

  const latitudeIsEmpty =
    input.latitude === undefined ||
    input.latitude === null ||
    input.latitude === "";
  const longitudeIsEmpty =
    input.longitude === undefined ||
    input.longitude === null ||
    input.longitude === "";

  if (latitudeIsEmpty && longitudeIsEmpty) {
    return { latitude: null, longitude: null };
  }

  if (latitudeIsEmpty || longitudeIsEmpty) {
    throw Object.assign(
      new Error("Latitude and longitude must be provided together."),
      { statusCode: 400 }
    );
  }

  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw Object.assign(
      new Error("Latitude or longitude is outside the valid range."),
      { statusCode: 400 }
    );
  }

  return { latitude, longitude };
};
