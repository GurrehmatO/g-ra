import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "destructive" | "ghost";
}) {
  const variants: Record<string, string> = {
    primary:
      "bg-ink text-paper border border-ink hover:bg-ink-soft hover:border-ink-soft shadow-[3px_3px_0_hsl(18_85%_52%)] hover:shadow-[1px_1px_0_hsl(18_85%_52%)] hover:translate-x-[1px] hover:translate-y-[1px]",
    secondary:
      "bg-card text-ink border border-line hover:border-ink-soft hover:bg-surface",
    destructive:
      "bg-bug text-white border border-bug hover:bg-bug/90 shadow-[3px_3px_0_hsl(222_38%_14%/0.25)]",
    ghost:
      "bg-transparent text-ink border border-transparent hover:bg-surface",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-sm px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
