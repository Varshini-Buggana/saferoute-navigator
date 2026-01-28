import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Route Safety Analysis Edge Function
 * 
 * Analyzes the safety of a route between two locations using AI.
 * Identifies unsafe segments and provides route-level risk assessment.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// City coordinates database
const cityCoordinates: Record<string, { lat: number; lng: number; safetyLevel: string }> = {
  "delhi": { lat: 28.6139, lng: 77.2090, safetyLevel: "caution" },
  "mumbai": { lat: 19.0760, lng: 72.8777, safetyLevel: "safe" },
  "bangalore": { lat: 12.9716, lng: 77.5946, safetyLevel: "safe" },
  "bengaluru": { lat: 12.9716, lng: 77.5946, safetyLevel: "safe" },
  "chennai": { lat: 13.0827, lng: 80.2707, safetyLevel: "safe" },
  "hyderabad": { lat: 17.3850, lng: 78.4867, safetyLevel: "safe" },
  "jaipur": { lat: 26.9124, lng: 75.7873, safetyLevel: "caution" },
  "kolkata": { lat: 22.5726, lng: 88.3639, safetyLevel: "caution" },
  "pune": { lat: 18.5204, lng: 73.8567, safetyLevel: "safe" },
  "ahmedabad": { lat: 23.0225, lng: 72.5714, safetyLevel: "caution" },
  "lucknow": { lat: 26.8467, lng: 80.9462, safetyLevel: "caution" },
  "chandigarh": { lat: 30.7333, lng: 76.7794, safetyLevel: "safe" },
  "agra": { lat: 27.1767, lng: 78.0081, safetyLevel: "caution" },
  "varanasi": { lat: 25.3176, lng: 82.9739, safetyLevel: "caution" },
  "goa": { lat: 15.2993, lng: 74.1240, safetyLevel: "safe" },
  "udaipur": { lat: 24.5854, lng: 73.7125, safetyLevel: "safe" },
  "nagpur": { lat: 21.1458, lng: 79.0882, safetyLevel: "caution" },
  "aurangabad": { lat: 19.8762, lng: 75.3433, safetyLevel: "caution" },
  "mysore": { lat: 12.2958, lng: 76.6394, safetyLevel: "safe" },
  "kochi": { lat: 9.9312, lng: 76.2673, safetyLevel: "safe" },
};

// Route-specific safety data
const routeHazards: Record<string, { segment: string; issue: string; severity: string }[]> = {
  "delhi-mumbai": [
    { segment: "Delhi-Jaipur Highway", issue: "Heavy traffic during festivals", severity: "moderate" },
    { segment: "Rajasthan Desert Section", issue: "Limited services, extreme heat", severity: "moderate" },
    { segment: "Gujarat Highway", issue: "Long stretches with few stops", severity: "low" }
  ],
  "delhi-jaipur": [
    { segment: "Gurgaon Exit", issue: "Traffic congestion during peak hours", severity: "low" },
    { segment: "NH48 Toll Sections", issue: "Fast traffic, stay alert", severity: "moderate" }
  ],
  "mumbai-pune": [
    { segment: "Mumbai-Pune Expressway", issue: "High-speed traffic, fog in monsoon", severity: "moderate" },
    { segment: "Lonavala Ghats", issue: "Sharp curves, landslide prone in rains", severity: "high" }
  ],
  "bangalore-chennai": [
    { segment: "Hosur Road Exit", issue: "Heavy traffic congestion", severity: "low" },
    { segment: "NH48 Vellore Section", issue: "Road construction in progress", severity: "moderate" }
  ],
  "delhi-agra": [
    { segment: "Yamuna Expressway", issue: "High-speed traffic, stray animals", severity: "moderate" },
    { segment: "Agra Entry", issue: "Tourist traffic, potential scams", severity: "low" }
  ]
};

function getCoordinates(locationName: string): { lat: number; lng: number; safetyLevel: string } | null {
  const normalized = locationName.toLowerCase().trim();
  return cityCoordinates[normalized] || null;
}

function getRouteHazards(from: string, to: string): typeof routeHazards[string] {
  const fromNorm = from.toLowerCase().trim();
  const toNorm = to.toLowerCase().trim();
  
  // Try both directions
  const key1 = `${fromNorm}-${toNorm}`;
  const key2 = `${toNorm}-${fromNorm}`;
  
  return routeHazards[key1] || routeHazards[key2] || [];
}

function generateWaypoints(from: { lat: number; lng: number }, to: { lat: number; lng: number }, count: number = 3): Array<{ lat: number; lng: number; name: string }> {
  const waypoints = [];
  for (let i = 1; i <= count; i++) {
    const fraction = i / (count + 1);
    waypoints.push({
      lat: from.lat + (to.lat - from.lat) * fraction,
      lng: from.lng + (to.lng - from.lng) * fraction,
      name: `Waypoint ${i}`
    });
  }
  return waypoints;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { fromLocation, toLocation } = await req.json();
    
    console.log(`[Route Safety API] Analyzing route: ${fromLocation} → ${toLocation}`);
    
    // Get coordinates
    const fromCoords = getCoordinates(fromLocation);
    const toCoords = getCoordinates(toLocation);
    
    if (!fromCoords) {
      return new Response(
        JSON.stringify({ 
          error: `Unknown origin location: ${fromLocation}. Try cities like Delhi, Mumbai, Bangalore, etc.`,
          success: false 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!toCoords) {
      return new Response(
        JSON.stringify({ 
          error: `Unknown destination: ${toLocation}. Try cities like Delhi, Mumbai, Bangalore, etc.`,
          success: false 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get route-specific hazards
    const hazards = getRouteHazards(fromLocation, toLocation);
    const waypoints = generateWaypoints(fromCoords, toCoords);
    
    // Call AI for comprehensive route analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const hazardsSummary = hazards.length > 0 
      ? hazards.map(h => `${h.segment}: ${h.issue} (${h.severity})`).join("\n")
      : "No specific hazards recorded for this route.";

    const aiPrompt = `You are a travel safety analyst. Analyze this route and provide a safety assessment.

ROUTE: ${fromLocation} → ${toLocation}
ORIGIN SAFETY LEVEL: ${fromCoords.safetyLevel}
DESTINATION SAFETY LEVEL: ${toCoords.safetyLevel}
KNOWN HAZARDS:
${hazardsSummary}

Provide a JSON response with:
1. "overallRiskLevel": "Low Risk", "Moderate Risk", or "High Risk"
2. "routeSafetyScore": 0-5 (5 = safest)
3. "estimatedTravelTime": approximate travel time by road
4. "travelMode": suggested travel mode (car, train, flight)
5. "unsafeSegments": Array of { "name": segment name, "risk": "low"/"moderate"/"high", "description": brief explanation }
6. "safetyTips": Array of 3-4 specific tips for this route
7. "bestTimeToTravel": recommended time of day/season
8. "emergencyContacts": { "police": "100", "ambulance": "108", "roadAssistance": relevant number }

Respond ONLY with valid JSON.`;

    console.log("[Route Safety API] Calling AI for route analysis...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a travel safety expert for India. Respond only with valid JSON."
          },
          {
            role: "user",
            content: aiPrompt
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[Route Safety API] AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";
    
    console.log("[Route Safety API] AI response received");
    
    // Parse AI response
    let routeAnalysis;
    try {
      const cleanedContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      routeAnalysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("[Route Safety API] Failed to parse AI response:", parseError);
      // Fallback analysis
      routeAnalysis = {
        overallRiskLevel: hazards.some(h => h.severity === "high") ? "Moderate Risk" : "Low Risk",
        routeSafetyScore: 3.5,
        estimatedTravelTime: "6-8 hours by road",
        travelMode: "car",
        unsafeSegments: hazards.map(h => ({
          name: h.segment,
          risk: h.severity,
          description: h.issue
        })),
        safetyTips: [
          "Start early to avoid peak traffic",
          "Keep emergency numbers handy",
          "Take regular breaks during long drives",
          "Inform someone about your travel plans"
        ],
        bestTimeToTravel: "Early morning (5-7 AM)",
        emergencyContacts: {
          police: "100",
          ambulance: "108",
          roadAssistance: "1033"
        }
      };
    }

    // Build route points for frontend
    const routePoints = [
      { lat: fromCoords.lat, lng: fromCoords.lng, name: fromLocation, status: fromCoords.safetyLevel },
      ...waypoints.map((wp, index) => {
        const segment = routeAnalysis.unsafeSegments?.[index];
        return {
          lat: wp.lat,
          lng: wp.lng,
          name: segment?.name || wp.name,
          status: segment?.risk === "high" ? "danger" : segment?.risk === "moderate" ? "caution" : "safe"
        };
      }),
      { lat: toCoords.lat, lng: toCoords.lng, name: toLocation, status: toCoords.safetyLevel }
    ];

    const response = {
      success: true,
      route: {
        from: { name: fromLocation, ...fromCoords },
        to: { name: toLocation, ...toCoords }
      },
      overallRiskLevel: routeAnalysis.overallRiskLevel,
      routeSafetyScore: routeAnalysis.routeSafetyScore,
      estimatedTravelTime: routeAnalysis.estimatedTravelTime,
      travelMode: routeAnalysis.travelMode,
      routePoints,
      unsafeSegments: routeAnalysis.unsafeSegments || [],
      safetyTips: routeAnalysis.safetyTips || [],
      bestTimeToTravel: routeAnalysis.bestTimeToTravel,
      emergencyContacts: routeAnalysis.emergencyContacts,
      lastUpdated: new Date().toISOString(),
      disclaimer: "Route safety data is for demonstration purposes. Always check current conditions before travel."
    };

    console.log("[Route Safety API] Analysis complete:", fromLocation, "→", toLocation);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[Route Safety API] Error:", error);
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
