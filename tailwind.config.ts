import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        nhs: {
          blue: '#005EB8',
          'dark-blue': '#003087',
          'light-blue': '#41B6E6',
          aqua: '#00A9CE',
          green: '#009639',
          yellow: '#FFB81C',
          red: '#DA291C',
          white: '#FFFFFF',
          grey: '#768692',
          'pale-grey': '#E8EDEE',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
