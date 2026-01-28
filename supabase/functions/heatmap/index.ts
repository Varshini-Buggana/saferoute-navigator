import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Heatmap Data Edge Function
 * 
 * Returns a list of coordinates with safety intensity values
 * for rendering safety heatmaps on the frontend map.
 * 
 * Intensity scale: 0.0 (safe) to 1.0 (dangerous)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Sample heatmap data for Indian cities
// intensity: 0.0 = very safe (green), 1.0 = very dangerous (red)
const heatmapData = [
  // Delhi region
  { lat: 28.6139, lng: 77.2090, intensity: 0.6, name: "Central Delhi" },
  { lat: 28.6508, lng: 77.2373, intensity: 0.5, name: "Old Delhi - Chandni Chowk" },
  { lat: 28.6329, lng: 77.2195, intensity: 0.4, name: "Connaught Place" },
  { lat: 28.5355, lng: 77.2510, intensity: 0.7, name: "South Delhi Industrial" },
  { lat: 28.5672, lng: 77.2100, intensity: 0.3, name: "Hauz Khas" },
  { lat: 28.5562, lng: 77.1000, intensity: 0.2, name: "Gurgaon Tech Hub" },
  { lat: 28.7041, lng: 77.1025, intensity: 0.5, name: "Rohini" },
  
  // Mumbai region
  { lat: 19.0760, lng: 72.8777, intensity: 0.3, name: "Mumbai Central" },
  { lat: 18.9220, lng: 72.8347, intensity: 0.2, name: "Marine Drive" },
  { lat: 19.0544, lng: 72.8404, intensity: 0.6, name: "Dharavi" },
  { lat: 19.0596, lng: 72.8295, intensity: 0.3, name: "Bandra" },
  { lat: 19.1136, lng: 72.8697, intensity: 0.4, name: "Andheri" },
  { lat: 19.2183, lng: 72.9781, intensity: 0.5, name: "Thane" },
  
  // Bangalore region
  { lat: 12.9716, lng: 77.5946, intensity: 0.3, name: "Bangalore Central" },
  { lat: 12.9352, lng: 77.6245, intensity: 0.2, name: "MG Road" },
  { lat: 12.9698, lng: 77.7500, intensity: 0.4, name: "Whitefield" },
  { lat: 13.0358, lng: 77.5970, intensity: 0.3, name: "Hebbal" },
  { lat: 12.9063, lng: 77.5857, intensity: 0.5, name: "Jayanagar" },
  { lat: 12.8458, lng: 77.6692, intensity: 0.2, name: "Electronic City" },
  
  // Jaipur region
  { lat: 26.9124, lng: 75.7873, intensity: 0.4, name: "Jaipur City" },
  { lat: 26.9239, lng: 75.8267, intensity: 0.5, name: "Old City - Pink City" },
  { lat: 26.8535, lng: 75.8040, intensity: 0.3, name: "Malviya Nagar" },
  { lat: 27.0104, lng: 75.8574, intensity: 0.6, name: "Amer Fort Area" },
  
  // Chennai region
  { lat: 13.0827, lng: 80.2707, intensity: 0.3, name: "Chennai Central" },
  { lat: 13.0500, lng: 80.2824, intensity: 0.2, name: "Marina Beach" },
  { lat: 13.0878, lng: 80.2785, intensity: 0.4, name: "T. Nagar" },
  { lat: 12.8231, lng: 80.0421, intensity: 0.3, name: "OMR Tech Corridor" },
  
  // Hyderabad region
  { lat: 17.3850, lng: 78.4867, intensity: 0.4, name: "Hyderabad Central" },
  { lat: 17.3616, lng: 78.4747, intensity: 0.5, name: "Charminar" },
  { lat: 17.4435, lng: 78.3772, intensity: 0.2, name: "Hi-Tech City" },
  { lat: 17.4239, lng: 78.4738, intensity: 0.3, name: "Jubilee Hills" },
  { lat: 17.4156, lng: 78.4347, intensity: 0.3, name: "Banjara Hills" },
  
  // Kolkata region
  { lat: 22.5726, lng: 88.3639, intensity: 0.5, name: "Kolkata Central" },
  { lat: 22.5448, lng: 88.3426, intensity: 0.4, name: "Park Street" },
  { lat: 22.5958, lng: 88.3936, intensity: 0.6, name: "Howrah" },
  { lat: 22.5024, lng: 88.3695, intensity: 0.3, name: "Salt Lake" },
  
  // Pune region
  { lat: 18.5204, lng: 73.8567, intensity: 0.3, name: "Pune Central" },
  { lat: 18.5362, lng: 73.8800, intensity: 0.4, name: "Camp Area" },
  { lat: 18.5912, lng: 73.7389, intensity: 0.2, name: "Hinjewadi IT Park" },
  { lat: 18.5089, lng: 73.9260, intensity: 0.3, name: "Koregaon Park" },
  
  // Additional route waypoints
  { lat: 19.8762, lng: 75.3433, intensity: 0.5, name: "Aurangabad" },
  { lat: 21.1458, lng: 79.0882, intensity: 0.4, name: "Nagpur" },
  { lat: 23.0225, lng: 72.5714, intensity: 0.4, name: "Ahmedabad" },
  { lat: 26.8467, lng: 80.9462, intensity: 0.5, name: "Lucknow" },
  { lat: 30.7333, lng: 76.7794, intensity: 0.4, name: "Chandigarh" },
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Optional: filter by bounding box
    let filteredData = heatmapData;
    
    if (req.method === "POST") {
      const body = await req.json();
      const { bounds, minIntensity, maxIntensity } = body;
      
      // Filter by geographic bounds if provided
      if (bounds) {
        const { north, south, east, west } = bounds;
        filteredData = filteredData.filter(
          point => 
            point.lat >= south && 
            point.lat <= north && 
            point.lng >= west && 
            point.lng <= east
        );
      }
      
      // Filter by intensity range if provided
      if (minIntensity !== undefined) {
        filteredData = filteredData.filter(point => point.intensity >= minIntensity);
      }
      if (maxIntensity !== undefined) {
        filteredData = filteredData.filter(point => point.intensity <= maxIntensity);
      }
    }

    console.log(`[Heatmap API] Returning ${filteredData.length} data points`);

    const response = {
      success: true,
      count: filteredData.length,
      data: filteredData.map(point => ({
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
      disclaimer: "Heatmap data is for demonstration purposes using sample data."
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
