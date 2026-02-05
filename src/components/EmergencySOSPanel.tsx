 import { useState } from "react";
 import { 
   Phone, 
   AlertCircle, 
   X, 
   MapPin, 
   Shield, 
   Ambulance, 
   Building2,
   PhoneCall,
   Users
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";
 
 interface EmergencyContact {
   id: string;
   name: string;
   number: string;
   icon: React.ComponentType<{ className?: string }>;
   colorClass: string;
 }
 
 interface NearbyPlace {
   id: string;
   name: string;
   type: "police" | "hospital";
   distance: string;
   address: string;
 }
 
 interface EmergencySOSPanelProps {
   isOpen: boolean;
   onClose: () => void;
   currentLocation?: { lat: number; lng: number } | null;
 }
 
 // Demo emergency contacts
 const emergencyContacts: EmergencyContact[] = [
   {
     id: "police",
     name: "Police Emergency",
     number: "100",
     icon: Shield,
     colorClass: "bg-primary text-primary-foreground",
   },
   {
     id: "ambulance",
     name: "Ambulance",
     number: "102",
     icon: Ambulance,
     colorClass: "bg-danger text-danger-foreground",
   },
   {
     id: "women",
     name: "Women Helpline",
     number: "1091",
     icon: Users,
     colorClass: "bg-safe text-safe-foreground",
   },
 ];
 
 // Demo nearby places (would use Google Places API in production)
 const demoNearbyPlaces: NearbyPlace[] = [
   {
     id: "1",
     name: "Central Police Station",
     type: "police",
     distance: "0.8 km",
     address: "Main Road, City Center",
   },
   {
     id: "2",
     name: "City General Hospital",
     type: "hospital",
     distance: "1.2 km",
     address: "Hospital Road, Medical District",
   },
   {
     id: "3",
     name: "Traffic Police Post",
     type: "police",
     distance: "1.5 km",
     address: "Highway Junction",
   },
   {
     id: "4",
     name: "Emergency Care Center",
     type: "hospital",
     distance: "2.1 km",
     address: "Ring Road, East Side",
   },
 ];
 
 const EmergencySOSPanel = ({ isOpen, onClose, currentLocation }: EmergencySOSPanelProps) => {
   const [selectedTab, setSelectedTab] = useState<"contacts" | "nearby">("contacts");
 
   if (!isOpen) return null;
 
   const handleCall = (number: string, name: string) => {
     // Demo mode - just show a toast/alert
     alert(`Demo Mode: This would call ${name} at ${number}\n\nIn production, this would initiate a real call.`);
   };
 
   return (
     <>
       {/* Backdrop */}
       <div
         className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
         onClick={onClose}
       />
 
       {/* Panel */}
       <div className="fixed inset-x-4 bottom-4 md:inset-auto md:right-4 md:bottom-4 md:w-96 z-50 animate-in slide-in-from-bottom-5 duration-300">
         <div className="bg-card rounded-2xl shadow-2xl border border-danger/30 overflow-hidden">
           {/* Header */}
           <div className="bg-danger p-4 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-full bg-white/20 animate-pulse">
                 <AlertCircle className="w-5 h-5 text-white" />
               </div>
               <div>
                 <h2 className="font-bold text-white">Emergency SOS</h2>
                 <p className="text-xs text-white/80">Demo Mode</p>
               </div>
             </div>
             <button
               onClick={onClose}
               className="p-2 rounded-full hover:bg-white/20 transition-colors"
               aria-label="Close emergency panel"
             >
               <X className="w-5 h-5 text-white" />
             </button>
           </div>
 
           {/* Tabs */}
           <div className="flex border-b border-border">
             <button
               onClick={() => setSelectedTab("contacts")}
               className={cn(
                 "flex-1 py-3 text-sm font-medium transition-colors",
                 selectedTab === "contacts"
                   ? "text-danger border-b-2 border-danger bg-danger/5"
                   : "text-muted-foreground hover:text-foreground"
               )}
             >
               <Phone className="w-4 h-4 inline-block mr-2" />
               Emergency Contacts
             </button>
             <button
               onClick={() => setSelectedTab("nearby")}
               className={cn(
                 "flex-1 py-3 text-sm font-medium transition-colors",
                 selectedTab === "nearby"
                   ? "text-danger border-b-2 border-danger bg-danger/5"
                   : "text-muted-foreground hover:text-foreground"
               )}
             >
               <MapPin className="w-4 h-4 inline-block mr-2" />
               Nearby Help
             </button>
           </div>
 
           {/* Content */}
           <div className="p-4 max-h-80 overflow-y-auto">
             {selectedTab === "contacts" ? (
               <div className="space-y-3">
                 {emergencyContacts.map((contact) => {
                   const Icon = contact.icon;
                   return (
                     <button
                       key={contact.id}
                       onClick={() => handleCall(contact.number, contact.name)}
                       className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-danger/50 hover:bg-danger/5 transition-all group"
                     >
                       <div className={cn("p-3 rounded-full", contact.colorClass)}>
                         <Icon className="w-5 h-5" />
                       </div>
                       <div className="flex-1 text-left">
                         <h3 className="font-semibold text-card-foreground group-hover:text-danger transition-colors">
                           {contact.name}
                         </h3>
                         <p className="text-lg font-bold text-primary">{contact.number}</p>
                       </div>
                       <PhoneCall className="w-5 h-5 text-muted-foreground group-hover:text-danger transition-colors" />
                     </button>
                   );
                 })}
               </div>
             ) : (
               <div className="space-y-3">
                 {demoNearbyPlaces.map((place) => (
                   <div
                     key={place.id}
                     className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all"
                   >
                     <div
                       className={cn(
                         "p-2 rounded-lg",
                         place.type === "police" ? "bg-primary/10" : "bg-danger/10"
                       )}
                     >
                       {place.type === "police" ? (
                         <Shield className="w-4 h-4 text-primary" />
                       ) : (
                         <Building2 className="w-4 h-4 text-danger" />
                       )}
                     </div>
                     <div className="flex-1 min-w-0">
                       <h3 className="font-medium text-sm text-card-foreground truncate">
                         {place.name}
                       </h3>
                       <p className="text-xs text-muted-foreground truncate">{place.address}</p>
                       <span className="inline-block mt-1 px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">
                         {place.distance}
                       </span>
                     </div>
                     <Button
                       variant="outline"
                       size="sm"
                       className="shrink-0"
                       onClick={() => alert(`Demo: Opening directions to ${place.name}`)}
                     >
                       <MapPin className="w-3 h-3 mr-1" />
                       Go
                     </Button>
                   </div>
                 ))}
                 {currentLocation && (
                   <p className="text-xs text-center text-muted-foreground mt-4">
                     Based on your current route position
                   </p>
                 )}
               </div>
             )}
           </div>
 
           {/* Footer */}
           <div className="p-3 bg-muted/50 border-t border-border">
             <p className="text-[10px] text-center text-muted-foreground">
               🔒 Demo mode - No actual calls will be made
             </p>
           </div>
         </div>
       </div>
     </>
   );
 };
 
 export default EmergencySOSPanel;