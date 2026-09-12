/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // BCC brand blues — pulled from the logo globe/circle
        brand: {
          DEFAULT: '#0A5EB0',   // deep BCC blue (primary actions, sidebar)
          dark:    '#083d7a',   // hover/active state
          light:   '#1E7FD8',   // lighter accent
          pale:    '#E8F4FB',   // very light blue background tint
        },
        // BCC red from the cross in the logo — used sparingly for danger actions
        danger: '#CC1111',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px 0 rgba(10,94,176,0.07)',
        'card-hover': '0 4px 16px 0 rgba(10,94,176,0.13)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};