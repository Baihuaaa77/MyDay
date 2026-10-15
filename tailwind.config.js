/** @type {import('tailwindcss').Config} */

/** 颜色全部来自 index.css 中的 CSS 变量，切换深色模式时只需替换变量 */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: token("canvas"),
        surface: {
          DEFAULT: token("surface"),
          2: token("surface-2"),
          3: token("surface-3"),
        },
        line: {
          DEFAULT: token("line"),
          strong: token("line-strong"),
        },
        ink: {
          DEFAULT: token("ink"),
          2: token("ink-2"),
          3: token("ink-3"),
        },
        brand: {
          DEFAULT: token("brand"),
          strong: token("brand-strong"),
          soft: token("brand-soft"),
          ink: token("brand-ink"),
        },
        warm: {
          DEFAULT: token("warm"),
          soft: token("warm-soft"),
        },
        danger: {
          DEFAULT: token("danger"),
          soft: token("danger-soft"),
        },
      },
      boxShadow: {
        card: "0 1px 2px rgb(var(--shadow) / 0.05), 0 8px 28px rgb(var(--shadow) / 0.06)",
        lift: "0 2px 6px rgb(var(--shadow) / 0.06), 0 18px 48px rgb(var(--shadow) / 0.12)",
        brand: "0 8px 22px rgb(var(--brand) / 0.28)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out both",
        "pop-in": "popIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "slide-up": "slideUp 0.28s cubic-bezier(0.22, 1, 0.36, 1) both",
        float: "float 3.2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        popIn: {
          "0%": { transform: "scale(0.4)", opacity: "0" },
          "60%": { transform: "scale(1.12)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
    },
  },
  plugins: [],
};
