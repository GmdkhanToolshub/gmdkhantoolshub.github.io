/* GM Embed: appearance settings for embedded widgets, read from the page address.
   Supported: theme (light|dark), accent (6-digit hex), bg (6-digit hex or transparent), radius (0-32), font (system|serif|mono|rounded),
   title (1 shows a header), footer (0 hides the privacy note; the GM Tools Hub credit link always stays on the free licence), id.
   It only reads the address, sets styles and tells the parent page how tall the widget is. It never reads or sends what the visitor types. */
(function () {
  var q, root = document.documentElement;
  try { q = new URLSearchParams(location.search); } catch (e) { return; }
  var hex = function (v) { return /^[0-9a-fA-F]{6}$/.test(v || '') ? '#' + v : null; };
  var set = function (k, v) { root.style.setProperty(k, v); };
  var th = q.get('theme'); if (th === 'dark' || th === 'light') root.setAttribute('data-theme', th);
  var a = hex(q.get('accent')); if (a) { set('--accent', a); set('--accent-soft', a + '22'); }
  var bg = q.get('bg');
  function applyBody() {
    if (bg === 'transparent') { document.body.style.background = 'transparent'; set('--bg', 'transparent'); }
    else if (hex(bg)) { document.body.style.background = hex(bg); set('--bg', hex(bg)); set('--surface', hex(bg)); }
  }
  var rd = parseInt(q.get('radius'), 10); if (rd >= 0 && rd <= 32) { set('--radius', rd + 'px'); set('--radius-sm', Math.min(rd, 12) + 'px'); }
  var fonts = { serif: 'Georgia, "Times New Roman", serif', mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', rounded: '"Trebuchet MS", "Segoe UI", system-ui, sans-serif' };
  var f = q.get('font'); if (fonts[f]) set('--font', fonts[f]);
  var id = (q.get('id') || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 40);
  function ready() {
    applyBody();
    if (q.get('title') === '1') { var h = document.getElementById('gm-head'), n = document.body.getAttribute('data-name'); if (h && n) { h.textContent = n; h.hidden = false; } }
    if (q.get('footer') === '0') { var note = document.getElementById('gm-note'); if (note) note.hidden = true; }
    function post() {
      try { var w = document.querySelector('.embed-wrap'), h = Math.ceil((w ? w.getBoundingClientRect().height : document.body.scrollHeight) + 20); parent.postMessage({ source: 'gm-embed', type: 'height', id: id, height: h }, '*'); } catch (e) { /* not framed */ }
    }
    post(); addEventListener('load', post); addEventListener('resize', post);
    if (window.ResizeObserver) { var wr = document.querySelector('.embed-wrap'); if (wr) new ResizeObserver(post).observe(wr); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
