import { useState } from "react";
import { MapPin, Navigation, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchPanelProps {
  onSearch: (from: string, to: string) => void;
  isLoading?: boolean;
}

const SearchPanel = ({ onSearch, isLoading }: SearchPanelProps) => {
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromLocation.trim() && toLocation.trim()) {
      onSearch(fromLocation, toLocation);
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 shadow-soft border border-border">
      <div className="flex items-center gap-2 mb-4">
        <Route className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-card-foreground">Plan Your Route</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-safe" />
            <Input
              type="text"
              placeholder="From location"
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              className="pl-11 h-12 bg-background border-border focus:border-primary focus:ring-primary/20"
            />
          </div>
          
          <div className="flex justify-center">
            <div className="w-px h-4 bg-border" />
          </div>
          
          <div className="relative">
            <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
            <Input
              type="text"
              placeholder="To location"
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
              className="pl-11 h-12 bg-background border-border focus:border-primary focus:ring-primary/20"
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 text-base font-medium"
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
  );
};

export default SearchPanel;
