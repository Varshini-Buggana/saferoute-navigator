 import { Volume2, VolumeX } from "lucide-react";
 import { Switch } from "@/components/ui/switch";
 import { cn } from "@/lib/utils";
 
 interface VoiceAlertToggleProps {
   enabled: boolean;
   onToggle: (enabled: boolean) => void;
   disabled?: boolean;
 }
 
 const VoiceAlertToggle = ({ enabled, onToggle, disabled }: VoiceAlertToggleProps) => {
   return (
     <div className="bg-card rounded-xl p-4 shadow-soft border border-border relative overflow-hidden">
       <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
       <div className="relative z-10">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className={cn(
               "p-2 rounded-lg transition-colors",
               enabled ? "bg-primary/20" : "bg-muted"
             )}>
               {enabled ? (
                 <Volume2 className="w-4 h-4 text-primary" />
               ) : (
                 <VolumeX className="w-4 h-4 text-muted-foreground" />
               )}
             </div>
             <div>
               <h3 className="text-sm font-semibold text-card-foreground">Voice Alerts</h3>
               <p className="text-xs text-muted-foreground">
                 {enabled ? "Announcements enabled" : "Announcements disabled"}
               </p>
             </div>
           </div>
           <Switch
             checked={enabled}
             onCheckedChange={onToggle}
             disabled={disabled}
           />
         </div>
       </div>
     </div>
   );
 };
 
 export default VoiceAlertToggle;