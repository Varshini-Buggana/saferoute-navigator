import { Shield, MapPin, Navigation2 } from "lucide-react";

const Header = () => {
  return (
    <header className="header-gradient text-primary-foreground py-4 px-6 shadow-elevated relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgY3g9IjIwIiBjeT0iMjAiIHI9IjEiLz48L2c+PC9zdmc+')] opacity-50" />
      
      <div className="max-w-7xl mx-auto flex items-center gap-4 relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
          <Shield className="w-7 h-7" />
        </div>
        
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
          <h1 className="text-2xl font-bold tracking-tight">SafeTravel</h1>
          <span className="text-lg font-light opacity-90">Finder</span>
        </div>
        
        {/* Tagline - Desktop */}
        <div className="hidden md:flex items-center gap-6 ml-auto">
          <div className="flex items-center gap-2 text-sm opacity-90 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
            <Navigation2 className="w-4 h-4" />
            <span>Real Road Navigation</span>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-90 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
            <MapPin className="w-4 h-4" />
            <span>AI Safety Analysis</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
