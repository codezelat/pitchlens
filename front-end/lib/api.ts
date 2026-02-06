import { AnalysisRecord, AnalysisResult, AnalysisTone, AnalysisPersona } from "./analysis";
import { saveLastAnalysis } from "./storage";

export type ApiAnalysisRecord = AnalysisResult & {
  id: number;
  created_at: string;
  tone: AnalysisTone;
  persona: AnalysisPersona;
  message?: string | null;
  url?: string | null;
};

const getApiBase = () => {
  return process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
};

export const fetchLatestAnalysis = async (
  token?: string | null,
): Promise<AnalysisRecord | null> => {
  try {
    const headers: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};
    const res = await fetch(`${getApiBase()}/analyses/latest`, {
      cache: "no-store",
      headers,
    });
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as ApiAnalysisRecord;
    const record = mapApiRecord(data);
    saveLastAnalysis(record);
    return record;
  } catch {
    return null;
  }
};

export const fetchAnalyses = async (
  limit = 10,
  token?: string | null,
): Promise<AnalysisRecord[]> => {
  try {
    const headers: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};
    const res = await fetch(`${getApiBase()}/analyses?limit=${limit}`, {
      cache: "no-store",
      headers,
    });
    if (!res.ok) {
      return [];
    }
    const data = (await res.json()) as ApiAnalysisRecord[];
    return data.map(mapApiRecord);
  } catch {
    return [];
  }
};

export const mapApiRecord = (data: ApiAnalysisRecord): AnalysisRecord => {
  return {
    id: data.id,
    score: data.score,
    clarity: data.clarity,
    emotion: data.emotion,
    credibility: data.credibility,
    market_effectiveness: data.market_effectiveness,
    suggestion: data.suggestion,
    insights: data.insights,
    tone: data.tone,
    persona: data.persona,
    createdAt: data.created_at,
    input: {
      message: data.message ?? undefined,
      url: data.url ?? undefined,
    },
  };
};
