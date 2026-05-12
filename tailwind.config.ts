import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        critical: "#dc3545",
        high: "#fd7e14",
        medium: "#ffc107",
        low: "#28a745",
      },
    },
  },
  plugins: [],
};
export default config;
