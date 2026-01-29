import { Info } from "lucide-react";

const MapLegend = () => {
  const legendItems = [
    { color: "bg-safe", label: "Safe", description: "Low risk area" },
    { color: "bg-caution", label: "Caution", description: "Moderate risk" },
    { color: "bg-danger", label: "Danger", description: "High risk area" },
  ];

  return (
    <div className="bg-panel rounded-lg p-4 shadow-soft border border-border relative overflow-hidden">
      {/* Subtle pattern */}
      <div className="absolute inset-0 nav-pattern opacity-20 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">Safety Legend</h3>
        </div>
        
        <div className="space-y-2">
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${item.color} shadow-sm ring-2 ring-white`} />
              <div className="flex-1">
                <span className="text-sm font-medium text-card-foreground">{item.label}</span>
                <span className="text-xs text-muted-foreground ml-2">{item.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapLegend;
