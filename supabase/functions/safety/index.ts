import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Safety Analysis Edge Function
 * 
 * Analyzes a location's safety using AI-powered NLP to:
 * - Classify safety reports by topic (harassment, transport, infrastructure, security)
 * - Perform sentiment analysis (positive, negative, neutral)
 * - Generate human-readable safety reasons
 * - Calculate a safety score (0-5)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Sample safety reports dataset (demo data)
const safetyReportsDatabase: Record<string, Array<{ text: string; timestamp: string }>> = {
  "delhi": [
    { text: "Crowded metro station, felt unsafe during rush hour. Pickpocketing reported.", timestamp: "2024-01-15" },
    { text: "Well-lit streets in Connaught Place, good police presence.", timestamp: "2024-01-14" },
    { text: "Aggressive taxi drivers near railway station, be cautious.", timestamp: "2024-01-13" },
    { text: "Great experience walking in Lodhi Garden during daytime.", timestamp: "2024-01-12" },
    { text: "Street harassment reported near Chandni Chowk market.", timestamp: "2024-01-11" },
  ],
  "mumbai": [
    { text: "Local trains are generally safe but extremely crowded.", timestamp: "2024-01-15" },
    { text: "Marine Drive is well-patrolled and safe for evening walks.", timestamp: "2024-01-14" },
    { text: "Dharavi area has narrow lanes, best to visit with a guide.", timestamp: "2024-01-13" },
    { text: "Good lighting and CCTV coverage in Bandra area.", timestamp: "2024-01-12" },
    { text: "Positive experience with auto-rickshaw drivers.", timestamp: "2024-01-11" },
  ],
  "bangalore": [
    { text: "Traffic is chaotic but generally safe during daytime.", timestamp: "2024-01-15" },
    { text: "MG Road and Brigade Road have excellent security.", timestamp: "2024-01-14" },
    { text: "Some areas lack proper streetlights at night.", timestamp: "2024-01-13" },
    { text: "Tech parks have good security infrastructure.", timestamp: "2024-01-12" },
    { text: "Public transport is reliable and safe.", timestamp: "2024-01-11" },
  ],
  "jaipur": [
    { text: "Old city area is touristy but watch for scams.", timestamp: "2024-01-15" },
    { text: "Hawa Mahal and Amber Fort areas are well-secured.", timestamp: "2024-01-14" },
    { text: "Friendly locals, good hospitality overall.", timestamp: "2024-01-13" },
    { text: "Some aggressive shopkeepers in bazaars.", timestamp: "2024-01-12" },
    { text: "Evening walks in central areas feel safe.", timestamp: "2024-01-11" },
  ],
  "chennai": [
    { text: "Beach areas are generally safe with regular patrols.", timestamp: "2024-01-15" },
    { text: "Auto-rickshaw drivers mostly use meters, trustworthy.", timestamp: "2024-01-14" },
    { text: "Public transport is well-organized and safe.", timestamp: "2024-01-13" },
    { text: "Some flooding issues during monsoon season.", timestamp: "2024-01-12" },
    { text: "Temple areas are peaceful and secure.", timestamp: "2024-01-11" },
  ],
  "hyderabad": [
    { text: "Charminar area can be crowded but has good police presence.", timestamp: "2024-01-15" },
    { text: "Hi-tech city has excellent infrastructure and security.", timestamp: "2024-01-14" },
    { text: "Night life areas in Jubilee Hills are well-lit.", timestamp: "2024-01-13" },
    { text: "Some traffic congestion issues but safe overall.", timestamp: "2024-01-12" },
    { text: "Positive experiences with public transportation.", timestamp: "2024-01-11" },
  ],
};

// Text cleaning function - removes noise from reports
function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/[^\w\s]/g, ' ') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Get reports for a location
function getLocationReports(locationName: string): Array<{ text: string; timestamp: string }> {
  const normalizedName = locationName.toLowerCase().trim();
  
  // Direct match
  if (safetyReportsDatabase[normalizedName]) {
    return safetyReportsDatabase[normalizedName];
  }
  
  // Partial match
  for (const key of Object.keys(safetyReportsDatabase)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return safetyReportsDatabase[key];
    }
  }
  
  // Default generic reports for unknown locations
  return [
    { text: "Limited data available for this location.", timestamp: new Date().toISOString().split('T')[0] },
    { text: "Exercise standard travel precautions.", timestamp: new Date().toISOString().split('T')[0] },
  ];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, locationName } = await req.json();
    
    console.log(`[Safety API] Analyzing location: ${locationName} (${latitude}, ${longitude})`);
    
    // Get relevant reports for this location
    const reports = getLocationReports(locationName || "unknown");
    const cleanedReports = reports.map(r => cleanText(r.text)).join("\n");
    
    // Call Lovable AI for NLP analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const aiPrompt = `You are a safety analysis AI. Analyze the following safety reports for a location and provide a structured assessment.

REPORTS:
${cleanedReports}

LOCATION: ${locationName || "Unknown location"}
COORDINATES: ${latitude}, ${longitude}

Analyze the reports and respond with a JSON object containing:
1. "safetyScore": A number from 0-5 (0 = very dangerous, 5 = very safe)
2. "riskLevel": One of "Safe", "Caution", or "High Risk"
3. "sentiment": Overall sentiment - "positive", "negative", or "mixed"
4. "sentimentBreakdown": { "positive": percentage, "negative": percentage, "neutral": percentage }
5. "topics": Array of identified safety topics (e.g., "harassment", "transport", "infrastructure", "security", "crime", "scams")
6. "reasons": Array of 3-5 human-readable bullet points explaining the safety assessment
7. "recommendations": Array of 2-3 actionable safety tips for travelers

Respond ONLY with valid JSON, no markdown or explanation.`;

    console.log("[Safety API] Calling Lovable AI for analysis...");
    
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
            content: "You are a safety analysis expert. Always respond with valid JSON only, no markdown formatting."
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
      console.error("[Safety API] AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";
    
    console.log("[Safety API] AI response received:", aiContent.substring(0, 200) + "...");
    
    // Parse the AI response
    let analysisResult;
    try {
      // Remove any markdown code blocks if present
      const cleanedContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysisResult = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("[Safety API] Failed to parse AI response:", parseError);
      // Fallback analysis
      analysisResult = {
        safetyScore: 3,
        riskLevel: "Caution",
        sentiment: "mixed",
        sentimentBreakdown: { positive: 40, negative: 30, neutral: 30 },
        topics: ["general safety"],
        reasons: [
          "Limited data available for comprehensive analysis",
          "Standard travel precautions recommended",
          "Check local advisories before visiting"
        ],
        recommendations: [
          "Stay aware of your surroundings",
          "Keep valuables secure",
          "Travel during daylight when possible"
        ]
      };
    }

    const response = {
      success: true,
      location: locationName,
      coordinates: { latitude, longitude },
      safetyScore: analysisResult.safetyScore,
      riskLevel: analysisResult.riskLevel,
      sentiment: analysisResult.sentiment,
      sentimentBreakdown: analysisResult.sentimentBreakdown,
      topics: analysisResult.topics,
      reasons: analysisResult.reasons,
      recommendations: analysisResult.recommendations,
      reportsAnalyzed: reports.length,
      lastUpdated: new Date().toISOString(),
      disclaimer: "This is a prototype using sample data. Always verify with official sources."
    };

    console.log("[Safety API] Analysis complete for:", locationName);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[Safety API] Error:", error);
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
