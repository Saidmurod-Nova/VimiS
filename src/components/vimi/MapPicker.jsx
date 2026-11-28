import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { LocateFixed, Loader2, MapPin, RotateCcw } from "lucide-react";
import { GhostButton, SecondaryButton } from "./VimiButton";
import { getCurrentPosition } from "@/lib/location";

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

function MapViewUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (!position) return;
    map.setView([position.lat, position.lng], map.getZoom());
  }, [map, position?.lat, position?.lng]);
  return null;
}

export default function MapPicker({ value, onChange }) {
  const defaultCenter = { lat: 41.3111, lng: 69.2406 };
  const [pos, setPos] = useState(value || null);
  const [locationError, setLocationError] = useState("");
  const [detecting, setDetecting] = useState(false);

  const set = (p) => { setPos(p); setLocationError(""); onChange(p); };

  useEffect(() => {
    setPos(value || null);
  }, [value?.lat, value?.lng]);

  const detect = async () => {
    setDetecting(true);
    setLocationError("");
    try {
      set(await getCurrentPosition());
    } catch (error) {
      setLocationError(error?.message || "Joylashuv aniqlanmadi. Qayta urinib ko‘ring yoki xaritada nuqtani tanlang.");
    } finally {
      setDetecting(false);
    }
  };

  const clear = () => {
    setPos(null);
    setLocationError("");
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <SecondaryButton type="button" className="h-10 flex-1" onClick={detect} disabled={detecting}>
          {detecting
            ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
            : <LocateFixed className="mr-1.5 h-4 w-4" aria-hidden="true" />}
          {detecting ? "Joylashuv aniqlanmoqda..." : "Joriy joylashuvni olish"}
        </SecondaryButton>
        {pos && (
          <GhostButton type="button" className="h-10 gap-2" onClick={clear}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Nuqtani tozalash
          </GhostButton>
        )}
      </div>
      {locationError && (
        <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {locationError}
        </p>
      )}
      <MapContainer
        center={[pos?.lat ?? defaultCenter.lat, pos?.lng ?? defaultCenter.lng]}
        zoom={pos ? 15 : 11}
        scrollWheelZoom
        className="relative z-0 h-[280px] w-full overflow-hidden rounded-2xl border border-border sm:h-[340px]"
      >
        <MapViewUpdater position={pos} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        {pos && (
          <Marker
            position={[pos.lat, pos.lng]}
            icon={icon}
            draggable
            eventHandlers={{ dragend: (e) => { const p = e.target.getLatLng(); set({ lat: p.lat, lng: p.lng }); } }}
          />
        )}
        <ClickHandler onClick={set} />
      </MapContainer>
      <div className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <p>{pos
          ? `Nuqta tanlandi: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}. Aniqligini tekshirish uchun belgini suring.`
            : "Xaritadagi manzil nuqtasini bosing yoki joylashuvni aniqlab, belgini kerakli joyga suring."}</p>
      </div>
    </div>
  );
}