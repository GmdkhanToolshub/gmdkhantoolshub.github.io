# -*- coding: utf-8 -*-
"""Shop thumbnails in the current GM Tools Hub brand.
Where the workbook exists in products/, the thumbnail is a REAL preview: actual sheet names and actual cell content from that file.
Otherwise it is a branded cover that lists only what the shop description says. Output: assets/img/shop/<id>.webp (960x600).
Run: python build/make-shop-thumbs.py"""
import os, re, html, datetime
from openpyxl import load_workbook
from PIL import Image, ImageDraw, ImageFont

ROOT = r'D:\GM_Claude'; OUT = os.path.join(ROOT, 'assets', 'img', 'shop')
BOOKS = {'salary-tax-pack': r'products\salary-tax-pack\Pakistan-Salary-Tax-Pack.xlsx', 'team-kpi-scorecard': r'products\Team-KPI-Scorecard.xlsx', 'sales-target-tracker': r'products\Sales-Target-Run-Rate-Tracker.xlsx', 'inventory-sales-tracker': r'products\Inventory-Sales-Tracker.xlsx', 'invoice-payment-tracker': r'products\Invoice-Payment-Tracker.xlsx', 'budget-planner': r'products\Personal-Budget-Planner.xlsx', 'hr-attendance-tracker': r'products\HR-Attendance-Leave-Tracker.xlsx', 'pakistan-payroll-tax-workbook': r'products\Pakistan-Payroll-Salary-Tax-Workbook.xlsx', 'freelancer-income-tax-tracker': r'products\Freelancer-Income-Tax-Tracker.xlsx', 'recruitment-hiring-tracker': r'products\Recruitment-Hiring-Tracker.xlsx', 'sales-leads-pipeline-tracker': r'products\Sales-Leads-Pipeline-Tracker.xlsx'}
F = r'C:\Windows\Fonts'
def font(sz, bold=False): return ImageFont.truetype(os.path.join(F, 'segoeuib.ttf' if bold else 'segoeui.ttf'), sz)
NAVY, NAVY2, TEAL, INK, SOFT, LINE = (11, 22, 48), (18, 36, 74), (45, 212, 191), (22, 32, 58), (92, 104, 128), (214, 222, 236)
W, H = 960, 600

def fit(d, text, f, maxw):
    if d.textlength(text, font=f) <= maxw: return text
    while text and d.textlength(text + '…', font=f) > maxw: text = text[:-1]
    return text.rstrip() + '…'

def base(title, subtitle):
    im = Image.new('RGB', (W, H), (238, 242, 250)); d = ImageDraw.Draw(im)
    for y in range(150):
        t = y / 150; d.line((0, y, W, y), fill=tuple(int(NAVY[i] + (NAVY2[i] - NAVY[i]) * t) for i in range(3)))
    d.rectangle((40, 38, 76, 43), fill=TEAL); d.text((88, 26), 'GM TOOLS HUB', font=font(19, True), fill=(125, 227, 218))
    sz = 42
    while d.textlength(title, font=font(sz, True)) > W - 80 and sz > 26: sz -= 2
    d.text((40, 62), title, font=font(sz, True), fill=(255, 255, 255))
    d.text((40, 114), subtitle, font=font(20), fill=(188, 204, 236))
    return im, d

def show(v):
    if v is None: return ''
    if isinstance(v, str): return '' if v.startswith('=') else v.strip().replace('\n', ' ')
    if isinstance(v, bool): return 'Yes' if v else 'No'
    if isinstance(v, (datetime.datetime, datetime.date)): return v.strftime('%d %b %Y')
    if isinstance(v, float) and not v.is_integer(): return '{:,.2f}'.format(v) if abs(v) >= 1 else '{:.0%}'.format(v)
    if isinstance(v, (int, float)): return '{:,}'.format(int(v))
    return str(v)

def best_table(path):
    wb = load_workbook(path, data_only=False)
    cached = load_workbook(path, data_only=True)
    names = wb.sheetnames; best = None
    for n in names:
        if re.search(r'start|how|guide|instruction|about|read', n, re.I): continue
        ws, cv = wb[n], cached[n]
        rows = []
        for r in range(1, min(ws.max_row, 40) + 1):
            rows.append([show(cv.cell(r, c).value) or show(ws.cell(r, c).value) for c in range(1, min(ws.max_column, 12) + 1)])
        # header = first row with 4 or more short text cells, followed by data
        for i, row in enumerate(rows):
            texts = [x for x in row if x and not re.match(r'^[\d,.%\- ]+$', x) and len(x) <= 40]
            if len(texts) >= 4:
                cols = [k for k, x in enumerate(row) if x][:6]
                data = [[r2[k] for k in cols] for r2 in rows[i + 1:i + 12] if sum(1 for k in cols if r2[k]) >= 2][:8]
                filled = sum(1 for r2 in data for x in r2 if x)
                if data and (best is None or filled > best[0]): best = (filled, n, [row[k] for k in cols], data)
                break
    return names, best

def real_preview(pid, title, path):
    names, best = best_table(path)
    if not best: return None
    _, sheet, header, data = best
    im, d = base(title, 'Excel workbook  ·  actual sheet content with example data')
    x0, y0, x1 = 40, 176, W - 40
    d.rounded_rectangle((x0, y0, x1, H - 28), 16, fill=(255, 255, 255), outline=LINE, width=2)
    n = len(header); first = 0.28 if n > 2 else 0.5; widths = [(x1 - x0 - 24) * first] + [(x1 - x0 - 24) * (1 - first) / max(1, n - 1)] * (n - 1)
    y = y0 + 12; x = x0 + 12
    d.rounded_rectangle((x0 + 12, y, x1 - 12, y + 40), 8, fill=NAVY2)
    for k, h in enumerate(header):
        d.text((x + 10, y + 9), fit(d, h, font(17, True), widths[k] - 18), font=font(17, True), fill=(255, 255, 255)); x += widths[k]
    y += 46
    for ri, row in enumerate(data):
        if y + 34 > H - 84: break
        if ri % 2: d.rectangle((x0 + 12, y - 2, x1 - 12, y + 32), fill=(246, 249, 254))
        x = x0 + 12
        for k, v in enumerate(row):
            d.text((x + 10, y + 3), fit(d, v, font(17), widths[k] - 18), font=font(17), fill=INK); x += widths[k]
        d.line((x0 + 12, y + 32, x1 - 12, y + 32), fill=(232, 237, 246)); y += 36
    tx = x0 + 14; ty = H - 74
    for nm in names[:6]:
        w = d.textlength(nm, font=font(16, True)) + 28
        if tx + w > x1 - 12: break
        on = nm == sheet
        d.rounded_rectangle((tx, ty, tx + w, ty + 32), 8, fill=(224, 244, 241) if on else (241, 244, 250), outline=(15, 157, 148) if on else LINE)
        d.text((tx + 14, ty + 5), nm, font=font(16, True), fill=(11, 111, 105) if on else SOFT); tx += w + 8
    return im

def cover(pid, title, desc, kind):
    im, d = base(title, kind)
    d.rounded_rectangle((40, 182, W - 40, H - 36), 18, fill=(255, 255, 255), outline=LINE, width=2)
    d.text((74, 208), 'What is inside', font=font(24, True), fill=INK)
    parts = [p.strip(' .') for p in re.split(r'(?<=[.])\s+|;\s+', desc) if len(p.strip()) > 8][:4]
    y = 262
    for p in parts:
        d.ellipse((76, y + 8, 94, y + 26), fill=(15, 157, 148)); d.line((80, y + 17, 84, y + 21), fill='white', width=3); d.line((84, y + 21, 91, y + 13), fill='white', width=3)
        words, line, lines = p.split(), '', []
        for w in words:
            t = (line + ' ' + w).strip()
            if d.textlength(t, font=font(21)) > W - 200 and line: lines.append(line); line = w
            else: line = t
        lines.append(line)
        for ln in lines[:2]:
            d.text((112, y + 3), ln, font=font(21), fill=(51, 65, 92)); y += 31
        y += 18
        if y > H - 100: break
    return im

shop = open(os.path.join(ROOT, 'shop', 'index.html'), encoding='utf-8').read()
real = made = 0
for m in re.finditer(r'<article class="card shop-card" id="([a-z0-9-]+)">([\s\S]*?)</article>', shop):
    pid, body = m.group(1), m.group(2)
    title = html.unescape(re.sub(r'<[^>]+>', '', re.search(r'<h3[^>]*>([\s\S]*?)</h3>', body).group(1)))
    dm = re.search(r'<p class="muted"[^>]*>([\s\S]*?)</p>', body); desc = html.unescape(re.sub(r'<[^>]+>', '', dm.group(1))) if dm else ''
    im = None
    if pid in BOOKS and os.path.exists(os.path.join(ROOT, BOOKS[pid])):
        im = real_preview(pid, title, os.path.join(ROOT, BOOKS[pid]))
        if im is not None: real += 1
    if im is None:
        kind = 'Bundle' if re.search(r'bundle|pack', pid) else ('Printable PDF' if re.search(r'kids|student|large-print', pid) else 'Digital product')
        im = cover(pid, title, desc, kind)
    im.save(os.path.join(OUT, pid + '.webp'), 'WEBP', quality=82, method=6); made += 1
print('thumbnails:', made, '| real workbook previews:', real)
