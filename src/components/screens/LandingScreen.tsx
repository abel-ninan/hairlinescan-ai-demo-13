import { Button } from "@/components/ui/button";
import { Shield, Zap, Brain, Scan, AlertCircle } from "lucide-react";

interface LandingScreenProps {
  onStart: () => void;
}

export const LandingScreen = ({ onStart }: LandingScreenProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="relative z-10 max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <img
            src="/logo.png"
            alt="HairlineScan"
            className="w-24 h-24 mx-auto rounded-2xl"
          />
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-semibold mb-3 font-display text-foreground">
          HairlineScan
        </h1>

        {/* Tagline */}
        <p className="text-muted-foreground mb-12 max-w-sm mx-auto leading-relaxed">
          AI-powered hairline analysis using advanced computer vision
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mb-12" role="list" aria-label="App features">
          {[
            { icon: Brain, label: "AI Analysis", description: "Advanced AI-powered analysis" },
            { icon: Zap, label: "Instant", description: "Get results in seconds" },
            { icon: Shield, label: "Private", description: "Your photos stay on device" },
          ].map(({ icon: Icon, label, description }, i) => (
            <div
              key={label}
              role="listitem"
              className="glass-panel p-4 opacity-0 animate-fade-up"
              style={{ animationDelay: `${i * 75 + 100}ms`, animationFillMode: 'forwards' }}
              aria-label={description}
            >
              <Icon className="w-5 h-5 text-primary mx-auto mb-2" aria-hidden="true" />
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
          style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
          aria-label="Begin hairline scan"
        >
          <Scan className="w-5 h-5" aria-hidden="true" />
          Begin Scan
        </Button>

        {/* Medical Disclaimer */}
        <div className="mt-8 p-4 rounded-xl bg-secondary/50 border border-border opacity-0 animate-fade-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-muted-foreground leading-relaxed text-left">
              <strong>Not Medical Advice:</strong> This app provides educational information only and is not a substitute for professional medical diagnosis or treatment. Always consult a dermatologist for hair loss concerns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
