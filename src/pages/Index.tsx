import { useState } from "react";
import Header from "@/components/Header";
import SearchPanel from "@/components/SearchPanel";
import MapView from "@/components/MapView";
import MapLegend from "@/components/MapLegend";
import SafetyInfoPanel, { SafetyData } from "@/components/SafetyInfoPanel";
import RouteInfoPanel from "@/components/RouteInfoPanel";
import { RoutePoint } from "@/data/mockSafetyData";
import { useRouteSafetyAnalysis } from "@/hooks/useSafetyAnalysis";
import { RouteSafetyResponse, riskLevelToStatus } from "@/lib/safetyApi";
import { MapIcon, Navigation, Sparkles, Cpu } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [selectedSafetyData, setSelectedSafetyData] = useState<SafetyData | null>(null);
  const [routeAnalysis, setRouteAnalysis] = useState<RouteSafetyResponse | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const routeSafetyMutation = useRouteSafetyAnalysis();

  const handleSearch = async (from: string, to: string) => {
    setHasSearched(true);
    setSelectedSafetyData(null);
    setRouteAnalysis(null);

    try {
      // Call the AI-powered route safety API
      const result = await routeSafetyMutation.mutateAsync({ fromLocation: from, toLocation: to });
      
      if (result.success) {
        // Convert API response to RoutePoint format for the map
        const points: RoutePoint[] = result.routePoints.map(p => ({
          lat: p.lat,
          lng: p.lng,
          name: p.name,
          status: p.status as "safe" | "caution" | "danger"
        }));
        
        setRoutePoints(points);
        setRouteAnalysis(result);
        
        // Set initial safety data for the destination
        const destStatus = riskLevelToStatus(result.overallRiskLevel);
        setSelectedSafetyData({
          status: destStatus,
          score: Math.round(result.routeSafetyScore * 20), // Convert 0-5 to 0-100
          location: `${from} → ${to}`,
          reasons: result.safetyTips || [],
          lastUpdated: "Just now (AI Analysis)",
        });
        
        toast.success("Route analyzed with AI!", {
          description: `Risk Level: ${result.overallRiskLevel}`,
        });
      }
    } catch (error) {
      console.error("Route analysis failed:", error);
      // Error toast is handled by the hook
    }
  };

  const handleMarkerClick = (point: RoutePoint) => {
    // Find unsafe segment info if available
    const segment = routeAnalysis?.unsafeSegments?.find(
      s => s.name.toLowerCase().includes(point.name.toLowerCase()) ||
           point.name.toLowerCase().includes(s.name.toLowerCase())
    );

    setSelectedSafetyData({
      status: point.status,
      score: point.status === "safe" ? 85 : point.status === "caution" ? 60 : 35,
      location: point.name,
      reasons: segment 
        ? [segment.description, `Risk Level: ${segment.risk}`]
        : [
            point.status === "safe" ? "Area analyzed as safe by AI" : "Exercise caution in this area",
            "Real-time safety assessment",
            "Emergency services accessible",
          ],
      lastUpdated: "AI Analysis",
    });
  };

  const isLoading = routeSafetyMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 h-full">
            {/* Left Sidebar */}
            <div className="lg:col-span-3 space-y-4">
              <SearchPanel onSearch={handleSearch} isLoading={isLoading} />
              <MapLegend />
              
              {/* AI-Powered Badge */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 shadow-soft border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-card-foreground">AI-Powered Analysis</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  This prototype uses NLP and sentiment analysis to evaluate safety from sample reports.
                </p>
                <div className="flex items-center gap-2 text-xs text-primary">
                  <Cpu className="w-3 h-3" />
                  <span>Gemini 3 Flash Preview</span>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="bg-card rounded-lg p-4 shadow-soft border border-border">
                <h3 className="text-sm font-semibold text-card-foreground mb-2">Quick Tips</h3>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Try cities like Delhi, Mumbai, Bangalore, Jaipur, Chennai, Hyderabad</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Click markers to view AI-generated safety details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Route analysis includes travel recommendations</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Map Area */}
            <div className="lg:col-span-6 min-h-[400px] lg:min-h-[600px]">
              {!hasSearched ? (
                <div className="h-full flex flex-col items-center justify-center bg-card rounded-lg border border-border shadow-soft">
                  <div className="p-6 rounded-full bg-primary/10 mb-4">
                    <MapIcon className="w-12 h-12 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-card-foreground mb-2">
                    Plan Your Safe Route
                  </h2>
                  <p className="text-muted-foreground text-center max-w-sm">
                    Enter your starting point and destination to get AI-powered safety analysis
                  </p>
                  <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                    <Navigation className="w-4 h-4 text-primary" />
                    <span>Map centered on India</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-primary">
                    <Sparkles className="w-3 h-3" />
                    <span>Powered by Lovable AI</span>
                  </div>
                </div>
              ) : (
                <MapView routePoints={routePoints} onMarkerClick={handleMarkerClick} />
              )}
            </div>

            {/* Right Sidebar - Safety Info */}
            <div className="lg:col-span-3 space-y-4">
              {routeAnalysis && (
                <RouteInfoPanel data={routeAnalysis} />
              )}
              
              {selectedSafetyData ? (
                <SafetyInfoPanel data={selectedSafetyData} isVisible={true} />
              ) : hasSearched && !isLoading ? (
                <div className="bg-card rounded-lg p-6 shadow-soft border border-border text-center">
                  <div className="p-4 rounded-full bg-muted inline-block mb-3">
                    <Navigation className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click on a marker to view AI-generated safety information
                  </p>
                </div>
              ) : !hasSearched ? (
                <div className="bg-card rounded-lg p-6 shadow-soft border border-border">
                  <h3 className="font-semibold text-card-foreground mb-3">Safety Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Search for a route to see AI-powered safety analysis of your journey.
                  </p>
                  <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs text-primary">
                      🧠 Using NLP sentiment analysis and topic classification
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>© 2024 SafeTravel Finder. Travel safely.</p>
          <p className="text-xs">⚠️ Prototype with sample data for demonstration</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
