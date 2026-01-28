import { useState } from "react";
import Header from "@/components/Header";
import SearchPanel from "@/components/SearchPanel";
import MapView from "@/components/MapView";
import MapLegend from "@/components/MapLegend";
import SafetyInfoPanel, { SafetyData } from "@/components/SafetyInfoPanel";
import { getMockRoutePoints, getLocationSafetyData, RoutePoint } from "@/data/mockSafetyData";
import { MapIcon, Navigation } from "lucide-react";

const Index = () => {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [selectedSafetyData, setSelectedSafetyData] = useState<SafetyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (from: string, to: string) => {
    setIsLoading(true);
    setHasSearched(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const points = getMockRoutePoints(from, to);
    setRoutePoints(points);

    // Get safety data for destination
    const destinationSafety = getLocationSafetyData(to);
    setSelectedSafetyData(destinationSafety);

    setIsLoading(false);
  };

  const handleMarkerClick = (point: RoutePoint) => {
    const safetyData = getLocationSafetyData(point.name);
    if (safetyData) {
      setSelectedSafetyData(safetyData);
    } else {
      // Create mock data for waypoints
      setSelectedSafetyData({
        status: point.status,
        score: point.status === "safe" ? 85 : point.status === "caution" ? 60 : 35,
        location: point.name,
        reasons: [
          point.status === "safe" ? "Area well-monitored" : "Exercise caution",
          "Regular traffic flow",
          "Emergency services accessible",
        ],
        lastUpdated: "Just now",
      });
    }
  };

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
              
              {/* Quick Tips */}
              <div className="bg-card rounded-lg p-4 shadow-soft border border-border">
                <h3 className="text-sm font-semibold text-card-foreground mb-2">Quick Tips</h3>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Try cities like Delhi, Mumbai, Bangalore, Jaipur</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Click markers to view safety details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Route shows safety status along the way</span>
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
                    Enter your starting point and destination to see safety information along your route
                  </p>
                  <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                    <Navigation className="w-4 h-4 text-primary" />
                    <span>Map centered on India</span>
                  </div>
                </div>
              ) : (
                <MapView routePoints={routePoints} onMarkerClick={handleMarkerClick} />
              )}
            </div>

            {/* Right Sidebar - Safety Info */}
            <div className="lg:col-span-3">
              {selectedSafetyData ? (
                <SafetyInfoPanel data={selectedSafetyData} isVisible={true} />
              ) : hasSearched ? (
                <div className="bg-card rounded-lg p-6 shadow-soft border border-border text-center">
                  <div className="p-4 rounded-full bg-muted inline-block mb-3">
                    <Navigation className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click on a marker to view safety information
                  </p>
                </div>
              ) : (
                <div className="bg-card rounded-lg p-6 shadow-soft border border-border">
                  <h3 className="font-semibold text-card-foreground mb-3">Safety Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Search for a route to see detailed safety information about your journey.
                  </p>
                  <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs text-primary">
                      💡 Our safety data is updated regularly to provide accurate information
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>© 2024 SafeTravel Finder. Travel safely.</p>
          <p className="text-xs">Mock data for demonstration purposes</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
