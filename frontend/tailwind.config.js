/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // DonateAI dark theme design tokens
        da: {
          bg:        '#0B0F14',
          card:      '#171B22',
          sidebar:   '#11161D',
          border:    'rgba(255,255,255,0.08)',
          primary:   '#1D8CF8',
          hover:     '#3AA0FF',
          success:   '#22C55E',
          danger:    '#EF4444',
          warning:   '#F59E0B',
          text:      '#FFFFFF',
          secondary: '#A1A8B3',
          muted:     '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderColor: {
        DEFAULT: 'rgba(255,255,255,0.08)',
      },
    },
  },
  plugins: [],
}
