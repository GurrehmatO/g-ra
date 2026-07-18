import * as React from "react";
import { cn } from "@/lib/utils";
export { Button } from "./Button";

const fieldBase =
  "flex w-full rounded-sm border border-line bg-card px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-muted-fg hover:border-line-strong focus:border-accent focus:ring-1 focus:ring-accent";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldBase, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldBase, "min-h-[80px] resize-y", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(fieldBase, "cursor-pointer appearance-none bg-no-repeat pr-8", className)}
    style={{
      backgroundImage:
        "linear-gradient(45deg, transparent 50%, hsl(222 24% 64%) 50%), linear-gradient(135deg, hsl(222 24% 64%) 50%, transparent 50%)",
      backgroundPosition: "calc(100% - 14px) 50%, calc(100% - 9px) 50%",
      backgroundSize: "5px 5px, 5px 5px",
    }}
    {...props}
  />
));
Select.displayName = "Select";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "spec mb-1.5 block font-semibold text-ink-soft",
        className
      )}
      {...props}
    />
  );
}

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "panel p-5",
        className
      )}
      {...props}
    />
  );
}
