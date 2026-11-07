/* QR Code Scanner: camera or image, decoded on the device. Uses the browser's BarcodeDetector when available,
   otherwise the open-source jsQR library (Apache-2.0), loaded only when needed. Nothing is uploaded. */
NiaziTools['qr-code-scanner'] = function (root, U) {
  var base = document.body.getAttribute('data-root') || '../../';
  var detector = null, jsqrPromise = null, stream = null, raf = 0, scanning = false;
  try { if ('BarcodeDetector' in window) detector = new window.BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { detector = null; }
  function loadJsQR() {
    if (window.jsQR) return Promise.resolve(window.jsQR);
    if (!jsqrPromise) jsqrPromise = new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = base + 'assets/vendor/jsQR.js'; s.async = true;
      s.onload = function () { window.jsQR ? res(window.jsQR) : rej(new Error('Scanner library missing')); };
      s.onerror = function () { rej(new Error('Could not load the scanner library.')); };
      document.head.appendChild(s);
    });
    return jsqrPromise;
  }
  root.innerHTML =
    '<div class="tool-actions" style="margin-top:0"><button type="button" class="btn btn-primary" id="qs-cam">Scan with camera</button>' +
    '<label class="btn btn-ghost" for="qs-file" style="cursor:pointer">Scan an image</label><input type="file" id="qs-file" accept="image/*" class="sr-only">' +
    '<button type="button" class="btn btn-ghost" id="qs-stop" hidden>Stop camera</button></div>' +
    '<div class="qs-stage" id="qs-stage" hidden><video id="qs-video" playsinline muted aria-label="Camera preview"></video><div class="qs-frame" aria-hidden="true"></div></div>' +
    '<p class="form-error" id="qs-err" role="alert"></p>' +
    '<div class="tool-result" id="qs-out" aria-live="polite"><div class="result-empty">Point your camera at a QR code, or choose a photo or screenshot that contains one.</div></div>';
  var video = root.querySelector('#qs-video'), stage = root.querySelector('#qs-stage'), err = root.querySelector('#qs-err'), out = root.querySelector('#qs-out');
  var canvas = document.createElement('canvas'), ctx2 = canvas.getContext('2d', { willReadFrequently: true });

  function classify(t) {
    if (/^https?:\/\//i.test(t)) return 'Website link';
    if (/^WIFI:/i.test(t)) return 'Wi-Fi network';
    if (/^BEGIN:VCARD/i.test(t)) return 'Contact card';
    if (/^mailto:/i.test(t)) return 'Email';
    if (/^tel:/i.test(t)) return 'Phone number';
    if (/^smsto?:/i.test(t)) return 'Text message';
    if (/^geo:/i.test(t)) return 'Location';
    return 'Text';
  }
  function wifi(t) {
    var g = function (k) { var m = t.match(new RegExp('[;:]' + k + ':((?:\\\\.|[^;])*)')); return m ? m[1].replace(/\\(.)/g, '$1') : ''; };
    return { ssid: g('S'), pass: g('P'), type: g('T') || 'None' };
  }
  function show(text) {
    var kind = classify(text), extra = '';
    if (kind === 'Wi-Fi network') { var w = wifi(text); extra = U.grid([U.box('Network name', U.esc(w.ssid || '–')), U.box('Password', U.esc(w.pass || '(none)')), U.box('Security', U.esc(w.type))]); }
    var safeLink = kind === 'Website link' ? '<a class="btn btn-ghost" href="' + U.esc(text) + '" target="_blank" rel="noopener noreferrer nofollow">Open link</a>' : '';
    out.innerHTML = U.grid([U.box('QR code type', U.esc(kind), '', true)]) + extra +
      '<label for="qs-text" style="margin-top:14px">Decoded content</label><textarea id="qs-text" class="output-text" rows="4" readonly dir="auto">' + U.esc(text) + '</textarea>' +
      '<div class="tool-actions"><button type="button" class="btn btn-primary" id="qs-copy">Copy</button>' + safeLink + '</div>' +
      (kind === 'Website link' ? '<p class="result-note">Check the address before opening it. QR codes can point to fake or harmful websites.</p>' : '');
    out.querySelector('#qs-copy').onclick = function () { U.copy(text); };
    if (navigator.vibrate) try { navigator.vibrate(60); } catch (e) {}
  }
  function decodeFrame(source, w, h) {
    if (detector) return detector.detect(source).then(function (r) { return r && r[0] ? r[0].rawValue : null; });
    return loadJsQR().then(function (jsQR) {
      canvas.width = w; canvas.height = h; ctx2.drawImage(source, 0, 0, w, h);
      var d = ctx2.getImageData(0, 0, w, h), r = jsQR(d.data, w, h, { inversionAttempts: 'attemptBoth' });
      return r ? r.data : null;
    });
  }
  function stop() {
    scanning = false; cancelAnimationFrame(raf);
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    stage.hidden = true; root.querySelector('#qs-stop').hidden = true; root.querySelector('#qs-cam').hidden = false;
  }
  function tick() {
    if (!scanning) return;
    if (video.readyState >= 2 && video.videoWidth) {
      var w = video.videoWidth, h = video.videoHeight, sc = Math.min(1, 720 / Math.max(w, h));
      decodeFrame(detector ? video : video, Math.round(w * sc), Math.round(h * sc)).then(function (t) {
        if (t) { stop(); show(t); } else raf = requestAnimationFrame(tick);
      }).catch(function () { raf = requestAnimationFrame(tick); });
    } else raf = requestAnimationFrame(tick);
  }
  root.querySelector('#qs-cam').addEventListener('click', function () {
    err.textContent = '';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { err.textContent = 'Your browser cannot use the camera here. Use “Scan an image” instead.'; return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }).then(function (s) {
      stream = s; video.srcObject = s; stage.hidden = false;
      root.querySelector('#qs-stop').hidden = false; root.querySelector('#qs-cam').hidden = true;
      return video.play();
    }).then(function () { scanning = true; if (!detector) loadJsQR().catch(function (e) { err.textContent = e.message; }); tick(); })
      .catch(function (e) {
        stop();
        err.textContent = e && e.name === 'NotAllowedError' ? 'Camera permission was blocked. Allow camera access in your browser settings, or use “Scan an image”.'
          : 'The camera could not start. Use “Scan an image” instead.';
      });
  });
  root.querySelector('#qs-stop').addEventListener('click', stop);
  root.querySelector('#qs-file').addEventListener('change', function () {
    var f = this.files[0]; this.value = ''; err.textContent = ''; if (!f) return;
    if (!/^image\//.test(f.type)) { err.textContent = 'Please choose an image file.'; return; }
    var url = URL.createObjectURL(f), img = new Image();
    img.onload = function () {
      var sc = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      decodeFrame(img, Math.round(img.naturalWidth * sc), Math.round(img.naturalHeight * sc)).then(function (t) {
        URL.revokeObjectURL(url);
        if (t) show(t); else out.innerHTML = '<div class="result-empty">No QR code was found in that image. Try a sharper, closer photo with the whole code visible.</div>';
      }).catch(function (e) { URL.revokeObjectURL(url); err.textContent = e.message; });
    };
    img.onerror = function () { URL.revokeObjectURL(url); err.textContent = 'That image could not be opened.'; };
    img.src = url;
  });
  window.addEventListener('pagehide', stop);
  document.addEventListener('visibilitychange', function () { if (document.hidden && stream) stop(); });
};
