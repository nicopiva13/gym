/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b", // zinc-950
        surface: "#18181b", // zinc-900
        surfaceHover: "#27272a", // zinc-800
        primary: "#39ff14", // Electric Green
        primaryHover: "#32e313",
        secondary: "#ff5500", // Neon Orange
        muted: "#a1a1aa", // zinc-400
        textLight: "#f4f4f5", // zinc-100
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Barlow Condensed', 'Outfit', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
