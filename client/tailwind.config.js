/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F5E57',
          50: '#E8F5F3',
          100: '#D1EBE7',
          200: '#A3D7CF',
          300: '#75C3B7',
          400: '#47AF9F',
          500: '#0F5E57',
          600: '#0D534D',
          700: '#0A3F3A',
          800: '#072B28',
          900: '#041715',
        },
        surface: '#F7F8FA',
        muted: '#6B7280',
        border: '#E5E7EB',
        status: {
          'low-text': '#B45309',
          'low-bg': '#FEF3C7',
          'high-text': '#B45309',
          'high-bg': '#FEF3C7',
          'critical-text': '#B91C1C',
          'critical-bg': '#FEE2E2',
          'ok-text': '#166534',
          'ok-bg': '#DCFCE7',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'Noto Sans Telugu',
          'Noto Sans Devanagari',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      spacing: {
        4.5: '1.125rem',
        13: '3.25rem',
        15: '3.75rem',
        18: '4.5rem',
        22: '5.5rem',
      },
      fontSize: {
        'patient-base': ['1.125rem', { lineHeight: '1.75rem' }],
        'patient-heading': ['1.5rem', { lineHeight: '2rem' }],
        'patient-title': ['1.75rem', { lineHeight: '2.25rem' }],
      },
      fontVariantNumeric: {
        tabular: 'tabular-nums',
      },
      minHeight: {
        tap: '48px',
      },
      minWidth: {
        tap: '48px',
      },
      maxWidth: {
        patient: '720px',
        staff: '1200px',
      },
    },
  },
  plugins: [],
};
