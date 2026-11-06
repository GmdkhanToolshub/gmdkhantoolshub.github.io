NiaziTools['number-converter'] = function (root, U) {
  var SETS = { western: '0123456789', urdu: '۰۱۲۳۴۵۶۷۸۹', arabic: '٠١٢٣٤٥٦٧٨٩', devanagari: '०१२३४५६७८९' };
  var ALL = SETS.western + SETS.urdu + SETS.arabic + SETS.devanagari;
  function digitsTo(text, target) {
    var set = SETS[target];
    return text.replace(/[0-9۰-۹٠-٩०-९]/g, function (ch) { return set[ALL.indexOf(ch) % 10]; });
  }
  var ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function below100(n) { return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : ''); }
  function below1000(n) { var h = Math.floor(n / 100), r = n % 100; return (h ? ONES[h] + ' hundred' + (r ? ' ' : '') : '') + (r ? below100(r) : ''); }
  function words(n, system) {
    if (n === 0) return 'zero';
    var parts = [];
    if (system === 'pk') {
      var units = [[1e9 * 1, 'arab'], [1e7, 'crore'], [1e5, 'lakh'], [1e3, 'thousand']];
      // Above 99 arab, keep counting in arab so the wording stays readable.
      for (var i = 0; i < units.length; i++) {
        var v = Math.floor(n / units[i][0]);
        if (v) { parts.push((v >= 1000 ? words(v, 'pk') : v >= 100 && units[i][1] !== 'thousand' ? words(v, 'pk') : v >= 100 ? below1000(v) : below100(v)) + ' ' + units[i][1]); n %= units[i][0]; }
      }
      if (n) parts.push(below1000(n));
    } else {
      var big = [[1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']];
      for (var j = 0; j < big.length; j++) { var w = Math.floor(n / big[j][0]); if (w) { parts.push(below1000(w) + ' ' + big[j][1]); n %= big[j][0]; } }
      if (n) parts.push(below1000(n));
    }
    return parts.join(' ');
  }
  function groupPk(intStr) {
    if (intStr.length <= 3) return intStr;
    var last3 = intStr.slice(-3), rest = intStr.slice(0, -3);
    return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  }
  function cap(s) { return s.replace(/(^|\s)([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); }); }
  root.innerHTML = '<div id="nc-body"></div>';
  var bodies = [
    function () {
      U.mount(root.querySelector('#nc-body'), {
        fields: [{ id: 'amt', label: 'Amount', type: 'text', value: '', placeholder: 'e.g. 125000.50', hint: 'Up to 2 decimal places. Commas are ignored.' },
          { id: 'sys', label: 'Number system', type: 'select', options: [{ value: 'pk', label: 'Pakistan / South Asia (lakh, crore)' }, { value: 'intl', label: 'International (million, billion)' }], value: 'pk' },
          { id: 'cur', label: 'Currency words', type: 'select', options: [{ value: 'pkr', label: 'Rupees and paisa' }, { value: 'usd', label: 'Dollars and cents' }, { value: 'none', label: 'No currency' }], value: 'pkr' }],
        onInput: function (v, c) {
          var raw = String(v.amt || '').replace(/[,\s]/g, '');
          raw = digitsTo(raw, 'western');
          if (!raw) return c.empty('Enter an amount to see it written in words, ready for a cheque or invoice.');
          if (!/^\d+(\.\d{1,2})?$/.test(raw)) return c.error('Enter a positive number with up to 2 decimal places, such as 125000.50.');
          var intPart = raw.split('.')[0].replace(/^0+(?=\d)/, ''), dec = (raw.split('.')[1] || '');
          if (intPart.length > 15) return c.error('That number is too large. Enter up to 15 digits before the decimal point.');
          var n = Number(intPart), sub = dec ? Number((dec + '0').slice(0, 2)) : 0;
          var main = cap(words(n, v.sys)), unit = { pkr: ['Rupees', 'Paisa'], usd: ['Dollars', 'Cents'], none: ['', ''] }[v.cur];
          var text = v.cur === 'none' ? main + (sub ? ' Point ' + cap(below100(sub)) : '') : (unit[0] + ' ' + main + (sub ? ' and ' + cap(below100(sub)) + ' ' + unit[1] : '') + ' Only');
          var grouped = v.sys === 'pk' ? groupPk(intPart) : intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          c.html(U.grid([U.box('In words', U.esc(text), '', true)]) + U.grid([U.box('Number', U.esc(grouped + (dec ? '.' + (dec + '0').slice(0, 2) : ''))), U.box('In Urdu digits', U.esc(digitsTo(grouped + (dec ? '.' + (dec + '0').slice(0, 2) : ''), 'urdu')))]) +
            '<div class="tool-actions"><button type="button" class="btn btn-ghost btn-sm" id="nc-copy">Copy words</button></div>' +
            '<p class="result-note">Always check amounts on cheques and legal documents carefully before signing.</p>');
          var b = c.out.querySelector('#nc-copy'); if (b) b.onclick = function () { U.copy(text, 'Copied'); };
        }
      });
    },
    function () {
      U.mount(root.querySelector('#nc-body'), {
        fields: [{ id: 'txt', label: 'Text or numbers', type: 'textarea', rows: 4, wide: true, value: '', placeholder: 'e.g. Order 2026 – Rs 15,500 or ۲۰۲۶' },
          { id: 'to', label: 'Convert all digits to', type: 'select', options: [{ value: 'urdu', label: 'Urdu / Persian (۰۱۲۳۴۵۶۷۸۹)' }, { value: 'western', label: 'English (0123456789)' }, { value: 'arabic', label: 'Arabic (٠١٢٣٤٥٦٧٨٩)' }, { value: 'devanagari', label: 'Hindi (०१२३४५६७८९)' }], value: 'urdu' }],
        onInput: function (v, c) {
          if (!v.txt.trim()) return c.empty('Paste text with numbers in any script to convert the digits.');
          var outText = digitsTo(v.txt, v.to);
          c.html('<label for="nc-out">Result</label><textarea id="nc-out" class="output-text" rows="4" readonly dir="auto">' + U.esc(outText) + '</textarea><div class="tool-actions"><button type="button" class="btn btn-ghost btn-sm" id="nc-copy2">Copy result</button></div>');
          c.out.querySelector('#nc-copy2').onclick = function () { U.copy(outText, 'Copied'); };
        }
      });
    }
  ];
  U.tabs(root, ['Amount in words', 'Convert digits'], function (i) { bodies[i](); });
  bodies[0]();
  NiaziTools['number-converter'].api = { words: words, digitsTo: digitsTo, groupPk: groupPk };
};
