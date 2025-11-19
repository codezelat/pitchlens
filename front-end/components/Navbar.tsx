import Link from "next/link";

interface NavbarProps {
  variant?: "transparent" | "white";
}

export default function Navbar({ variant = "white" }: NavbarProps) {
  const isTransparent = variant === "transparent";

  return (
    <nav
      className={`fixed top-0 w-full z-50 border-b ${
        isTransparent
          ? "bg-white/10 backdrop-blur-lg border-white/10"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isTransparent
                  ? "bg-white"
                  : "bg-gradient-to-br from-[#4B3CDB] to-[#6C5CE7]"
              }`}
            >
              <span
                className={`font-bold text-xl ${
                  isTransparent ? "text-[#4B3CDB]" : "text-white"
                }`}
              >
                P
              </span>
            </div>
            <span
              className={`font-semibold text-xl ${
                isTransparent ? "text-white" : "text-gray-900"
              }`}
            >
              PitchLens
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="#features"
              className={`text-sm transition-colors ${
                isTransparent
                  ? "text-white/80 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className={`text-sm transition-colors ${
                isTransparent
                  ? "text-white/80 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              How It Works
            </Link>
            <Link
              href="/app"
              className={`px-5 py-2 rounded-full font-medium text-sm transition-all hover:scale-105 ${
                isTransparent
                  ? "bg-white text-[#4B3CDB] hover:shadow-xl"
                  : "bg-gradient-to-r from-[#4B3CDB] to-[#6C5CE7] text-white hover:shadow-xl"
              }`}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
