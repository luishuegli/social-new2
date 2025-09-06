/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'background-primary': '#0A0A0A',
        'background-secondary': '#1A1A1A',
        'content-primary': '#FFFFFF',
        'content-secondary': '#B8B8B8',
        'border-separator': '#333333',
        'accent-primary': '#B0B0B0',
        'accent-secondary': '#E5E5E5',
        'accent-muted': '#666666',
        'glass-primary': 'rgba(255, 255, 255, 0.1)',
        'glass-secondary': 'rgba(255, 255, 255, 0.05)',
        'support-success': '#34C759',
        'support-error': '#FF3B30',
        'support-warning': '#FF9500',
      },
      fontSize: {
        'display-title': '3rem',       // 48px
        'heading-1': '2.125rem',    // 34px
        'heading-2': '1.5rem',        // 24px
        'body': '1rem',              // 16px
        'button-label': '1rem',        // 16px
        'caption': '0.875rem',     // 14px
      },
      fontFamily: {
        'system': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
        'input': '12px',
        'glass': '20px', // For Liquid Glass components
      },
      spacing: {
        'page-padding': '24px',
        'section-spacing': '32px',
        'list-item-spacing': '16px',
      },
      // For the Liquid Glass gradient
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #4A00E0, #8E2DE2)',
      },
      backdropBlur: {
        'glass': '20px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
} 