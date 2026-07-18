import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Ink + paper engineering palette
        ink: "hsl(222 38% 14%)",
        "ink-soft": "hsl(222 22% 32%)",
        paper: "hsl(40 33% 96%)",
        "paper-2": "hsl(40 30% 92%)",
        line: "hsl(222 20% 80%)",
        "line-strong": "hsl(222 24% 64%)",
        accent: "hsl(18 85% 52%)", // signal orange
        "accent-ink": "hsl(18 90% 30%)",
        blueprint: "hsl(205 70% 42%)",
        "blueprint-deep": "hsl(205 75% 30%)",
        bug: "hsl(0 68% 50%)",
        muted: "hsl(222 14% 44%)",
        "muted-fg": "hsl(222 12% 54%)",
        card: "hsl(40 33% 98%)",
        surface: "hsl(40 30% 90%)",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        lg: "0.375rem",
        md: "0.25rem",
        sm: "0.125rem",
      },
      boxShadow: {
        lift: "0 1px 0 hsl(222 38% 14% / 0.04), 0 8px 24px -12px hsl(222 38% 14% / 0.28)",
        drag: "0 18px 40px -16px hsl(222 38% 14% / 0.45)",
      },
      keyframes: {
        "rail-in": {
          "0%": { transform: "translateY(-8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "card-in": {
          "0%": { transform: "translateY(6px) scale(0.99)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.96)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "rail-in": "rail-in 0.5s cubic-bezier(0.2,0.8,0.2,1) both",
        "card-in": "card-in 0.35s cubic-bezier(0.2,0.8,0.2,1) both",
        "pop-in": "pop-in 0.18s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
