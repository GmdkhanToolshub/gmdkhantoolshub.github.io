// Builds the account, Premium dashboard and member admin pages (all noindex, no ads) and adds the Premium lock scripts to the two
// lockable pages. Everything stays inactive while assets/js/account-config.js has no apiBase. Re-runnable.
// node build/make-account-pages.mjs, then run python build/bump.py D:/GM_Claude
import fs from 'fs';
import { buildPage, esc, ROOT } from './page-shell.mjs';

// The email link carries its token after "#". It is read and removed from the address before any other script runs,
// so it never reaches analytics or browser history.
const TOKEN = '<script>(function(){var m=location.hash.match(/^#t=([A-Za-z0-9_-]{30,60})$/);if(m){window.__gmToken=m[1];history.replaceState(null,"",location.pathname)}})();</script>';
const PAGES = [
  { slug: 'account', depth: 1, h1: 'Your account', lead: 'Sign in, create an account or reset your password.', page: 'account', desc: 'Sign in or sign up for GM Tools Hub Premium. All free tools stay free and need no account.' },
  { slug: 'account/verify', depth: 2, h1: 'Verify your email', lead: 'One quick step before your request goes for approval.', page: 'verify', desc: 'Verify your email address for GM Tools Hub Premium.', token: true },
  { slug: 'account/reset', depth: 2, h1: 'Reset your password', lead: 'Choose a new password for your account.', page: 'reset', desc: 'Reset your GM Tools Hub account password.', token: true },
  { slug: 'premium', depth: 1, h1: 'Premium dashboard', lead: 'Your Premium tools, cloud backup and member downloads.', page: 'premium', desc: 'The GM Tools Hub Premium dashboard for approved members.' },
  { slug: 'admin-members', depth: 1, h1: 'Member administration', lead: 'Authorised administrator only.', page: 'admin', desc: 'Administrator console for GM Tools Hub members and permissions.', script: 'admin-members' }
];
for (const p of PAGES) {
  const up = '../'.repeat(p.depth);
  const main = `<section class="page-hero"><div class="container"><nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="${up}">Home</a></li><li aria-current="page">${esc(p.h1)}</li></ol></nav><span class="eyebrow">GM Tools Hub Premium</span><h1>${esc(p.h1)}</h1><p class="lead">${esc(p.lead)}</p></div></section>`
    + `<section class="section"><div class="container gma-wrap"><div id="gma-app" data-page="${p.page}"><noscript><p>This page needs JavaScript.</p></noscript></div></div></section>`
    + `<script src="${up}assets/js/account-config.js?v=00000000"></script><script src="${up}assets/js/gm-account.js?v=00000000" defer></script><script src="${up}assets/js/${p.script || 'account-pages'}.js?v=00000000" defer></script>`;
  buildPage({ slug: p.slug, depth: p.depth, title: p.h1 + ' | GM Tools Hub', desc: p.desc, robots: 'noindex, nofollow', ads: false, main, extraHead: (p.token ? TOKEN + '\n' : '') + `<link rel="stylesheet" href="${up}assets/css/account.css?v=00000000">\n` });
  console.log('built', p.slug);
}

// lockable pages: only add the loader; their content and ads are not changed
for (const [dir, area] of [['bi-studio', 'bi-studio'], ['business-calculators', 'calculator-lab']]) {
  const file = ROOT + dir + '/index.html';
  let h = fs.readFileSync(file, 'utf8').replace(/<!-- gm-gate:start -->[\s\S]*?<!-- gm-gate:end -->\r?\n?/g, '');
  const block = `<!-- gm-gate:start --><div data-premium-area="${area}" hidden></div><link rel="stylesheet" href="../assets/css/account.css?v=00000000"><script src="../assets/js/account-config.js?v=00000000"></script><script src="../assets/js/gm-account.js?v=00000000" defer></script><script src="../assets/js/premium-gate.js?v=00000000" defer></script><!-- gm-gate:end -->\n`;
  const at = h.indexOf('</main>'); if (at < 0) throw new Error('no main in ' + dir);
  fs.writeFileSync(file, h.slice(0, at) + block + h.slice(at), 'utf8');
  console.log('lock loader added to', dir);
}
