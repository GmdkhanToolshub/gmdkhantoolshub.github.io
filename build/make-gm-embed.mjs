// Builds the GM Embed section: /gm-embed/ and its six sub-pages. Run build/make-embed-pages.mjs first (it writes embed/widgets.json).
// Usage: node build/make-gm-embed.mjs
import { buildPage } from './page-shell.mjs';
import { all } from './pages/gm-embed.mjs';
for (const p of all) console.log(p.slug, buildPage(p));
