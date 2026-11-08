/* Stopwatch: precise to one hundredth of a second, with laps (best and worst highlighted). */
NiaziTools['stopwatch'] = function (root, U) {
  var base = 0, startAt = 0, running = false, raf = 0, laps = [], lastLap = 0;
  root.innerHTML = '<div class="sw-face" role="timer" aria-live="off"><span id="sw-time">00:00.00</span></div>' +
    '<div class="tool-actions" style="justify-content:center"><button type="button" class="btn btn-primary" id="sw-go">Start</button><button type="button" class="btn btn-ghost" id="sw-lap" disabled>Lap</button><button type="button" class="btn btn-ghost" id="sw-reset" disabled>Reset</button></div>' +
    '<p class="small muted" style="text-align:center">Keyboard: Space to start or pause, L for a lap, R to reset.</p><div id="sw-laps"></div>';
  var $ = function (s) { return root.querySelector(s); };
  function fmt(ms) { var cs = Math.floor(ms / 10) % 100, s = Math.floor(ms / 1000) % 60, m = Math.floor(ms / 60000) % 60, h = Math.floor(ms / 3600000), p = U.pad2; return (h ? p(h) + ':' : '') + p(m) + ':' + p(s) + '.' + p(cs); }
  function now() { return base + (running ? performance.now() - startAt : 0); }
  function paint() { $('#sw-time').textContent = fmt(now()); if (running) raf = requestAnimationFrame(paint); }
  function renderLaps() {
    if (!laps.length) { $('#sw-laps').innerHTML = ''; return; }
    var best = Math.min.apply(null, laps.map(function (l) { return l.lap; })), worst = Math.max.apply(null, laps.map(function (l) { return l.lap; }));
    $('#sw-laps').innerHTML = '<div class="tool-actions" style="margin-top:0"><button type="button" class="btn btn-ghost btn-sm" id="sw-copy">Copy laps</button><button type="button" class="btn btn-ghost btn-sm" id="sw-csv">Download CSV</button></div>' +
      U.table(['Lap', 'Lap time', 'Total time'], laps.slice().reverse().map(function (l) { var cls = laps.length > 1 ? (l.lap === best ? 'pos' : l.lap === worst ? 'neg' : '') : ''; return ['Lap ' + l.n, '<span class="' + cls + '">' + fmt(l.lap) + '</span>', fmt(l.total)]; }), 1);
    $('#sw-copy').onclick = function () { U.copy(laps.map(function (l) { return 'Lap ' + l.n + '\t' + fmt(l.lap) + '\t' + fmt(l.total); }).join('\n'), 'Laps copied'); };
    $('#sw-csv').onclick = function () { U.download('stopwatch-laps.csv', 'Lap,Lap time,Total time\n' + laps.map(function (l) { return l.n + ',' + fmt(l.lap) + ',' + fmt(l.total); }).join('\n'), 'text/csv'); };
  }
  function toggle() {
    if (running) { base = now(); running = false; cancelAnimationFrame(raf); $('#sw-go').textContent = 'Resume'; $('#sw-lap').disabled = true; }
    else { startAt = performance.now(); running = true; $('#sw-go').textContent = 'Pause'; $('#sw-lap').disabled = false; $('#sw-reset').disabled = false; raf = requestAnimationFrame(paint); }
    paint();
  }
  function lap() { if (!running) return; var t = now(); laps.push({ n: laps.length + 1, lap: t - lastLap, total: t }); lastLap = t; renderLaps(); }
  function reset() { running = false; cancelAnimationFrame(raf); base = 0; lastLap = 0; laps = []; $('#sw-go').textContent = 'Start'; $('#sw-lap').disabled = true; $('#sw-reset').disabled = true; renderLaps(); paint(); }
  $('#sw-go').addEventListener('click', toggle); $('#sw-lap').addEventListener('click', lap); $('#sw-reset').addEventListener('click', reset);
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || /input|textarea|select|button/i.test(e.target.tagName)) return;
    if (e.code === 'Space') { e.preventDefault(); toggle(); } else if (e.key === 'l' || e.key === 'L') lap(); else if (e.key === 'r' || e.key === 'R') reset();
  });
  NiaziTools['stopwatch'].api = { fmt: fmt };
};
