/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        shakya: {
          'bg-primary': '#0a0a0f',
          'bg-secondary': '#141420',
          'bg-card': '#1a1a2e',
          'cyan': '#00d9ff',
          'blue': '#0080ff',
          'text-primary': '#ffffff',
          'text-secondary': '#a0aec0',
          'border': '#2d3748',
        }
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'cyan-glow': '0 0 30px rgba(0, 217, 255, 0.15)',
        'blue-glow': '0 0 30px rgba(0, 128, 255, 0.15)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'gradient-cyan-blue': 'linear-gradient(135deg, #00d9ff 0%, #0080ff 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0a0a0f 0%, #141420 100%)',
      }
    },
  },
  plugins: [],
}
