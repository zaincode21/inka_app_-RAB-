/** @type {import('tailwindcss').Config} */
const nativewindPreset = require('./node_modules/nativewind/dist/tailwind');

module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './index.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  presets: [nativewindPreset],
  plugins: [],
};