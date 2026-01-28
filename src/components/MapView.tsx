import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RoutePoint } from "@/data/mockSafetyData";

interface MapViewProps {
  routePoints: RoutePoint[];
  onMarkerClick?: (point: RoutePoint) => void;
}

const MapView = ({ routePoints, onMarkerClick }: MapViewProps) => {
  // India center coordinates
  const indiaCenter: [number, number] = [20.5937, 78.9629];
  const defaultZoom = 5;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const palette = useMemo(() => {
    if (typeof window === "undefined") return null;
    const root = document.documentElement;
    const read = (name: string, fallbackHsl: string) => {
      const v = getComputedStyle(root).getPropertyValue(name).trim();
      return v ? `hsl(${v})` : fallbackHsl;
    };
    // Fallbacks are HSL (to match the design-token requirement)
    return {
      safe: read("--safe", "hsl(142 72% 29%)"),
      caution: read("--caution", "hsl(45 93% 47%)"),
      danger: read("--danger", "hsl(0 84% 50%)"),
      primary: read("--primary", "hsl(201 96% 32%)"),
    };
  }, []);

  const icons = useMemo(() => {
    if (!palette) return null;
    const make = (color: string) =>
      L.divIcon({
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
    return {
      safe: make(palette.safe),
      caution: make(palette.caution),
      danger: make(palette.danger),
    };
  }, [palette]);

  const markerColor = (status: RoutePoint["status"]) => {
    if (!palette) return "hsl(201 96% 32%)";
    if (status === "safe") return palette.safe;
    if (status === "caution") return palette.caution;
    return palette.danger;
  };

  // 1) Create Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(indiaCenter, defaultZoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = group;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, [defaultZoom, indiaCenter]);

  // 2) Render markers + route line whenever routePoints change
  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group || !icons || !palette) return;

    group.clearLayers();

    // Route line
    if (routePoints.length > 1) {
      const latlngs = routePoints.map((p) => [p.lat, p.lng] as [number, number]);
      L.polyline(latlngs, {
        color: palette.primary,
        weight: 4,
        opacity: 0.8,
        dashArray: "10, 10",
      }).addTo(group);
    }

    // Markers
    routePoints.forEach((point) => {
      const icon =
        point.status === "safe"
          ? icons.safe
          : point.status === "caution"
          ? icons.caution
          : icons.danger;

      const popupHtml = `
        <div style="padding: 4px 6px;">
          <div style="font-weight: 600; font-size: 12px;">${point.name}</div>
          <div style="display:flex; align-items:center; gap:6px; margin-top:4px; font-size: 11px; text-transform: capitalize;">
            <span style="width:8px; height:8px; border-radius:999px; background:${markerColor(point.status)};"></span>
            <span>${point.status}</span>
          </div>
        </div>
      `;

      const marker = L.marker([point.lat, point.lng], { icon }).addTo(group);
      marker.bindPopup(popupHtml);
      marker.on("click", () => onMarkerClick?.(point));
    });

    // Fit bounds
    if (routePoints.length > 0) {
      const bounds = L.latLngBounds(routePoints.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [icons, onMarkerClick, palette, routePoints]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-soft border border-border">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
export default MapView;
