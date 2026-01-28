import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RoutePoint } from "@/data/mockSafetyData";

// Fix for default marker icons in React-Leaflet - must be done before component renders
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

// Custom colored markers
const createColoredIcon = (color: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const safeIcon = createColoredIcon("#16a34a"); // green
const cautionIcon = createColoredIcon("#eab308"); // yellow
const dangerIcon = createColoredIcon("#dc2626"); // red

const getMarkerIcon = (status: "safe" | "caution" | "danger") => {
  switch (status) {
    case "safe":
      return safeIcon;
    case "caution":
      return cautionIcon;
    case "danger":
      return dangerIcon;
    default:
      return safeIcon;
  }
};

// Component to handle map bounds
const MapBounds = ({ routePoints }: { routePoints: RoutePoint[] }) => {
  const map = useMap();

  useEffect(() => {
    if (routePoints.length > 0) {
      const bounds = L.latLngBounds(routePoints.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routePoints, map]);

  return null;
};

interface MapViewProps {
  routePoints: RoutePoint[];
  onMarkerClick?: (point: RoutePoint) => void;
}

// Inner map content component to avoid context issues
const MapContent = ({ routePoints, onMarkerClick }: MapViewProps) => {
  const routeLine: [number, number][] = routePoints.map((p) => [p.lat, p.lng]);

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Route Line */}
      {routeLine.length > 1 && (
        <Polyline
          positions={routeLine}
          pathOptions={{
            color: "#0284c7",
            weight: 4,
            opacity: 0.8,
            dashArray: "10, 10",
          }}
        />
      )}

      {/* Safety Markers */}
      {routePoints.map((point, index) => (
        <Marker
          key={`marker-${index}-${point.name}`}
          position={[point.lat, point.lng]}
          icon={getMarkerIcon(point.status)}
          eventHandlers={{
            click: () => onMarkerClick?.(point),
          }}
        >
          <Popup>
            <div className="p-1">
              <div className="font-semibold text-sm">{point.name}</div>
              <div className="flex items-center gap-1 mt-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      point.status === "safe"
                        ? "#16a34a"
                        : point.status === "caution"
                        ? "#eab308"
                        : "#dc2626",
                  }}
                />
                <span className="text-xs capitalize">{point.status}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Adjust bounds when route changes */}
      <MapBounds routePoints={routePoints} />
    </>
  );
};

const MapView = ({ routePoints, onMarkerClick }: MapViewProps) => {
  // India center coordinates
  const indiaCenter: [number, number] = [20.5937, 78.9629];
  const defaultZoom = 5;

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-soft border border-border">
      <MapContainer
        center={indiaCenter}
        zoom={defaultZoom}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <MapContent routePoints={routePoints} onMarkerClick={onMarkerClick} />
      </MapContainer>
    </div>
  );
};

export default MapView;
