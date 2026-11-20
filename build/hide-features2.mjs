// Second pass: edit the text that still refers to the hidden Live jobs feed and Kids Corner. Safe to re-run.
import fs from 'fs';
const root = 'D:/GM_Claude/'; const out = [];
function edit(rel, fn) { const f = root + rel; let h = fs.readFileSync(f, 'utf8'); const o = h; h = fn(h); if (h !== o) { fs.writeFileSync(f, h, 'utf8'); out.push('edited ' + rel); } else out.push('NO CHANGE ' + rel); }
edit('404.html', h => h.replace(/ · <a href="\/kids\/">Kids Corner<\/a>/, ''));
edit('about/index.html', h => h.replace(/<li><b>Safe for children\.<\/b> Kids Corner has no accounts, no chat and no adverts\.<\/li>/, ''));
edit('advertise/index.html', h => h
  .replace(/<li><b>Kids Corner stays clean\.<\/b>[^<]*<\/li>/, '')
  .replace(/<article class="card">(?:(?!<\/article>)[\s\S])*?<a href="\.\.\/jobs\/">Jobs page<\/a>[\s\S]*?<\/article>/, ''));
edit('post-a-job/index.html', h => (/noindex/.test(h) ? h : h.replace(/<\/title>/i, '</title><meta name="robots" content="noindex, nofollow">')));
edit('affiliate-disclosure/index.html', h => h.replace('We do not recommend products to children, and Kids Corner never contains affiliate links or adverts.', 'We do not recommend products to children.'));
edit('career-studio/index.html', h => h
  .split('interview practice, live jobs and a progress checklist').join('interview practice and a progress checklist')
  .replace('practise interviews, find live vacancies and track your progress', 'practise interviews and track your progress')
  .replace('Check live vacancies and apply to at least five', 'Check current job adverts and apply to at least five'));
edit('media-kit/index.html', h => h.replace('Kids Corner with 12 learning gadgets, ', ''));
edit('updates/index.html', h => {
  h = h.replace(/<li class="upd">(?:(?!<\/li>)[\s\S])*?upd-tag">Kids Corner<\/span>[\s\S]*?<\/div><\/li>/g, '');
  h = h.split('embeds, Kids Corner and the new design').join('embeds and the new design');
  return h;
});
console.log(out.join('\n'));
