import { Shield, AlertTriangle, CheckCircle } from "lucide-react";

const MapLegend = () => {
  const items = [
    { 
      label: "Safe", 
      colorClass: "bg-safe", 
      icon: CheckCircle,
      textClass: "text-safe",
      description: "Low risk area"
    },
    { 
      label: "Caution", 
      colorClass: "bg-caution", 
      icon: AlertTriangle,
      textClass: "text-caution",
      description: "Stay alert"
    },
    { 
      label: "High Risk", 
      colorClass: "bg-danger", 
      icon: Shield,
      textClass: "text-danger",
      description: "Extra care needed"
    },
  ];

  return (
    <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
      <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        Safety Legend
      </h3>
      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div 
              key={item.label} 
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className={`w-3.5 h-3.5 rounded-full ${item.colorClass} shadow-sm`} />
              <div className="flex-1">
                <span className={`text-sm font-medium ${item.textClass}`}>{item.label}</span>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Icon className={`w-4 h-4 ${item.textClass} opacity-60`} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MapLegend;
