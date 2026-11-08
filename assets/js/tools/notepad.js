/* Notepad: several notes that save automatically in this browser (local storage). Nothing is sent anywhere. */
NiaziTools['notepad'] = function (root, U) {
  var KEY = 'gm.notes.v1', data = U.store.get(KEY, null) || { cur: 1, next: 2, notes: [{ id: 1, text: '', t: Date.now() }] }, timer = 0, confirmDel = false;
  root.innerHTML = '<div class="np"><aside class="np-side"><div class="field" style="margin-bottom:8px"><label for="np-find" class="sr-only">Search notes</label><input type="search" id="np-find" placeholder="Search notes…"></div><button type="button" class="btn btn-primary btn-sm" id="np-new" style="width:100%">+ New note</button><div class="np-list" id="np-list" role="list"></div></aside>' +
    '<div class="np-main"><label for="np-text" class="sr-only">Note</label><textarea id="np-text" spellcheck="true" placeholder="Start typing. Your note saves automatically on this device."></textarea>' +
    '<div class="np-bar"><span class="small muted" id="np-stat"></span><span class="np-btns"><button type="button" class="btn btn-ghost btn-sm" id="np-copy">Copy</button><button type="button" class="btn btn-ghost btn-sm" id="np-dl">Download .txt</button><button type="button" class="btn btn-ghost btn-sm" id="np-del">Delete</button></span></div></div></div>' +
    '<p class="small muted">Notes are saved only in this browser on this device. Clearing your browser data deletes them, so download anything important. Do not store passwords here.</p>';
  var $ = function (s) { return root.querySelector(s); }, ta = $('#np-text');
  function cur() { return data.notes.filter(function (n) { return n.id === data.cur; })[0] || data.notes[0]; }
  function save(now) {
    clearTimeout(timer);
    var run = function () { var ok = U.store.set(KEY, data); $('#np-stat').dataset.saved = ok ? '1' : '0'; stat(ok ? 'Saved' : 'Could not save: browser storage is full or blocked'); };
    if (now) run(); else timer = setTimeout(run, 300);
  }
  function title(n) { var l = n.text.split('\n').filter(function (x) { return x.trim(); })[0]; return l ? l.trim().slice(0, 40) : 'Untitled note'; }
  function stat(msg) { var t = ta.value, w = (t.trim().match(/\S+/g) || []).length; $('#np-stat').textContent = U.fmt(w, 0) + ' words · ' + U.fmt(t.length, 0) + ' characters' + (msg ? ' · ' + msg : ''); }
  function list() {
    var q = $('#np-find').value.trim().toLowerCase();
    var ns = data.notes.slice().sort(function (a, b) { return b.t - a.t; }).filter(function (n) { return !q || n.text.toLowerCase().indexOf(q) >= 0; });
    $('#np-list').innerHTML = ns.length ? ns.map(function (n) { return '<button type="button" role="listitem" class="np-item' + (n.id === data.cur ? ' on' : '') + '" data-id="' + n.id + '"><b>' + U.esc(title(n)) + '</b><small>' + new Date(n.t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' · ' + U.esc((n.text.replace(/\s+/g, ' ').slice(0, 40)) || 'Empty') + '</small></button>'; }).join('') : '<div class="result-empty small">No notes match.</div>';
  }
  function show() { ta.value = cur().text; confirmDel = false; $('#np-del').textContent = 'Delete'; stat(); list(); }
  ta.addEventListener('input', function () { var n = cur(); n.text = ta.value; n.t = Date.now(); stat('Saving…'); save(); list(); });
  $('#np-new').addEventListener('click', function () { if (data.notes.length >= 100) { U.toast('You can keep up to 100 notes'); return; } var n = { id: data.next++, text: '', t: Date.now() }; data.notes.push(n); data.cur = n.id; save(true); show(); ta.focus(); });
  $('#np-list').addEventListener('click', function (e) { var b = e.target.closest('[data-id]'); if (b) { data.cur = +b.getAttribute('data-id'); save(true); show(); } });
  $('#np-find').addEventListener('input', list);
  $('#np-copy').addEventListener('click', function () { ta.value ? U.copy(ta.value) : U.toast('This note is empty'); });
  $('#np-dl').addEventListener('click', function () { if (!ta.value) return U.toast('This note is empty'); U.download(U.slug(title(cur())) + '.txt', ta.value); });
  $('#np-del').addEventListener('click', function () {
    if (!confirmDel) { confirmDel = true; this.textContent = 'Confirm delete'; var b = this; setTimeout(function () { confirmDel = false; b.textContent = 'Delete'; }, 3000); return; }
    data.notes = data.notes.filter(function (n) { return n.id !== data.cur; }); if (!data.notes.length) data.notes.push({ id: data.next++, text: '', t: Date.now() }); data.cur = data.notes[0].id; save(true); show();
  });
  window.addEventListener('pagehide', function () { save(true); });
  show();
};
