/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Emergency Operations Center palette
        eoc: {
          bg:        '#07090f',
          surface:   '#0d1117',
          card:      '#111827',
          border:    '#1f2937',
          hover:     '#1a2332',
          muted:     '#374151',
        },
        emergency: {
          DEFAULT: '#dc2626',
          light:   '#ef4444',
          dark:    '#b91c1c',
          subtle:  '#1a0808',
        },
        warning: {
          DEFAULT: '#ea580c',
          light:   '#f97316',
          dark:    '#c2410c',
          subtle:  '#1a0e05',
        },
        success: {
          DEFAULT: '#16a34a',
          light:   '#22c55e',
          dark:    '#15803d',
          subtle:  '#071a0d',
        },
        info: {
          DEFAULT: '#2563eb',
          light:   '#3b82f6',
          dark:    '#1d4ed8',
          subtle:  '#050e1f',
        },
        severity: {
          high:   '#dc2626',
          medium: '#ea580c',
          low:    '#16a34a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
      },
      boxShadow: {
        card:   '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
        panel:  '0 4px 6px rgba(0,0,0,0.5)',
        modal:  '0 20px 60px rgba(0,0,0,0.8)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-in':   'slideIn 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
