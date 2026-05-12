import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6366F1",
          hover: "#4F46E5",
          light: "rgba(99,102,241,0.12)",
        },
        secondary: "#20970B",
        neutral: "#9C9C9C",
        background: "#FAFAFA",
        surface: "#FFFFFF",
        "text-primary": "#0A0A0A",
        "text-secondary": "#6B6B6B",
        border: "#E8E8EC",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        critical: "#dc3545",
        high: "#fd7e14",
        medium: "#eab308",
        low: "#22c55e",
      },
      fontFamily: {
        display: ["General Sans", "system-ui", "sans-serif"],
        body: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        display: ["72px", { lineHeight: "1.1", letterSpacing: "-0.04em", fontWeight: "700" }],
        headline: ["60px", { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "700" }],
        "section-title": ["32px", { lineHeight: "1.2", letterSpacing: "-0.03em", fontWeight: "700" }],
        subhead: ["24px", { lineHeight: "1.3", letterSpacing: "-0.02em", fontWeight: "600" }],
        body: ["15px", { lineHeight: "1.5" }],
        small: ["13px", { lineHeight: "1.4" }],
        caption: ["12px", { lineHeight: "1.4" }],
        overline: ["11px", { lineHeight: "1.4", letterSpacing: "0.04em" }],
      },
      spacing: {
        "base": "4px",
        "2base": "8px",
        "3base": "12px",
        "4base": "16px",
        "5base": "20px",
        "6base": "24px",
        "8base": "32px",
        "10base": "40px",
        "12base": "48px",
        "16base": "64px",
        "20base": "80px",
        "24base": "96px",
      },
      borderRadius: {
        card: "12px",
        button: "6px",
        input: "6px",
      },
      boxShadow: {
        "card-hover": "0 8px 30px rgba(0,0,0,0.08)",
        "button-glow": "0 4px 12px rgba(99,102,241,0.35)",
        "card": "none",
      },
      ringWidth: {
        "focus": "3px",
      },
      ringColor: {
        "focus": "rgba(99,102,241,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
