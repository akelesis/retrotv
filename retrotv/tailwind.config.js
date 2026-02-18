export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#135bec',
        'background-light': '#f6f6f8',
        'background-dark': '#0a0a0a',
        'retro-gray': '#c0c0c0',
        'retro-dark-gray': '#808080',
        'retro-yellow': '#ffff00',
        'retro-green': '#00ff41',
        'background-dark': '#101622',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['Share Tech Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
