/* Calculator: basic and scientific in one tool. Uses a safe expression parser (no eval). */
NiaziTools['calculator'] = function (root, U) {
  var deg = true, last = 0, hist = U.store.get('gm.calc.hist', []), mode = 'basic';
  /* ---------- parser ---------- */
  function tokenize(src) {
    var s = src.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/π/g, 'pi').replace(/√/g, 'sqrt'), out = [], i = 0;
    while (i < s.length) {
      var ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (/[0-9.]/.test(ch)) { var m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i)); if (!m) throw new Error('Invalid number'); var nm = m[0]; if (m[2] && /^e/i.test(m[2]) && !/\d$/.test(m[2])) { nm = m[1]; } out.push({ t: 'n', v: parseFloat(nm) }); i += nm.length; continue; }
      if (/[a-z]/i.test(ch)) { var id = /^[a-z][a-z0-9]*/i.exec(s.slice(i))[0]; out.push({ t: 'id', v: id.toLowerCase() }); i += id.length; continue; }
      if ('+-*/^!%(),'.indexOf(ch) >= 0) { out.push({ t: ch }); i++; continue; }
      throw new Error('Unexpected “' + ch + '”');
    }
    return out;
  }
  var FUNCS = {
    sin: function (x) { return trig(Math.sin(rad(x))); }, cos: function (x) { return trig(Math.cos(rad(x))); }, tan: function (x) { if (deg && Math.abs(((x % 180) + 180) % 180 - 90) < 1e-9) throw new Error('Undefined'); return trig(Math.tan(rad(x))); },
    asin: function (x) { if (x < -1 || x > 1) throw new Error('Invalid input'); return unrad(Math.asin(x)); }, acos: function (x) { if (x < -1 || x > 1) throw new Error('Invalid input'); return unrad(Math.acos(x)); }, atan: function (x) { return unrad(Math.atan(x)); },
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, ln: function (x) { if (x <= 0) throw new Error('Invalid input'); return Math.log(x); }, log: function (x) { if (x <= 0) throw new Error('Invalid input'); return Math.log10(x); },
    log2: function (x) { if (x <= 0) throw new Error('Invalid input'); return Math.log2(x); }, sqrt: function (x) { if (x < 0) throw new Error('Invalid input'); return Math.sqrt(x); }, cbrt: Math.cbrt, abs: Math.abs, exp: Math.exp,
    floor: Math.floor, ceil: Math.ceil, round: Math.round, fact: fact
  };
  function rad(x) { return deg ? x * Math.PI / 180 : x; } function unrad(x) { return deg ? x * 180 / Math.PI : x; } function trig(x) { return Math.abs(x) < 1e-15 ? 0 : x; }
  function fact(n) { if (n < 0 || Math.floor(n) !== n || n > 170) throw new Error('Factorial needs a whole number from 0 to 170'); var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; }
  function evaluate(src) {
    var toks = tokenize(src), p = 0;
    if (!toks.length) throw new Error('Enter a calculation');
    function peek() { return toks[p]; } function eat(t) { if (toks[p] && toks[p].t === t) return toks[p++]; return null; }
    function expr() { var v = term(); for (;;) { if (eat('+')) v += term(); else if (eat('-')) v -= term(); else return v; } }
    function term() {
      var v = unary();
      for (;;) {
        var t = peek();
        if (eat('*')) v *= unary();
        else if (eat('/')) { var d = unary(); if (d === 0) throw new Error('Cannot divide by zero'); v /= d; }
        else if (t && (t.t === 'n' || t.t === 'id' || t.t === '(')) v *= unary(); // implicit multiplication: 2π, 3(4+1)
        else return v;
      }
    }
    function unary() { if (eat('-')) return -unary(); if (eat('+')) return unary(); return power(); }
    function power() { var b = postfix(); if (eat('^')) { var e = unary(); var r = Math.pow(b, e); if (!isFinite(r) && isFinite(b) && isFinite(e)) throw new Error('Result is too large'); if (isNaN(r)) throw new Error('Invalid input'); return r; } return b; }
    function postfix() { var v = primary(); for (;;) { if (eat('!')) v = fact(v); else if (eat('%')) v = v / 100; else return v; } }
    function primary() {
      var t = toks[p++]; if (!t) throw new Error('Incomplete calculation');
      if (t.t === 'n') return t.v;
      if (t.t === '(') { var v = expr(); if (!eat(')')) throw new Error('Missing closing bracket'); return v; }
      if (t.t === 'id') {
        if (t.v === 'pi') return Math.PI; if (t.v === 'e') return Math.E; if (t.v === 'ans') return last;
        var f = FUNCS[t.v]; if (!f) throw new Error('Unknown “' + t.v + '”');
        if (!eat('(')) throw new Error(t.v + ' needs brackets, for example ' + t.v + '(5)'); var a = expr(); if (!eat(')')) throw new Error('Missing closing bracket'); var r = f(a); if (isNaN(r)) throw new Error('Invalid input'); return r;
      }
      throw new Error('Unexpected “' + (t.t === 'n' ? t.v : t.t) + '”');
    }
    var res = expr(); if (p < toks.length) throw new Error('Unexpected “' + (toks[p].v != null ? toks[p].v : toks[p].t) + '”');
    if (!isFinite(res)) throw new Error('Result is too large');
    return res;
  }
  function show(v) { if (v === 0) return '0'; var a = Math.abs(v); if (a >= 1e15 || a < 1e-9) return v.toExponential(8).replace(/\.?0+e/, 'e'); return String(parseFloat(v.toPrecision(12))); }
  /* ---------- UI ---------- */
  var BASIC = [['C', 'clear', 'k-fn'], ['⌫', 'back', 'k-fn'], ['%', '%', 'k-fn'], ['÷', '÷', 'k-op'], ['7'], ['8'], ['9'], ['×', '×', 'k-op'], ['4'], ['5'], ['6'], ['−', '−', 'k-op'], ['1'], ['2'], ['3'], ['+', '+', 'k-op'], ['±', 'neg', 'k-fn'], ['0'], ['.'], ['=', 'eq', 'k-eq']];
  var SCI = [['sin', 'sin(', 'k-sci'], ['cos', 'cos(', 'k-sci'], ['tan', 'tan(', 'k-sci'], ['ln', 'ln(', 'k-sci'], ['log', 'log(', 'k-sci'], ['asin', 'asin(', 'k-sci'], ['acos', 'acos(', 'k-sci'], ['atan', 'atan(', 'k-sci'], ['√', 'sqrt(', 'k-sci'], ['xʸ', '^', 'k-sci'], ['x²', '^2', 'k-sci'], ['n!', '!', 'k-sci'], ['π', 'π', 'k-sci'], ['e', 'e', 'k-sci'], ['(', '(', 'k-sci'], [')', ')', 'k-sci'], ['Ans', 'ans', 'k-sci'], ['1/x', '1/(', 'k-sci'], ['|x|', 'abs(', 'k-sci'], ['eˣ', 'exp(', 'k-sci']];
  root.innerHTML = '<div class="calc"><div class="calc-screen"><input type="text" id="cc-expr" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="Calculation" placeholder="0"><div class="calc-res" id="cc-res" aria-live="polite">0</div></div>' +
    '<div class="calc-opts" id="cc-sci-opts" hidden><div class="tabs" role="group" aria-label="Angle unit" style="margin:0"><button type="button" class="tab" id="cc-deg" aria-selected="true">Degrees</button><button type="button" class="tab" id="cc-rad" aria-selected="false">Radians</button></div></div>' +
    '<div class="calc-grid"><div class="calc-sci" id="cc-sci" hidden></div><div class="calc-keys" id="cc-keys"></div></div></div><h3 style="font-size:1rem;margin:20px 0 8px">History</h3><div id="cc-hist"></div>' +
    '<p class="small muted">Type or tap. Brackets, % (divides by 100), ! (factorial) and implicit multiplication like 2π or 3(4+1) all work. Results show up to 12 digits.</p>';
  var $ = function (s) { return root.querySelector(s); }, inp = $('#cc-expr'), res = $('#cc-res');
  function keyBtn(k) { return '<button type="button" class="calc-key ' + (k[2] || '') + '" data-k="' + U.esc(k[1] || k[0]) + '">' + U.esc(k[0]) + '</button>'; }
  $('#cc-keys').innerHTML = BASIC.map(keyBtn).join(''); $('#cc-sci').innerHTML = SCI.map(keyBtn).join('');
  function live() { var t = inp.value.trim(); if (!t) { res.textContent = '0'; res.classList.remove('err'); return; } try { res.textContent = '= ' + show(evaluate(t)); res.classList.remove('err'); } catch (e) { res.textContent = /Incomplete|Missing|Unexpected/.test(e.message) ? '…' : e.message; res.classList.toggle('err', !/Incomplete|Missing|Unexpected/.test(e.message)); } }
  function insert(s) { var a = inp.selectionStart == null ? inp.value.length : inp.selectionStart, b = inp.selectionEnd == null ? a : inp.selectionEnd; inp.value = inp.value.slice(0, a) + s + inp.value.slice(b); inp.selectionStart = inp.selectionEnd = a + s.length; inp.focus(); live(); }
  function equals() {
    var t = inp.value.trim(); if (!t) return; try { var v = evaluate(t); last = v; hist.unshift({ e: t, r: show(v) }); hist = hist.slice(0, 12); U.store.set('gm.calc.hist', hist); inp.value = show(v); res.textContent = '= ' + show(v); res.classList.remove('err'); drawHist(); }
    catch (e) { res.textContent = e.message; res.classList.add('err'); }
  }
  function drawHist() { $('#cc-hist').innerHTML = hist.length ? '<div class="calc-hist">' + hist.map(function (h, i) { return '<button type="button" data-h="' + i + '"><span>' + U.esc(h.e) + '</span><b>' + U.esc(h.r) + '</b></button>'; }).join('') + '</div><button type="button" class="btn btn-ghost btn-sm" id="cc-clearh" style="margin-top:8px">Clear history</button>' : '<div class="result-empty">Your recent calculations appear here.</div>'; }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-k]'), h = e.target.closest('[data-h]');
    if (h) { inp.value = hist[+h.getAttribute('data-h')].r; live(); inp.focus(); return; }
    if (e.target.id === 'cc-clearh') { hist = []; U.store.set('gm.calc.hist', hist); drawHist(); return; }
    if (!b) return; var k = b.getAttribute('data-k');
    if (k === 'clear') { inp.value = ''; live(); inp.focus(); } else if (k === 'back') { inp.value = inp.value.slice(0, -1); live(); inp.focus(); } else if (k === 'eq') equals();
    else if (k === 'neg') { var v = inp.value.trim(); if (v) { try { inp.value = show(-evaluate(v)); } catch (er) { inp.value = v.charAt(0) === '-' ? v.slice(1) : '-' + v; } live(); } }
    else insert(k);
  });
  inp.addEventListener('input', live);
  inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); equals(); } else if (e.key === 'Escape') { inp.value = ''; live(); } });
  function setAngle(d) { deg = d; $('#cc-deg').setAttribute('aria-selected', d); $('#cc-rad').setAttribute('aria-selected', !d); live(); }
  $('#cc-deg').addEventListener('click', function () { setAngle(true); }); $('#cc-rad').addEventListener('click', function () { setAngle(false); });
  U.tabs(root, ['Basic', 'Scientific'], function (i) { mode = i ? 'sci' : 'basic'; $('#cc-sci').hidden = !i; $('#cc-sci-opts').hidden = !i; $('.calc').classList.toggle('is-sci', !!i); });
  drawHist(); live();
  NiaziTools['calculator'].api = { evaluate: evaluate, setDeg: function (d) { deg = d; } };
};
