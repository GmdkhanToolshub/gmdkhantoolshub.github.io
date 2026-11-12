/* Featured (sponsored) jobs: reads data/featured-jobs.json and shows unexpired items above the live lists. Shows nothing when the list is empty. */
(function () {
  var band = document.querySelector('.jobs-band'); if (!band) return;
  var base = document.body.getAttribute('data-root') || '../';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  fetch(base + 'data/featured-jobs.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    if (!d || !d.jobs) return;
    var today = new Date().toISOString().slice(0, 10);
    var list = d.jobs.filter(function (j) { return j && j.title && j.company && /^https:\/\//i.test(j.url || '') && (!j.expires || j.expires >= today); }).slice(0, 6);
    if (!list.length) return;
    var s = document.createElement('section'); s.className = 'section'; s.id = 'featured-jobs';
    s.innerHTML = '<div class="container" style="max-width:900px"><div class="section-head"><span class="eyebrow">Sponsored</span><h2>Featured jobs</h2><p>Paid listings from employers, labelled Sponsored. GM checks each one, but always research an employer before you apply, and never pay a fee to get a job. <a href="' + base + 'post-a-job/">Post a job</a>.</p></div><ul class="fj-list" style="list-style:none;margin:0;padding:0;display:grid;gap:12px">' +
      list.map(function (j) { return '<li class="card" style="flex-direction:row;align-items:center;gap:14px;flex-wrap:wrap"><div style="flex:1;min-width:220px"><a href="' + esc(j.url) + '" target="_blank" rel="sponsored nofollow noopener noreferrer" style="font-weight:700">' + esc(j.title) + '</a><div class="muted small">' + esc(j.company) + (j.location ? ' &middot; ' + esc(j.location) : '') + (j.salary ? ' &middot; ' + esc(j.salary) : '') + '</div></div><span class="tag">Sponsored</span><a class="btn btn-primary btn-sm" href="' + esc(j.url) + '" target="_blank" rel="sponsored nofollow noopener noreferrer">Apply</a></li>'; }).join('') + '</ul></div>';
    band.parentNode.insertBefore(s, band);
  }).catch(function () { /* no featured jobs: nothing to show */ });
})();
