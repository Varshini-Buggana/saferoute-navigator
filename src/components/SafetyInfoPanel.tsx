import { Shield, AlertTriangle, CheckCircle, Clock, MapPin, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SafetyData {
  status: "safe" | "caution" | "danger";
  score: number;
  location: string;
  reasons: string[];
  lastUpdated: string;
}

interface SafetyInfoPanelProps {
  data: SafetyData | null;
  isVisible: boolean;
}

const SafetyInfoPanel = ({ data, isVisible }: SafetyInfoPanelProps) => {
  if (!data || !isVisible) return null;

  const statusConfig = {
    safe: {
      label: "Safe Area",
      icon: CheckCircle,
      colorClass: "safe",
      bgGradient: "from-safe/10 to-safe/5",
    },
    caution: {
      label: "Exercise Caution",
      icon: AlertTriangle,
      colorClass: "caution",
      bgGradient: "from-caution/10 to-caution/5",
    },
    danger: {
      label: "High Risk Area",
      icon: XCircle,
      colorClass: "danger",
      bgGradient: "from-danger/10 to-danger/5",
    },
  };

  const config = statusConfig[data.status];
  const Icon = config.icon;

  return (
    <div className="bg-card rounded-xl shadow-elevated border border-border overflow-hidden animate-slide-in-right">
      {/* Header */}
      <div className={cn("p-4 bg-gradient-to-r", config.bgGradient)}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl",
            config.colorClass === "safe" && "bg-safe/20",
            config.colorClass === "caution" && "bg-caution/20",
            config.colorClass === "danger" && "bg-danger/20"
          )}>
            <Icon className={cn(
              "w-5 h-5",
              config.colorClass === "safe" && "text-safe",
              config.colorClass === "caution" && "text-caution",
              config.colorClass === "danger" && "text-danger"
            )} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-card-foreground">{config.label}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {data.location}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Safety Score */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Safety Score</span>
            <span className={cn(
              "text-lg font-bold",
              config.colorClass === "safe" && "text-safe",
              config.colorClass === "caution" && "text-caution",
              config.colorClass === "danger" && "text-danger"
            )}>
              {data.score}%
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                config.colorClass === "safe" && "bg-safe",
                config.colorClass === "caution" && "bg-caution",
                config.colorClass === "danger" && "bg-danger"
              )}
              style={{ width: `${data.score}%` }}
            />
          </div>
        </div>

        {/* Reasons */}
        {data.reasons.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-card-foreground flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              Key Insights
            </h4>
            <ul className="space-y-2">
              {data.reasons.map((reason, index) => (
                <li 
                  key={index} 
                  className="text-xs text-muted-foreground flex items-start gap-2 p-2 bg-muted/30 rounded-lg"
                >
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                    config.colorClass === "safe" && "bg-safe",
                    config.colorClass === "caution" && "bg-caution",
                    config.colorClass === "danger" && "bg-danger"
                  )} />
                  <span className="leading-relaxed">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Last Updated */}
        <div className="pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>Updated: {data.lastUpdated}</span>
        </div>
      </div>
    </div>
  );
};

export default SafetyInfoPanel;
