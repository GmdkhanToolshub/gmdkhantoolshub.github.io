"""Builds the FMCG sample dashboard workbook (invented data, fixed random seed) and the numbers the web page shows.
Run from the project root:  python build/make-fmcg-sample.py
Then check it in Excel:     powershell -File build/verify-fmcg-sample.ps1
"""
import json, random, pathlib, datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.chart import BarChart, Reference
from openpyxl.formatting.rule import CellIsRule
from openpyxl.utils import get_column_letter

root = pathlib.Path(__file__).resolve().parent.parent
rnd = random.Random(2026)
MONTHS = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06']
CATS = ['Beverages', 'Snacks', 'Dairy', 'Home care']
DIST = [('Sample Distributor A', 'North'), ('Sample Distributor B', 'North'), ('Sample Distributor C', 'Central'), ('Sample Distributor D', 'Central'),
        ('Sample Distributor E', 'Central'), ('Sample Distributor F', 'South'), ('Sample Distributor G', 'South'), ('Sample Distributor H', 'South')]
REGIONS = ['North', 'Central', 'South']
LATEST = MONTHS[-1]
WORKDAYS = 26

size = {d: rnd.uniform(0.7, 1.45) for d, _ in DIST}
skill = {d: s for (d, _), s in zip(DIST, [1.04, 0.97, 1.01, 0.86, 0.99, 1.03, 0.91, 0.95])}
mix = {'Beverages': 420000, 'Snacks': 310000, 'Dairy': 260000, 'Home care': 190000}
sales, outlets = [], []
for mi, m in enumerate(MONTHS):
    for d, reg in DIST:
        for c in CATS:
            target = round(mix[c] * size[d] * (1 + 0.018 * mi) / 1000) * 1000
            secondary = round(target * skill[d] * rnd.uniform(0.9, 1.08) / 100) * 100
            primary = round(secondary * rnd.uniform(0.92, 1.12) / 100) * 100
            sales.append([m, reg, d, c, target, primary, secondary])
        listed = round(240 * size[d]) + mi * 2
        billed = round(listed * min(0.96, 0.78 * skill[d] * rnd.uniform(0.95, 1.07)))
        month_sec = sum(r[6] for r in sales if r[0] == m and r[2] == d)
        days = {'Sample Distributor B': 7, 'Sample Distributor G': 31}.get(d) if m == LATEST else None
        stock = round(month_sec / WORKDAYS * (days if days else rnd.uniform(12, 22)) / 100) * 100
        outlets.append([m, reg, d, listed, billed, stock])

wb = Workbook()
head_fill = PatternFill('solid', fgColor='14315C'); head_font = Font(bold=True, color='FFFFFF')
thin = Side(style='thin', color='C9D3E3'); box = Border(left=thin, right=thin, top=thin, bottom=thin)
def header(ws, row, values, col=1):
    for i, v in enumerate(values):
        c = ws.cell(row=row, column=col + i, value=v); c.fill = head_fill; c.font = head_font; c.alignment = Alignment(wrap_text=True, vertical='center'); c.border = box
def widths(ws, w):
    for i, v in enumerate(w, 1): ws.column_dimensions[get_column_letter(i)].width = v

info = wb.active; info.title = 'Read Me'; widths(info, [110])
for i, line in enumerate(['FMCG Sales Operations sample dashboard (GM Tools Hub)',
    'ALL DATA IN THIS WORKBOOK IS INVENTED for demonstration. It is not client data and not a real company.',
    'Sheets: Dashboard (formulas), Sales Data (target, primary and secondary value), Outlet Data (outlets and closing stock), Checks.',
    'Primary = value sold to the distributor. Secondary = value the distributor sold to outlets.',
    'Achievement = secondary ÷ target. Secondary to primary = secondary ÷ primary. Coverage = billed outlets ÷ listed outlets.',
    'Stock cover days = closing stock ÷ (secondary of the same month ÷ 26 working days). The 10 and 25 day flags are example limits; set your own.',
    'To try it: change a number in a data sheet and watch the Dashboard and Checks sheets recalculate.'], 1):
    c = info.cell(row=i, column=1, value=line); c.alignment = Alignment(wrap_text=True); c.font = Font(bold=i <= 2, size=14 if i == 1 else 11)

sd = wb.create_sheet('Sales Data'); header(sd, 1, ['Month', 'Region', 'Distributor', 'Category', 'Target', 'Primary', 'Secondary'])
for r in sales: sd.append(r)
widths(sd, [10, 10, 24, 13, 13, 13, 13]); sd.freeze_panes = 'A2'; sd.auto_filter.ref = 'A1:G%d' % (len(sales) + 1)
od = wb.create_sheet('Outlet Data'); header(od, 1, ['Month', 'Region', 'Distributor', 'Listed outlets', 'Billed outlets', 'Closing stock'])
for r in outlets: od.append(r)
widths(od, [10, 10, 24, 15, 15, 15]); od.freeze_panes = 'A2'
for ws, cols in ((sd, 'EFG'), (od, 'F')):
    for col in cols:
        for i in range(2, ws.max_row + 1): ws['%s%d' % (col, i)].number_format = '#,##0'

n, m_n = len(sales) + 1, len(outlets) + 1
rng = lambda col: "'Sales Data'!$%s$2:$%s$%d" % (col, col, n)
org = lambda col: "'Outlet Data'!$%s$2:$%s$%d" % (col, col, m_n)
db = wb.create_sheet('Dashboard', 1); widths(db, [26, 15, 15, 15, 14, 14, 13, 13, 14])
db['A1'] = 'FMCG sales dashboard: SAMPLE DATA ONLY'; db['A1'].font = Font(bold=True, size=15)
db['A2'] = 'Month shown'; db['B2'] = LATEST; db['B2'].font = Font(bold=True); db['B2'].fill = PatternFill('solid', fgColor='FFF2CC')
db['C2'] = 'Change B2 to any month in the data (2026-01 to 2026-06).'
header(db, 4, ['Target', 'Secondary', 'Achievement', 'Primary', 'Secondary to primary', 'Billed outlets', 'Listed outlets', 'Coverage', 'Sales per billed outlet'])
db['A5'] = '=SUMIFS(%s,%s,$B$2)' % (rng('E'), rng('A'))
db['B5'] = '=SUMIFS(%s,%s,$B$2)' % (rng('G'), rng('A'))
db['C5'] = '=IFERROR(B5/A5,0)'
db['D5'] = '=SUMIFS(%s,%s,$B$2)' % (rng('F'), rng('A'))
db['E5'] = '=IFERROR(B5/D5,0)'
db['F5'] = '=SUMIFS(%s,%s,$B$2)' % (org('E'), org('A'))
db['G5'] = '=SUMIFS(%s,%s,$B$2)' % (org('D'), org('A'))
db['H5'] = '=IFERROR(F5/G5,0)'
db['I5'] = '=IFERROR(B5/F5,0)'
for c, f in zip('ABCDEFGHI', ['#,##0', '#,##0', '0.0%', '#,##0', '0.0%', '#,##0', '#,##0', '0.0%', '#,##0']): db[c + '5'].number_format = f; db[c + '5'].font = Font(bold=True, size=13)

header(db, 7, ['Distributor', 'Target', 'Secondary', 'Achievement', 'Gap to target', 'Coverage', 'Closing stock', 'Stock cover days', 'Stock flag'])
for i, (d, _) in enumerate(DIST):
    r = 8 + i
    db.cell(row=r, column=1, value=d)
    db.cell(row=r, column=2, value='=SUMIFS(%s,%s,$B$2,%s,$A%d)' % (rng('E'), rng('A'), rng('C'), r)).number_format = '#,##0'
    db.cell(row=r, column=3, value='=SUMIFS(%s,%s,$B$2,%s,$A%d)' % (rng('G'), rng('A'), rng('C'), r)).number_format = '#,##0'
    db.cell(row=r, column=4, value='=IFERROR(C%d/B%d,0)' % (r, r)).number_format = '0.0%'
    db.cell(row=r, column=5, value='=C%d-B%d' % (r, r)).number_format = '#,##0'
    db.cell(row=r, column=6, value='=IFERROR(SUMIFS(%s,%s,$B$2,%s,$A%d)/SUMIFS(%s,%s,$B$2,%s,$A%d),0)' % (org('E'), org('A'), org('C'), r, org('D'), org('A'), org('C'), r)).number_format = '0.0%'
    db.cell(row=r, column=7, value='=SUMIFS(%s,%s,$B$2,%s,$A%d)' % (org('F'), org('A'), org('C'), r)).number_format = '#,##0'
    db.cell(row=r, column=8, value='=IFERROR(G%d/(C%d/%d),0)' % (r, r, WORKDAYS)).number_format = '0.0'
    db.cell(row=r, column=9, value='=IF(H%d<10,"Low: check supply",IF(H%d>25,"High: check selling","In range"))' % (r, r))
db.conditional_formatting.add('D8:D15', CellIsRule(operator='lessThan', formula=['0.95'], fill=PatternFill('solid', fgColor='F8D7D7')))
header(db, 17, ['Category', 'Target', 'Secondary', 'Achievement'])
for i, c in enumerate(CATS):
    r = 18 + i
    db.cell(row=r, column=1, value=c)
    db.cell(row=r, column=2, value='=SUMIFS(%s,%s,$B$2,%s,$A%d)' % (rng('E'), rng('A'), rng('D'), r)).number_format = '#,##0'
    db.cell(row=r, column=3, value='=SUMIFS(%s,%s,$B$2,%s,$A%d)' % (rng('G'), rng('A'), rng('D'), r)).number_format = '#,##0'
    db.cell(row=r, column=4, value='=IFERROR(C%d/B%d,0)' % (r, r)).number_format = '0.0%'
header(db, 23, ['Month', 'Target', 'Secondary', 'Achievement'])
for i, mth in enumerate(MONTHS):
    r = 24 + i
    db.cell(row=r, column=1, value=mth)
    db.cell(row=r, column=2, value='=SUMIFS(%s,%s,$A%d)' % (rng('E'), rng('A'), r)).number_format = '#,##0'
    db.cell(row=r, column=3, value='=SUMIFS(%s,%s,$A%d)' % (rng('G'), rng('A'), r)).number_format = '#,##0'
    db.cell(row=r, column=4, value='=IFERROR(C%d/B%d,0)' % (r, r)).number_format = '0.0%'
ch = BarChart(); ch.title = 'Target and secondary by month (sample)'; ch.height = 7; ch.width = 18
ch.add_data(Reference(db, min_col=2, max_col=3, min_row=23, max_row=29), titles_from_data=True); ch.set_categories(Reference(db, min_col=1, min_row=24, max_row=29))
ch.x_axis.delete = False; ch.y_axis.delete = False
db.add_chart(ch, 'F17')
db.freeze_panes = 'A4'; db.page_setup.orientation = 'landscape'; db.page_setup.fitToWidth = 1; db.page_setup.fitToHeight = 0; db.sheet_properties.pageSetUpPr.fitToPage = True

ck = wb.create_sheet('Checks'); widths(ck, [62, 18, 18, 12]); header(ck, 1, ['Check', 'Dashboard', 'Source data', 'Result'])
checks = [('Distributor table target adds to the headline target', '=SUM(Dashboard!B8:B15)', '=Dashboard!A5'),
          ('Distributor table secondary adds to the headline secondary', '=SUM(Dashboard!C8:C15)', '=Dashboard!B5'),
          ('Category table secondary adds to the headline secondary', '=SUM(Dashboard!C18:C21)', '=Dashboard!B5'),
          ('Six-month trend adds to all secondary rows', '=SUM(Dashboard!C24:C29)', "=SUM(%s)" % rng('G')),
          ('Every sales row has a distributor listed on the dashboard', "=SUMPRODUCT(COUNTIF(Dashboard!A8:A15,%s))" % rng('C'), '=COUNTA(%s)' % rng('C'))]
for i, (label, a, b) in enumerate(checks, 2):
    ck.cell(row=i, column=1, value=label); ck.cell(row=i, column=2, value=a).number_format = '#,##0'; ck.cell(row=i, column=3, value=b).number_format = '#,##0'
    ck.cell(row=i, column=4, value='=IF(ABS(B%d-C%d)<0.5,"Matched","CHECK")' % (i, i))
for ws in wb.worksheets:
    ws.sheet_view.showGridLines = ws.title in ('Sales Data', 'Outlet Data')
wb.active = 1
wb.properties.creator = 'GM Tools Hub'; wb.properties.lastModifiedBy = 'GM Tools Hub'; wb.properties.title = 'FMCG sales dashboard (sample data)'
wb.properties.created = datetime.datetime(2026, 11, 27); wb.properties.modified = datetime.datetime(2026, 11, 27)
out = root / 'assets' / 'downloads' / 'gm-fmcg-sales-sample-dashboard.xlsx'
wb.save(out)

# the same measures worked out independently here; the web page uses these and Excel must agree with them
def month_sum(col, m=LATEST, d=None, c=None): return sum(r[col] for r in sales if r[0] == m and (d is None or r[2] == d) and (c is None or r[3] == c))
latest_out = [r for r in outlets if r[0] == LATEST]
head = {'target': month_sum(4), 'secondary': month_sum(6), 'primary': month_sum(5), 'billed': sum(r[4] for r in latest_out), 'listed': sum(r[3] for r in latest_out)}
dist = []
for d, reg in DIST:
    o = next(r for r in latest_out if r[2] == d); sec = month_sum(6, d=d)
    dist.append({'name': d, 'region': reg, 'target': month_sum(4, d=d), 'secondary': sec, 'coverage': o[4] / o[3], 'stock': o[5], 'cover': o[5] / (sec / WORKDAYS)})
data = {'month': LATEST, 'workdays': WORKDAYS, 'head': head, 'distributors': dist,
        'categories': [{'name': c, 'target': month_sum(4, c=c), 'secondary': month_sum(6, c=c)} for c in CATS],
        'trend': [{'month': m, 'target': month_sum(4, m=m), 'secondary': month_sum(6, m=m)} for m in MONTHS], 'rows': len(sales)}
(root / 'build' / 'fmcg-sample.json').write_text(json.dumps(data, indent=1), encoding='utf-8')
print('workbook', out.name, round(out.stat().st_size / 1024), 'KB | sales rows', len(sales), '| outlet rows', len(outlets))
