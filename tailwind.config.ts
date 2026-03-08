import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "375px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      fontFamily: {
        display: ["Prompt", "sans-serif"],
        body:    ["Kanit",  "sans-serif"],
        accent:  ["Playfair Display", "serif"],
        // legacy alias
        thai:    ["Prompt", "sans-serif"],
      },
      colors: {
        void: {
          950: "#06000f",
          900: "#0c041e",
          800: "#120832",
          700: "#1c0c48",
        },
        amethyst: {
          300: "#ddd6fe",
          400: "#c084fc",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
        },
        gold: {
          300: "#fde68a",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        rose: {
          DEFAULT: "#E879A0",
        },
        // legacy
        cosmic: {
          900: "#06000f",
          800: "#0c041e",
          700: "#120832",
          600: "#1c0c48",
          500: "#4a1280",
        },
        mystic: {
          100: "#e9d5ff",
          200: "#d8b4fe",
          300: "#c084fc",
          400: "#a855f7",
          500: "#9333ea",
        },
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        twinkle: "twinkle 2s ease-in-out infinite alternate",
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spin 20s linear infinite",
      },
      keyframes: {
        twinkle: {
          "0%": { opacity: "0.2", transform: "scale(0.8)" },
          "100%": { opacity: "1", transform: "scale(1.2)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      backgroundImage: {
        "cosmic-gradient":
          "radial-gradient(ellipse at top, #1a0435 0%, #0a0118 60%, #000 100%)",
        "gold-shimmer":
          "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
