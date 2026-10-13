import React, { useEffect } from "react";
import L from "leaflet";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const INITIAL_MAP_CENTER = [9.03, 38.74];

const hasCoordinates = (location) =>
  location?.latitude !== null &&
  location?.latitude !== undefined &&
  location?.latitude !== "" &&
  location?.longitude !== null &&
  location?.longitude !== undefined &&
  location?.longitude !== "" &&
  Number.isFinite(Number(location.latitude)) &&
  Number.isFinite(Number(location.longitude)) &&
  Number(location.latitude) >= -90 &&
  Number(location.latitude) <= 90 &&
  Number(location.longitude) >= -180 &&
  Number(location.longitude) <= 180;

function MapViewport({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, map, zoom]);

  return null;
}

function MapFitResults({ markers, center, radiusKm }) {
  const map = useMap();

  useEffect(() => {
    const points = markers
      .filter(hasCoordinates)
      .map((marker) => [Number(marker.latitude), Number(marker.longitude)]);

    if (center) {
      const latitude = Number(center.latitude);
      const longitude = Number(center.longitude);
      points.push([latitude, longitude]);

      if (radiusKm) {
        const latitudeOffset = Number(radiusKm) / 111;
        const longitudeOffset =
          Number(radiusKm) /
          (111 * Math.max(0.01, Math.cos((latitude * Math.PI) / 180)));
        points.push(
          [Math.min(90, latitude + latitudeOffset), longitude],
          [Math.max(-90, latitude - latitudeOffset), longitude],
          [latitude, Math.min(180, longitude + longitudeOffset)],
          [latitude, Math.max(-180, longitude - longitudeOffset)]
        );
      }
    }

    if (points.length > 1) {
      map.fitBounds(points, { padding: [24, 24], maxZoom: 14 });
    }
  }, [center, map, markers, radiusKm]);

  return null;
}

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(event) {
      onLocationSelect({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });

  return null;
}

export function GuesthouseLocationMap({
  value,
  onLocationSelect,
  markers = [],
  center: centerOverride,
  radiusKm,
  height = "380px",
  zoom = 13,
}) {
  const hasValue = hasCoordinates(value);
  const firstMarker = markers.find(
    hasCoordinates
  );
  const center = centerOverride
    ? [Number(centerOverride.latitude), Number(centerOverride.longitude)]
    : hasValue
      ? [Number(value.latitude), Number(value.longitude)]
      : firstMarker
        ? [Number(firstMarker.latitude), Number(firstMarker.longitude)]
        : INITIAL_MAP_CENTER;
  const validCenter = center.every(Number.isFinite)
    ? center
    : INITIAL_MAP_CENTER;

  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-200"
      style={{ height }}
    >
      <MapContainer
        center={validCenter}
        zoom={zoom}
        scrollWheelZoom
        className={`h-full w-full ${onLocationSelect ? "cursor-crosshair" : ""}`}
      >
        <MapViewport center={validCenter} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onLocationSelect && (
          <MapClickHandler onLocationSelect={onLocationSelect} />
        )}
        {hasValue && (
          <CircleMarker
            center={[Number(value.latitude), Number(value.longitude)]}
            radius={9}
            pathOptions={{
              color: "#ffffff",
              fillColor: "#d97706",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Popup>Selected guesthouse location</Popup>
          </CircleMarker>
        )}
        {radiusKm && centerOverride && (
          <Circle
            center={validCenter}
            radius={Number(radiusKm) * 1000}
            pathOptions={{
              color: "#d97706",
              fillColor: "#fbbf24",
              fillOpacity: 0.08,
              weight: 2,
            }}
          />
        )}
        {markers.map((marker) => {
          if (!hasCoordinates(marker)) {
            return null;
          }
          const latitude = Number(marker.latitude);
          const longitude = Number(marker.longitude);

          return (
            <CircleMarker
              key={marker.id}
              center={[latitude, longitude]}
              radius={8}
              pathOptions={{
                color: "#ffffff",
                fillColor: "#0b2f4a",
                fillOpacity: 1,
                weight: 2,
              }}
            >
              <Popup>
                <strong>{marker.name}</strong>
                {marker.distanceKm !== null &&
                  marker.distanceKm !== undefined && (
                    <div>{Number(marker.distanceKm).toFixed(1)} km away</div>
                  )}
              </Popup>
            </CircleMarker>
          );
        })}
        {!onLocationSelect && (
          <MapFitResults
            markers={markers}
            center={centerOverride}
            radiusKm={radiusKm}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default GuesthouseLocationMap;
