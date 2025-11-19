interface ScoreCircleProps {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export default function ScoreCircle({
  score,
  size = "md",
  label,
}: ScoreCircleProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-pink-500";
  };

  const sizeStyles = {
    sm: { container: "w-20 h-20", text: "text-2xl", subtext: "text-xs" },
    md: { container: "w-32 h-32", text: "text-4xl", subtext: "text-sm" },
    lg: { container: "w-40 h-40", text: "text-6xl", subtext: "text-sm" },
  };

  const currentSize = sizeStyles[size];

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${
          currentSize.container
        } rounded-full bg-gradient-to-br ${getScoreColor(
          score
        )} flex items-center justify-center shadow-xl`}
      >
        <div className="text-center text-white">
          <div className={`font-bold ${currentSize.text}`}>{score}</div>
          <div className={`opacity-80 ${currentSize.subtext}`}>/ 100</div>
        </div>
      </div>
      {label && (
        <span className="text-sm font-medium text-gray-700">{label}</span>
      )}
    </div>
  );
}
