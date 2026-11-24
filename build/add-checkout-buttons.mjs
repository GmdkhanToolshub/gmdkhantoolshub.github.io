// RUN ONLY AFTER the payments API is live and assets/js/checkout-config.js has its apiBase.
// Adds a "Buy securely" button to each shop card, next to the existing WhatsApp and email order buttons (which stay). Idempotent. Undo: node build/add-checkout-buttons.mjs --undo
import fs from 'fs';
const f = 'D:/GM_Claude/shop/index.html'; let h = fs.readFileSync(f, 'utf8'); const undo = process.argv.includes('--undo'); let n = 0;
h = h.replace(/<a class="btn btn-accent btn-sm" data-gm-checkout="1" href="[^"]*">Buy securely<\/a>/g, '');
if (!undo) h = h.replace(/(<article class="card shop-card" id="([a-z0-9-]+)">[\s\S]*?<div class="btn-row" style="margin-top:8px">)/g, (m, a, id) => { n++; return a + '<a class="btn btn-accent btn-sm" data-gm-checkout="1" href="../checkout/?product=' + id + '">Buy securely</a>'; });
fs.writeFileSync(f, h, 'utf8'); console.log(undo ? 'buttons removed' : n + ' buttons added');
