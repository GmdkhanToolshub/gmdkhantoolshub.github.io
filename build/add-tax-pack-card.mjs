import fs from 'fs';
const f='D:/GM_Claude/shop/index.html'; let h=fs.readFileSync(f,'utf8');
h=h.replace(/<article class="card shop-card" id="salary-tax-pack">[\s\S]*?<\/article>/,'');
const m=h.match(/<article class="card shop-card" id="team-kpi-scorecard">[\s\S]*?<\/article>/); if(!m) throw new Error('template card not found');
let c=m[0];
c=c.split('Team%20KPI%20Scorecard').join('Pakistan%20Salary%20Tax%20Pack'); c=c.split('team-kpi-scorecard').join('salary-tax-pack').split('Team KPI Scorecard').join('Pakistan Salary Tax Pack');
c=c.replace(/<p class="muted" style="flex:none;margin:6px 0 0">[\s\S]*?<\/p>/,'<p class="muted" style="flex:none;margin:6px 0 0">Salary income tax calculator plus a 25-employee payroll sheet for tax years 2025-26 and 2026-27. Slabs are editable, with a how-to sheet. Estimate only, not tax advice.</p>');
c=c.replace(/\$14\.99/g,'$9.99').replace(/%2414\.99/g,'%249.99').replace(/Rs 3,999/g,'Rs 2,499').replace(/Rs%203%2C999/g,'Rs%202%2C499');
c=c.replace(/alt="[^"]*"/,'alt="Pakistan Salary Tax Pack: product preview"');
h=h.replace(m[0],c+m[0]); fs.writeFileSync(f,h,'utf8'); console.log('card added; price check:', (c.match(/\$9\.99/g)||[]).length);

