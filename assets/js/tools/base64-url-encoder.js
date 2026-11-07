/* Base64 & URL Encoder/Decoder: UTF-8 safe, plus file to Base64 data URL. Everything runs on the device. */
NiaziTools['base64-url-encoder'] = function (root, U) {
  function b64enc(s, urlSafe) {
    var bytes = new TextEncoder().encode(s), bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    var out = btoa(bin); return urlSafe ? out.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : out;
  }
  function b64dec(s) {
    s = s.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) throw new Error('This is not valid Base64. It may only contain A–Z, a–z, 0–9, + / (or - _) and = padding.');
    while (s.length % 4) s += '=';
    var bin = atob(s), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }
  function panel(kind) {
    var isB = kind === 'b64';
    root.querySelector('#be-body').innerHTML =
      '<div class="field"><label for="be-in">Input</label><textarea id="be-in" rows="6" class="mono" spellcheck="false" placeholder="' + (isB ? 'Text to encode, or Base64 to decode' : 'Text or URL to encode or decode') + '"></textarea></div>' +
      (isB ? '<div class="field check"><input type="checkbox" id="be-safe"><label for="be-safe">URL-safe Base64 (- and _ instead of + and /, no padding)</label></div>' :
        '<div class="field"><label for="be-mode">Encoding style</label><select id="be-mode"><option value="component">Encode everything (for a query value or path part)</option><option value="uri">Keep URL structure (encode a full address)</option></select></div>') +
      '<div class="tool-actions" style="margin-top:0"><button type="button" class="btn btn-primary" id="be-enc">Encode</button><button type="button" class="btn btn-ghost" id="be-dec">Decode</button><button type="button" class="btn btn-ghost" id="be-swap">↕ Use output as input</button></div>' +
      '<p class="form-error" id="be-err" role="alert"></p><div class="field"><label for="be-out">Output</label><textarea id="be-out" rows="6" class="output-text mono" readonly spellcheck="false"></textarea></div>' +
      '<div class="tool-actions" style="margin-top:0"><button type="button" class="btn btn-ghost btn-sm" id="be-copy">Copy output</button></div>';
    var $ = function (s) { return root.querySelector(s); };
    function run(dec) {
      var t = $('#be-in').value; $('#be-err').textContent = '';
      if (!t) { $('#be-out').value = ''; return; }
      try {
        if (isB) $('#be-out').value = dec ? b64dec(t) : b64enc(t, $('#be-safe').checked);
        else {
          var comp = $('#be-mode').value === 'component';
          $('#be-out').value = dec ? (comp ? decodeURIComponent(t.replace(/\+/g, ' ')) : decodeURI(t)) : (comp ? encodeURIComponent(t) : encodeURI(t));
        }
      } catch (e) {
        $('#be-out').value = '';
        $('#be-err').textContent = dec ? (isB ? (e.message.indexOf('valid Base64') > -1 ? e.message : 'This Base64 does not decode to readable UTF-8 text. It may be a file or image; use the File tab to create one.') : 'This text contains a broken % sequence and cannot be decoded.') : 'Could not encode: ' + e.message;
      }
    }
    $('#be-enc').onclick = function () { run(false); };
    $('#be-dec').onclick = function () { run(true); };
    $('#be-swap').onclick = function () { $('#be-in').value = $('#be-out').value; $('#be-out').value = ''; };
    $('#be-copy').onclick = function () { $('#be-out').value ? U.copy($('#be-out').value) : U.toast('Nothing to copy yet'); };
  }
  function filePanel() {
    root.querySelector('#be-body').innerHTML =
      '<label class="dropzone" id="be-zone" for="be-file"><b>Choose a file to convert to Base64</b><span>Up to 5 MB · processed on your device</span><input type="file" id="be-file" class="sr-only"></label>' +
      '<p class="form-error" id="be-err" role="alert"></p><div id="be-fout"></div>';
    var $ = function (s) { return root.querySelector(s); };
    $('#be-file').addEventListener('change', function () {
      var f = this.files[0]; this.value = ''; $('#be-err').textContent = ''; if (!f) return;
      if (f.size > 5 * 1024 * 1024) { $('#be-err').textContent = 'Please choose a file under 5 MB.'; return; }
      var r = new FileReader();
      r.onload = function () {
        var url = String(r.result), raw = url.slice(url.indexOf(',') + 1);
        $('#be-fout').innerHTML = U.grid([U.box('File', U.esc(f.name), '', true), U.box('Original size', U.fmt(f.size / 1024, 1) + ' KB'), U.box('Base64 size', U.fmt(raw.length / 1024, 1) + ' KB')]) +
          '<div class="field"><label for="be-durl">Data URL</label><textarea id="be-durl" rows="5" class="output-text mono" readonly>' + U.esc(url) + '</textarea></div>' +
          '<div class="tool-actions" style="margin-top:0"><button type="button" class="btn btn-primary btn-sm" id="be-c1">Copy data URL</button><button type="button" class="btn btn-ghost btn-sm" id="be-c2">Copy Base64 only</button></div>';
        $('#be-c1').onclick = function () { U.copy(url); }; $('#be-c2').onclick = function () { U.copy(raw); };
      };
      r.onerror = function () { $('#be-err').textContent = 'The file could not be read.'; };
      r.readAsDataURL(f);
    });
  }
  root.innerHTML = '<div id="be-body"></div>';
  var views = [function () { panel('b64'); }, function () { panel('url'); }, filePanel];
  U.tabs(root, ['Base64 text', 'URL encode', 'File to Base64'], function (i) { views[i](); });
  views[0]();
};
