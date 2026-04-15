/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: '#2563EB',
        secondary: '#0D9488',
        tertiary: '#BC4800',
        neutral: '#F9FAFB',
      }
    },
  },
  plugins: [],
}
