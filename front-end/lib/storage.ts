import { AnalysisRecord } from "./analysis";

const STORAGE_KEY = "pitchlens:lastAnalysis";
const STALE_THRESHOLD_MS = 1000 * 60 * 60 * 24; // 24 hours

type LastAnalysisPayload = {
  record: AnalysisRecord;
  savedAt: string;
};

export type LastAnalysisSnapshot = LastAnalysisPayload & {
  isStale: boolean;
  ageMs: number;
};

const isValidRecord = (parsed: unknown): parsed is AnalysisRecord => {
  if (!parsed || typeof parsed !== "object") return false;
  const candidate = parsed as Partial<AnalysisRecord>;
  return (
    typeof candidate.score === "number" &&
    typeof candidate.clarity === "number" &&
    typeof candidate.emotion === "number" &&
    typeof candidate.credibility === "number" &&
    typeof candidate.market_effectiveness === "number"
  );
};

const toSnapshot = (
  payload: LastAnalysisPayload | AnalysisRecord,
): LastAnalysisSnapshot | null => {
  if ("record" in payload) {
    if (!isValidRecord(payload.record)) return null;
    const savedAtMs = Date.parse(payload.savedAt);
    const fallbackMs = Date.parse(payload.record.createdAt);
    const validMs = Number.isFinite(savedAtMs) ? savedAtMs : fallbackMs;
    const ageMs = Math.max(0, Date.now() - (Number.isFinite(validMs) ? validMs : Date.now()));
    return {
      record: payload.record,
      savedAt: Number.isFinite(savedAtMs)
        ? payload.savedAt
        : payload.record.createdAt || new Date().toISOString(),
      ageMs,
      isStale: ageMs > STALE_THRESHOLD_MS,
    };
  }

  if (!isValidRecord(payload)) return null;
  const savedAt = payload.createdAt || new Date().toISOString();
  const savedAtMs = Date.parse(savedAt);
  const ageMs = Math.max(0, Date.now() - (Number.isFinite(savedAtMs) ? savedAtMs : Date.now()));
  return {
    record: payload,
    savedAt,
    ageMs,
    isStale: ageMs > STALE_THRESHOLD_MS,
  };
};

export const saveLastAnalysis = (record: AnalysisRecord) => {
  if (typeof window === "undefined") return;
  try {
    const payload: LastAnalysisPayload = {
      record,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage failures (private mode, full storage, etc.)
  }
};

export const getLastAnalysisSnapshot = (): LastAnalysisSnapshot | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastAnalysisPayload | AnalysisRecord;
    return toSnapshot(parsed);
  } catch {
    return null;
  }
};

export const getLastAnalysis = (): AnalysisRecord | null => {
  return getLastAnalysisSnapshot()?.record ?? null;
};

export const clearLastAnalysis = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
};
