"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnalysisRecord } from "@/lib/analysis";
import { fetchAnalyses, fetchLatestAnalysis } from "@/lib/api";
import { getLastAnalysis } from "@/lib/storage";

export default function DashboardPage() {
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [recent, setRecent] = useState<AnalysisRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const list = await fetchAnalyses(8);
      if (!isMounted) return;
      if (list.length > 0) {
        setRecent(list);
        setAnalysis(list[0]);
        return;
      }
      const latest = await fetchLatestAnalysis();
      if (!isMounted) return;
      setAnalysis(latest || getLastAnalysis());
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const marketResonanceScore = analysis?.score ?? 0;
  const clarityScore = analysis?.clarity ?? 0;
  const emotionScore = analysis?.emotion ?? 0;
  const credibilityScore = analysis?.credibility ?? 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-pink-500";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4B3CDB] to-[#6C5CE7] flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span className="text-gray-900 font-semibold text-xl">
                PitchLens
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/app"
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
              >
                Analyze
              </Link>
              <Link
                href="/badges"
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
              >
                Badges
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Score Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive analysis of your message performance
          </p>
        </div>

        {!analysis && (
          <div className="mb-10 rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <p className="text-gray-700 mb-4">
              No analysis found yet. Run your first analysis to see real scores and insights.
            </p>
            <Link
              href="/app"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#4B3CDB] to-[#6C5CE7] text-white rounded-full font-semibold hover:shadow-xl transition-all hover:scale-105"
            >
              Analyze a Message
            </Link>
          </div>
        )}

        {analysis && (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Latest Analysis
                </h2>
                <p className="text-sm text-gray-600">
                  Tone: {analysis.tone} · Persona: {analysis.persona}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(analysis.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                  Input
                </p>
                <p className="text-sm text-gray-700">
                  {analysis.input.message ||
                    analysis.input.url ||
                    "No input recorded."}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                  Suggested Rewrite
                </p>
                <p className="text-sm text-gray-700">
                  {analysis.suggestion}
                </p>
              </div>
            </div>
          </div>
        )}

        {analysis && (
        <>
        {/* Market Resonance Score - Hero Card */}
        <div className="mb-8 bg-gradient-to-br from-[#4B3CDB] to-[#6C5CE7] rounded-3xl p-8 lg:p-12 text-white shadow-2xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl font-semibold mb-2 opacity-90">
                Market Resonance Score
              </h2>
              <p className="text-white/80 text-lg max-w-xl">
                Overall effectiveness of your message in connecting with your
                target audience
              </p>
            </div>
            <div className="relative">
              <div className="w-40 h-40 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border-8 border-white/20">
                <div className="text-center">
                  <div className="text-6xl font-bold">
                    {marketResonanceScore}
                  </div>
                  <div className="text-sm opacity-80">/ 100</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Scores Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Clarity Score */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <span
                className={`text-4xl font-bold ${getScoreColor(clarityScore)}`}
              >
                {clarityScore}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Clarity
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              How easy your message is to understand and digest
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(
                  clarityScore
                )}`}
                style={{ width: `${clarityScore}%` }}
              ></div>
            </div>
          </div>

          {/* Emotion Score */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <span
                className={`text-4xl font-bold ${getScoreColor(emotionScore)}`}
              >
                {emotionScore}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Emotion
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Emotional resonance and impact on your audience
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(
                  emotionScore
                )}`}
                style={{ width: `${emotionScore}%` }}
              ></div>
            </div>
          </div>

          {/* Credibility Score */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <span
                className={`text-4xl font-bold ${getScoreColor(
                  credibilityScore
                )}`}
              >
                {credibilityScore}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Credibility
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Trustworthiness and authority of your messaging
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(
                  credibilityScore
                )}`}
                style={{ width: `${credibilityScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Insights & Recommendations */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Key Insights */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Key Insights
            </h3>
            <div className="space-y-4">
              {(analysis?.insights?.length ? analysis.insights : [
                "Run an analysis to see tailored insights.",
              ]).map((insight, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Insight {idx + 1}
                    </h4>
                    <p className="text-sm text-gray-600">{insight}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Recommendations
            </h3>
            <div className="space-y-4">
              {(analysis?.insights?.length ? analysis.insights : [
                "Run an analysis to generate recommendations.",
              ]).map((insight, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4B3CDB] text-white flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {recent.length > 1 && (
          <div className="mb-10 rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Analyses
            </h3>
            <div className="space-y-3">
              {recent.slice(1).map((item) => (
                <div
                  key={item.id ?? item.createdAt}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4"
                >
                  <div>
                    <p className="text-sm text-gray-700">
                      {item.input.message || item.input.url || "No input recorded."}
                    </p>
                    <p className="text-xs text-gray-500">
                      Tone: {item.tone} · Persona: {item.persona}
                    </p>
                  </div>
                  <div className="text-sm text-gray-600">
                    Score {item.score} · {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/badges"
            className="px-8 py-3 bg-gradient-to-r from-[#4B3CDB] to-[#6C5CE7] text-white rounded-full font-semibold hover:shadow-xl transition-all hover:scale-105 text-center"
          >
            Generate Badge
          </Link>
          <Link
            href="/app"
            className="px-8 py-3 bg-white border-2 border-gray-300 text-gray-900 rounded-full font-semibold hover:border-[#4B3CDB] hover:text-[#4B3CDB] transition-all text-center"
          >
            Analyze Another Message
          </Link>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
