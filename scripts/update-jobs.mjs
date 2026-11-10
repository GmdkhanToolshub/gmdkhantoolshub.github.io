// GM live jobs updater. Fetches vacancies from permitted public APIs and optional keyed APIs, removes expired and
// stale items, checks links, removes duplicates and writes data/jobs.json. No scraping. No invented data.
// Run: node scripts/update-jobs.mjs           (GitHub Actions runs this on a schedule)
// Optional keys (GitHub repository secrets): JOOBLE_KEY, ADZUNA_ID + ADZUNA_KEY
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const OUT = new URL('../data/jobs.json', import.meta.url);
const UA = 'GM-Jobs-Updater/1.0 (+https://gmdkhantoolshub.github.io/jobs/)';
const NOW = Date.now(), DAY = 864e5;
const MAX_AGE_DAYS = 30;            // a vacancy with no published closing date is shown for at most 30 days after publication
const CAPS = { intl: 90, pk: 60, pkr: 30 };
const sources = [];
const log = (...a) => console.log(...a);
const clean = s => String(s == null ? '' : s).replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const iso = x => { const t = typeof x === 'number' ? x : /[A-Za-z]{3},|GMT|UTC/.test(String(x)) || /[zZ]|[+-]\d\d:?\d\d$/.test(String(x)) ? x : String(x).replace(' ', 'T') + 'Z'; const d = new Date(t); return isNaN(d) ? null : d.toISOString(); };
async function get(url, opts = {}, tries = 2) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url, { ...opts, headers: { 'user-agent': UA, accept: 'application/json', ...(opts.headers || {}) }, signal: AbortSignal.timeout(30000) }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); }
    catch (e) { if (i === tries - 1) throw e; await new Promise(r => setTimeout(r, 1500)); }
  }
}
const COUNTRY_BY_CITY = { london: 'United Kingdom', manchester: 'United Kingdom', edinburgh: 'United Kingdom', birmingham: 'United Kingdom', glasgow: 'United Kingdom', bristol: 'United Kingdom', leeds: 'United Kingdom', cambridge: 'United Kingdom', oxford: 'United Kingdom', paris: 'France', lyon: 'France', berlin: 'Germany', munich: 'Germany', 'münchen': 'Germany', hamburg: 'Germany', frankfurt: 'Germany', cologne: 'Germany', 'köln': 'Germany', stuttgart: 'Germany', 'düsseldorf': 'Germany', dusseldorf: 'Germany', dresden: 'Germany', leipzig: 'Germany', hannover: 'Germany', nuremberg: 'Germany', 'nürnberg': 'Germany', bremen: 'Germany', essen: 'Germany', dortmund: 'Germany', zurich: 'Switzerland', 'zürich': 'Switzerland', geneva: 'Switzerland', basel: 'Switzerland', amsterdam: 'Netherlands', rotterdam: 'Netherlands', utrecht: 'Netherlands', eindhoven: 'Netherlands', vienna: 'Austria', wien: 'Austria', dublin: 'Ireland', madrid: 'Spain', barcelona: 'Spain', lisbon: 'Portugal', rome: 'Italy', milan: 'Italy', stockholm: 'Sweden', copenhagen: 'Denmark', oslo: 'Norway', helsinki: 'Finland', warsaw: 'Poland', prague: 'Czechia', brussels: 'Belgium', dubai: 'United Arab Emirates', 'abu dhabi': 'United Arab Emirates', riyadh: 'Saudi Arabia', jeddah: 'Saudi Arabia', doha: 'Qatar', muscat: 'Oman', manama: 'Bahrain', 'kuwait city': 'Kuwait', toronto: 'Canada', vancouver: 'Canada', montreal: 'Canada', sydney: 'Australia', melbourne: 'Australia', brisbane: 'Australia', 'new york': 'United States', 'san francisco': 'United States', 'los angeles': 'United States', chicago: 'United States', austin: 'United States', seattle: 'United States', boston: 'United States', singapore: 'Singapore', karachi: 'Pakistan', lahore: 'Pakistan', islamabad: 'Pakistan', rawalpindi: 'Pakistan', faisalabad: 'Pakistan', multan: 'Pakistan', peshawar: 'Pakistan', quetta: 'Pakistan', hyderabad: 'Pakistan', sialkot: 'Pakistan', gujranwala: 'Pakistan' };
const COUNTRIES = ['United Kingdom', 'UK', 'Germany', 'France', 'Switzerland', 'Netherlands', 'Austria', 'Ireland', 'Spain', 'Portugal', 'Italy', 'Sweden', 'Denmark', 'Norway', 'Finland', 'Poland', 'Czechia', 'Belgium', 'United Arab Emirates', 'UAE', 'Saudi Arabia', 'Qatar', 'Oman', 'Bahrain', 'Kuwait', 'Canada', 'Australia', 'United States', 'USA', 'Singapore', 'Pakistan', 'New Zealand', 'Malaysia'];
const NORM = { UK: 'United Kingdom', UAE: 'United Arab Emirates', USA: 'United States' };
function place(text) {
  const t = clean(text), low = t.toLowerCase(); let country = null, city = null;
  for (const c of COUNTRIES) if (new RegExp('(^|[ ,(])' + c.replace(/\s/g, '\\s') + '($|[ ,)])', 'i').test(t)) { country = NORM[c] || c; break; }
  const first = low.split(/[,(/]/)[0].trim(); if (COUNTRY_BY_CITY[first]) { city = t.split(/[,(/]/)[0].trim(); country = country || COUNTRY_BY_CITY[first]; }
  else if (country && t.includes(',')) city = t.split(',')[0].trim();
  return { country, city, remote: /remote|anywhere|worldwide/i.test(t) };
}
const TYPES = { full_time: 'Full time', 'full-time': 'Full time', 'full time': 'Full time', fulltime: 'Full time', part_time: 'Part time', 'part-time': 'Part time', contract: 'Contract', freelance: 'Freelance', internship: 'Internship', temporary: 'Temporary', permanent: 'Permanent', seasonal: 'Seasonal' };
const type = x => { const k = String(Array.isArray(x) ? x[0] || '' : x || '').toLowerCase().trim().replace(/\s+/g, ' '); return TYPES[k] || (k ? k.replace(/(^|\s)\w/g, m => m.toUpperCase()) : null); };
const J = o => ({ id: '', t: '', c: '', l: null, co: null, ci: null, loc: '', ty: null, p: null, d: null, s: null, v: 'unspecified', u: '', src: '', remote: false, pkok: false, ...o });
const all = [];

// ---------- source: Arbeitnow (free public API; link back required) ----------
async function arbeitnow() {
  const s = { id: 'arbeitnow', name: 'Arbeitnow', url: 'https://www.arbeitnow.com/', ok: false, count: 0 }; sources.push(s);
  try {
    const [list, visa] = await Promise.all([get('https://www.arbeitnow.com/api/job-board-api'), get('https://www.arbeitnow.com/api/job-board-api?visa_sponsorship=true').catch(() => ({ data: [] }))]);
    const vset = new Set((visa.data || []).map(j => j.slug));
    for (const j of list.data || []) {
      const pl = place(j.location || ''), rem = !!j.remote || pl.remote;
      all.push(J({ id: 'an-' + j.slug, t: clean(j.title), c: clean(j.company_name), co: pl.country, ci: pl.city, loc: clean(j.location) || (rem ? 'Remote' : ''), ty: type(j.job_types), p: iso(j.created_at * 1000), v: vset.has(j.slug) ? 'yes' : 'unspecified', u: j.url, src: 'arbeitnow', remote: rem }));
    }
    s.ok = true; s.count = (list.data || []).length;
  } catch (e) { s.error = String(e.message || e); log('arbeitnow failed', s.error); }
}
// ---------- source: Remotive (free public API; credit and link back required; max 4 calls a day) ----------
async function remotive() {
  const s = { id: 'remotive', name: 'Remotive', url: 'https://remotive.com/', ok: false, count: 0 }; sources.push(s);
  try {
    const d = await get('https://remotive.com/api/remote-jobs');
    for (const j of d.jobs || []) {
      const loc = clean(j.candidate_required_location || 'Remote'), pl = place(loc), ww = /worldwide|anywhere/i.test(loc);
      all.push(J({ id: 'rm-' + j.id, t: clean(j.title), c: clean(j.company_name), l: j.company_logo_url || j.company_logo || null, co: pl.country, loc: 'Remote · ' + loc, ty: type(j.job_type), p: iso(j.publication_date), s: clean(j.salary).slice(0, 60) || null, u: j.url, src: 'remotive', remote: true, pkok: ww || /pakistan/i.test(loc) }));
    }
    s.ok = true; s.count = (d.jobs || []).length;
  } catch (e) { s.error = String(e.message || e); log('remotive failed', s.error); }
}
// ---------- source: Jobicy (free public API; credit and direct link required) ----------
async function jobicy() {
  const s = { id: 'jobicy', name: 'Jobicy', url: 'https://jobicy.com/', ok: false, count: 0 }; sources.push(s);
  const GEOS = [['anywhere', null], ['united-arab-emirates', 'United Arab Emirates'], ['uk', 'United Kingdom'], ['usa', 'United States'], ['canada', 'Canada'], ['australia', 'Australia'], ['europe', null], ['apac', null]];
  try {
    const seen = new Set(); let n = 0, okc = 0;
    for (const [slug, cname] of GEOS) {
      try {
        const d = await get('https://jobicy.com/api/v2/remote-jobs?count=25&geo=' + slug); okc++;
        for (const j of d.jobs || []) {
          if (seen.has(j.id)) continue; seen.add(j.id); n++;
          const geo = clean(j.jobGeo), parts = geo.split(',').map(x => x.trim()).filter(Boolean), single = parts.length === 1, anyw = /anywhere|worldwide/i.test(geo);
          const pl = single ? place(geo) : { country: null };
          const sal = j.salaryMin && j.salaryMax ? (j.salaryCurrency || '') + ' ' + Number(j.salaryMin).toLocaleString('en-US') + ' to ' + Number(j.salaryMax).toLocaleString('en-US') + (j.salaryPeriod ? ' per ' + ({ yearly: 'year', monthly: 'month', weekly: 'week', daily: 'day', hourly: 'hour' }[String(j.salaryPeriod).toLowerCase()] || String(j.salaryPeriod).toLowerCase()) : '') : (j.annualSalaryMin && j.annualSalaryMax ? (j.salaryCurrency || '') + ' ' + Number(j.annualSalaryMin).toLocaleString('en-US') + ' to ' + Number(j.annualSalaryMax).toLocaleString('en-US') + ' per year' : null);
          all.push(J({ id: 'jb-' + j.id, t: clean(j.jobTitle), c: clean(j.companyName), l: j.companyLogo || null, co: pl.country || (single && cname && NORM[geo] === cname ? cname : null) || (single && /^uae$/i.test(geo) ? 'United Arab Emirates' : null), loc: 'Remote · ' + (single ? geo : parts.length > 4 ? 'Many countries' : geo), ty: type(j.jobType), p: iso(j.pubDate), s: sal ? sal.trim() : null, u: j.url, src: 'jobicy', remote: true, pkok: anyw || /pakistan/i.test(geo) }));
        }
      } catch (e) { log('jobicy', slug, 'failed', e.message); }
      await new Promise(r => setTimeout(r, 600));
    }
    s.ok = okc > 0; s.count = n; if (!okc) s.error = 'all requests failed';
  } catch (e) { s.error = String(e.message || e); }
}
// ---------- optional: Jooble (needs JOOBLE_KEY: free key from jooble.org/api/about) ----------
// The default key only serves the main jooble.org database. Pakistan and most Gulf countries return little or nothing unless Jooble
// enables regional access for the key, so every result is kept only if its location really is in the country we asked for.
// The free key allows about 500 requests in total, so Jooble is queried at most once every 20 hours and earlier results are carried forward.
async function jooble(prev) {
  const key = process.env.JOOBLE_KEY, s = { id: 'jooble', name: 'Jooble', url: 'https://jooble.org/', ok: false, count: 0, configured: !!key }; sources.push(s);
  if (!key) { s.error = 'not configured (no API key)'; return; }
  const last = prev && prev.joobleAt ? Date.parse(prev.joobleAt) : 0;
  if (NOW - last < 20 * 3600e3 && prev) { const old = [...(prev.pk || []), ...(prev.pkr || []), ...(prev.intl || [])].filter(j => j.src === 'jooble'); old.forEach(j => all.push(J(j))); s.ok = true; s.count = old.length; s.note = 'carried forward (queried at most once every 20 hours)'; joobleAt = prev.joobleAt; return; }
  const LOCS = [['Karachi, Pakistan', /pakistan/i], ['Lahore, Pakistan', /pakistan/i], ['Islamabad, Pakistan', /pakistan/i], ['Dubai, United Arab Emirates', /emirates|uae|dubai/i], ['Abu Dhabi, United Arab Emirates', /emirates|uae|abu dhabi/i], ['Riyadh, Saudi Arabia', /saudi/i], ['Jeddah, Saudi Arabia', /saudi/i], ['Doha, Qatar', /qatar/i], ['Muscat, Oman', /oman/i], ['Manama, Bahrain', /bahrain/i], ['Kuwait City, Kuwait', /kuwait/i]];
  let okc = 0, n = 0;
  for (const [loc, want] of LOCS) {
    try {
      const d = await get('https://jooble.org/api/' + encodeURIComponent(key), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ keywords: '', location: loc, page: 1 }) }); okc++;
      for (const j of (d.jobs || []).slice(0, 25)) {
        if (!want.test(String(j.location || ''))) continue;
        const pl = place(j.location || loc); n++;
        all.push(J({ id: 'jo-' + j.id, t: clean(j.title), c: clean(j.company), co: pl.country, ci: pl.city, loc: clean(j.location), ty: type(j.type), p: iso(j.updated), s: clean(j.salary).slice(0, 60) || null, u: j.link, src: 'jooble' }));
      }
    } catch (e) { log('jooble', loc, 'failed', e.message); }
    await new Promise(r => setTimeout(r, 400));
  }
  s.ok = okc > 0; s.count = n; if (!okc) s.error = 'all requests failed'; else joobleAt = new Date().toISOString();
}
// ---------- optional: Careerjet (best fit for Pakistan: it runs a Pakistan market). Needs CAREERJET_KEY from a free Careerjet publisher account ----------
// API v4: GET https://search.api.careerjet.net/v4/query with HTTP Basic auth (API key as user name, empty password) and the required
// user_ip and user_agent parameters. CAREERJET_URL can point to a test server. Results are kept only for Pakistan (locale en_PK).
async function careerjet() {
  const key = process.env.CAREERJET_KEY, s = { id: 'careerjet', name: 'Careerjet', url: 'https://www.careerjet.com.pk/', ok: false, count: 0, configured: !!key }; sources.push(s);
  if (!key) { s.error = 'not configured (no API key)'; return; }
  const base = process.env.CAREERJET_URL || 'https://search.api.careerjet.net/v4/query';
  let ip = process.env.CAREERJET_USER_IP; if (!ip) { try { ip = (await get('https://api.ipify.org?format=json', {}, 1)).ip; } catch (e) { ip = '127.0.0.1'; } }
  const CITIES = ['Pakistan', 'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Hyderabad', 'Sialkot', 'Gujranwala'];
  const auth = 'Basic ' + Buffer.from(key + ':').toString('base64'); let okc = 0, n = 0;
  for (const city of CITIES) {
    try {
      const q = new URLSearchParams({ locale_code: 'en_PK', location: city === 'Pakistan' ? 'Pakistan' : city + ', Pakistan', sort: 'date', page_size: '40', page: '1', user_ip: ip, user_agent: UA, keywords: '' });
      const d = await get(base + '?' + q.toString(), { headers: { authorization: auth } }); okc++;
      for (const j of d.jobs || []) {
        const loc = clean(j.locations || city), pl = place(loc + ', Pakistan'); if (!j.url || !j.title) continue; n++;
        const sal = j.salary ? clean(j.salary).slice(0, 60) : (j.salary_min && j.salary_max ? (j.salary_currency_code || '') + ' ' + Number(j.salary_min).toLocaleString('en-US') + ' to ' + Number(j.salary_max).toLocaleString('en-US') + (j.salary_type ? ' per ' + ({ Y: 'year', M: 'month', W: 'week', D: 'day', H: 'hour' }[j.salary_type] || String(j.salary_type).toLowerCase()) : '') : null);
        all.push(J({ id: 'cj-' + String(j.url).replace(/\W+/g, '').slice(-40), t: clean(j.title), c: clean(j.company), co: 'Pakistan', ci: pl.city || (city !== 'Pakistan' ? city : null), loc: loc, ty: type(j.contract_type || j.work_hours), p: iso(j.date), s: sal, u: j.url, src: 'careerjet' }));
      }
    } catch (e) { log('careerjet', city, 'failed', e.message); }
    await new Promise(r => setTimeout(r, 500));
  }
  s.ok = okc > 0; s.count = n; if (!okc) s.error = 'all requests failed';
}
// ---------- optional: Adzuna (needs ADZUNA_ID and ADZUNA_KEY). Covers UK, USA, Canada, Australia and Europe ----------
async function adzuna() {
  const id = process.env.ADZUNA_ID, key = process.env.ADZUNA_KEY, s = { id: 'adzuna', name: 'Adzuna', url: 'https://www.adzuna.com/', ok: false, count: 0, configured: !!(id && key) }; sources.push(s);
  if (!(id && key)) { s.error = 'not configured (no API key)'; return; }
  const CS = [['gb', 'United Kingdom'], ['us', 'United States'], ['ca', 'Canada'], ['au', 'Australia'], ['de', 'Germany'], ['fr', 'France'], ['nl', 'Netherlands'], ['sg', 'Singapore'], ['nz', 'New Zealand']]; let okc = 0, n = 0;
  for (const [c, name] of CS) {
    try {
      const d = await get(`https://api.adzuna.com/v1/api/jobs/${c}/search/1?app_id=${encodeURIComponent(id)}&app_key=${encodeURIComponent(key)}&results_per_page=30&sort_by=date&content-type=application/json`); okc++;
      for (const j of d.results || []) { n++; const real = String(j.salary_is_predicted) === '0' && j.salary_min && j.salary_max;
        all.push(J({ id: 'az-' + j.id, t: clean(j.title), c: clean(j.company && j.company.display_name), co: name, ci: (j.location && j.location.area && j.location.area[j.location.area.length - 1]) || null, loc: clean(j.location && j.location.display_name), ty: type(j.contract_time || j.contract_type), p: iso(j.created), s: real ? Math.round(j.salary_min).toLocaleString('en-US') + ' to ' + Math.round(j.salary_max).toLocaleString('en-US') : null, u: j.redirect_url, src: 'adzuna' })); }
    } catch (e) { log('adzuna', c, 'failed', e.message); }
    await new Promise(r => setTimeout(r, 400));
  }
  s.ok = okc > 0; s.count = n; if (!okc) s.error = 'all requests failed';
}

let prevData = null, joobleAt = null;
try { prevData = JSON.parse(await readFile(OUT, 'utf8')); } catch (e) { prevData = null; }
await Promise.all([arbeitnow(), remotive()]); await jobicy(); await jooble(prevData); await careerjet(); await adzuna();
log('raw', all.length);
// ---------- strict date filter, de-duplication, balancing ----------
const live = all.filter(j => j.t && j.c && j.u && /^https?:\/\//.test(j.u) && j.p && new Date(j.p).getTime() <= NOW + DAY && (j.d ? new Date(j.d).getTime() + DAY > NOW : NOW - new Date(j.p).getTime() <= MAX_AGE_DAYS * DAY));
const seenU = new Set(), seenK = new Set(); const uniq = [];
for (const j of live.sort((a, b) => (a.p < b.p ? 1 : -1))) { const k = (j.t + '|' + j.c + '|' + j.loc).toLowerCase().replace(/\W+/g, ''); if (seenU.has(j.u) || seenK.has(k)) continue; seenU.add(j.u); seenK.add(k); uniq.push(j); }
function pick(list, cap) { const per = {}, bySrc = {}; for (const j of list) (bySrc[j.src] = bySrc[j.src] || []).push(j); const out = []; let more = true; while (out.length < cap && more) { more = false; for (const k of Object.keys(bySrc)) { const j = bySrc[k].shift(); if (!j) continue; more = true; per[j.c] = (per[j.c] || 0) + 1; if (per[j.c] <= 2) out.push(j); if (out.length >= cap) break; } } return out.sort((a, b) => (a.p < b.p ? 1 : -1)); }
const pk = uniq.filter(j => j.co === 'Pakistan'), pkr = uniq.filter(j => j.co !== 'Pakistan' && j.pkok), intl = uniq.filter(j => j.co !== 'Pakistan' && !j.pkok);
// ---------- link validation (only for the jobs that will be shown) ----------
const picked = [...pick(pk, CAPS.pk), ...pick(pkr, CAPS.pkr), ...pick(intl, CAPS.intl)];
const dead = new Set(); let idx = 0;
async function check(j) { for (const m of ['HEAD', 'GET']) { try { const r = await fetch(j.u, { method: m, redirect: 'follow', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(9000) }); if (r.status === 404 || r.status === 410) { dead.add(j.id); return; } if (m === 'HEAD' && r.status === 405) continue; return; } catch (e) { if (m === 'GET') { dead.add(j.id); return; } } } }
await Promise.all(Array.from({ length: 8 }, async () => { while (idx < picked.length) await check(picked[idx++]); }));
log('removed after link check:', dead.size);
const fin = l => l.filter(j => !dead.has(j.id));
const out = { updated: new Date().toISOString(), joobleAt, maxAgeDays: MAX_AGE_DAYS, sources, pk: fin(pick(pk, CAPS.pk)), pkr: fin(pick(pkr, CAPS.pkr)), intl: fin(pick(intl, CAPS.intl)) };
const anyOk = sources.some(s => s.ok);
if (!anyOk) { console.error('No source responded. Keeping the previous file.'); process.exit(0); }
await mkdir(dirname(OUT.pathname.replace(/^\/([A-Za-z]:)/, '$1')), { recursive: true });
await writeFile(OUT, JSON.stringify(out));
log('written', JSON.stringify({ pk: out.pk.length, pkr: out.pkr.length, intl: out.intl.length, sources: sources.map(s => s.id + ':' + (s.ok ? s.count : 'x')) }));
