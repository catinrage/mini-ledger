import animated from 'tailwindcss-animated';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#f2f5fc',
          100: '#e1e8f8',
          200: '#cbd8f2',
          300: '#a6bfea',
          400: '#7c9dde',
          500: '#5d7dd4',
          600: '#4963c7',
          700: '#3f51b5',
          800: '#394494',
          900: '#323d76',
          950: '#222749',
        },
      },
      fontSize: {
        us: '0.625rem',
      },
      screens: {
        xs: '475px',
      },
      width: {
        100: '25rem',
        120: '30rem',
        140: '35rem',
        160: '40rem',
        180: '45rem',
        200: '50rem',
      },
      typography: () => ({
        DEFAULT: {
          css: {
            '.line-clamp': {
              display: '-webkit-box',
              '-webkit-box-orient': 'vertical',
              overflow: 'hidden',
            },
          },
        },
      }),
    },
  },
  plugins: [
    animated,
    function ({ addUtilities }) {
      const newUtilities = {};
      Array.from(Array(10)).forEach((_, index) => {
        const count = index + 1;
        newUtilities[`.line-clamp-${count}`] = {
          '-webkit-line-clamp': `${count.toString()}`,
        };
      });
      addUtilities(newUtilities);
    },
  ],
};
