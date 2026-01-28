import { Button } from "@/components/ui/button";
import { Shield, Zap, Brain, Scan, AlertCircle, Lock } from "lucide-react";

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
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
          Fun AI-powered hairline analysis for entertainment
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mb-8" role="list" aria-label="App features">
          {[
            { icon: Brain, label: "AI Fun", description: "AI-powered entertainment analysis" },
            { icon: Zap, label: "Instant", description: "Get results in seconds" },
            { icon: Shield, label: "Private", description: "Photos not stored" },
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

        {/* Privacy Notice */}
        <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 opacity-0 animate-fade-up" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-left">
              <p className="text-xs text-foreground font-medium mb-1">Your Privacy</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Photos are processed temporarily for analysis and are <strong>not stored</strong> on our servers. We do not collect personal information. <a href="https://abel-ninan.github.io/hairlinescan-ai-demo-13/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="text-primary underline">Privacy Policy</a>
              </p>
            </div>
          </div>
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

        {/* Entertainment Disclaimer */}
        <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 opacity-0 animate-fade-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-muted-foreground leading-relaxed text-left">
              <strong className="text-amber-600 dark:text-amber-400">Entertainment Only:</strong> This app is for fun and does not provide medical advice, diagnosis, or treatment. Results are not scientifically validated. Consult a dermatologist for any concerns.
            </p>
          </div>
        </div>

        {/* By continuing text */}
        <p className="mt-4 text-xs text-muted-foreground/60 opacity-0 animate-fade-up" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
          By using this app, you agree to our <a href="https://abel-ninan.github.io/hairlinescan-ai-demo-13/terms.html" target="_blank" rel="noopener noreferrer" className="underline">Terms</a> and <a href="https://abel-ninan.github.io/hairlinescan-ai-demo-13/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};
