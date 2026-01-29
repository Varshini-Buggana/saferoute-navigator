import { useState, useRef, useEffect } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address: string;
  place_id: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: GeocodeResult) => void;
  placeholder: string;
  icon: "from" | "to";
  className?: string;
}

const LocationAutocomplete = ({
  value,
  onChange,
  onSelect,
  placeholder,
  icon,
  className,
}: LocationAutocompleteProps) => {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('geocode', {
          body: { action: 'autocomplete', input: value },
        });

        if (error) throw error;

        if (data.success && data.predictions) {
          setPredictions(data.predictions);
          setShowDropdown(data.predictions.length > 0);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error('Autocomplete error:', err);
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (prediction: PlacePrediction) => {
    onChange(prediction.description);
    setShowDropdown(false);
    setPredictions([]);

    try {
      const { data, error } = await supabase.functions.invoke('geocode', {
        body: { 
          action: 'geocode', 
          placeId: prediction.place_id,
          input: prediction.description, // Pass description for OSM geocoding
        },
      });

      if (error) throw error;

      if (data.success && data.result) {
        onSelect(data.result);
      }
    } catch (err) {
      console.error('Geocode error:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || predictions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, predictions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(predictions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const Icon = icon === "from" ? MapPin : Navigation;
  const iconColor = icon === "from" ? "text-safe" : "text-primary";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Icon className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 z-10", iconColor)} />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => predictions.length > 0 && setShowDropdown(true)}
        className="pl-11 h-12 bg-background border-border focus:border-primary focus:ring-primary/20"
      />
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
      )}

      {/* Dropdown */}
      {showDropdown && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {predictions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelect(prediction)}
              className={cn(
                "w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-start gap-3",
                index === selectedIndex && "bg-muted",
                index === 0 && "rounded-t-lg",
                index === predictions.length - 1 && "rounded-b-lg"
              )}
            >
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">
                  {prediction.structured_formatting?.main_text || prediction.description}
                </p>
                {prediction.structured_formatting?.secondary_text && (
                  <p className="text-xs text-muted-foreground truncate">
                    {prediction.structured_formatting.secondary_text}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
