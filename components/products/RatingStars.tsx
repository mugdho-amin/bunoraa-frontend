import * as React from "react";
import { Star as StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function RatingStar({ filled, size = "md" }: { filled: boolean; size?: "sm" | "md" | "lg" }) {
  const sizeMap = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <StarIcon
      aria-hidden="true"
      className={cn(sizeMap[size], filled ? "fill-accent text-accent" : "text-border")}
      strokeWidth={1.8}
    />
  );
}

export function RatingStars({
  rating = 0,
  count,
  className,
  showCount = true,
  size = "md",
}: {
  rating?: number | null;
  count?: number | null;
  className?: string;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const safeRating = Number.isFinite(rating as number) ? Number(rating) : 0;
  const rounded = Math.round(safeRating);

  return (
    <div className={cn("flex items-center gap-1 text-xs text-muted-foreground", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <RatingStar key={index} filled={index < rounded} size={size} />
        ))}
      </div>
      {showCount && typeof count === "number" ? (
        <span className="text-xs text-muted-foreground">({count})</span>
      ) : null}
    </div>
  );
}
