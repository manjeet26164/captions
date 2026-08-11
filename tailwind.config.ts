import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      backgroundImage: {
        'radial-glow': 'radial-gradient(circle at top, rgba(56, 189, 248, 0.28), transparent 45%)'
      },
      boxShadow: {
        glow: '0 20px 80px rgba(15, 23, 42, 0.2)'
      }
    }
  },
  plugins: []
};

export default config;
