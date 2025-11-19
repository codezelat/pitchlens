import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  variant?: "default" | "gradient" | "bordered";
  hover?: boolean;
  className?: string;
}

export default function Card({
  children,
  variant = "default",
  hover = false,
  className = "",
}: CardProps) {
  const baseStyles = "rounded-2xl p-8 transition-all";

  const variantStyles = {
    default: "bg-white shadow-sm border border-gray-200",
    gradient:
      "bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100",
    bordered: "bg-white border-2 border-gray-200",
  };

  const hoverStyles = hover ? "hover:shadow-2xl hover:border-[#4B3CDB]" : "";

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${className}`}
    >
      {children}
    </div>
  );
}
