/**
 * Safety API Client
 * 
 * Frontend client for the AI-powered safety analysis backend.
 * Provides methods to call the three main endpoints:
 * - /api/safety - Location safety analysis
 * - /api/heatmap - Safety heatmap data
 * - /api/route-safety - Route safety analysis
 */

import { supabase } from "@/integrations/supabase/client";

// Type definitions for API responses
export interface SafetyAnalysisResponse {
  success: boolean;
  location: string;
  coordinates: { latitude: number; longitude: number };
  safetyScore: number; // 0-5
  riskLevel: "Safe" | "Caution" | "High Risk";
  sentiment: "positive" | "negative" | "mixed";
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topics: string[];
  reasons: string[];
  recommendations: string[];
  reportsAnalyzed: number;
  lastUpdated: string;
  disclaimer: string;
  error?: string;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number; // 0.0 (safe) to 1.0 (dangerous)
  name: string;
  riskLevel: "Safe" | "Caution" | "High Risk";
}

export interface HeatmapResponse {
  success: boolean;
  count: number;
  data: HeatmapPoint[];
  legend: {
    safe: { range: string; color: string; description: string };
    caution: { range: string; color: string; description: string };
    danger: { range: string; color: string; description: string };
  };
  lastUpdated: string;
  disclaimer: string;
  error?: string;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  name: string;
  status: "safe" | "caution" | "danger";
}

export interface UnsafeSegment {
  name: string;
  risk: "low" | "moderate" | "high";
  description: string;
}

export interface RouteSafetyResponse {
  success: boolean;
  route: {
    from: { name: string; lat: number; lng: number };
    to: { name: string; lat: number; lng: number };
  };
  overallRiskLevel: "Low Risk" | "Moderate Risk" | "High Risk";
  routeSafetyScore: number; // 0-5
  estimatedTravelTime: string;
  travelMode: string;
  routePoints: RoutePoint[];
  unsafeSegments: UnsafeSegment[];
  safetyTips: string[];
  bestTimeToTravel: string;
  emergencyContacts: {
    police: string;
    ambulance: string;
    roadAssistance: string;
  };
  lastUpdated: string;
  disclaimer: string;
  error?: string;
}

/**
 * Analyze safety for a specific location
 * Uses AI-powered NLP to analyze safety reports and generate insights
 */
export async function analyzeSafety(
  latitude: number,
  longitude: number,
  locationName: string
): Promise<SafetyAnalysisResponse> {
  console.log(`[SafetyAPI] Analyzing safety for: ${locationName}`);
  
  const { data, error } = await supabase.functions.invoke("safety", {
    body: { latitude, longitude, locationName },
  });

  if (error) {
    console.error("[SafetyAPI] Error:", error);
    throw new Error(error.message || "Failed to analyze safety");
  }

  return data as SafetyAnalysisResponse;
}

/**
 * Get heatmap data for safety visualization
 * Returns coordinates with intensity values for map overlay
 */
export async function getHeatmapData(bounds?: {
  north: number;
  south: number;
  east: number;
  west: number;
}): Promise<HeatmapResponse> {
  console.log("[SafetyAPI] Fetching heatmap data");
  
  const { data, error } = await supabase.functions.invoke("heatmap", {
    body: bounds ? { bounds } : {},
  });

  if (error) {
    console.error("[SafetyAPI] Heatmap error:", error);
    throw new Error(error.message || "Failed to fetch heatmap data");
  }

  return data as HeatmapResponse;
}

/**
 * Analyze safety along a route between two locations
 * Uses AI to identify unsafe segments and provide travel recommendations
 */
export async function analyzeRouteSafety(
  fromLocation: string,
  toLocation: string
): Promise<RouteSafetyResponse> {
  console.log(`[SafetyAPI] Analyzing route: ${fromLocation} → ${toLocation}`);
  
  const { data, error } = await supabase.functions.invoke("route-safety", {
    body: { fromLocation, toLocation },
  });

  if (error) {
    console.error("[SafetyAPI] Route safety error:", error);
    throw new Error(error.message || "Failed to analyze route safety");
  }

  return data as RouteSafetyResponse;
}

/**
 * Convert risk level to status for map markers
 */
export function riskLevelToStatus(riskLevel: string): "safe" | "caution" | "danger" {
  const normalized = riskLevel.toLowerCase();
  if (normalized.includes("safe") || normalized.includes("low")) return "safe";
  if (normalized.includes("caution") || normalized.includes("moderate")) return "caution";
  return "danger";
}

/**
 * Convert safety score (0-5) to risk level string
 */
export function scoreToRiskLevel(score: number): "Safe" | "Caution" | "High Risk" {
  if (score >= 3.5) return "Safe";
  if (score >= 2) return "Caution";
  return "High Risk";
}
