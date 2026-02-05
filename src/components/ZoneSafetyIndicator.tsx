 import { Shield, ShieldCheck, ShieldAlert } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 interface ZoneSafetyIndicatorProps {
   status: "safe" | "caution" | "danger";
   isVisible: boolean;
 }
 
 const ZoneSafetyIndicator = ({ status, isVisible }: ZoneSafetyIndicatorProps) => {
   if (!isVisible) return null;
 
   const config = {
     safe: {
       icon: ShieldCheck,
       label: "Safe Zone",
       bgClass: "bg-safe",
       textClass: "text-safe-foreground",
       ringClass: "ring-safe/30",
       pulseClass: "bg-safe",
     },
     caution: {
       icon: ShieldAlert,
       label: "Caution Zone",
       bgClass: "bg-caution",
       textClass: "text-caution-foreground",
       ringClass: "ring-caution/30",
       pulseClass: "bg-caution",
     },
     danger: {
       icon: Shield,
       label: "High Risk",
       bgClass: "bg-danger",
       textClass: "text-danger-foreground",
       ringClass: "ring-danger/30",
       pulseClass: "bg-danger",
     },
   }[status];
 
   const Icon = config.icon;
 
   return (
     <div className="fixed bottom-6 left-6 z-40 animate-in slide-in-from-left-5 fade-in duration-300">
       <div
         className={cn(
           "flex items-center gap-2 px-4 py-3 rounded-full shadow-xl ring-4",
           config.bgClass,
           config.ringClass
         )}
       >
         {/* Pulsing indicator */}
         <div className="relative">
           <div
             className={cn(
               "absolute inset-0 rounded-full animate-ping opacity-75",
               config.pulseClass
             )}
           />
           <Icon className={cn("w-5 h-5 relative z-10", config.textClass)} />
         </div>
         <span className={cn("font-semibold text-sm", config.textClass)}>
           {config.label}
         </span>
       </div>
     </div>
   );
 };
 
 export default ZoneSafetyIndicator;