/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base colors
        'cronos-deep': '#0A1128',
        'card-surface': '#131B36',

        // Neon accents
        'neon-cyan': '#00F0FF',
        'neon-blue': '#0057FF',

        // Text
        'text-primary': '#FFFFFF',
        'text-secondary': '#A0AEC0',

        // Semantic status
        'status-safe': '#00FF94',
        'status-warning': '#FFD600',
        'status-danger': '#FF005C',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'Montserrat', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'neon-gradient': 'linear-gradient(135deg, #00F0FF, #0057FF)',
        'neon-gradient-hover': 'linear-gradient(135deg, #00F0FF, #3370FF)',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(0, 240, 255, 0.3)',
        'neon-strong': '0 0 30px rgba(0, 240, 255, 0.5)',
        'neon-safe': '0 0 20px rgba(0, 255, 148, 0.3)',
        'neon-warning': '0 0 20px rgba(255, 214, 0, 0.3)',
        'neon-danger': '0 0 20px rgba(255, 0, 92, 0.3)',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
        'fadeIn': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 240, 255, 0.6)' },
        },
        'glow': {
          '0%': { filter: 'brightness(1) drop-shadow(0 0 10px rgba(0, 240, 255, 0.5))' },
          '100%': { filter: 'brightness(1.2) drop-shadow(0 0 20px rgba(0, 240, 255, 0.8))' },
        },
        'fadeIn': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
