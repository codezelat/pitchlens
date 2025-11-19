import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  className = "",
  type = "button",
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";

  const variantStyles = {
    primary:
      "bg-gradient-to-r from-[#4B3CDB] to-[#6C5CE7] text-white hover:shadow-xl hover:scale-105",
    secondary:
      "bg-white text-[#4B3CDB] border-2 border-[#4B3CDB] hover:bg-[#4B3CDB] hover:text-white hover:scale-105",
    outline:
      "bg-white border-2 border-gray-300 text-gray-900 hover:border-[#4B3CDB] hover:text-[#4B3CDB]",
  };

  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </button>
  );
}
