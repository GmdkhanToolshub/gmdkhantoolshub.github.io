// Original 3x3 matrix-reasoning puzzle generator (our own design; no third-party questions or artwork).
// A puzzle is a 3x3 grid of cells. Each cell has 5 attributes with 3 values: shape, count, fill, size, marker. Every attribute follows one rule across the grid:
//   const    the same value everywhere
//   rowconst one value per row (differs between rows)
//   prog     each row steps through the three values in order (cyclic), rows start at different offsets
//   dist     each row uses all three values once (latin square)
// Easy puzzles use 1 changing attribute, harder ones use up to 4. The correct answer is cell(2,2). Every other option differs from it in at least one attribute,
// and since every attribute is fully determined by its rule, exactly one option is correct.
export function rng(seed) { let s = 2166136261; for (const ch of String(seed)) { s ^= ch.charCodeAt(0); s = Math.imul(s, 16777619); } return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const ATTRS = ['s', 'n', 'f', 'z', 'm'];
const pick = (r, a) => a[Math.floor(r() * a.length)];
const shuffle = (r, a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function cellFor(rules, r, c) {
  const cell = {};
  for (const a of ATTRS) {
    const k = rules[a]; let v;
    if (k.t === 'const') v = k.v; else if (k.t === 'rowconst') v = (k.v + r * k.d) % 3; else if (k.t === 'prog') v = (k.v + r * k.o + c * k.d) % 3; else v = k.p[(c + r) % 3];
    cell[a] = v;
  }
  return cell;
}
const key = c => ATTRS.map(a => c[a]).join('');
export function makePuzzle(r, level) {
  // level 1..4 = number of attributes that change (1 easy ... 4 hard)
  const changing = shuffle(r, ATTRS).slice(0, level), rules = {};
  for (const a of ATTRS) {
    if (!changing.includes(a)) { rules[a] = { t: 'const', v: Math.floor(r() * 3) }; continue; }
    const kinds = level === 1 ? ['prog', 'dist'] : ['prog', 'dist', 'dist', 'rowconst']; const t = pick(r, kinds);
    if (t === 'prog') rules[a] = { t, v: Math.floor(r() * 3), o: pick(r, [0, 1, 2]), d: pick(r, [1, 2]) };
    else if (t === 'dist') rules[a] = { t, p: shuffle(r, [0, 1, 2]) };
    else rules[a] = { t, v: Math.floor(r() * 3), d: pick(r, [1, 2]) };
  }
  const grid = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) grid.push(cellFor(rules, i, j));
  const answer = grid[8], used = new Set([key(answer)]), distract = [];
  let guard = 0;
  while (distract.length < 7 && guard++ < 500) {
    const d = { ...answer }, nChange = 1 + Math.floor(r() * 2); for (const a of shuffle(r, ATTRS).slice(0, nChange)) d[a] = (d[a] + 1 + Math.floor(r() * 2)) % 3;
    const k = key(d); if (!used.has(k)) { used.add(k); distract.push(d); }
  }
  return { grid: grid.slice(0, 8), answer, distract };
}
// Same puzzle structure can repeat across levels for a given seed; require every puzzle in a bank to be unique by its first 8 cells.
export function makeBank(seed, spec) {
  // spec: array of levels, e.g. [1,1,1,2,2,...]
  const r = rng(seed), seen = new Set(), questions = [], keys = [];
  for (const level of spec) {
    let p, sig, tries = 0;
    do { p = makePuzzle(r, level); sig = p.grid.map(key).join('|'); } while ((seen.has(sig) || !isUnambiguous(p.grid, p.answer)) && tries++ < 2000);
    seen.add(sig);
    const opts = shuffle(r, [p.answer, ...p.distract]); const correct = opts.findIndex(o => key(o) === key(p.answer));
    questions.push({ level, grid: p.grid, options: opts }); keys.push(correct);
  }
  return { questions, keys };
}
export const LEVEL_SPEC_PRACTICE = [1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4];
export const LEVEL_SPEC_CERTIFIED = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];

// Independent check that the visible 8 cells determine the missing cell: enumerate every rule hypothesis (const, rowconst, prog, dist) per attribute that fits the 8 known cells
// and require that they all predict the same value for cell (2,2). Puzzles that fail are regenerated.
export function predictions(grid8) {
  const out = {};
  for (const a of ATTRS) {
    const val = (r, c) => grid8[r * 3 + c][a], preds = new Set();
    const fits = f => { for (let i = 0; i < 8; i++) if (f(Math.floor(i / 3), i % 3) !== grid8[i][a]) return false; return true; };
    for (let v = 0; v < 3; v++) if (fits(() => v)) preds.add(v);
    for (let v = 0; v < 3; v++) for (const d of [1, 2]) if (fits(r => (v + r * d) % 3)) preds.add((v + 2 * d) % 3);
    for (let v = 0; v < 3; v++) for (let o = 0; o < 3; o++) for (const d of [1, 2]) if (fits((r, c) => (v + r * o + c * d) % 3)) preds.add((v + 2 * o + 2 * d) % 3);
    for (const p of [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]) if (fits((r, c) => p[(c + r) % 3])) preds.add(p[(2 + 2) % 3]);
    out[a] = [...preds];
  }
  return out;
}
export const isUnambiguous = (grid8, answer) => { const p = predictions(grid8); return ATTRS.every(a => p[a].length === 1 && p[a][0] === answer[a]); };
