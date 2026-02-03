import { Clock, Route as RouteIcon, Car, PersonStanding, Bus, Train, Plane, Loader2, AlertTriangle } from "lucide-react";
import { TransportMode } from "./TransportModeSelector";

interface TravelInfoCardProps {
  distance: string;
  duration: string;
  mode: TransportMode;
  isLoading?: boolean;
  isFlightMode?: boolean;
}

const modeIcons = {
  driving: Car,
  walking: PersonStanding,
  transit: Bus,
  train: Train,
  flight: Plane,
};

const modeLabels = {
  driving: "Car",
  walking: "Walk",
  transit: "Bus",
  train: "Train",
  flight: "Flight",
};

const modeDescriptions: Record<TransportMode, string> = {
  driving: "By car via roads",
  walking: "On foot",
  transit: "By bus/metro",
  train: "By train",
  flight: "By air",
};

const TravelInfoCard = ({ distance, duration, mode, isLoading, isFlightMode }: TravelInfoCardProps) => {
  const ModeIcon = modeIcons[mode];
  const isCalculating = duration === "..." || duration.includes("Calculating");

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg p-4 shadow-soft border border-border animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-3 w-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Flight mode - show warning message
  if (isFlightMode) {
    return (
      <div className="bg-card rounded-lg p-4 shadow-soft border border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-600">
              <Plane className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-card-foreground">
                  Flight
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                  Not Supported
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Flight routes are not supported by Directions API</span>
              </div>
              {distance && distance !== "..." && (
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Straight-line distance: {distance}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-4 shadow-soft border border-border relative overflow-hidden group hover:shadow-elevated transition-shadow">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-primary/10 text-primary">
            <ModeIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-card-foreground">
                {modeLabels[mode]}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Active
              </span>
            </div>
            {isCalculating ? (
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Calculating route...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {duration}
                </span>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1">
                  <RouteIcon className="w-3.5 h-3.5" />
                  {distance}
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground/70 mt-1">
              {modeDescriptions[mode]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelInfoCard;
