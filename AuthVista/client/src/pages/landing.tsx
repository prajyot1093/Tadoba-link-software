import { Button } from "@/components/ui/button";
import { PawPrint, Shield, MapPin, Sparkles, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthModal } from "@/components/auth-modal";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function Landing() {
  const [leaves, setLeaves] = useState<Array<{ id: number; left: string; delay: string }>>([]);

  useEffect(() => {
    const newLeaves = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
    }));
    setLeaves(newLeaves);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 relative overflow-hidden">
      {/* Floating Leaves Animation */}
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute w-4 h-4 text-primary/20 animate-float pointer-events-none"
          style={{
            left: leaf.left,
            top: "-5%",
            animationDelay: leaf.delay,
            animationDuration: `${8 + Math.random() * 4}s`,
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
          </svg>
        </div>
      ))}

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <PawPrint className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Tadoba</h1>
              <p className="text-sm text-muted-foreground">Smart Conservation</p>
            </div>
          </div>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-login"
            className="bg-primary hover:bg-primary/90"
            style={{ display: 'none' }}
          >
            Login
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                data-testid="button-login"
                className="bg-primary hover:bg-primary/90"
              >
                Login
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <AuthModal />
            </DialogContent>
          </Dialog>
        </header>

        {/* Hero Section */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-6">
            <div className="inline-block">
              <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-full backdrop-blur-sm">
                <p className="text-sm text-primary font-medium">
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  Advanced Wildlife Conservation Platform
                </p>
              </div>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
              Protecting Tigers,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange">
                Empowering Communities
              </span>
            </h2>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Real-time animal tracking, geo-fencing alerts, AI-powered assistance, and safari booking for Tadoba Tiger Reserve
            </p>

            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    size="lg"
                    data-testid="button-get-started"
                    className="bg-primary hover:bg-primary/90 text-lg px-8"
                  >
                    Get Started
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <AuthModal />
                </DialogContent>
              </Dialog>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 backdrop-blur-sm"
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-20">
            <div className="group p-6 bg-card/50 backdrop-blur-sm border border-card-border rounded-2xl hover-elevate transition-all">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MapPin className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Live Tracking</h3>
              <p className="text-muted-foreground">
                Real-time animal location monitoring with geo-fencing and proximity alerts for safety
              </p>
            </div>

            <div className="group p-6 bg-card/50 backdrop-blur-sm border border-card-border rounded-2xl hover-elevate transition-all">
              <div className="w-14 h-14 bg-orange/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-orange" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">Safe Zones</h3>
              <p className="text-muted-foreground">
                Interactive maps showing protected cattle grazing areas and wildlife movement patterns
              </p>
            </div>

            <div className="group p-6 bg-card/50 backdrop-blur-sm border border-card-border rounded-2xl hover-elevate transition-all">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">AI Assistant</h3>
              <p className="text-muted-foreground">
                Smart chatbot for wildlife information, animal identification, and conservation guidance
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 p-8 bg-card/30 backdrop-blur-sm border border-card-border rounded-2xl">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">500+</p>
              <p className="text-sm text-muted-foreground mt-1">Animals Tracked</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange">24/7</p>
              <p className="text-sm text-muted-foreground mt-1">Monitoring</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">15k+</p>
              <p className="text-sm text-muted-foreground mt-1">Alerts Sent</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange">98%</p>
              <p className="text-sm text-muted-foreground mt-1">Safety Rate</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Tadoba Smart Conservation. Protecting wildlife, empowering communities.
          </p>
        </footer>
      </div>
    </div>
  );
}
