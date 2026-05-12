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
          DEFAULT: "#3C50E0",
          hover: "#3144D1",
          light: "rgba(60, 80, 224, 0.1)",
        },
        secondary: "#80CAEE",
        background: "#F1F5F9",
        surface: "#FFFFFF",
        boxdark: "#24303F",
        "boxdark-2": "#1C2434",
        "body": "#64748B",
        "bodydark": "#AEB7C0",
        "bodydark1": "#DEE4EE",
        "bodydark2": "#8A99AF",
        "text-primary": "#1C2434",
        "text-secondary": "#64748B",
        border: "#E2E8F0",
        stroke: "#E2E8F0",
        success: "#219653",
        danger: "#D34053",
        warning: "#FFA70B",
        info: "#3C50E0",
        critical: "#D34053",
        high: "#FFA70B",
        medium: "#3C50E0",
        low: "#219653",
        inactive: "#AEB7C0",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "page-title": ["28px", { lineHeight: "1.2", fontWeight: "700" }],
        "section-title": ["18px", { lineHeight: "1.3", fontWeight: "600" }],
        "metric": ["32px", { lineHeight: "1.1", fontWeight: "700" }],
        "body": ["15px", { lineHeight: "1.5" }],
        "label": ["14px", { lineHeight: "1.4", fontWeight: "500" }],
        "caption": ["12px", { lineHeight: "1.4" }],
      },
      borderRadius: {
        card: "2px",
        button: "4px",
        input: "4px",
      },
      spacing: {
        "card": "24px",
        "section": "32px",
      },
      boxShadow: {
        "card": "0px 8px 13px 0px rgba(0, 0, 0, 0.05)",
        "card-hover": "0px 10px 15px 0px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
export default config;
