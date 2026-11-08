/* Barcode Generator: Code 128, EAN-13, UPC-A and Code 39 as crisp SVG, with PNG download. Built in, no library. */
NiaziTools['barcode-generator'] = function (root, U) {
  /* ---------- Code 128 ---------- */
  var C128 = ['212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412', '211214', '211232', '2331112'];
  function widthsToBits(w) { var bits = '', bar = true; for (var i = 0; i < w.length; i++) { bits += (bar ? '1' : '0').repeat(+w[i]); bar = !bar; } return bits; }
  function code128(text) {
    if (!text) throw new Error('Enter the text or number to encode.');
    for (var i = 0; i < text.length; i++) { var c = text.charCodeAt(i); if (c < 32 || c > 126) throw new Error('Code 128 here supports standard keyboard characters only (letters, numbers and symbols). “' + text[i] + '” is not supported.'); }
    var codes = [], useC = /^\d+$/.test(text) && text.length >= 4, pos = 0;
    if (useC) {
      var even = text.length - (text.length % 2); codes.push(105); for (; pos < even; pos += 2) codes.push(+text.substr(pos, 2));
      if (pos < text.length) { codes.push(100); codes.push(text.charCodeAt(pos) - 32); }
    } else { codes.push(104); for (; pos < text.length; pos++) codes.push(text.charCodeAt(pos) - 32); }
    var sum = codes[0]; for (var k = 1; k < codes.length; k++) sum += codes[k] * k; codes.push(sum % 103); codes.push(106);
    return codes.map(function (c) { return widthsToBits(C128[c]); }).join('');
  }
  /* ---------- EAN-13 / UPC-A ---------- */
  var L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'], G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'], R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
  var PAR = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
  function check(d) { var s = 0; for (var i = 0; i < d.length; i++) s += +d[i] * ((d.length - i) % 2 ? 3 : 1); return (10 - s % 10) % 10; }
  function ean13(text) {
    if (!/^\d{12,13}$/.test(text)) throw new Error('EAN-13 needs 12 digits (the check digit is added for you) or 13 digits.');
    var d = text.length === 12 ? text + check(text) : text;
    if (+d[12] !== check(d.slice(0, 12))) throw new Error('The last digit is not correct for this number. It should be ' + check(d.slice(0, 12)) + '.');
    var par = PAR[+d[0]], bits = '101';
    for (var i = 1; i <= 6; i++) bits += (par[i - 1] === 'L' ? L : G)[+d[i]];
    bits += '01010'; for (var j = 7; j <= 12; j++) bits += R[+d[j]];
    return { bits: bits + '101', digits: d };
  }
  function upca(text) {
    if (!/^\d{11,12}$/.test(text)) throw new Error('UPC-A needs 11 digits (the check digit is added for you) or 12 digits.');
    var r = ean13('0' + text); return { bits: r.bits, digits: r.digits.slice(1) };
  }
  /* ---------- Code 39 ---------- */
  var C39 = { '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn', '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw', '8': 'wnnwnnwnn', '9': 'nnwwnnwnn', A: 'wnnnnwnnw', B: 'nnwnnwnnw', C: 'wnwnnwnnn', D: 'nnnnwwnnw', E: 'wnnnwwnnn', F: 'nnwnwwnnn', G: 'nnnnnwwnw', H: 'wnnnnwwnn', I: 'nnwnnwwnn', J: 'nnnnwwwnn', K: 'wnnnnnnww', L: 'nnwnnnnww', M: 'wnwnnnnwn', N: 'nnnnwnnww', O: 'wnnnwnnwn', P: 'nnwnwnnwn', Q: 'nnnnnnwww', R: 'wnnnnnwwn', S: 'nnwnnnwwn', T: 'nnnnwnwwn', U: 'wwnnnnnnw', V: 'nwwnnnnnw', W: 'wwwnnnnnn', X: 'nwnnwnnnw', Y: 'wwnnwnnnn', Z: 'nwwnwnnnn', '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '$': 'nwnwnwnnn', '/': 'nwnwnnnwn', '+': 'nwnnnwnwn', '%': 'nnnwnwnwn', '*': 'nwnnwnwnn' };
  function code39(text) {
    var t = text.toUpperCase(); if (!t) throw new Error('Enter the text or number to encode.');
    for (var i = 0; i < t.length; i++) if (!C39[t[i]] || t[i] === '*') throw new Error('Code 39 supports capital letters, numbers and - . space $ / + % only. “' + text[i] + '” is not supported.');
    var bits = '', all = '*' + t + '*';
    for (var k = 0; k < all.length; k++) { var pat = C39[all[k]], bar = true; for (var j = 0; j < 9; j++) { bits += (bar ? '1' : '0').repeat(pat[j] === 'w' ? 3 : 1); bar = !bar; } if (k < all.length - 1) bits += '0'; }
    return bits;
  }
  /* ---------- SVG ---------- */
  function encode(fmt, text) {
    if (fmt === 'code128') return { bits: code128(text), label: text };
    if (fmt === 'code39') return { bits: code39(text), label: text.toUpperCase() };
    var r = fmt === 'ean13' ? ean13(text) : upca(text); return { bits: r.bits, label: r.digits, digits: true, fmt: fmt };
  }
  function svg(enc, o) {
    var m = o.mod, quiet = 10 * m, w = enc.bits.length * m + quiet * 2, bh = o.h, th = o.text ? 22 : 0, h = bh + th + 16, rects = [], i = 0;
    while (i < enc.bits.length) { if (enc.bits[i] === '1') { var j = i; while (enc.bits[j] === '1') j++; rects.push('<rect x="' + (quiet + i * m) + '" y="8" width="' + (j - i) * m + '" height="' + bh + '"/>'); i = j; } else i++; }
    var txt = '';
    if (o.text) {
      var y = bh + 8 + 16, font = 'font-family="Consolas, Menlo, monospace" font-size="14" text-anchor="middle" fill="' + o.fg + '"';
      if (enc.digits) { var d = enc.label, n = d.length; if (enc.fmt === 'ean13') { txt = '<text x="' + (quiet - 4) + '" y="' + y + '" ' + font.replace('middle', 'end') + '>' + d[0] + '</text><text x="' + (quiet + (3 + 21) * m) + '" y="' + y + '" ' + font + ' letter-spacing="1">' + d.slice(1, 7) + '</text><text x="' + (quiet + (3 + 42 + 5 + 21) * m) + '" y="' + y + '" ' + font + ' letter-spacing="1">' + d.slice(7) + '</text>'; } else { txt = '<text x="' + (w / 2) + '" y="' + y + '" ' + font + ' letter-spacing="2">' + d + '</text>'; } }
      else txt = '<text x="' + (w / 2) + '" y="' + y + '" ' + font + '>' + U.esc(enc.label) + '</text>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Barcode ' + U.esc(enc.label) + '"><rect width="100%" height="100%" fill="' + o.bg + '"/><g fill="' + o.fg + '">' + rects.join('') + '</g>' + txt + '</svg>';
  }
  U.mount(root, {
    fields: [
      { id: 'fmt', label: 'Barcode type', type: 'select', value: 'code128', options: [{ value: 'code128', label: 'Code 128 (any text or numbers)' }, { value: 'ean13', label: 'EAN-13 (retail products)' }, { value: 'upca', label: 'UPC-A (retail, North America)' }, { value: 'code39', label: 'Code 39 (capital letters and numbers)' }] },
      { id: 'text', label: 'Text or number', type: 'text', value: 'GM-2026-001', maxlength: 60 },
      { id: 'mod', label: 'Bar width', type: 'select', value: '2', options: [{ value: '1', label: 'Thin (1 px)' }, { value: '2', label: 'Normal (2 px)' }, { value: '3', label: 'Wide (3 px)' }, { value: '4', label: 'Extra wide (4 px)' }] },
      { id: 'h', label: 'Bar height (px)', type: 'number', value: '90' },
      { id: 'fg', label: 'Bar colour', type: 'color', value: '#000000' }, { id: 'bg', label: 'Background colour', type: 'color', value: '#ffffff' },
      { id: 'text2', label: 'Show the text under the bars', type: 'checkbox', value: true }
    ],
    onInput: function (v, c) {
      var hint = { code128: 'Any letters, numbers or symbols. Long numbers are packed to make a shorter barcode.', ean13: 'Enter 12 digits and the 13th check digit is calculated for you.', upca: 'Enter 11 digits and the 12th check digit is calculated for you.', code39: 'Capital letters A–Z, numbers 0–9 and - . space $ / + %.' }[v.fmt];
      var h = U.num(v.h); if (!U.isNum(h) || h < 30 || h > 400) return c.error('Bar height should be between 30 and 400 pixels.');
      if (v.fg.toLowerCase() === v.bg.toLowerCase()) return c.error('The bar and background colours are the same, so the barcode would be invisible.');
      var enc; try { enc = encode(v.fmt, v.text.trim()); } catch (e) { return c.empty(e.message); }
      var s = svg(enc, { mod: +v.mod, h: h, fg: v.fg, bg: v.bg, text: v.text2 });
      c.html('<div class="bc-stage" style="background:' + U.esc(v.bg) + '">' + s + '</div><p class="small muted">' + U.esc(hint) + ' ' + enc.bits.length + ' modules wide.</p>' +
        '<div class="tool-actions"><button type="button" class="btn btn-primary btn-sm" id="bc-svg">Download SVG</button><button type="button" class="btn btn-ghost btn-sm" id="bc-png">Download PNG</button></div>' +
        '<p class="result-note">Always scan a printed barcode with a real scanner before using it. For retail products, official EAN and UPC numbers are assigned by GS1.</p>');
      var name = 'barcode-' + U.slug(enc.label);
      c.$('#bc-svg').onclick = function () { U.download(name + '.svg', s, 'image/svg+xml'); };
      c.$('#bc-png').onclick = function () {
        var img = new Image(), url = URL.createObjectURL(new Blob([s], { type: 'image/svg+xml' })), k = 3;
        img.onload = function () { var cv = document.createElement('canvas'); cv.width = img.width * k; cv.height = img.height * k; var x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); cv.toBlob(function (b) { U.download(name + '.png', b); }, 'image/png'); };
        img.onerror = function () { URL.revokeObjectURL(url); c.error('Could not create the PNG. Download the SVG instead.'); }; img.src = url;
      };
    },
    reset: true
  });
  NiaziTools['barcode-generator'].api = { code128: code128, ean13: ean13, upca: upca, code39: code39, check: check };
};
