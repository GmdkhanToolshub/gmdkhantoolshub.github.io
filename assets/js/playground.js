/* Developer Playground: a live HTML, CSS and JavaScript editor plus a regex tester. Runs entirely in the browser.
   User code runs inside a sandboxed iframe with no access to this site (no same-origin, no cookies, no storage of this page). */
(function () {
  'use strict';
  var d = document, $ = function (id) { return d.getElementById(id); };
  var KEY = 'gm.playground.v1';
  var PRESETS = {
    'html-basics': { html: '<h1>My first web page</h1>\n<p>This is a paragraph. Change the text and watch the preview update.</p>\n<ul>\n  <li>Learn HTML</li>\n  <li>Learn CSS</li>\n  <li>Learn JavaScript</li>\n</ul>\n<a href="https://developer.mozilla.org/" target="_blank" rel="noopener">MDN Web Docs</a>', css: 'body { font-family: system-ui, sans-serif; padding: 24px; }', js: '' },
    'css-basics': { html: '<div class="card">\n  <h2>Hello CSS</h2>\n  <p>Style me with colours, spacing and rounded corners.</p>\n  <button>Click me</button>\n</div>', css: 'body { font-family: system-ui, sans-serif; background: #f1f5f9; display: grid; place-items: center; min-height: 100vh; margin: 0; }\n.card { background: #fff; padding: 24px 28px; border-radius: 16px; box-shadow: 0 10px 30px rgba(15,30,56,.12); max-width: 320px; }\nh2 { margin: 0 0 8px; color: #2563eb; }\nbutton { background: #2563eb; color: #fff; border: 0; padding: 10px 18px; border-radius: 10px; cursor: pointer; }\nbutton:hover { background: #1d4ed8; }', js: '' },
    'js-basics': { html: '<h2>Tip calculator</h2>\n<label>Bill: <input id="bill" type="number" value="2000"></label>\n<label>Tip %: <input id="pct" type="number" value="10"></label>\n<button id="go">Calculate</button>\n<p id="out"></p>', css: 'body { font-family: system-ui, sans-serif; padding: 24px; line-height: 2; }\ninput { width: 90px; padding: 4px; }', js: 'function tip(bill, pct) {\n  return bill * pct / 100;\n}\ndocument.getElementById("go").addEventListener("click", function () {\n  var bill = Number(document.getElementById("bill").value);\n  var pct = Number(document.getElementById("pct").value);\n  var t = tip(bill, pct);\n  document.getElementById("out").textContent = "Tip: " + t.toFixed(2) + "  |  Total: " + (bill + t).toFixed(2);\n  console.log("Calculated tip", t);\n});' },
    'js-dom': { html: '<h2>To-do list</h2>\n<input id="task" placeholder="New task">\n<button id="add">Add</button>\n<ul id="list"></ul>', css: 'body { font-family: system-ui, sans-serif; padding: 24px; }\nli { cursor: pointer; padding: 4px 0; }\nli.done { text-decoration: line-through; opacity: .5; }', js: 'var list = document.getElementById("list");\ndocument.getElementById("add").addEventListener("click", function () {\n  var input = document.getElementById("task");\n  if (!input.value.trim()) return;\n  var li = document.createElement("li");\n  li.textContent = input.value.trim();\n  li.addEventListener("click", function () { li.classList.toggle("done"); });\n  list.appendChild(li);\n  input.value = "";\n});' },
    blank: { html: '<h1>Hello</h1>', css: 'body { font-family: system-ui, sans-serif; padding: 24px; }', js: 'console.log("Ready");' }
  };
  var ed = { html: $('pg-html'), css: $('pg-css'), js: $('pg-js') }, frame = $('pg-frame'), con = $('pg-console'), note = $('pg-note');
  if (!ed.html || !frame) return;

  function store(v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(KEY)); localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { return null; } }
  function load(p) { ed.html.value = p.html; ed.css.value = p.css; ed.js.value = p.js; }
  var m = /[?&]preset=([a-z-]+)/.exec(location.search), saved = store();
  if (m && PRESETS[m[1]]) load(PRESETS[m[1]]); else if (saved && typeof saved.html === 'string') load(saved); else load(PRESETS['html-basics']);

  var token = 'gm' + Math.random().toString(36).slice(2);
  var HOOK = '<script>(function(){var t=' + JSON.stringify(token) + ';function s(l,a){try{parent.postMessage({t:t,l:l,m:[].map.call(a,function(x){try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(" ")},"*")}catch(e){}}["log","warn","error","info"].forEach(function(k){var o=console[k];console[k]=function(){s(k,arguments);o.apply(console,arguments)}});window.addEventListener("error",function(e){s("error",[e.message+(e.lineno?" (line "+e.lineno+")":"")])});window.addEventListener("unhandledrejection",function(e){s("error",["Unhandled: "+e.reason])})})();<\/script>';
  function doc() {
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + ed.css.value.replace(/<\/style/gi, '<\\/style') + '</style></head><body>' + ed.html.value + HOOK + '<script>' + ed.js.value.replace(/<\/script/gi, '<\\/script') + '<\/script></body></html>';
  }
  function logLine(kind, text) { var p = d.createElement('div'); p.className = 'pg-log pg-' + kind; p.textContent = text; con.appendChild(p); con.scrollTop = con.scrollHeight; }
  window.addEventListener('message', function (e) { var x = e.data; if (e.source !== frame.contentWindow || !x || x.t !== token) return; logLine(['log', 'warn', 'error', 'info'].indexOf(x.l) > -1 ? x.l : 'log', String(x.m).slice(0, 500)); });
  function run() { con.textContent = ''; frame.srcdoc = doc(); store({ html: ed.html.value, css: ed.css.value, js: ed.js.value }); }
  var timer; function later() { clearTimeout(timer); timer = setTimeout(run, 500); }
  Object.keys(ed).forEach(function (k) { ed[k].addEventListener('input', later); });
  $('pg-run').addEventListener('click', run);
  $('pg-reset').addEventListener('click', function () { load(PRESETS.blank); run(); });
  $('pg-clear').addEventListener('click', function () { con.textContent = ''; });
  $('pg-dl').addEventListener('click', function () {
    var b = new Blob([doc().replace(HOOK, '')], { type: 'text/html' }), a = d.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'my-page.html'; d.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });
  [].forEach.call(d.querySelectorAll('[data-preset]'), function (b) { b.addEventListener('click', function () { load(PRESETS[b.getAttribute('data-preset')]); run(); }); });
  [].forEach.call(d.querySelectorAll('.pg-tab'), function (t) {
    t.addEventListener('click', function () { [].forEach.call(d.querySelectorAll('.pg-tab'), function (o) { o.setAttribute('aria-selected', String(o === t)); }); Object.keys(ed).forEach(function (k) { ed[k].hidden = k !== t.getAttribute('data-tab'); }); });
  });
  note.textContent = 'Your code runs in a sandbox and is saved only in this browser.';
  run();

  /* ---------- regex tester ---------- */
  var rp = $('rx-pat'), rf = $('rx-flags'), rt = $('rx-text'), ro = $('rx-out'), rl = $('rx-list'), re = $('rx-err');
  function rx() {
    ro.textContent = ''; rl.textContent = ''; re.textContent = '';
    var pat = rp.value; if (!pat) { ro.textContent = rt.value; return; }
    var flags = rf.value.replace(/[^dgimsuy]/g, '').replace(/(.)(?=.*\1)/g, '$1'); if (flags.indexOf('g') < 0) flags += 'g';
    var r; try { r = new RegExp(pat, flags); } catch (e) { re.textContent = 'Invalid pattern: ' + e.message; ro.textContent = rt.value; return; }
    var text = rt.value.slice(0, 20000), last = 0, n = 0, mm;
    while ((mm = r.exec(text)) !== null && n < 500) {
      if (mm[0] === '') { r.lastIndex++; continue; }
      ro.appendChild(d.createTextNode(text.slice(last, mm.index))); var mk = d.createElement('mark'); mk.textContent = mm[0]; ro.appendChild(mk); last = mm.index + mm[0].length; n++;
      var li = d.createElement('li'); li.textContent = '#' + n + ' at ' + mm.index + ': "' + mm[0] + '"' + (mm.length > 1 ? '  groups: ' + mm.slice(1).map(function (g) { return g === undefined ? 'undefined' : '"' + g + '"'; }).join(', ') : ''); rl.appendChild(li);
    }
    ro.appendChild(d.createTextNode(text.slice(last)));
    $('rx-count').textContent = n + ' match' + (n === 1 ? '' : 'es');
  }
  [rp, rf, rt].forEach(function (x) { x.addEventListener('input', rx); }); rx();
})();
