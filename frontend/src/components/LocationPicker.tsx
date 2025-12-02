import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L, { LatLngLiteral } from 'leaflet';

export interface LocationPickerProps {
  value: LatLngLiteral | null;
  onChange: (value: LatLngLiteral) => void;
  onManualChange?: () => void;
  disabled?: boolean;
}

const DEFAULT_CENTER: LatLngLiteral = { lat: -34.650589, lng: -58.791383 };

const defaultMarkerIcon = new L.Icon({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function LocationView({ location }: { location: LatLngLiteral | null }) {
  const map = useMap();

  useEffect(() => {
    if (!location) {
      map.setView(DEFAULT_CENTER, 13);
      return;
    }

    map.flyTo(location, 16, { duration: 0.5 });
  }, [location, map]);

  return null;
}

function LocationClickHandler({
  disabled,
  onChange,
  onManualChange,
}: {
  disabled?: boolean;
  onChange: (value: LatLngLiteral) => void;
  onManualChange?: () => void;
}) {
  useMapEvents({
    click(event) {
      if (disabled) {
        return;
      }

      const { latlng } = event;
      onChange({ lat: latlng.lat, lng: latlng.lng });
      onManualChange?.();
    },
  });

  return null;
}

export function LocationPicker({
  value,
  onChange,
  onManualChange,
  disabled,
}: LocationPickerProps) {
  const mapCenter = value ?? DEFAULT_CENTER;
  const zoom = value ? 16 : 13;

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      scrollWheelZoom={!disabled}
      doubleClickZoom={!disabled}
      style={{ height: '280px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationView location={value} />
      <LocationClickHandler
        disabled={disabled}
        onChange={onChange}
        onManualChange={onManualChange}
      />
      {value && (
        <Marker
          position={value}
          draggable={!disabled}
          icon={defaultMarkerIcon}
          eventHandlers={{
            dragend(event) {
              const marker = event.target as L.Marker;
              const position = marker.getLatLng();
              onChange({ lat: position.lat, lng: position.lng });
              onManualChange?.();
            },
          }}
        />
      )}
    </MapContainer>
  );
}
