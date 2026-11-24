// Builds the question banks for the Reasoning Test.
//  - Practice bank (public, answers included, 20 questions): data/reasoning-practice.json
//  - Certified bank (public questions only, 30 questions): data/reasoning-certified.json
//  - Certified answer key (PRIVATE, git-ignored): backend/private/reasoning-key.json and reasoning-key.sql  (import into D1, see backend/README.md)
// The certified seed is secret: it is read from env REASONING_SEED or backend/private/reasoning-seed.txt (created at random on first run).
// WARNING: do not regenerate the certified bank after certificates are sold; the questions and key must stay in step.
import fs from 'fs'; import crypto from 'crypto';
import { makeBank, LEVEL_SPEC_PRACTICE, LEVEL_SPEC_CERTIFIED } from './reasoning-gen.mjs';
const root = 'D:/GM_Claude/'; const cell = c => [c.s, c.n, c.f, c.z, c.m];
fs.mkdirSync(root + 'data', { recursive: true }); fs.mkdirSync(root + 'backend/private', { recursive: true });
const pb = makeBank('gm-practice-v1', LEVEL_SPEC_PRACTICE);
fs.writeFileSync(root + 'data/reasoning-practice.json', JSON.stringify({ version: 1, kind: 'practice', questions: pb.questions.map((q, i) => ({ id: 'p' + (i + 1), level: q.level, grid: q.grid.map(cell), options: q.options.map(cell), answer: pb.keys[i] })) }));
let seed = process.env.REASONING_SEED; const sf = root + 'backend/private/reasoning-seed.txt';
if (!seed) { if (fs.existsSync(sf)) seed = fs.readFileSync(sf, 'utf8').trim(); else { seed = crypto.randomBytes(24).toString('hex'); fs.writeFileSync(sf, seed); console.log('created a new private seed in backend/private/reasoning-seed.txt (keep a backup, never commit it)'); } }
const cb = makeBank(seed, LEVEL_SPEC_CERTIFIED);
const qs = cb.questions.map((q, i) => ({ id: 'c' + (i + 1), level: q.level, grid: q.grid.map(cell), options: q.options.map(cell) }));
fs.writeFileSync(root + 'data/reasoning-certified.json', JSON.stringify({ version: 1, kind: 'certified', questions: qs }));
fs.writeFileSync(root + 'backend/private/reasoning-key.json', JSON.stringify(Object.fromEntries(qs.map((q, i) => [q.id, { level: q.level, correct: cb.keys[i] }]))));
fs.writeFileSync(root + 'backend/private/reasoning-key.sql', 'INSERT OR REPLACE INTO quiz_keys(qid,level,correct) VALUES\n' + qs.map((q, i) => `('${q.id}',${q.level},${cb.keys[i]})`).join(',\n') + ';\n');
console.log('practice:', pb.questions.length, 'questions | certified:', qs.length, 'questions | key written to backend/private (git-ignored)');
