export type AnalysisTone = "professional" | "casual" | "enthusiastic";
export type AnalysisPersona = "expert" | "friendly" | "authoritative";

export type AnalysisResult = {
  score: number;
  clarity: number;
  emotion: number;
  credibility: number;
  market_effectiveness: number;
  suggestion: string;
  insights: string[];
};

export type AnalysisInput = {
  message?: string;
  url?: string;
};

export type AnalysisRecord = AnalysisResult & {
  id?: number;
  input: AnalysisInput;
  tone: AnalysisTone;
  persona: AnalysisPersona;
  createdAt: string;
};

export const toneFromSlider = (value: number): AnalysisTone => {
  if (value < 34) return "professional";
  if (value < 67) return "casual";
  return "enthusiastic";
};

export const toneLabel = (value: number) => {
  if (value < 30) return "Formal";
  if (value < 70) return "Balanced";
  return "Enthusiastic";
};
