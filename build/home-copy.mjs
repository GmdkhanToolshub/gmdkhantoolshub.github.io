// Homepage copy pass: less repeated "free / no sign-up" wording, consistent tool count. Safe to re-run.
import fs from 'fs';
const f = 'D:/GM_Claude/index.html'; let h = fs.readFileSync(f, 'utf8'); const log = [];
function sub(re, to, label) { const n = (h.match(re) || []).length; h = h.replace(re, to); log.push((n ? 'ok   ' : 'MISS ') + label + (n > 1 ? ' x' + n : '')); }
// hero chips: keep two, drop the two that repeat the page title and stats
sub(/<li><svg[^>]*>(?:(?!<\/svg>)[\s\S])*<\/svg>No sign-up<\/li>/, '', 'hero chip: No sign-up');
sub(/<li><svg[^>]*>(?:(?!<\/svg>)[\s\S])*<\/svg>Free, no limits<\/li>/, '', 'hero chip: Free, no limits');
sub('Gold, land, electricity bills, cheque words, board marks and fuel cost, with no sign-up.', 'Gold, land, electricity bills, cheque words, board marks and fuel cost.', 'new tools line');
sub('Assistants, planners and studios that help you work, study and create. Free, and private by design.', 'Assistants, planners and studios that help you work, study and create, with your data kept in your browser.', 'productivity line');
sub('74 free tools and gadgets for work, documents and everyday life. No sign-up, and your inputs are processed in your browser.', 'Pick from 74 tools and gadgets for work, documents and everyday life. Your inputs are processed in your browser.', 'cta band line');
sub('<div class="stat"><b>59</b><span>Free tools built and maintained</span></div>', '<div class="stat"><b>74</b><span>Tools built and maintained</span></div>', 'author stat 59 -> 74');
// per-card "Free" tags: every tool is free, so the tag adds nothing and repeats 18 times
sub(/<span>Free<\/span><\/div><\/article>/g, '</div></article>', 'card "Free" tags');
// the "Free, with no limits" benefit repeats the hero; replace it with something specific
sub(/<h3>Free, with no limits<\/h3><p>[^<]*<\/p>/, '<h3>Method explained</h3><p>Each tool page explains how the answer is worked out and shows a worked example you can check.</p>', 'benefit card');
fs.writeFileSync(f, h, 'utf8'); console.log(log.join('\n'));
