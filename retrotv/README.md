# RETRO-TV (React)

This project is a Vite + React + TypeScript migration of the provided RETRO-TV HTML UI.

Quick start:

```bash
npm install
npm run dev
```

Open http://localhost:5173

Notes:
- Tailwind is loaded via CDN in `index.html` for quick migration (no Tailwind build step).
- Fonts and Material Symbols are loaded from Google Fonts.
- To add Tailwind as a proper dependency, I can set it up with PostCSS if you want.
 
Tailwind setup:

- Tailwind, PostCSS and Autoprefixer added as devDependencies in `package.json`.
- `tailwind.config.cjs` and `postcss.config.cjs` were added.
- `src/index.css` now includes the Tailwind directives.

Run these commands to install dependencies and start the dev server:

```bash
npm install
npm run dev
```
