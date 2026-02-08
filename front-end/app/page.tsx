import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1C1A4A] via-[#4B3CDB] to-[#6C5CE7]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/10 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <span className="text-[#4B3CDB] font-bold text-xl">P</span>
              </div>
              <span className="text-white font-semibold text-xl">
                PitchLens
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="#features"
                className="text-white/80 hover:text-white transition-colors text-sm"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-white/80 hover:text-white transition-colors text-sm"
              >
                How It Works
              </Link>
              <Link
                href="/app"
                className="px-5 py-2 bg-white text-[#4B3CDB] rounded-full font-medium text-sm hover:shadow-xl transition-all hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
              Analyze. Improve.
              <br />
              Win Customers.
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
              Transform your messaging with AI-powered analysis. PitchLens helps
              you craft compelling content that resonates with your audience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/app"
                className="px-8 py-4 bg-white text-[#4B3CDB] rounded-full font-semibold text-lg hover:shadow-2xl transition-all hover:scale-105"
              >
                Start Analyzing
              </Link>
              <Link
                href="#how-it-works"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full font-semibold text-lg border border-white/20 hover:bg-white/20 transition-all"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Powerful Message Intelligence
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to create high-impact messaging that converts
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Input Handler */}
            <div className="group p-8 rounded-3xl bg-white border border-gray-200 hover:border-[#4B3CDB] hover:shadow-2xl transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4B3CDB] to-[#6C5CE7] flex items-center justify-center mb-6">
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Input Handler
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Paste your text or enter a URL. We extract and analyze your
                content instantly.
              </p>
            </div>

            {/* AI Analysis */}
            <div className="group p-8 rounded-3xl bg-white border border-gray-200 hover:border-[#4B3CDB] hover:shadow-2xl transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4B3CDB] to-[#6C5CE7] flex items-center justify-center mb-6">
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
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                AI Analysis
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Advanced algorithms evaluate tone, clarity, emotion, and market
                resonance.
              </p>
            </div>

            {/* Rewrite Engine */}
            <div className="group p-8 rounded-3xl bg-white border border-gray-200 hover:border-[#4B3CDB] hover:shadow-2xl transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4B3CDB] to-[#6C5CE7] flex items-center justify-center mb-6">
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Rewrite Engine
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Get AI-powered suggestions with tone adjustment and persona
                targeting.
              </p>
            </div>

            {/* Score Dashboard */}
            <div className="group p-8 rounded-3xl bg-white border border-gray-200 hover:border-[#4B3CDB] hover:shadow-2xl transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4B3CDB] to-[#6C5CE7] flex items-center justify-center mb-6">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Score Dashboard
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Visual scoring with detailed metrics on clarity, emotion, and
                credibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Simple. Fast. Effective.
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transform your messaging in three easy steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4B3CDB] to-[#6C5CE7] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Input Your Message
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Paste your text or provide a URL. Our system handles the rest.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4B3CDB] to-[#6C5CE7] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Get AI Analysis
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Receive comprehensive scoring and actionable insights instantly.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4B3CDB] to-[#6C5CE7] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Optimize & Deploy
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Use our rewrite suggestions and export your improved content.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-8 bg-gradient-to-br from-[#1C1A4A] via-[#4B3CDB] to-[#6C5CE7]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Messaging?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join thousands of professionals who are creating better content with
            PitchLens.
          </p>
          <Link
            href="/app"
            className="inline-block px-8 py-4 bg-white text-[#4B3CDB] rounded-full font-semibold text-lg hover:shadow-2xl transition-all hover:scale-105"
          >
            Start Your Free Analysis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-8 bg-[#1C1A4A]">
        <div className="max-w-7xl mx-auto text-center text-white/60">
          <p>&copy; {new Date().getFullYear()} PitchLens. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
