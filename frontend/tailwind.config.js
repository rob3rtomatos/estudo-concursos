/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary:   '#0f172a',
        secondary: '#1e293b',
        accent:    '#6366f1'
      }
    }
  },
  plugins: []
};
