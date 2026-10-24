import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: "#04070D", // Cosmic Obsidian
          900: "#070B14",
          850: "#0B1120",
          800: "#0F172A",
          700: "#1E293B",
          600: "#334155",
          500: "#475569",
        },
        telemetry: {
          solar: "#F59E0B",     // Solar Flare Amber
          earth: "#00F0FF",     // Earth Comms Cyan
          optimal: "#10B981",   // Nominal Dual Window Green
          alert: "#EF4444",     // Shadow Alert Red
          muted: "#94A3B8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "Menlo", "monospace"],
      },
      letterSpacing: {
        "widest-xl": "0.2em",
        "widest-2xl": "0.25em",
      },
      backdropBlur: {
        xs: "2px",
        "20": "20px",
        "3xl": "64px",
      },
      boxShadow: {
        "glass": "0 8px 32px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.08)",
        "glass-lg": "0 16px 48px rgba(0,0,0,0.75), inset 0 0 0 1px rgba(255,255,255,0.1)",
        "bento": "0 8px 32px 0 rgba(0, 0, 0, 0.8), inset 0 0 0 1px rgba(255, 255, 255, 0.05)",
        "solar-glow": "0 0 24px -4px rgba(245, 158, 11, 0.55)",
        "earth-glow": "0 0 24px -4px rgba(0, 240, 255, 0.55)",
        "optimal-glow": "0 0 24px -4px rgba(16, 185, 129, 0.55)",
        "alert-glow": "0 0 24px -4px rgba(239, 68, 68, 0.55)",
        "telemetry-card": "0 4px 20px -2px rgba(0,0,0,0.6)",
      },
      animation: {
        "orbit": "orbit 20s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 4s ease-in-out infinite",
        "beacon": "beacon-pulse 1.8s cubic-bezier(0, 0, 0.2, 1) infinite",
        "glare": "glare 3.5s ease-in-out infinite",
      },
      keyframes: {
        orbit: {
          from: { transform: "rotate(0deg) translateX(120px) rotate(0deg)" },
          to: { transform: "rotate(360deg) translateX(120px) rotate(-360deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "beacon-pulse": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "70%, 100%": { transform: "scale(2.4)", opacity: "0" },
        },
        glare: {
          "0%": { transform: "translateX(-150%) skewX(-20deg)", opacity: "0" },
          "30%": { opacity: "0.6" },
          "60%, 100%": { transform: "translateX(250%) skewX(-20deg)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
