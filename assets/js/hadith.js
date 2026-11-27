/* Hadith of the Day: a minimal, transparent news ticker directly below the top navigation bar on the home page.
   Shows one authentic hadith per day (Arabic, English, Urdu) scrolling slowly from right to left. No background, cards or borders.
   A small picture of the Kaaba (left) and one of the Green Dome (right) stand at the two ends; the text scrolls between them, never behind them.
   On opening, each picture comes down gently among small gold stars. The stars and light stay behind the pictures.
   Up to 960px wide the whole Hadith is shown wrapped and still, so no part of it is cut off.
   Self-contained: its own styles, no external requests. It only adds this strip; no other element is changed.
   Texts are short, well-known narrations from the major collections; the collection is named after each one. */
(function () {
  'use strict';
  var d = document;
  if (!d.body || d.getElementById('gm-hadith') || d.body.getAttribute('data-root') !== './') return;
  var header = d.querySelector('header.site-header'); if (!header) return;

  /* [Arabic, English, source, Urdu] */
  var H = [
    ['إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ', 'Actions are judged by intentions.', 'Sahih al-Bukhari and Sahih Muslim', 'اعمال کا دارومدار نیتوں پر ہے۔'],
    ['الدِّينُ النَّصِيحَةُ', 'The religion is sincere advice.', 'Sahih Muslim', 'دین خیر خواہی کا نام ہے۔'],
    ['لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ', 'None of you truly believes until he loves for his brother what he loves for himself.', 'Sahih al-Bukhari and Sahih Muslim', 'تم میں سے کوئی اس وقت تک مومن نہیں ہو سکتا جب تک وہ اپنے بھائی کے لیے وہی پسند نہ کرے جو اپنے لیے پسند کرتا ہے۔'],
    ['الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ', 'A Muslim is the one from whose tongue and hand others are safe.', 'Sahih al-Bukhari and Sahih Muslim', 'مسلمان وہ ہے جس کی زبان اور ہاتھ سے دوسرے مسلمان محفوظ رہیں۔'],
    ['مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ', 'Whoever believes in Allah and the Last Day, let him speak good or stay silent.', 'Sahih al-Bukhari and Sahih Muslim', 'جو اللہ اور آخرت کے دن پر ایمان رکھتا ہے وہ اچھی بات کہے یا خاموش رہے۔'],
    ['تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ', 'Your smile in the face of your brother is charity.', 'Jami at-Tirmidhi', 'اپنے بھائی کے سامنے تمہارا مسکرانا صدقہ ہے۔'],
    ['الطُّهُورُ شَطْرُ الْإِيمَانِ', 'Cleanliness is half of faith.', 'Sahih Muslim', 'پاکیزگی نصف ایمان ہے۔'],
    ['خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ', 'The best of you are those who learn the Quran and teach it.', 'Sahih al-Bukhari', 'تم میں سب سے بہتر وہ ہے جو قرآن سیکھے اور سکھائے۔'],
    ['الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ', 'A good word is charity.', 'Sahih al-Bukhari and Sahih Muslim', 'اچھی بات صدقہ ہے۔'],
    ['لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ، إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الْغَضَبِ', 'The strong one is not the one who wrestles others, but the one who controls himself in anger.', 'Sahih al-Bukhari and Sahih Muslim', 'پہلوان وہ نہیں جو دوسروں کو پچھاڑ دے، اصل طاقتور وہ ہے جو غصے کے وقت خود پر قابو رکھے۔'],
    ['مَنْ لَا يَرْحَمْ لَا يُرْحَمْ', 'Whoever does not show mercy will not be shown mercy.', 'Sahih al-Bukhari and Sahih Muslim', 'جو رحم نہیں کرتا اس پر رحم نہیں کیا جاتا۔'],
    ['لَا تَغْضَبْ', 'Do not become angry.', 'Sahih al-Bukhari', 'غصہ نہ کرو۔'],
    ['الْحَيَاءُ مِنَ الْإِيمَانِ', 'Modesty is part of faith.', 'Sahih al-Bukhari and Sahih Muslim', 'حیا ایمان کا حصہ ہے۔'],
    ['يَسِّرُوا وَلَا تُعَسِّرُوا', 'Make things easy and do not make them difficult.', 'Sahih al-Bukhari and Sahih Muslim', 'آسانی کرو، تنگی نہ کرو۔'],
    ['اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ', 'Be mindful of Allah wherever you are.', 'Jami at-Tirmidhi', 'تم جہاں کہیں بھی ہو اللہ سے ڈرتے رہو۔'],
    ['مِنْ حُسْنِ إِسْلَامِ الْمَرْءِ تَرْكُهُ مَا لَا يَعْنِيهِ', 'Part of the excellence of a person’s faith is leaving what does not concern him.', 'Jami at-Tirmidhi', 'آدمی کے اسلام کی خوبی یہ ہے کہ وہ بے فائدہ چیز کو چھوڑ دے۔'],
    ['أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ', 'The most beloved deeds to Allah are the most consistent, even if small.', 'Sahih al-Bukhari and Sahih Muslim', 'اللہ کے نزدیک سب سے پسندیدہ عمل وہ ہے جو مسلسل ہو، چاہے تھوڑا ہو۔'],
    ['الْمُؤْمِنُ لِلْمُؤْمِنِ كَالْبُنْيَانِ يَشُدُّ بَعْضُهُ بَعْضًا', 'A believer to another believer is like a building, each part strengthening the other.', 'Sahih al-Bukhari and Sahih Muslim', 'مومن مومن کے لیے عمارت کی طرح ہے جس کا ایک حصہ دوسرے کو مضبوط کرتا ہے۔'],
    ['مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ', 'Whoever travels a path seeking knowledge, Allah makes easy for him a path to Paradise.', 'Sahih Muslim', 'جو علم کی تلاش میں راستہ چلتا ہے اللہ اس کے لیے جنت کا راستہ آسان کر دیتا ہے۔'],
    ['إِنَّ اللَّهَ جَمِيلٌ يُحِبُّ الْجَمَالَ', 'Indeed, Allah is Beautiful and loves beauty.', 'Sahih Muslim', 'بے شک اللہ خوبصورت ہے اور خوبصورتی کو پسند کرتا ہے۔'],
    ['الْمُسْلِمُ أَخُو الْمُسْلِمِ لَا يَظْلِمُهُ وَلَا يُسْلِمُهُ', 'A Muslim is the brother of a Muslim: he does not wrong him or abandon him.', 'Sahih al-Bukhari and Sahih Muslim', 'مسلمان مسلمان کا بھائی ہے، نہ اس پر ظلم کرتا ہے اور نہ اسے بے سہارا چھوڑتا ہے۔'],
    ['اتَّقُوا النَّارَ وَلَوْ بِشِقِّ تَمْرَةٍ', 'Protect yourselves from the Fire, even with half a date given in charity.', 'Sahih al-Bukhari and Sahih Muslim', 'جہنم کی آگ سے بچو، چاہے کھجور کے ایک ٹکڑے کے صدقے سے ہی ہو۔'],
    ['مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ', 'Whoever guides to good will have a reward like the one who does it.', 'Sahih Muslim', 'جو نیکی کی طرف رہنمائی کرے اسے نیکی کرنے والے کے برابر اجر ملتا ہے۔'],
    ['كُلُّ مَعْرُوفٍ صَدَقَةٌ', 'Every act of kindness is charity.', 'Sahih al-Bukhari and Sahih Muslim', 'ہر نیکی صدقہ ہے۔'],
    ['الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ', 'The merciful are shown mercy by the Most Merciful.', 'Sunan Abi Dawud and Jami at-Tirmidhi', 'رحم کرنے والوں پر رحمان رحم فرماتا ہے۔'],
    ['لَا يَشْكُرُ اللَّهَ مَنْ لَا يَشْكُرُ النَّاسَ', 'Whoever does not thank people has not thanked Allah.', 'Sunan Abi Dawud and Jami at-Tirmidhi', 'جو لوگوں کا شکر ادا نہیں کرتا وہ اللہ کا شکر ادا نہیں کرتا۔'],
    ['الْيَدُ الْعُلْيَا خَيْرٌ مِنَ الْيَدِ السُّفْلَى', 'The giving hand is better than the receiving hand.', 'Sahih al-Bukhari and Sahih Muslim', 'دینے والا ہاتھ لینے والے ہاتھ سے بہتر ہے۔'],
    ['الصَّبْرُ ضِيَاءٌ', 'Patience is a light.', 'Sahih Muslim', 'صبر روشنی ہے۔'],
    ['مَنْ غَشَّنَا فَلَيْسَ مِنَّا', 'Whoever cheats us is not one of us.', 'Sahih Muslim', 'جس نے ہمیں دھوکا دیا وہ ہم میں سے نہیں۔'],
    ['الدُّعَاءُ هُوَ الْعِبَادَةُ', 'Supplication is worship.', 'Sunan Abi Dawud and Jami at-Tirmidhi', 'دعا ہی عبادت ہے۔'],
    ['لَا ضَرَرَ وَلَا ضِرَارَ', 'There should be neither harm nor reciprocating harm.', 'Sunan Ibn Majah', 'نہ نقصان اٹھانا ہے اور نہ نقصان پہنچانا۔']
  ];

  var n = new Date(), day = Math.floor(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) / 86400000), h = H[day % H.length];
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var css = d.createElement('style');
  css.textContent =
    '#gm-hadith{position:relative;z-index:1;overflow:hidden;background:none;border:0;margin:0;padding:0;-webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}' +
    '#gm-hadith .hd-track{display:flex;width:max-content;align-items:center;direction:ltr;animation:hd-scroll var(--hd-dur,60s) linear infinite;will-change:transform}' +
    '#gm-hadith:hover .hd-track,#gm-hadith:focus-within .hd-track{animation-play-state:paused}' +
    '#gm-hadith .hd-grp{display:flex;align-items:center;flex:none}' +
    '#gm-hadith .hd-item{display:inline-flex;align-items:center;gap:14px;padding:2px 0 2px 28px;white-space:nowrap;font-size:.76rem;line-height:1.7;color:var(--text-soft,#47556e)}' +
    '#gm-hadith .hd-tag{font-size:.62rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#7a5a00}' +
    '#gm-hadith .hd-ar{font:600 1.08rem/1.7 "Amiri","Scheherazade New","Noto Naskh Arabic","Traditional Arabic","Geeza Pro","Segoe UI",serif;color:var(--text,#0f1e38);unicode-bidi:isolate}' +
    '#gm-hadith .hd-ur{font:500 .95rem/1.8 "Noto Nastaliq Urdu","Jameel Noori Nastaleeq","Noto Naskh Arabic","Segoe UI",Tahoma,serif;unicode-bidi:isolate}' +
    '#gm-hadith .hd-src{font-size:.66rem;color:var(--text-faint,#66738a)}' +
    '#gm-hadith .hd-dot{color:#c9a227;font-size:.7rem;opacity:.85}' +
    '[data-theme="dark"] #gm-hadith .hd-tag{color:#e5c76b}[data-theme="dark"] #gm-hadith .hd-dot{color:#e5c76b}' +
    '@keyframes hd-scroll{to{transform:translateX(-50%)}}' +
    '@media (max-width:599px){#gm-hadith .hd-item{font-size:.72rem;gap:12px;padding-left:22px}#gm-hadith .hd-ar{font-size:1rem}#gm-hadith .hd-ur{font-size:.9rem}}' +
    '@media (prefers-reduced-motion:reduce){#gm-hadith{-webkit-mask-image:none;mask-image:none}#gm-hadith .hd-track{animation:none;width:auto;justify-content:center;flex-wrap:wrap}#gm-hadith .hd-grp+.hd-grp{display:none}#gm-hadith .hd-item{white-space:normal;flex-wrap:wrap;justify-content:center;padding:6px 16px;text-align:center}}' +
    '#gm-hadith-bar{position:relative;z-index:1;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;column-gap:10px;padding:3px max(14px,env(safe-area-inset-left,0px))}' +
    '#gm-hadith-bar .hd-art{position:relative;isolation:isolate;display:block;line-height:0}' +
    '#gm-hadith-bar .hd-art::before{content:"";position:absolute;z-index:-1;inset:-3px -9px;border-radius:50%;background:radial-gradient(closest-side,rgba(226,184,74,.5),rgba(226,184,74,.16) 60%,transparent);opacity:.7;pointer-events:none}' +
    '#gm-hadith-bar .hd-art-dome::before{background:radial-gradient(closest-side,rgba(40,170,110,.42),rgba(226,184,74,.18) 62%,transparent)}' +
    '[data-theme="dark"] #gm-hadith-bar .hd-art::before{background:radial-gradient(closest-side,rgba(255,220,130,.55),rgba(255,214,120,.18) 60%,transparent)}' +
    '#gm-hadith-bar .hd-art img{display:block;height:48px;width:auto;max-width:none}' +
    '@media (max-width:599px){#gm-hadith-bar{column-gap:6px;padding-left:8px;padding-right:8px}#gm-hadith-bar .hd-art img{height:34px}#gm-hadith-bar .hd-art::before{inset:-2px -5px}}' +
    /* four-point gold stars around each picture, and the pool of light it comes to rest on */
    '#gm-hadith-bar .hd-star{position:absolute;z-index:-1;width:var(--s);height:var(--s);left:var(--x);top:var(--y);background:#d9a620;opacity:.75;pointer-events:none;-webkit-clip-path:polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%);clip-path:polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%)}' +
    '[data-theme="dark"] #gm-hadith-bar .hd-star{background:#ffe08a;opacity:.9}' +
    '#gm-hadith-bar .hd-art::after{content:"";position:absolute;z-index:-1;left:-6px;right:-6px;bottom:-3px;height:10px;border-radius:50%;background:radial-gradient(closest-side,rgba(232,186,64,.85),rgba(232,186,64,.25) 60%,transparent);opacity:.7;pointer-events:none}' +
    '@media (max-width:599px){#gm-hadith-bar .hd-star{width:calc(var(--s) * .75);height:calc(var(--s) * .75)}}' +
    '@media (prefers-reduced-motion:no-preference){' +
    '#gm-hadith-bar .hd-art img{animation:hd-land 3s cubic-bezier(.2,.72,.22,1) var(--land) both,hd-art-float 6s ease-in-out calc(var(--land) + 3s) infinite}' +
    '#gm-hadith-bar .hd-art::before{animation:hd-art-in 2.4s ease var(--land) both,hd-art-glow 5s ease-in-out calc(var(--land) + 3s) infinite}' +
    '#gm-hadith-bar .hd-art::after{animation:hd-pool 1.8s ease-out calc(var(--land) + 2s) both}' +
    '#gm-hadith-bar .hd-star{animation:hd-star-fall 2.4s cubic-bezier(.25,.7,.3,1) calc(var(--land) + var(--d)) both,hd-twinkle var(--t) ease-in-out calc(var(--land) + var(--d) + 2.4s) infinite}' +
    '}' +
    '@keyframes hd-land{0%{opacity:0;transform:translateY(-34px)}25%{opacity:1}84%{transform:translateY(2px)}100%{opacity:1;transform:translateY(0)}}' +
    '@keyframes hd-art-in{from{opacity:0}to{opacity:.45}}' +
    '@keyframes hd-art-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}' +
    '@keyframes hd-art-glow{0%,100%{opacity:.45}50%{opacity:1}}' +
    '@keyframes hd-pool{0%{opacity:0;transform:scaleX(.3)}45%{opacity:1;transform:scaleX(1.25)}100%{opacity:.7;transform:scaleX(1)}}' +
    '@keyframes hd-star-fall{0%{opacity:0;transform:translateY(-30px) rotate(-90deg) scale(.4)}35%{opacity:1}100%{opacity:.75;transform:translateY(0) rotate(0) scale(1)}}' +
    '@keyframes hd-twinkle{0%,100%{opacity:.75;transform:scale(1)}50%{opacity:.2;transform:scale(.6)}}' +
    /* heavenly light: rays from above, a stream of falling stars and rising gold dust. All of it is behind the pictures. */
    '#gm-hadith-bar .hd-rays,#gm-hadith-bar .hd-fall,#gm-hadith-bar .hd-mote{position:absolute;z-index:-1;display:block;pointer-events:none}' +
    '#gm-hadith-bar .hd-rays{left:-9px;right:-9px;top:-5px;bottom:0;background:repeating-conic-gradient(from 150deg at 50% 0,rgba(214,156,24,.42) 0 4deg,transparent 4deg 12deg);-webkit-mask-image:radial-gradient(72% 100% at 50% 0,#000 25%,transparent 78%);mask-image:radial-gradient(72% 100% at 50% 0,#000 25%,transparent 78%);transform-origin:50% 0;opacity:.7}' +
    '#gm-hadith-bar .hd-fall{left:var(--x);top:var(--y);width:var(--s);height:var(--s);opacity:0}' +
    '#gm-hadith-bar .hd-fall::before{content:"";position:absolute;left:50%;bottom:55%;width:1px;height:14px;margin-left:-.5px;background:linear-gradient(transparent,#d19a14)}' +
    '#gm-hadith-bar .hd-fall::after{content:"";position:absolute;inset:0;background:#cf970f;-webkit-clip-path:polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%);clip-path:polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%)}' +
    '#gm-hadith-bar .hd-mote{left:var(--x);top:var(--y);width:var(--s);height:var(--s);border-radius:50%;background:#d39d17;box-shadow:0 0 5px 1px rgba(226,172,40,.6);opacity:0}' +
    '[data-theme="dark"] #gm-hadith-bar .hd-rays{background:repeating-conic-gradient(from 150deg at 50% 0,rgba(255,224,145,.42) 0 4deg,transparent 4deg 12deg)}' +
    '[data-theme="dark"] #gm-hadith-bar .hd-fall::before{background:linear-gradient(transparent,#ffe9a6)}' +
    '[data-theme="dark"] #gm-hadith-bar .hd-fall::after{background:#fff0bd}' +
    '[data-theme="dark"] #gm-hadith-bar .hd-mote{background:#ffe9a6;box-shadow:0 0 7px 2px rgba(255,214,110,.7)}' +
    '@media (max-width:599px){#gm-hadith-bar .hd-rays{left:-5px;right:-5px}#gm-hadith-bar .hd-fall,#gm-hadith-bar .hd-mote{width:calc(var(--s) * .78);height:calc(var(--s) * .78)}#gm-hadith-bar .hd-fall::before{height:10px}}' +
    '@media (prefers-reduced-motion:no-preference){' +
    '#gm-hadith-bar .hd-rays{animation:hd-art-in-rays 2.5s ease var(--land) both,hd-rays 9s ease-in-out calc(var(--land) + 2.5s) infinite}' +
    '#gm-hadith-bar .hd-fall{animation:hd-meteor var(--t) cubic-bezier(.35,.55,.45,1) calc(var(--land) + var(--d)) infinite}' +
    '#gm-hadith-bar .hd-mote{animation:hd-dust var(--t) ease-in-out calc(var(--land) + var(--d)) infinite}' +
    '#gm-hadith-bar.hd-off .hd-art,#gm-hadith-bar.hd-off .hd-art *,#gm-hadith-bar.hd-off .hd-art::before,#gm-hadith-bar.hd-off .hd-art::after,#gm-hadith-bar.hd-off .hd-art *::before,#gm-hadith-bar.hd-off .hd-art *::after{animation-play-state:paused!important}' +
    '}' +
    '@media (prefers-reduced-motion:reduce){#gm-hadith-bar .hd-fall,#gm-hadith-bar .hd-mote{display:none}}' +
    /* a star comes down, touches its place, brightens for a moment and melts away */
    '@keyframes hd-meteor{0%{opacity:0;transform:translateY(-34px) scale(.6)}12%{opacity:1}52%{opacity:1;transform:translateY(0) scale(1)}62%{opacity:1;transform:translateY(0) scale(1.45)}82%,100%{opacity:0;transform:translateY(1px) scale(.35)}}' +
    '@keyframes hd-dust{0%{opacity:0;transform:translateY(7px) scale(.6)}30%{opacity:1}70%{opacity:.6}100%{opacity:0;transform:translateY(-15px) scale(1)}}' +
    '@keyframes hd-rays{0%,100%{opacity:.5;transform:rotate(-5deg)}50%{opacity:1;transform:rotate(5deg)}}' +
    '@keyframes hd-art-in-rays{from{opacity:0}to{opacity:.5;transform:rotate(-5deg)}}' +
    /* phones and tablets: nothing scrolls past or gets cut off. Picture sizes stay as they are. */
    '#gm-hadith-bar .hd-title{display:none}' +
    '@media (max-width:960px){' +
    '#gm-hadith-bar{grid-template-areas:"kaaba title dome" "text text text";row-gap:6px;padding-top:8px;padding-bottom:10px}' +
    '#gm-hadith-bar .hd-art-kaaba{grid-area:kaaba}#gm-hadith-bar .hd-art-dome{grid-area:dome}' +
    '#gm-hadith-bar .hd-title{grid-area:title;display:flex;align-items:center;justify-content:center;gap:8px;min-width:0;text-align:center;font-size:.68rem;font-weight:800;line-height:1.5;letter-spacing:.12em;text-transform:uppercase;color:#7a5a00}' +
    '#gm-hadith-bar .hd-title::before,#gm-hadith-bar .hd-title::after{content:"\\2726";font-size:.6rem;color:#c9a227}' +
    '[data-theme="dark"] #gm-hadith-bar .hd-title,[data-theme="dark"] #gm-hadith-bar .hd-title::before,[data-theme="dark"] #gm-hadith-bar .hd-title::after{color:#e5c76b}' +
    '#gm-hadith-bar #gm-hadith{grid-area:text;overflow:visible;-webkit-mask-image:none;mask-image:none}' +
    '#gm-hadith-bar #gm-hadith .hd-track{display:block;width:auto;animation:none;transform:none;will-change:auto}' +
    '#gm-hadith-bar #gm-hadith .hd-grp{display:block}' +
    '#gm-hadith-bar #gm-hadith .hd-grp+.hd-grp,#gm-hadith-bar #gm-hadith .hd-item+.hd-item,#gm-hadith-bar #gm-hadith .hd-tag,#gm-hadith-bar #gm-hadith .hd-dot{display:none}' +
    '#gm-hadith-bar #gm-hadith .hd-item{display:flex;flex-direction:column;align-items:center;gap:4px;width:100%;max-width:640px;margin:0 auto;padding:0 4px;white-space:normal;text-align:center;overflow-wrap:break-word}' +
    '#gm-hadith-bar #gm-hadith .hd-item>span{max-width:100%}' +
    '#gm-hadith-bar #gm-hadith .hd-ar{font-size:1.3rem;line-height:2}' +
    '#gm-hadith-bar #gm-hadith .hd-en{font-size:.88rem;line-height:1.6}' +
    '#gm-hadith-bar #gm-hadith .hd-ur{font-size:1.06rem;line-height:2.1}' +
    '#gm-hadith-bar #gm-hadith .hd-src{font-size:.72rem;line-height:1.6}' +
    '}' +
    '@media print{#gm-hadith,#gm-hadith-bar{display:none}}';
  d.head.appendChild(css);

  var item = '<span class="hd-item"><span class="hd-tag">Hadith of the Day</span><span class="hd-dot" aria-hidden="true">&#10022;</span>' +
    '<span class="hd-ar" lang="ar" dir="rtl">' + esc(h[0]) + '</span><span class="hd-dot" aria-hidden="true">&#10022;</span>' +
    '<span class="hd-en" lang="en">' + esc(h[1]) + '</span><span class="hd-dot" aria-hidden="true">&#10022;</span>' +
    '<span class="hd-ur" lang="ur" dir="rtl">' + esc(h[3]) + '</span>' +
    '<span class="hd-src">' + esc(h[2]) + '</span></span>';
  var el = d.createElement('div'); el.id = 'gm-hadith'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Hadith of the Day');
  el.innerHTML = '<div class="hd-track"><div class="hd-grp">' + item + '</div></div>';
  /* the two pictures sit outside the scrolling strip, so its text and edge fade work exactly as before */
  /* star places around a picture: [left, top, size in px, twinkle seconds, delay seconds] */
  var STARS = [['-9px', '2px', 8, 3.6, .2], ['-5px', '62%', 5, 4.4, .7], ['18%', '-1px', 5, 5.1, 1.1], ['78%', '0px', 7, 4, .45], ['96%', '38%', 5, 4.8, .9], ['92%', '76%', 7, 3.9, 1.3]];
  var stars = STARS.map(function (s) { return '<i class="hd-star" aria-hidden="true" style="--x:' + s[0] + ';--y:' + s[1] + ';--s:' + s[2] + 'px;--t:' + s[3] + 's;--d:' + s[4] + 's"></i>'; }).join('');
  /* falling stars and gold dust: [left, top (where it lands), size in px, seconds per fall, start delay] */
  function bits(cls, list) { return list.map(function (s) { return '<i class="' + cls + '" aria-hidden="true" style="--x:' + s[0] + ';--y:' + s[1] + ';--s:' + s[2] + 'px;--t:' + s[3] + 's;--d:' + s[4] + 's"></i>'; }).join(''); }
  var light = '<i class="hd-rays" aria-hidden="true"></i>' +
    bits('hd-fall', [['-8px', '20%', 7, 4.6, 0], ['9%', '-2px', 6, 5.4, 1.7], ['88%', '1px', 7, 4.9, .9], ['97%', '52%', 6, 5.8, 2.9], ['-5px', '68%', 5, 6.3, 3.8], ['46%', '-3px', 5, 5.1, 2.3]]) +
    bits('hd-mote', [['-6px', '80%', 3, 4.2, .4], ['4%', '45%', 2, 5, 2.1], ['22%', '88%', 2, 3.8, 1.2], ['78%', '86%', 3, 4.6, 2.8], ['100%', '66%', 2, 5.3, .8], ['94%', '20%', 2, 4, 3.3], ['-3px', '8%', 2, 5.6, 1.9]]);
  function art(cls, file, w, alt, land) { return '<span class="hd-art ' + cls + '" style="--land:' + land + 's">' + light + stars + '<img src="./assets/img/hadith/' + file + '" width="' + w + '" height="156" alt="' + alt + '" decoding="async"></span>'; }
  var bar = d.createElement('div'); bar.id = 'gm-hadith-bar';
  bar.innerHTML = art('hd-art-kaaba', 'kaaba.webp', 180, 'The Holy Kaaba, Makkah', .3) + art('hd-art-dome', 'green-dome.webp', 146, 'The Green Dome of Al-Masjid an-Nabawi, Madinah', .8);
  bar.insertBefore(el, bar.lastChild);
  /* the heading shown between the pictures on small screens; the region is already named for screen readers */
  var title = d.createElement('span'); title.className = 'hd-title'; title.setAttribute('aria-hidden', 'true'); title.textContent = 'Hadith of the Day';
  bar.insertBefore(title, el);
  header.insertAdjacentElement('afterend', bar);
  /* rest all of the picture effects while the bar is scrolled out of sight */
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { bar.classList.toggle('hd-off', !e[e.length - 1].isIntersecting); }).observe(bar);

  /* repeat the hadith until one group is wider than the screen, then duplicate the group for a seamless loop */
  var track = el.firstChild, grp = track.firstChild;
  function fit() {
    var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; if (rm) return;
    var one = grp.firstChild; grp.innerHTML = ''; grp.appendChild(one.cloneNode(true));
    var w = grp.getBoundingClientRect().width || 1, need = Math.max(2, Math.ceil((window.innerWidth + 40) / w));
    for (var i = 1; i < need; i++) grp.appendChild(one.cloneNode(true));
    [].forEach.call(grp.children, function (c, i2) { if (i2) c.setAttribute('aria-hidden', 'true'); });
    while (track.children.length > 1) track.removeChild(track.lastChild);
    var copy = grp.cloneNode(true); copy.setAttribute('aria-hidden', 'true'); track.appendChild(copy);
    el.style.setProperty('--hd-dur', Math.max(25, Math.round(grp.getBoundingClientRect().width / 45)) + 's');
  }
  var raf, last = 0;
  fit(); if (d.fonts && d.fonts.ready) d.fonts.ready.then(fit);
  window.addEventListener('resize', function () { var w = window.innerWidth; if (w === last) return; last = w; cancelAnimationFrame(raf); raf = requestAnimationFrame(fit); });
})();
