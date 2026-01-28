import { Shield, AlertTriangle, CheckCircle, XCircle, TrendingUp, Clock, MapPin } from "lucide-react";
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
      icon: CheckCircle,
      label: "Safe Area",
      bgColor: "bg-safe-light",
      textColor: "text-safe",
      borderColor: "border-safe/30",
      badgeBg: "bg-safe",
    },
    caution: {
      icon: AlertTriangle,
      label: "Caution Area",
      bgColor: "bg-caution-light",
      textColor: "text-caution",
      borderColor: "border-caution/30",
      badgeBg: "bg-caution",
    },
    danger: {
      icon: XCircle,
      label: "Danger Zone",
      bgColor: "bg-danger-light",
      textColor: "text-danger",
      borderColor: "border-danger/30",
      badgeBg: "bg-danger",
    },
  };

  const config = statusConfig[data.status];
  const StatusIcon = config.icon;

  return (
    <div className="bg-card rounded-lg shadow-soft border border-border overflow-hidden animate-slide-in-right">
      {/* Status Header */}
      <div className={cn("p-4 border-b", config.bgColor, config.borderColor)}>
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", config.badgeBg)}>
            <StatusIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className={cn("font-semibold", config.textColor)}>{config.label}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{data.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Score */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-card-foreground">Safety Score</span>
          </div>
          <span className={cn("text-2xl font-bold", config.textColor)}>{data.score}/100</span>
        </div>
        
        {/* Score Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all duration-500", config.badgeBg)}
            style={{ width: `${data.score}%` }}
          />
        </div>
      </div>

      {/* Reasons */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-medium text-card-foreground">Safety Factors</h4>
        </div>
        
        <ul className="space-y-2">
          {data.reasons.map((reason, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", config.badgeBg)} />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-muted/50 border-t border-border">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Last updated: {data.lastUpdated}</span>
        </div>
      </div>
    </div>
  );
};

export default SafetyInfoPanel;
