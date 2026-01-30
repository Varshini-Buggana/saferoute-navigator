import { useState, useEffect } from "react";
import Header from "@/components/Header";
import SearchPanel from "@/components/SearchPanel";
import MapView from "@/components/MapView";
import MapLegend from "@/components/MapLegend";
import HeatmapToggle from "@/components/HeatmapToggle";
import SafetyInfoPanel, { SafetyData } from "@/components/SafetyInfoPanel";
import RouteInfoPanel from "@/components/RouteInfoPanel";
import { RoutePoint } from "@/data/mockSafetyData";
import { useRouteSafetyAnalysis, useHeatmapData } from "@/hooks/useSafetyAnalysis";
import { RouteSafetyResponse, riskLevelToStatus, HeatmapPoint } from "@/lib/safetyApi";
import { MapIcon, Navigation, Sparkles, Cpu, Globe, Route, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address: string;
  place_id: string;
}

const Index = () => {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [selectedSafetyData, setSelectedSafetyData] = useState<SafetyData | null>(null);
  const [routeAnalysis, setRouteAnalysis] = useState<RouteSafetyResponse | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);

  const routeSafetyMutation = useRouteSafetyAnalysis();
  const heatmapQuery = useHeatmapData();

  // Load heatmap data when enabled
  useEffect(() => {
    if (heatmapQuery.data?.data) {
      setHeatmapData(heatmapQuery.data.data);
    }
  }, [heatmapQuery.data]);

  const handleHeatmapToggle = (enabled: boolean) => {
    setShowHeatmap(enabled);
    if (enabled && heatmapData.length === 0) {
      heatmapQuery.refetch();
    }
  };

  const handleSearch = async (
    from: string, 
    to: string, 
    fromCoords?: GeocodeResult, 
    toCoords?: GeocodeResult
  ) => {
    setHasSearched(true);
    setSelectedSafetyData(null);
    setRouteAnalysis(null);

    try {
      const result = await routeSafetyMutation.mutateAsync({ 
        fromLocation: from, 
        toLocation: to,
        fromCoords: fromCoords ? { lat: fromCoords.lat, lng: fromCoords.lng } : undefined,
        toCoords: toCoords ? { lat: toCoords.lat, lng: toCoords.lng } : undefined,
      });
      
      if (result.success) {
        const points: RoutePoint[] = result.routePoints.map(p => ({
          lat: p.lat,
          lng: p.lng,
          name: p.name,
          status: p.status as "safe" | "caution" | "danger"
        }));
        
        setRoutePoints(points);
        setRouteAnalysis(result);
        
        const destStatus = riskLevelToStatus(result.overallRiskLevel);
        setSelectedSafetyData({
          status: destStatus,
          score: Math.round(result.routeSafetyScore * 20),
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
    }
  };

  const handleMarkerClick = (point: RoutePoint) => {
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
    <div className="min-h-screen bg-travel flex flex-col relative">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-hero pointer-events-none" />
      <div className="absolute inset-0 nav-pattern pointer-events-none opacity-30" />
      
      <Header />

      <main className="flex-1 p-4 md:p-6 relative z-10">
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 h-full">
            {/* Left Sidebar */}
            <div className="lg:col-span-3 space-y-4">
              <SearchPanel onSearch={handleSearch} isLoading={isLoading} />
              
              <HeatmapToggle 
                enabled={showHeatmap} 
                onToggle={handleHeatmapToggle}
                isLoading={heatmapQuery.isLoading}
              />
              
              <MapLegend />
              
              {/* AI-Powered Badge */}
              <div className="bg-card rounded-xl p-4 shadow-soft border border-primary/20 relative overflow-hidden group hover:shadow-elevated transition-shadow duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Sparkles className="w-4 h-4 text-primary animate-pulse-soft" />
                    </div>
                    <h3 className="text-sm font-semibold text-card-foreground">AI-Powered Analysis</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Uses NLP and sentiment analysis to evaluate travel safety.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-primary/80">
                    <Cpu className="w-3 h-3" />
                    <span>Gemini 3 Flash Preview</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Area */}
            <div className="lg:col-span-6 min-h-[400px] lg:min-h-[600px]">
              {!hasSearched ? (
                <div className="h-full flex flex-col items-center justify-center bg-card rounded-xl border border-border shadow-elevated relative overflow-hidden">
                  {/* Decorative background */}
                  <div className="absolute inset-0 nav-pattern opacity-20" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50" />
                  
                  <div className="relative z-10 flex flex-col items-center px-6 text-center">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-6 shadow-glow">
                      <MapIcon className="w-14 h-14 text-primary" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-card-foreground mb-3">
                      Plan Your Safe Route
                    </h2>
                    <p className="text-muted-foreground max-w-sm mb-6">
                      Enter your starting point and destination to get AI-powered safety analysis with real road navigation
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-4 text-sm">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-safe/10 text-safe border border-safe/20">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Safety Analysis</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
                        <Route className="w-4 h-4" />
                        <span>Real Roads</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-caution/10 text-caution border border-caution/20">
                        <Globe className="w-4 h-4" />
                        <span>Global Coverage</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-6 text-xs text-primary">
                      <Sparkles className="w-3 h-3" />
                      <span>Powered by Lovable AI</span>
                    </div>
                  </div>
                </div>
              ) : (
                <MapView 
                  routePoints={routePoints} 
                  onMarkerClick={handleMarkerClick}
                  heatmapData={heatmapData}
                  showHeatmap={showHeatmap}
                />
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
                <div className="bg-card rounded-xl p-6 shadow-soft border border-border text-center relative overflow-hidden group hover:shadow-elevated transition-shadow">
                  <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-transparent" />
                  <div className="relative z-10">
                    <div className="p-4 rounded-xl bg-muted inline-block mb-3">
                      <Navigation className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Click on a marker to view AI-generated safety information
                    </p>
                  </div>
                </div>
              ) : !hasSearched ? (
                <div className="bg-card rounded-xl p-6 shadow-soft border border-border relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                  <div className="relative z-10">
                    <h3 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      Safety Information
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Search for a route to see AI-powered safety analysis of your journey.
                    </p>
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-xs text-primary flex items-center gap-2">
                        <Cpu className="w-3 h-3" />
                        NLP sentiment analysis & topic classification
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Quick Tips Card */}
              {hasSearched && (
                <div className="bg-card rounded-xl p-4 shadow-soft border border-border relative overflow-hidden animate-fade-in">
                  <div className="absolute inset-0 bg-gradient-to-br from-safe/5 to-transparent" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold text-card-foreground">Route Features</h3>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-2">
                      <li className="flex items-start gap-2">
                        <Route className="w-3 h-3 mt-0.5 text-primary" />
                        <span>Routes follow actual roads via OSRM</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-3 h-3 mt-0.5 rounded-full bg-safe flex-shrink-0" />
                        <span>Green markers indicate safe areas</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-3 h-3 mt-0.5 rounded-full bg-danger flex-shrink-0" />
                        <span>Red markers need extra caution</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card/80 backdrop-blur-sm border-t border-border py-4 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p className="font-medium">© 2024 SafeTravel Finder</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">
              <Globe className="w-3 h-3" />
              Global Coverage
            </span>
            <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-caution/10 text-caution">
              ⚠️ Prototype
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
