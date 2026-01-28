import { 
  Route, 
  Clock, 
  Car, 
  AlertTriangle, 
  Phone, 
  Lightbulb,
  TrendingUp,
  Shield
} from "lucide-react";
import { RouteSafetyResponse } from "@/lib/safetyApi";
import { cn } from "@/lib/utils";

interface RouteInfoPanelProps {
  data: RouteSafetyResponse;
}

const RouteInfoPanel = ({ data }: RouteInfoPanelProps) => {
  const riskConfig = {
    "Low Risk": {
      bgColor: "bg-safe-light",
      textColor: "text-safe",
      borderColor: "border-safe/30",
    },
    "Moderate Risk": {
      bgColor: "bg-caution-light",
      textColor: "text-caution",
      borderColor: "border-caution/30",
    },
    "High Risk": {
      bgColor: "bg-danger-light",
      textColor: "text-danger",
      borderColor: "border-danger/30",
    },
  };

  const config = riskConfig[data.overallRiskLevel] || riskConfig["Moderate Risk"];

  return (
    <div className="bg-card rounded-lg shadow-soft border border-border overflow-hidden animate-slide-in-right">
      {/* Route Header */}
      <div className={cn("p-4 border-b", config.bgColor, config.borderColor)}>
        <div className="flex items-center gap-2 mb-2">
          <Route className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-card-foreground">Route Analysis</h3>
        </div>
        <div className="text-sm text-muted-foreground">
          {data.route.from.name} → {data.route.to.name}
        </div>
        <div className={cn("mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium", config.bgColor, config.textColor)}>
          <Shield className="w-4 h-4" />
          {data.overallRiskLevel}
        </div>
      </div>

      {/* Route Score */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-card-foreground">Route Safety Score</span>
          </div>
          <span className={cn("text-xl font-bold", config.textColor)}>
            {data.routeSafetyScore.toFixed(1)}/5
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all duration-500", 
              data.routeSafetyScore >= 3.5 ? "bg-safe" : 
              data.routeSafetyScore >= 2 ? "bg-caution" : "bg-danger"
            )}
            style={{ width: `${(data.routeSafetyScore / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Travel Info */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-card-foreground">{data.estimatedTravelTime}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Car className="w-4 h-4 text-muted-foreground" />
          <span className="text-card-foreground capitalize">Recommended: {data.travelMode}</span>
        </div>
        {data.bestTimeToTravel && (
          <div className="flex items-center gap-3 text-sm">
            <Lightbulb className="w-4 h-4 text-muted-foreground" />
            <span className="text-card-foreground">{data.bestTimeToTravel}</span>
          </div>
        )}
      </div>

      {/* Unsafe Segments */}
      {data.unsafeSegments && data.unsafeSegments.length > 0 && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-caution" />
            <h4 className="text-sm font-medium text-card-foreground">Caution Areas</h4>
          </div>
          <div className="space-y-2">
            {data.unsafeSegments.slice(0, 3).map((segment, index) => (
              <div 
                key={index} 
                className={cn(
                  "p-2 rounded text-xs",
                  segment.risk === "high" ? "bg-danger-light text-danger" :
                  segment.risk === "moderate" ? "bg-caution-light text-caution" :
                  "bg-muted text-muted-foreground"
                )}
              >
                <div className="font-medium">{segment.name}</div>
                <div className="opacity-80">{segment.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Tips */}
      {data.safetyTips && data.safetyTips.length > 0 && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-medium text-card-foreground">Safety Tips</h4>
          </div>
          <ul className="space-y-1.5">
            {data.safetyTips.slice(0, 4).map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-primary mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Emergency Contacts */}
      {data.emergencyContacts && (
        <div className="p-4 bg-muted/50">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4 text-danger" />
            <h4 className="text-xs font-medium text-card-foreground">Emergency</h4>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-card px-2 py-1 rounded">Police: {data.emergencyContacts.police}</span>
            <span className="bg-card px-2 py-1 rounded">Ambulance: {data.emergencyContacts.ambulance}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteInfoPanel;
