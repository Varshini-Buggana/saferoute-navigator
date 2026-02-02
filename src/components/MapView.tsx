import { useEffect, useMemo, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet.heat";
import { RoutePoint } from "@/data/mockSafetyData";
import { HeatmapPoint } from "@/lib/safetyApi";
import { TransportMode } from "./TransportModeSelector";

// Extend Leaflet types for routing machine and heatmap
declare module "leaflet" {
  namespace Routing {
    function control(options: any): any;
    function osrmv1(options: any): any;
  }
  function heatLayer(latlngs: any[], options?: any): any;
}

interface MapViewProps {
  routePoints: RoutePoint[];
  onMarkerClick?: (point: RoutePoint) => void;
  heatmapData?: HeatmapPoint[];
  showHeatmap?: boolean;
  transportMode?: TransportMode;
  onRouteCalculated?: (distance: string, duration: string) => void;
}

// OSRM profile mapping
const osrmProfiles: Record<TransportMode, string> = {
  driving: "driving",
  walking: "foot",
  cycling: "bike",
  transit: "driving", // OSRM doesn't have transit, fall back to driving
};

const MapView = ({ 
  routePoints, 
  onMarkerClick, 
  heatmapData = [], 
  showHeatmap = false,
  transportMode = "driving",
  onRouteCalculated
}: MapViewProps) => {
  const worldCenter: [number, number] = [20, 0];
  const defaultZoom = 2;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const routingControlRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);

  const palette = useMemo(() => {
    if (typeof window === "undefined") return null;
    const root = document.documentElement;
    const read = (name: string, fallbackHsl: string) => {
      const v = getComputedStyle(root).getPropertyValue(name).trim();
      return v ? `hsl(${v})` : fallbackHsl;
    };
    return {
      safe: read("--safe", "hsl(142 72% 29%)"),
      caution: read("--caution", "hsl(45 93% 47%)"),
      danger: read("--danger", "hsl(0 84% 50%)"),
      primary: read("--primary", "hsl(201 96% 32%)"),
    };
  }, []);

  // Create emoji-based icons for start and end
  const createEmojiIcon = useCallback((emoji: string, size: number = 32) => {
    return L.divIcon({
      className: "emoji-marker",
      html: `
        <div style="
          font-size: ${size}px;
          line-height: 1;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
        ">${emoji}</div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
    });
  }, []);

  const icons = useMemo(() => {
    if (!palette) return null;
    const make = (color: string, size: number = 24) =>
      L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            transition: transform 0.2s ease;
          "></div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    return {
      safe: make(palette.safe),
      caution: make(palette.caution),
      danger: make(palette.danger),
    };
  }, [palette]);

  const markerColor = useCallback((status: RoutePoint["status"]) => {
    if (!palette) return "hsl(201 96% 32%)";
    if (status === "safe") return palette.safe;
    if (status === "caution") return palette.caution;
    return palette.danger;
  }, [palette]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
      minZoom: 2,
      maxZoom: 18,
    }).setView(worldCenter, defaultZoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const markerGroup = L.layerGroup().addTo(map);
    mapRef.current = map;
    markerGroupRef.current = markerGroup;

    return () => {
      if (routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (e) {
          console.log("Routing control cleanup");
        }
      }
      map.remove();
      mapRef.current = null;
      markerGroupRef.current = null;
      routingControlRef.current = null;
      heatLayerRef.current = null;
    };
  }, []);

  // Handle routing when points or transport mode changes
  useEffect(() => {
    const map = mapRef.current;
    const markerGroup = markerGroupRef.current;
    if (!map || !markerGroup || !icons || !palette) return;

    // Clear previous markers
    markerGroup.clearLayers();

    // Remove previous routing control
    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
      } catch (e) {
        console.log("Routing control cleanup");
      }
      routingControlRef.current = null;
    }

    if (routePoints.length < 2) return;

    // Get start and end points
    const startPoint = routePoints[0];
    const endPoint = routePoints[routePoints.length - 1];

    // Create routing control with OSRM for realistic road-following routes
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(startPoint.lat, startPoint.lng),
        L.latLng(endPoint.lat, endPoint.lng),
      ],
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
        profile: osrmProfiles[transportMode],
      }),
      lineOptions: {
        styles: [
          { color: palette.primary, opacity: 0.8, weight: 5 },
          { color: "white", opacity: 0.3, weight: 8 },
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      show: false,
      addWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      createMarker: () => null, // We'll add our own markers
    });

    // Listen for route calculation to get distance and duration
    routingControl.on("routesfound", (e: any) => {
      const routes = e.routes;
      if (routes && routes.length > 0) {
        const route = routes[0];
        const distanceKm = (route.summary.totalDistance / 1000).toFixed(1);
        const durationMins = Math.round(route.summary.totalTime / 60);
        
        let durationStr: string;
        if (durationMins < 60) {
          durationStr = `${durationMins} min`;
        } else {
          const hours = Math.floor(durationMins / 60);
          const mins = durationMins % 60;
          durationStr = mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
        }
        
        onRouteCalculated?.(`${distanceKm} km`, durationStr);
      }
    });

    routingControl.addTo(map);
    routingControlRef.current = routingControl;

    // Add emoji markers for start and end
    const startMarker = L.marker([startPoint.lat, startPoint.lng], { 
      icon: createEmojiIcon("🚩", 36) 
    }).addTo(markerGroup);
    startMarker.bindPopup(`
      <div style="padding: 8px 12px; min-width: 150px;">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">🚩 ${startPoint.name}</div>
        <div style="font-size: 12px; color: #666;">Starting Point</div>
      </div>
    `);
    startMarker.on("click", () => onMarkerClick?.(startPoint));

    const endMarker = L.marker([endPoint.lat, endPoint.lng], { 
      icon: createEmojiIcon("🏁", 36) 
    }).addTo(markerGroup);
    endMarker.bindPopup(`
      <div style="padding: 8px 12px; min-width: 150px;">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">🏁 ${endPoint.name}</div>
        <div style="font-size: 12px; color: #666;">Destination</div>
      </div>
    `);
    endMarker.on("click", () => onMarkerClick?.(endPoint));

    // Add area-based risk markers (not along route, but nearby areas)
    // Skip start and end points as they have emoji markers
    const riskPoints = routePoints.slice(1, -1);
    riskPoints.forEach((point) => {
      const icon = point.status === "safe" ? icons.safe : point.status === "caution" ? icons.caution : icons.danger;

      const popupHtml = `
        <div style="padding: 8px 12px; min-width: 150px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${point.name}</div>
          <div style="display:flex; align-items:center; gap:8px; font-size: 12px; text-transform: capitalize;">
            <span style="width:10px; height:10px; border-radius:999px; background:${markerColor(point.status)};"></span>
            <span>${point.status === "safe" ? "🟢 Safe Zone" : point.status === "caution" ? "🟡 Caution Zone" : "🔴 High Risk Zone"}</span>
          </div>
        </div>
      `;

      const marker = L.marker([point.lat, point.lng], { icon }).addTo(markerGroup);
      marker.bindPopup(popupHtml);
      marker.on("click", () => onMarkerClick?.(point));
    });

    // Fit bounds to show all points
    const bounds = L.latLngBounds(routePoints.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [60, 60] });

  }, [icons, onMarkerClick, palette, routePoints, markerColor, transportMode, createEmojiIcon, onRouteCalculated]);

  // Handle heatmap layer - area-based, independent of routes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing heatmap layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    // Add new heatmap layer if enabled and data exists
    if (showHeatmap && heatmapData.length > 0) {
      const heatPoints = heatmapData.map((point) => [
        point.lat,
        point.lng,
        point.intensity,
      ]);

      const heatLayer = L.heatLayer(heatPoints, {
        radius: 40,
        blur: 30,
        maxZoom: 12,
        max: 1.0,
        minOpacity: 0.4,
        gradient: {
          0.0: "#16a34a", // Safe - Green
          0.3: "#22c55e",
          0.5: "#eab308", // Caution - Yellow
          0.7: "#f59e0b",
          0.85: "#ef4444", // Danger - Red
          1.0: "#dc2626",
        },
      });

      heatLayer.addTo(map);
      heatLayerRef.current = heatLayer;
    }
  }, [showHeatmap, heatmapData]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-elevated border-2 border-border/50 bg-card">
      {/* Subtle depth overlay at edges */}
      <div className="absolute inset-0 pointer-events-none z-10 rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.05)]" />
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default MapView;
