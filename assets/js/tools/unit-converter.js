/* Unit Converter with Pakistani land and weight units (marla, kanal, tola, maund). Factors are to a base unit. */
NiaziTools['unit-converter'] = function (root, U) {
  var SQFT = 0.09290304; // square metres in one square foot
  function cats(marla) {
    return {
      length: { label: 'Length', base: 'm', units: { mm: ['Millimetre', 0.001], cm: ['Centimetre', 0.01], m: ['Metre', 1], km: ['Kilometre', 1000], in: ['Inch', 0.0254], ft: ['Foot', 0.3048], yd: ['Yard', 0.9144], mi: ['Mile', 1609.344], gaz: ['Gaz (yard)', 0.9144] } },
      area: { label: 'Area & land', base: 'm²', units: { sqft: ['Square foot', SQFT], sqyd: ['Square yard', 0.83612736], sqm: ['Square metre', 1], marla: ['Marla (' + marla + ' sq ft)', marla * SQFT], kanal: ['Kanal (20 marla)', 20 * marla * SQFT], acre: ['Acre', 4046.8564224], hectare: ['Hectare', 10000], sqkm: ['Square kilometre', 1e6] } },
      weight: { label: 'Weight', base: 'kg', units: { mg: ['Milligram', 1e-6], g: ['Gram', 0.001], kg: ['Kilogram', 1], tonne: ['Tonne', 1000], oz: ['Ounce', 0.028349523125], lb: ['Pound', 0.45359237], tola: ['Tola (11.66 g)', 0.0116638], ser: ['Ser / seer (1 kg)', 1], maund: ['Maund / mann (40 kg)', 40] } },
      volume: { label: 'Volume', base: 'L', units: { ml: ['Millilitre', 0.001], l: ['Litre', 1], m3: ['Cubic metre', 1000], tsp: ['Teaspoon (US)', 0.00492892159375], tbsp: ['Tablespoon (US)', 0.01478676478125], cup: ['Cup (US)', 0.2365882365], galus: ['Gallon (US)', 3.785411784], galuk: ['Gallon (UK)', 4.54609], cft: ['Cubic foot', 28.316846592] } },
      temperature: { label: 'Temperature', units: { c: ['Celsius'], f: ['Fahrenheit'], k: ['Kelvin'] } },
      speed: { label: 'Speed', base: 'm/s', units: { kmh: ['Kilometres per hour', 1 / 3.6], mph: ['Miles per hour', 0.44704], ms: ['Metres per second', 1], knot: ['Knot', 0.514444] } },
      data: { label: 'Digital storage', base: 'B', units: { b: ['Byte', 1], kb: ['Kilobyte (1000 B)', 1e3], mb: ['Megabyte', 1e6], gb: ['Gigabyte', 1e9], tb: ['Terabyte', 1e12], kib: ['Kibibyte (1024 B)', 1024], mib: ['Mebibyte', 1048576], gib: ['Gibibyte', 1073741824] } }
    };
  }
  var DEF = { length: ['ft', 'm'], area: ['marla', 'sqft'], weight: ['kg', 'lb'], volume: ['l', 'galus'], temperature: ['c', 'f'], speed: ['kmh', 'mph'], data: ['gb', 'mb'] };
  function toC(v, u) { return u === 'c' ? v : u === 'f' ? (v - 32) * 5 / 9 : v - 273.15; }
  function fromC(v, u) { return u === 'c' ? v : u === 'f' ? v * 9 / 5 + 32 : v + 273.15; }
  root.innerHTML = '<div class="chips" id="uc-cats" role="tablist" aria-label="Unit category" style="margin-top:0"></div><div id="uc-body"></div>';
  var cat = 'area', marla = U.store.get('gm.marla', 225);
  function drawCats() {
    var C = cats(marla);
    root.querySelector('#uc-cats').innerHTML = Object.keys(C).map(function (k) { return '<button type="button" class="chip" data-cat="' + k + '" aria-pressed="' + (k === cat) + '">' + C[k].label + '</button>'; }).join('');
  }
  function draw() {
    var C = cats(marla), U2 = C[cat].units, opts = Object.keys(U2).map(function (k) { return { value: k, label: U2[k][0] }; });
    var fields = [{ id: 'v', label: 'Value', type: 'number', value: '1' },
      { id: 'from', label: 'From', type: 'select', value: DEF[cat][0], options: opts },
      { id: 'to', label: 'To', type: 'select', value: DEF[cat][1], options: opts }];
    if (cat === 'area') fields.push({ id: 'marla', label: 'Marla size', type: 'select', value: String(marla), options: [{ value: '225', label: '225 sq ft (common in Punjab housing schemes)' }, { value: '272.25', label: '272.25 sq ft (revenue / older records)' }, { value: '250', label: '250 sq ft (some societies)' }], hint: 'Marla size varies by area and authority. Check your property papers.' });
    U.mount(root.querySelector('#uc-body'), {
      fields: fields,
      after: '<div class="tool-actions" style="margin:4px 0 0"><button type="button" class="btn btn-ghost btn-sm" id="uc-swap">⇄ Swap units</button></div>',
      onInput: function (v, c) {
        if (cat === 'area' && +v.marla !== marla) { marla = +v.marla; U.store.set('gm.marla', marla); drawCats(); var keep = v; draw(); var b = root.querySelector('#uc-body'); ['v', 'from', 'to'].forEach(function (k) { var el = b.querySelector('#f-' + k); if (el) el.value = keep[k]; }); b.querySelector('#f-v').dispatchEvent(new Event('change', { bubbles: true })); return; }
        var x = U.num(v.v); if (!U.isNum(x)) return c.empty('Enter a value to convert.');
        var res, list;
        if (cat === 'temperature') {
          if (v.from === 'k' && x < 0) return c.error('Kelvin cannot be below zero.');
          var cc = toC(x, v.from); res = fromC(cc, v.to);
          list = Object.keys(U2).map(function (k) { return [U2[k][0], U.fmt(fromC(cc, k), 4)]; });
        } else {
          if (x < 0) return c.error('Enter a value of zero or more.');
          var baseV = x * U2[v.from][1]; res = baseV / U2[v.to][1];
          list = Object.keys(U2).map(function (k) { return [U2[k][0], U.fmt(baseV / U2[k][1], 6)]; });
        }
        c.html(U.grid([U.box(U.fmt(x, 6) + ' ' + U2[v.from][0] + ' =', U.fmt(res, 6) + ' ' + U.esc(U2[v.to][0]), '', true)]) +
          '<h3 style="font-size:1rem;margin:18px 0 8px">In every ' + C[cat].label.toLowerCase() + ' unit</h3>' + U.table(['Unit', 'Value'], list, 1));
      }
    });
    var b = root.querySelector('#uc-body');
    b.querySelector('#uc-swap').onclick = function () { var f = b.querySelector('#f-from'), t = b.querySelector('#f-to'), s = f.value; f.value = t.value; t.value = s; f.dispatchEvent(new Event('change', { bubbles: true })); };
  }
  root.querySelector('#uc-cats').addEventListener('click', function (e) { var b = e.target.closest('[data-cat]'); if (!b) return; cat = b.getAttribute('data-cat'); drawCats(); draw(); });
  drawCats(); draw();
};
