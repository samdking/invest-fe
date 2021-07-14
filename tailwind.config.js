const colors = require('tailwindcss/colors')

module.exports = {
  purge: ['./*.html', './css/*', './main.js'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        teal: colors.teal
      },
      gridTemplateColumns: {
        sidebar: 'minmax(350px, 2fr) 5fr'
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
