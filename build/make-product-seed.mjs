// Generates backend/seed/products.sql from the products already listed in shop/index.html (name, description, PKR price). Run: node build/make-product-seed.mjs
import fs from 'fs';
const h = fs.readFileSync('D:/GM_Claude/shop/index.html', 'utf8'); const rows = [];
for (const m of h.matchAll(/<article class="card shop-card" id="([a-z0-9-]+)">([\s\S]*?)<\/article>/g)) {
  const name = (m[2].match(/<h3[^>]*>([\s\S]*?)<\/h3>/) || [])[1], desc = (m[2].match(/<p class="muted"[^>]*>([\s\S]*?)<\/p>/) || [])[1], pkr = (m[2].match(/Rs ([\d,]+)/) || [])[1];
  if (!name || !pkr) { console.log('skipped', m[1]); continue; }
  const clean = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&middot;/g, '').replace(/\s+/g, ' ').trim().replace(/'/g, "''");
  rows.push(`('${m[1]}','${clean(name)}','${clean(desc || '').slice(0, 380)}','one_time','PKR',${parseInt(pkr.replace(/,/g, ''), 10) * 100},0,1,datetime('now'))`);
}
fs.mkdirSync('D:/GM_Claude/backend/seed', { recursive: true });
fs.writeFileSync('D:/GM_Claude/backend/seed/products.sql', '-- Generated from shop/index.html by build/make-product-seed.mjs. Prices in paisa. Review before importing.\nINSERT OR IGNORE INTO products(id,name,description,kind,currency,price_minor,trial_days,active,created_at) VALUES\n' + rows.join(',\n') + ';\n');
console.log(rows.length, 'products written');
