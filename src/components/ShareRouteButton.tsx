 import { Share2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";
 
 interface ShareRouteButtonProps {
   onClick: () => void;
   isSharing: boolean;
   disabled?: boolean;
 }
 
 const ShareRouteButton = ({ onClick, isSharing, disabled }: ShareRouteButtonProps) => {
   return (
     <Button
       onClick={onClick}
       variant={isSharing ? "default" : "outline"}
       size="sm"
       disabled={disabled}
       className={cn(
         "w-full gap-2 transition-all duration-300",
         isSharing && "bg-primary shadow-glow"
       )}
     >
       <Share2 className={cn("w-4 h-4", isSharing && "animate-pulse")} />
       {isSharing ? "Sharing Live..." : "Share My Route"}
     </Button>
   );
 };
 
 export default ShareRouteButton;