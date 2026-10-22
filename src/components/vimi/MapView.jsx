import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const icon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -34]
});

export default function MapView({ branches, onSelect, className }) {
  const points = branches.filter((b) => b.latitude && b.longitude);
  if (points.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 text-sm text-muted-foreground">
        Joylashuv ma'lumotlari yo'q
      </div>
    );
  }
  const center = [points[0].latitude, points[0].longitude];
  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom
        className="relative z-0 h-[360px] w-full overflow-hidden rounded-2xl border border-border"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        {points.map((b) => (
          <Marker key={b.id} position={[b.latitude, b.longitude]} icon={icon} eventHandlers={{ click: () => onSelect?.(b) }}>
            <Popup>
              <strong>{b.name}</strong>
              <br />
              {b.address || ""}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}