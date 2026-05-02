/** @type {import('tailwindcss').Config} */
export default {
  // 告诉 Tailwind 在哪些文件里扫描 class 名，只打包用到的样式
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        "fade-in": "fadeIn 0.35s ease-out",
        "mood-bounce": "moodBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "mood-float": "moodFloat 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        moodBounce: {
          "0%": { transform: "scale(0.3) rotate(-10deg)", opacity: "0" },
          "50%": { transform: "scale(1.15) rotate(5deg)", opacity: "1" },
          "70%": { transform: "scale(0.95) rotate(-2deg)" },
          "100%": { transform: "scale(1) rotate(0deg)" },
        },
        moodFloat: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
