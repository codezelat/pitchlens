"use client";

import Link from "next/link";

export default function DashboardPage() {
  // Mock data for demonstration
  const marketResonanceScore = 87;
  const clarityScore = 92;
  const emotionScore = 78;
  const credibilityScore = 85;

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
              <div className="flex gap-4">
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
                    Strong Clarity
                  </h4>
                  <p className="text-sm text-gray-600">
                    Your message is clear and easy to understand. Keep this
                    consistency.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Emotional Resonance Opportunity
                  </h4>
                  <p className="text-sm text-gray-600">
                    Consider adding more compelling emotional triggers to
                    increase engagement.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Good Credibility
                  </h4>
                  <p className="text-sm text-gray-600">
                    Your message establishes trust. Adding data points could
                    enhance it further.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Recommendations
            </h3>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4B3CDB] text-white flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Add social proof:</span>{" "}
                    Include testimonials or metrics to boost credibility
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4B3CDB] text-white flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">
                      Strengthen emotional appeal:
                    </span>{" "}
                    Use power words and storytelling elements
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4B3CDB] text-white flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Call-to-action:</span> Make
                    your next steps crystal clear and compelling
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

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
      </div>
    </div>
  );
}
