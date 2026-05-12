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
          DEFAULT: "#256B5A",
          hover: "#1D594A",
          light: "rgba(37,107,90,0.1)",
        },
        secondary: "#5E9C8A",
        background: "#F5F6F7",
        surface: "#FFFFFF",
        "text-primary": "#1F2933",
        "text-secondary": "#6B7280",
        border: "#E8ECF0",
        success: "#2E8B57",
        info: "#4B7BE5",
        warning: "#D9A441",
        critical: "#C65A5A",
        high: "#C65A5A",
        medium: "#D9A441",
        low: "#2E8B57",
        inactive: "#B8BEC6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "page-title": ["30px", { lineHeight: "1.2", fontWeight: "700" }],
        "section-title": ["20px", { lineHeight: "1.3", fontWeight: "600" }],
        "metric": ["34px", { lineHeight: "1.1", fontWeight: "700" }],
        "body": ["15px", { lineHeight: "1.5" }],
        "label": ["13px", { lineHeight: "1.4", fontWeight: "500" }],
        "caption": ["12px", { lineHeight: "1.4" }],
      },
      borderRadius: {
        card: "16px",
        button: "8px",
        input: "8px",
      },
      spacing: {
        "card": "20px",
        "section": "32px",
      },
      boxShadow: {
        "card": "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
