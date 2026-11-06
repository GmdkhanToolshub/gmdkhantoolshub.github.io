NiaziTools['roman-urdu-to-urdu'] = function (root, U) {
  /* Common Roman Urdu words and their Urdu spelling. Several spellings map to the same word. Original list by GM Niazi. */
  var DICT_SRC = {
    'آپ': 'aap ap aapp', 'میں': 'main mein me mai mn mei', 'ہم': 'hum ham', 'تم': 'tum', 'تو': 'tu to', 'وہ': 'woh wo vo voh', 'یہ': 'yeh ye yah', 'ہے': 'hai hy he h hay', 'ہیں': 'hain hen hn hein',
    'تھا': 'tha', 'تھی': 'thi', 'تھے': 'thay thy the', 'کیا': 'kya kia kiya', 'کیوں': 'kyun kyon kiun kyu', 'کیسے': 'kaise kese kaisay kesay', 'کیسا': 'kaisa kesa', 'کیسی': 'kaisi kesi',
    'کون': 'kaun kon', 'کہاں': 'kahan kahaan kahn', 'کب': 'kab', 'کتنا': 'kitna', 'کتنی': 'kitni', 'کتنے': 'kitne kitnay', 'جب': 'jab', 'تب': 'tab', 'اب': 'ab', 'یہاں': 'yahan yahaan', 'وہاں': 'wahan wahaan',
    'اور': 'aur or', 'لیکن': 'lekin likin', 'مگر': 'magar', 'بھی': 'bhi b bi', 'نہیں': 'nahi nahin nai nhi nahee', 'ہاں': 'haan han ha', 'جی': 'ji jee', 'نا': 'na', 'نہ': 'nah',
    'کا': 'ka', 'کی': 'ki', 'کے': 'ke kay', 'کو': 'ko', 'سے': 'se say', 'پر': 'par pe pr', 'میرا': 'mera', 'میری': 'meri', 'میرے': 'mere meray', 'تمہارا': 'tumhara', 'تمہاری': 'tumhari', 'آپکا': 'aapka', 'آپکی': 'aapki', 'آپ کے': 'aapke',
    'ہمارا': 'hamara', 'ہماری': 'hamari', 'ہمارے': 'hamare', 'اس': 'is us', 'ان': 'in un', 'سب': 'sab', 'کچھ': 'kuch kuchh', 'بہت': 'bahut bohat bht bohot', 'زیادہ': 'zyada ziada zayada', 'کم': 'kam',
    'اچھا': 'acha achha accha', 'اچھی': 'achi achhi acchi', 'اچھے': 'ache achhe achay', 'برا': 'bura', 'بری': 'buri', 'ٹھیک': 'theek thik teek', 'شکریہ': 'shukriya shukria', 'مہربانی': 'meharbani mehrbani',
    'السلام علیکم': 'assalamualaikum assalam salam aoa', 'وعلیکم السلام': 'walaikumassalam walaikum', 'خدا حافظ': 'khudahafiz', 'اللہ حافظ': 'allahhafiz', 'ان شاء اللہ': 'inshallah inshaallah', 'ماشاء اللہ': 'mashallah mashaallah',
    'سبحان اللہ': 'subhanallah', 'الحمدللہ': 'alhamdulillah alhamdolillah', 'جزاک اللہ': 'jazakallah', 'اللہ': 'allah', 'دعا': 'dua', 'نماز': 'namaz', 'روزہ': 'roza', 'عید': 'eid', 'مبارک': 'mubarak', 'رمضان': 'ramzan ramadan',
    'کرنا': 'karna', 'کرو': 'karo', 'کریں': 'karein karen', 'کر': 'kar', 'کرتا': 'karta', 'کرتی': 'karti', 'کرتے': 'karte kartay', 'کیا گیا': 'kiyagaya', 'ہونا': 'hona', 'ہو': 'ho', 'ہوں': 'hun hoon', 'ہوا': 'hua howa', 'ہوئی': 'hui', 'ہوگا': 'hoga', 'ہوگی': 'hogi',
    'جانا': 'jana', 'جاؤ': 'jao', 'جا': 'ja', 'آنا': 'aana ana', 'آؤ': 'aao ao', 'آیا': 'aaya aya', 'آئی': 'aai ayi', 'دیکھو': 'dekho', 'دیکھنا': 'dekhna', 'بولو': 'bolo', 'بولنا': 'bolna', 'سنو': 'suno', 'سننا': 'sunna',
    'کھانا': 'khana', 'پینا': 'peena pina', 'پانی': 'pani paani', 'چائے': 'chai chaye', 'دودھ': 'doodh', 'روٹی': 'roti', 'سونا': 'sona', 'اٹھو': 'utho', 'بیٹھو': 'baitho betho', 'چلو': 'chalo', 'رکو': 'ruko', 'لو': 'lo', 'دو': 'do', 'دیں': 'dein den',
    'بتاؤ': 'batao', 'بتائیں': 'bataen bataein', 'سمجھ': 'samajh samaj', 'پتا': 'pata', 'چاہیے': 'chahiye chahye', 'چاہتا': 'chahta', 'چاہتی': 'chahti', 'سکتا': 'sakta', 'سکتی': 'sakti', 'سکتے': 'sakte', 'رہا': 'raha', 'رہی': 'rahi', 'رہے': 'rahe rahay',
    'نے': 'ne nay', 'رہتا': 'rehta rahta', 'رہتی': 'rehti rahti', 'رہتے': 'rehte rahte', 'رہنا': 'rehna rahna', 'بنایا': 'banaya', 'لگتا': 'lagta', 'لگا': 'laga', 'مزیدار': 'mazedar mazaydar', 'پڑھنا': 'parhna', 'پڑھو': 'parho', 'لکھنا': 'likhna', 'لکھو': 'likho', 'علی': 'ali', 'احمد': 'ahmed ahmad', 'محمد': 'muhammad mohammad', 'فاطمہ': 'fatima', 'عائشہ': 'ayesha aisha', 'عمر': 'umar', 'حسن': 'hassan hasan', 'زینب': 'zainab', 'گا': 'ga', 'گی': 'gi', 'گے': 'ge', 'دن': 'din', 'رات': 'raat', 'صبح': 'subah', 'شام': 'sham shaam', 'آج': 'aaj aj', 'کل': 'kal', 'پرسوں': 'parson', 'وقت': 'waqt', 'سال': 'saal', 'مہینہ': 'mahina', 'ہفتہ': 'hafta',
    'گھر': 'ghar', 'دفتر': 'daftar', 'اسکول': 'school', 'کام': 'kaam', 'پیسے': 'paise pese', 'بازار': 'bazar bazaar', 'شہر': 'shehar shehr', 'گاؤں': 'gaon', 'ملک': 'mulk', 'پاکستان': 'pakistan', 'لاہور': 'lahore', 'کراچی': 'karachi', 'اسلام آباد': 'islamabad',
    'امی': 'ammi ami', 'ابو': 'abbu abu', 'بھائی': 'bhai', 'بہن': 'behan bahan', 'بیٹا': 'beta', 'بیٹی': 'beti', 'دوست': 'dost', 'لوگ': 'log', 'آدمی': 'aadmi', 'عورت': 'aurat', 'بچہ': 'bacha bachcha', 'بچے': 'bache bachay',
    'دادا': 'dada', 'دادی': 'dadi', 'نانا': 'nana', 'نانی': 'nani', 'خالہ': 'khala', 'ماموں': 'mamu mamoon', 'چاچا': 'chacha', 'پھوپھو': 'phuppo phupho', 'شادی': 'shadi', 'خاندان': 'khandan',
    'پیار': 'pyar pyaar', 'محبت': 'mohabbat muhabbat', 'دل': 'dil', 'خوش': 'khush', 'خوشی': 'khushi', 'غم': 'gham', 'یاد': 'yaad', 'زندگی': 'zindagi', 'دنیا': 'duniya dunya', 'سچ': 'sach', 'جھوٹ': 'jhoot', 'بات': 'baat', 'باتیں': 'baatein',
    'نام': 'naam', 'کتاب': 'kitab', 'سوال': 'sawal', 'جواب': 'jawab', 'مسئلہ': 'masla', 'ٹائم': 'time', 'فون': 'phone', 'موبائل': 'mobile', 'میسج': 'message msg', 'پلیز': 'please plz pls', 'سوری': 'sorry',
    'ایک': 'aik ek', 'دو ': 'do2', 'تین': 'teen', 'چار': 'char chaar', 'پانچ': 'panch paanch', 'چھ': 'chay chhe', 'سات': 'saat', 'آٹھ': 'aath', 'نو': 'nau', 'دس': 'das', 'سو': 'sau', 'ہزار': 'hazar hazaar', 'لاکھ': 'lakh', 'کروڑ': 'crore karor',
    'پیر': 'peer', 'منگل': 'mangal', 'بدھ': 'budh', 'جمعرات': 'jumeraat jumerat', 'جمعہ': 'juma jumma', 'اتوار': 'itwar itwaar', 'بڑا': 'bara bada', 'بڑی': 'bari badi', 'چھوٹا': 'chota chhota', 'چھوٹی': 'choti chhoti', 'نیا': 'naya', 'نئی': 'nai2 nayi', 'پرانا': 'purana',
    'جلدی': 'jaldi', 'آہستہ': 'ahista aahista', 'ابھی': 'abhi', 'پھر': 'phir phr', 'ہمیشہ': 'hamesha', 'شاید': 'shayad', 'ضرور': 'zaroor zarur', 'بالکل': 'bilkul', 'صرف': 'sirf', 'ساتھ': 'sath saath', 'لئے': 'liye liay', 'والا': 'wala', 'والی': 'wali', 'والے': 'wale walay'
  };
  var DICT = {};
  Object.keys(DICT_SRC).forEach(function (ur) { DICT_SRC[ur].split(/\s+/).forEach(function (r) { if (r && !/\d/.test(r)) DICT[r] = ur.trim(); }); });

  var DI = [['rh', 'ڑھ'], ['kh', 'خ'], ['gh', 'غ'], ['sh', 'ش'], ['ch', 'چ'], ['zh', 'ژ'], ['th', 'تھ'], ['ph', 'پھ'], ['bh', 'بھ'], ['dh', 'دھ'], ['jh', 'جھ'], ['kh', 'خ']];
  var CON = { b: 'ب', p: 'پ', t: 'ت', j: 'ج', d: 'د', r: 'ر', z: 'ز', s: 'س', f: 'ف', q: 'ق', k: 'ک', c: 'ک', g: 'گ', l: 'ل', m: 'م', n: 'ن', w: 'و', v: 'و', h: 'ہ', y: 'ی', x: 'کس' };
  var RETRO = { T: 'ٹ', D: 'ڈ', R: 'ڑ' };
  function phonetic(word) {
    var w = word, out = '', i = 0, n = w.length;
    var lower = w.toLowerCase();
    function vowel(ch) { return 'aeiou'.indexOf(ch) >= 0; }
    while (i < n) {
      var two = lower.substr(i, 2), ch = lower[i], raw = w[i], first = i === 0, last2 = i + 2 >= n, last1 = i + 1 >= n;
      if (RETRO[raw] && raw !== ch) { out += RETRO[raw]; i++; continue; }
      var di = DI.find(function (x) { return x[0] === two; });
      if (di) { out += di[1]; i += 2; continue; }
      if (vowel(ch)) {
        if (first) {
          if (two === 'aa') { out += 'آ'; i += 2; continue; }
          if (two === 'ai' || two === 'ae') { out += 'اے'; i += 2; continue; }
          if (ch === 'a') { out += 'ا'; i++; continue; }
          if (two === 'ee' || ch === 'i' || ch === 'e') { out += 'ای'; i += two === 'ee' ? 2 : 1; continue; }
          out += 'او'; i += (two === 'oo' || two === 'ou') ? 2 : 1; continue;
        }
        if (two === 'aa') { out += 'ا'; i += 2; continue; }
        if (two === 'ay' && 'aeiou'.indexOf(lower[i + 2] || '') >= 0) { out += 'ا'; i += 1; continue; }
        if (two === 'ai' || two === 'ay') { out += last2 ? 'ے' : 'ی'; i += 2; continue; }
        if (two === 'ee' || two === 'ei') { out += last2 ? 'ی' : 'ی'; i += 2; continue; }
        if (two === 'oo' || two === 'ou' || two === 'au') { out += 'و'; i += 2; continue; }
        if (ch === 'a') { out += last1 ? 'ا' : ''; i++; continue; }
        if (ch === 'e' && lower[i + 1] === 'h' && !last1) { i++; continue; }
        if (ch === 'e') { out += last1 ? 'ے' : 'ی'; i++; continue; }
        if (ch === 'i') { out += last1 ? 'ی' : ''; i++; continue; }
        if (ch === 'o') { out += 'و'; i++; continue; }
        if (ch === 'u') { out += last1 ? 'و' : ''; i++; continue; }
      }
      if (ch === 'n' && last1 && i > 0 && /(in|un|on|en|ain|ein|oon|een)$/.test(lower)) { out += 'ں'; i++; continue; }
      if (CON[ch]) { out += CON[ch]; i++; continue; }
      out += raw; i++;
    }
    return out;
  }
  var PHRASES = [
    [/\bas+alam+u?(\s*[ou]\s*|\s+)?a?l[ae]ikum\b/gi, 'السلام علیکم'],
    [/\bwa?\s*alaikum\s*(as+alam|salam)\b/gi, 'وعلیکم السلام'],
    [/\bkhuda\s+hafiz\b/gi, 'خدا حافظ'], [/\ballah\s+hafiz\b/gi, 'اللہ حافظ'],
    [/\bin\s*sha+\s*allah\b/gi, 'ان شاء اللہ'], [/\bma\s*sha+\s*allah\b/gi, 'ماشاء اللہ'],
    [/\bjazak\s*allah(\s*khair)?\b/gi, 'جزاک اللہ'], [/\bsubhan\s*allah\b/gi, 'سبحان اللہ'], [/\bdil\s+se\b/gi, 'دل سے']
  ];
  var PUNCT = { '?': '؟', ',': '،', '.': '۔', ';': '؛' };
  function convert(text) {
    var unknown = 0, known = 0;
    PHRASES.forEach(function (ph) { text = text.replace(ph[0], function () { known++; return ph[1]; }); });
    var out = text.replace(/[A-Za-z']+|[?,.;]/g, function (tok) {
      if (PUNCT[tok]) return PUNCT[tok];
      var key = tok.toLowerCase().replace(/'/g, '');
      if (DICT[key]) { known++; return DICT[key]; }
      unknown++; return phonetic(tok.replace(/'/g, ''));
    });
    return { text: out, unknown: unknown, known: known };
  }
  root.innerHTML = '<div class="field"><label for="ru-in">Type or paste Roman Urdu</label><textarea id="ru-in" rows="6" placeholder="e.g. Assalam o alaikum, aap kaise hain? Main theek hoon, shukriya."></textarea><small class="hint">Use capital T, D or R for the sounds ٹ ڈ ڑ (for example "beTa" or "baRa"). Everything is converted in your browser.</small></div>' +
    '<div class="field"><label for="ru-out">Urdu script (you can edit it)</label><textarea id="ru-out" rows="6" dir="rtl" lang="ur" style="font-size:1.35rem;line-height:2.1;font-family:\'Noto Nastaliq Urdu\',\'Jameel Noori Nastaleeq\',\'Urdu Typesetting\',serif"></textarea></div>' +
    '<div class="tool-actions"><button type="button" class="btn btn-primary btn-sm" id="ru-copy">Copy Urdu</button><button type="button" class="btn btn-ghost btn-sm" id="ru-dl">Download .txt</button><button type="button" class="btn btn-ghost btn-sm" id="ru-ex">Try an example</button><button type="button" class="btn btn-ghost btn-sm" id="ru-clear">Clear</button></div>' +
    '<p class="result-note" id="ru-note" aria-live="polite"></p>';
  var inp = root.querySelector('#ru-in'), out = root.querySelector('#ru-out'), note = root.querySelector('#ru-note');
  function run() {
    if (!inp.value.trim()) { out.value = ''; note.textContent = 'Start typing to see Urdu script.'; return; }
    var r = convert(inp.value); out.value = r.text;
    note.textContent = r.known + ' word' + (r.known === 1 ? '' : 's') + ' found in the dictionary' + (r.unknown ? ', ' + r.unknown + ' spelled by sound. Check those and edit the Urdu if needed.' : '.');
  }
  inp.addEventListener('input', U.debounce(run, 80));
  root.querySelector('#ru-copy').addEventListener('click', function () { if (out.value) U.copy(out.value, 'Urdu text copied'); else U.toast('Nothing to copy yet'); });
  root.querySelector('#ru-dl').addEventListener('click', function () { if (out.value) U.download('urdu-text.txt', out.value, 'text/plain;charset=utf-8'); else U.toast('Nothing to download yet'); });
  root.querySelector('#ru-ex').addEventListener('click', function () { inp.value = 'Assalam o alaikum! Aap kaise hain? Main theek hoon, shukriya. Kal hum Lahore ja rahe hain, inshallah.'; run(); });
  root.querySelector('#ru-clear').addEventListener('click', function () { inp.value = ''; run(); inp.focus(); });
  run();
  NiaziTools['roman-urdu-to-urdu'].convert = convert;
};
