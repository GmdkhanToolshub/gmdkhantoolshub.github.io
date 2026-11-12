/* Hadith of the Day: a small card at the top-right corner of the home page, with a new hadith every day.
   Self-contained (its own styles, no external requests). Positioned absolutely, so it never moves any other part of the page.
   Hadith texts are short, well-known narrations from the major collections; the collection is shown under each one. */
(function () {
  'use strict';
  var d = document;
  if (!d.body || d.getElementById('gm-hadith') || d.body.getAttribute('data-root') !== './') return;

  var H = [
    ['إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ', 'Actions are judged by intentions.', 'Sahih al-Bukhari and Sahih Muslim'],
    ['الدِّينُ النَّصِيحَةُ', 'The religion is sincere advice.', 'Sahih Muslim'],
    ['لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ', 'None of you truly believes until he loves for his brother what he loves for himself.', 'Sahih al-Bukhari and Sahih Muslim'],
    ['الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ', 'A Muslim is the one from whose tongue and hand others are safe.', 'Sahih al-Bukhari and Sahih Muslim'],
    ['مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ', 'Whoever believes in Allah and the Last Day, let him speak good or stay silent.', 'Sahih al-Bukhari and Sahih Muslim'],
    ['تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ', 'Your smile in the face of your brother is charity.', 'Jami at-Tirmidhi'],
    ['الطُّهُورُ شَطْرُ الْإِيمَانِ', 'Cleanliness is half of faith.', 'Sahih Muslim'],
    ['خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ', 'The best of you are those who learn the Quran and teach it.', 'Sahih al-Bukhari'],
    ['الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ', 'A good word is charity.', 'Sahih al-Bukhari and Sahih Muslim'],
    ['لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ، إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ', 'The strong one is not the one who wrestles others, but the one who controls himself in anger.', 'Sahih al-Bukhari and Sahih Muslim'],
    ['مَنْ لَا يَرْحَمْ لَا يُرْحَمْ', 'Whoever does not show mercy will not be shown mercy.', 'Sahih al-Bukhari and Sahih Muslim'],
    ['لَا تَغْضَبْ', 'Do not become angry.', 'Sahih al-Bukhari'],
    ['الْحَيَاءُ مِنَ الْإِيمَانِ', 'Modesty is part of faith.', 'Sahih al-Bukhari and Sahih Muslim'],
    ['يَسِّرُوا وَلَا تُعَسِّرُوا', 'Make things easy and do not make them difficult.', 'Sahih al-Bukhari and Sahih Muslim'],
    ['اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ', 'Be mindful of Allah wherever you are.', 'Jami at-Tirmidhi'],
    ['مِنْ حُسْنِ إِسْلَامِ الْمَرْءِ تَرْكُهُ مَا لَا يَعْنِيهِ', 'Part of the excellence of a person’s faith is leaving what does not concern him.', 'Jami at-Tirmidhi'],
    ['أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ', 'The most beloved deeds to Allah are the most consistent, even if small.', 'Sahih al-Bukhari and Sahih Muslim'],
    ['الْمُؤْمِنُ لِلْمُؤْمِنِ كَالْبُنْيَانِ يَشُدُّ بَعْضُهُ بَعْضًا', 'A believer to another believer is like a building, each part strengthening the other.', 'Sahih al-Bukhari and Sahih Muslim'],
    ['مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ', 'Whoever travels a path seeking knowledge, Allah makes easy for him a path to Paradise.', 'Sahih Muslim'],
    ['إِنَّ اللَّهَ جَمِيلٌ يُحِبُّ الْجَمَالَ', 'Indeed, Allah is Beautiful and loves beauty.', 'Sahih Muslim'],
    ['الْمُسْلِمُ أَخُو الْمُسْلِمِ لَا يَظْلِمُهُ وَلَا يُسْلِمُهُ', 'A Muslim is the brother of a Muslim: he does not wrong him or abandon him.', 'Sahih al-Bukhari and Sahih Muslim'],
    ['اتَّقُوا النَّارَ وَلَوْ بِشِقِّ تَمْرَةٍ', 'Protect yourselves from the Fire, even with half a date given in charity.', 'Sahih al-Bukhari and Sahih Muslim'],
    ['مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ', 'Whoever guides to good will have a reward like the one who does it.', 'Sahih Muslim'],
    ['كُلُّ مَعْرُوفٍ صَدَقَةٌ', 'Every act of kindness is charity.', 'Sahih al-Bukhari and Sahih Muslim'],
    ['الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ', 'The merciful are shown mercy by the Most Merciful.', 'Sunan Abi Dawud and Jami at-Tirmidhi'],
    ['لَا يَشْكُرُ اللَّهَ مَنْ لَا يَشْكُرُ النَّاسَ', 'Whoever does not thank people has not thanked Allah.', 'Sunan Abi Dawud and Jami at-Tirmidhi'],
    ['الْيَدُ الْعُلْيَا خَيْرٌ مِنَ الْيَدِ السُّفْلَى', 'The giving hand is better than the receiving hand.', 'Sahih al-Bukhari and Sahih Muslim'],
    ['الصَّبْرُ ضِيَاءٌ', 'Patience is a light.', 'Sahih Muslim'],
    ['مَنْ غَشَّنَا فَلَيْسَ مِنَّا', 'Whoever cheats us is not one of us.', 'Sahih Muslim'],
    ['الدُّعَاءُ هُوَ الْعِبَادَةُ', 'Supplication is worship.', 'Sunan Abi Dawud and Jami at-Tirmidhi'],
    ['لَا ضَرَرَ وَلَا ضِرَارَ', 'There should be neither harm nor reciprocating harm.', 'Sunan Ibn Majah']
  ];

  function pick() {
    var n = new Date(), day = Math.floor(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) / 86400000);
    return H[day % H.length];
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var css = d.createElement('style');
  css.textContent =
    '#gm-hadith{position:absolute;top:84px;right:16px;z-index:40;width:min(268px,calc(100vw - 32px));font-family:inherit;--hd-gold:#d9a826;--hd-gold2:#f6df8c}' +
    '#gm-hadith .hd-card{position:relative;border-radius:16px;padding:14px 16px 12px;background:linear-gradient(160deg,#fffdf6,#fff8e4);color:#2b2208;text-align:center;box-shadow:0 0 14px rgba(217,168,38,.28),0 8px 22px rgba(15,30,56,.1);animation:hd-glow 3.6s ease-in-out infinite}' +
    '[data-theme="dark"] #gm-hadith .hd-card{background:linear-gradient(160deg,#1a2238,#141b30);color:#f6efd8;box-shadow:0 0 16px rgba(246,223,140,.25),0 8px 22px rgba(0,0,0,.35)}' +
    '#gm-hadith .hd-card:before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1.5px;background:linear-gradient(115deg,rgba(217,168,38,.35) 0,rgba(217,168,38,.35) 38%,#fff3b0 50%,rgba(217,168,38,.35) 62%,rgba(217,168,38,.35) 100%) 100% 0/260% 100%;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);animation:hd-shine 4.8s linear infinite;pointer-events:none}' +
    '#gm-hadith .hd-kicker{display:flex;align-items:center;justify-content:center;gap:6px;margin:0 0 8px;font-size:.66rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#9a7410}' +
    '[data-theme="dark"] #gm-hadith .hd-kicker{color:var(--hd-gold2)}' +
    '#gm-hadith .hd-kicker svg{width:11px;height:11px;fill:currentColor}' +
    '#gm-hadith .hd-ar{margin:0;font:600 1.3rem/1.9 "Amiri","Scheherazade New","Noto Naskh Arabic","Traditional Arabic","Geeza Pro","Segoe UI",serif;direction:rtl}' +
    '#gm-hadith .hd-en{margin:6px 0 0;font-size:.78rem;line-height:1.45;color:#4a3d14;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}' +
    '[data-theme="dark"] #gm-hadith .hd-en{color:#dfd6b8}' +
    '#gm-hadith .hd-src{margin:7px 0 0;font-size:.62rem;color:#8a7430}' +
    '[data-theme="dark"] #gm-hadith .hd-src{color:#b9a763}' +
    '#gm-hadith .hd-x,#gm-hadith .hd-pill{font:inherit;cursor:pointer;border:0}' +
    '#gm-hadith .hd-x{position:absolute;top:6px;right:8px;width:22px;height:22px;border-radius:50%;background:transparent;color:#9a7410;font-size:15px;line-height:1;display:none}' +
    '#gm-hadith .hd-pill{display:none;align-items:center;gap:6px;margin-left:auto;padding:7px 12px;border-radius:999px;background:linear-gradient(160deg,#fffdf6,#fff1c4);color:#6b4f08;font-size:.74rem;font-weight:800;box-shadow:0 0 12px rgba(217,168,38,.45);animation:hd-glow 3.6s ease-in-out infinite}' +
    '[data-theme="dark"] #gm-hadith .hd-pill{background:#1a2238;color:var(--hd-gold2)}' +
    '#gm-hadith .hd-pill svg{width:12px;height:12px;fill:currentColor}' +
    '#gm-hadith .hd-card:focus-within,#gm-hadith .hd-x:focus-visible,#gm-hadith .hd-pill:focus-visible{outline:2px solid #b8860b;outline-offset:2px}' +
    '@keyframes hd-shine{to{background-position:0 0}}' +
    '@keyframes hd-glow{0%,100%{filter:drop-shadow(0 0 2px rgba(217,168,38,.25))}50%{filter:drop-shadow(0 0 9px rgba(246,200,70,.6))}}' +
    '#gm-hadith{display:flex;flex-direction:column;align-items:flex-end;width:auto;top:72px}#gm-hadith .hd-pill{display:inline-flex}#gm-hadith .hd-card{display:none;width:268px;max-width:calc(100vw - 32px);margin-top:8px}#gm-hadith.open .hd-card{display:block}#gm-hadith.open .hd-x{display:block}' +
    '#gm-hadith.hd-full{top:84px}#gm-hadith.hd-full .hd-pill{display:none}#gm-hadith.hd-full .hd-card{display:block;margin-top:0}#gm-hadith.hd-full .hd-x{display:none}' +
    '@media (max-width:599px){#gm-hadith{top:74px;right:12px}#gm-hadith .hd-pill{width:34px;height:34px;padding:0;justify-content:center}#gm-hadith .hd-pill span{display:none}#gm-hadith .hd-pill svg{width:15px;height:15px}}' +
    '@media (prefers-reduced-motion:reduce){#gm-hadith .hd-card,#gm-hadith .hd-pill,#gm-hadith .hd-card:before{animation:none}}' +
    '@media print{#gm-hadith{display:none}}';
  d.head.appendChild(css);

  var h = pick(), star = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5l2.6 6.9 7.4.4-5.8 4.6 2 7.1L12 16.6l-6.2 3.9 2-7.1L2 8.8l7.4-.4z"/></svg>';
  var el = d.createElement('aside'); el.id = 'gm-hadith'; el.setAttribute('aria-label', 'Hadith of the Day');
  el.innerHTML = '<button type="button" class="hd-pill" aria-expanded="false" aria-controls="gm-hadith-card">' + star + '<span>Hadith of the Day</span></button>' +
    '<div class="hd-card" id="gm-hadith-card"><button type="button" class="hd-x" aria-label="Close">&times;</button><p class="hd-kicker">' + star + 'Hadith of the Day</p>' +
    '<p class="hd-ar" lang="ar" dir="rtl">' + esc(h[0]) + '</p><p class="hd-en">' + esc(h[1]) + '</p><p class="hd-src">' + esc(h[2]) + '</p></div>';
  d.body.appendChild(el);
  var pill = el.querySelector('.hd-pill'), mq = window.matchMedia('(min-width:1200px) and (max-width:1299px), (min-width:1830px)');
  function set(o) { el.classList.toggle('open', o); pill.setAttribute('aria-expanded', String(o)); }
  function mode() { el.classList.toggle('hd-full', mq.matches); if (mq.matches) set(false); }
  mode(); if (mq.addEventListener) mq.addEventListener('change', mode); else if (mq.addListener) mq.addListener(mode);
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && el.classList.contains('open')) { set(false); pill.focus(); } });
  d.addEventListener('click', function (e) { if (el.classList.contains('open') && !el.contains(e.target)) set(false); });
  pill.addEventListener('click', function () { set(!el.classList.contains('open')); });
  el.querySelector('.hd-x').addEventListener('click', function () { set(false); pill.focus(); });
})();
