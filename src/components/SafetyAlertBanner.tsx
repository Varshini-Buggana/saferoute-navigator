 import { useState, useEffect, useCallback, useRef } from "react";
 import { AlertTriangle, X, Volume2 } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 interface SafetyAlertBannerProps {
   currentZoneStatus: "safe" | "caution" | "danger" | null;
   isVisible: boolean;
   onDismiss?: () => void;
 }
 
 const SafetyAlertBanner = ({ currentZoneStatus, isVisible, onDismiss }: SafetyAlertBannerProps) => {
   const [show, setShow] = useState(false);
   const [dismissed, setDismissed] = useState(false);
   const lastAlertedStatus = useRef<string | null>(null);
 
   // Only trigger alert once per zone entry
   useEffect(() => {
     if (!isVisible || !currentZoneStatus) {
       setShow(false);
       return;
     }
 
     // Only show alert for caution/danger zones, not for safe zones
     if (currentZoneStatus === "safe") {
       setShow(false);
       return;
     }
 
     // Prevent re-alerting for same zone status
     if (lastAlertedStatus.current === currentZoneStatus) {
       return;
     }
 
     lastAlertedStatus.current = currentZoneStatus;
     setDismissed(false);
     setShow(true);
 
     // Auto-dismiss after 8 seconds
     const timer = setTimeout(() => {
       setShow(false);
     }, 8000);
 
     return () => clearTimeout(timer);
   }, [currentZoneStatus, isVisible]);
 
   const handleDismiss = useCallback(() => {
     setDismissed(true);
     setShow(false);
     onDismiss?.();
   }, [onDismiss]);
 
   if (!show || dismissed) return null;
 
   const config = {
     caution: {
       title: "Caution Zone Ahead",
       message: "You are entering an area that requires extra awareness. Stay alert.",
       bgClass: "bg-caution/95",
       textClass: "text-caution-foreground",
       borderClass: "border-caution",
     },
     danger: {
       title: "High-Risk Area Alert",
       message: "You are entering a high-risk area. Stay alert and exercise caution.",
       bgClass: "bg-danger/95",
       textClass: "text-danger-foreground",
       borderClass: "border-danger",
     },
   }[currentZoneStatus as "caution" | "danger"];
 
   if (!config) return null;
 
   return (
     <div
       className={cn(
         "fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-lg",
         "animate-in slide-in-from-top-5 fade-in duration-300"
       )}
     >
       <div
         className={cn(
           "flex items-start gap-3 p-4 rounded-xl shadow-xl border-2 backdrop-blur-sm",
           config.bgClass,
           config.borderClass
         )}
       >
         <div className="p-2 rounded-full bg-white/20">
           <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
         </div>
         <div className="flex-1">
           <div className="flex items-center gap-2">
             <h4 className="font-bold text-white">{config.title}</h4>
             <Volume2 className="w-4 h-4 text-white/70" />
           </div>
           <p className="text-sm text-white/90 mt-1">{config.message}</p>
         </div>
         <button
           onClick={handleDismiss}
           className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
           aria-label="Dismiss alert"
         >
           <X className="w-4 h-4 text-white" />
         </button>
       </div>
     </div>
   );
 };
 
 export default SafetyAlertBanner;