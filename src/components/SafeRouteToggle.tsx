 import { ShieldCheck, Route, Sparkles } from "lucide-react";
 import { Switch } from "@/components/ui/switch";
 import { cn } from "@/lib/utils";
 
 interface SafeRouteToggleProps {
   enabled: boolean;
   onToggle: (enabled: boolean) => void;
   disabled?: boolean;
   safestRouteDiff?: {
     timeDiff: string;
     safetyImprovement: number;
   } | null;
 }
 
 const SafeRouteToggle = ({
   enabled,
   onToggle,
   disabled = false,
   safestRouteDiff,
 }: SafeRouteToggleProps) => {
   return (
     <div
       className={cn(
         "bg-card rounded-xl p-4 shadow-soft border transition-all duration-300",
         enabled ? "border-safe/50 bg-safe/5" : "border-border"
       )}
     >
       <div className="flex items-center justify-between gap-3">
         <div className="flex items-center gap-3">
           <div
             className={cn(
               "p-2 rounded-lg transition-colors duration-300",
               enabled ? "bg-safe/20" : "bg-muted"
             )}
           >
             <ShieldCheck
               className={cn(
                 "w-4 h-4 transition-colors duration-300",
                 enabled ? "text-safe" : "text-muted-foreground"
               )}
             />
           </div>
           <div>
             <h3 className="text-sm font-semibold text-card-foreground">
               Prefer Safer Route
             </h3>
             <p className="text-xs text-muted-foreground">
               Prioritize safety over speed
             </p>
           </div>
         </div>
         <Switch
           checked={enabled}
           onCheckedChange={onToggle}
           disabled={disabled}
           aria-label="Toggle prefer safer route"
         />
       </div>
 
       {enabled && safestRouteDiff && (
         <div className="mt-3 p-3 bg-safe/10 rounded-lg border border-safe/20 animate-in fade-in duration-300">
           <div className="flex items-center gap-2 text-xs text-safe">
             <Sparkles className="w-3 h-3" />
             <span className="font-medium">Safer route selected</span>
           </div>
           <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
             <span className="flex items-center gap-1">
               <Route className="w-3 h-3" />
               +{safestRouteDiff.timeDiff} travel time
             </span>
             <span className="flex items-center gap-1 text-safe">
               <ShieldCheck className="w-3 h-3" />
               +{safestRouteDiff.safetyImprovement}% safer
             </span>
           </div>
         </div>
       )}
     </div>
   );
 };
 
 export default SafeRouteToggle;