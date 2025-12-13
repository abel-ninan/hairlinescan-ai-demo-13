import { Button } from "@/components/ui/button";
import { DemoBadge } from "@/components/DemoBadge";
import { Scan, Shield, Zap, Brain } from "lucide-react";

interface LandingScreenProps {
  onStart: () => void;
}

export const LandingScreen = ({ onStart }: LandingScreenProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-md w-full text-center">
        {/* Logo/Icon */}
        <div className="mb-8 animate-float">
          <div className="inline-flex p-4 rounded-3xl bg-primary/10 border border-primary/20 scanner-glow">
            <Scan className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold mb-3 font-display">
          <span className="text-gradient">HairlineScan</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-2">(Demo)</p>
        
        {/* Tagline */}
        <p className="text-muted-foreground mb-10 max-w-xs mx-auto leading-relaxed">
          Advanced AI-powered hairline analysis using computer vision technology
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: Brain, label: "AI Analysis" },
            { icon: Zap, label: "Instant Results" },
            { icon: Shield, label: "Private & Secure" },
          ].map(({ icon: Icon, label }, i) => (
            <div 
              key={label}
              className="glass-panel p-4 opacity-0 animate-fade-up"
              style={{ animationDelay: `${i * 100 + 200}ms`, animationFillMode: 'forwards' }}
            >
              <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Button 
          variant="scanner" 
          size="xl" 
          onClick={onStart}
          className="w-full opacity-0 animate-fade-up"
          style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}
        >
          <Scan className="w-5 h-5" />
          Begin Scan
        </Button>

        {/* Demo badge */}
        <div className="mt-8">
          <DemoBadge />
        </div>

        {/* Disclaimer */}
        <p className="mt-4 text-xs text-muted-foreground/60 max-w-xs mx-auto">
          This is a technology demo. No real medical analysis is performed.
        </p>
      </div>
    </div>
  );
};
