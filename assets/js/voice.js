/* GM voice: a short welcome once per browsing session and spoken tool names on hover.
   Uses the browser's built-in Speech Synthesis (no external service). Loaded by main.js; does nothing if unsupported. */
(function () {
  'use strict';
  if (window.__gmVoice) return;
  var synth = window.speechSynthesis;
  if (!synth || typeof window.SpeechSynthesisUtterance === 'undefined') return; // unsupported: no button, no errors
  var d = document;
  var KEY = 'gm.voice', WELCOMED = 'gm.voice.welcomed';
  var WELCOME = 'Welcome to GM. Explore our free tools and smart gadgets.';
  var HOVER_DELAY = 40, COOLDOWN = 200, SAME_NAME_GAP = 1500; // quick: follows the cursor, newest name replaces the old one

  function get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* storage blocked: preference lasts for this page only */ } }

  var on = get(KEY) !== 'off';
  var busy = false, welcomePending = false, lastEnd = 0, lastName = '', lastNameAt = 0, hoverTimer = 0, voice = null, token = 0, welcomeLive = false;
  window.__gmVoice = { speak: speak, enabled: function () { return on; } };

  function pickVoice() {
    var list = synth.getVoices ? synth.getVoices() : [];
    if (!list.length) return null;
    var lang = (d.documentElement.lang || 'en').toLowerCase();
    var en = list.filter(function (v) { return /^en([-_]|$)/i.test(v.lang); });
    if (!en.length) return null;
    // On-device voices start instantly; online voices add a noticeable delay before each word.
    var local = en.filter(function (v) { return v.localService; }); if (local.length) en = local;
    // Prefer a clear male/neutral English voice; it sounds closest to a "robotic" assistant once pitch is lowered.
    var pref = [/google uk english male/i, /microsoft (guy|david|mark|ryan|christopher)/i, /daniel|alex|fred|ralph|aaron/i, /google us english/i, /microsoft/i];
    for (var i = 0; i < pref.length; i++) { var m = en.filter(function (v) { return pref[i].test(v.name); })[0]; if (m) return m; }
    return en.filter(function (v) { return v.default; })[0] || en[0];
  }

  /* Speak one phrase. Only one voice at a time: anything already speaking is stopped first. */
  function speak(text, opts) {
    opts = opts || {};
    try {
      synth.cancel(); var my = ++token; welcomeLive = !!opts.isWelcome;
      var u = new SpeechSynthesisUtterance(text);
      voice = voice || pickVoice(); if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-US';
      u.pitch = 0.6; u.rate = opts.fast ? 1.25 : 1.05; u.volume = 1; // lower pitch + steady pace for a futuristic, robotic tone
      var started = false, timer = setTimeout(function () { if (!started) { try { synth.cancel(); } catch (e) {} busy = false; if (opts.blocked) opts.blocked(); } }, opts.wait || 2500);
      u.onstart = function () { if (my !== token) return; started = true; clearTimeout(timer); busy = true; if (opts.started) opts.started(); };
      u.onend = function () { clearTimeout(timer); if (my !== token) return; busy = false; welcomeLive = false; lastEnd = Date.now(); };
      u.onerror = function (e) { clearTimeout(timer); if (my !== token) return; busy = false; welcomeLive = false; if (!started && e && e.error === 'not-allowed' && opts.blocked) opts.blocked(); };
      synth.speak(u);
    } catch (e) { busy = false; }
  }

  /* ---------- welcome: once per session, retried after the first interaction if the browser blocks autoplay ---------- */
  // Home page (robot welcome screen): greet on every open. Any other entry page: once per session.
  var onHome = d.body && d.body.getAttribute('data-root') === './' && !/404/.test(location.pathname), greeted = false;
  function due() { return on && !greeted && get(WELCOMED) !== '1'; } // once per browsing session
  function welcome() {
    if (!due()) return;
    speak(WELCOME, {
      isWelcome: true,
      started: function () { greeted = true; set(WELCOMED, '1'); welcomePending = false; },
      blocked: function () { if (!welcomePending) { welcomePending = true; armFirstGesture(); } },
      wait: 1800
    });
  }
  var GESTURES = ['pointerdown', 'keydown', 'touchstart', 'touchend', 'click']; // iOS Safari accepts touchend and click, not touchstart, as a user gesture
  function armFirstGesture() {
    function go(ev) {
      GESTURES.forEach(function (t) { d.removeEventListener(t, go, true); });
      if (ev && ev.target && ev.target.closest && ev.target.closest('.voice-btn')) { welcomePending = false; return; } // the toggle handles its own state
      if (due()) speak(WELCOME, { isWelcome: true, started: function () { greeted = true; set(WELCOMED, '1'); welcomePending = false; } });
    }
    GESTURES.forEach(function (t) { d.addEventListener(t, go, { capture: true, passive: true }); });
  }

  /* ---------- hover: pronounce the tool / gadget name ---------- */
  var SEL = '.tool-card h3, .gm-card h3, .pop-chip, .hero-tiles a, .cat-list a';
  function nameOf(el) {
    var h = el.closest('.tool-card h3, .gm-card h3') || el;
    var t = (h.getAttribute('data-voice') || h.textContent || '').replace(/\s+/g, ' ').trim();
    return t.length > 0 && t.length <= 60 ? t : '';
  }
  function over(e) {
    if (!on || e.pointerType === 'touch' || e.pointerType === 'pen') return;
    var el = e.target.closest ? e.target.closest(SEL) : null;
    if (!el || (e.relatedTarget && el.contains(e.relatedTarget))) return;
    var name = nameOf(el); if (!name) return;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(function () {
      var now = Date.now();
      if (!on || welcomeLive || (lastEnd && !busy && now - lastEnd < COOLDOWN)) return;
      if (name === lastName && now - lastNameAt < SAME_NAME_GAP) return;
      if (get(WELCOMED) !== '1' && !welcomePending) return; // never talk over the welcome message
      lastName = name; lastNameAt = now; speak(name, { fast: true }); // replaces any name still being spoken
    }, HOVER_DELAY);
  }
  function out(e) { var el = e.target.closest ? e.target.closest(SEL) : null; if (el && !(e.relatedTarget && el.contains(e.relatedTarget))) clearTimeout(hoverTimer); }
  /* Touch screens have no hover, so a tap on a tool name says it first, then opens the page (waits at most 0.9 s). */
  var lastType = 'mouse'; d.addEventListener('pointerdown', function (e) { lastType = e.pointerType || 'mouse'; }, { capture: true, passive: true });
  d.addEventListener('click', function (e) {
    if (!on || welcomeLive || e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (lastType !== 'touch' && lastType !== 'pen')) return;
    var el = e.target.closest ? e.target.closest(SEL) : null; if (!el) return;
    var a = el.closest('a[href]') || el.querySelector('a[href]'); if (!a || a.target === '_blank' || /^(mailto|tel):/i.test(a.getAttribute('href'))) return;
    var name = nameOf(el); if (!name) return;
    e.preventDefault(); var go = false, href = a.href, nav = function () { if (!go) { go = true; location.href = href; } };
    speak(name, { fast: true, started: function () { setTimeout(nav, 900); }, blocked: nav }); lastName = name; lastNameAt = Date.now();
    setTimeout(nav, 1100); // safety: always continue to the page
  });
  d.addEventListener('pointerover', over, { passive: true });
  d.addEventListener('pointerout', out, { passive: true });

  /* ---------- sound control ---------- */
  var ICON = function (cls, p) { return '<svg class="ic ' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + p + '</svg>'; };
  var SPK = '<path d="M11 5 6 9H2v6h4l5 4V5Z"/>';
  function build() {
    var box = d.querySelector('.nav-actions'); if (!box || d.getElementById('voice-toggle')) return;
    var b = d.createElement('button');
    b.type = 'button'; b.id = 'voice-toggle'; b.className = 'icon-btn voice-btn';
    b.innerHTML = ICON('i-on', SPK + '<path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>') + ICON('i-off', SPK + '<path d="m22 9-6 6"/><path d="m16 9 6 6"/>');
    box.insertBefore(b, box.firstChild);
    function paint() { b.classList.toggle('is-off', !on); b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', 'Voice sound'); b.title = on ? 'Sound ON – click to turn off' : 'Sound OFF – click to turn on'; }
    paint();
    b.addEventListener('click', function () {
      on = !on; set(KEY, on ? 'on' : 'off'); paint(); clearTimeout(hoverTimer);
      if (on) speak('Sound on'); else { try { synth.cancel(); } catch (e) {} busy = false; }
    });
  }

  function start() {
    build();
    if (synth.getVoices && !synth.getVoices().length && synth.addEventListener) synth.addEventListener('voiceschanged', function () { voice = null; }, { once: true });
    if (!/bot|crawl|spider|lighthouse/i.test(navigator.userAgent)) setTimeout(welcome, 600);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start); else start();
})();
