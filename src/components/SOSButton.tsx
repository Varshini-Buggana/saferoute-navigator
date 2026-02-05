 import { AlertCircle } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 interface SOSButtonProps {
   onClick: () => void;
   isVisible: boolean;
 }
 
 const SOSButton = ({ onClick, isVisible }: SOSButtonProps) => {
   if (!isVisible) return null;
 
   return (
     <button
       onClick={onClick}
       className={cn(
         "fixed bottom-6 right-6 z-40",
         "flex items-center gap-2 px-5 py-3",
         "bg-danger text-danger-foreground rounded-full",
         "shadow-xl hover:shadow-2xl",
         "ring-4 ring-danger/30",
         "transition-all duration-300",
         "hover:scale-105 active:scale-95",
         "animate-in slide-in-from-right-5 fade-in duration-300"
       )}
       aria-label="Emergency SOS"
     >
       <AlertCircle className="w-5 h-5 animate-pulse" />
       <span className="font-bold text-sm">SOS</span>
     </button>
   );
 };
 
 export default SOSButton;