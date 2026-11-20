// Adds a "Read the guide" link from each tool page to the matching blog article. Safe to re-run.
import fs from 'fs';
import A from './posts-a.mjs'; import B from './posts-b.mjs'; import C from './posts-c.mjs';
const root = 'D:/GM_Claude/'; const posts = Object.fromEntries([...A, ...B, ...C].map(p => [p.slug, p]));
const MAP = {
  'pdf-merge-split': 'merge-and-split-pdf-files', 'pdf-rotator': 'merge-and-split-pdf-files',
  'image-converter': 'jpg-vs-png-vs-webp', 'image-compressor': 'jpg-vs-png-vs-webp', 'image-resizer': 'resize-images-for-whatsapp-email-and-websites',
  'images-to-pdf': 'convert-photos-and-scans-into-one-pdf', 'pdf-to-word': 'pdf-to-word-and-excel-what-to-expect', 'pdf-to-excel': 'pdf-to-word-and-excel-what-to-expect', 'word-to-pdf': 'pdf-to-word-and-excel-what-to-expect',
  'pomodoro-timer': 'pomodoro-technique-guide', 'countdown-timer': 'pomodoro-technique-guide', 'password-generator': 'how-to-create-a-strong-password',
  'cover-letter-generator': 'how-to-write-a-cover-letter-in-five-steps', 'resume-builder': 'how-to-write-a-cover-letter-in-five-steps', 'linkedin-headline-generator': 'linkedin-headline-formula',
  'typing-speed-test': 'how-to-improve-your-typing-speed', 'word-counter': 'how-to-improve-your-typing-speed',
  'color-contrast-checker': 'color-contrast-and-accessible-design', 'color-picker': 'color-contrast-and-accessible-design',
  'land-area-converter': 'marla-kanal-and-square-feet-explained', 'pakistan-property-price-converter': 'marla-kanal-and-square-feet-explained', 'unit-converter': 'marla-kanal-and-square-feet-explained'
};
let n = 0;
for (const [tool, slug] of Object.entries(MAP)) {
  const f = root + 'tools/' + tool + '/index.html'; let h = fs.readFileSync(f, 'utf8');
  h = h.replace(/<!-- gm:readmore:start -->[\s\S]*?<!-- gm:readmore:end -->/, '');
  const p = posts[slug]; const esc = s => s.replace(/&/g, '&amp;');
  const block = '<!-- gm:readmore:start --><section class="section"><div class="container prose" style="max-width:860px"><h2>Read the guide</h2><p>For a fuller walkthrough with more examples, read <a href="../../blog/' + slug + '/">' + esc(p.title) + '</a>.</p></div></section><!-- gm:readmore:end -->';
  const i = h.lastIndexOf('</main>'); h = h.slice(0, i) + block + '\n' + h.slice(i); fs.writeFileSync(f, h, 'utf8'); n++;
}
console.log('tool pages linked to guides:', n);
