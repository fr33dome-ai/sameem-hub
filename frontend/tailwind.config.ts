import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary:   'rgb(var(--primary) / <alpha-value>)',
        accent:    'rgb(var(--accent) / <alpha-value>)',
        success:   'rgb(var(--success) / <alpha-value>)',
        warning:   'rgb(var(--warning) / <alpha-value>)',
        danger:    'rgb(var(--danger) / <alpha-value>)',
        info:      'rgb(var(--info) / <alpha-value>)',
        surface:   'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        'text':    'rgb(var(--text) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',
        'text-dim': 'rgb(var(--text-dim) / <alpha-value>)',
        border:    'rgb(var(--border) / <alpha-value>)',
        // Saudi brand colors
        'saudi-green': '#006C35',
        'saudi-gold': '#C9A961'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        arabic: ['Tajawal', 'Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
