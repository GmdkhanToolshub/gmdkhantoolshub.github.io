/* Services enquiry form. Nothing is sent to or stored on this website: the message opens in the visitor's own WhatsApp or email app. */
(function () {
  'use strict';
  var form = document.getElementById('enq-form');
  if (!form) return;
  var $ = function (id) { return document.getElementById(id); };
  var clean = function (id, max) { return String($(id).value || '').replace(/\s+\n/g, '\n').trim().slice(0, max); };
  var say = function (t, bad) { var m = $('enq-msg'); m.textContent = t; m.style.color = bad ? '#b91c1c' : ''; };
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var way = (e.submitter && e.submitter.getAttribute('data-way')) || 'wa';
    var name = clean('enq-name', 80), need = clean('enq-need', 900), service = $('enq-service').value;
    ['enq-name', 'enq-need'].forEach(function (id) { $(id).removeAttribute('aria-invalid'); });
    if (!name) { $('enq-name').setAttribute('aria-invalid', 'true'); $('enq-name').focus(); say('Please enter your name or business name.', true); return; }
    if (need.length < 15) { $('enq-need').setAttribute('aria-invalid', 'true'); $('enq-need').focus(); say('Please describe what you need in a sentence or two.', true); return; }
    var lines = ['Hello, I would like a quote.', '', 'Service: ' + service, 'Name or business: ' + name, 'What I need: ' + need];
    [['Deadline', 'enq-deadline', 60], ['Budget range', 'enq-budget', 60], ['Country or city', 'enq-place', 60]].forEach(function (f) { var v = clean(f[1], f[2]); if (v) lines.push(f[0] + ': ' + v); });
    var text = lines.join('\n');
    var url = way === 'mail' ? 'mailto:gmkn16@yahoo.com?subject=' + encodeURIComponent('Quote request: ' + service) + '&body=' + encodeURIComponent(text) : 'https://wa.me/923158935101?text=' + encodeURIComponent(text);
    if (way === 'mail') location.href = url; else window.open(url, '_blank', 'noopener');
    say('Your message is ready in your ' + (way === 'mail' ? 'email' : 'WhatsApp') + ' app. It is not sent until you press Send there.');
    if (window.GM_track) window.GM_track('enquiry_form', { channel: way === 'mail' ? 'email' : 'whatsapp' });
  });
})();
