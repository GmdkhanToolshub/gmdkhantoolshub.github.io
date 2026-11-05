NiaziTools['message-writer'] = function (root, U) {
  var text = '', subj = '';
  var SC = {
    followup: 'Follow-up on a previous message', meeting: 'Request a meeting', delay: 'Apologise for a delay', thanks: 'Thank you', info: 'Request information', payment: 'Payment reminder', leave: 'Leave request', intro: 'Introduce yourself / networking', status: 'Status update', decline: 'Politely decline'
  };
  var ctx = U.mount(root, {
    fields: [
      { id: 'ch', label: 'Channel', type: 'select', options: ['Email', 'WhatsApp'], value: 'Email' },
      { id: 'sc', label: 'What is the message for?', type: 'select', options: Object.keys(SC).map(function (k) { return { value: k, label: SC[k] }; }), value: 'followup' },
      { id: 'to', label: 'Recipient name', value: '', placeholder: 'e.g. Sara' },
      { id: 'from', label: 'Your name', value: '' },
      { id: 'topic', label: 'Topic / subject', value: '', placeholder: 'e.g. the Q3 distribution plan', wide: true },
      { id: 'detail', label: 'Key details (optional)', type: 'textarea', rows: 3, wide: true, value: '', placeholder: 'Dates, amounts, reasons, what you need…' },
      { id: 'when', label: 'Date / deadline (optional)', value: '', placeholder: 'e.g. Friday 14 November' },
      { id: 'tone', label: 'Tone', type: 'select', options: [{ value: 'formal', label: 'Formal' }, { value: 'friendly', label: 'Friendly' }, { value: 'direct', label: 'Short & direct' }], value: 'formal' }
    ],
    actions: [{ id: 'gen', label: 'Write message', onClick: function (v, c) { gen(v, c); } }],
    onInput: function (v, c) { if (!c.out.innerHTML) c.empty('Choose a channel and situation, add a few details and press "Write message".'); }
  });
  function gen(v, c) {
    if (!v.topic.trim()) return c.error('Please enter a topic or subject.');
    var t = v.topic.trim(), d = v.detail.trim().replace(/\.*$/, ''), w = v.when.trim(), wa = v.ch === 'WhatsApp', f = v.tone === 'formal', fr = v.tone === 'friendly', dr = v.tone === 'direct';
    var greet = v.to.trim() ? (wa ? (fr ? 'Hi ' : 'Hello ') : (f ? 'Dear ' : 'Hi ')) + v.to.trim() + (wa || !f ? ',' : ',') : (wa ? 'Hello,' : f ? 'Dear Sir/Madam,' : 'Hello,');
    var close = wa ? '' : (f ? 'Kind regards,' : fr ? 'Best wishes,' : 'Thanks,'), sig = v.from.trim();
    var B = {
      followup: { s: 'Follow-up: ' + t, b: [f ? 'I am writing to follow up on ' + t + '.' : 'Just following up on ' + t + '.', d && d + '.', w ? 'Could you please share an update by ' + w + '?' : 'Could you please share an update when you have a moment?'] },
      meeting: { s: 'Meeting request: ' + t, b: [f ? 'I would like to request a meeting to discuss ' + t + '.' : 'Could we find some time to talk about ' + t + '?', d && d + '.', w ? 'Would ' + w + ' work for you? I am happy to adjust to your schedule.' : 'Please let me know a time that suits you.'] },
      delay: { s: 'Apologies for the delay: ' + t, b: [f ? 'Please accept my apologies for the delay regarding ' + t + '.' : 'Sorry for the delay on ' + t + '.', d && d + '.', w ? 'I will have this completed by ' + w + '.' : 'I will get this to you as soon as possible and keep you updated.'] },
      thanks: { s: 'Thank you: ' + t, b: [f ? 'Thank you very much for ' + t + '.' : 'Thanks so much for ' + t + '!', d && d + '.', 'I really appreciate your support.'] },
      info: { s: 'Request for information: ' + t, b: [f ? 'I am writing to request information about ' + t + '.' : 'Could you help me with some information on ' + t + '?', d && 'Specifically: ' + d + '.', w ? 'It would be very helpful to have this by ' + w + '.' : 'Thank you in advance for your help.'] },
      payment: { s: 'Payment reminder: ' + t, b: [f ? 'This is a friendly reminder regarding payment for ' + t + '.' : 'Quick reminder about the payment for ' + t + '.', d && d + '.', w ? 'Please arrange payment by ' + w + ', or let me know if there is an issue.' : 'Please let me know the expected payment date, or if there is any issue.', 'If you have already paid, kindly ignore this message.'] },
      leave: { s: 'Leave request: ' + t, b: [f ? 'I would like to request leave for ' + t + (w ? ' (' + w + ')' : '') + '.' : 'I would like to take leave for ' + t + (w ? ' (' + w + ')' : '') + '.', d && d + '.', 'I will make sure my tasks are handed over and my work is covered before I go.'] },
      intro: { s: 'Introduction: ' + t, b: [f ? 'I hope you are well. I am writing to introduce myself in connection with ' + t + '.' : 'Hope you are doing well! I wanted to introduce myself about ' + t + '.', d && d + '.', 'I would value the chance to connect' + (w ? ' ' + w : '') + '.'] },
      status: { s: 'Status update: ' + t, b: [f ? 'Please find below a brief update on ' + t + '.' : 'Quick update on ' + t + ':', d && d + '.', w ? 'Next milestone: ' + w + '.' : 'I will share the next update as soon as there is progress.'] },
      decline: { s: 'Regarding ' + t, b: [f ? 'Thank you for ' + t + '. After careful consideration, I am unable to proceed at this time.' : 'Thanks for thinking of me regarding ' + t + '. Unfortunately I have to decline.', d && d + '.', 'I appreciate your understanding and hope we can connect on another occasion.'] }
    }[v.sc];
    var parts = B.b.filter(Boolean);
    if (dr) parts = parts.slice(0, 2).concat(parts.length > 2 ? [parts[parts.length - 1]] : []);
    subj = B.s;
    text = (wa ? greet + '\n\n' + parts.join('\n\n') + (sig ? '\n\n' + sig : '') : greet + '\n\n' + parts.join('\n\n') + '\n\n' + close + (sig ? '\n' + sig : '')).trim();
    var links = wa ? '<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=' + encodeURIComponent(text) + '">Open in WhatsApp</a>' : '<a class="btn btn-ghost btn-sm" href="mailto:?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(text) + '">Open in email app</a>';
    c.html((wa ? '' : '<div class="field"><label for="out-subj">Subject</label><input id="out-subj" value="' + U.esc(subj) + '"></div>') + '<label for="out-text">Message (edit freely)</label><textarea id="out-text" class="output-text" rows="' + (wa ? 9 : 12) + '">' + U.esc(text) + '</textarea>' +
      '<div class="tool-actions"><button type="button" class="btn btn-primary btn-sm" data-out="copy">Copy message</button>' + (wa ? '' : '<button type="button" class="btn btn-ghost btn-sm" id="copy-subj">Copy subject</button>') + '<button type="button" class="btn btn-ghost btn-sm" data-out="txt">Download .txt</button>' + links + '</div>' +
      '<p class="result-note">Always read the draft before sending and adjust names, dates and details.</p>');
    var cs = c.$('#copy-subj'); if (cs) cs.onclick = function () { U.copy(c.$('#out-subj').value, 'Subject copied'); };
  }
  U.textActions(ctx, function () { return text; }, 'message-draft');
};
