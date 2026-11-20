// Adds a short, genuinely useful section to the thin Kids Corner pages. Safe to re-run. Pages stay hidden (noindex) until restore-kids.mjs is run.
import fs from 'fs';
import content from './kids-content.mjs';
let n = 0;
for (const [slug, [h2, text]] of Object.entries(content)) {
  const f = 'D:/GM_Claude/kids/' + slug + '/index.html'; let h = fs.readFileSync(f, 'utf8');
  h = h.replace(/<!-- gm:kidsguide:start -->[\s\S]*?<!-- gm:kidsguide:end -->/, '');
  const block = '<!-- gm:kidsguide:start --><section class="section"><div class="container prose" style="max-width:860px"><h2>' + h2 + '</h2><p>' + text.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</p></div></section><!-- gm:kidsguide:end -->';
  const i = h.lastIndexOf('</main>'); if (i < 0) { console.log('no main', slug); continue; }
  h = h.slice(0, i) + block + '\n' + h.slice(i); fs.writeFileSync(f, h, 'utf8'); n++;
}
console.log('kids pages extended:', n);
