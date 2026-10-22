import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { LocateFixed } from "lucide-react";
import { SecondaryButton } from "./VimiButton";

const icon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function ClickHandler({ onClick }) {
  useMapEvents({ click: (e) => onClick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

export default function MapPicker({ value, onChange }) {
  const initial = value || { lat: 41.3111, lng: 69.2406 };
  const [pos, setPos] = useState(initial);

  const set = (p) => { setPos(p); onChange(p); };

  const detect = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (g) => set({ lat: g.coords.latitude, lng: g.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="space-y-2">
      <MapContainer
        center={[initial.lat, initial.lng]}
        zoom={13}
        scrollWheelZoom
        className="relative z-0 h-[300px] w-full overflow-hidden rounded-2xl border border-border"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        <Marker
          position={[pos.lat, pos.lng]}
          icon={icon}
          draggable
          eventHandlers={{ dragend: (e) => { const p = e.target.getLatLng(); set({ lat: p.lat, lng: p.lng }); } }}
        />
        <ClickHandler onClick={set} />
      </MapContainer>
      <SecondaryButton type="button" className="h-10" onClick={detect}>
        <LocateFixed className="mr-1.5 h-4 w-4" aria-hidden="true" />
        Joylashuvimni aniqlash
      </SecondaryButton>
    </div>
  );
}