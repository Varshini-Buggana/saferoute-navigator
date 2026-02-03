import { useEffect, useMemo, useRef, useCallback, useState } from "react";
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

// OSRM profile mapping - different service URLs for different profiles
const getOsrmConfig = (mode: TransportMode): { serviceUrl: string; profile: string } | null => {
  switch (mode) {
    case "walking":
      return { serviceUrl: "https://router.project-osrm.org/route/v1", profile: "foot" };
    case "driving":
      return { serviceUrl: "https://router.project-osrm.org/route/v1", profile: "driving" };
    case "transit":
    case "train":
      // Use driving profile as approximation for transit/train
      return { serviceUrl: "https://router.project-osrm.org/route/v1", profile: "driving" };
    case "flight":
      // Flight mode - no routing available
      return null;
    default:
      return { serviceUrl: "https://router.project-osrm.org/route/v1", profile: "driving" };
  }
};

// Calculate straight-line distance between two points (for flight mode)
const calculateStraightLineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Generate points along a route corridor for heatmap
const generateRouteCorridorPoints = (
  routeCoords: [number, number][],
  baseIntensity: number = 0.5
): Array<[number, number, number]> => {
  const points: Array<[number, number, number]> = [];
  const bufferKm = 2; // Buffer distance in km
  
  // Sample every nth point to avoid too many heatmap points
  const sampleRate = Math.max(1, Math.floor(routeCoords.length / 30));
  
  for (let i = 0; i < routeCoords.length; i += sampleRate) {
    const [lat, lng] = routeCoords[i];
    
    // Generate cluster around this route point
    for (let j = 0; j < 3; j++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * bufferKm;
      
      // Convert km to degrees (approximate)
      const latOffset = (distance / 111) * Math.sin(angle);
      const lngOffset = (distance / (111 * Math.cos(lat * Math.PI / 180))) * Math.cos(angle);
      
      // Vary intensity based on position and randomness
      const intensity = Math.max(0.1, Math.min(1, baseIntensity + (Math.random() - 0.5) * 0.4));
      
      points.push([lat + latOffset, lng + lngOffset, intensity]);
    }
  }
  
  return points;
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
  const routeCoordsRef = useRef<[number, number][]>([]);
  
  // Track previous values to detect actual changes
  const prevModeRef = useRef<TransportMode>(transportMode);
  const prevPointsRef = useRef<string>("");
  
  // Unique key for forcing route recalculation
  const [routeKey, setRouteKey] = useState(0);

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

  // Create Google Maps-style pin icons for start and end
  const createPinIcon = useCallback((color: string, label: string = "") => {
    return L.divIcon({
      className: "custom-pin-marker",
      html: `
        <div style="position: relative;">
          <svg width="32" height="44" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 28 16 28s16-16 16-28c0-8.837-7.163-16-16-16z" fill="${color}"/>
            <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 28 16 28s16-16 16-28c0-8.837-7.163-16-16-16z" fill="url(#gradient)" fill-opacity="0.3"/>
            <circle cx="16" cy="16" r="8" fill="white"/>
            <defs>
              <linearGradient id="gradient" x1="16" y1="0" x2="16" y2="44">
                <stop offset="0%" stop-color="white" stop-opacity="0.4"/>
                <stop offset="100%" stop-color="black" stop-opacity="0.2"/>
              </linearGradient>
            </defs>
          </svg>
          ${label ? `<span style="
            position: absolute;
            top: 8px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 10px;
            font-weight: bold;
            color: ${color};
          ">${label}</span>` : ""}
        </div>
      `,
      iconSize: [32, 44],
      iconAnchor: [16, 44],
      popupAnchor: [0, -44],
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

  // Detect transport mode changes and trigger re-route
  useEffect(() => {
    if (prevModeRef.current !== transportMode && routePoints.length >= 2) {
      console.log(`[MapView] Transport mode changed: ${prevModeRef.current} → ${transportMode}`);
      prevModeRef.current = transportMode;
      setRouteKey(k => k + 1); // Force route recalculation
    }
  }, [transportMode, routePoints.length]);

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

  // Handle routing when points, transport mode, or routeKey changes
  useEffect(() => {
    const map = mapRef.current;
    const markerGroup = markerGroupRef.current;
    if (!map || !markerGroup || !icons || !palette) return;

    // Create a key from route points to detect actual changes
    const pointsKey = routePoints.map(p => `${p.lat},${p.lng}`).join("|");
    
    console.log(`[MapView] Route effect triggered - Mode: ${transportMode}, Points: ${routePoints.length}, Key: ${routeKey}`);

    // Clear previous markers
    markerGroup.clearLayers();

    // Remove previous routing control completely
    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      } catch (e) {
        console.log("Routing control cleanup");
      }
    }

    if (routePoints.length < 2) {
      prevPointsRef.current = pointsKey;
      return;
    }

    // Get start and end points with exact coordinates
    const startPoint = routePoints[0];
    const endPoint = routePoints[routePoints.length - 1];

    // Add Google Maps-style pin markers for start and end
    const startMarker = L.marker([startPoint.lat, startPoint.lng], { 
      icon: createPinIcon("#4285F4", "A"),  // Google blue for start
      zIndexOffset: 1000,
    }).addTo(markerGroup);
    startMarker.bindPopup(`
      <div style="padding: 8px 12px; min-width: 150px;">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${startPoint.name}</div>
        <div style="font-size: 12px; color: #666;">Starting Point</div>
        <div style="font-size: 10px; color: #999; margin-top: 4px;">
          ${startPoint.lat.toFixed(5)}, ${startPoint.lng.toFixed(5)}
        </div>
      </div>
    `);
    startMarker.on("click", () => onMarkerClick?.(startPoint));

    const endMarker = L.marker([endPoint.lat, endPoint.lng], { 
      icon: createPinIcon("#34A853", "B"),  // Google green for destination
      zIndexOffset: 1000,
    }).addTo(markerGroup);
    endMarker.bindPopup(`
      <div style="padding: 8px 12px; min-width: 150px;">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${endPoint.name}</div>
        <div style="font-size: 12px; color: #666;">Destination</div>
        <div style="font-size: 10px; color: #999; margin-top: 4px;">
          ${endPoint.lat.toFixed(5)}, ${endPoint.lng.toFixed(5)}
        </div>
      </div>
    `);
    endMarker.on("click", () => onMarkerClick?.(endPoint));

    // Get OSRM configuration for current mode
    const osrmConfig = getOsrmConfig(transportMode);
    
    // Flight mode - no routing, just show straight line distance
    if (!osrmConfig) {
      console.log(`[MapView] Flight mode - no routing available`);
      
      // Calculate straight-line distance
      const distanceKm = calculateStraightLineDistance(
        startPoint.lat, startPoint.lng,
        endPoint.lat, endPoint.lng
      ).toFixed(1);
      
      // Draw a dashed line for flight path visualization
      const flightPath = L.polyline(
        [[startPoint.lat, startPoint.lng], [endPoint.lat, endPoint.lng]],
        {
          color: "#6366f1",
          weight: 2,
          dashArray: "10, 10",
          opacity: 0.6,
        }
      ).addTo(markerGroup);
      
      onRouteCalculated?.(`${distanceKm} km`, "N/A");
      
      // Fit bounds
      const bounds = L.latLngBounds([[startPoint.lat, startPoint.lng], [endPoint.lat, endPoint.lng]]);
      map.fitBounds(bounds, { padding: [60, 60] });
      
      prevPointsRef.current = pointsKey;
      return;
    }

    console.log(`[MapView] Using OSRM profile: ${osrmConfig.profile} for mode: ${transportMode}`);

    // Determine route line color based on mode
    const modeColors: Record<string, string> = {
      driving: palette.primary,
      walking: "#16a34a", // Green for walking
      transit: "#f59e0b", // Orange for transit/bus
      train: "#8b5cf6", // Purple for train
    };

    // Create NEW routing control with current mode
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(startPoint.lat, startPoint.lng),
        L.latLng(endPoint.lat, endPoint.lng),
      ],
      router: L.Routing.osrmv1({
        serviceUrl: osrmConfig.serviceUrl,
        profile: osrmConfig.profile,
      }),
      lineOptions: {
        styles: [
          { color: modeColors[transportMode] || palette.primary, opacity: 0.8, weight: 5 },
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
      createMarker: () => null, // We add our own markers
    });

    // Listen for route calculation to get distance and duration
    routingControl.on("routesfound", (e: any) => {
      const routes = e.routes;
      if (routes && routes.length > 0) {
        const route = routes[0];
        const distanceKm = (route.summary.totalDistance / 1000).toFixed(1);
        let durationMins = Math.round(route.summary.totalTime / 60);
        
        // Adjust duration based on mode (OSRM returns driving time)
        if (transportMode === "walking") {
          durationMins = Math.round(durationMins * 4);
        } else if (transportMode === "transit") {
          durationMins = Math.round(durationMins * 1.5);
        } else if (transportMode === "train") {
          durationMins = Math.round(durationMins * 0.8); // Trains are faster
        }
        
        let durationStr: string;
        if (durationMins < 60) {
          durationStr = `${durationMins} min`;
        } else {
          const hours = Math.floor(durationMins / 60);
          const mins = durationMins % 60;
          durationStr = mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
        }
        
        console.log(`[MapView] Route calculated - Distance: ${distanceKm}km, Duration: ${durationStr} (${transportMode})`);
        onRouteCalculated?.(`${distanceKm} km`, durationStr);
        
        // Store route coordinates for heatmap corridor
        if (route.coordinates) {
          routeCoordsRef.current = route.coordinates.map((c: any) => [c.lat, c.lng] as [number, number]);
        }
      }
    });

    routingControl.on("routingerror", (e: any) => {
      console.error("[MapView] Routing error:", e.error);
    });

    routingControl.addTo(map);
    routingControlRef.current = routingControl;

    // Add area-based risk markers (not along route, but nearby areas)
    // Skip start and end points as they have pin markers
    const riskPoints = routePoints.slice(1, -1);
    riskPoints.forEach((point) => {
      const icon = point.status === "safe" ? icons.safe : point.status === "caution" ? icons.caution : icons.danger;

      const popupHtml = `
        <div style="padding: 8px 12px; min-width: 150px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${point.name}</div>
          <div style="display:flex; align-items:center; gap:8px; font-size: 12px; text-transform: capitalize;">
            <span style="width:10px; height:10px; border-radius:999px; background:${markerColor(point.status)};"></span>
            <span>${point.status === "safe" ? "Safe Zone" : point.status === "caution" ? "Caution Zone" : "High Risk Zone"}</span>
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
    
    prevPointsRef.current = pointsKey;

  }, [icons, onMarkerClick, palette, routePoints, markerColor, transportMode, createPinIcon, onRouteCalculated, routeKey]);

  // Handle heatmap layer - combines area-based and route-corridor points
  // IMPORTANT: Heatmap is independent of route - toggling does NOT affect route/markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing heatmap layer only
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    // Add new heatmap layer if enabled (route and markers remain untouched)
    if (showHeatmap) {
      // Start with area-based heatmap data
      let heatPoints: Array<[number, number, number]> = heatmapData.map((point) => [
        point.lat,
        point.lng,
        point.intensity,
      ]);

      // Add route corridor points if we have a route (for flight mode, skip corridor)
      if (routeCoordsRef.current.length > 0 && transportMode !== "flight") {
        const corridorPoints = generateRouteCorridorPoints(routeCoordsRef.current, 0.45);
        heatPoints = [...heatPoints, ...corridorPoints];
        console.log(`[MapView] Heatmap: ${heatmapData.length} area points + ${corridorPoints.length} corridor points`);
      }

      if (heatPoints.length > 0) {
        // Create heatmap with smooth gradients and lower opacity for better route visibility
        const heatLayer = L.heatLayer(heatPoints, {
          radius: 40,        // Wider radius for smoother appearance
          blur: 30,          // More blur for gradient effect
          maxZoom: 12,
          max: 1.0,
          minOpacity: 0.25,  // Lower opacity so route shows through
          gradient: {
            0.0: "#16a34a",  // Safe - Green
            0.2: "#22c55e",
            0.4: "#eab308",  // Caution - Yellow
            0.6: "#f59e0b",
            0.75: "#ef4444", // Danger - Red
            1.0: "#dc2626",
          },
        });

        heatLayer.addTo(map);
        heatLayerRef.current = heatLayer;
      }
    }
  }, [showHeatmap, heatmapData, routeKey, transportMode]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-elevated border-2 border-border/50 bg-card">
      {/* Subtle depth overlay at edges */}
      <div className="absolute inset-0 pointer-events-none z-10 rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.05)]" />
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default MapView;
