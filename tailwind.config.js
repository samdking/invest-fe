const colors = require('tailwindcss/colors')

module.exports = {
  purge: ['./*.html', './css/*', './main.js'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        teal: colors.teal
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
