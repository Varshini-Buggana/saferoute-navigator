import { Flame, FlameKindling } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface HeatmapToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  isLoading?: boolean;
}

const HeatmapToggle = ({ enabled, onToggle, isLoading = false }: HeatmapToggleProps) => {
  return (
    <div className="bg-card rounded-lg p-4 shadow-soft border border-border transition-all duration-200 hover:shadow-elevated">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg transition-colors duration-200 ${
            enabled ? "bg-danger/10 text-danger" : "bg-muted text-muted-foreground"
          }`}>
            {enabled ? (
              <Flame className="w-5 h-5 animate-pulse" />
            ) : (
              <FlameKindling className="w-5 h-5" />
            )}
          </div>
          <div>
            <Label htmlFor="heatmap-toggle" className="text-sm font-medium text-card-foreground cursor-pointer">
              Safety Heatmap
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {enabled ? "Showing risk intensity" : "Toggle to view risk zones"}
            </p>
          </div>
        </div>
        
        <Switch
          id="heatmap-toggle"
          checked={enabled}
          onCheckedChange={onToggle}
          disabled={isLoading}
          className="data-[state=checked]:bg-danger"
        />
      </div>
      
      {enabled && (
        <div className="mt-3 pt-3 border-t border-border animate-fade-in">
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-safe" />
              <span className="text-muted-foreground">Safe</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-caution" />
              <span className="text-muted-foreground">Caution</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-danger" />
              <span className="text-muted-foreground">High Risk</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatmapToggle;
