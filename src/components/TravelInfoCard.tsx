import { Clock, Route as RouteIcon, Car, PersonStanding, Bus, Bike } from "lucide-react";
import { TransportMode } from "./TransportModeSelector";

interface TravelInfoCardProps {
  distance: string;
  duration: string;
  mode: TransportMode;
  isLoading?: boolean;
}

const modeIcons = {
  driving: Car,
  walking: PersonStanding,
  transit: Bus,
  cycling: Bike,
};

const modeLabels = {
  driving: "Driving",
  walking: "Walking",
  transit: "Transit",
  cycling: "Cycling",
};

const TravelInfoCard = ({ distance, duration, mode, isLoading }: TravelInfoCardProps) => {
  const ModeIcon = modeIcons[mode];

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
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelInfoCard;
