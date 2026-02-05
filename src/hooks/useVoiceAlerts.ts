 import { useEffect, useRef, useCallback } from "react";
 
 interface UseVoiceAlertsOptions {
   enabled: boolean;
   zoneStatus: "safe" | "caution" | "danger" | null;
 }
 
 const alertMessages = {
   caution: "Attention. You are entering a moderate risk area. Please stay aware of your surroundings.",
   danger: "Warning. You are entering a high-risk area. Please stay alert and exercise caution.",
 };
 
 export const useVoiceAlerts = ({ enabled, zoneStatus }: UseVoiceAlertsOptions) => {
   const lastAnnouncedStatus = useRef<string | null>(null);
   const isSpeaking = useRef(false);
 
   const speak = useCallback((text: string) => {
     if (!("speechSynthesis" in window)) {
       console.warn("Speech synthesis not supported");
       return;
     }
 
     // Cancel any ongoing speech
     window.speechSynthesis.cancel();
 
     const utterance = new SpeechSynthesisUtterance(text);
     utterance.rate = 0.9;
     utterance.pitch = 1;
     utterance.volume = 1;
     utterance.lang = "en-US";
 
     // Try to use a more natural voice
     const voices = window.speechSynthesis.getVoices();
     const preferredVoice = voices.find(
       (voice) =>
         voice.lang.startsWith("en") &&
         (voice.name.includes("Samantha") ||
           voice.name.includes("Google") ||
           voice.name.includes("Microsoft"))
     );
     if (preferredVoice) {
       utterance.voice = preferredVoice;
     }
 
     utterance.onstart = () => {
       isSpeaking.current = true;
     };
 
     utterance.onend = () => {
       isSpeaking.current = false;
     };
 
     utterance.onerror = () => {
       isSpeaking.current = false;
     };
 
     window.speechSynthesis.speak(utterance);
   }, []);
 
   useEffect(() => {
     if (!enabled || !zoneStatus) {
       return;
     }
 
     // Only announce for caution or danger zones
     if (zoneStatus === "safe") {
       return;
     }
 
     // Prevent re-announcing for the same zone status
     if (lastAnnouncedStatus.current === zoneStatus) {
       return;
     }
 
     // Don't interrupt ongoing speech
     if (isSpeaking.current) {
       return;
     }
 
     lastAnnouncedStatus.current = zoneStatus;
     const message = alertMessages[zoneStatus];
     if (message) {
       speak(message);
     }
   }, [enabled, zoneStatus, speak]);
 
   // Reset announced status when zone becomes safe
   useEffect(() => {
     if (zoneStatus === "safe" || zoneStatus === null) {
       lastAnnouncedStatus.current = null;
     }
   }, [zoneStatus]);
 
   // Cleanup on unmount
   useEffect(() => {
     return () => {
       if ("speechSynthesis" in window) {
         window.speechSynthesis.cancel();
       }
     };
   }, []);
 
   return { speak };
 };