/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy': '#182A3A',
        'dark-red': '#511F33',
        'medium-pink': '#904F69',
        'light-pink': '#C18797',
        'dark-gray': '#485056',
        'medium-gray': '#979EA3',
        'light-gray': '#C8CBCB',
        'light-navy': '#DFE8F1',
        'deep-sea-blue': '#182A3A',
        'hover-outer-space': '#485056',
      },
      fontFamily: {
        'khula': ['Khula', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
