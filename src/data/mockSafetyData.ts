import { SafetyData } from "@/components/SafetyInfoPanel";

export interface RoutePoint {
  lat: number;
  lng: number;
  status: "safe" | "caution" | "danger";
  name: string;
}

export interface MockLocation {
  name: string;
  lat: number;
  lng: number;
  safetyData: SafetyData;
}

// Mock locations in India
export const mockLocations: Record<string, MockLocation> = {
  "delhi": {
    name: "New Delhi",
    lat: 28.6139,
    lng: 77.2090,
    safetyData: {
      status: "caution",
      score: 65,
      location: "New Delhi, India",
      reasons: [
        "High traffic density in central areas",
        "Moderate air quality concerns",
        "Well-connected public transport",
        "Active police patrol zones",
      ],
      lastUpdated: "2 hours ago",
    },
  },
  "mumbai": {
    name: "Mumbai",
    lat: 19.0760,
    lng: 72.8777,
    safetyData: {
      status: "safe",
      score: 78,
      location: "Mumbai, India",
      reasons: [
        "Good street lighting in main areas",
        "Active CCTV surveillance",
        "Reliable public transportation",
        "Low crime rate in tourist zones",
      ],
      lastUpdated: "1 hour ago",
    },
  },
  "bangalore": {
    name: "Bangalore",
    lat: 12.9716,
    lng: 77.5946,
    safetyData: {
      status: "safe",
      score: 82,
      location: "Bangalore, India",
      reasons: [
        "Well-planned IT corridors",
        "Good emergency response",
        "Safe nightlife districts",
        "Reliable metro connectivity",
      ],
      lastUpdated: "30 minutes ago",
    },
  },
  "jaipur": {
    name: "Jaipur",
    lat: 26.9124,
    lng: 75.7873,
    safetyData: {
      status: "safe",
      score: 75,
      location: "Jaipur, India",
      reasons: [
        "Tourist-friendly infrastructure",
        "Heritage zone protections",
        "Good local hospitality",
        "Well-lit main attractions",
      ],
      lastUpdated: "1 hour ago",
    },
  },
  "chennai": {
    name: "Chennai",
    lat: 13.0827,
    lng: 80.2707,
    safetyData: {
      status: "safe",
      score: 80,
      location: "Chennai, India",
      reasons: [
        "Strong public transport network",
        "Beach area patrol services",
        "Good healthcare facilities",
        "Low street crime rate",
      ],
      lastUpdated: "45 minutes ago",
    },
  },
  "kolkata": {
    name: "Kolkata",
    lat: 22.5726,
    lng: 88.3639,
    safetyData: {
      status: "caution",
      score: 68,
      location: "Kolkata, India",
      reasons: [
        "Dense population in some areas",
        "Good metro rail coverage",
        "Historic areas well-patrolled",
        "Some traffic congestion concerns",
      ],
      lastUpdated: "2 hours ago",
    },
  },
};

// Mock route waypoints
export const getMockRoutePoints = (from: string, to: string): RoutePoint[] => {
  const fromLocation = findLocation(from);
  const toLocation = findLocation(to);

  if (!fromLocation || !toLocation) {
    return [];
  }

  // Generate intermediate points with varying safety status
  const points: RoutePoint[] = [
    { ...fromLocation, status: mockLocations[fromLocation.key]?.safetyData.status || "safe", name: fromLocation.name },
  ];

  // Add 2-3 intermediate waypoints
  const latDiff = toLocation.lat - fromLocation.lat;
  const lngDiff = toLocation.lng - fromLocation.lng;

  const waypoints = [
    { fraction: 0.33, status: "safe" as const, name: "Highway Junction" },
    { fraction: 0.5, status: "caution" as const, name: "Rest Area" },
    { fraction: 0.67, status: "safe" as const, name: "Toll Plaza" },
  ];

  waypoints.forEach((wp) => {
    points.push({
      lat: fromLocation.lat + latDiff * wp.fraction,
      lng: fromLocation.lng + lngDiff * wp.fraction,
      status: wp.status,
      name: wp.name,
    });
  });

  points.push({ ...toLocation, status: mockLocations[toLocation.key]?.safetyData.status || "safe", name: toLocation.name });

  return points;
};

const findLocation = (query: string): (MockLocation & { key: string }) | null => {
  const normalizedQuery = query.toLowerCase().trim();
  
  for (const [key, location] of Object.entries(mockLocations)) {
    if (key.includes(normalizedQuery) || location.name.toLowerCase().includes(normalizedQuery)) {
      return { ...location, key };
    }
  }
  
  // Return Delhi as fallback
  return { ...mockLocations.delhi, key: "delhi" };
};

export const getLocationSafetyData = (query: string): SafetyData | null => {
  const location = findLocation(query);
  return location?.safetyData || null;
};
