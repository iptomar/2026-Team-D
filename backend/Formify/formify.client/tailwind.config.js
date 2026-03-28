import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Usando as CSS variables já definidas
        'text': 'var(--text)',
        'text-h': 'var(--text-h)',
        'border': 'var(--border)',
        'accent': 'var(--accent)',
        'accent-bg': 'var(--accent-bg)',
        'accent-border': 'var(--accent-border)',
      },
      fontFamily: {
        'sans': 'var(--sans)',
        'heading': 'var(--heading)',
        'mono': 'var(--mono)',
      },
      boxShadow: {
        'custom': 'var(--shadow)',
      },
    },
  },
  plugins: [
    forms,
  ],
}