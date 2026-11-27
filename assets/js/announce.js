/* Announcement bar. This tiny file sits just above the site header and runs while the page is still being drawn,
   so the bar never pushes the page down after it has appeared. Dismissed bars stay away until the ID changes. */
(function () {
  'use strict';
  var ID = '2026-11-26', d = document, me = d.currentScript;
  if (!me || d.querySelector('.gx-ann') || /\/(updates|kids|embed)\//.test(location.pathname)) return;
  try { var v = localStorage.getItem('gm.ann'); if (v && JSON.parse(v) === ID) return; } catch (e) { /* storage blocked: show the bar */ }
  var base = (d.body && d.body.getAttribute('data-root')) || '/';
  var bar = d.createElement('div'); bar.className = 'gx-ann no-print'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Announcement');
  bar.innerHTML = '<p><span class="gx-ann-tag">New</span><span>Free Spreadsheet Checker: find repeated rows and wrong totals<span class="gx-ann-d">. Your file is not uploaded</span>.</span> <a href="' + base + 'spreadsheet-checker/">Try it <span aria-hidden="true">&rarr;</span></a></p>' +
    '<button type="button" class="gx-ann-x" aria-label="Dismiss announcement"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>';
  me.parentNode.insertBefore(bar, me);
  bar.querySelector('button').addEventListener('click', function () {
    try { localStorage.setItem('gm.ann', JSON.stringify(ID)); } catch (e) { /* ignore */ }
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { bar.remove(); return; }
    bar.style.height = bar.offsetHeight + 'px'; void bar.offsetHeight; bar.classList.add('gx-ann-out'); setTimeout(function () { bar.remove(); }, 380);
  });
})();
