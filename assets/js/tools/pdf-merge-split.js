/* PDF Merge & Split: runs entirely in the browser with pdf-lib (MIT). Files are never uploaded. */
NiaziTools['pdf-merge-split'] = function (root, U) {
  var MAX = 100 * 1024 * 1024;
  if (!window.PDFLib) { root.innerHTML = '<p class="inline-error">The PDF engine could not load. Please refresh the page.</p>'; return; }
  var L = window.PDFLib;
  root.innerHTML = '<div id="pm-body"></div>';
  var body = root.querySelector('#pm-body');
  function size(n) { return n > 1048576 ? U.fmt(n / 1048576, 1) + ' MB' : U.fmt(n / 1024, 0) + ' KB'; }
  function readBytes(file) { return file.arrayBuffer().then(function (b) { return new Uint8Array(b); }); }
  function load(bytes) {
    return L.PDFDocument.load(bytes, { updateMetadata: false }).catch(function (e) {
      if (/encrypt/i.test(String(e && e.message))) throw new Error('This PDF is password-protected. Remove the password first, then try again.');
      throw new Error('This file could not be read as a PDF.');
    });
  }
  function base(name) { return U.slug(String(name || 'document').replace(/\.pdf$/i, '')); }
  function drop(id, multiple, label) {
    return '<label class="dropzone" id="' + id + '-zone" for="' + id + '" tabindex="-1"><b>' + label + '</b><span>PDF files only · up to 100 MB each · processed on your device</span>' +
      '<input type="file" id="' + id + '" accept="application/pdf,.pdf"' + (multiple ? ' multiple' : '') + ' class="sr-only"></label>';
  }
  function wireDrop(zoneId, input, onFiles) {
    var z = root.querySelector('#' + zoneId);
    ['dragenter', 'dragover'].forEach(function (ev) { z.addEventListener(ev, function (e) { e.preventDefault(); z.classList.add('drag'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { z.addEventListener(ev, function (e) { e.preventDefault(); z.classList.remove('drag'); }); });
    z.addEventListener('drop', function (e) { onFiles([].slice.call(e.dataTransfer.files)); });
    input.addEventListener('change', function () { onFiles([].slice.call(input.files)); input.value = ''; });
  }

  /* ---------- Merge ---------- */
  function merge() {
    var files = [];
    body.innerHTML = drop('pm-files', true, 'Drop PDFs here or click to choose') +
      '<p class="form-error" id="pm-err" role="alert"></p><div id="pm-list" class="file-list"></div>' +
      '<div class="tool-actions"><button type="button" class="btn btn-primary" id="pm-go" disabled>Merge PDFs</button><button type="button" class="btn btn-ghost" id="pm-clear" disabled>Clear</button></div>' +
      '<div class="tool-result" id="pm-out" aria-live="polite"></div>';
    var list = body.querySelector('#pm-list'), err = body.querySelector('#pm-err'), out = body.querySelector('#pm-out');
    function render() {
      list.innerHTML = files.map(function (f, i) {
        return '<div class="file-row"><span class="file-n">' + (i + 1) + '</span><span class="file-name">' + U.esc(f.file.name) + '<small>' + size(f.file.size) + (f.pages ? ' · ' + f.pages + ' page' + (f.pages > 1 ? 's' : '') : '') + '</small></span>' +
          '<span class="file-btns"><button type="button" class="btn btn-ghost btn-sm" data-up="' + i + '" aria-label="Move ' + U.esc(f.file.name) + ' up"' + (i ? '' : ' disabled') + '>↑</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-down="' + i + '" aria-label="Move ' + U.esc(f.file.name) + ' down"' + (i < files.length - 1 ? '' : ' disabled') + '>↓</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-del="' + i + '" aria-label="Remove ' + U.esc(f.file.name) + '">✕</button></span></div>';
      }).join('');
      body.querySelector('#pm-go').disabled = files.length < 2;
      body.querySelector('#pm-clear').disabled = !files.length;
      if (files.length === 1) out.innerHTML = '<div class="result-empty">Add at least one more PDF to merge.</div>';
      else if (!files.length) out.innerHTML = '';
    }
    wireDrop('pm-files-zone', body.querySelector('#pm-files'), function (list2) {
      err.textContent = ''; var skipped = [];
      list2.forEach(function (file) {
        if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name)) { skipped.push(file.name + ' (not a PDF)'); return; }
        if (file.size > MAX) { skipped.push(file.name + ' (over 100 MB)'); return; }
        var item = { file: file, pages: 0 }; files.push(item);
        readBytes(file).then(load).then(function (doc) { item.pages = doc.getPageCount(); render(); }).catch(function (e) {
          files.splice(files.indexOf(item), 1); err.textContent = file.name + ': ' + e.message; render();
        });
      });
      if (skipped.length) err.textContent = 'Skipped: ' + skipped.join(', ');
      render();
    });
    list.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var up = b.getAttribute('data-up'), dn = b.getAttribute('data-down'), del = b.getAttribute('data-del'), t;
      if (up != null) { up = +up; t = files[up - 1]; files[up - 1] = files[up]; files[up] = t; }
      if (dn != null) { dn = +dn; t = files[dn + 1]; files[dn + 1] = files[dn]; files[dn] = t; }
      if (del != null) files.splice(+del, 1);
      render();
    });
    body.querySelector('#pm-clear').addEventListener('click', function () { files = []; out.innerHTML = ''; render(); });
    body.querySelector('#pm-go').addEventListener('click', function () {
      var btn = this; btn.disabled = true; btn.textContent = 'Merging…'; err.textContent = '';
      L.PDFDocument.create().then(function (outDoc) {
        return files.reduce(function (p, f) {
          return p.then(function () { return readBytes(f.file).then(load).then(function (src) {
            return outDoc.copyPages(src, src.getPageIndices()).then(function (pages) { pages.forEach(function (pg) { outDoc.addPage(pg); }); });
          }); });
        }, Promise.resolve()).then(function () { return outDoc.save(); }).then(function (bytes) {
          var blob = new Blob([bytes], { type: 'application/pdf' }), total = outDoc.getPageCount();
          out.innerHTML = U.grid([U.box('Merged PDF', U.fmt(total, 0) + ' pages', '', true), U.box('Files combined', U.fmt(files.length, 0)), U.box('File size', size(blob.size))]) +
            '<div class="tool-actions"><button type="button" class="btn btn-primary" id="pm-dl">Download merged PDF</button></div>';
          out.querySelector('#pm-dl').onclick = function () { U.download('merged.pdf', blob); };
          U.download('merged.pdf', blob);
        });
      }).catch(function (e) { err.textContent = 'Could not merge: ' + e.message; })
        .then(function () { btn.disabled = files.length < 2; btn.textContent = 'Merge PDFs'; });
    });
    render();
  }

  /* ---------- Split / extract ---------- */
  function parseRanges(s, max) {
    var pages = [], parts = String(s).replace(/\s/g, '').split(',').filter(Boolean);
    if (!parts.length) throw new Error('Enter the pages to extract, for example 1-3, 5.');
    parts.forEach(function (p) {
      var m = p.match(/^(\d+)(?:-(\d+))?$/); if (!m) throw new Error('“' + p + '” is not a valid page or range. Use numbers like 2 or 4-7.');
      var a = +m[1], b = m[2] ? +m[2] : a;
      if (a < 1 || b < 1 || a > max || b > max) throw new Error('This PDF has ' + max + ' pages, so use page numbers from 1 to ' + max + '.');
      if (a > b) throw new Error('In “' + p + '” the first page must not be higher than the last.');
      for (var i = a; i <= b; i++) pages.push(i - 1);
    });
    return pages;
  }
  function split() {
    var doc = null, file = null;
    body.innerHTML = drop('ps-file', false, 'Drop a PDF here or click to choose') +
      '<p class="form-error" id="ps-err" role="alert"></p><div id="ps-info"></div>' +
      '<div id="ps-opts" hidden><div class="form-grid"><div class="field"><label for="ps-mode">What do you want?</label><select id="ps-mode"><option value="extract">Extract selected pages into one PDF</option><option value="each">Split every page into its own PDF (ZIP)</option><option value="chunks">Split into files of N pages (ZIP)</option></select></div>' +
      '<div class="field" id="ps-r-wrap"><label for="ps-range">Pages to extract</label><input type="text" id="ps-range" placeholder="e.g. 1-3, 5, 8-10"><small class="hint">Use commas and ranges. Pages are kept in the order you type.</small></div>' +
      '<div class="field" id="ps-n-wrap" hidden><label for="ps-n">Pages per file</label><input type="text" inputmode="numeric" id="ps-n" value="2"></div></div>' +
      '<div class="tool-actions"><button type="button" class="btn btn-primary" id="ps-go">Create PDF</button></div></div>' +
      '<div class="tool-result" id="ps-out" aria-live="polite"></div>';
    var err = body.querySelector('#ps-err'), info = body.querySelector('#ps-info'), opts = body.querySelector('#ps-opts'), out = body.querySelector('#ps-out');
    var mode = body.querySelector('#ps-mode');
    mode.addEventListener('change', function () {
      body.querySelector('#ps-r-wrap').hidden = mode.value !== 'extract';
      body.querySelector('#ps-n-wrap').hidden = mode.value !== 'chunks';
      body.querySelector('#ps-go').textContent = mode.value === 'extract' ? 'Create PDF' : 'Split and download ZIP';
    });
    wireDrop('ps-file-zone', body.querySelector('#ps-file'), function (fl) {
      err.textContent = ''; out.innerHTML = ''; var f = fl[0]; if (!f) return;
      if (!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name)) { err.textContent = 'Please choose a PDF file.'; return; }
      if (f.size > MAX) { err.textContent = 'That file is over 100 MB.'; return; }
      readBytes(f).then(load).then(function (d) {
        doc = d; file = f; opts.hidden = false;
        info.innerHTML = '<div class="file-row"><span class="file-n">PDF</span><span class="file-name">' + U.esc(f.name) + '<small>' + size(f.size) + ' · ' + d.getPageCount() + ' pages</small></span></div>';
      }).catch(function (e) { doc = null; opts.hidden = true; info.innerHTML = ''; err.textContent = e.message; });
    });
    body.querySelector('#ps-go').addEventListener('click', function () {
      if (!doc) return; err.textContent = ''; var btn = this, max = doc.getPageCount(), name = base(file.name);
      var groups;
      try {
        if (mode.value === 'extract') groups = [parseRanges(body.querySelector('#ps-range').value, max)];
        else {
          var n = mode.value === 'each' ? 1 : parseInt(body.querySelector('#ps-n').value, 10);
          if (!(n >= 1)) throw new Error('Enter how many pages each file should have (1 or more).');
          groups = []; for (var i = 0; i < max; i += n) { var g = []; for (var j = i; j < Math.min(i + n, max); j++) g.push(j); groups.push(g); }
        }
      } catch (e) { err.textContent = e.message; return; }
      btn.disabled = true; var label = btn.textContent; btn.textContent = 'Working…';
      Promise.all(groups.map(function (g) {
        return L.PDFDocument.create().then(function (nd) {
          return nd.copyPages(doc, g).then(function (pages) { pages.forEach(function (p) { nd.addPage(p); }); return nd.save(); });
        });
      })).then(function (outs) {
        var dlName, blob;
        if (outs.length === 1 && mode.value === 'extract') { blob = new Blob([outs[0]], { type: 'application/pdf' }); dlName = name + '-pages.pdf'; }
        else {
          blob = U.zip(outs.map(function (b, i) {
            var g = groups[i], label2 = g.length === 1 ? 'page-' + (g[0] + 1) : 'pages-' + (g[0] + 1) + '-' + (g[g.length - 1] + 1);
            return { name: name + '-' + label2 + '.pdf', data: b };
          }));
          dlName = name + '-split.zip';
        }
        out.innerHTML = U.grid([U.box(outs.length === 1 && mode.value === 'extract' ? 'New PDF' : 'PDF files created', U.fmt(outs.length === 1 && mode.value === 'extract' ? groups[0].length : outs.length, 0) + (outs.length === 1 && mode.value === 'extract' ? ' pages' : ' files'), '', true), U.box('Download size', size(blob.size))]) +
          '<div class="tool-actions"><button type="button" class="btn btn-primary" id="ps-dl">Download ' + (dlName.slice(-3) === 'zip' ? 'ZIP' : 'PDF') + '</button></div>';
        out.querySelector('#ps-dl').onclick = function () { U.download(dlName, blob); };
        U.download(dlName, blob);
      }).catch(function (e) { err.textContent = 'Could not split: ' + e.message; })
        .then(function () { btn.disabled = false; btn.textContent = label; });
    });
  }

  var views = [merge, split];
  U.tabs(root, ['Merge PDFs', 'Split or extract pages'], function (i) { views[i](); });
  merge();
};
