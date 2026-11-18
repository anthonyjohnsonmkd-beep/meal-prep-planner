/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: { 900: '#0F3D2E', 700: '#166534' },
        sage: { 500: '#4C956C' },
        mint: { 300: '#A8D5BA', 100: '#E6F2EA' },
        paper: '#F9FCF8',
        apricot: '#F4A261', butter: '#F6D186', coral: '#E76F51', peach: '#FDE3CC', amber: '#C8702A',
      },
      fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'] },
    },
  },
  plugins: [],
}
