/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0D1B2A',
          800: '#122233',
          700: '#1A2F4A',
          600: '#1E3A5F',
        },
        gold: {
          DEFAULT: '#C9973A',
          light: '#D4AA5C',
          dark: '#A87B2A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        base: ['16px', '1.6'],
      },
      minHeight: {
        tap: '48px',
      },
    },
  },
  plugins: [],
};
