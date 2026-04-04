/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
      },
      colors: {
        dark:  "#0C1618",
        teal:  "#004643",
        "teal-mid":  "#005c58",
        "teal-pale": "#e8f0ef",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "28px",
      },
    },
  },
  plugins: [],
};
