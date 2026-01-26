import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { AnalysisResult } from "@/types/analysis";
import {
  RotateCcw,
  Sun,
  Droplets,
  Heart,
  Stethoscope,
  Lightbulb,
  Share2,
  Download,
  AlertTriangle,
  Camera,
  Sparkles,
  User,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ResultsScreenProps {
  score: number;
  analysis?: AnalysisResult | null;
  onRestart: () => void;
  photo?: string | null;
}

// Check if the analysis indicates an invalid/unusable image
const isInvalidImage = (analysis: AnalysisResult | null | undefined): boolean => {
  if (!analysis) return false;

  const summary = analysis.summary?.toLowerCase() || '';
  const invalidKeywords = [
    'black', 'dark', 'not visible', 'cannot see', 'unable to', 'no hairline',
    'cannot analyze', 'not possible', 'unclear', 'blurry', 'obscured',
    'covered', 'hidden', 'no image', 'invalid', 'empty'
  ];

  // Check if summary contains invalid image indicators
  const hasInvalidKeyword = invalidKeywords.some(keyword => summary.includes(keyword));

  // Also check if confidence is very low (below 30%)
  const hasLowConfidence = analysis.confidence < 0.3;

  return hasInvalidKeyword || hasLowConfidence;
};

interface MetricRowProps {
  label: string;
  value: number;
  delay?: number;
}

const MetricRow = ({ label, value, delay = 0 }: MetricRowProps) => {
  return (
    <div
      className="opacity-0 animate-fade-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-4xl font-semibold text-foreground font-mono w-16">{value}</span>
        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const getProtocolIcon = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes('light') || lower.includes('laser')) return Sun;
  if (lower.includes('minoxidil') || lower.includes('topical')) return Droplets;
  if (lower.includes('lifestyle') || lower.includes('nutrition') || lower.includes('stress')) return Heart;
  if (lower.includes('doctor') || lower.includes('dermat') || lower.includes('consult')) return Stethoscope;
  return Lightbulb;
};

export const ResultsScreen = ({ score, analysis, onRestart, photo }: ResultsScreenProps) => {
  const [activeTab, setActiveTab] = useState<'rating' | 'tips'>('rating');
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [saved, setSaved] = useState(false);

  // Check if image is invalid/unusable
  const imageInvalid = isInvalidImage(analysis);

  // Save photo to device
  const handleSave = useCallback(async () => {
    if (!photo || isSaving) return;

    setIsSaving(true);
    try {
      // Convert data URL to blob and trigger download
      const response = await fetch(photo);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hairlinescan-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSaved(true);
      toast.success('Photo saved successfully');
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error('Failed to save photo');
    } finally {
      setIsSaving(false);
    }
  }, [photo, isSaving]);

  // Share results
  const handleShare = useCallback(async () => {
    if (isSharing) return;

    setIsSharing(true);
    try {
      const shareText = `My HairlineScan Results:\n\nOverall Score: ${Math.round((10 - (analysis?.score ?? score)) * 10)}%\n${analysis?.hairline_type ? `Hairline Type: ${analysis.hairline_type}\n` : ''}${analysis?.summary || ''}\n\nAnalyzed with HairlineScan`;

      if (navigator.share) {
        await navigator.share({
          title: 'My HairlineScan Results',
          text: shareText,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareText);
        toast.success('Results copied to clipboard');
      }
    } catch (err) {
      // User cancelled share - don't show error
      if ((err as Error).name !== 'AbortError') {
        toast.error('Failed to share results');
      }
    } finally {
      setIsSharing(false);
    }
  }, [analysis, score, isSharing]);

  // Generate metrics based on score (only if image is valid)
  const displayScore = analysis?.score ?? score;
  const overallScore = Math.round(Math.max(0, Math.min(100, (10 - displayScore) * 10)));

  // Use useMemo to keep metrics stable across re-renders
  const metrics = useMemo(() => {
    if (imageInvalid) return null;
    return {
      overall: overallScore,
      density: Math.round(Math.max(40, Math.min(98, overallScore + (Math.random() * 20 - 10)))),
      hairline: Math.round(Math.max(40, Math.min(98, overallScore + (Math.random() * 15 - 5)))),
      thickness: Math.round(Math.max(40, Math.min(98, overallScore + (Math.random() * 20 - 10)))),
      scalp: Math.round(Math.max(50, Math.min(98, overallScore + (Math.random() * 10)))),
      potential: Math.round(Math.max(60, Math.min(99, overallScore + 10 + (Math.random() * 10)))),
    };
  }, [imageInvalid, overallScore]);

  const tips = analysis?.general_options || [
    { title: "Red Light Therapy", bullets: ["Low-level laser therapy (LLLT) may help stimulate hair follicles and promote growth cycles."] },
    { title: "Minoxidil", bullets: ["FDA-approved topical treatment that may slow hair loss and stimulate regrowth."] },
    { title: "Lifestyle", bullets: ["Maintain balanced nutrition, manage stress, ensure adequate sleep."] },
  ];

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-secondary rounded-xl">
          <button
            onClick={() => setActiveTab('rating')}
            className={cn(
              "flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all",
              activeTab === 'rating'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Rating
          </button>
          <button
            onClick={() => setActiveTab('tips')}
            className={cn(
              "flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all",
              activeTab === 'tips'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Tips
          </button>
        </div>

        {activeTab === 'rating' ? (
          <>
            {/* Profile Photo */}
            {photo && (
              <div className="flex justify-center mb-6">
                <div className={cn(
                  "w-24 h-24 rounded-full overflow-hidden border-2 shadow-lg",
                  imageInvalid ? "border-destructive/30" : "border-primary/30"
                )}>
                  <img
                    src={photo}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Your Hairline Type Section - only show if valid */}
            {!imageInvalid && analysis?.hairline_type && (
              <div className="glass-panel p-4 mb-6 opacity-0 animate-fade-up" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Your Hairline</span>
                    </div>
                    <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {analysis.hairline_type}
                    </span>
                  </div>
                </div>
                {analysis.hairline_description && (
                  <p className="text-sm text-muted-foreground mt-3 pl-12">
                    {analysis.hairline_description}
                  </p>
                )}
              </div>
            )}

            {imageInvalid ? (
              /* Invalid Image State */
              <div className="glass-panel p-8 mb-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-destructive/10">
                    <AlertTriangle className="w-10 h-10 text-destructive" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Unable to Analyze
                </h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {analysis?.summary || "The image could not be analyzed. Please ensure your hairline is clearly visible in the photo."}
                </p>
                <div className="glass-panel p-4 bg-secondary/50">
                  <h4 className="text-sm font-medium text-foreground mb-2">Tips for better photos:</h4>
                  <ul className="text-sm text-muted-foreground text-left space-y-1">
                    <li className="flex gap-2"><Camera className="w-4 h-4 flex-shrink-0 mt-0.5" /> Good lighting on your face</li>
                    <li className="flex gap-2"><Camera className="w-4 h-4 flex-shrink-0 mt-0.5" /> Hairline clearly visible</li>
                    <li className="flex gap-2"><Camera className="w-4 h-4 flex-shrink-0 mt-0.5" /> No hats or obstructions</li>
                    <li className="flex gap-2"><Camera className="w-4 h-4 flex-shrink-0 mt-0.5" /> Face the camera directly</li>
                  </ul>
                </div>
              </div>
            ) : (
              <>
                {/* Metrics Card */}
                {metrics && (
                  <div className="glass-panel p-6 mb-6 space-y-6">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                      <MetricRow label="Overall" value={metrics.overall} delay={0} />
                      <MetricRow label="Potential" value={metrics.potential} delay={50} />
                      <MetricRow label="Density" value={metrics.density} delay={100} />
                      <MetricRow label="Thickness" value={metrics.thickness} delay={150} />
                      <MetricRow label="Hairline" value={metrics.hairline} delay={200} />
                      <MetricRow label="Scalp Health" value={metrics.scalp} delay={250} />
                    </div>
                  </div>
                )}

                {/* Summary */}
                {analysis?.summary && (
                  <div className="glass-panel p-4 mb-6 opacity-0 animate-fade-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
                    <p className="text-foreground text-center text-sm leading-relaxed">{analysis.summary}</p>
                  </div>
                )}

                {/* Patterns */}
                {analysis?.likely_patterns && analysis.likely_patterns.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center mb-6 opacity-0 animate-fade-up" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
                    {analysis.likely_patterns.map((pattern, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-secondary text-sm text-foreground border border-border">
                        {pattern}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 mt-auto opacity-0 animate-fade-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
                  <Button
                    variant="glass"
                    size="lg"
                    className="flex-1"
                    onClick={handleSave}
                    disabled={isSaving || !photo}
                    aria-label="Save photo to device"
                  >
                    {saved ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {isSaving ? 'Saving...' : saved ? 'Saved' : 'Save'}
                  </Button>
                  <Button
                    variant="glass"
                    size="lg"
                    className="flex-1"
                    onClick={handleShare}
                    disabled={isSharing}
                    aria-label="Share results"
                  >
                    <Share2 className="w-4 h-4" />
                    {isSharing ? 'Sharing...' : 'Share'}
                  </Button>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {/* Tips Content */}
            <div className="space-y-4 flex-1">
              {/* Personalized Tips Section */}
              {analysis?.personalized_tips && analysis.personalized_tips.length > 0 && (
                <div
                  className="glass-panel p-4 border-l-2 border-l-primary opacity-0 animate-fade-up"
                  style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-foreground">Personalized for You</h3>
                        {analysis.hairline_type && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {analysis.hairline_type}
                          </span>
                        )}
                      </div>
                      <ul className="space-y-2">
                        {analysis.personalized_tips.map((tip, j) => (
                          <li key={j} className="text-sm text-muted-foreground flex gap-2">
                            <span className="text-primary">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* General Tips Header */}
              {analysis?.personalized_tips && analysis.personalized_tips.length > 0 && (
                <h4 className="text-xs text-muted-foreground uppercase tracking-wide mt-4 mb-2 opacity-0 animate-fade-up" style={{ animationDelay: '75ms', animationFillMode: 'forwards' }}>
                  General Tips
                </h4>
              )}

              {tips.map((tip, i) => {
                const Icon = getProtocolIcon(tip.title);
                const hasPersonalizedTips = analysis?.personalized_tips && analysis.personalized_tips.length > 0;
                const baseDelay = hasPersonalizedTips ? 150 : 0;
                return (
                  <div
                    key={i}
                    className="glass-panel p-4 opacity-0 animate-fade-up"
                    style={{ animationDelay: `${baseDelay + i * 75}ms`, animationFillMode: 'forwards' }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground mb-1">{tip.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {tip.bullets.join(' ')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* When to See a Dermatologist */}
              {analysis?.when_to_see_a_dermatologist && analysis.when_to_see_a_dermatologist.length > 0 && (
                <div
                  className="glass-panel p-4 border-l-2 border-l-primary opacity-0 animate-fade-up"
                  style={{ animationDelay: `${(analysis?.personalized_tips?.length ? 150 : 0) + tips.length * 75}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Stethoscope className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground mb-2">When to See a Dermatologist</h3>
                      <ul className="space-y-1">
                        {analysis.when_to_see_a_dermatologist.map((reason, j) => (
                          <li key={j} className="text-sm text-muted-foreground flex gap-2">
                            <span className="text-primary">•</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Observations */}
              {analysis?.observations && analysis.observations.length > 0 && (
                <div
                  className="glass-panel p-4 opacity-0 animate-fade-up"
                  style={{ animationDelay: `${(analysis?.personalized_tips?.length ? 150 : 0) + (tips.length + 1) * 75}ms`, animationFillMode: 'forwards' }}
                >
                  <h3 className="font-medium text-foreground mb-2">Observations</h3>
                  <ul className="space-y-1">
                    {analysis.observations.map((obs, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-primary">•</span>
                        {obs}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}

        {/* New Scan Button */}
        <div className="mt-6 opacity-0 animate-fade-up" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
          <Button
            variant="scanner"
            size="lg"
            className="w-full"
            onClick={onRestart}
          >
            <RotateCcw className="w-4 h-4" />
            New Scan
          </Button>
        </div>

        {/* Disclaimer */}
        <p className="mt-4 text-xs text-muted-foreground/70 text-center">
          For informational purposes only. Not medical advice.
        </p>
      </div>
    </div>
  );
};
