import { Car, PersonStanding, Bus, Bike } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type TransportMode = "driving" | "walking" | "transit" | "cycling";

interface TransportModeSelectorProps {
  value: TransportMode;
  onChange: (mode: TransportMode) => void;
  disabled?: boolean;
}

const modes = [
  { value: "driving" as TransportMode, icon: Car, label: "Drive" },
  { value: "walking" as TransportMode, icon: PersonStanding, label: "Walk" },
  { value: "transit" as TransportMode, icon: Bus, label: "Transit" },
  { value: "cycling" as TransportMode, icon: Bike, label: "Cycle" },
];

const TransportModeSelector = ({ value, onChange, disabled }: TransportModeSelectorProps) => {
  return (
    <div className="bg-card rounded-lg p-3 shadow-soft border border-border">
      <label className="text-xs font-medium text-muted-foreground mb-2 block">
        Travel Mode
      </label>
      <ToggleGroup 
        type="single" 
        value={value} 
        onValueChange={(v) => v && onChange(v as TransportMode)}
        className="justify-start gap-1"
        disabled={disabled}
      >
        {modes.map(({ value: modeValue, icon: Icon, label }) => (
          <ToggleGroupItem
            key={modeValue}
            value={modeValue}
            aria-label={label}
            className="flex-1 flex flex-col items-center gap-1 px-2 py-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <Icon className="w-4 h-4" />
            <span className="text-[10px] font-medium">{label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default TransportModeSelector;
