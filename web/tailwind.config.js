/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '400px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Base colors - Professional charcoal/slate palette
        'surface-base': '#0C0C0E',      // Near-black base
        'surface-elevated': '#141416',   // Elevated surfaces (cards)
        'surface-hover': '#1A1A1D',      // Hover states
        'surface-border': '#262629',     // Subtle borders

        // Legacy aliases for gradual migration
        'cronos-deep': '#0C0C0E',
        'card-surface': '#141416',

        // Accent - Blue used sparingly
        'accent': '#3B82F6',             // Primary accent (softer blue)
        'accent-muted': '#2563EB',       // Darker accent
        'accent-subtle': 'rgba(59, 130, 246, 0.1)', // Very subtle accent bg

        // Legacy alias
        'neon-cyan': '#3B82F6',
        'neon-blue': '#2563EB',

        // Text hierarchy
        'text-primary': '#F4F4F5',       // Primary text (slightly off-white)
        'text-secondary': '#71717A',     // Secondary text (zinc-500)
        'text-tertiary': '#52525B',      // Tertiary text (zinc-600)

        // Semantic status - Muted versions
        'status-safe': '#22C55E',        // Green-500 (less saturated)
        'status-warning': '#EAB308',     // Yellow-500
        'status-danger': '#EF4444',      // Red-500
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        // Removed neon gradients - use solid colors or very subtle gradients
        'accent-gradient': 'linear-gradient(135deg, #3B82F6, #2563EB)',
      },
      boxShadow: {
        // Subtle, professional shadows (no glow)
        'soft': '0 1px 3px rgba(0, 0, 0, 0.3)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'elevated': '0 8px 24px rgba(0, 0, 0, 0.5)',
        // Focus ring
        'focus': '0 0 0 2px rgba(59, 130, 246, 0.3)',
      },
      animation: {
        'fadeIn': 'fadeIn 0.2s ease-out',
        'slideUp': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        'fadeIn': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slideUp': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        'card': '12px',
      },
    },
  },
  plugins: [],
}
