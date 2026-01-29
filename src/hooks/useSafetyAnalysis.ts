/**
 * Safety Analysis Hooks
 * 
 * React hooks for interacting with the safety analysis backend.
 * Uses TanStack Query for caching and state management.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  analyzeSafety, 
  getHeatmapData, 
  analyzeRouteSafety,
  SafetyAnalysisResponse,
  HeatmapResponse,
  RouteSafetyResponse 
} from "@/lib/safetyApi";
import { toast } from "sonner";

/**
 * Hook for fetching heatmap data
 * Automatically loads on mount and caches the result
 */
export function useHeatmapData() {
  return useQuery({
    queryKey: ["heatmap"],
    queryFn: () => getHeatmapData(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook for analyzing location safety
 * Uses mutation pattern for on-demand analysis
 */
export function useSafetyAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      latitude, 
      longitude, 
      locationName 
    }: { 
      latitude: number; 
      longitude: number; 
      locationName: string;
    }) => {
      return analyzeSafety(latitude, longitude, locationName);
    },
    onSuccess: (data) => {
      // Cache the result by location
      queryClient.setQueryData(
        ["safety", data.location.toLowerCase()],
        data
      );
      console.log("[useSafetyAnalysis] Analysis complete:", data.location);
    },
    onError: (error: Error) => {
      console.error("[useSafetyAnalysis] Error:", error);
      if (error.message.includes("Rate limit")) {
        toast.error("Rate limit exceeded. Please wait a moment and try again.");
      } else if (error.message.includes("credits")) {
        toast.error("AI credits exhausted. Please add credits to continue.");
      } else {
        toast.error("Failed to analyze safety. Please try again.");
      }
    },
  });
}

/**
 * Hook for analyzing route safety
 * Returns route points, unsafe segments, and travel recommendations
 */
export function useRouteSafetyAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      fromLocation, 
      toLocation,
      fromCoords,
      toCoords
    }: { 
      fromLocation: string; 
      toLocation: string;
      fromCoords?: { lat: number; lng: number };
      toCoords?: { lat: number; lng: number };
    }) => {
      return analyzeRouteSafety(fromLocation, toLocation, fromCoords, toCoords);
    },
    onSuccess: (data) => {
      // Cache the result by route
      const routeKey = `${data.route.from.name}-${data.route.to.name}`.toLowerCase();
      queryClient.setQueryData(["route-safety", routeKey], data);
      console.log("[useRouteSafetyAnalysis] Route analysis complete");
    },
    onError: (error: Error) => {
      console.error("[useRouteSafetyAnalysis] Error:", error);
      if (error.message.includes("Rate limit")) {
        toast.error("Rate limit exceeded. Please wait a moment and try again.");
      } else if (error.message.includes("credits")) {
        toast.error("AI credits exhausted. Please add credits to continue.");
      } else if (error.message.includes("Unknown")) {
        toast.error(error.message);
      } else {
        toast.error("Failed to analyze route. Please try again.");
      }
    },
  });
}

/**
 * Hook for getting cached safety data for a location
 */
export function useCachedSafetyData(locationName: string) {
  return useQuery<SafetyAnalysisResponse | undefined>({
    queryKey: ["safety", locationName.toLowerCase()],
    enabled: false, // Only use cached data, don't fetch
    staleTime: Infinity,
  });
}
