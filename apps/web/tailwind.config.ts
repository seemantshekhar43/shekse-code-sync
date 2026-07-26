import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        border: "var(--border)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        green: "var(--green)",
        "green-soft": "var(--green-soft)",
        medium: "var(--medium)",
        hard: "var(--hard)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "-apple-system", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Fira Code", "monospace"],
      },
      borderRadius: {
        card: "10px",
        shell: "14px",
        btn: "9px",
        pill: "20px",
      },
      boxShadow: {
        shell: "0 18px 44px -20px rgba(40,34,28,.3)",
      },
    },
  },
  plugins: [],
};

export default config;
