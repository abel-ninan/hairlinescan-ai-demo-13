export interface AnalysisResult {
  score: number;
  confidence: number;
  summary: string;
  observations: string[];
  likely_patterns: string[];
  general_options: {
    title: string;
    bullets: string[];
  }[];
  when_to_see_a_dermatologist: string[];
  disclaimer: string;
  // Personalized hairline analysis
  hairline_type?: string;
  hairline_description?: string;
  personalized_tips?: string[];
}
