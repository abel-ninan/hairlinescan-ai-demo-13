import { Button } from "@/components/ui/button";
import { RiskGauge } from "@/components/RiskGauge";
import { MetricCard } from "@/components/MetricCard";
import { ProtocolCard } from "@/components/ProtocolCard";
import { DemoBadge } from "@/components/DemoBadge";
import { AnalysisResult } from "@/types/analysis";
import { 
  RotateCcw, 
  Sun, 
  Droplets, 
  Syringe, 
  Heart, 
  Stethoscope,
  TrendingUp,
  Target,
  Layers,
  AlertCircle,
  Eye,
  Lightbulb
} from "lucide-react";

interface ResultsScreenProps {
  score: number;
  analysis?: AnalysisResult | null;
  onRestart: () => void;
}

const getProtocolIcon = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes('light') || lower.includes('laser')) return Sun;
  if (lower.includes('minoxidil') || lower.includes('topical')) return Droplets;
  if (lower.includes('needle') || lower.includes('micro')) return Syringe;
  if (lower.includes('lifestyle') || lower.includes('nutrition') || lower.includes('stress')) return Heart;
  if (lower.includes('doctor') || lower.includes('dermat') || lower.includes('consult') || lower.includes('clinical')) return Stethoscope;
  return Lightbulb;
};

export const ResultsScreen = ({ score, analysis, onRestart }: ResultsScreenProps) => {
  // Use AI analysis data if available, otherwise fallback to generated values
  const confidence = analysis ? Math.round(analysis.confidence * 100) : 85 + Math.round(score * 1.2);
  const displayScore = analysis?.score ?? score;

  return (
    <div className="min-h-screen p-4 md:p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <DemoBadge className="mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Analysis Results
          </h1>
          <p className="text-muted-foreground">
            {analysis ? 'AI-powered analysis complete' : 'Analysis complete'}
          </p>
        </div>

        {/* Risk Score */}
        <div className="glass-panel p-6 mb-6 opacity-0 animate-fade-up" style={{ animationFillMode: 'forwards' }}>
          <h2 className="text-sm uppercase tracking-wider text-muted-foreground text-center mb-4">
            Hair Health Score
          </h2>
          <RiskGauge score={displayScore} />
        </div>

        {/* Summary */}
        {analysis?.summary && (
          <div className="glass-panel p-4 mb-6 opacity-0 animate-fade-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <p className="text-foreground text-center">{analysis.summary}</p>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <MetricCard 
            label="Confidence"
            value={`${confidence}%`}
            delay={150}
          />
          <MetricCard 
            label="Photos Analyzed"
            value={analysis ? "AI" : "Demo"}
            delay={200}
          />
        </div>

        {/* Observations */}
        {analysis?.observations && analysis.observations.length > 0 && (
          <div className="glass-panel p-4 mb-6 opacity-0 animate-fade-up" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" /> Observations
            </h3>
            <ul className="space-y-2">
              {analysis.observations.map((obs, i) => (
                <li key={i} className="text-sm text-foreground flex gap-2">
                  <span className="text-primary">•</span>
                  {obs}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Likely Patterns */}
        {analysis?.likely_patterns && analysis.likely_patterns.length > 0 && (
          <div className="glass-panel p-4 mb-6 opacity-0 animate-fade-up" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" /> Possible Patterns
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.likely_patterns.map((pattern, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-secondary/50 text-sm text-foreground border border-border/50">
                  {pattern}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* General Options / Protocol Cards */}
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3 mt-8">
          General Information
        </h3>
        <div className="space-y-3">
          {analysis?.general_options && analysis.general_options.length > 0 ? (
            analysis.general_options.map((option, i) => (
              <ProtocolCard
                key={i}
                icon={getProtocolIcon(option.title)}
                title={option.title}
                description={option.bullets.join(' ')}
                delay={400 + i * 100}
              />
            ))
          ) : (
            <>
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
                icon={Heart}
                title="Lifestyle Factors"
                description="Maintain balanced nutrition, manage stress levels, ensure adequate sleep, and avoid harsh hair treatments."
                delay={700}
              />
            </>
          )}
        </div>

        {/* When to See a Dermatologist */}
        {analysis?.when_to_see_a_dermatologist && analysis.when_to_see_a_dermatologist.length > 0 && (
          <div className="glass-panel p-4 mt-6 opacity-0 animate-fade-up border-l-4 border-l-primary" style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}>
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Stethoscope className="w-4 h-4" /> When to See a Dermatologist
            </h3>
            <ul className="space-y-2">
              {analysis.when_to_see_a_dermatologist.map((reason, i) => (
                <li key={i} className="text-sm text-foreground flex gap-2">
                  <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Restart Button */}
        <div className="mt-8 opacity-0 animate-fade-up" style={{ animationDelay: '900ms', animationFillMode: 'forwards' }}>
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
            {analysis?.disclaimer || 
              "Not medical advice. This analysis is for educational purposes only. Always consult a qualified dermatologist or healthcare provider for actual medical concerns."}
          </p>
        </footer>
      </div>
    </div>
  );
};
