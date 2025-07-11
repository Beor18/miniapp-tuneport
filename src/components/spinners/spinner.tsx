import React from "react";

type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  xs: "w-3 h-3 border-[1.5px]",
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-[3px]",
  xl: "w-12 h-12 border-4",
};

export const Spinner = ({ size = "md", className }: SpinnerProps) => {
  return (
    <div className="flex items-center justify-center">
      <div
        className={`rounded-full border-transparent border-t-current animate-spin ${sizeClasses[size]} ${className}`}
        style={{
          borderRightColor: "currentColor",
          borderTopColor: "currentColor",
        }}
      />
    </div>
  );
};
