import { useState } from "react";
import { Route, Globe, Sparkles, Navigation } from "lucide-react";
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
    <div className="bg-card rounded-xl p-5 shadow-elevated border border-border relative overflow-hidden group">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-safe/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Navigation className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">Plan Your Route</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                AI-powered analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
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
              <div className="flex flex-col items-center gap-1">
                <div className="w-px h-2 bg-border" />
                <Route className="w-4 h-4 text-muted-foreground rotate-90" />
                <div className="w-px h-2 bg-border" />
              </div>
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
            className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            disabled={isLoading || !fromLocation.trim() || !toLocation.trim()}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Analyzing Route...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Route className="w-5 h-5" />
                Analyze Route Safety
              </span>
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Routes follow actual roads with real-time safety analysis
          </p>
        </form>
      </div>
    </div>
  );
};

export default SearchPanel;
