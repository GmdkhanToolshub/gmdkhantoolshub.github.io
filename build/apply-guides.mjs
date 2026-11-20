// Adds "Worked example" and "Practical tips" sections to tool pages. Safe to re-run (uses markers).
import fs from 'fs'; import path from 'path';
import content from './guide-content.mjs';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const strip = h => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
let changed = 0, skipped = 0;
for (const [slug, c] of Object.entries(content)) {
  const f = path.join(root, 'tools', slug, 'index.html');
  if (!fs.existsSync(f)) { console.log('missing page', slug); continue; }
  let h = fs.readFileSync(f, 'utf8');
  h = h.replace(/<!-- gm:guide:start -->[\s\S]*?<!-- gm:guide:end -->/, '');
  const main = (strip(h).match(/<main[\s\S]*?<\/main>/i) || [''])[0];
  const heads = [...main.matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)].map(x => x[1].replace(/<[^>]+>/g, '').toLowerCase());
  const hasEx = heads.some(x => /example/.test(x)), hasTips = heads.some(x => /tips|good to know/.test(x));
  let body = '';
  if (c.ex && !hasEx) body += '<h2>Worked example</h2><p>' + esc(c.ex) + '</p>';
  if (c.tips && !hasTips) body += '<h2>Practical tips</h2><ul>' + c.tips.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>';
  if (!body) { skipped++; continue; }
  const block = '<!-- gm:guide:start --><section class="section"><div class="container prose" style="max-width:860px">' + body + '</div></section><!-- gm:guide:end -->';
  const i = h.lastIndexOf('</main>');
  if (i < 0) { console.log('no </main>', slug); continue; }
  h = h.slice(0, i) + block + '\n' + h.slice(i);
  fs.writeFileSync(f, h, 'utf8'); changed++;
}
console.log('updated', changed, 'skipped', skipped);
