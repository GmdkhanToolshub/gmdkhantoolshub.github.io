/* Password Generator & Strength Checker. Uses the browser's cryptographic random generator with
   rejection sampling (no modulo bias). Passwords are created on the device and never stored or sent. */
NiaziTools['password-generator'] = function (root, U) {
  var SETS = { lower: 'abcdefghijklmnopqrstuvwxyz', upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', digits: '0123456789', symbols: '!@#$%^&*()-_=+[]{};:,.?/~' };
  var AMBIG = /[Il1O0o|`'"]/g;
  function rand(n) { // unbiased integer in [0, n)
    var lim = Math.floor(0x100000000 / n) * n, b = new Uint32Array(1);
    do { crypto.getRandomValues(b); } while (b[0] >= lim);
    return b[0] % n;
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rand(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function gen(len, opt) {
    var pools = Object.keys(SETS).filter(function (k) { return opt[k]; }).map(function (k) { return opt.noAmbig ? SETS[k].replace(AMBIG, '') : SETS[k]; });
    var all = pools.join(''), out = pools.map(function (p) { return p[rand(p.length)]; }); // at least one from each chosen set
    while (out.length < len) out.push(all[rand(all.length)]);
    return { pw: shuffle(out).join(''), bits: len * Math.log2(all.length) };
  }
  function label(bits) {
    return bits < 40 ? ['Weak', 'neg'] : bits < 60 ? ['Fair', 'warn'] : bits < 80 ? ['Strong', 'pos'] : ['Very strong', 'pos'];
  }
  function crack(bits) { // offline attack at 10 billion guesses per second, average case
    var s = Math.pow(2, bits - 1) / 1e10;
    if (s < 1) return 'less than a second'; if (s < 3600) return U.fmt(s / 60, 0) + ' minutes'; if (s < 86400 * 365) return U.fmt(s / 86400, 0) + ' days';
    var y = s / (86400 * 365); return y > 1e12 ? 'over a trillion years' : y > 1e6 ? U.fmt(y / 1e6, 0) + ' million years' : U.fmt(y, 0) + ' years';
  }
  root.innerHTML =
    '<div class="pw-out"><input type="text" id="pw-val" readonly aria-label="Generated password" spellcheck="false"><button type="button" class="btn btn-primary" id="pw-copy">Copy</button><button type="button" class="btn btn-ghost" id="pw-new" aria-label="Generate a new password">↻ New</button></div>' +
    '<div class="pw-meter" aria-hidden="true"><i id="pw-bar"></i></div><p class="small" id="pw-str" aria-live="polite"></p>' +
    '<div class="field"><label for="pw-len">Length: <span id="pw-len-v">16</span> characters</label><input type="range" id="pw-len" min="8" max="64" value="16"></div>' +
    '<div class="form-grid">' + [['upper', 'Uppercase (A–Z)', true], ['lower', 'Lowercase (a–z)', true], ['digits', 'Numbers (0–9)', true], ['symbols', 'Symbols (!@#…)', true], ['noAmbig', 'Avoid look-alike characters (l, 1, O, 0)', false]].map(function (o) {
      return '<div class="field check"><input type="checkbox" id="pw-' + o[0] + '"' + (o[2] ? ' checked' : '') + '><label for="pw-' + o[0] + '">' + o[1] + '</label></div>'; }).join('') + '</div>' +
    '<div class="tool-actions"><button type="button" class="btn btn-ghost btn-sm" id="pw-five">Generate 5 more</button></div><div id="pw-list"></div>' +
    '<h3 style="font-size:1.05rem;margin:24px 0 8px">Check a password you already use</h3>' +
    '<div class="field"><label for="pw-check">Type a password to test its strength</label><input type="password" id="pw-check" autocomplete="off" spellcheck="false"><small class="hint">Checked only on this device. Nothing is saved or sent.</small></div><div id="pw-check-out" aria-live="polite"></div>';
  var $ = function (s) { return root.querySelector(s); };
  function opts() { var o = {}; ['upper', 'lower', 'digits', 'symbols', 'noAmbig'].forEach(function (k) { o[k] = $('#pw-' + k).checked; }); return o; }
  function make() {
    var o = opts();
    if (!o.upper && !o.lower && !o.digits && !o.symbols) { $('#pw-lower').checked = true; o.lower = true; U.toast('At least one character type is needed'); }
    var r = gen(+$('#pw-len').value, o), l = label(r.bits);
    $('#pw-val').value = r.pw; $('#pw-bar').style.width = Math.min(100, r.bits / 1.28) + '%'; $('#pw-bar').className = l[1];
    $('#pw-str').innerHTML = '<span class="' + l[1] + '"><strong>' + l[0] + '</strong></span> · about ' + Math.round(r.bits) + ' bits of entropy · would take ' + crack(r.bits) + ' to guess at 10 billion tries per second';
  }
  $('#pw-len').addEventListener('input', function () { $('#pw-len-v').textContent = this.value; make(); });
  ['upper', 'lower', 'digits', 'symbols', 'noAmbig'].forEach(function (k) { $('#pw-' + k).addEventListener('change', make); });
  $('#pw-new').addEventListener('click', make);
  $('#pw-copy').addEventListener('click', function () { U.copy($('#pw-val').value, 'Password copied'); });
  $('#pw-five').addEventListener('click', function () {
    var o = opts(), len = +$('#pw-len').value, rows = [];
    for (var i = 0; i < 5; i++) rows.push(gen(len, o).pw);
    $('#pw-list').innerHTML = rows.map(function (p) { return '<div class="out-card"><p><code>' + U.esc(p) + '</code></p><button type="button" class="btn btn-ghost btn-sm" data-cp="' + U.esc(p) + '">Copy</button></div>'; }).join('');
  });
  $('#pw-list').addEventListener('click', function (e) { var b = e.target.closest('[data-cp]'); if (b) U.copy(b.getAttribute('data-cp'), 'Password copied'); });
  var COMMON = /^(password|passw0rd|123456|12345678|qwerty|abc123|111111|iloveyou|admin|welcome|pakistan|letmein|monkey|dragon|football)\d*$/i;
  $('#pw-check').addEventListener('input', function () {
    var p = this.value, o = $('#pw-check-out');
    if (!p) { o.innerHTML = ''; return; }
    var pool = (/[a-z]/.test(p) ? 26 : 0) + (/[A-Z]/.test(p) ? 26 : 0) + (/\d/.test(p) ? 10 : 0) + (/[^A-Za-z0-9]/.test(p) ? 33 : 0);
    var bits = p.length * Math.log2(Math.max(pool, 1)), tips = [];
    if (/(.)\1{2,}/.test(p)) { bits *= 0.7; tips.push('Avoid repeating the same character.'); }
    if (/(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|qwer|asdf)/i.test(p)) { bits *= 0.6; tips.push('Avoid sequences like 1234 or qwerty.'); }
    if (COMMON.test(p)) { bits = Math.min(bits, 10); tips.push('This is one of the most commonly used passwords.'); }
    if (p.length < 12) tips.push('Use at least 12 characters; length matters most.');
    if (pool < 60) tips.push('Mix uppercase, lowercase, numbers and symbols.');
    var l = label(bits);
    o.innerHTML = '<div class="pw-meter"><i class="' + l[1] + '" style="width:' + Math.min(100, bits / 1.28) + '%"></i></div><p class="small"><span class="' + l[1] + '"><strong>' + l[0] + '</strong></span> · estimated ' + Math.round(bits) + ' bits · ' + crack(bits) + ' to guess</p>' +
      (tips.length ? '<ul class="small muted">' + tips.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' : '<p class="small pos">No obvious weaknesses found.</p>');
  });
  make();
};
