"use client";

import React, { memo } from "react";
import { HeartIcon } from "lucide-react";
import { Button } from "@Src/ui/components/ui/button";
import { useLikes } from "@Src/lib/hooks/useLikes";
import { cn } from "@Src/ui/lib/utils";

interface LikeButtonProps {
  nftId: string;
  initialLikesCount?: number;
  initialIsLiked?: boolean;
  variant?: "default" | "compact" | "minimal";
  className?: string;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

const LikeButtonComponent = function LikeButton({
  nftId,
  initialLikesCount = 0,
  initialIsLiked = false,
  variant = "default",
  className,
  showCount = true,
  size = "md",
  disabled = false,
}: LikeButtonProps) {
  const { likesCount, isLiked, isLoading, handleToggleLike } = useLikes({
    nftId,
    initialLikesCount,
    initialIsLiked,
  });

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const isDisabled = disabled || isLoading;

  if (variant === "minimal") {
    return (
      <button
        onClick={isDisabled ? undefined : handleToggleLike}
        disabled={isDisabled}
        className={cn(
          "flex items-center gap-1 text-white hover:text-red-500 transition-colors duration-200 disabled:opacity-50",
          isDisabled ? "cursor-not-allowed" : "",
          className
        )}
        title={
          isDisabled
            ? "Connect wallet to like"
            : isLiked
            ? "Quitar like"
            : "Dar like"
        }
      >
        <HeartIcon
          className={cn(
            iconSizes[size],
            "transition-all duration-200",
            isLiked
              ? "fill-red-500 text-red-500 scale-110"
              : "text-zinc-400 hover:text-red-500"
          )}
        />
        {showCount && likesCount > 0 && (
          <span className="text-xs text-zinc-400">{likesCount}</span>
        )}
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={isDisabled ? undefined : handleToggleLike}
        disabled={isDisabled}
        className={cn(
          "text-white hover:bg-white/10 transition-all duration-200 group relative",
          isDisabled ? "cursor-not-allowed" : "",
          className
        )}
        title={
          isDisabled
            ? "Connect wallet to like"
            : isLiked
            ? "Quitar like"
            : "Dar like"
        }
      >
        <HeartIcon
          className={cn(
            iconSizes[size],
            "transition-all duration-200",
            isLiked
              ? "fill-red-500 text-red-500 scale-110"
              : "text-zinc-400 group-hover:text-red-500 group-hover:scale-110"
          )}
        />
        {showCount && likesCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center">
            {likesCount > 99 ? "99+" : likesCount}
          </span>
        )}
      </Button>
    );
  }

  // Variant default
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={isDisabled ? undefined : handleToggleLike}
      disabled={isDisabled}
      className={cn(
        sizeClasses[size],
        "text-white hover:bg-white/10 transition-all duration-200 group bg-black/40 backdrop-blur-sm rounded-full border border-white/20",
        isDisabled ? "cursor-not-allowed" : "",
        className
      )}
      title={
        isDisabled
          ? "Connect wallet to like"
          : isLiked
          ? "Quitar like"
          : "Dar like"
      }
    >
      <div className="relative flex items-center justify-center">
        <HeartIcon
          className={cn(
            iconSizes[size],
            "transition-all duration-200",
            isLiked
              ? "fill-red-500 text-red-500 scale-110"
              : "text-zinc-400 group-hover:text-red-500 group-hover:scale-110"
          )}
        />
        {showCount && likesCount > 0 && (
          <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-white/80">
            {likesCount > 999 ? "999+" : likesCount}
          </span>
        )}
      </div>
    </Button>
  );
};

// Memoizar el componente para evitar re-renders innecesarios
export const LikeButton = memo(LikeButtonComponent);
