# -*- coding: utf-8 -*-
"""Example workbooks for the Excel dashboard guide and the inventory guide. All data is made up.
Expected figures are worked out here in plain Python; build/verify-cornerstone.ps1 recalculates the workbooks in
Microsoft Excel, compares, and exports the pages used as article screenshots.
Run: python build/cornerstone_examples.py"""
import os, json, datetime as dt
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.chart import BarChart, Reference
from openpyxl.formatting.rule import CellIsRule, FormulaRule
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.table import Table, TableStyleInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DL = os.path.join(ROOT, 'assets', 'downloads')
NAVY, WHITE = '0B1630', 'FFFFFF'
fill = lambda c: PatternFill('solid', fgColor=c)
rule_fill = lambda c: PatternFill(fill_type='solid', start_color=c, end_color=c, bgColor=c)  # conditional formats read bgColor
thin = Side(style='thin', color='D6DEEC'); BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
def header(ws, row, col, values):
    for i, v in enumerate(values):
        c = ws.cell(row, col + i, v); c.fill = fill(NAVY); c.font = Font(bold=True, color=WHITE); c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True); c.border = BOX
def put(ws, ref, value, fmt=None, bold=False, border=True):
    c = ws[ref]; c.value = value
    if fmt: c.number_format = fmt
    if bold: c.font = Font(bold=True)
    if border: c.border = BOX
    return c
def widths(ws, d):
    for k, v in d.items(): ws.column_dimensions[k].width = v
def page(ws, landscape=True):
    ws.page_setup.orientation = 'landscape' if landscape else 'portrait'; ws.page_setup.paperSize = 9
    ws.sheet_properties.pageSetUpPr.fitToPage = True; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 1
    ws.page_margins.left = ws.page_margins.right = 0.3; ws.page_margins.top = ws.page_margins.bottom = 0.3; ws.sheet_view.showGridLines = False
def table(ws, name, ref):
    t = Table(displayName=name, ref=ref); t.tableStyleInfo = TableStyleInfo(name='TableStyleMedium2', showRowStripes=True); ws.add_table(t)

# ================= 1. Sales dashboard =================
MONTHS = ['Jan', 'Feb', 'Mar']; REGIONS = ['North', 'South', 'East', 'West']; PRODUCTS = ['Tea', 'Juice', 'Biscuits']
BASE = {'Tea': 60000, 'Juice': 40000, 'Biscuits': 30000}; REG = {'North': 1.20, 'South': 1.00, 'East': 0.90, 'West': 0.75}
RATE = [[1.04, 0.96, 1.00], [0.92, 0.88, 0.95], [1.08, 1.03, 1.10], [0.85, 0.99, 0.80]]   # achievement by region, per month
WOBBLE = [1.00, 1.05, 0.94]                                                              # by product
rows = []
for mi, m in enumerate(MONTHS):
    for ri, r in enumerate(REGIONS):
        for pi, p in enumerate(PRODUCTS):
            target = int(round(BASE[p] * REG[r] * (1 + 0.05 * mi), -2))
            sales = int(round(target * RATE[ri][mi] * WOBBLE[pi], -2))
            rows.append((dt.date(2026, mi + 1, 5 + pi * 9), m, r, p, sales, target))
def tot(field, **k):
    idx = {'month': 1, 'region': 2, 'product': 3}
    return sum(x[4 if field == 'sales' else 5] for x in rows if all(x[idx[a]] == b for a, b in k.items()))
dash = {'rows': len(rows), 'sales': tot('sales'), 'target': tot('target'),
        'months': {m: {'sales': tot('sales', month=m), 'target': tot('target', month=m)} for m in MONTHS},
        'regionsMar': {r: {'sales': tot('sales', month='Mar', region=r), 'target': tot('target', month='Mar', region=r)} for r in REGIONS}}
dash['marSales'] = dash['months']['Mar']['sales']; dash['marTarget'] = dash['months']['Mar']['target']
dash['marAch'] = dash['marSales'] / dash['marTarget']; dash['marGrowth'] = dash['marSales'] / dash['months']['Feb']['sales'] - 1
dash['marGap'] = dash['marSales'] - dash['marTarget']
dash['simpleAvgAch'] = sum(v['sales'] / v['target'] for v in dash['regionsMar'].values()) / 4

def build_dashboard(path):
    wb = Workbook()
    d = wb.active; d.title = 'Dashboard'
    data = wb.create_sheet('Data'); calc = wb.create_sheet('Calc'); notes = wb.create_sheet('Notes')
    header(data, 1, 1, ['Date', 'Month', 'Region', 'Product', 'Sales', 'Target'])
    for x in rows: data.append(list(x))
    for n in range(2, len(rows) + 2):
        data.cell(n, 1).number_format = 'dd-mmm-yyyy'; data.cell(n, 5).number_format = data.cell(n, 6).number_format = '#,##0'
    widths(data, dict(A=13, B=8, C=9, D=11, E=11, F=11)); data.freeze_panes = 'A2'
    table(data, 'SalesData', 'A1:F%d' % (len(rows) + 1)); page(data, False); data.page_setup.fitToHeight = 0
    S, T, M, R = ('Data!$E$2:$E$500', 'Data!$F$2:$F$500', 'Data!$B$2:$B$500', 'Data!$C$2:$C$500')
    header(calc, 1, 1, ['Month', 'Sales', 'Target', 'Achievement'])
    for i, m in enumerate(MONTHS):
        n = i + 2
        put(calc, 'A%d' % n, m); put(calc, 'B%d' % n, '=SUMIFS(%s,%s,A%d)' % (S, M, n), '#,##0'); put(calc, 'C%d' % n, '=SUMIFS(%s,%s,A%d)' % (T, M, n), '#,##0'); put(calc, 'D%d' % n, '=IFERROR(B%d/C%d,0)' % (n, n), '0.0%')
    header(calc, 1, 6, ['Check', 'Value'])
    put(calc, 'F2', 'Data total'); put(calc, 'G2', '=SUM(%s)' % S, '#,##0')
    put(calc, 'F3', 'Months total'); put(calc, 'G3', '=SUM(B2:B4)', '#,##0')
    put(calc, 'F4', 'Totals agree?'); put(calc, 'G4', '=IF(G2=G3,"Yes","CHECK DATA")')
    widths(calc, dict(A=10, B=13, C=13, D=13, E=3, F=16, G=14))
    # dashboard
    widths(d, dict(A=2, B=17, C=17, D=17, E=17, F=17, G=2))
    d.merge_cells('B1:F1'); put(d, 'B1', 'Sales performance dashboard (sample data)', border=False).font = Font(bold=True, size=18, color=NAVY); d.row_dimensions[1].height = 30
    put(d, 'B2', 'Month:', bold=True, border=False); put(d, 'C2', 'Mar', bold=True); d['C2'].fill = fill('FFF4CC')
    dv = DataValidation(type='list', formula1='"%s"' % ','.join(MONTHS), allow_blank=False, showErrorMessage=True); d.add_data_validation(dv); dv.add('C2')
    put(d, 'D2', '← choose a month', border=False).font = Font(italic=True, color='5C6880')
    tiles = [('B', 'Sales', '=SUMIFS(%s,%s,$C$2)' % (S, M), '#,##0'), ('C', 'Target', '=SUMIFS(%s,%s,$C$2)' % (T, M), '#,##0'), ('D', 'Achievement', '=IFERROR(B5/C5,0)', '0.0%'),
             ('E', 'Gap to target', '=B5-C5', '+#,##0;-#,##0;0'), ('F', 'Change on prior month', '=IFERROR(B5/INDEX(Calc!$B$2:$B$4,MATCH($C$2,Calc!$A$2:$A$4,0)-1+(MATCH($C$2,Calc!$A$2:$A$4,0)=1))-1,0)', '+0.0%;-0.0%;0.0%')]
    for col, label, f, fm in tiles:
        c = put(d, col + '4', label); c.fill = fill(NAVY); c.font = Font(color='BCCCEC', size=10); c.alignment = Alignment(horizontal='center')
        c = put(d, col + '5', f, fm); c.font = Font(bold=True, size=18, color=NAVY); c.alignment = Alignment(horizontal='center', vertical='center'); c.fill = fill('EEF2FA')
    d['F5'] = '=IF(MATCH($C$2,Calc!$A$2:$A$4,0)=1,"n/a",B5/INDEX(Calc!$B$2:$B$4,MATCH($C$2,Calc!$A$2:$A$4,0)-1)-1)'; d['F5'].number_format = '+0.0%;-0.0%;0.0%'
    d.row_dimensions[5].height = 34
    header(d, 7, 2, ['Region', 'Sales', 'Target', 'Achievement', 'Status'])
    for i, r in enumerate(REGIONS):
        n = 8 + i
        put(d, 'B%d' % n, r); put(d, 'C%d' % n, '=SUMIFS(%s,%s,$C$2,%s,B%d)' % (S, M, R, n), '#,##0'); put(d, 'D%d' % n, '=SUMIFS(%s,%s,$C$2,%s,B%d)' % (T, M, R, n), '#,##0')
        put(d, 'E%d' % n, '=IFERROR(C%d/D%d,0)' % (n, n), '0.0%'); put(d, 'F%d' % n, '=IF(E%d>=1,"On target",IF(E%d>=0.9,"Close","Behind"))' % (n, n))
    put(d, 'B12', 'Total', bold=True); put(d, 'C12', '=SUM(C8:C11)', '#,##0', True); put(d, 'D12', '=SUM(D8:D11)', '#,##0', True); put(d, 'E12', '=IFERROR(C12/D12,0)', '0.0%', True); put(d, 'F12', '=IF(C12=B5,"Matches tile","CHECK")', bold=True)
    for word, colour in (('On target', 'D9F2E6'), ('Close', 'FFF0C2'), ('Behind', 'FBDADA')):
        d.conditional_formatting.add('F8:F11', CellIsRule(operator='equal', formula=['"%s"' % word], fill=rule_fill(colour)))
    ch = BarChart(); ch.type = 'col'; ch.title = 'Sales and target by month'; ch.height = 6.4; ch.width = 16.4
    ch.add_data(Reference(calc, min_col=2, max_col=3, min_row=1, max_row=4), titles_from_data=True); ch.set_categories(Reference(calc, min_col=1, min_row=2, max_row=4))
    ch2 = BarChart(); ch2.type = 'bar'; ch2.title = 'Achievement by region (chosen month)'; ch2.height = 5.6; ch2.width = 16.4
    ch2.add_data(Reference(d, min_col=5, min_row=7, max_row=11), titles_from_data=True); ch2.set_categories(Reference(d, min_col=2, min_row=8, max_row=11)); ch2.legend = None; ch2.x_axis.scaling.orientation = 'maxMin'; ch2.y_axis.scaling.min = 0; ch2.y_axis.number_format = '0%'
    for c in (ch, ch2): c.x_axis.delete = False; c.y_axis.delete = False
    ch.y_axis.number_format = '#,##0'; ch.y_axis.scaling.min = 0; ch.legend.position = 'b'
    for c in (ch, ch2): c.title.overlay = False
    ch.legend.overlay = False; ch2.varyColors = False; ch2.y_axis.number_format = '0%'; ch2.x_axis.crosses = None; ch2.y_axis.crosses = 'max'
    d.add_chart(ch, 'B14'); d.add_chart(ch2, 'B28'); d.print_area = 'A1:G40'; page(d, False)
    notes.column_dimensions['A'].width = 100
    for line in ['About this example', 'All names and figures are made up.', 'Add rows at the bottom of the Data table. The formulas read rows 2 to 500; extend them if you need more.', 'Choose a month in the yellow cell on the Dashboard sheet.', 'Check Calc!G4 and Dashboard!F12 after every update. They show whether the totals still agree.', 'The sample covers January to March of one year. For several years, add a Year column and include it in every SUMIFS.', 'Guide: https://gmtoolshub.com/blog/excel-dashboard-guide-business-reporting/']:
        notes.append([line]); notes.cell(notes.max_row, 1).alignment = Alignment(wrap_text=True)
    notes['A1'].font = Font(bold=True, size=14); page(notes, False)
    wb.properties.title = 'GM Sales Dashboard Example'; wb.properties.creator = 'GM Tools Hub'; wb.save(path)

# ================= 2. Inventory =================
ITEMS = [('P01', 'Black tea 500 g', 620, 760, 120, 7, 20), ('P02', 'Green tea 250 g', 410, 520, 60, 10, 10), ('P03', 'Mango juice 1 L', 190, 240, 300, 5, 60), ('P04', 'Apple juice 1 L', 200, 255, 160, 5, 40),
         ('P05', 'Salted biscuits', 55, 75, 500, 4, 120), ('P06', 'Cream biscuits', 70, 95, 380, 4, 100), ('P07', 'Sugar 1 kg', 135, 155, 200, 3, 50), ('P08', 'Honey 500 g', 890, 1150, 25, 14, 6)]
OUT = {'P01': [30, 25, 28, 22], 'P02': [12, 9, 11, 10], 'P03': [90, 110, 95, 105], 'P04': [35, 30, 28, 33], 'P05': [180, 150, 170, 160], 'P06': [90, 85, 95, 80], 'P07': [60, 55, 70, 65], 'P08': [4, 5, 3, 4]}
IN = {'P01': [(10, 60)], 'P02': [(12, 20)], 'P03': [(9, 200), (23, 150)], 'P05': [(8, 300), (22, 250)], 'P06': [(17, 100)], 'P07': [(15, 120)], 'P08': [(20, 10)]}
START, DAYS = dt.date(2026, 3, 1), 31
moves = []
for code, q in OUT.items():
    for week, qty in enumerate(q): moves.append((START + dt.timedelta(days=5 + 7 * week), code, 'Out', qty))
for code, lst in IN.items():
    for day, qty in lst: moves.append((dt.date(2026, 3, day), code, 'In', qty))
moves.sort(key=lambda m: (m[0], m[1], m[2]))
inv = []
for code, name, cost, price, opening, lead, safety in ITEMS:
    i = sum(q for _, c, t, q in moves if c == code and t == 'In'); o = sum(q for _, c, t, q in moves if c == code and t == 'Out')
    closing = opening + i - o; daily = o / DAYS; rop = daily * lead + safety
    inv.append(dict(code=code, name=name, cost=cost, opening=opening, lead=lead, safety=safety, inQty=i, outQty=o, closing=closing, value=closing * cost, daily=daily, rop=rop,
                    status='Out of stock' if closing <= 0 else 'Reorder' if closing <= rop else 'OK', cover=closing / daily if daily else None, cogs=o * cost, openValue=opening * cost))
assert all(x['closing'] >= 0 for x in inv)
ranked = sorted(inv, key=lambda x: -x['cogs']); total_cogs = sum(x['cogs'] for x in inv); run = 0
for x in ranked:
    before = run / total_cogs; run += x['cogs']; x['share'] = run / total_cogs; x['abc'] = 'A' if before < 0.70 else 'B' if before < 0.90 else 'C'
open_v = sum(x['openValue'] for x in inv); close_v = sum(x['value'] for x in inv)
invs = {'items': inv, 'moves': len(moves), 'openValue': open_v, 'closeValue': close_v, 'cogs': total_cogs, 'turnover': total_cogs / ((open_v + close_v) / 2), 'days': DAYS}
invs['daysOfStock'] = DAYS / invs['turnover']

def build_inventory(path):
    wb = Workbook(); s = wb.active; s.title = 'Stock'
    p = wb.create_sheet('Products'); m = wb.create_sheet('Movements'); notes = wb.create_sheet('Notes')
    header(p, 1, 1, ['Code', 'Product', 'Unit cost', 'Selling price', 'Opening stock', 'Lead time (days)', 'Safety stock'])
    for row in ITEMS: p.append(list(row))
    for n in range(2, 10): p.cell(n, 3).number_format = p.cell(n, 4).number_format = '#,##0'
    widths(p, dict(A=8, B=22, C=10, D=12, E=13, F=15, G=12)); table(p, 'Products', 'A1:G9'); page(p)
    header(m, 1, 1, ['Date', 'Code', 'Type', 'Quantity', 'Known code?'])
    for n, (date, code, typ, qty) in enumerate(moves, start=2):
        m.append([date, code, typ, qty, '=IF(COUNTIF(Products!$A$2:$A$200,B%d)=1,"Yes","CHECK")' % n]); m.cell(n, 1).number_format = 'dd-mmm-yyyy'
    widths(m, dict(A=13, B=8, C=7, D=10, E=13)); m.freeze_panes = 'A2'; table(m, 'Movements', 'A1:E%d' % (len(moves) + 1))
    dv1 = DataValidation(type='list', formula1='Products!$A$2:$A$200', showErrorMessage=True); dv2 = DataValidation(type='list', formula1='"In,Out"', showErrorMessage=True); dv3 = DataValidation(type='whole', operator='greaterThan', formula1='0', showErrorMessage=True, error='Enter a whole number above zero.')
    for dv, rng in ((dv1, 'B2:B1000'), (dv2, 'C2:C1000'), (dv3, 'D2:D1000')): m.add_data_validation(dv); dv.add(rng)
    page(m, False); m.page_setup.fitToHeight = 0
    s.merge_cells('A1:L1'); put(s, 'A1', 'Stock position for March 2026 (sample data)', border=False).font = Font(bold=True, size=16, color=NAVY); s.row_dimensions[1].height = 26
    put(s, 'A2', 'Days in period', bold=True, border=False); put(s, 'C2', DAYS); s['C2'].fill = fill('FFF4CC')
    header(s, 4, 1, ['Code', 'Product', 'Opening', 'In', 'Out', 'On hand', 'Average daily use', 'Reorder point', 'Status', 'Days of cover', 'Stock value at cost', 'Cost of goods sold'])
    s.row_dimensions[4].height = 32
    for i in range(len(ITEMS)):
        n, pr = 5 + i, 2 + i
        f = {'A': ('=Products!A%d' % pr, None), 'B': ('=Products!B%d' % pr, None), 'C': ('=Products!E%d' % pr, '#,##0'),
             'D': ('=SUMIFS(Movements!$D$2:$D$1000,Movements!$B$2:$B$1000,A%d,Movements!$C$2:$C$1000,"In")' % n, '#,##0'), 'E': ('=SUMIFS(Movements!$D$2:$D$1000,Movements!$B$2:$B$1000,A%d,Movements!$C$2:$C$1000,"Out")' % n, '#,##0'),
             'F': ('=C%d+D%d-E%d' % (n, n, n), '#,##0'), 'G': ('=IFERROR(E%d/$C$2,0)' % n, '0.00'), 'H': ('=G%d*Products!F%d+Products!G%d' % (n, pr, pr), '0.0'),
             'I': ('=IF(F%d<=0,"Out of stock",IF(F%d<=H%d,"Reorder","OK"))' % (n, n, n), None), 'J': ('=IF(G%d=0,"No use",F%d/G%d)' % (n, n, n), '0.0'),
             'K': ('=F%d*Products!C%d' % (n, pr), '#,##0'), 'L': ('=E%d*Products!C%d' % (n, pr), '#,##0')}
        for col, (formula, fm) in f.items(): put(s, '%s%d' % (col, n), formula, fm)
    last = 4 + len(ITEMS); t = last + 1
    put(s, 'A%d' % t, 'Total', bold=True)
    for col in 'KL': put(s, '%s%d' % (col, t), '=SUM(%s5:%s%d)' % (col, col, last), '#,##0', True)
    s.conditional_formatting.add('I5:I%d' % last, CellIsRule(operator='equal', formula=['"Reorder"'], fill=rule_fill('FFF0C2')))
    s.conditional_formatting.add('I5:I%d' % last, CellIsRule(operator='equal', formula=['"Out of stock"'], fill=rule_fill('FBDADA')))
    s.conditional_formatting.add('F5:F%d' % last, CellIsRule(operator='lessThan', formula=['0'], fill=rule_fill('FBDADA')))
    r = t + 2
    summary = [('Opening stock value', '=SUMPRODUCT(Products!E2:E9,Products!C2:C9)', '#,##0'), ('Closing stock value', '=K%d' % t, '#,##0'), ('Average stock value', '=(C%d+C%d)/2' % (r, r + 1), '#,##0'), ('Inventory turnover (this month)', '=IFERROR(L%d/C%d,0)' % (t, r + 2), '0.00'), ('Days of stock', '=IFERROR($C$2/C%d,0)' % (r + 3), '0.0')]
    for k, (label, formula, fm) in enumerate(summary):
        s.merge_cells('A%d:B%d' % (r + k, r + k)); put(s, 'A%d' % (r + k), label, bold=True); put(s, 'C%d' % (r + k), formula, fm)
    widths(s, dict(A=8, B=20, C=11, D=8, E=8, F=10, G=11, H=11, I=13, J=10, K=13, L=13)); s.freeze_panes = 'C5'; s.print_area = 'A1:L%d' % (r + 4); page(s)
    a = wb.create_sheet('ABC', 1)
    header(a, 1, 1, ['Rank', 'Product', 'Cost of goods sold', 'Cumulative share', 'Class'])
    for k in range(len(ITEMS)):
        n = k + 2
        put(a, 'A%d' % n, k + 1); put(a, 'C%d' % n, '=LARGE(Stock!$L$5:$L$%d,A%d)' % (last, n), '#,##0'); put(a, 'B%d' % n, '=INDEX(Stock!$B$5:$B$%d,MATCH(C%d,Stock!$L$5:$L$%d,0))' % (last, n, last))
        put(a, 'D%d' % n, '=SUM($C$2:C%d)/SUM(Stock!$L$5:$L$%d)' % (n, last), '0.0%'); put(a, 'E%d' % n, '=IF((SUM($C$2:C%d)-C%d)/SUM(Stock!$L$5:$L$%d)<0.7,"A",IF((SUM($C$2:C%d)-C%d)/SUM(Stock!$L$5:$L$%d)<0.9,"B","C"))' % (n, n, last, n, n, last))
    put(a, 'A11', 'Ranking by LARGE and MATCH assumes no two products have exactly the same cost of goods sold.', border=False).font = Font(italic=True, color='5C6880')
    widths(a, dict(A=7, B=22, C=18, D=17, E=8)); page(a)
    notes.column_dimensions['A'].width = 100
    for line in ['About this example', 'All products and figures are made up.', 'Record every receipt and issue as a new row on Movements. Do not type over the totals on Stock.', 'Reorder point = average daily use x lead time + safety stock. Average daily use comes from this period only.', 'The Stock sheet has one row per product. Add a row there when you add a product.', 'ABC classes here: A until about 70% of cost of goods sold is covered, B until about 90%, then C. Choose limits that suit your business.', 'Guide: https://gmtoolshub.com/blog/inventory-management-using-excel/']:
        notes.append([line]); notes.cell(notes.max_row, 1).alignment = Alignment(wrap_text=True)
    notes['A1'].font = Font(bold=True, size=14); page(notes, False)
    wb.properties.title = 'GM Inventory Tracker Example'; wb.properties.creator = 'GM Tools Hub'; wb.save(path)

if __name__ == '__main__':
    build_dashboard(os.path.join(DL, 'GM-Sales-Dashboard-Example.xlsx'))
    build_inventory(os.path.join(DL, 'GM-Inventory-Tracker-Example.xlsx'))
    json.dump({'dashboard': dash, 'inventory': invs}, open(os.path.join(ROOT, 'data', 'cornerstone-examples.json'), 'w', encoding='utf-8'), indent=1, default=str)
    print('dashboard:', {k: dash[k] for k in ('rows', 'sales', 'target', 'marSales', 'marTarget', 'marAch', 'marGrowth', 'marGap', 'simpleAvgAch')})
    print('march regions:', {r: (v['sales'], v['target'], round(v['sales'] / v['target'] * 100, 1)) for r, v in dash['regionsMar'].items()})
    print('months:', {m: (v['sales'], v['target'], round(v['sales'] / v['target'] * 100, 1)) for m, v in dash['months'].items()})
    print('inventory:', {k: invs[k] for k in ('moves', 'openValue', 'closeValue', 'cogs', 'turnover', 'daysOfStock')})
    for x in inv: print(' ', x['code'], x['name'], 'in', x['inQty'], 'out', x['outQty'], 'on hand', x['closing'], 'daily %.2f' % x['daily'], 'rop %.1f' % x['rop'], x['status'], 'cover %.1f' % x['cover'], 'value', x['value'], 'cogs', x['cogs'])
    for x in ranked: print('  abc', x['name'], x['cogs'], '%.1f%%' % (x['share'] * 100), x['abc'])
