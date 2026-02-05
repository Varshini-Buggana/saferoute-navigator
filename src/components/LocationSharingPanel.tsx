 import { useState } from "react";
 import { X, Share2, UserPlus, Copy, Check, MapPin, Shield, AlertTriangle } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { cn } from "@/lib/utils";
 import { toast } from "sonner";
 
 interface TrustedContact {
   id: string;
   name: string;
   contact: string;
 }
 
 interface LocationSharingPanelProps {
   isOpen: boolean;
   onClose: () => void;
   isSharing: boolean;
   onToggleSharing: (enabled: boolean) => void;
   routeName?: string;
   safetyStatus?: "safe" | "caution" | "danger";
 }
 
 const LocationSharingPanel = ({
   isOpen,
   onClose,
   isSharing,
   onToggleSharing,
   routeName = "Current Route",
   safetyStatus = "safe",
 }: LocationSharingPanelProps) => {
   const [contacts, setContacts] = useState<TrustedContact[]>([]);
   const [newName, setNewName] = useState("");
   const [newContact, setNewContact] = useState("");
   const [copied, setCopied] = useState(false);
 
   const demoShareLink = "https://safetravel.demo/share/abc123xyz";
 
   const handleAddContact = () => {
     if (!newName.trim() || !newContact.trim()) {
       toast.error("Please enter both name and contact");
       return;
     }
     if (contacts.length >= 3) {
       toast.error("Maximum 3 trusted contacts allowed");
       return;
     }
     
     const contact: TrustedContact = {
       id: Date.now().toString(),
       name: newName.trim(),
       contact: newContact.trim(),
     };
     setContacts(prev => [...prev, contact]);
     setNewName("");
     setNewContact("");
     toast.success(`${contact.name} added as trusted contact`);
   };
 
   const handleRemoveContact = (id: string) => {
     setContacts(prev => prev.filter(c => c.id !== id));
   };
 
   const handleCopyLink = () => {
     navigator.clipboard.writeText(demoShareLink);
     setCopied(true);
     toast.success("Link copied to clipboard");
     setTimeout(() => setCopied(false), 2000);
   };
 
   const handleToggleSharing = () => {
     onToggleSharing(!isSharing);
     if (!isSharing) {
       toast.success("Live location sharing enabled", {
         description: "Demo mode - no real tracking",
       });
     } else {
       toast.info("Location sharing stopped");
     }
   };
 
   const statusConfig = {
     safe: { icon: Shield, color: "text-safe", bg: "bg-safe/10" },
     caution: { icon: AlertTriangle, color: "text-caution", bg: "bg-caution/10" },
     danger: { icon: AlertTriangle, color: "text-danger", bg: "bg-danger/10" },
   }[safetyStatus];
 
   const StatusIcon = statusConfig.icon;
 
   if (!isOpen) return null;
 
   return (
     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
       <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
         {/* Header */}
         <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
           <div className="flex items-center gap-3">
             <div className="p-2 rounded-full bg-primary/20">
               <Share2 className="w-5 h-5 text-primary" />
             </div>
             <div>
               <h2 className="font-bold text-card-foreground">Share My Route</h2>
               <p className="text-xs text-muted-foreground">Share with trusted contacts</p>
             </div>
           </div>
           <button
             onClick={onClose}
             className="p-2 rounded-full hover:bg-muted transition-colors"
           >
             <X className="w-5 h-5 text-muted-foreground" />
           </button>
         </div>
 
         <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
           {/* Demo Notice */}
           <div className="p-3 bg-caution/10 border border-caution/20 rounded-lg">
             <p className="text-xs text-caution flex items-center gap-2">
               <AlertTriangle className="w-4 h-4 flex-shrink-0" />
               This is a demo feature. No real messages are sent.
             </p>
           </div>
 
           {/* Route Info */}
           <div className="p-4 bg-muted/50 rounded-xl space-y-3">
             <div className="flex items-center gap-2">
               <MapPin className="w-4 h-4 text-primary" />
               <span className="text-sm font-medium text-card-foreground">{routeName}</span>
             </div>
             <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full w-fit", statusConfig.bg)}>
               <StatusIcon className={cn("w-4 h-4", statusConfig.color)} />
               <span className={cn("text-xs font-medium capitalize", statusConfig.color)}>
                 {safetyStatus} Route
               </span>
             </div>
           </div>
 
           {/* Sharing Toggle */}
           <div className="space-y-2">
             <Button
               onClick={handleToggleSharing}
               variant={isSharing ? "default" : "outline"}
               className={cn(
                 "w-full gap-2 h-12 transition-all",
                 isSharing && "bg-primary shadow-glow animate-pulse-soft"
               )}
             >
               <Share2 className="w-5 h-5" />
               {isSharing ? "Stop Sharing" : "Start Live Sharing"}
             </Button>
             
             {isSharing && (
               <div className="p-3 bg-safe/10 border border-safe/20 rounded-lg animate-in fade-in">
                 <p className="text-xs text-safe flex items-center gap-2">
                   <MapPin className="w-4 h-4 animate-pulse" />
                   Live location shared with trusted contacts
                 </p>
               </div>
             )}
           </div>
 
           {/* Shareable Link */}
           <div className="space-y-2">
             <label className="text-sm font-medium text-card-foreground">Shareable Link</label>
             <div className="flex gap-2">
               <Input
                 value={demoShareLink}
                 readOnly
                 className="text-xs bg-muted"
               />
               <Button
                 onClick={handleCopyLink}
                 variant="outline"
                 size="icon"
                 className="flex-shrink-0"
               >
                 {copied ? <Check className="w-4 h-4 text-safe" /> : <Copy className="w-4 h-4" />}
               </Button>
             </div>
           </div>
 
           {/* Trusted Contacts */}
           <div className="space-y-3">
             <label className="text-sm font-medium text-card-foreground flex items-center gap-2">
               <UserPlus className="w-4 h-4" />
               Trusted Contacts ({contacts.length}/3)
             </label>
 
             {/* Add Contact Form */}
             <div className="flex flex-col gap-2">
               <Input
                 placeholder="Name"
                 value={newName}
                 onChange={(e) => setNewName(e.target.value)}
                 className="text-sm"
               />
               <Input
                 placeholder="Phone or Email"
                 value={newContact}
                 onChange={(e) => setNewContact(e.target.value)}
                 className="text-sm"
               />
               <Button
                 onClick={handleAddContact}
                 variant="secondary"
                 size="sm"
                 disabled={contacts.length >= 3}
                 className="gap-2"
               >
                 <UserPlus className="w-4 h-4" />
                 Add Contact
               </Button>
             </div>
 
             {/* Contact List */}
             {contacts.length > 0 && (
               <div className="space-y-2">
                 {contacts.map((contact) => (
                   <div
                     key={contact.id}
                     className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                   >
                     <div>
                       <p className="text-sm font-medium text-card-foreground">{contact.name}</p>
                       <p className="text-xs text-muted-foreground">{contact.contact}</p>
                     </div>
                     <button
                       onClick={() => handleRemoveContact(contact.id)}
                       className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                 ))}
               </div>
             )}
           </div>
         </div>
 
         {/* Footer */}
         <div className="p-4 border-t border-border bg-muted/30">
           <Button onClick={onClose} variant="outline" className="w-full">
             Close
           </Button>
         </div>
       </div>
     </div>
   );
 };
 
 export default LocationSharingPanel;