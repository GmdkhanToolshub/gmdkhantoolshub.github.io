# -*- coding: utf-8 -*-
"""Animated vector artwork (stacked bars and coins) for the gold and silver rate pages.
Pure SVG + CSS animation, so it works inside an <img> tag with no JavaScript, and it stops
moving for visitors who prefer reduced motion. Run: python build/gen-rate-art.py"""
import os, random
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'img')
PAL = {
 'gold': dict(bg1='#FFF8E6', bg2='#F3DFA8', bg3='#E3BE62', glow='#FFE9A8', top=('#FFF3C4', '#F6CE55'), front=('#FBDD73', '#E9B93A', '#BF8A1B'), side=('#C9962A', '#8E6314'), edge='#FFF7D1', coin=('#FBE08A', '#D8A62E'), coinedge='#A87A1A', floor='#E8D49A', spark='#FFFFFF', dust='#FFF2B8'),
 'silver': dict(bg1='#F8FAFD', bg2='#D3DBE7', bg3='#A5B2C4', glow='#FFFFFF', top=('#FFFFFF', '#E7ECF2'), front=('#F4F7FB', '#BFC9D6', '#7E8B9C'), side=('#8794A5', '#48525F'), edge='#FFFFFF', coin=('#F4F7FB', '#B7C1CE'), coinedge='#7C8898', floor='#D4DCE6', spark='#FFFFFF', dust='#FFFFFF'),
}
CLIP = []  # polygon point strings of every bar face, used to clip the moving light sweep

def bar(P, x, y, W, H, dx=44, dy=22, inset=24):
    t = lambda *p: ' '.join('%.1f,%.1f' % q for q in p)
    top = t((x + inset, y), (x + W - inset, y), (x + W - inset + dx, y - dy), (x + inset + dx, y - dy))
    front = t((x, y + H), (x + W, y + H), (x + W - inset, y), (x + inset, y))
    side = t((x + W, y + H), (x + W + dx, y + H - dy), (x + W - inset + dx, y - dy), (x + W - inset, y))
    CLIP.extend([top, front, side])
    s = '<g>'
    s += '<polygon points="%s" fill="url(#side)"/>' % side
    s += '<polygon points="%s" fill="url(#front)"/>' % front
    s += '<polygon points="%s" fill="url(#top)"/>' % top
    px, py, pw, ph = x + W * 0.2, y + H * 0.2, W * 0.6, H * 0.5
    s += '<polygon points="%s" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="1.6"/>' % t((px, py + ph), (px + pw, py + ph), (px + pw - 9, py), (px + 9, py))
    s += '<polygon class="shine" points="%s" fill="url(#shine)" opacity=".85"/>' % t((x + inset - 2, y + 2), (x + inset + 46, y + 2), (x + 24, y + H - 3), (x + 4, y + H - 3))
    s += '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>' % (x + inset + 6, y + 1.5, x + W - inset - 6, y + 1.5, P['edge'])
    s += '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="rgba(0,0,0,.22)" stroke-width="2"/>' % (x + 2, y + H - 1, x + W - 2, y + H - 1)
    return s + '</g>'

def coin(P, cx, cy, rx=108, ry=34, th=18, cls='bob'):
    s = '<g class="%s">' % cls
    s += '<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="%s"/>' % (cx, cy + th, rx, ry, P['coinedge'])
    s += '<rect x="%d" y="%d" width="%d" height="%d" fill="url(#coinside)"/>' % (cx - rx, cy, rx * 2, th)
    s += '<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="url(#coinside)"/>' % (cx, cy + th, rx, ry)
    s += '<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="url(#cointop)"/>' % (cx, cy, rx, ry)
    s += '<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2.4"/>' % (cx, cy, rx - 12, ry - 4)
    s += '<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="none" stroke="rgba(0,0,0,.14)" stroke-width="1.6"/>' % (cx, cy, rx - 34, ry - 11)
    s += '<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="url(#shine2)" opacity=".55"/>' % (cx - 18, cy - 7, rx * 0.5, ry * 0.32)
    return s + '</g>'

STYLE = '''<style>
.float{animation:fl 7s ease-in-out infinite alternate}
.bob{animation:bb 5.5s ease-in-out infinite alternate}.bob2{animation:bb 6.4s ease-in-out -2s infinite alternate}.bob3{animation:bb 4.8s ease-in-out -1s infinite alternate}
.glow{transform-box:fill-box;transform-origin:center;animation:gl 5.5s ease-in-out infinite alternate}
.sweep{animation:sw 6.5s cubic-bezier(.45,.05,.3,1) infinite}
.shine{animation:sh 4.2s ease-in-out infinite alternate}
.tw{transform-box:fill-box;transform-origin:center;animation:tw 3s ease-in-out infinite}
.dust{animation:du 9s linear infinite;opacity:0}
@keyframes fl{from{transform:translateY(0)}to{transform:translateY(-9px)}}
@keyframes bb{from{transform:translateY(0)}to{transform:translateY(-6px)}}
@keyframes gl{from{opacity:.75;transform:scale(.96)}to{opacity:1;transform:scale(1.05)}}
@keyframes sw{0%{transform:translateX(-420px)}55%,100%{transform:translateX(1500px)}}
@keyframes sh{from{opacity:.45}to{opacity:.95}}
@keyframes tw{0%,100%{opacity:.15;transform:scale(.55) rotate(0)}50%{opacity:1;transform:scale(1.7) rotate(25deg)}}
@keyframes du{0%{opacity:0;transform:translateY(40px)}12%{opacity:.9}85%{opacity:.5}100%{opacity:0;transform:translateY(-360px)}}
@media (prefers-reduced-motion:reduce){.float,.bob,.bob2,.bob3,.glow,.sweep,.shine,.tw,.dust{animation:none}.dust{opacity:0}.sweep{opacity:0}}
</style>'''

def make(kind):
    P = PAL[kind]; W_, H_ = 1024, 1280
    CLIP.clear()
    rnd = random.Random(7 if kind == 'gold' else 11)
    defs = ('<defs>'
        '<radialGradient id="bg" cx="50%%" cy="38%%" r="85%%"><stop offset="0" stop-color="%(bg1)s"/><stop offset=".55" stop-color="%(bg2)s"/><stop offset="1" stop-color="%(bg3)s"/></radialGradient>'
        '<radialGradient id="glow" cx="50%%" cy="40%%" r="50%%"><stop offset="0" stop-color="%(glow)s" stop-opacity=".95"/><stop offset="1" stop-color="%(glow)s" stop-opacity="0"/></radialGradient>'
        '<linearGradient id="top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="%(t0)s"/><stop offset="1" stop-color="%(t1)s"/></linearGradient>'
        '<linearGradient id="front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="%(f0)s"/><stop offset=".45" stop-color="%(f1)s"/><stop offset="1" stop-color="%(f2)s"/></linearGradient>'
        '<linearGradient id="side" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="%(s0)s"/><stop offset="1" stop-color="%(s1)s"/></linearGradient>'
        '<linearGradient id="shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
        '<linearGradient id="swg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
        '<linearGradient id="cointop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="%(c0)s"/><stop offset="1" stop-color="%(c1)s"/></linearGradient>'
        '<linearGradient id="coinside" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="%(c1)s"/><stop offset=".5" stop-color="%(c0)s"/><stop offset="1" stop-color="%(ce)s"/></linearGradient>'
        '<radialGradient id="shine2"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'
        '<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>'
        '<mask id="rm"><rect x="0" y="940" width="1024" height="340" fill="url(#fade)"/></mask>'
        '<filter id="soft" x="-20%%" y="-20%%" width="140%%" height="140%%"><feGaussianBlur stdDeviation="16"/></filter>'
        '<filter id="blur2"><feGaussianBlur stdDeviation="2.2"/></filter>'
        '%(clip)s'
        '</defs>')
    scene = ''
    Wb, Hb, gap = 214, 78, 26
    rows = [(3, 900), (2, 900 - Hb - 20), (1, 900 - 2 * (Hb + 20))]
    for n, y in rows:
        total = n * Wb + (n - 1) * gap + 44
        x0 = (W_ - total) / 2
        for i in range(n):
            scene += bar(P, x0 + i * (Wb + gap), y, Wb, Hb)
    coins = coin(P, 372, 1003, 100, 32, 16, 'bob') + coin(P, 652, 1014, 100, 32, 16, 'bob2') + coin(P, 512, 1056, 106, 34, 18, 'bob3')
    sweep = '<g clip-path="url(#barclip)"><g transform="rotate(18 512 640)"><rect class="sweep" x="-260" y="-200" width="210" height="1500" fill="url(#swg)" opacity=".95"/></g></g>'
    refl = '<g transform="translate(0,1880) scale(1,-1)" mask="url(#rm)" opacity=".55">' + scene + coins + '</g>'
    sparks = ''
    for i in range(26):
        x, y, r = rnd.randint(60, 960), rnd.randint(80, 760), rnd.choice([3, 4, 5, 7, 9])
        o = rnd.choice([.35, .5, .7, .9]); dur = 2.2 + rnd.random() * 2.6; dl = -rnd.random() * 4
        sparks += ('<g transform="translate(%d,%d)" opacity="%s"><g class="tw" style="animation-duration:%.1fs;animation-delay:%.1fs"><path d="M0,-%d L%.1f,-%.1f L%d,0 L%.1f,%.1f L0,%d L-%.1f,%.1f L-%d,0 L-%.1f,-%.1f Z" fill="%s"/></g></g>'
                   % (x, y, o, dur, dl, r * 3, r * .6, r * .6, r * 3, r * .6, r * .6, r * 3, r * .6, r * .6, r * 3, r * .6, r * .6, P['spark']))
    dust = ''
    for i in range(18):
        x, y = rnd.randint(120, 900), rnd.randint(700, 1000); r = rnd.choice([2.5, 3.5, 4.5]); dl = -rnd.random() * 9; dur = 7 + rnd.random() * 5
        dust += '<circle class="dust" cx="%d" cy="%d" r="%.1f" fill="%s" style="animation-duration:%.1fs;animation-delay:%.1fs"/>' % (x, y, r, P['dust'], dur, dl)
    floor = '<ellipse cx="512" cy="935" rx="470" ry="62" fill="%s" opacity=".55" filter="url(#soft)"/><ellipse cx="512" cy="912" rx="380" ry="18" fill="rgba(0,0,0,.13)" filter="url(#soft)"/>' % P['floor']
    clip = '<clipPath id="barclip">' + ''.join('<polygon points="%s"/>' % p for p in CLIP) + '</clipPath>'
    defs = defs % dict(bg1=P['bg1'], bg2=P['bg2'], bg3=P['bg3'], glow=P['glow'], t0=P['top'][0], t1=P['top'][1], f0=P['front'][0], f1=P['front'][1], f2=P['front'][2], s0=P['side'][0], s1=P['side'][1], c0=P['coin'][0], c1=P['coin'][1], ce=P['coinedge'], clip=clip)
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1280" width="1024" height="1280" role="img" aria-label="Polished %s bars and coins with a moving shine">' % kind + STYLE + defs +
           '<rect width="1024" height="1280" fill="url(#bg)"/><circle class="glow" cx="512" cy="470" r="520" fill="url(#glow)"/>' + '<g filter="url(#blur2)" opacity=".8">' + sparks + '</g>' +
           '<g transform="translate(512,700) scale(1.04) translate(-512,-800)">' + floor + refl + '<g class="float">' + scene + sweep + coins + '</g>' + '<g>' + dust + '</g></g></svg>')
    open(os.path.join(OUT, '%s-rate-art.svg' % kind), 'w', encoding='utf-8').write(svg)
    return len(svg)

for k in ('gold', 'silver'): print(k, make(k))
