/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#e6f2ff',
          100: '#cce4ff',
          200: '#99caff',
          300: '#66afff',
          400: '#3395ff',
          500: '#007aff',
          600: '#006ee6',
          700: '#0062cc',
          800: '#0056b3',
          900: '#004a99',
        },
      },
    },
  },
  plugins: [],
};
