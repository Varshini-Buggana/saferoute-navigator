import { RouteSafetyResponse } from "@/lib/safetyApi";
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  Phone, 
  Route,
  MapPin,
  Lightbulb,
  ChevronRight,
  Sparkles,
  Car
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RouteInfoPanelProps {
  data: RouteSafetyResponse;
}

const RouteInfoPanel = ({ data }: RouteInfoPanelProps) => {
  const riskColor = 
    data.overallRiskLevel === "Low Risk" 
      ? "safe" 
      : data.overallRiskLevel === "Moderate Risk" 
        ? "caution" 
        : "danger";

  const riskBgClass = cn(
    "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-transform hover:scale-105",
    {
      "bg-safe/20 text-safe border border-safe/30": riskColor === "safe",
      "bg-caution/20 text-caution border border-caution/30": riskColor === "caution",
      "bg-danger/20 text-danger border border-danger/30": riskColor === "danger",
    }
  );

  const scorePercentage = (data.routeSafetyScore / 5) * 100;

  return (
    <div className="bg-card rounded-xl shadow-elevated border border-border overflow-hidden animate-slide-in-right">
      {/* Header with gradient */}
      <div className={cn(
        "p-4 relative overflow-hidden",
        riskColor === "safe" && "bg-gradient-to-r from-safe/10 to-safe/5",
        riskColor === "caution" && "bg-gradient-to-r from-caution/10 to-caution/5",
        riskColor === "danger" && "bg-gradient-to-r from-danger/10 to-danger/5"
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-xl",
              riskColor === "safe" && "bg-safe/20",
              riskColor === "caution" && "bg-caution/20",
              riskColor === "danger" && "bg-danger/20"
            )}>
              <Route className={cn(
                "w-5 h-5",
                riskColor === "safe" && "text-safe",
                riskColor === "caution" && "text-caution",
                riskColor === "danger" && "text-danger"
              )} />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground text-sm">Route Analysis</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                AI-Powered
              </p>
            </div>
          </div>
          <div className={riskBgClass}>
            <Shield className="w-3.5 h-3.5" />
            {data.overallRiskLevel}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Route Summary */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-muted-foreground truncate">
            {data.route.from.name}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-card-foreground font-medium truncate">
            {data.route.to.name}
          </span>
        </div>

        {/* Safety Score Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Safety Score</span>
            <span className={cn(
              "text-sm font-bold",
              riskColor === "safe" && "text-safe",
              riskColor === "caution" && "text-caution",
              riskColor === "danger" && "text-danger"
            )}>
              {data.routeSafetyScore.toFixed(1)} / 5.0
            </span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                riskColor === "safe" && "bg-safe",
                riskColor === "caution" && "bg-caution",
                riskColor === "danger" && "bg-danger"
              )}
              style={{ width: `${scorePercentage}%` }}
            />
          </div>
        </div>

        {/* Travel Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center hover:bg-muted/70 transition-colors">
            <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Est. Time</p>
            <p className="text-sm font-semibold text-card-foreground">{data.estimatedTravelTime}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center hover:bg-muted/70 transition-colors">
            <Car className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Mode</p>
            <p className="text-sm font-semibold text-card-foreground capitalize">{data.travelMode}</p>
          </div>
        </div>

        {data.bestTimeToTravel && (
          <div className="bg-primary/5 rounded-lg p-3 flex items-center gap-3 border border-primary/10">
            <Lightbulb className="w-4 h-4 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Best Time to Travel</p>
              <p className="text-sm font-medium text-card-foreground">{data.bestTimeToTravel}</p>
            </div>
          </div>
        )}

        {/* Unsafe Segments */}
        {data.unsafeSegments && data.unsafeSegments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-card-foreground flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-caution" />
              Areas of Concern ({data.unsafeSegments.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {data.unsafeSegments.map((segment, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "p-2.5 rounded-lg text-xs border-l-2 bg-muted/30",
                    segment.risk === "low" && "border-safe",
                    segment.risk === "moderate" && "border-caution",
                    segment.risk === "high" && "border-danger"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-card-foreground">{segment.name}</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        segment.risk === "low" && "border-safe text-safe",
                        segment.risk === "moderate" && "border-caution text-caution",
                        segment.risk === "high" && "border-danger text-danger"
                      )}
                    >
                      {segment.risk}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{segment.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safety Tips */}
        {data.safetyTips && data.safetyTips.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-card-foreground flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              Safety Tips
            </h4>
            <ul className="space-y-1.5">
              {data.safetyTips.slice(0, 3).map((tip, index) => (
                <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Emergency Contacts */}
        <div className="pt-3 border-t border-border">
          <h4 className="text-xs font-semibold text-card-foreground mb-2 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-danger" />
            Emergency Contacts
          </h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs gap-1 hover:bg-muted transition-colors cursor-default">
              🚔 {data.emergencyContacts.police}
            </Badge>
            <Badge variant="outline" className="text-xs gap-1 hover:bg-muted transition-colors cursor-default">
              🚑 {data.emergencyContacts.ambulance}
            </Badge>
            <Badge variant="outline" className="text-xs gap-1 hover:bg-muted transition-colors cursor-default">
              🚗 {data.emergencyContacts.roadAssistance}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteInfoPanel;
