/* GM Smart Assistant: a real, private "what do you need?" finder. No AI model and no server: it matches what the visitor types
   against the titles, descriptions and keywords of every tool, guide and page on this site (window.GM_INDEX) and ranks the results.
   Nothing the visitor types leaves their device. All output is built with textContent, so it is safe against script injection. */
(function () {
  'use strict';
  var d = document, IDX = window.GM_INDEX || [];
  var form = d.getElementById('as-form'), input = d.getElementById('as-q'), out = d.getElementById('as-out'), status = d.getElementById('as-status');
  if (!form || !input || !out) return;
  var base = d.body.getAttribute('data-root') || '../';

  /* plain-language words people use, mapped to the words used on the site */
  var SYN = {
    cv: 'resume', curriculum: 'resume', vitae: 'resume', job: 'jobs vacancies', jobs: 'vacancies career', hiring: 'jobs recruitment', salary: 'salary tax income', tax: 'tax salary income', loan: 'emi loan', emi: 'loan emi', installment: 'emi loan', instalment: 'emi loan',
    pdf: 'pdf', word: 'word docx', docx: 'word', excel: 'excel xlsx spreadsheet', sheet: 'excel spreadsheet', picture: 'image photo', photo: 'image', pic: 'image', jpg: 'image jpg', png: 'image png',
    compress: 'compress reduce size', shrink: 'compress resize', resize: 'resize image', qr: 'qr code', barcode: 'barcode', password: 'password generator secure', timer: 'timer countdown', alarm: 'alarm clock', clock: 'clock time',
    urdu: 'urdu', roman: 'roman urdu', zakat: 'zakat nisab', hijri: 'hijri islamic date', islamic: 'hijri zakat', age: 'age birthday date', birthday: 'age date', bmi: 'bmi health weight', gpa: 'gpa cgpa grade', cgpa: 'gpa cgpa',
    kids: 'kids children learning', child: 'kids', learn: 'learn learning academy', code: 'developer coding html javascript', coding: 'developer code html css javascript', programming: 'developer code javascript', html: 'html developer playground',
    css: 'css developer', javascript: 'javascript developer', js: 'javascript', json: 'json formatter', regex: 'regex developer', interview: 'interview practice questions', cover: 'cover letter', linkedin: 'linkedin headline',
    template: 'template excel shop', templates: 'template excel shop', buy: 'shop order', sell: 'advertise shop', advertise: 'advertise sponsor', sponsor: 'advertise sponsored', hire: 'services hire', freelance: 'services hire', hr: 'hcm hr attendance leave',
    attendance: 'hr attendance hcm', payroll: 'hcm hr salary', kpi: 'kpi scorecard', sales: 'sales target kpi', report: 'report business', minutes: 'meeting minutes', meeting: 'meeting minutes', note: 'notepad notes workspace', notes: 'notepad notes workspace',
    task: 'tasks planner workspace', tasks: 'tasks planner workspace', todo: 'tasks planner', planner: 'planner tasks workspace', convert: 'converter convert', converter: 'converter', currency: 'currency exchange converter', percent: 'percentage calculator', percentage: 'percentage calculator', discount: 'percentage discount',
    typing: 'typing speed test', color: 'color picker contrast', colour: 'color', contrast: 'color contrast accessibility', budget: 'budget planner', zakat2: 'zakat', money: 'budget salary loan currency', ai: 'assistant', help: 'contact support', security: 'security safe', safe: 'security scam'
  };
  var STOP = { a: 1, an: 1, the: 1, to: 1, of: 1, for: 1, and: 1, or: 1, in: 1, on: 1, my: 1, me: 1, i: 1, want: 1, need: 1, how: 1, do: 1, can: 1, you: 1, is: 1, with: 1, please: 1, make: 1, create: 1, get: 1, find: 1, where: 1, what: 1, that: 1, it: 1, from: 1, into: 1, free: 1, online: 1, tool: 1, tools: 1 };

  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9؀-ۿ\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function terms(q) {
    var out = [], seen = {};
    norm(q).split(' ').forEach(function (w) {
      if (!w || STOP[w]) return;
      [w].concat(SYN[w] ? SYN[w].split(' ') : []).forEach(function (x, i) { if (x && !seen[x]) { seen[x] = 1; out.push({ w: x, direct: i === 0 }); } });
    });
    return out;
  }
  IDX.forEach(function (e) { e._t = norm(e.t); e._k = norm(e.k); e._d = norm(e.d); });
  function score(e, T, make) {
    var s = 0, hits = 0;
    T.forEach(function (x) {
      var w = x.w, k = x.direct ? 1 : .6, h = 0;
      if (e._t.indexOf(w) > -1) { h += (e._t.split(' ').indexOf(w) > -1 ? 6 : 4); }
      if (e._k.indexOf(w) > -1) h += 3;
      if (e._d.indexOf(w) > -1) h += 1.5;
      if (h) hits++; s += h * k;
    });
    if (!hits) return 0;
    if (e.g === 'Tool') s *= 1.25; else if (e.g === 'Guide') s *= 0.95;
    if (make && /builder|generator|maker|creator|writer/i.test(e.t)) s *= 1.3;
    return s;
  }
  function el(tag, cls, text) { var n = d.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function render(q) {
    out.textContent = '';
    var T = terms(q), make = /\b(make|build|create|generate|write)\b/i.test(q);
    if (!T.length) { status.textContent = ''; return; }
    var res = IDX.map(function (e) { return { e: e, s: score(e, T, make) }; }).filter(function (r) { return r.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 8);
    if (!res.length) {
      status.textContent = 'No match for "' + q + '". Try other words, such as "convert pdf", "salary tax" or "resume".';
      var more = el('p', 'muted'); more.appendChild(d.createTextNode('You can also ')); var a = el('a', null, 'browse all free tools'); a.href = base + 'tools/'; more.appendChild(a); more.appendChild(d.createTextNode(' or '));
      var b = el('a', null, 'contact GM'); b.href = base + 'contact/'; more.appendChild(b); more.appendChild(d.createTextNode('.')); out.appendChild(more); return;
    }
    status.textContent = res.length + ' best match' + (res.length > 1 ? 'es' : '') + ' for "' + q + '"';
    res.forEach(function (r, i) {
      var c = el('article', 'card hover as-res'), tag = el('span', 'tag', r.e.g), h = el('h3'), a = el('a', 'stretch', r.e.t); a.href = base + r.e.u; h.appendChild(a);
      c.appendChild(tag); c.appendChild(h); c.appendChild(el('p', 'muted', r.e.d));
      if (i === 0) { var best = el('span', 'as-best', 'Best match'); c.insertBefore(best, tag); }
      out.appendChild(c);
    });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); var q = input.value.trim().slice(0, 120); render(q); try { history.replaceState(null, '', q ? '?q=' + encodeURIComponent(q) : location.pathname); } catch (x) { /* ignore */ } });
  [].forEach.call(d.querySelectorAll('[data-as-q]'), function (b) { b.addEventListener('click', function () { input.value = b.getAttribute('data-as-q'); form.dispatchEvent(new Event('submit', { cancelable: true })); input.focus(); }); });
  var m = /[?&]q=([^&]*)/.exec(location.search); if (m) { try { input.value = decodeURIComponent(m[1]).slice(0, 120); render(input.value); } catch (x) { /* bad escape: ignore */ } }
})();
