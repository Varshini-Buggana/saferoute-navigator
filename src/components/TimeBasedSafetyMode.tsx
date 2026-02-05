 import { Sun, Moon } from "lucide-react";
 import { Switch } from "@/components/ui/switch";
 import { cn } from "@/lib/utils";
 
 export type SafetyTimeMode = "day" | "night";
 
 interface TimeBasedSafetyModeProps {
   mode: SafetyTimeMode;
   onModeChange: (mode: SafetyTimeMode) => void;
   disabled?: boolean;
 }
 
 const TimeBasedSafetyMode = ({ mode, onModeChange, disabled = false }: TimeBasedSafetyModeProps) => {
   const isNight = mode === "night";
 
   return (
     <div className="bg-card rounded-xl p-4 shadow-soft border border-border relative overflow-hidden">
       <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
       <div className="relative z-10">
         <div className="flex items-center justify-between gap-3">
           <div className="flex items-center gap-3">
             <div
               className={cn(
                 "p-2 rounded-lg transition-colors duration-300",
                 isNight ? "bg-primary/20" : "bg-caution/20"
               )}
             >
               {isNight ? (
                 <Moon className="w-4 h-4 text-primary" />
               ) : (
                 <Sun className="w-4 h-4 text-caution" />
               )}
             </div>
             <div>
               <h3 className="text-sm font-semibold text-card-foreground">
                 {isNight ? "Night Mode" : "Day Mode"}
               </h3>
               <p className="text-xs text-muted-foreground">
                 {isNight ? "Enhanced safety sensitivity" : "Standard safety thresholds"}
               </p>
             </div>
           </div>
           <Switch
             checked={isNight}
             onCheckedChange={(checked) => onModeChange(checked ? "night" : "day")}
             disabled={disabled}
             aria-label="Toggle day/night safety mode"
           />
         </div>
         {isNight && (
           <div className="mt-3 p-2 bg-primary/10 rounded-lg border border-primary/20">
             <p className="text-xs text-primary">
               ⚡ Alerts trigger earlier for enhanced nighttime safety
             </p>
           </div>
         )}
       </div>
     </div>
   );
 };
 
 export default TimeBasedSafetyMode;