import { Button } from "@/components/ui/button";
import { RiskGauge } from "@/components/RiskGauge";
import { MetricCard } from "@/components/MetricCard";
import { ProtocolCard } from "@/components/ProtocolCard";
import { DemoBadge } from "@/components/DemoBadge";
import { 
  RotateCcw, 
  Sun, 
  Droplets, 
  Syringe, 
  Heart, 
  Stethoscope,
  TrendingUp,
  Target,
  Layers
} from "lucide-react";

interface ResultsScreenProps {
  score: number;
  onRestart: () => void;
}

export const ResultsScreen = ({ score, onRestart }: ResultsScreenProps) => {
  // Generate consistent fake metrics based on score
  const confidence = 85 + Math.round(score * 1.2);
  const densityVariance = (15 + score * 3).toFixed(1);
  const follicleRatio = (92 - score * 2).toFixed(1);

  return (
    <div className="min-h-screen p-4 md:p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <DemoBadge className="mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Scan Results
          </h1>
          <p className="text-muted-foreground">Analysis complete</p>
        </div>

        {/* Risk Score */}
        <div className="glass-panel p-6 mb-6 opacity-0 animate-fade-up" style={{ animationFillMode: 'forwards' }}>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground text-center mb-4">
            Bald Risk Score
          </h2>
          <RiskGauge score={score} />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <MetricCard 
            label="Confidence"
            value={`${confidence}%`}
            delay={100}
          />
          <MetricCard 
            label="Density Var."
            value={`${densityVariance}%`}
            delay={200}
          />
          <MetricCard 
            label="Follicle Ratio"
            value={`${follicleRatio}%`}
            delay={300}
          />
        </div>

        {/* Technical Analysis */}
        <div className="glass-panel p-4 mb-6 opacity-0 animate-fade-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
          <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
            Technical Analysis
          </h3>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> Recession Vector
              </span>
              <span className="text-foreground">{(score * 0.7).toFixed(2)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Target className="w-3 h-3" /> Temple Index
              </span>
              <span className="text-foreground">NW-{Math.min(3, Math.floor(score / 3) + 1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Layers className="w-3 h-3" /> Miniaturization
              </span>
              <span className="text-foreground">{(score * 8).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Protocol Cards */}
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3 mt-8">
          Suggested Protocol
        </h3>
        <div className="space-y-3">
          <ProtocolCard
            icon={Sun}
            title="Red Light Therapy"
            description="Low-level laser therapy (LLLT) may help stimulate hair follicles and promote growth cycles."
            tag="Non-invasive"
            tagColor="success"
            delay={500}
          />
          <ProtocolCard
            icon={Droplets}
            title="Minoxidil"
            description="FDA-approved topical treatment that may slow hair loss and stimulate regrowth in some individuals."
            tag="Rx Option"
            tagColor="primary"
            delay={600}
          />
          <ProtocolCard
            icon={Syringe}
            title="Microneedling"
            description="Derma rolling can enhance absorption of topical treatments and may stimulate natural healing response."
            tag="Advanced"
            tagColor="warning"
            delay={700}
          />
          <ProtocolCard
            icon={Heart}
            title="Lifestyle Factors"
            description="Maintain balanced nutrition, manage stress levels, ensure adequate sleep, and avoid harsh hair treatments."
            delay={800}
          />
          <ProtocolCard
            icon={Stethoscope}
            title="Clinician Consultation"
            description="Consider consulting a dermatologist or trichologist for professional evaluation and personalized treatment options."
            tag="Recommended"
            tagColor="primary"
            delay={900}
          />
        </div>

        {/* Restart Button */}
        <div className="mt-8 opacity-0 animate-fade-up" style={{ animationDelay: '1000ms', animationFillMode: 'forwards' }}>
          <Button 
            variant="glass" 
            size="lg" 
            className="w-full"
            onClick={onRestart}
          >
            <RotateCcw className="w-4 h-4" />
            New Scan
          </Button>
        </div>

        {/* Footer Disclaimer */}
        <footer className="mt-8 text-center">
          <p className="text-xs text-muted-foreground/60 max-w-sm mx-auto leading-relaxed">
            Not medical advice. This is a simulated demo for educational purposes only. 
            Always consult a qualified dermatologist or healthcare provider for actual medical concerns.
          </p>
        </footer>
      </div>
    </div>
  );
};
