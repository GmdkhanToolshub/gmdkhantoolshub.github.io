/* GM Embed loader. Usage: <div data-gm-embed="WIDGET" data-theme="light" data-accent="0e7490"></div><script src="https://gmtoolshub.com/embed/gm-embed.js" async></script>
   It builds a sandboxed iframe that points to https://gmtoolshub.com/embed/WIDGET/ and resizes it to fit. It never reads what visitors type.
   Messages are only accepted from https://gmtoolshub.com and only from the iframe this script created. */
(function () {
  var ORIGIN = 'https://gmtoolshub.com', ALLOWED = ["tola-gold-converter","zakat-calculator","pakistan-salary-tax-calculator","loan-emi-calculator","electricity-bill-calculator","fuel-cost-calculator","land-area-converter","amount-in-words","board-marks-calculator","percentage-calculator","age-calculator","bmi-calculator","profit-margin-calculator","date-difference-calculator","live-rates"], MIN = {"tola-gold-converter":420,"zakat-calculator":520,"pakistan-salary-tax-calculator":680,"loan-emi-calculator":520,"electricity-bill-calculator":480,"fuel-cost-calculator":460,"land-area-converter":460,"amount-in-words":400,"board-marks-calculator":460,"percentage-calculator":460,"age-calculator":440,"bmi-calculator":440,"profit-margin-calculator":480,"date-difference-calculator":460,"live-rates":240};
  var FONTS = ['system', 'serif', 'mono', 'rounded'], seq = 0, frames = [];
  function hex(v) { return /^[0-9a-fA-F]{6}$/.test(v || ''); }
  function build(el) {
    if (el.getAttribute('data-gm-done')) return; var w = el.getAttribute('data-gm-embed');
    if (ALLOWED.indexOf(w) < 0) { el.textContent = 'GM Embed: unknown widget.'; return; }
    el.setAttribute('data-gm-done', '1'); var q = [], g = function (k) { return el.getAttribute('data-' + k); };
    var id = 'gm' + (++seq);
    if (g('theme') === 'dark' || g('theme') === 'light') q.push('theme=' + g('theme'));
    if (hex(g('accent'))) q.push('accent=' + g('accent'));
    if (g('bg') === 'transparent' || hex(g('bg'))) q.push('bg=' + g('bg'));
    var r = parseInt(g('radius'), 10); if (r >= 0 && r <= 32) q.push('radius=' + r);
    if (FONTS.indexOf(g('font')) > 0) q.push('font=' + g('font'));
    if (g('title') === '1') q.push('title=1'); if (g('footer') === '0') q.push('footer=0');
    if (g('lang') === 'ur') q.push('lang=ur'); if (/^(gold|silver|usd)(,(gold|silver|usd))*$/.test(g('show') || '')) q.push('show=' + g('show'));
    q.push('id=' + id);
    var f = document.createElement('iframe'); f.src = ORIGIN + '/embed/' + w + '/?' + q.join('&'); f.title = 'GM Tools Hub widget: ' + w;
    f.loading = 'lazy'; f.width = '100%'; f.style.cssText = 'border:0;width:100%;max-width:' + (parseInt(g('max-width'), 10) || 760) + 'px;display:block;height:' + (parseInt(g('height'), 10) || MIN[w] || 480) + 'px';
    f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-downloads');
    f.setAttribute('allow', 'clipboard-write'); f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    el.appendChild(f); frames.push({ id: id, f: f });
  }
  addEventListener('message', function (e) {
    if (e.origin !== ORIGIN) return; var d = e.data; if (!d || d.source !== 'gm-embed' || d.type !== 'height') return;
    for (var i = 0; i < frames.length; i++) if (frames[i].f.contentWindow === e.source && frames[i].id === d.id) { var h = Math.round(+d.height); if (h >= 120 && h <= 4000) frames[i].f.style.height = h + 'px'; }
  });
  function run() { var n = document.querySelectorAll('[data-gm-embed]'); for (var i = 0; i < n.length; i++) build(n[i]); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
