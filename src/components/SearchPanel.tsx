import { useState } from "react";
import { Route, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import LocationAutocomplete from "@/components/LocationAutocomplete";

interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address: string;
  place_id: string;
}

interface SearchPanelProps {
  onSearch: (from: string, to: string, fromCoords?: GeocodeResult, toCoords?: GeocodeResult) => void;
  isLoading?: boolean;
}

const SearchPanel = ({ onSearch, isLoading }: SearchPanelProps) => {
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [fromCoords, setFromCoords] = useState<GeocodeResult | null>(null);
  const [toCoords, setToCoords] = useState<GeocodeResult | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromLocation.trim() && toLocation.trim()) {
      onSearch(
        fromLocation, 
        toLocation, 
        fromCoords || undefined, 
        toCoords || undefined
      );
    }
  };

  return (
    <div className="bg-panel rounded-lg p-6 shadow-soft border border-border city-silhouette relative overflow-hidden">
      {/* Subtle nav pattern */}
      <div className="absolute inset-0 nav-pattern opacity-30 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">Plan Your Route</h2>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Globe className="w-3 h-3" />
            <span>Global</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <LocationAutocomplete
              value={fromLocation}
              onChange={setFromLocation}
              onSelect={setFromCoords}
              placeholder="From location (anywhere in the world)"
              icon="from"
            />
            
            <div className="flex justify-center">
              <div className="w-px h-4 bg-border" />
            </div>
            
            <LocationAutocomplete
              value={toLocation}
              onChange={setToLocation}
              onSelect={setToCoords}
              placeholder="To location"
              icon="to"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-medium shadow-glow"
            disabled={isLoading || !fromLocation.trim() || !toLocation.trim()}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Finding Route...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Route className="w-5 h-5" />
                Get Route
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SearchPanel;
