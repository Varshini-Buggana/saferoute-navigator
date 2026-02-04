import { useEffect, useMemo, useRef, useCallback, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet.heat";
import { RoutePoint } from "@/data/mockSafetyData";
import { HeatmapPoint } from "@/lib/safetyApi";
import { TransportMode } from "./TransportModeSelector";
import { RouteAlternative } from "./RouteAlternativesPanel";

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
  onRoutesFound?: (routes: RouteAlternative[]) => void;
  selectedRouteId?: number;
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

// Generate route safety score based on route analysis
const calculateRouteSafetyScore = (routeCoords: [number, number][], baseRiskAreas: RoutePoint[]): { score: number; riskLevel: "safe" | "caution" | "danger" } => {
  if (!routeCoords.length || !baseRiskAreas.length) {
    // No data - default to moderate safety
    return { score: 75, riskLevel: "safe" };
  }

  let totalRiskScore = 0;
  const proximityThreshold = 0.05; // ~5km in degrees

  // Check how many risk points are near this route
  for (const coord of routeCoords) {
    for (const riskPoint of baseRiskAreas) {
      const distance = Math.sqrt(
        Math.pow(coord[0] - riskPoint.lat, 2) + 
        Math.pow(coord[1] - riskPoint.lng, 2)
      );
      
      if (distance < proximityThreshold) {
        if (riskPoint.status === "danger") {
          totalRiskScore += 3;
        } else if (riskPoint.status === "caution") {
          totalRiskScore += 1.5;
        } else {
          totalRiskScore += 0.5;
        }
      }
    }
  }

  // Normalize score (100 = safest, 0 = most dangerous)
  const normalizedRisk = Math.min(totalRiskScore / (routeCoords.length * 0.1), 100);
  const safetyScore = Math.max(0, Math.round(100 - normalizedRisk));

  let riskLevel: "safe" | "caution" | "danger";
  if (safetyScore >= 70) {
    riskLevel = "safe";
  } else if (safetyScore >= 40) {
    riskLevel = "caution";
  } else {
    riskLevel = "danger";
  }

  return { score: safetyScore, riskLevel };
};

// Generate route name based on general direction
const generateRouteName = (index: number, coords: [number, number][]): string => {
  const names = ["via Main Route", "via Highway", "via Local Roads", "via Scenic Route", "via Express"];
  if (index === 0) return "Fastest Route";
  if (coords.length < 3) return names[index % names.length];
  
  // Try to determine direction
  const midPoint = coords[Math.floor(coords.length / 2)];
  const start = coords[0];
  const deltaLat = midPoint[0] - start[0];
  const deltaLng = midPoint[1] - start[1];
  
  if (Math.abs(deltaLat) > Math.abs(deltaLng)) {
    return deltaLat > 0 ? "via Northern Route" : "via Southern Route";
  } else {
    return deltaLng > 0 ? "via Eastern Route" : "via Western Route";
  }
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

// Calculate duration string with mode adjustments
const calculateDurationString = (totalTimeSeconds: number, mode: TransportMode): string => {
  let durationMins = Math.round(totalTimeSeconds / 60);
  
  // Adjust duration based on mode
  if (mode === "walking") {
    durationMins = Math.round(durationMins * 4);
  } else if (mode === "transit") {
    durationMins = Math.round(durationMins * 1.5);
  } else if (mode === "train") {
    durationMins = Math.round(durationMins * 0.8);
  }
  
  if (durationMins < 60) {
    return `${durationMins} min`;
  } else {
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
};

// Cached route data structure
interface CachedRoute {
  id: number;
  name: string;
  distance: string;
  duration: string;
  safetyScore: number;
  riskLevel: "safe" | "caution" | "danger";
  coordinates: [number, number][];
  rawTotalDistance: number;
  rawTotalTime: number;
}

const MapView = ({ 
  routePoints, 
  onMarkerClick, 
  heatmapData = [], 
  showHeatmap = false,
  transportMode = "driving",
  onRouteCalculated,
  onRoutesFound,
  selectedRouteId = 0
}: MapViewProps) => {
  const worldCenter: [number, number] = [20, 0];
  const defaultZoom = 2;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const routingControlRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);
  const routeCoordsRef = useRef<[number, number][]>([]);
  
  // Persistent route polylines - NEVER cleared during selection
  const routePolylinesRef = useRef<Map<number, L.Polyline>>(new Map());
  
  // Cached routes - only updated when source/destination/mode changes
  const cachedRoutesRef = useRef<CachedRoute[]>([]);
  
  // Track what triggered the last fetch to avoid redundant calls
  const lastFetchKeyRef = useRef<string>("");
  
  // State to track active route for styling
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);

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

  // Mode colors for routes
  const getModeColor = useCallback((mode: TransportMode, paletteObj: { primary: string; safe: string; caution: string; danger: string }) => {
    const modeColors: Record<string, string> = {
      driving: paletteObj.primary,
      walking: "#16a34a",
      transit: "#f59e0b",
      train: "#8b5cf6",
    };
    return modeColors[mode] || paletteObj.primary;
  }, []);

  // Update polyline styles based on selection - NO API CALLS
  const updateRouteStyles = useCallback((newActiveIndex: number) => {
    const map = mapRef.current;
    if (!map || !palette) return;

    const mainColor = getModeColor(transportMode, palette);
    const inactiveColor = "#9ca3af";

    routePolylinesRef.current.forEach((polyline, index) => {
      const isActive = index === newActiveIndex;
      polyline.setStyle({
        color: isActive ? mainColor : inactiveColor,
        weight: isActive ? 6 : 4,
        opacity: isActive ? 0.9 : 0.4,
      });
      
      if (isActive) {
        polyline.bringToFront();
      }
    });

    // Update route info for newly selected route
    const selectedRoute = cachedRoutesRef.current[newActiveIndex];
    if (selectedRoute && onRouteCalculated) {
      const durationStr = calculateDurationString(selectedRoute.rawTotalTime, transportMode);
      onRouteCalculated(selectedRoute.distance, durationStr);
      
      // Update route coords for heatmap
      routeCoordsRef.current = selectedRoute.coordinates;
    }

    setActiveRouteIndex(newActiveIndex);
  }, [transportMode, palette, onRouteCalculated, getModeColor]);

  // Sync external selectedRouteId with internal state - STYLE ONLY
  useEffect(() => {
    if (selectedRouteId !== activeRouteIndex && cachedRoutesRef.current.length > 0) {
      console.log(`[MapView] Route selection changed: ${activeRouteIndex} → ${selectedRouteId} (style update only)`);
      updateRouteStyles(selectedRouteId);
    }
  }, [selectedRouteId, activeRouteIndex, updateRouteStyles]);

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
      routePolylinesRef.current.forEach(p => map.removeLayer(p));
      routePolylinesRef.current.clear();
      map.remove();
      mapRef.current = null;
      markerGroupRef.current = null;
      routingControlRef.current = null;
      heatLayerRef.current = null;
    };
  }, []);

  // Handle routing - ONLY when source, destination, or mode changes
  useEffect(() => {
    const map = mapRef.current;
    const markerGroup = markerGroupRef.current;
    if (!map || !markerGroup || !icons || !palette) return;

    // Create a unique key for this route request
    const pointsKey = routePoints.map(p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join("|");
    const fetchKey = `${pointsKey}|${transportMode}`;

    // Skip if this is the same request (prevents re-fetch loops)
    if (fetchKey === lastFetchKeyRef.current) {
      console.log(`[MapView] Skipping duplicate fetch for: ${transportMode}`);
      return;
    }

    console.log(`[MapView] New route request - Mode: ${transportMode}, Points: ${routePoints.length}`);
    lastFetchKeyRef.current = fetchKey;

    // Clear previous markers
    markerGroup.clearLayers();

    // Remove previous routing control
    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      } catch (e) {
        console.log("Routing control cleanup");
      }
    }

    // Clear previous route polylines
    routePolylinesRef.current.forEach(p => map.removeLayer(p));
    routePolylinesRef.current.clear();
    cachedRoutesRef.current = [];

    if (routePoints.length < 2) {
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
      L.polyline(
        [[startPoint.lat, startPoint.lng], [endPoint.lat, endPoint.lng]],
        {
          color: "#6366f1",
          weight: 2,
          dashArray: "10, 10",
          opacity: 0.6,
        }
      ).addTo(markerGroup);
      
      onRouteCalculated?.(`${distanceKm} km`, "N/A");
      onRoutesFound?.([]);
      
      // Fit bounds
      const bounds = L.latLngBounds([[startPoint.lat, startPoint.lng], [endPoint.lat, endPoint.lng]]);
      map.fitBounds(bounds, { padding: [60, 60] });
      
      return;
    }

    console.log(`[MapView] Using OSRM profile: ${osrmConfig.profile} for mode: ${transportMode}`);

    const mainColor = getModeColor(transportMode, palette);
    const inactiveColor = "#9ca3af";

    // Create routing control with alternatives enabled
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
        styles: [{ color: "transparent", opacity: 0, weight: 0 }], // Hide default lines
        extendToWaypoints: false,
        missingRouteTolerance: 0,
      },
      show: false,
      addWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: false,
      showAlternatives: true,
      altLineOptions: {
        styles: [{ color: "transparent", opacity: 0, weight: 0 }], // Hide default alt lines
      },
      createMarker: () => null,
    });

    // Listen for route calculation - FETCH ONCE, CACHE RESULTS
    routingControl.on("routesfound", (e: any) => {
      const routes = e.routes;
      if (!routes || routes.length === 0) return;

      console.log(`[MapView] Fetched ${routes.length} route(s) - caching for selection`);
      
      // Get risk points for safety calculation
      const riskPoints = routePoints.slice(1, -1);

      // Cache route data and create polylines
      const cachedRoutes: CachedRoute[] = routes.map((route: any, index: number) => {
        const coords: [number, number][] = route.coordinates 
          ? route.coordinates.map((c: any) => [c.lat, c.lng] as [number, number])
          : [];
        
        const distanceKm = (route.summary.totalDistance / 1000).toFixed(1);
        const { score, riskLevel } = calculateRouteSafetyScore(coords, riskPoints);

        // Create polyline for this route - PERSISTENT
        const isActive = index === 0; // First route is active by default
        const polyline = L.polyline(coords, {
          color: isActive ? mainColor : inactiveColor,
          weight: isActive ? 6 : 4,
          opacity: isActive ? 0.9 : 0.4,
        }).addTo(map);

        // Add click handler for route selection (style change only)
        polyline.on("click", () => {
          console.log(`[MapView] Route ${index} clicked - updating styles only`);
          
          // Update styles locally
          updateRouteStyles(index);
          
          // Notify parent with updated selection
          const updatedAlternatives: RouteAlternative[] = cachedRoutesRef.current.map((r, i) => ({
            id: r.id,
            name: r.name,
            distance: r.distance,
            duration: calculateDurationString(r.rawTotalTime, transportMode),
            safetyScore: r.safetyScore,
            riskLevel: r.riskLevel,
            isSelected: i === index,
            coordinates: r.coordinates,
          }));
          onRoutesFound?.(updatedAlternatives);
        });

        // Store polyline reference
        routePolylinesRef.current.set(index, polyline);

        return {
          id: index,
          name: generateRouteName(index, coords),
          distance: `${distanceKm} km`,
          duration: calculateDurationString(route.summary.totalTime, transportMode),
          safetyScore: score,
          riskLevel,
          coordinates: coords,
          rawTotalDistance: route.summary.totalDistance,
          rawTotalTime: route.summary.totalTime,
        };
      });

      // Store cached routes
      cachedRoutesRef.current = cachedRoutes;

      // Notify parent of available routes
      const routeAlternatives: RouteAlternative[] = cachedRoutes.map((r, i) => ({
        id: r.id,
        name: r.name,
        distance: r.distance,
        duration: r.duration,
        safetyScore: r.safetyScore,
        riskLevel: r.riskLevel,
        isSelected: i === 0,
        coordinates: r.coordinates,
      }));
      onRoutesFound?.(routeAlternatives);

      // Update primary route info
      const primaryRoute = cachedRoutes[0];
      if (primaryRoute) {
        onRouteCalculated?.(primaryRoute.distance, primaryRoute.duration);
        routeCoordsRef.current = primaryRoute.coordinates;
      }

      // Reset active route index
      setActiveRouteIndex(0);

      // Bring first route to front
      const firstPolyline = routePolylinesRef.current.get(0);
      if (firstPolyline) {
        firstPolyline.bringToFront();
      }
    });

    routingControl.on("routingerror", (e: any) => {
      console.error("[MapView] Routing error:", e.error);
    });

    routingControl.addTo(map);
    routingControlRef.current = routingControl;

    // Add area-based risk markers (not along route, but nearby areas)
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

  }, [icons, onMarkerClick, palette, routePoints, markerColor, transportMode, createPinIcon, onRouteCalculated, onRoutesFound, getModeColor, updateRouteStyles]);

  // Handle heatmap layer - INDEPENDENT of route selection
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing heatmap layer only
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    // Add new heatmap layer if enabled
    if (showHeatmap) {
      // Start with area-based heatmap data
      let heatPoints: Array<[number, number, number]> = heatmapData.map((point) => [
        point.lat,
        point.lng,
        point.intensity,
      ]);

      // Add route corridor points if we have a route
      if (routeCoordsRef.current.length > 0 && transportMode !== "flight") {
        const corridorPoints = generateRouteCorridorPoints(routeCoordsRef.current, 0.45);
        heatPoints = [...heatPoints, ...corridorPoints];
        console.log(`[MapView] Heatmap: ${heatmapData.length} area points + ${corridorPoints.length} corridor points`);
      }

      if (heatPoints.length > 0) {
        const heatLayer = L.heatLayer(heatPoints, {
          radius: 40,
          blur: 30,
          maxZoom: 12,
          max: 1.0,
          minOpacity: 0.25,
          gradient: {
            0.0: "#16a34a",
            0.2: "#22c55e",
            0.4: "#eab308",
            0.6: "#f59e0b",
            0.75: "#ef4444",
            1.0: "#dc2626",
          },
        });

        heatLayer.addTo(map);
        heatLayerRef.current = heatLayer;
      }
    }
  }, [showHeatmap, heatmapData, transportMode]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-elevated border-2 border-border/50 bg-card">
      {/* Subtle depth overlay at edges */}
      <div className="absolute inset-0 pointer-events-none z-10 rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.05)]" />
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default MapView;
