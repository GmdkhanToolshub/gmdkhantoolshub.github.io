# -*- coding: utf-8 -*-
import os, re, json, html
os.chdir('D:/GM_Claude')
def rd(p): return open(p, encoding='utf-8', newline='').read()
def wr(p, t): open(p, 'w', encoding='utf-8', newline='').write(t)
SKIP = ('products', '.git', 'node_modules', 'scripts', 'build', 'embed')
pages = []
for d, ds, fs in os.walk('.'):
    ds[:] = [x for x in ds if x not in SKIP and not x.startswith('.')]
    for f in fs:
        if f.endswith('.html'): pages.append(os.path.join(d, f).replace('\\', '/')[2:])

def meta_desc(p):
    try: h = rd(p)
    except Exception: return ''
    m = re.search(r'<meta name="description" content="(.*?)"', h)
    return html.unescape(m.group(1)) if m else ''
def short(s, n=62):
    s = re.split(r'(?<=[.!?:;])\s', s)[0].rstrip('.')
    if len(s) <= n: return s
    s = s[:n].rsplit(' ', 1)[0]
    return s.rstrip(',;:-') + '…'

COLS = [
 ('AI &amp; assistants', [('Smart Assistant', 'assistant/'), ('AI &amp; Tech Briefing', 'tech-briefing/'), ('Creative Studio', 'creative-studio/'), ('Developer Playground', 'developer-playground/')]),
 ('Learn &amp; grow', [('Coding Academy', 'academy/'), ('Learn &amp; Grow', 'learn/'), ('Career Studio', 'career-studio/'), ('Professional Growth Hub', 'growth/'), ('Daily Inspiration', 'inspiration/'), ('Tasks &amp; Planner', 'workspace/planner/')]),
 ('Business &amp; resources', [('GM HCM', 'hcm/'), ('People &amp; Success Hub', 'people-success-hub/'), ('Blog &amp; Insights', 'blog/'), ('Free Excel templates', 'free-templates/'), ('Live jobs', 'jobs/'), ('Business solutions', 'solutions/')]),
]
DESC = {}
for col, items in COLS:
    for name, u in items:
        p = u + 'index.html'
        DESC[u] = short(meta_desc(p)) if os.path.exists(p) else ''
        if not os.path.exists(p): print('MISSING nav target', u)
DESC = {
 'assistant/': 'Describe what you need, find the right tool', 'tech-briefing/': 'Short explainers on AI, the web and online safety',
 'creative-studio/': 'QR codes, colours, image and writing helpers', 'developer-playground/': 'Write HTML, CSS and JavaScript, see it run',
 'academy/': 'Beginner lessons in HTML, CSS and JavaScript', 'learn/': 'English, quizzes and computer basics',
 'career-studio/': 'CV builder, ATS check and interview practice', 'growth/': 'Career, communication and leadership tips',
 'inspiration/': 'A thought and a productivity tip each day', 'workspace/planner/': 'Task manager and daily time-block planner',
 'hcm/': 'HR software for records and attendance', 'people-success-hub/': 'A moderated community for career stories',
 'blog/': 'Sales operations, money and career guides', 'free-templates/': 'Free Excel templates, no sign-up',
 'jobs/': 'Live vacancies in Pakistan and worldwide', 'solutions/': 'Excel dashboards, KPI and sales reporting',
}
json.dump(DESC, open(os.environ['TEMP'] + '/nav_desc.json', 'w'), ensure_ascii=False, indent=1)

TOOLS_SEG = {'tools', 'convert', 'salary-tax', 'loan-emi', 'electricity', 'free-tools'}
AI_SEG = {'learn', 'academy', 'assistant', 'career-studio', 'creative-studio', 'developer-playground', 'workspace', 'tech-briefing', 'people-success-hub', 'hcm', 'inspiration', 'growth', 'solutions', 'blog', 'free-templates', 'jobs'}
def section_of(rel):
    seg = rel.split('/')[0]
    if rel == 'index.html': return 'home'
    if seg in TOOLS_SEG: return 'tools'
    if seg == 'kids': return 'kids'
    if seg == 'portfolio': return 'portfolio'
    if seg == 'about': return 'about'
    if seg == 'contact': return 'contact'
    if seg in AI_SEG: return 'ai'
    return ''
CHEV = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg>'
SEARCH = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'

def build_header(pre, sec, rel, brand_svg, theme_btn, pal_btn, menu_btn):
    cur = lambda s: ' aria-current="page"' if sec == s else ''
    def link(label, href, s): return '<li><a class="nav-link" href="%s%s"%s>%s</a></li>' % (pre, href, cur(s), label)
    cols = ''
    for title, items in COLS:
        cols += '<div class="nm-col"><p class="nm-h">%s</p>%s</div>' % (title, ''.join('<a class="nm-link" href="%s%s"%s><b>%s</b><span>%s</span></a>' % (pre, u, ' aria-current="page"' if rel.startswith(u) else '', n, html.escape(DESC.get(u, ''), quote=False)) for n, u in items))
    ai = ('<li class="has-menu"><button class="nav-link nav-drop%s" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="nav-menu-ai">AI &amp; Productivity %s</button>'
          '<div class="nav-menu" id="nav-menu-ai" role="group" aria-label="AI &amp; Productivity">%s</div></li>') % (' is-current' if sec == 'ai' else '', CHEV, cols)
    nav = (link('Home', '', 'home') + link('Free Tools &amp; Gadgets', 'tools/', 'tools') + ai + link('Kids Corner', 'kids/', 'kids') +
           link('<span class="nm-long">Project Manager&nbsp;</span>Portfolio', 'portfolio/', 'portfolio') + link('About', 'about/', 'about') + link('Contact', 'contact/', 'contact'))
    return ('<header class="site-header"><div class="container nav">\n'
            '<a class="brand" href="%(pre)s" aria-label="GM Tools Hub – home"><span class="brand-mark" aria-hidden="true">%(svg)s</span><span class="brand-name">GM <b>Tools Hub</b></span></a>\n'
            '<nav aria-label="Main"><ul class="nav-links" id="nav-links">%(nav)s</ul></nav>\n'
            '<div class="nav-actions"><button class="nav-search" id="gx-search-btn" type="button" aria-haspopup="dialog" aria-expanded="false" aria-label="Search tools, guides and pages">%(search)s<span class="ns-text">Search</span><kbd>Ctrl K</kbd></button>%(theme)s%(pal)s<a class="btn btn-primary btn-sm nav-cta" href="%(pre)sservices/">Hire me</a>\n%(menu)s</div>\n'
            '</div></header>') % dict(pre=pre, svg=brand_svg, nav=nav, search=SEARCH, theme=theme_btn, pal=pal_btn, menu=menu_btn)

OLD_THEME = "if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);"
NEW_THEME = "if(t!=='light'&&t!=='dark')t=window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t);"
stats = dict(header=0, skipped=0, brand=0, theme=0, css=0, meta=0)
skipped = []
for rel in pages:
    h = rd(rel); o = h
    if '<header class="site-header">' not in h: stats['skipped'] += 1; skipped.append(rel); continue
    hs = h.index('<header class="site-header">'); he = h.index('</header>', hs) + 9; old = h[hs:he]
    if 'Free Tools &amp; Gadgets' not in old and 'nav-search' not in old:
        stats['skipped'] += 1; skipped.append(rel + ' (other nav)'); continue
    if True:
        pre = re.search(r'class="brand" href="([^"]*)"', old).group(1)
        svg = re.search(r'<svg class="gm-logo".*?</svg>', old, re.S).group(0)
        tb = re.search(r'<button class="icon-btn" id="theme-toggle".*?</button>', old, re.S).group(0)
        pb = re.search(r'<button class="icon-btn" id="palette-btn".*?</button>', old, re.S).group(0)
        mb = re.search(r'<button class="icon-btn menu-toggle".*?</button>', old, re.S).group(0)
        h = h[:hs] + build_header(pre, section_of(rel), rel, svg, tb, pb, mb) + h[he:]; stats['header'] += 1
    # brand wordmark in every remaining brand link (footer)
    h2 = re.sub(r'(<a class="brand" href="[^"]*") aria-label="GM – home">(<span class="brand-mark" aria-hidden="true">.*?</span>)<span class="sr-only">GM</span></a>', r'\1 aria-label="GM Tools Hub – home">\2<span class="brand-name">GM <b>Tools Hub</b></span></a>', h, flags=re.S)
    if h2 != h: stats['brand'] += 1; h = h2
    if OLD_THEME in h: h = h.replace(OLD_THEME, NEW_THEME); stats['theme'] += 1
    if 'premium.css' not in h:
        m = list(re.finditer(r'<link rel="stylesheet" href="((?:\./|\.\./)*)assets/css/[^"]*">', h))
        if m:
            last = m[-1]; pre2 = re.search(r'href="((?:\./|\.\./)*)assets', last.group(0)).group(1)
            h = h[:last.end()] + '\n<link rel="stylesheet" href="%sassets/css/premium.css?v=00000000">' % pre2 + h[last.end():]; stats['css'] += 1
    if 'name="color-scheme"' not in h and '<meta name="viewport"' in h:
        h = re.sub(r'(<meta name="viewport"[^>]*>)', r'\1\n<meta name="color-scheme" content="light dark">', h, count=1); stats['meta'] += 1
    if h != o: wr(rel, h)
print(stats); print('skipped:', skipped[:25])
