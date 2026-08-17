import { useState } from "react";
import { cn } from "@/lib/utils";

type AppIconProps = {
  src: string | null | undefined;
  name: string;
  className?: string;
};

export function AppIcon({ src, name, className }: AppIconProps) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (!src || failed) {
    return (
      <div
        aria-hidden
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-[22%] bg-accent text-lg font-semibold",
          className,
        )}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={cn(
        "size-12 shrink-0 rounded-[22%] bg-accent object-cover",
        className,
      )}
      onError={() => setFailed(true)}
    />
  );
}
