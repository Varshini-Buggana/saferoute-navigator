import { Clock, Route, Shield, ShieldAlert, ShieldCheck, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RouteAlternative {
  id: number;
  name: string;
  distance: string;
  duration: string;
  safetyScore: number; // 0-100
  riskLevel: "safe" | "caution" | "danger";
  isSelected: boolean;
  coordinates: [number, number][];
}

interface RouteAlternativesPanelProps {
  routes: RouteAlternative[];
  onRouteSelect: (routeId: number) => void;
  isLoading?: boolean;
  transportMode?: string;
}

const getRiskConfig = (riskLevel: RouteAlternative["riskLevel"]) => {
  switch (riskLevel) {
    case "safe":
      return {
        icon: ShieldCheck,
        label: "Safe",
        colorClass: "text-safe",
        bgClass: "bg-safe/10",
        borderClass: "border-safe/30",
      };
    case "caution":
      return {
        icon: ShieldAlert,
        label: "Caution",
        colorClass: "text-caution",
        bgClass: "bg-caution/10",
        borderClass: "border-caution/30",
      };
    case "danger":
      return {
        icon: Shield,
        label: "High Risk",
        colorClass: "text-danger",
        bgClass: "bg-danger/10",
        borderClass: "border-danger/30",
      };
  }
};

const RouteAlternativesPanel = ({
  routes,
  onRouteSelect,
  isLoading = false,
  transportMode = "driving",
}: RouteAlternativesPanelProps) => {
  if (isLoading) {
    return (
      <div className="bg-card rounded-xl p-4 shadow-soft border border-border animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 rounded bg-muted" />
          <div className="h-4 w-28 rounded bg-muted" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (routes.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-xl p-4 shadow-soft border border-border relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Route className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">Route Options</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            {routes.length} route{routes.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="space-y-2">
          {routes.map((route, index) => {
            const riskConfig = getRiskConfig(route.riskLevel);
            const RiskIcon = riskConfig.icon;

            return (
              <button
                key={route.id}
                onClick={() => onRouteSelect(route.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all duration-200",
                  "hover:shadow-md hover:scale-[1.01]",
                  route.isSelected
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                    : "border-border bg-background/50 hover:border-primary/30"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-xs font-bold px-1.5 py-0.5 rounded",
                        route.isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {index === 0 ? "Best" : `Alt ${index}`}
                      </span>
                      <span className="text-sm font-medium text-card-foreground truncate">
                        {route.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {route.duration}
                      </span>
                      <span className="text-muted-foreground/50">•</span>
                      <span>{route.distance}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                      riskConfig.bgClass,
                      riskConfig.colorClass
                    )}>
                      <RiskIcon className="w-3 h-3" />
                      <span>{riskConfig.label}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Score: {route.safetyScore}%
                    </div>
                  </div>
                </div>

                {route.isSelected && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Currently selected</span>
                      <ChevronRight className="w-3 h-3 text-primary" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground text-center">
            Routes are ranked by safety score and travel time
          </p>
        </div>
      </div>
    </div>
  );
};

export default RouteAlternativesPanel;
