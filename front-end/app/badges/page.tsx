"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnalysisRecord } from "@/lib/analysis";
import { fetchLatestAnalysis } from "@/lib/api";
import { getLastAnalysis } from "@/lib/storage";

export default function BadgesPage() {
  const [selectedFormat, setSelectedFormat] = useState<"png" | "svg">("png");
  const [copied, setCopied] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
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

  const embedCode = `<div style="display: inline-block; padding: 20px; background: linear-gradient(135deg, #4B3CDB, #6C5CE7); border-radius: 16px; color: white; font-family: system-ui, -apple-system, sans-serif; text-align: center; box-shadow: 0 10px 25px rgba(75, 60, 219, 0.3);">
  <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Market Resonance Score</div>
  <div style="font-size: 48px; font-weight: bold; margin-bottom: 4px;">${marketResonanceScore}</div>
  <div style="font-size: 12px; opacity: 0.8;">Verified by PitchLens</div>
</div>`;

  const badgeWidth = 360;
  const badgeHeight = 200;

  const getBadgeSvg = (score: number) => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${badgeWidth}" height="${badgeHeight}" viewBox="0 0 ${badgeWidth} ${badgeHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4B3CDB"/>
      <stop offset="100%" stop-color="#6C5CE7"/>
    </linearGradient>
  </defs>
  <rect width="${badgeWidth}" height="${badgeHeight}" rx="24" fill="url(#grad)"/>
  <text x="50%" y="52" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" opacity="0.9">Market Resonance Score</text>
  <text x="50%" y="118" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="64" font-weight="700" text-anchor="middle">${score}</text>
  <text x="50%" y="160" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" opacity="0.85">Verified by PitchLens</text>
</svg>`;
  };

  const downloadSvg = (svg: string) => {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pitchlens-badge.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPng = (svg: string) => {
    const image = new Image();
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = badgeWidth;
      canvas.height = badgeHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return;
      }
      ctx.drawImage(image, 0, 0, badgeWidth, badgeHeight);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "pitchlens-badge.png";
        link.click();
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    image.src = url;
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: "png" | "svg") => {
    const svg = getBadgeSvg(marketResonanceScore);
    if (format === "svg") {
      downloadSvg(svg);
      return;
    }
    downloadPng(svg);
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
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Badge Generation
          </h1>
          <p className="text-lg text-gray-600">
            Showcase your message quality with verified badges
          </p>
        </div>

        {!analysis && (
          <div className="mb-10 rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <p className="text-gray-700 mb-4">
              No analysis found yet. Run an analysis first to generate a real badge.
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
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Badge Preview */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Badge Preview
              </h2>

              {/* Badge Display */}
              <div className="flex items-center justify-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-6">
                <div className="inline-block p-6 bg-gradient-to-br from-[#4B3CDB] to-[#6C5CE7] rounded-2xl shadow-2xl">
                  <div className="text-center text-white">
                    <div className="text-sm opacity-90 mb-2">
                      Market Resonance Score
                    </div>
                    <div className="text-6xl font-bold mb-1">
                      {marketResonanceScore}
                    </div>
                    <div className="text-xs opacity-80">
                      Verified by PitchLens
                    </div>
                  </div>
                </div>
              </div>

              {/* Format Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Select Format
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedFormat("png")}
                    className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                      selectedFormat === "png"
                        ? "bg-[#4B3CDB] text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    PNG
                  </button>
                  <button
                    onClick={() => setSelectedFormat("svg")}
                    className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                      selectedFormat === "svg"
                        ? "bg-[#4B3CDB] text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    SVG
                  </button>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={() => handleDownload(selectedFormat)}
                disabled={!analysis}
                className="w-full px-6 py-4 bg-gradient-to-r from-[#4B3CDB] to-[#6C5CE7] text-white rounded-xl font-semibold hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download {selectedFormat.toUpperCase()}
              </button>
            </div>

            {/* Badge Variations */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Other Badge Styles
              </h3>
              <div className="space-y-4">
                {/* Compact Badge */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-gradient-to-r from-[#4B3CDB] to-[#6C5CE7] text-white rounded-lg text-sm font-bold">
                      {marketResonanceScore}
                    </div>
                    <span className="text-sm text-gray-700">Compact Style</span>
                  </div>
                  <button className="text-[#4B3CDB] text-sm font-medium hover:underline">
                    Use This
                  </button>
                </div>

                {/* Minimal Badge */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 border-2 border-[#4B3CDB] text-[#4B3CDB] rounded-lg text-sm font-bold">
                      Score: {marketResonanceScore}
                    </div>
                    <span className="text-sm text-gray-700">Minimal Style</span>
                  </div>
                  <button className="text-[#4B3CDB] text-sm font-medium hover:underline">
                    Use This
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Embed Code */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Embed HTML
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Copy and paste this code into your website to display your badge
              </p>

              {/* Code Block */}
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-xs leading-relaxed">
                  <code>{embedCode}</code>
                </pre>
                <button
                  onClick={handleCopyEmbed}
                  className="absolute top-3 right-3 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg text-xs font-medium transition-all flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <svg
                        className="w-4 h-4"
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
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy Code
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Usage Guidelines */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Usage Guidelines
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex gap-3">
                  <svg
                    className="flex-shrink-0 w-5 h-5 text-green-600 mt-0.5"
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
                  <p>
                    Use badges on landing pages, emails, and marketing materials
                  </p>
                </div>
                <div className="flex gap-3">
                  <svg
                    className="flex-shrink-0 w-5 h-5 text-green-600 mt-0.5"
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
                  <p>
                    Badges are automatically updated when you improve your score
                  </p>
                </div>
                <div className="flex gap-3">
                  <svg
                    className="flex-shrink-0 w-5 h-5 text-green-600 mt-0.5"
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
                  <p>
                    Link badges back to your PitchLens dashboard for credibility
                  </p>
                </div>
                <div className="flex gap-3">
                  <svg
                    className="flex-shrink-0 w-5 h-5 text-green-600 mt-0.5"
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
                  <p>Download badges work on any platform and device</p>
                </div>
              </div>
            </div>

            {/* Social Sharing */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Share Your Score
              </h3>
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-3 bg-[#1DA1F2] text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                  Twitter
                </button>
                <button className="flex-1 px-4 py-3 bg-[#0A66C2] text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {analysis && (
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-12">
          <Link
            href="/dashboard"
            className="px-8 py-3 bg-white border-2 border-gray-300 text-gray-900 rounded-full font-semibold hover:border-[#4B3CDB] hover:text-[#4B3CDB] transition-all text-center"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/app"
            className="px-8 py-3 bg-gradient-to-r from-[#4B3CDB] to-[#6C5CE7] text-white rounded-full font-semibold hover:shadow-xl transition-all hover:scale-105 text-center"
          >
            Analyze New Message
          </Link>
        </div>
        )}
      </div>
    </div>
  );
}
