 import { useState } from "react";
 import { 
   HelpCircle, 
   X, 
   Lightbulb, 
   MapPin, 
   Clock, 
   Shield,
   ChevronRight,
   Sparkles
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";
 import { RouteAlternative } from "./RouteAlternativesPanel";
 
 interface ExplainableSafetyPanelProps {
   selectedRoute: RouteAlternative | null;
   isOpen: boolean;
   onClose: () => void;
   onOpen: () => void;
   allRoutes: RouteAlternative[];
 }
 
 const ExplainableSafetyPanel = ({
   selectedRoute,
   isOpen,
   onClose,
   onOpen,
   allRoutes,
 }: ExplainableSafetyPanelProps) => {
   if (!selectedRoute) return null;
 
   // Generate AI-like explanation based on route data
   const generateExplanation = () => {
     const reasons: string[] = [];
     const { safetyScore, riskLevel, duration, distance } = selectedRoute;
 
     // Safety-based reasons
     if (safetyScore >= 80) {
       reasons.push("This route passes through well-lit, frequently patrolled areas with low reported incidents.");
       reasons.push("The path follows main roads with good infrastructure and emergency access points.");
     } else if (safetyScore >= 60) {
       reasons.push("This route has moderate safety ratings with some areas requiring extra attention.");
       reasons.push("Consider traveling during daylight hours when possible.");
     } else {
       reasons.push("This route passes through areas with elevated safety concerns based on historical data.");
       reasons.push("If choosing this route, stay alert and consider traveling with others.");
     }
 
     // Comparative analysis
     if (allRoutes.length > 1) {
       const safestRoute = allRoutes.reduce((a, b) => 
         a.safetyScore > b.safetyScore ? a : b
       );
       const fastestRoute = allRoutes[0];
 
       if (selectedRoute.id === safestRoute.id) {
         reasons.push("✓ This is the safest available route.");
       } else {
         const diff = safestRoute.safetyScore - selectedRoute.safetyScore;
         reasons.push(`Alternative route available with ${diff}% higher safety score.`);
       }
 
       if (selectedRoute.id === fastestRoute.id) {
         reasons.push("✓ This is also the fastest route.");
       }
     }
 
     return reasons;
   };
 
   const explanations = generateExplanation();
 
   // Just the button when closed
   if (!isOpen) {
     return (
       <Button
         variant="outline"
         size="sm"
         onClick={onOpen}
         className="w-full mt-2 text-xs gap-2 border-primary/30 hover:bg-primary/5"
       >
         <HelpCircle className="w-3 h-3" />
         Why this route?
         <ChevronRight className="w-3 h-3 ml-auto" />
       </Button>
     );
   }
 
   return (
     <div className="bg-card rounded-xl shadow-elevated border border-primary/20 overflow-hidden animate-in slide-in-from-bottom-3 duration-300">
       {/* Header */}
       <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b border-primary/10">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="p-1.5 rounded-lg bg-primary/20">
               <Sparkles className="w-4 h-4 text-primary" />
             </div>
             <h3 className="font-semibold text-card-foreground">Why This Route?</h3>
           </div>
           <button
             onClick={onClose}
             className="p-1.5 rounded-full hover:bg-muted transition-colors"
             aria-label="Close explanation"
           >
             <X className="w-4 h-4 text-muted-foreground" />
           </button>
         </div>
       </div>
 
       {/* Content */}
       <div className="p-4 space-y-4">
         {/* Route summary */}
         <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
           <div className="flex items-center gap-2 text-xs">
             <MapPin className="w-3 h-3 text-muted-foreground" />
             <span>{selectedRoute.distance}</span>
           </div>
           <div className="flex items-center gap-2 text-xs">
             <Clock className="w-3 h-3 text-muted-foreground" />
             <span>{selectedRoute.duration}</span>
           </div>
           <div
             className={cn(
               "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
               selectedRoute.riskLevel === "safe" && "bg-safe/10 text-safe",
               selectedRoute.riskLevel === "caution" && "bg-caution/10 text-caution",
               selectedRoute.riskLevel === "danger" && "bg-danger/10 text-danger"
             )}
           >
             <Shield className="w-3 h-3" />
             {selectedRoute.safetyScore}%
           </div>
         </div>
 
         {/* AI Explanations */}
         <div className="space-y-2">
           <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
             <Lightbulb className="w-3 h-3" />
             AI Safety Analysis
           </div>
           <ul className="space-y-2">
             {explanations.map((reason, index) => (
               <li
                 key={index}
                 className="flex items-start gap-2 text-xs text-muted-foreground p-2 bg-muted/30 rounded-lg"
               >
                 <span
                   className={cn(
                     "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                     reason.startsWith("✓") ? "bg-safe" : "bg-primary"
                   )}
                 />
                 <span className="leading-relaxed">{reason}</span>
               </li>
             ))}
           </ul>
         </div>
 
         {/* Disclaimer */}
         <p className="text-[10px] text-center text-muted-foreground pt-2 border-t border-border">
           Analysis based on AI-powered safety data • Always exercise personal judgment
         </p>
       </div>
     </div>
   );
 };
 
 export default ExplainableSafetyPanel;