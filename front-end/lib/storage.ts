import { AnalysisRecord } from "./analysis";

const STORAGE_KEY = "pitchlens:lastAnalysis";

export const saveLastAnalysis = (record: AnalysisRecord) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // ignore storage failures (private mode, full storage, etc.)
  }
};

export const getLastAnalysis = (): AnalysisRecord | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AnalysisRecord;
    if (
      typeof parsed?.score !== "number" ||
      typeof parsed?.clarity !== "number" ||
      typeof parsed?.emotion !== "number" ||
      typeof parsed?.credibility !== "number" ||
      typeof parsed?.market_effectiveness !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const clearLastAnalysis = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
};
