import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Heatmap Data Edge Function
 * 
 * Returns area-based risk points clustered around locations (NOT along routes).
 * Generates realistic geographic clusters for safety visualization.
 * 
 * Intensity scale: 0.0 (safe) to 1.0 (dangerous)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Generate clustered risk points around a center location
function generateCluster(
  centerLat: number, 
  centerLng: number, 
  baseName: string,
  baseIntensity: number,
  count: number = 5,
  radiusKm: number = 3
): Array<{ lat: number; lng: number; intensity: number; name: string }> {
  const points: Array<{ lat: number; lng: number; intensity: number; name: string }> = [];
  
  // Convert km to degrees (approximate)
  const latRadius = radiusKm / 111; // ~111km per degree latitude
  const lngRadius = radiusKm / (111 * Math.cos(centerLat * Math.PI / 180));
  
  for (let i = 0; i < count; i++) {
    // Random angle and distance from center
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * 0.8 + 0.2; // 20-100% of radius
    
    const lat = centerLat + (Math.sin(angle) * latRadius * distance);
    const lng = centerLng + (Math.cos(angle) * lngRadius * distance);
    
    // Vary intensity within ±0.15 of base
    const intensity = Math.max(0, Math.min(1, baseIntensity + (Math.random() - 0.5) * 0.3));
    
    points.push({
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      intensity: parseFloat(intensity.toFixed(2)),
      name: `${baseName} Area ${i + 1}`,
    });
  }
  
  return points;
}

// Base locations with risk centers (city centers and known risk zones)
const riskCenters = [
  // Delhi region - dense clusters
  { lat: 28.6139, lng: 77.2090, name: "Central Delhi", intensity: 0.55, count: 8, radius: 4 },
  { lat: 28.6508, lng: 77.2373, name: "Old Delhi", intensity: 0.65, count: 6, radius: 3 },
  { lat: 28.5672, lng: 77.2100, name: "South Delhi", intensity: 0.35, count: 5, radius: 3 },
  { lat: 28.4595, lng: 77.0266, name: "Gurgaon", intensity: 0.25, count: 4, radius: 3 },
  
  // Mumbai region
  { lat: 19.0760, lng: 72.8777, name: "Mumbai Central", intensity: 0.45, count: 7, radius: 4 },
  { lat: 19.0544, lng: 72.8404, name: "Dharavi Area", intensity: 0.75, count: 6, radius: 2 },
  { lat: 19.0596, lng: 72.8295, name: "Bandra", intensity: 0.30, count: 4, radius: 2 },
  { lat: 18.9220, lng: 72.8347, name: "Marine Lines", intensity: 0.20, count: 3, radius: 2 },
  
  // Bangalore region
  { lat: 12.9716, lng: 77.5946, name: "Bangalore Central", intensity: 0.40, count: 6, radius: 4 },
  { lat: 12.9352, lng: 77.6245, name: "MG Road", intensity: 0.25, count: 4, radius: 2 },
  { lat: 12.9698, lng: 77.7500, name: "Whitefield", intensity: 0.35, count: 5, radius: 3 },
  
  // Chennai region
  { lat: 13.0827, lng: 80.2707, name: "Chennai Central", intensity: 0.40, count: 6, radius: 4 },
  { lat: 13.0500, lng: 80.2824, name: "Marina", intensity: 0.20, count: 3, radius: 2 },
  
  // Hyderabad region
  { lat: 17.3850, lng: 78.4867, name: "Hyderabad Central", intensity: 0.45, count: 6, radius: 4 },
  { lat: 17.3616, lng: 78.4747, name: "Old City", intensity: 0.60, count: 5, radius: 3 },
  { lat: 17.4435, lng: 78.3772, name: "Hi-Tech City", intensity: 0.20, count: 4, radius: 3 },
  
  // Kolkata region
  { lat: 22.5726, lng: 88.3639, name: "Kolkata Central", intensity: 0.50, count: 6, radius: 4 },
  { lat: 22.5958, lng: 88.3936, name: "Howrah", intensity: 0.65, count: 5, radius: 3 },
  
  // Jaipur region
  { lat: 26.9124, lng: 75.7873, name: "Jaipur City", intensity: 0.40, count: 5, radius: 3 },
  { lat: 26.9239, lng: 75.8267, name: "Pink City", intensity: 0.50, count: 4, radius: 2 },
  
  // Pune region
  { lat: 18.5204, lng: 73.8567, name: "Pune Central", intensity: 0.35, count: 5, radius: 3 },
  { lat: 18.5912, lng: 73.7389, name: "Hinjewadi", intensity: 0.20, count: 4, radius: 3 },
  
  // Other major cities
  { lat: 23.0225, lng: 72.5714, name: "Ahmedabad", intensity: 0.40, count: 5, radius: 4 },
  { lat: 26.8467, lng: 80.9462, name: "Lucknow", intensity: 0.50, count: 5, radius: 4 },
  { lat: 21.1458, lng: 79.0882, name: "Nagpur", intensity: 0.45, count: 4, radius: 3 },
  { lat: 30.7333, lng: 76.7794, name: "Chandigarh", intensity: 0.30, count: 4, radius: 3 },
  
  // International cities
  { lat: 40.7128, lng: -74.0060, name: "New York", intensity: 0.45, count: 6, radius: 5 },
  { lat: 51.5074, lng: -0.1278, name: "London", intensity: 0.35, count: 5, radius: 4 },
  { lat: 48.8566, lng: 2.3522, name: "Paris", intensity: 0.40, count: 5, radius: 4 },
  { lat: 35.6762, lng: 139.6503, name: "Tokyo", intensity: 0.25, count: 4, radius: 4 },
  { lat: 1.3521, lng: 103.8198, name: "Singapore", intensity: 0.15, count: 3, radius: 3 },
  { lat: 25.2048, lng: 55.2708, name: "Dubai", intensity: 0.20, count: 4, radius: 4 },
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let bounds: { north: number; south: number; east: number; west: number } | undefined;
    let centerLat: number | undefined;
    let centerLng: number | undefined;
    
    if (req.method === "POST") {
      const body = await req.json();
      bounds = body.bounds;
      centerLat = body.centerLat;
      centerLng = body.centerLng;
    }

    // Generate clustered heatmap data
    let allPoints: Array<{ lat: number; lng: number; intensity: number; name: string }> = [];
    
    for (const center of riskCenters) {
      const cluster = generateCluster(
        center.lat,
        center.lng,
        center.name,
        center.intensity,
        center.count,
        center.radius
      );
      allPoints.push(...cluster);
    }
    
    // If specific center is provided, add extra density around it
    if (centerLat !== undefined && centerLng !== undefined) {
      // Find nearby risk centers and add more density
      const nearbyIntensity = 0.4 + Math.random() * 0.3; // Random intensity for the searched area
      const extraCluster = generateCluster(
        centerLat,
        centerLng,
        "Searched Area",
        nearbyIntensity,
        8,
        5
      );
      allPoints.push(...extraCluster);
    }
    
    // Filter by geographic bounds if provided
    if (bounds) {
      const { north, south, east, west } = bounds;
      allPoints = allPoints.filter(
        point => 
          point.lat >= south && 
          point.lat <= north && 
          point.lng >= west && 
          point.lng <= east
      );
    }

    console.log(`[Heatmap API] Returning ${allPoints.length} area-based data points`);

    const response = {
      success: true,
      count: allPoints.length,
      data: allPoints.map(point => ({
        lat: point.lat,
        lng: point.lng,
        intensity: point.intensity,
        name: point.name,
        riskLevel: point.intensity <= 0.3 ? "Safe" : point.intensity <= 0.6 ? "Caution" : "High Risk"
      })),
      legend: {
        safe: { range: "0.0 - 0.3", color: "#16a34a", description: "Low risk area" },
        caution: { range: "0.3 - 0.6", color: "#eab308", description: "Moderate risk, stay alert" },
        danger: { range: "0.6 - 1.0", color: "#dc2626", description: "High risk area" }
      },
      lastUpdated: new Date().toISOString(),
      disclaimer: "Heatmap shows area-based safety clusters. Data is for demonstration purposes."
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[Heatmap API] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
