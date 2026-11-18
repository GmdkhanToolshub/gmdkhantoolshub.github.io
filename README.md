# GM Tools Hub

Free, private, in-browser tools, guides and a safe Kids Corner. Live at https://gmdkhantoolshub.github.io/

Static site (HTML, CSS and vanilla JavaScript) deployed by GitHub Pages from the `main` branch. No build step is needed to publish; the `build/` scripts only maintain shared files.

## Structure
- `assets/css/premium.css`: design tokens and the premium layer (light/dark themes, accents, motion). Kids Corner follows the same tokens.
- `assets/js/`: `config.js`, `util.js`, `main.js`, `premium.js` are combined into `core.js` by `python build/make-core.py`.
- `build/sync_header.py`: regenerates the shared header/navigation on every page.
- `build/bump.py .`: refreshes `?v=` cache-busting hashes after CSS/JS edits.
- `sitemap.xml`, `robots.txt`, `llms.txt`, `manifest.webmanifest`, `404.html`: discovery and routing files.
- `kids/`: Kids Corner (drawing, colouring, games, Mango the talking cat). No sign-up, no chat, no tracking of children.

## Maintenance
1. Edit the source files.
2. `python build/make-core.py` then `python build/bump.py .`
3. Test locally with `py -m http.server 8765` and commit to `main`.
