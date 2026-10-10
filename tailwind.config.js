/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        youtube: {
          red: '#FF0000',
          darkRed: '#CC0000',
          dark: '#0F0F0F',
          surface: '#181818',
          card: '#212121',
          border: '#303030',
          hover: '#272727',
          active: '#3F3F3F',
          lightBg: '#F9F9F9',
          lightSurface: '#FFFFFF',
          lightBorder: '#E5E5E5',
          lightHover: '#F2F2F2',
          textMuted: '#AAAAAA',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
