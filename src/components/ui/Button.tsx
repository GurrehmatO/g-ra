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
      "bg-primary text-primary-foreground hover:bg-primary/90 border border-primary",
    secondary:
      "bg-white text-foreground border border-border hover:bg-muted",
    destructive:
      "bg-destructive text-white hover:bg-destructive/90 border border-destructive",
    ghost: "bg-transparent text-foreground hover:bg-muted border border-transparent",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
