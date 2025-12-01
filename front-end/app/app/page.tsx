"use client";

import { useState } from "react";
import Link from "next/link";

type AnalysisResult = {
  score: number;
  clarity: number;
  emotion: number;
  credibility: number;
  market_effectiveness: number;
  suggestion: string;
  insights: string[];
};

export default function AppPage() {
  const [inputText, setInputText] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [tone, setTone] = useState(50);
  const [selectedPersona, setSelectedPersona] = useState("expert");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
  if (!inputText.trim()) {
    alert("Message cannot be empty");
    return;
  }

  setAnalyzing(true);
  setAnalyzed(false);

  try {
    const res = await fetch("http://127.0.0.1:8000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: inputText,
        tone: selectedPersona === "friendly" || selectedPersona === "casual" ? "casual" : "professional",
        persona: selectedPersona,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.detail?.[0]?.msg || "Analysis failed");
      setAnalyzing(false);
      return;
    }

    const data = await res.json();
    console.log("Analysis result:", data);

    setResult(data); // Store the result for later use
    setAnalyzed(true);

  } catch (error) {
    console.error("Network error:", error);
    alert("Network error: Could not reach backend");
  }

  setAnalyzing(false);
};


  const personas = [
    { id: "expert", name: "Professional", emoji: "👔" },
    { id: "friendly", name: "Friendly", emoji: "😊" },
    { id: "technical", name: "Technical", emoji: "💻" },
    { id: "casual", name: "Casual", emoji: "👋" },
    { id: "authoritative", name: "Authoritative", emoji: "💼" },
  ];

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
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
              >
                Dashboard
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
        {/* Input Panel */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Message Intelligence Engine
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Analyze and optimize your messaging with AI-powered insights
          </p>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Text Input */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Paste Your Text
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter your message, pitch, or marketing copy here..."
                className="w-full h-48 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4B3CDB] focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* URL Input */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Or Enter a URL
              </label>
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://example.com/your-content"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4B3CDB] focus:border-transparent text-gray-900 placeholder-gray-400 mb-4"
              />
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">💡 Tip:</span> We&apos;ll
                  extract and analyze content from landing pages, articles, or
                  any web page.
                </p>
              </div>
            </div>
          </div>

          {/* Analyze Button */}
          <div className="flex justify-center">
            <button
              onClick={handleAnalyze}
              disabled={analyzing || (!inputText && !inputUrl)}
              className="px-12 py-4 bg-gradient-to-r from-[#4B3CDB] to-[#6C5CE7] text-white rounded-full font-semibold text-lg hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {analyzing ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Analyzing...
                </span>
              ) : (
                "Analyze Message"
              )}
            </button>
          </div>
        </div>

        {/* Analysis Results */}
        {analyzed && (
          <div className="space-y-8 animate-fade-in">
            {/* Before/After Comparison */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Before & After Comparison
              </h2>
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Before */}
                <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm font-semibold text-gray-700">
                      Original
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {inputText || "Your original message will appear here..."}
                  </p>
                </div>

                {/* After */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-[#4B3CDB]">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-semibold text-gray-700">
                      Optimized
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {result?.suggestion || "Your optimized message will appear here..."}
                  </p>
                </div>
              </div>
            </div>

            {/* Score Dashboard */}
            {result && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Message Quality Scores</h2> 
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Overall Score */}
                   <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-[#4B3CDB]">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Overall Score
                      </p>
                    <p className="text-3xl font-bold text-gray-900">{result.score}</p>
                  </div>

                  {/* Clarity */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">Clarity</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {result.clarity}
                    </p>
                  </div>

                  {/* Emotion */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">Emotion</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {result.emotion}
                    </p>
                  </div>

                  {/* Credibility */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Credibility
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {result.credibility}
                    </p>
                  </div>

                  {/* Market Effectiveness */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Market Effectiveness
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {result.market_effectiveness}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Tone Adjuster & Persona Picker */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Tone Adjuster */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Tone Adjuster
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Formal</span>
                    <span>Casual</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={tone}
                    onChange={(e) => setTone(Number(e.target.value))}
                     aria-label="Tone slider"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#4B3CDB]"
                  />
                  <div className="text-center">
                    <span className="inline-block px-4 py-2 bg-gradient-to-r from-[#4B3CDB] to-[#6C5CE7] text-white rounded-full text-sm font-semibold">
                      {tone < 30 ? "Formal" : tone < 70 ? "Balanced" : "Casual"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Persona Picker */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Target Persona
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {personas.map((persona) => (
                    <button
                      key={persona.id}
                      onClick={() => setSelectedPersona(persona.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedPersona === persona.id
                          ? "border-[#4B3CDB] bg-gradient-to-br from-blue-50 to-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-3xl mb-2">{persona.emoji}</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {persona.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <button className="px-8 py-3 bg-gradient-to-r from-[#4B3CDB] to-[#6C5CE7] text-white rounded-full font-semibold hover:shadow-xl transition-all hover:scale-105">
                Apply Rewrite
              </button>
              <Link
                href="/dashboard"
                className="px-8 py-3 bg-white border-2 border-gray-300 text-gray-900 rounded-full font-semibold hover:border-[#4B3CDB] hover:text-[#4B3CDB] transition-all"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
