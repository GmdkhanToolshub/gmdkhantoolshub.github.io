/* Kids Corner world: animated background (clouds, stars, bubbles, rainbow, floating friends), soft background music and sound effects.
   Music is made in the browser with Web Audio (no files). It starts only after a tap or key press, and it can be switched off at any time.
   Only your on/off choice and volume are saved on this device. Nothing is sent anywhere. */
(function () {
  'use strict';
  var d = document, b = d.body, KEY = 'gm.kids.fx', reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ music: st.music, sfx: st.sfx, vol: st.vol })); } catch (e) {} }
  var saved = load(), st = { music: !!saved.music, sfx: saved.sfx !== false, vol: typeof saved.vol === 'number' ? Math.min(1, Math.max(0, saved.vol)) : 0.5 };
  var onStudio = /\/kids\/music-studio\/?$/.test(location.pathname);

  /* ---------- background ---------- */
  b.classList.add('kc-page');
  var bg = d.querySelector('.kc-bg');
  if (!bg) { bg = d.createElement('div'); bg.className = 'kc-bg'; bg.setAttribute('aria-hidden', 'true'); b.insertBefore(bg, b.firstChild); }
  var small = window.innerWidth < 600, h = '';
  h += '<i class="blob b1"></i><i class="blob b2"></i><i class="blob b3"></i><i class="blob b4"></i><i class="rainbow"></i>';
  for (var c = 0; c < (small ? 3 : 5); c++) h += '<i class="cloud" style="top:' + (6 + c * 15) + '%;--w:' + (110 + (c * 37) % 90) + 'px;animation-duration:' + (70 + c * 23) + 's;animation-delay:-' + (c * 21) + 's"><b></b></i>';
  for (var s = 0; s < (small ? 8 : 14); s++) h += '<i class="star" style="left:' + ((s * 37 + 11) % 97) + '%;top:' + ((s * 53 + 7) % 62) + '%;animation-delay:-' + ((s * 7) % 9) + 's;--z:' + (0.7 + (s % 4) * 0.25) + '"></i>';
  for (var u = 0; u < (small ? 5 : 9); u++) h += '<i class="bubble" style="left:' + ((u * 61 + 9) % 94) + '%;--sz:' + (14 + (u * 13) % 34) + 'px;animation-duration:' + (14 + (u * 5) % 12) + 's;animation-delay:-' + ((u * 4) % 15) + 's"></i>';
  if (!d.querySelector('.kc-bg .fl')) { var em = ['⭐', '🎈', '🚀', '🎨', '🪐', '🧩', '🦋', '🌈', '🎵', '✨', '🐾', '🔤']; for (var i = 0; i < (small ? 6 : 12); i++) h += '<span class="fl" style="left:' + (4 + Math.round(i * 8.1)) + '%;font-size:' + (1.5 + (i % 3) * 0.45) + 'rem;animation-duration:' + (16 + (i * 7) % 13) + 's;animation-delay:-' + ((i * 5) % 17) + 's;--sx:' + ((i % 2 ? 1 : -1) * (24 + (i * 11) % 40)) + 'px">' + em[i] + '</span>'; }
  bg.insertAdjacentHTML('beforeend', h);

  /* ---------- audio ---------- */
  var ctx = null, master = null, musicGain = null, sfxGain = null, timer = null, nextT = 0, step = 0, playing = false;
  var BPM = 84, EIGHTH = 60 / BPM / 2, CHORDS = [[130.81, [261.63, 329.63, 392.0]], [110.0, [220.0, 261.63, 329.63]], [87.31, [174.61, 261.63, 349.23]], [98.0, [196.0, 246.94, 392.0]]], PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
  function ac() { if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); master = ctx.createGain(); master.gain.value = st.vol; master.connect(ctx.destination); musicGain = ctx.createGain(); musicGain.gain.value = 0; musicGain.connect(master); sfxGain = ctx.createGain(); sfxGain.gain.value = 0.9; sfxGain.connect(master); } if (ctx.state === 'suspended') ctx.resume(); return ctx; }
  function note(freq, t, dur, type, vol, dest, attack) { var o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + (attack || 0.02)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05); }
  var mel = 2;
  function schedule() {
    while (nextT < ctx.currentTime + 0.6) {
      var bar = Math.floor(step / 8) % 4, pos = step % 8, ch = CHORDS[bar];
      if (pos === 0) { ch[1].forEach(function (f) { note(f, nextT, EIGHTH * 8, 'sine', 0.05, musicGain, 0.6); }); note(ch[0], nextT, EIGHTH * 3.5, 'triangle', 0.09, musicGain, 0.03); }
      if (pos === 4) note(ch[0], nextT, EIGHTH * 3, 'triangle', 0.07, musicGain, 0.03);
      if (pos % 2 === 0 || Math.random() < 0.35) { if (Math.random() < 0.78) { mel = Math.max(0, Math.min(PENTA.length - 1, mel + (Math.floor(Math.random() * 3) - 1) * (Math.random() < 0.3 ? 2 : 1))); var f = PENTA[mel]; note(f, nextT, 0.9, 'sine', 0.07, musicGain, 0.012); note(f * 2, nextT, 0.35, 'sine', 0.018, musicGain, 0.01); } }
      nextT += EIGHTH; step++; } }
  function startMusic() { var c = ac(); if (!c || playing) return; playing = true; nextT = c.currentTime + 0.1; step = 0; musicGain.gain.cancelScheduledValues(c.currentTime); musicGain.gain.setValueAtTime(musicGain.gain.value, c.currentTime); musicGain.gain.linearRampToValueAtTime(0.9, c.currentTime + 1.2); schedule(); timer = setInterval(schedule, 250); fx.playing = true; }
  function stopMusic() { if (!playing) return; playing = false; fx.playing = false; clearInterval(timer); if (ctx) { musicGain.gain.cancelScheduledValues(ctx.currentTime); musicGain.gain.setValueAtTime(musicGain.gain.value, ctx.currentTime); musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5); } }
  var last = 0;
  function sfx(kind) {
    if (!st.sfx || st.vol === 0) return; var c = ac(); if (!c) return; var now = c.currentTime; if (now - last < 0.05) return; last = now;
    if (kind === 'win') { [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { note(f, now + i * 0.11, 0.35, 'triangle', 0.16, sfxGain, 0.01); }); }
    else if (kind === 'tile') { note(392, now, 0.18, 'sine', 0.14, sfxGain, 0.005); note(587.33, now + 0.07, 0.22, 'sine', 0.12, sfxGain, 0.005); }
    else { var o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(520, now); o.frequency.exponentialRampToValueAtTime(840, now + 0.08); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.16, now + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.13); o.connect(g); g.connect(sfxGain); o.start(now); o.stop(now + 0.15); } }
  var fx = { playing: false, sfx: sfx, state: st, start: startMusic, stop: stopMusic }; window.GMKFX = fx;

  /* ---------- control panel ---------- */
  var box = d.createElement('div'); box.className = 'kc-fx'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Music and sound');
  box.innerHTML = '<button type="button" class="kc-fx-btn" id="kc-music" aria-pressed="false" aria-label="Background music"><span aria-hidden="true">🎵</span><b>Music</b></button><button type="button" class="kc-fx-btn" id="kc-sfx" aria-pressed="true" aria-label="Sound effects"><span aria-hidden="true">🔔</span><b>Sounds</b></button><label class="kc-fx-vol"><span class="sr-only">Volume</span><input type="range" id="kc-vol" min="0" max="1" step="0.05" aria-label="Volume"></label>';
  b.appendChild(box);
  var mb = box.querySelector('#kc-music'), sb = box.querySelector('#kc-sfx'), vr = box.querySelector('#kc-vol');
  vr.value = st.vol;
  function paint() { mb.setAttribute('aria-pressed', String(st.music)); mb.classList.toggle('on', st.music); mb.querySelector('b').textContent = st.music ? 'Music on' : 'Music'; sb.setAttribute('aria-pressed', String(st.sfx)); sb.classList.toggle('on', st.sfx); sb.querySelector('b').textContent = st.sfx ? 'Sounds on' : 'Sounds'; }
  mb.addEventListener('click', function () { st.music = !st.music; save(); paint(); if (st.music) startMusic(); else stopMusic(); });
  sb.addEventListener('click', function () { st.sfx = !st.sfx; save(); paint(); if (st.sfx) { ac(); sfx('pop'); } });
  vr.addEventListener('input', function () { st.vol = +vr.value; save(); if (master) master.gain.setTargetAtTime(st.vol, ctx.currentTime, 0.05); });
  paint();
  /* A saved "music on" choice starts at the first tap or key press of the next page, never before. */
  if (st.music && !onStudio) { var once = function () { d.removeEventListener('pointerdown', once, true); d.removeEventListener('keydown', once, true); if (st.music) startMusic(); }; d.addEventListener('pointerdown', once, true); d.addEventListener('keydown', once, true); }
  d.addEventListener('visibilitychange', function () { if (!ctx) return; if (d.hidden) ctx.suspend(); else if (playing || st.sfx) ctx.resume(); });
  /* Friendly pop on buttons and cards. */
  d.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('button, a.kc-tl, .pill, .kc-animal, .kc-tile'); if (!t || box.contains(t)) return; sfx(t.matches('.kc-tile, .kc-animal') ? 'tile' : 'pop'); }, true);
  /* A little fanfare whenever stars are awarded. */
  var tries = 0, wrap = setInterval(function () { if (window.GMK && GMK.award && !GMK.award._fx) { var o = GMK.award; GMK.award = function () { sfx('win'); return o.apply(this, arguments); }; GMK.award._fx = 1; clearInterval(wrap); } else if (++tries > 20) clearInterval(wrap); }, 150);
})();
