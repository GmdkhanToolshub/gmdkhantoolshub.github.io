/* Kids Corner: Build Your Own Cartoon. Pick a face, hair, eyes, mouth, clothes and accessories, then save a PNG. Browser only. */
(function () {
  'use strict';
  var G = window.GMK, el = G.el, rnd = G.rnd;
  var OPT = {
    skin: [['#fde2c8', 'Light'], ['#f5c9a0', 'Peach'], ['#d9a066', 'Tan'], ['#a8714a', 'Brown'], ['#6b4226', 'Dark'], ['#86efac', 'Alien green'], ['#93c5fd', 'Robot blue']],
    head: [['round', 'Round'], ['square', 'Square'], ['oval', 'Oval']],
    hair: [['short', 'Short'], ['long', 'Long'], ['curly', 'Curly'], ['bun', 'Bun'], ['none', 'None']],
    hairc: [['#1f2937', 'Black'], ['#92400e', 'Brown'], ['#facc15', 'Blonde'], ['#ef4444', 'Red'], ['#a855f7', 'Purple'], ['#3b82f6', 'Blue'], ['#ec4899', 'Pink']],
    eyes: [['round', 'Round'], ['big', 'Big'], ['happy', 'Happy'], ['sleepy', 'Sleepy'], ['star', 'Stars']],
    mouth: [['smile', 'Smile'], ['grin', 'Big grin'], ['wow', 'Wow'], ['tongue', 'Silly'], ['flat', 'Calm']],
    shirt: [['tee', 'T-shirt'], ['dress', 'Dress'], ['hoodie', 'Hoodie'], ['overall', 'Overalls']],
    shirtc: [['#ef4444', 'Red'], ['#3b82f6', 'Blue'], ['#22c55e', 'Green'], ['#facc15', 'Yellow'], ['#a855f7', 'Purple'], ['#f97316', 'Orange'], ['#ec4899', 'Pink']],
    hat: [['none', 'None'], ['party', 'Party hat'], ['crown', 'Crown'], ['cap', 'Cap'], ['bow', 'Bow'], ['band', 'Headband']],
    glasses: [['no', 'No glasses'], ['yes', 'Glasses']],
    bg: [['#bae6fd', 'Sky'], ['#fde68a', 'Sunny'], ['#fbcfe8', 'Pink'], ['#bbf7d0', 'Meadow'], ['#c7d2fe', 'Night blue'], ['#ffffff', 'White']]
  };
  var LABEL = { skin: 'Skin', head: 'Face shape', hair: 'Hair', hairc: 'Hair colour', eyes: 'Eyes', mouth: 'Mouth', shirt: 'Clothes', shirtc: 'Clothes colour', hat: 'Extras', glasses: 'Glasses', bg: 'Background' };
  function shade(h) { return h; }
  function svg(s) {
    var o = [], sk = s.skin, hc = s.hairc, sc = s.shirtc;
    o.push('<rect width="300" height="360" fill="' + s.bg + '"/>');
    if (s.hair === 'long') o.push('<rect x="72" y="88" width="156" height="210" rx="60" fill="' + hc + '"/>');
    if (s.shirt === 'dress') o.push('<path d="M150 245 L58 360 L242 360Z" fill="' + sc + '"/>');
    else { o.push('<path d="M62 360 L78 272 Q150 232 222 272 L238 360Z" fill="' + (s.shirt === 'overall' ? '#f8fafc' : sc) + '"/>'); if (s.shirt === 'hoodie') o.push('<ellipse cx="150" cy="248" rx="58" ry="20" fill="' + sc + '" stroke="rgba(0,0,0,.18)"/>'); if (s.shirt === 'overall') o.push('<path d="M92 360 L98 296 L202 296 L208 360Z" fill="' + sc + '"/><rect x="104" y="262" width="12" height="40" fill="' + sc + '"/><rect x="184" y="262" width="12" height="40" fill="' + sc + '"/>'); }
    o.push('<rect x="130" y="205" width="40" height="44" rx="12" fill="' + sk + '"/>');
    o.push('<circle cx="76" cy="158" r="15" fill="' + sk + '"/><circle cx="224" cy="158" r="15" fill="' + sk + '"/>');
    if (s.head === 'round') o.push('<circle cx="150" cy="150" r="76" fill="' + sk + '"/>'); else if (s.head === 'square') o.push('<rect x="76" y="78" width="148" height="140" rx="40" fill="' + sk + '"/>'); else o.push('<ellipse cx="150" cy="148" rx="64" ry="82" fill="' + sk + '"/>');
    if (s.hair === 'short') o.push('<path d="M76 140 Q78 66 150 64 Q222 66 224 140 Q196 100 150 104 Q104 100 76 140Z" fill="' + hc + '"/>');
    else if (s.hair === 'long') o.push('<path d="M72 150 Q74 62 150 60 Q226 62 228 150 Q200 98 150 100 Q100 98 72 150Z" fill="' + hc + '"/>');
    else if (s.hair === 'curly') for (var i = 0; i < 7; i++) o.push('<circle cx="' + (84 + i * 22) + '" cy="' + (i % 2 ? 86 : 94) + '" r="22" fill="' + hc + '"/>');
    else if (s.hair === 'bun') o.push('<path d="M76 140 Q78 66 150 64 Q222 66 224 140 Q196 100 150 104 Q104 100 76 140Z" fill="' + hc + '"/><circle cx="150" cy="56" r="22" fill="' + hc + '"/>');
    o.push('<circle cx="104" cy="178" r="11" fill="#f472b6" opacity=".35"/><circle cx="196" cy="178" r="11" fill="#f472b6" opacity=".35"/>');
    var ex = [120, 180];
    ex.forEach(function (x) { if (s.eyes === 'round') o.push('<circle cx="' + x + '" cy="150" r="8" fill="#111827"/><circle cx="' + (x + 3) + '" cy="147" r="2.5" fill="#fff"/>'); else if (s.eyes === 'big') o.push('<circle cx="' + x + '" cy="150" r="15" fill="#fff" stroke="#111827" stroke-width="2"/><circle cx="' + x + '" cy="152" r="8" fill="#111827"/><circle cx="' + (x + 3) + '" cy="149" r="3" fill="#fff"/>'); else if (s.eyes === 'happy') o.push('<path d="M' + (x - 13) + ' 154 Q' + x + ' 136 ' + (x + 13) + ' 154" fill="none" stroke="#111827" stroke-width="5" stroke-linecap="round"/>'); else if (s.eyes === 'sleepy') o.push('<path d="M' + (x - 13) + ' 150 L' + (x + 13) + ' 150" stroke="#111827" stroke-width="5" stroke-linecap="round"/>'); else o.push('<text x="' + x + '" y="162" font-size="34" text-anchor="middle" fill="#f59e0b">★</text>'); });
    if (s.mouth === 'smile') o.push('<path d="M120 188 Q150 216 180 188" fill="none" stroke="#7f1d1d" stroke-width="5" stroke-linecap="round"/>'); else if (s.mouth === 'grin') o.push('<path d="M114 184 Q150 232 186 184Z" fill="#fff" stroke="#7f1d1d" stroke-width="4" stroke-linejoin="round"/>'); else if (s.mouth === 'wow') o.push('<ellipse cx="150" cy="198" rx="11" ry="15" fill="#7f1d1d"/>'); else if (s.mouth === 'tongue') o.push('<path d="M120 188 Q150 214 180 188" fill="none" stroke="#7f1d1d" stroke-width="5" stroke-linecap="round"/><ellipse cx="156" cy="206" rx="11" ry="14" fill="#fb7185"/>'); else o.push('<path d="M124 196 L176 196" stroke="#7f1d1d" stroke-width="5" stroke-linecap="round"/>');
    if (s.glasses === 'yes') o.push('<circle cx="120" cy="150" r="22" fill="rgba(186,230,253,.35)" stroke="#111827" stroke-width="4"/><circle cx="180" cy="150" r="22" fill="rgba(186,230,253,.35)" stroke="#111827" stroke-width="4"/><path d="M142 150 L158 150" stroke="#111827" stroke-width="4"/>');
    if (s.hat === 'party') o.push('<path d="M112 80 L150 8 L188 80Z" fill="#ec4899"/><circle cx="150" cy="8" r="9" fill="#facc15"/><path d="M122 62 L178 62" stroke="#fff" stroke-width="5"/>'); else if (s.hat === 'crown') o.push('<path d="M104 80 L112 34 L132 62 L150 26 L168 62 L188 34 L196 80Z" fill="#facc15" stroke="#f59e0b" stroke-width="3" stroke-linejoin="round"/>'); else if (s.hat === 'cap') o.push('<path d="M78 98 Q80 40 150 38 Q220 40 222 98Z" fill="#ef4444"/><rect x="150" y="88" width="90" height="14" rx="7" fill="#b91c1c"/>'); else if (s.hat === 'bow') o.push('<path d="M196 76 L236 56 L236 100Z M196 76 L156 56 L156 100Z" fill="#ec4899"/><circle cx="196" cy="78" r="9" fill="#be185d"/>'); else if (s.hat === 'band') o.push('<path d="M80 112 Q150 72 220 112" fill="none" stroke="#22d3ee" stroke-width="12" stroke-linecap="round"/>');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 360" width="300" height="360" role="img" aria-label="Your cartoon character">' + o.join('') + '</svg>'; }
  function run(root) {
    root.innerHTML = ''; G.starBar(root, 'cartoon');
    var s = { skin: OPT.skin[0][0], head: 'round', hair: 'short', hairc: OPT.hairc[0][0], eyes: 'round', mouth: 'smile', shirt: 'tee', shirtc: OPT.shirtc[1][0], hat: 'none', glasses: 'no', bg: OPT.bg[0][0] }, cat = 'skin', saved = false;
    var wrap = el('div', 'kc-cartoon'), view = el('div', 'kc-char'), panel = el('div', 'kc-opts'); wrap.appendChild(view); wrap.appendChild(panel); root.appendChild(wrap);
    var tabs = el('div', 'kg-pills'); tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', 'Parts'); var grid = el('div', 'kc-optgrid');
    Object.keys(LABEL).forEach(function (k) { var b = el('button', 'pill', LABEL[k]); b.type = 'button'; b.dataset.k = k; b.addEventListener('click', function () { cat = k; draw(); }); tabs.appendChild(b); });
    panel.appendChild(tabs); panel.appendChild(grid);
    function draw() {
      view.innerHTML = svg(s); [].forEach.call(tabs.children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.k === cat)); }); grid.innerHTML = '';
      OPT[cat].forEach(function (o) { var colour = /^#/.test(o[0]), b = el('button', colour ? 'kc-swatch' : 'kc-optbtn', colour ? '' : o[1]); b.type = 'button'; if (colour) { b.style.background = o[0]; } b.setAttribute('aria-label', o[1]); b.setAttribute('aria-pressed', String(s[cat] === o[0])); b.addEventListener('click', function () { s[cat] = o[0]; draw(); }); grid.appendChild(b); }); }
    var tools = el('div', 'kc-tools'); function mk(t, cls, fn) { var b = el('button', 'btn ' + cls + ' btn-sm', t); b.type = 'button'; b.addEventListener('click', fn); tools.appendChild(b); }
    mk('🎲 Surprise me', 'btn-ghost', function () { Object.keys(OPT).forEach(function (k) { s[k] = OPT[k][rnd(OPT[k].length)][0]; }); draw(); });
    mk('↺ Start again', 'btn-ghost', function () { s = { skin: OPT.skin[0][0], head: 'round', hair: 'short', hairc: OPT.hairc[0][0], eyes: 'round', mouth: 'smile', shirt: 'tee', shirtc: OPT.shirtc[1][0], hat: 'none', glasses: 'no', bg: OPT.bg[0][0] }; draw(); });
    mk('💾 Save picture', 'btn-primary', function () { G.savePng(view.firstChild, 'my-cartoon.png', 600, 720); if (!saved) { saved = true; G.award(1, 'cartoon', view, 'Fantastic character!'); } });
    root.appendChild(tools); root._state = s; draw(); }
  window.NiaziTools = window.NiaziTools || {}; NiaziTools['kids-cartoon'] = function (r) { run(r); };
})();
