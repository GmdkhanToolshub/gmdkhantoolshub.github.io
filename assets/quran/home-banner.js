/* Home page Quran banner. Starts the descent when the banner is actually on screen, and pauses all motion when it is not.
   Without JavaScript, or when the visitor asks for less motion, the Quran is simply shown in its resting place. */
(function () {
  'use strict';
  var el = document.querySelector('.qa-sky');
  /* a press anywhere on the banner works like pressing its button */
  if (el) el.addEventListener('click', function (e) { var a = el.querySelector('a.qa-banner-btn'); if (a && !e.target.closest('a') && !String(window.getSelection())) a.click(); });
  if (!el || !('IntersectionObserver' in window) || !window.matchMedia || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var played = false;
  el.classList.add('qa-live', 'qa-wait', 'qa-off');
  new IntersectionObserver(function (entries) {
    var e = entries[entries.length - 1];
    el.classList.toggle('qa-off', !e.isIntersecting);
    if (!played && e.intersectionRatio >= 0.4) { played = true; el.classList.remove('qa-wait'); el.classList.add('qa-play'); }
  }, { threshold: [0, 0.4] }).observe(el);
})();
