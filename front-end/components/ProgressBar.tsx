interface ProgressBarProps {
  value: number;
  max?: number;
  color?: "primary" | "green" | "yellow" | "red";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  color = "primary",
  size = "md",
  showLabel = false,
  className = "",
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const colorStyles = {
    primary: "from-[#4B3CDB] to-[#6C5CE7]",
    green: "from-green-500 to-emerald-500",
    yellow: "from-yellow-500 to-orange-500",
    red: "from-red-500 to-pink-500",
  };

  const sizeStyles = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`w-full bg-gray-200 rounded-full ${sizeStyles[size]} overflow-hidden`}
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colorStyles[color]} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}
