/* BMI Calculator (adults): metric or imperial, WHO categories with the optional lower cut-offs for South Asian adults. */
NiaziTools['bmi-calculator'] = function (root, U) {
  U.mount(root, {
    fields: [
      { id: 'sys', label: 'Units', type: 'select', value: 'metric', options: [{ value: 'metric', label: 'Metric (kg, cm)' }, { value: 'imperial', label: 'Imperial (lb, feet and inches)' }] },
      { id: 'kg', label: 'Weight (kg)', type: 'number', placeholder: 'e.g. 70' },
      { id: 'cm', label: 'Height (cm)', type: 'number', placeholder: 'e.g. 172' },
      { id: 'lb', label: 'Weight (lb)', type: 'number', placeholder: 'e.g. 154' },
      { id: 'ft', label: 'Height (feet)', type: 'number', placeholder: 'e.g. 5' },
      { id: 'in', label: 'Height (inches)', type: 'number', placeholder: 'e.g. 8' },
      { id: 'asian', label: 'Use cut-offs for South Asian adults (WHO 2004)', type: 'checkbox', value: false }
    ],
    onInput: function (v, c) {
      var met = v.sys === 'metric';
      ['kg', 'cm'].forEach(function (k) { c.$('#f-' + k).closest('.field').hidden = !met; });
      ['lb', 'ft', 'in'].forEach(function (k) { c.$('#f-' + k).closest('.field').hidden = met; });
      var kg, m;
      if (met) { kg = U.num(v.kg); m = U.num(v.cm) / 100; }
      else { kg = U.num(v.lb) * 0.45359237; var ft = U.num(v.ft), inch = U.num(v.in); if (!U.isNum(inch)) inch = 0; m = ((U.isNum(ft) ? ft : NaN) * 12 + inch) * 0.0254; }
      if (!U.isNum(kg) || !U.isNum(m)) return c.empty('Enter your weight and height to see your BMI.');
      if (kg < 20 || kg > 400 || m < 1 || m > 2.5) return c.error('Please check the values: weight 20–400 kg and height 100–250 cm.');
      var bmi = kg / (m * m), cut = v.asian ? [18.5, 23, 27.5] : [18.5, 25, 30];
      var cat = bmi < cut[0] ? ['Underweight', 'warn'] : bmi < cut[1] ? ['Healthy weight', 'pos'] : bmi < cut[2] ? ['Overweight', 'warn'] : ['Obesity', 'neg'];
      var lo = cut[0] * m * m, hi = (cut[1] - 0.01) * m * m, w = function (x) { return met ? U.fmt(x, 1) + ' kg' : U.fmt(x / 0.45359237, 1) + ' lb'; };
      var pos = Math.max(0, Math.min(100, (bmi - 15) / 25 * 100));
      c.html(U.grid([U.box('Your BMI', U.fmt(bmi, 1), cat[1], true), U.box('Category', cat[0], cat[1]), U.box('Healthy weight for your height', w(lo) + ' – ' + w(hi))]) +
        '<div class="bmi-scale" aria-hidden="true"><i style="left:' + pos + '%"></i></div><div class="bmi-legend small muted"><span>Under</span><span>Healthy</span><span>Over</span><span>Obese</span></div>' +
        '<p class="result-note">Categories: under ' + cut[0] + ' underweight, ' + cut[0] + '–' + (cut[1] - 0.1).toFixed(1) + ' healthy, ' + cut[1] + '–' + (cut[2] - 0.1).toFixed(1) + ' overweight, ' + cut[2] + ' and above obesity' + (v.asian ? ' (WHO cut-offs suggested for Asian populations)' : ' (WHO adult categories)') + '. BMI is a screening measure for adults only. It does not measure body fat and is not a diagnosis, so talk to a doctor about your health.</p>');
    }
  });
};
