NiaziTools['excel-formula-generator'] = function (root, U) {
  function f(id, label, value, hint) { return { id: id, label: label, value: value, hint: hint }; }
  var R = function (s) { return String(s || '').trim().toUpperCase().replace(/\s+/g, ''); };
  var T = [
    { id: 'sumif', name: 'SUMIF — sum values that match a condition', fields: [f('range', 'Criteria range', 'A2:A100'), f('crit', 'Criteria', '"North"', 'Text in quotes, e.g. "North", or a number, or ">500"'), f('sum', 'Range to sum', 'C2:C100')],
      build: function (v) { return { formula: '=SUMIF(' + R(v.range) + ',' + v.crit.trim() + ',' + R(v.sum) + ')', explain: 'Adds the values in ' + R(v.sum) + ' for rows where ' + R(v.range) + ' meets ' + v.crit.trim() + '.' }; } },
    { id: 'sumifs', name: 'SUMIFS — sum with two conditions', fields: [f('sum', 'Range to sum', 'D2:D100'), f('r1', 'Criteria range 1', 'A2:A100'), f('c1', 'Criteria 1', '"North"'), f('r2', 'Criteria range 2', 'B2:B100'), f('c2', 'Criteria 2', '"Q1"')],
      build: function (v) { return { formula: '=SUMIFS(' + R(v.sum) + ',' + R(v.r1) + ',' + v.c1.trim() + ',' + R(v.r2) + ',' + v.c2.trim() + ')', explain: 'Adds ' + R(v.sum) + ' only where both conditions are true. Note that the sum range comes first in SUMIFS.' }; } },
    { id: 'countif', name: 'COUNTIF — count cells that match', fields: [f('range', 'Range', 'A2:A100'), f('crit', 'Criteria', '">=100"', 'e.g. "Paid", ">=100", "<>" for non-blank')],
      build: function (v) { return { formula: '=COUNTIF(' + R(v.range) + ',' + v.crit.trim() + ')', explain: 'Counts how many cells in ' + R(v.range) + ' meet ' + v.crit.trim() + '.' }; } },
    { id: 'countifs', name: 'COUNTIFS — count with two conditions', fields: [f('r1', 'Range 1', 'A2:A100'), f('c1', 'Criteria 1', '"North"'), f('r2', 'Range 2', 'C2:C100'), f('c2', 'Criteria 2', '">1000"')],
      build: function (v) { return { formula: '=COUNTIFS(' + R(v.r1) + ',' + v.c1.trim() + ',' + R(v.r2) + ',' + v.c2.trim() + ')', explain: 'Counts rows where both conditions are met.' }; } },
    { id: 'averageif', name: 'AVERAGEIF — average of matching rows', fields: [f('range', 'Criteria range', 'A2:A100'), f('crit', 'Criteria', '"North"'), f('avg', 'Range to average', 'C2:C100')],
      build: function (v) { return { formula: '=AVERAGEIF(' + R(v.range) + ',' + v.crit.trim() + ',' + R(v.avg) + ')', explain: 'Averages ' + R(v.avg) + ' where ' + R(v.range) + ' meets the criteria.' }; } },
    { id: 'vlookup', name: 'VLOOKUP — look up a value in a table', fields: [f('val', 'Lookup value (cell)', 'A2'), f('tbl', 'Table range', 'F:H', 'The lookup column must be the first column'), f('col', 'Column number to return', '2'), { id: 'exact', label: 'Match type', type: 'select', options: [{ value: 'FALSE', label: 'Exact match (recommended)' }, { value: 'TRUE', label: 'Approximate match' }], value: 'FALSE' }],
      build: function (v) { var c = parseInt(v.col, 10); if (!(c >= 1)) throw new Error('Column number must be 1 or more.'); return { formula: '=VLOOKUP(' + R(v.val) + ',' + R(v.tbl) + ',' + c + ',' + v.exact + ')', explain: 'Finds ' + R(v.val) + ' in the first column of ' + R(v.tbl) + ' and returns the value from column ' + c + '. Wrap in IFERROR() to hide #N/A.' }; } },
    { id: 'xlookup', name: 'XLOOKUP — modern lookup (Excel 365/2021)', fields: [f('val', 'Lookup value (cell)', 'A2'), f('look', 'Lookup range', 'F2:F500'), f('ret', 'Return range', 'H2:H500'), f('nf', 'If not found, show', '"Not found"')],
      build: function (v) { return { formula: '=XLOOKUP(' + R(v.val) + ',' + R(v.look) + ',' + R(v.ret) + ',' + v.nf.trim() + ')', explain: 'Searches ' + R(v.look) + ' for ' + R(v.val) + ' and returns the matching item from ' + R(v.ret) + '. Works left-to-right or right-to-left. Requires Excel 2021 or Microsoft 365.' }; } },
    { id: 'indexmatch', name: 'INDEX + MATCH — flexible lookup (all versions)', fields: [f('ret', 'Return range', 'H2:H500'), f('val', 'Lookup value (cell)', 'A2'), f('look', 'Lookup range', 'F2:F500')],
      build: function (v) { return { formula: '=INDEX(' + R(v.ret) + ',MATCH(' + R(v.val) + ',' + R(v.look) + ',0))', explain: 'MATCH finds the row of ' + R(v.val) + ' in ' + R(v.look) + '; INDEX returns the value from the same row in ' + R(v.ret) + '.' }; } },
    { id: 'if', name: 'IF — return one of two results', fields: [f('cell', 'Cell to test', 'B2'), { id: 'op', label: 'Operator', type: 'select', options: ['>', '>=', '<', '<=', '=', '<>'], value: '>=' }, f('val', 'Compare with', '100'), f('yes', 'If true, show', '"Achieved"'), f('no', 'If false, show', '"Not achieved"')],
      build: function (v) { return { formula: '=IF(' + R(v.cell) + v.op + v.val.trim() + ',' + v.yes.trim() + ',' + v.no.trim() + ')', explain: 'Tests whether ' + R(v.cell) + ' ' + v.op + ' ' + v.val.trim() + ' and shows the matching result.' }; } },
    { id: 'grade', name: 'Nested IF — rating bands (e.g. achievement %)', fields: [f('cell', 'Cell with the score', 'B2'), f('t1', 'Band 1 minimum', '100'), f('l1', 'Band 1 label', '"Exceeds"'), f('t2', 'Band 2 minimum', '90'), f('l2', 'Band 2 label', '"Meets"'), f('t3', 'Band 3 minimum', '75'), f('l3', 'Band 3 label', '"Needs improvement"'), f('l4', 'Label below band 3', '"Below target"')],
      build: function (v) { var c = R(v.cell); return { formula: '=IF(' + c + '>=' + v.t1 + ',' + v.l1.trim() + ',IF(' + c + '>=' + v.t2 + ',' + v.l2.trim() + ',IF(' + c + '>=' + v.t3 + ',' + v.l3.trim() + ',' + v.l4.trim() + ')))', explain: 'Checks the highest band first and works down. In Excel 2019+, IFS() can express the same logic more readably.' }; } },
    { id: 'pctchange', name: 'Percentage change between two values', fields: [f('old', 'Old value (cell)', 'B2'), f('nw', 'New value (cell)', 'C2')],
      build: function (v) { return { formula: '=IFERROR((' + R(v.nw) + '-' + R(v.old) + ')/' + R(v.old) + ',0)', explain: 'Returns the change as a decimal; format the cell as Percentage. IFERROR avoids #DIV/0! when the old value is 0.' }; } },
    { id: 'achv', name: 'Target achievement %', fields: [f('act', 'Actual (cell)', 'C2'), f('tgt', 'Target (cell)', 'B2')],
      build: function (v) { return { formula: '=IFERROR(' + R(v.act) + '/' + R(v.tgt) + ',0)', explain: 'Achievement as a decimal; format as Percentage. Returns 0 if the target is blank or zero.' }; } },
    { id: 'wavg', name: 'Weighted average (SUMPRODUCT)', fields: [f('vals', 'Values range', 'B2:B6'), f('wts', 'Weights range', 'C2:C6')],
      build: function (v) { return { formula: '=SUMPRODUCT(' + R(v.vals) + ',' + R(v.wts) + ')/SUM(' + R(v.wts) + ')', explain: 'Multiplies each value by its weight, adds them up and divides by total weight. Ideal for KPI scorecards.' }; } },
    { id: 'rank', name: 'RANK — position in a list', fields: [f('cell', 'Value (cell)', 'B2'), f('range', 'Range to rank within', '$B$2:$B$50', 'Use absolute references ($) so it can be copied down'), { id: 'ord', label: 'Order', type: 'select', options: [{ value: '0', label: 'Highest = 1' }, { value: '1', label: 'Lowest = 1' }], value: '0' }],
      build: function (v) { return { formula: '=RANK(' + R(v.cell) + ',' + R(v.range) + ',' + v.ord + ')', explain: 'Ranks ' + R(v.cell) + ' within the range. Ties receive the same rank.' }; } },
    { id: 'running', name: 'Running (cumulative) total', fields: [f('first', 'First value cell in the column', 'B2')],
      build: function (v) { var c = R(v.first), col = c.replace(/[0-9$]/g, ''), row = c.replace(/[^0-9]/g, ''); if (!col || !row) throw new Error('Enter a cell such as B2.'); return { formula: '=SUM($' + col + '$' + row + ':' + col + row + ')', explain: 'Enter in the first row, then fill down: the start is locked and the end moves with each row.' }; } },
    { id: 'datedif', name: 'DATEDIF — years, months or days between dates', fields: [f('s', 'Start date (cell)', 'A2'), f('e', 'End date (cell)', 'B2'), { id: 'u', label: 'Unit', type: 'select', options: [{ value: 'Y', label: 'Complete years' }, { value: 'M', label: 'Complete months' }, { value: 'D', label: 'Days' }, { value: 'YM', label: 'Months after complete years' }], value: 'Y' }],
      build: function (v) { return { formula: '=DATEDIF(' + R(v.s) + ',' + R(v.e) + ',"' + v.u + '")', explain: 'DATEDIF is a hidden-but-supported function. The start date must be earlier than the end date.' }; } },
    { id: 'textjoin', name: 'TEXTJOIN — combine cells with a separator', fields: [f('sep', 'Separator', '", "'), f('range', 'Range to join', 'A2:A10')],
      build: function (v) { return { formula: '=TEXTJOIN(' + v.sep.trim() + ',TRUE,' + R(v.range) + ')', explain: 'Joins all non-empty cells in the range using the separator (Excel 2019+).' }; } },
    { id: 'unique', name: 'UNIQUE — list distinct values', fields: [f('range', 'Range', 'A2:A500')],
      build: function (v) { return { formula: '=UNIQUE(' + R(v.range) + ')', explain: 'Spills a list of distinct values (Excel 365/2021). In older versions use Data > Remove Duplicates or a PivotTable.' }; } }
  ];
  var idx = 0, ctx;
  root.innerHTML = '<div class="field"><label for="f-type">What do you want to calculate?</label><select id="f-type">' + T.map(function (t, i) { return '<option value="' + i + '">' + U.esc(t.name) + '</option>'; }).join('') + '</select></div><div id="xf-body"></div>';
  function build() {
    var t = T[idx];
    ctx = U.mount(root.querySelector('#xf-body'), {
      fields: t.fields.map(function (x) { return Object.assign({ type: 'text' }, x); }),
      actions: [{ id: 'copy', label: 'Copy formula', onClick: function () { var el = root.querySelector('#xf-formula'); if (el) U.copy(el.textContent, 'Formula copied'); else U.toast('Generate a formula first'); } }],
      onInput: function (v, c) {
        for (var k in v) if (typeof v[k] === 'string' && !v[k].trim()) return c.error('Please fill in every field to generate the formula.'), c.html('');
        try {
          var r = t.build(v);
          c.html('<div class="result-box big"><small>Excel formula</small><b id="xf-formula" style="font-family:var(--mono);font-size:1.15rem;user-select:all">' + U.esc(r.formula) + '</b></div><p class="result-note">' + U.esc(r.explain) + '</p>' +
            '<p class="result-note">Paste it into a cell, replace the example ranges with yours, and press Enter. Text criteria need straight double quotes.</p>');
        } catch (e) { c.error(e.message); c.html(''); }
      }
    });
  }
  root.querySelector('#f-type').addEventListener('change', function (e) { idx = +e.target.value; build(); });
  build();
};
