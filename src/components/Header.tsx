import { Shield, MapPin } from "lucide-react";

const Header = () => {
  return (
    <header className="header-gradient text-primary-foreground py-4 px-6 shadow-elevated">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-foreground/10 backdrop-blur-sm">
          <Shield className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">SafeTravel</h1>
          <span className="text-xl font-light opacity-90">Finder</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 ml-4 text-sm opacity-80">
          <MapPin className="w-4 h-4" />
          <span>Travel safely, travel smart</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
