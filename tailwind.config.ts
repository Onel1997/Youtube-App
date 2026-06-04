import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gaming: {
          dark: "#0a0a0f",
          darker: "#050508",
          card: "#12121a",
          border: "#1e1e2e",
          purple: "#a855f7",
          neon: "#c084fc",
          accent: "#7c3aed",
          glow: "#e879f9",
        },
      },
      boxShadow: {
        neon: "0 0 20px rgba(168, 85, 247, 0.3)",
        "neon-sm": "0 0 10px rgba(168, 85, 247, 0.2)",
      },
      animation: {
        pulse_slow: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
