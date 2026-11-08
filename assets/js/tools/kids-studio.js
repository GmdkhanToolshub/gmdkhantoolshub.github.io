/* Kids Corner: drawing & cartoon studio, colouring pages, drawing challenges and a private gallery.
   Everything runs in the browser. Nothing is uploaded, no accounts, no chat. Artwork is saved only on this device (IndexedDB). */
(function () {
  'use strict';
  var W = 1200, H = 840, UNDO_MAX = 12;
  var COLORS = ['#111827', '#6b7280', '#ffffff', '#ef4444', '#f97316', '#facc15', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f472b6', '#92400e', '#d6a76c', '#fde68a', '#bbf7d0', '#bae6fd', '#c7d2fe', '#fbcfe8', '#7f1d1d', '#1e3a8a'];
  var BGS = [{ id: 'white', n: 'White', c: '#ffffff' }, { id: 'paper', n: 'Cream', c: '#fff7e0' }, { id: 'sky', n: 'Sky', s: 1 }, { id: 'grass', n: 'Meadow', s: 1 }, { id: 'ocean', n: 'Ocean', s: 1 }, { id: 'space', n: 'Space', s: 1 }, { id: 'sunset', n: 'Sunset', s: 1 }, { id: 'night', n: 'Night', c: '#0f172a' }];
  var STICKERS = {
    Animals: ['🐱', '🐶', '🐰', '🐻', '🦊', '🐼', '🐸', '🐵', '🦁', '🐯', '🐧', '🐢', '🦋', '🐞', '🐠', '🐘'],
    Faces: ['😀', '😍', '😎', '🤩', '😴', '🥳', '🤖', '👽'],
    Nature: ['🌳', '🌸', '🌻', '🌈', '☀️', '🌙', '⭐', '☁️', '🍎', '🍄'],
    Space: ['🚀', '🪐', '🛸', '🌍', '☄️', '🌟'],
    Fun: ['🎈', '🎂', '🎁', '🏠', '🚗', '✈️', '⚽', '🎨']
  };
  var TOOLS = [['pencil', '✏️', 'Pencil'], ['marker', '🖍️', 'Marker'], ['brush', '🖌️', 'Soft brush'], ['crayon', '🟧', 'Crayon'], ['spray', '💨', 'Spray'], ['rainbow', '🌈', 'Rainbow'], ['fill', '🪣', 'Fill'], ['eraser', '🧽', 'Eraser'],
    ['line', '📏', 'Line'], ['rect', '⬜', 'Square'], ['oval', '⭕', 'Circle'], ['tri', '🔺', 'Triangle'], ['star', '⭐', 'Star'], ['heart', '❤️', 'Heart'], ['sticker', '😀', 'Stickers'], ['text', '🔤', 'Text']];
  var CHALLENGES = {
    '4-6': ['Draw a smiling sun', 'Draw your favourite animal', 'Draw a big red apple', 'Draw a rainbow with all the colours', 'Draw a happy fish in the sea', 'Draw a house with a door and windows', 'Draw a friendly monster with three eyes', 'Draw a balloon party'],
    '7-9': ['Draw a robot that helps at home', 'Draw a castle on a hill', 'Draw a picnic in the park', 'Draw an animal wearing a hat', 'Draw a rocket flying past the moon', 'Draw a funny cartoon dinosaur', 'Draw a treehouse in a giant tree', 'Draw an underwater city'],
    '10+': ['Draw a character with a superpower and show what it does', 'Draw a three-picture comic strip', 'Draw a city of the future', 'Draw a creature from another planet', 'Draw your dream bedroom from above', 'Draw a mascot for your class', 'Draw a scene using only three colours', 'Draw a market street on a busy day']
  };

  /* ---------- colouring page outlines (drawn in code; every shape is closed so the fill bucket works) ---------- */
  function P(c, f) { c.beginPath(); f(c); c.closePath(); c.stroke(); }
  function ell(c, x, y, rx, ry, rot) { P(c, function () { c.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); }); }
  function poly(c, pts) { P(c, function () { c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); }); }
  function rrect(c, x, y, w, h, r) { P(c, function () { r = Math.min(r, w / 2, h / 2); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.arcTo(x + w, y, x + w, y + r, r); c.lineTo(x + w, y + h - r); c.arcTo(x + w, y + h, x + w - r, y + h, r); c.lineTo(x + r, y + h); c.arcTo(x, y + h, x, y + h - r, r); c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r); }); } // drawn by hand: roundRect() can leave a stray dot at the corner
  function open(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); }
  function starPts(cx, cy, R, r, n) { var a = []; for (var i = 0; i < n * 2; i++) { var ang = -Math.PI / 2 + i * Math.PI / n, rad = i % 2 ? r : R; a.push([cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]); } return a; }
  var TEMPLATES = [
    { id: 'cat', n: 'Cat', cat: 'Animals', draw: function (c) { poly(c, [[380, 330], [340, 130], [530, 250]]); poly(c, [[820, 330], [860, 130], [670, 250]]); ell(c, 600, 480, 290, 250); ell(c, 500, 440, 38, 52); ell(c, 700, 440, 38, 52); poly(c, [[570, 520], [630, 520], [600, 555]]); open(c, [[600, 555], [600, 590]]); c.beginPath(); c.arc(570, 590, 30, 0, Math.PI); c.stroke(); c.beginPath(); c.arc(630, 590, 30, 0, Math.PI); c.stroke(); open(c, [[400, 540], [250, 510]]); open(c, [[400, 580], [250, 590]]); open(c, [[800, 540], [950, 510]]); open(c, [[800, 580], [950, 590]]); } },
    { id: 'fish', n: 'Fish', cat: 'Animals', draw: function (c) { ell(c, 560, 420, 330, 200); poly(c, [[860, 420], [1060, 270], [1060, 570]]); ell(c, 420, 360, 36, 36); poly(c, [[540, 230], [640, 130], [700, 240]]); poly(c, [[560, 590], [640, 700], [700, 590]]); open(c, [[300, 470], [350, 500]]); for (var i = 0; i < 3; i++) ell(c, 600 + i * 70, 410, 38, 46); ell(c, 140, 200, 40, 40); ell(c, 220, 120, 26, 26); } },
    { id: 'butterfly', n: 'Butterfly', cat: 'Animals', draw: function (c) { ell(c, 430, 330, 230, 170, -0.5); ell(c, 770, 330, 230, 170, 0.5); ell(c, 460, 530, 160, 120, 0.5); ell(c, 740, 530, 160, 120, -0.5); ell(c, 600, 420, 34, 190); open(c, [[600, 240], [520, 120]]); open(c, [[600, 240], [680, 120]]); ell(c, 515, 112, 14, 14); ell(c, 685, 112, 14, 14); ell(c, 430, 320, 60, 60); ell(c, 770, 320, 60, 60); } },
    { id: 'flowers', n: 'Flower garden', cat: 'Nature', draw: function (c) { function fl(x, y, r) { for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; ell(c, x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3, r * 0.75, r * 0.75); } ell(c, x, y, r * 0.8, r * 0.8); } fl(300, 280, 60); fl(620, 200, 70); fl(930, 300, 55); open(c, [[300, 360], [300, 700]]); open(c, [[620, 290], [620, 700]]); open(c, [[930, 380], [930, 700]]); ell(c, 360, 560, 70, 30, -0.5); ell(c, 560, 520, 70, 30, 0.5); ell(c, 880, 580, 70, 30, 0.5); poly(c, [[0, 700], [1200, 700], [1200, 840], [0, 840]]); } },
    { id: 'tree', n: 'Tree and sun', cat: 'Nature', draw: function (c) { poly(c, [[540, 840], [560, 520], [640, 520], [660, 840]]); ell(c, 600, 380, 170, 150); ell(c, 440, 440, 130, 110); ell(c, 760, 440, 130, 110); ell(c, 980, 140, 90, 90); for (var i = 0; i < 10; i++) { var a = i * Math.PI / 5; open(c, [[980 + Math.cos(a) * 110, 140 + Math.sin(a) * 110], [980 + Math.cos(a) * 160, 140 + Math.sin(a) * 160]]); } ell(c, 200, 160, 90, 40); ell(c, 280, 130, 70, 45); } },
    { id: 'rocket', n: 'Rocket', cat: 'Space', draw: function (c) { P(c, function () { c.moveTo(600, 80); c.quadraticCurveTo(780, 260, 740, 560); c.lineTo(460, 560); c.quadraticCurveTo(420, 260, 600, 80); }); ell(c, 600, 330, 70, 70); poly(c, [[460, 460], [330, 620], [460, 580]]); poly(c, [[740, 460], [870, 620], [740, 580]]); poly(c, [[500, 560], [700, 560], [660, 640], [540, 640]]); poly(c, [[540, 640], [660, 640], [600, 790]]); [[180, 160], [1000, 200], [1040, 520], [220, 560], [900, 90]].forEach(function (s) { poly(c, starPts(s[0], s[1], 34, 14, 5)); }); } },
    { id: 'planet', n: 'Planet and stars', cat: 'Space', draw: function (c) { ell(c, 600, 420, 230, 230); ell(c, 600, 420, 380, 90, -0.35); ell(c, 540, 330, 40, 30); ell(c, 690, 500, 55, 40); [[160, 160], [1040, 150], [1000, 700], [190, 680], [600, 90]].forEach(function (s) { poly(c, starPts(s[0], s[1], 38, 15, 5)); }); ell(c, 160, 420, 36, 36); } },
    { id: 'robot', n: 'Friendly robot', cat: 'Cartoon', draw: function (c) { rrect(c, 430, 150, 340, 250, 50); ell(c, 520, 260, 40, 40); ell(c, 680, 260, 40, 40); rrect(c, 520, 330, 160, 40, 20); open(c, [[600, 150], [600, 80]]); ell(c, 600, 66, 20, 20); rrect(c, 380, 420, 440, 300, 40); ell(c, 600, 560, 60, 60); rrect(c, 250, 440, 110, 220, 40); rrect(c, 840, 440, 110, 220, 40); rrect(c, 450, 720, 110, 100, 24); rrect(c, 640, 720, 110, 100, 24); } },
    { id: 'car', n: 'Car', cat: 'Cartoon', draw: function (c) { P(c, function () { c.moveTo(150, 520); c.lineTo(150, 420); c.lineTo(340, 400); c.lineTo(450, 250); c.lineTo(780, 250); c.lineTo(900, 400); c.lineTo(1050, 430); c.lineTo(1050, 520); }); poly(c, [[150, 520], [1050, 520], [1050, 560], [150, 560]]); poly(c, [[480, 290], [590, 290], [590, 400], [400, 400]]); poly(c, [[620, 290], [750, 290], [840, 400], [620, 400]]); ell(c, 340, 570, 80, 80); ell(c, 340, 570, 34, 34); ell(c, 860, 570, 80, 80); ell(c, 860, 570, 34, 34); ell(c, 1010, 470, 24, 24); ell(c, 200, 470, 20, 20); } },
    { id: 'house', n: 'House', cat: 'Cartoon', draw: function (c) { poly(c, [[300, 400], [900, 400], [900, 760], [300, 760]]); poly(c, [[250, 400], [600, 140], [950, 400]]); poly(c, [[520, 560], [680, 560], [680, 760], [520, 760]]); poly(c, [[350, 470], [470, 470], [470, 580], [350, 580]]); poly(c, [[730, 470], [850, 470], [850, 580], [730, 580]]); poly(c, [[740, 180], [820, 180], [820, 300], [740, 240]]); ell(c, 1060, 130, 70, 70); ell(c, 180, 130, 70, 38); } }
  ];
  function tplById(id) { for (var i = 0; i < TEMPLATES.length; i++) if (TEMPLATES[i].id === id) return TEMPLATES[i]; return null; }

  /* ---------- private storage (IndexedDB, this device only) ---------- */
  var DB = {
    open: function () {
      return new Promise(function (res, rej) {
        if (!window.indexedDB) return rej(new Error('Saving is not available in this browser.'));
        var r = indexedDB.open('gm-kids', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('art', { keyPath: 'id' }); };
        r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error || new Error('Could not open storage.')); };
      });
    },
    tx: function (mode, fn) { return DB.open().then(function (db) { return new Promise(function (res, rej) { var t = db.transaction('art', mode), s = t.objectStore('art'), out = fn(s); t.oncomplete = function () { res(out && out.result !== undefined ? out.result : undefined); db.close(); }; t.onerror = t.onabort = function () { rej(t.error || new Error('Storage error')); db.close(); }; }); }); },
    put: function (rec) { return DB.tx('readwrite', function (s) { s.put(rec); }); },
    all: function () { return DB.tx('readonly', function (s) { return s.getAll(); }).then(function (v) { return (v || []).sort(function (a, b) { return b.created - a.created; }); }); },
    get: function (id) { return DB.tx('readonly', function (s) { return s.get(id); }); },
    del: function (id) { return DB.tx('readwrite', function (s) { s.delete(id); }); },
    clear: function () { return DB.tx('readwrite', function (s) { s.clear(); }); }
  };

  /* ---------- export helpers ---------- */
  function jpegBlob(canvas, q) { return new Promise(function (res) { canvas.toBlob(res, 'image/jpeg', q || 0.95); }); }
  function flat(layers) { var c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); layers.forEach(function (l) { x.drawImage(l, 0, 0); }); return c; }
  function bytes(s) { var a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 255; return a; }
  function pdfFromJpeg(jpg, w, h) {
    var pw = w >= h ? 842 : 595, ph = w >= h ? 595 : 842, m = 24, s = Math.min((pw - 2 * m) / w, (ph - 2 * m) / h), iw = w * s, ih = h * s, x = (pw - iw) / 2, y = (ph - ih) / 2;
    var parts = [], len = 0, offs = [];
    function add(d) { if (typeof d === 'string') d = bytes(d); parts.push(d); len += d.length; }
    function obj(n, body, stream) { offs[n] = len; add(n + ' 0 obj\n' + body); if (stream) { add('\nstream\n'); add(stream); add('\nendstream'); } add('\nendobj\n'); }
    add('%PDF-1.4\n');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pw + ' ' + ph + '] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>');
    var cs = 'q ' + iw.toFixed(2) + ' 0 0 ' + ih.toFixed(2) + ' ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' cm /Im0 Do Q';
    obj(4, '<< /Length ' + cs.length + ' >>', cs);
    obj(5, '<< /Type /XObject /Subtype /Image /Width ' + w + ' /Height ' + h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpg.length + ' >>', jpg);
    var xr = len, t = 'xref\n0 6\n0000000000 65535 f \n';
    for (var i = 1; i <= 5; i++) t += ('0000000000' + offs[i]).slice(-10) + ' 00000 n \n';
    add(t + 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xr + '\n%%EOF');
    return new Blob(parts, { type: 'application/pdf' });
  }
  function blobBytes(b) { return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(new Uint8Array(r.result)); }; r.readAsArrayBuffer(b); }); }
  function save(U, name, blob) { var u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 5000); }
  function printCanvas(canvas) {
    var box = document.createElement('div'); box.className = 'ks-printbox'; var img = new Image(); img.alt = 'Artwork to print';
    img.onload = function () { box.appendChild(img); document.body.appendChild(box); setTimeout(function () { window.print(); setTimeout(function () { box.remove(); }, 800); }, 100); };
    img.src = canvas.toDataURL('image/jpeg', 0.95);
  }
  function stamp() { var d = new Date(); return d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + '-' + ('0' + d.getHours()).slice(-2) + ('0' + d.getMinutes()).slice(-2); }

  /* ---------- the studio ---------- */
  function studio(root, U, opts) {
    opts = opts || {};
    var esc = U.esc;
    var tool = 'marker', color = '#3b82f6', size = 10, filled = true, sticker = '🐱', text = 'Hello!', bg = { id: 'white' }, tpl = null, name = '', savedId = null;
    var undo = [], redo = [], drawing = false, pts = [], start = null, pathAlpha = 1, hue = 0;
    var cats = Object.keys(STICKERS);
    root.innerHTML =
      (opts.challenge ? '<div class="ks-challenge"><div class="ks-ch-top"><div><span class="ks-ch-label">Your challenge</span><p class="ks-ch-text" id="ks-ch-text" aria-live="polite"></p></div><div class="ks-ch-ctl"><label>Age <select id="ks-ch-age"><option value="4-6">4–6</option><option value="7-9" selected>7–9</option><option value="10+">10+</option></select></label><button type="button" class="btn btn-primary btn-sm" id="ks-ch-new">🎲 New challenge</button></div></div><div class="ks-ch-timer"><button type="button" class="btn btn-ghost btn-sm" id="ks-timer-btn">⏱️ Start 10-minute timer</button><span id="ks-timer" aria-live="off"></span></div></div>' : '') +
      '<div class="ks"><div class="ks-tools" role="toolbar" aria-label="Drawing tools">' + TOOLS.map(function (t) { return '<button type="button" class="ks-tool" data-tool="' + t[0] + '" aria-pressed="' + (t[0] === tool) + '" title="' + t[2] + '"><span class="ks-ico" aria-hidden="true">' + t[1] + '</span><span class="ks-lab">' + t[2] + '</span></button>'; }).join('') + '</div>' +
      '<div class="ks-stage"><div class="ks-wrap" id="ks-wrap"><canvas id="ks-bg" width="' + W + '" height="' + H + '"></canvas><canvas id="ks-art" width="' + W + '" height="' + H + '"></canvas><canvas id="ks-lines" width="' + W + '" height="' + H + '"></canvas><canvas id="ks-prev" width="' + W + '" height="' + H + '" role="img" aria-label="Drawing canvas. Use a mouse, finger or pen to draw."></canvas></div>' +
      '<div class="ks-actions"><button type="button" class="btn btn-ghost btn-sm" id="ks-undo">↩️ Undo</button><button type="button" class="btn btn-ghost btn-sm" id="ks-redo">↪️ Redo</button><button type="button" class="btn btn-ghost btn-sm" id="ks-clear">🧹 Clear drawing</button><button type="button" class="btn btn-ghost btn-sm" id="ks-new">📄 New page</button></div>' +
      '<div class="ks-actions"><input id="ks-name" class="ks-name" type="text" maxlength="40" placeholder="Name your picture" aria-label="Picture name"><button type="button" class="btn btn-primary btn-sm" id="ks-save">💾 Save to my gallery</button><button type="button" class="btn btn-ghost btn-sm" id="ks-jpg">⬇️ JPEG</button><button type="button" class="btn btn-ghost btn-sm" id="ks-pdf">⬇️ PDF</button><button type="button" class="btn btn-ghost btn-sm" id="ks-png">⬇️ PNG</button><button type="button" class="btn btn-ghost btn-sm" id="ks-print">🖨️ Print</button></div>' +
      '<p class="ks-msg" id="ks-msg" role="status" aria-live="polite"></p></div>' +
      '<div class="ks-panel"><div class="ks-sec"><h3>Colour</h3><div class="ks-colors" id="ks-colors">' + COLORS.map(function (c) { return '<button type="button" class="ks-sw" style="background:' + c + '" data-c="' + c + '" aria-label="Colour ' + c + '" aria-pressed="' + (c === color) + '"></button>'; }).join('') + '</div><label class="ks-pick">Mix your own <input type="color" id="ks-custom" value="#3b82f6" aria-label="Pick any colour"></label></div>' +
      '<div class="ks-sec"><h3>Size <span id="ks-sz-v">10</span></h3><input type="range" id="ks-size" min="2" max="60" value="10" aria-label="Brush size"><label class="ks-chk"><input type="checkbox" id="ks-filled" checked> Filled shapes</label></div>' +
      '<div class="ks-sec" id="ks-text-sec" hidden><h3>Text</h3><input type="text" id="ks-text" maxlength="40" value="Hello!" aria-label="Text to add"><p class="small muted">Click on the picture to place it.</p></div>' +
      '<div class="ks-sec" id="ks-stk-sec" hidden><h3>Stickers</h3><div class="ks-cats" id="ks-cats">' + cats.map(function (k, i) { return '<button type="button" class="ks-cat" data-k="' + k + '" aria-pressed="' + (i === 0) + '">' + k + '</button>'; }).join('') + '</div><div class="ks-stk" id="ks-stk"></div><p class="small muted">Pick one, then click the picture. Use Size to make it bigger.</p></div>' +
      '<div class="ks-sec"><h3>Background</h3><div class="ks-bgs" id="ks-bgs">' + BGS.map(function (b) { return '<button type="button" class="ks-bg" data-b="' + b.id + '" aria-pressed="' + (b.id === 'white') + '">' + b.n + '</button>'; }).join('') + '</div></div>' +
      '<div class="ks-sec"><h3>Pictures to colour</h3><div class="ks-tpls" id="ks-tpls"><button type="button" class="ks-tpl" data-t="" aria-pressed="true">Blank page</button>' + TEMPLATES.map(function (t) { return '<button type="button" class="ks-tpl" data-t="' + t.id + '" aria-pressed="false">' + t.n + '<small>' + t.cat + '</small></button>'; }).join('') + '</div><p class="small muted">Use the 🪣 Fill tool to colour each part.</p></div></div></div>';
    var $ = function (s) { return root.querySelector(s); };
    var cBg = $('#ks-bg'), cArt = $('#ks-art'), cLines = $('#ks-lines'), cPrev = $('#ks-prev');
    var xBg = cBg.getContext('2d'), xArt = cArt.getContext('2d', { willReadFrequently: true }), xLines = cLines.getContext('2d', { willReadFrequently: true }), xPrev = cPrev.getContext('2d');
    var msgEl = $('#ks-msg');
    function msg(t, bad) { msgEl.textContent = t || ''; msgEl.className = 'ks-msg' + (bad ? ' bad' : ''); }

    /* backgrounds */
    function paintBg() {
      var c = xBg; c.clearRect(0, 0, W, H); var id = bg.id, g;
      if (id === 'white') { c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); }
      else if (id === 'paper') { c.fillStyle = '#fff7e0'; c.fillRect(0, 0, W, H); }
      else if (id === 'night') { c.fillStyle = '#0f172a'; c.fillRect(0, 0, W, H); }
      else if (id === 'sky') { g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7dd3fc'); g.addColorStop(1, '#e0f2fe'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.fillStyle = '#fff'; [[200, 150, 80], [330, 130, 60], [900, 220, 90], [1020, 190, 60]].forEach(function (s) { c.beginPath(); c.arc(s[0], s[1], s[2], 0, 7); c.fill(); }); }
      else if (id === 'grass') { g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#bae6fd'); g.addColorStop(0.6, '#e0f2fe'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.fillStyle = '#86efac'; c.beginPath(); c.moveTo(0, 560); c.quadraticCurveTo(300, 480, 600, 560); c.quadraticCurveTo(900, 640, W, 540); c.lineTo(W, H); c.lineTo(0, H); c.fill(); c.fillStyle = '#fde047'; c.beginPath(); c.arc(1050, 130, 70, 0, 7); c.fill(); }
      else if (id === 'ocean') { g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#67e8f9'); g.addColorStop(1, '#1d4ed8'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.fillStyle = '#fde68a'; c.fillRect(0, 760, W, 80); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 5; for (var i = 0; i < 6; i++) { c.beginPath(); c.moveTo(60 + i * 200, 140 + (i % 2) * 40); c.quadraticCurveTo(110 + i * 200, 110, 160 + i * 200, 140 + (i % 2) * 40); c.stroke(); } }
      else if (id === 'space') { c.fillStyle = '#0b1026'; c.fillRect(0, 0, W, H); c.fillStyle = '#fff'; for (var j = 0; j < 90; j++) { c.globalAlpha = 0.4 + ((j * 37) % 60) / 100; c.beginPath(); c.arc((j * 197) % W, (j * 421) % H, ((j * 13) % 3) + 1, 0, 7); c.fill(); } c.globalAlpha = 1; }
      else if (id === 'sunset') { g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#6366f1'); g.addColorStop(0.5, '#f472b6'); g.addColorStop(1, '#fdba74'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.fillStyle = '#fde68a'; c.beginPath(); c.arc(600, 620, 120, 0, 7); c.fill(); }
    }
    function paintLines() { xLines.clearRect(0, 0, W, H); if (!tpl) return; xLines.strokeStyle = '#1f2937'; xLines.lineWidth = 8; xLines.lineJoin = 'round'; xLines.lineCap = 'round'; tpl.draw(xLines); }

    /* history */
    function snap() { return { art: xArt.getImageData(0, 0, W, H), bg: bg.id, tpl: tpl ? tpl.id : '' }; }
    function pushUndo() { undo.push(snap()); if (undo.length > UNDO_MAX) undo.shift(); redo = []; syncBtns(); }
    function restore(s) { xArt.putImageData(s.art, 0, 0); bg = { id: s.bg }; tpl = s.tpl ? tplById(s.tpl) : null; paintBg(); paintLines(); markBg(); markTpl(); }
    function syncBtns() { $('#ks-undo').disabled = !undo.length; $('#ks-redo').disabled = !redo.length; }
    function doUndo() { if (!undo.length) return; redo.push(snap()); restore(undo.pop()); syncBtns(); }
    function doRedo() { if (!redo.length) return; undo.push(snap()); restore(redo.pop()); syncBtns(); }

    /* pointer */
    function pos(e) { var r = cPrev.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; }
    var SHAPES = { line: 1, rect: 1, oval: 1, tri: 1, star: 1, heart: 1 };
    function shape(c, kind, a, b) {
      var x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]), w = Math.abs(b[0] - a[0]), h = Math.abs(b[1] - a[1]);
      c.lineWidth = size; c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = color; c.fillStyle = color; c.beginPath();
      if (kind === 'line') { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); return; }
      if (kind === 'rect') c.rect(x, y, w, h);
      else if (kind === 'oval') c.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      else if (kind === 'tri') { c.moveTo(x + w / 2, y); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath(); }
      else if (kind === 'star') { var p = starPts(x + w / 2, y + h / 2, Math.max(w, h) / 2, Math.max(w, h) / 4.2, 5); c.moveTo(p[0][0], p[0][1]); for (var i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); c.closePath(); }
      else if (kind === 'heart') { c.moveTo(x + w / 2, y + h); c.bezierCurveTo(x - w * 0.25, y + h * 0.55, x + w * 0.1, y - h * 0.1, x + w / 2, y + h * 0.3); c.bezierCurveTo(x + w * 0.9, y - h * 0.1, x + w * 1.25, y + h * 0.55, x + w / 2, y + h); c.closePath(); }
      if (filled) c.fill(); else c.stroke();
    }
    function stampItem(c, p) {
      if (tool === 'sticker') { c.font = (30 + size * 4) + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(sticker, p[0], p[1]); }
      else { c.font = '800 ' + (24 + size * 3) + 'px "Comic Sans MS","Chalkboard SE","Segoe UI",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = color; c.lineWidth = Math.max(2, size / 4); c.strokeStyle = '#fff'; c.lineJoin = 'round'; c.strokeText(text || ' ', p[0], p[1]); c.fillText(text || ' ', p[0], p[1]); }
    }
    function seg(c, a, b) {
      c.lineCap = 'round'; c.lineJoin = 'round';
      if (tool === 'pencil') { c.globalAlpha = 0.92; c.strokeStyle = color; c.lineWidth = Math.max(1.5, size / 3); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.globalAlpha = 1; }
      else if (tool === 'marker') { c.strokeStyle = color; c.lineWidth = size; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
      else if (tool === 'eraser') { c.globalCompositeOperation = 'destination-out'; c.lineWidth = size * 1.8; c.strokeStyle = '#000'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.globalCompositeOperation = 'source-over'; }
      else if (tool === 'rainbow') { hue = (hue + 6) % 360; c.strokeStyle = 'hsl(' + hue + ',90%,55%)'; c.lineWidth = size; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
      else if (tool === 'crayon' || tool === 'spray') {
        var d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(d / 3)), r = tool === 'spray' ? size * 1.6 : size * 0.8, dots = tool === 'spray' ? 10 : 7;
        c.fillStyle = color; for (var i = 0; i < n; i++) { var t = i / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t; for (var k = 0; k < dots; k++) { var ang = Math.random() * 6.283, rad = Math.sqrt(Math.random()) * r; c.globalAlpha = tool === 'spray' ? 0.55 : 0.5 + Math.random() * 0.5; c.beginPath(); c.arc(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad, tool === 'spray' ? 1.3 : 1.6 + Math.random() * 1.6, 0, 7); c.fill(); } } c.globalAlpha = 1;
      }
    }
    function softPath() { xPrev.clearRect(0, 0, W, H); xPrev.save(); xPrev.lineCap = 'round'; xPrev.lineJoin = 'round'; xPrev.strokeStyle = color; xPrev.lineWidth = size * 1.5; xPrev.shadowColor = color; xPrev.shadowBlur = size * 0.7; xPrev.globalAlpha = 1; xPrev.beginPath(); xPrev.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) xPrev.lineTo(pts[i][0], pts[i][1]); if (pts.length === 1) xPrev.lineTo(pts[0][0] + 0.1, pts[0][1]); xPrev.stroke(); xPrev.restore(); }
    cPrev.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return; e.preventDefault(); try { cPrev.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
      var p = pos(e); if (tool === 'fill') { pushUndo(); floodFill(p); return; }
      drawing = true; start = p; pts = [p]; pushUndo();
      if (tool === 'sticker' || tool === 'text') { xPrev.clearRect(0, 0, W, H); xPrev.fillStyle = color; stampItem(xPrev, p); return; }
      if (tool === 'brush') { softPath(); return; }
      if (SHAPES[tool]) return;
      seg(xArt, p, [p[0] + 0.01, p[1] + 0.01]);
    });
    cPrev.addEventListener('pointermove', function (e) {
      if (!drawing) return; e.preventDefault(); var p = pos(e), last = pts[pts.length - 1];
      if (tool === 'sticker' || tool === 'text') { xPrev.clearRect(0, 0, W, H); xPrev.fillStyle = color; stampItem(xPrev, p); pts = [p]; return; }
      if (SHAPES[tool]) { xPrev.clearRect(0, 0, W, H); shape(xPrev, tool, start, p); pts = [start, p]; return; }
      pts.push(p); if (tool === 'brush') softPath(); else seg(xArt, last, p);
    });
    function endDraw(e) {
      if (!drawing) return; drawing = false; var p = e && e.clientX != null ? pos(e) : pts[pts.length - 1];
      if (tool === 'sticker' || tool === 'text') { xArt.save(); xArt.fillStyle = color; stampItem(xArt, pts[pts.length - 1] || p); xArt.restore(); }
      else if (SHAPES[tool]) { xArt.save(); shape(xArt, tool, start, pts.length > 1 ? pts[1] : start); xArt.restore(); }
      else if (tool === 'brush') { xArt.drawImage(cPrev, 0, 0); }
      xPrev.clearRect(0, 0, W, H); pts = [];
      if (tool === 'sticker' || tool === 'text' || SHAPES[tool]) { if (SHAPES[tool] && start && Math.abs(p[0] - start[0]) < 3 && Math.abs(p[1] - start[1]) < 3 && tool !== 'line') { /* tiny click: ignore */ } }
    }
    cPrev.addEventListener('pointerup', endDraw); cPrev.addEventListener('pointercancel', endDraw);
    cPrev.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    /* flood fill: respects the colouring-page outline and any colour already painted */
    function hex2rgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
    function floodFill(p) {
      var x0 = Math.max(0, Math.min(W - 1, Math.round(p[0]))), y0 = Math.max(0, Math.min(H - 1, Math.round(p[1])));
      var art = xArt.getImageData(0, 0, W, H), ln = xLines.getImageData(0, 0, W, H), a = art.data, l = ln.data, i0 = (y0 * W + x0) * 4;
      if (l[i0 + 3] > 110) { msg('That is on a line. Click inside a shape to fill it.'); return; }
      var sr = a[i0], sg = a[i0 + 1], sb = a[i0 + 2], sa = a[i0 + 3], tol = 40, f = hex2rgb(color), seen = new Uint8Array(W * H), stack = [x0, y0];
      if (sa === 255 && Math.abs(sr - f[0]) + Math.abs(sg - f[1]) + Math.abs(sb - f[2]) < 6) return;
      function ok(i) { return l[i + 3] <= 110 && Math.abs(a[i] - sr) + Math.abs(a[i + 1] - sg) + Math.abs(a[i + 2] - sb) + Math.abs(a[i + 3] - sa) <= tol * 2; }
      var guard = 0;
      while (stack.length && guard++ < 3000000) {
        var y = stack.pop(), x = stack.pop(), xl = x;
        while (xl >= 0 && !seen[y * W + xl] && ok((y * W + xl) * 4)) xl--; xl++;
        var up = false, dn = false;
        for (var xx = xl; xx < W && !seen[y * W + xx] && ok((y * W + xx) * 4); xx++) {
          var idx = y * W + xx; seen[idx] = 1; var k = idx * 4; a[k] = f[0]; a[k + 1] = f[1]; a[k + 2] = f[2]; a[k + 3] = 255;
          if (y > 0) { var u = !seen[idx - W] && ok((idx - W) * 4); if (u && !up) stack.push(xx, y - 1); up = u; }
          if (y < H - 1) { var d = !seen[idx + W] && ok((idx + W) * 4); if (d && !dn) stack.push(xx, y + 1); dn = d; }
        }
      }
      // grow the fill by one pixel under the outline so no thin white halo is left next to the lines
      var out = new Uint8ClampedArray(a); for (var y2 = 1; y2 < H - 1; y2++) for (var x2 = 1; x2 < W - 1; x2++) { var q = y2 * W + x2; if (!seen[q] && l[q * 4 + 3] > 0 && (seen[q - 1] || seen[q + 1] || seen[q - W] || seen[q + W])) { var kk = q * 4; out[kk] = f[0]; out[kk + 1] = f[1]; out[kk + 2] = f[2]; out[kk + 3] = 255; } }
      art.data.set(out); xArt.putImageData(art, 0, 0);
    }

    /* UI wiring */
    function markTool() { U.$$('.ks-tool', root).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.tool === tool); }); $('#ks-text-sec').hidden = tool !== 'text'; $('#ks-stk-sec').hidden = tool !== 'sticker'; cPrev.style.cursor = tool === 'fill' ? 'copy' : 'crosshair'; }
    function markColor() { U.$$('.ks-sw', root).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.c === color); }); }
    function markBg() { U.$$('.ks-bg', root).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.b === bg.id); }); }
    function markTpl() { U.$$('.ks-tpl', root).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.t === (tpl ? tpl.id : '')); }); }
    function fillStickers(k) { $('#ks-stk').innerHTML = STICKERS[k].map(function (s) { return '<button type="button" class="ks-st" data-s="' + s + '" aria-pressed="' + (s === sticker) + '" aria-label="Sticker ' + s + '">' + s + '</button>'; }).join(''); }
    fillStickers(cats[0]); markTool();
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || !root.contains(b)) return;
      if (b.dataset.tool) { tool = b.dataset.tool; markTool(); msg(''); }
      else if (b.dataset.c) { color = b.dataset.c; markColor(); $('#ks-custom').value = color; if (tool === 'eraser') { tool = 'marker'; markTool(); } }
      else if (b.dataset.k) { U.$$('.ks-cat', root).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); fillStickers(b.dataset.k); }
      else if (b.dataset.s) { sticker = b.dataset.s; U.$$('.ks-st', root).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }
      else if (b.dataset.b) { pushUndo(); bg = { id: b.dataset.b }; paintBg(); markBg(); }
      else if (b.dataset.t !== undefined && b.classList.contains('ks-tpl')) { pushUndo(); tpl = tplById(b.dataset.t); paintLines(); markTpl(); if (tpl && tool !== 'fill') { tool = 'fill'; markTool(); } msg(tpl ? 'Click the 🪣 Fill tool, pick a colour, then click inside a shape.' : ''); }
    });
    $('#ks-custom').addEventListener('input', function (e) { color = e.target.value; markColor(); });
    $('#ks-size').addEventListener('input', function (e) { size = +e.target.value; $('#ks-sz-v').textContent = size; });
    $('#ks-filled').addEventListener('change', function (e) { filled = e.target.checked; });
    $('#ks-text').addEventListener('input', function (e) { text = e.target.value; });
    $('#ks-undo').addEventListener('click', doUndo); $('#ks-redo').addEventListener('click', doRedo);
    $('#ks-clear').addEventListener('click', function () { pushUndo(); xArt.clearRect(0, 0, W, H); msg('Drawing cleared. Press Undo to get it back.'); });
    $('#ks-new').addEventListener('click', function () { if (undo.length && !confirm('Start a new page? Anything you have not saved will be lost.')) return; xArt.clearRect(0, 0, W, H); bg = { id: 'white' }; tpl = null; paintBg(); paintLines(); markBg(); markTpl(); undo = []; redo = []; savedId = null; $('#ks-name').value = ''; syncBtns(); msg(''); });
    root.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); doUndo(); } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); doRedo(); } });
    function composite() { return flat([cBg, cArt, cLines]); }
    function fname(ext) { return U.slug($('#ks-name').value || 'my-drawing') + '-' + stamp() + '.' + ext; }
    function guard(fn) { return function () { try { fn(); } catch (err) { msg('Sorry, that did not work: ' + err.message, true); } }; }
    $('#ks-jpg').addEventListener('click', guard(function () { jpegBlob(composite(), 0.95).then(function (b) { save(U, fname('jpg'), b); msg('Your JPEG picture was downloaded.'); }); }));
    $('#ks-png').addEventListener('click', guard(function () { composite().toBlob(function (b) { save(U, fname('png'), b); msg('Your PNG picture was downloaded.'); }, 'image/png'); }));
    $('#ks-pdf').addEventListener('click', guard(function () { jpegBlob(composite(), 0.95).then(blobBytes).then(function (by) { save(U, fname('pdf'), pdfFromJpeg(by, W, H)); msg('Your PDF was downloaded. It is ready to print.'); }); }));
    $('#ks-print').addEventListener('click', guard(function () { printCanvas(composite()); }));
    $('#ks-save').addEventListener('click', function () {
      var c = composite(), th = document.createElement('canvas'); th.width = 300; th.height = 210; th.getContext('2d').drawImage(c, 0, 0, 300, 210);
      var nm = ($('#ks-name').value || '').trim() || 'My drawing';
      jpegBlob(c, 0.92).then(function (full) { var id = savedId || ('a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)); return DB.put({ id: id, name: nm.slice(0, 40), created: Date.now(), thumb: th.toDataURL('image/jpeg', 0.8), full: full }).then(function () { savedId = id; msg('Saved to your private gallery on this device.'); }); })
        .catch(function (err) { msg('Could not save here: ' + err.message + ' You can still download your picture.', true); });
    });

    paintBg(); paintLines(); syncBtns();
    var q = new URLSearchParams(location.search);
    if (opts.template || q.get('template')) { tpl = tplById(opts.template || q.get('template')); if (tpl) { paintLines(); markTpl(); tool = 'fill'; markTool(); } }
    if (q.get('open')) DB.get(q.get('open')).then(function (rec) { if (!rec) return; var img = new Image(); img.onload = function () { xArt.drawImage(img, 0, 0, W, H); savedId = rec.id; $('#ks-name').value = rec.name; msg('Opened “' + rec.name + '”. You can keep drawing on it.'); URL.revokeObjectURL(img.src); }; img.src = URL.createObjectURL(rec.full); }).catch(function () { /* not available */ });

    if (opts.challenge) {
      var chEl = $('#ks-ch-text'), age = $('#ks-ch-age'), last = -1;
      function nextCh() { var list = CHALLENGES[age.value], i; do { i = Math.floor(Math.random() * list.length); } while (i === last && list.length > 1); last = i; chEl.textContent = list[i]; }
      $('#ks-ch-new').addEventListener('click', nextCh); age.addEventListener('change', nextCh); nextCh();
      var tm = null, left = 0, tb = $('#ks-timer-btn'), te = $('#ks-timer');
      function tick() { left--; te.textContent = Math.floor(left / 60) + ':' + ('0' + left % 60).slice(-2) + ' left'; if (left <= 0) { clearInterval(tm); tm = null; te.textContent = 'Time is up! Great job. Save your picture.'; tb.textContent = '⏱️ Start 10-minute timer'; } }
      tb.addEventListener('click', function () { if (tm) { clearInterval(tm); tm = null; te.textContent = ''; tb.textContent = '⏱️ Start 10-minute timer'; return; } left = 600; te.textContent = '10:00 left'; tb.textContent = '⏹️ Stop timer'; tm = setInterval(tick, 1000); });
    }
  }

  /* ---------- gallery ---------- */
  function gallery(root, U) {
    var esc = U.esc; root.innerHTML = '<div class="ks-gal-top"><p class="muted" id="gal-info">Loading your gallery…</p><button type="button" class="btn btn-ghost btn-sm" id="gal-clear" hidden>🗑️ Delete all my pictures</button></div><div class="ks-gal" id="gal"></div><p class="ks-msg" id="gal-msg" role="status" aria-live="polite"></p>';
    var $ = function (s) { return root.querySelector(s); }, urls = [];
    function say(t, bad) { var m = $('#gal-msg'); m.textContent = t || ''; m.className = 'ks-msg' + (bad ? ' bad' : ''); }
    function render() {
      DB.all().then(function (list) {
        urls.forEach(URL.revokeObjectURL); urls = [];
        $('#gal-info').textContent = list.length ? list.length + ' picture' + (list.length === 1 ? '' : 's') + ' saved privately on this device. They are not uploaded anywhere.' : 'No pictures yet. Draw something in the Drawing Studio and press “Save to my gallery”.';
        $('#gal-clear').hidden = !list.length;
        $('#gal').innerHTML = list.map(function (r) { return '<figure class="ks-art" data-id="' + esc(r.id) + '"><img src="' + r.thumb + '" alt="' + esc(r.name) + '" width="300" height="210" loading="lazy"><figcaption><b>' + esc(r.name) + '</b><span>' + new Date(r.created).toLocaleDateString() + '</span></figcaption><div class="ks-art-btns"><a class="btn btn-primary btn-sm" href="../drawing-studio/?open=' + encodeURIComponent(r.id) + '">Open</a><button type="button" class="btn btn-ghost btn-sm" data-a="jpg">JPEG</button><button type="button" class="btn btn-ghost btn-sm" data-a="pdf">PDF</button><button type="button" class="btn btn-ghost btn-sm" data-a="del">Delete</button></div></figure>'; }).join('');
      }).catch(function (err) { $('#gal-info').textContent = 'The gallery is not available in this browser (' + err.message + ').'; });
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-a]'), fig = b && b.closest('.ks-art'); if (!b) return;
      var id = fig.dataset.id;
      DB.get(id).then(function (r) {
        if (!r) return;
        if (b.dataset.a === 'jpg') { save(U, U.slug(r.name) + '.jpg', r.full); say('Downloaded.'); }
        else if (b.dataset.a === 'pdf') blobBytes(r.full).then(function (by) { save(U, U.slug(r.name) + '.pdf', pdfFromJpeg(by, W, H)); say('PDF downloaded.'); });
        else if (b.dataset.a === 'del' && confirm('Delete “' + r.name + '”? This cannot be undone.')) DB.del(id).then(render);
      }).catch(function (err) { say(err.message, true); });
    });
    $('#gal-clear').addEventListener('click', function () { if (confirm('Delete every saved picture on this device? This cannot be undone.')) DB.clear().then(function () { say('All pictures were deleted.'); render(); }); });
    render();
  }

  window.NiaziTools = window.NiaziTools || {};
  NiaziTools['kids-drawing-studio'] = function (r, U) { studio(r, U, {}); };
  NiaziTools['kids-colouring-pages'] = function (r, U) { studio(r, U, { template: 'cat' }); };
  NiaziTools['kids-drawing-challenges'] = function (r, U) { studio(r, U, { challenge: true }); };
  NiaziTools['kids-gallery'] = gallery;
  /* ---------- Talking Buddy: an original friendly character that says whatever the child types (no microphone, nothing sent anywhere) ---------- */
  function buddy(root, U) {
    var BAD = /\b(fuck|shit|bitch|bastard|asshole|slut|whore|nigg|cunt|dick|idiot|stupid|moron|hate|kill|rape|sex)\w*/i;
    var JOKES = ['What is a robot’s favourite snack? Computer chips!', 'Why did the cookie go to the doctor? Because it felt crumby!', 'What do you call a sleeping bull? A bulldozer!', 'Why do bees have sticky hair? Because they use honeycombs!', 'What do you call a dinosaur that is never late? A prontosaurus!'];
    var PHRASES = ['Hello, friend!', 'Let’s draw something fun!', 'I love colours!', 'You are a great artist!', 'Time to dance!'];
    var COLORS = ['#2dd4bf', '#a78bfa', '#f472b6', '#fbbf24', '#60a5fa', '#4ade80'];
    root.innerHTML = '<div class="tb"><div class="tb-stage"><div class="tb-bubble" id="tb-bubble" aria-live="polite">Hi! I am Bolo. Type something and I will say it!</div>' +
      '<svg id="tb-bolo" class="tb-bolo" viewBox="0 0 240 280" role="img" aria-label="Bolo, a friendly cartoon character"><g class="tb-all"><line x1="120" y1="22" x2="120" y2="56" stroke="#1f2937" stroke-width="6" stroke-linecap="round"/><circle cx="120" cy="18" r="11" fill="#fbbf24" stroke="#1f2937" stroke-width="6"/>' +
      '<g class="tb-arm tb-l"><rect x="22" y="146" width="34" height="74" rx="17" fill="var(--bolo,#2dd4bf)" stroke="#1f2937" stroke-width="6"/></g><g class="tb-arm tb-r"><rect x="184" y="146" width="34" height="74" rx="17" fill="var(--bolo,#2dd4bf)" stroke="#1f2937" stroke-width="6"/></g>' +
      '<rect x="62" y="206" width="42" height="44" rx="16" fill="#6366f1" stroke="#1f2937" stroke-width="6"/><rect x="136" y="206" width="42" height="44" rx="16" fill="#6366f1" stroke="#1f2937" stroke-width="6"/>' +
      '<rect x="46" y="52" width="148" height="170" rx="64" fill="var(--bolo,#2dd4bf)" stroke="#1f2937" stroke-width="6"/><ellipse cx="120" cy="170" rx="46" ry="34" fill="#ffffff" opacity=".35"/>' +
      '<g class="tb-eyes"><circle cx="92" cy="104" r="22" fill="#fff" stroke="#1f2937" stroke-width="6"/><circle cx="148" cy="104" r="22" fill="#fff" stroke="#1f2937" stroke-width="6"/><circle class="tb-pupil" cx="96" cy="108" r="9" fill="#1f2937"/><circle class="tb-pupil" cx="144" cy="108" r="9" fill="#1f2937"/></g>' +
      '<g class="tb-mouth"><ellipse cx="120" cy="164" rx="26" ry="14" fill="#7f1d1d" stroke="#1f2937" stroke-width="6"/><ellipse cx="120" cy="170" rx="13" ry="6" fill="#f87171"/></g></g></svg></div>' +
      '<div class="tb-panel"><form id="tb-form" class="tb-row"><label class="sr-only" for="tb-text">What should Bolo say?</label><input id="tb-text" maxlength="40" placeholder="Type a short message…" autocomplete="off"><button type="submit" class="btn btn-primary">Say it</button></form>' +
      '<div class="tb-row"><button type="button" class="btn btn-ghost" data-j="1">Tell me a joke</button><button type="button" class="btn btn-ghost" data-hi="1">Wave hello</button></div>' +
      '<p class="small muted" style="margin:10px 0 4px">Quick words</p><div class="tb-row">' + PHRASES.map(function (p) { return '<button type="button" class="pill" data-p="' + U.esc(p) + '">' + U.esc(p) + '</button>'; }).join('') + '</div>' +
      '<p class="small muted" style="margin:12px 0 4px">Bolo’s colour</p><div class="tb-row" role="group" aria-label="Bolo colour">' + COLORS.map(function (c) { return '<button type="button" class="ks-sw" style="background:' + c + '" data-c="' + c + '" aria-label="Colour ' + c + '"></button>'; }).join('') + '</div>' +
      '<p class="ks-msg" id="tb-msg" role="status" aria-live="polite"></p></div></div>';
    var $ = function (s) { return root.querySelector(s); }, bolo = $('#tb-bolo'), bubble = $('#tb-bubble'), msg = $('#tb-msg'), synth = window.speechSynthesis, ji = 0;
    function act(cls, ms) { bolo.classList.add(cls); setTimeout(function () { bolo.classList.remove(cls); }, ms); }
    function say(text) {
      text = String(text || '').replace(/\s+/g, ' ').trim(); if (!text) { msg.textContent = 'Type a word or two first.'; return; }
      if (BAD.test(text)) { text = 'Let’s use kind words!'; }
      bubble.textContent = text; msg.textContent = '';
      if (!synth || typeof SpeechSynthesisUtterance === 'undefined') { act('tb-talk', 1800); msg.textContent = 'Your browser cannot speak, but Bolo is happy to show you the words.'; return; }
      try { synth.cancel(); var u = new SpeechSynthesisUtterance(text), vs = synth.getVoices(), en = vs.filter(function (v) { return /^en/i.test(v.lang); }); if (en.length) u.voice = en.filter(function (v) { return v.localService; })[0] || en[0]; u.lang = 'en-US'; u.pitch = 1.9; u.rate = 1.08; u.onstart = function () { bolo.classList.add('tb-talk'); }; u.onend = u.onerror = function () { bolo.classList.remove('tb-talk'); }; synth.speak(u); act('tb-bounce', 600); } catch (e) { msg.textContent = 'Sound is not available right now.'; }
    }
    $('#tb-form').addEventListener('submit', function (e) { e.preventDefault(); say($('#tb-text').value); });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (b && root.contains(b)) {
        if (b.dataset.p) { say(b.dataset.p); $('#tb-text').value = b.dataset.p; }
        else if (b.dataset.j) { say(JOKES[ji++ % JOKES.length]); }
        else if (b.dataset.hi) { say('Hello, friend!'); act('tb-wave', 1400); }
        else if (b.dataset.c) { bolo.style.setProperty('--bolo', b.dataset.c); act('tb-bounce', 600); }
        return;
      }
      if (e.target.closest('#tb-bolo')) { act('tb-bounce', 600); say(['Hee hee, that tickles!', 'Boing!', 'Hello there!', 'Wheee!'][Math.floor(Math.random() * 4)]); }
    });
    setInterval(function () { bolo.classList.add('tb-blink'); setTimeout(function () { bolo.classList.remove('tb-blink'); }, 140); }, 3400);
  }
  NiaziTools['kids-talking-buddy'] = buddy;

  window.GMKids = { DB: DB, templates: TEMPLATES.map(function (t) { return { id: t.id, n: t.n, cat: t.cat }; }), pdfFromJpeg: pdfFromJpeg, W: W, H: H };
})();
