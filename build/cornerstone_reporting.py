# -*- coding: utf-8 -*-
"""Example workbooks for the sales performance, monthly reporting and BI vs analytics guides. All data is made up.
Expected figures are worked out here in plain Python and compared with Excel by build/verify-reporting.ps1.
Run: python build/cornerstone_reporting.py"""
import os, json, datetime as dt
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment
from openpyxl.chart import LineChart, Reference
from openpyxl.formatting.rule import CellIsRule, FormulaRule
from cornerstone_examples import ROOT, DL, NAVY, fill, rule_fill, header, put, widths, page, table
D = dt.date

# ================= A. Sales performance scorecard =================
DAYS, DONE = 26, 16
# rep, area, target, sales to date, outlets assigned, outlets billed, invoices, product lines
REPS = [('Rep A', 'North', 1000000, 700000, 120, 54, 90, 270), ('Rep B', 'North', 900000, 540000, 150, 123, 210, 840), ('Rep C', 'South', 800000, 420000, 110, 77, 130, 325),
        ('Rep D', 'South', 1100000, 720000, 140, 98, 160, 640), ('Rep E', 'East', 700000, 350000, 100, 45, 70, 154), ('Rep F', 'East', 900000, 610000, 130, 104, 175, 700)]
PRODUCTS = [('Tea', 2400000, 1700000), ('Juice', 1800000, 980000), ('Biscuits', 1200000, 660000)]
reps = []
for name, area, t, a, uni, billed, inv, lines in REPS:
    reps.append(dict(rep=name, area=area, target=t, sales=a, outlets=uni, billed=billed, invoices=inv, lines=lines, ach=a / t, expected=t * DONE / DAYS, pace=a / (t * DONE / DAYS), required=(t - a) / (DAYS - DONE), projection=a / DONE * DAYS, projAch=a / DONE * DAYS / t, coverage=billed / uni, invValue=a / inv, linesPerInv=lines / inv))
S = lambda k: sum(r[k] for r in reps)
sales = dict(days=DAYS, done=DONE, timeGone=DONE / DAYS, reps=reps, target=S('target'), sales=S('sales'), outlets=S('outlets'), billed=S('billed'), invoices=S('invoices'), lines=S('lines'))
sales.update(ach=sales['sales'] / sales['target'], pace=sales['sales'] / (sales['target'] * DONE / DAYS), required=(sales['target'] - sales['sales']) / (DAYS - DONE), projection=sales['sales'] / DONE * DAYS, currentPerDay=sales['sales'] / DONE, coverage=sales['billed'] / sales['outlets'], invValue=sales['sales'] / sales['invoices'], linesPerInv=sales['lines'] / sales['invoices'])
sales['projAch'] = sales['projection'] / sales['target']
sales['products'] = [dict(name=n, target=t, sales=a, ach=a / t, mix=a / sales['sales'], targetMix=t / sales['target']) for n, t, a in PRODUCTS]
assert sum(p[1] for p in PRODUCTS) == sales['target'] and sum(p[2] for p in PRODUCTS) == sales['sales']

def build_sales(path):
    wb = Workbook(); s = wb.active; s.title = 'Scorecard'; data = wb.create_sheet('Data'); notes = wb.create_sheet('Notes')
    header(data, 1, 1, ['Rep', 'Area', 'Month target', 'Sales to date', 'Outlets assigned', 'Outlets billed', 'Invoices', 'Product lines'])
    for r in REPS: data.append(list(r))
    for n in range(2, 8): data.cell(n, 3).number_format = data.cell(n, 4).number_format = '#,##0'
    header(data, 10, 1, ['Product', 'Month target', 'Sales to date'])
    for i, p in enumerate(PRODUCTS):
        data.cell(11 + i, 1, p[0]); data.cell(11 + i, 2, p[1]).number_format = '#,##0'; data.cell(11 + i, 3, p[2]).number_format = '#,##0'
    widths(data, dict(A=10, B=14, C=14, D=14, E=17, F=15, G=10, H=14)); page(data)
    s.merge_cells('A1:M1'); put(s, 'A1', 'Sales performance scorecard (sample data)', border=False).font = Font(bold=True, size=16, color=NAVY); s.row_dimensions[1].height = 26
    put(s, 'A2', 'Selling days in month', bold=True, border=False); put(s, 'C2', DAYS); put(s, 'D2', 'Days completed', bold=True, border=False); put(s, 'F2', DONE); put(s, 'G2', 'Time gone', bold=True, border=False); put(s, 'I2', '=IFERROR(F2/C2,0)', '0.0%')
    for c in ('C2', 'F2'): s[c].fill = fill('FFF4CC')
    header(s, 4, 1, ['Rep', 'Target', 'Sales to date', 'Achieved', 'Expected by today', 'Pace', 'Needed per remaining day', 'Month-end projection', 'Projected achievement', 'Outlets billed', 'Coverage', 'Average invoice', 'Lines per invoice'])
    s.row_dimensions[4].height = 32
    for i in range(len(REPS)):
        n, d = 5 + i, 2 + i
        cells = [('=Data!A%d' % d, None), ('=Data!C%d' % d, '#,##0'), ('=Data!D%d' % d, '#,##0'), ('=IFERROR(C%d/B%d,0)' % (n, n), '0.0%'), ('=B%d*$I$2' % n, '#,##0'), ('=IFERROR(C%d/E%d,0)' % (n, n), '0.0%'),
                 ('=IF($C$2>$F$2,MAX(B%d-C%d,0)/($C$2-$F$2),0)' % (n, n), '#,##0'), ('=IFERROR(C%d/$F$2*$C$2,0)' % n, '#,##0'), ('=IFERROR(H%d/B%d,0)' % (n, n), '0.0%'), ('=Data!F%d' % d, '0'),
                 ('=IFERROR(Data!F%d/Data!E%d,0)' % (d, d), '0.0%'), ('=IFERROR(C%d/Data!G%d,0)' % (n, d), '#,##0'), ('=IFERROR(Data!H%d/Data!G%d,0)' % (d, d), '0.0')]
        for k, (f, fm) in enumerate(cells): put(s, '%s%d' % ('ABCDEFGHIJKLM'[k], n), f, fm)
    t = 11
    team = {'A': ('Team', None), 'B': ('=SUM(B5:B10)', '#,##0'), 'C': ('=SUM(C5:C10)', '#,##0'), 'D': ('=IFERROR(C11/B11,0)', '0.0%'), 'E': ('=B11*$I$2', '#,##0'), 'F': ('=IFERROR(C11/E11,0)', '0.0%'), 'G': ('=IF($C$2>$F$2,MAX(B11-C11,0)/($C$2-$F$2),0)', '#,##0'), 'H': ('=IFERROR(C11/$F$2*$C$2,0)', '#,##0'), 'I': ('=IFERROR(H11/B11,0)', '0.0%'), 'J': ('=SUM(J5:J10)', '0'), 'K': ('=IFERROR(J11/SUM(Data!E2:E7),0)', '0.0%'), 'L': ('=IFERROR(C11/SUM(Data!G2:G7),0)', '#,##0'), 'M': ('=IFERROR(SUM(Data!H2:H7)/SUM(Data!G2:G7),0)', '0.0')}
    for col, (f, fm) in team.items(): put(s, '%s%d' % (col, t), f, fm, True)
    s.conditional_formatting.add('F5:F10', CellIsRule(operator='greaterThanOrEqual', formula=['1'], fill=rule_fill('D9F2E6')))
    s.conditional_formatting.add('F5:F10', CellIsRule(operator='lessThan', formula=['0.9'], fill=rule_fill('FBDADA')))
    header(s, 13, 1, ['Product', 'Target', 'Sales to date', 'Achieved', 'Share of sales', 'Share of target'])
    s.row_dimensions[13].height = 28
    for i in range(3):
        n, d = 14 + i, 11 + i
        for col, f, fm in (('A', '=Data!A%d' % d, None), ('B', '=Data!B%d' % d, '#,##0'), ('C', '=Data!C%d' % d, '#,##0'), ('D', '=IFERROR(C%d/B%d,0)' % (n, n), '0.0%'), ('E', '=IFERROR(C%d/SUM($C$14:$C$16),0)' % n, '0.0%'), ('F', '=IFERROR(B%d/SUM($B$14:$B$16),0)' % n, '0.0%')): put(s, '%s%d' % (col, n), f, fm)
    put(s, 'A17', 'Check', bold=True); s.merge_cells('B17:F17'); put(s, 'B17', '=IF(AND(SUM(C14:C16)=C11,SUM(B14:B16)=B11),"Product totals match rep totals","CHECK: product and rep totals differ")')
    widths(s, dict(A=9, B=11, C=11, D=10, E=12, F=10, G=13, H=13, I=13, J=9, K=10, L=10, M=9)); s.freeze_panes = 'B5'; s.print_area = 'A1:M17'; page(s)
    notes.column_dimensions['A'].width = 100
    for line in ['About this example', 'All names and figures are made up.', 'Enter selling days and days completed in the yellow cells. Pace compares sales with the share of the target that matches the share of selling days gone. It assumes sales arrive evenly through the month; adjust if yours do not.', 'Coverage = outlets billed at least once so far / outlets assigned. Count each outlet once.', 'Pace colours: green at 100% or more, red below 90%. These limits are examples.', 'Guide: https://gmtoolshub.com/blog/sales-performance-dashboard-measures/']:
        notes.append([line]); notes.cell(notes.max_row, 1).alignment = Alignment(wrap_text=True)
    notes['A1'].font = Font(bold=True, size=14); page(notes, False)
    wb.properties.title = 'GM Sales Performance Example'; wb.properties.creator = 'GM Tools Hub'; wb.save(path)

# ================= B. Monthly report that picks up new months =================
CATS = [('Revenue', 'Product sales'), ('Revenue', 'Service income'), ('Cost of goods', 'Materials'), ('Cost of goods', 'Freight'), ('Operating expenses', 'Salaries'), ('Operating expenses', 'Rent'), ('Operating expenses', 'Other')]
PS = [820000, 790000, 880000, 905000, 870000, 960000]; PSB = [800000, 820000, 850000, 880000, 900000, 920000]
ACT = [PS, [110000, 115000, 108000, 125000, 132000, 128000], [round(v * r) for v, r in zip(PS, [.55, .56, .545, .55, .575, .565])], [41000, 39500, 43800, 45200, 47900, 50300], [180000, 180000, 182000, 182000, 188000, 188000], [60000] * 6, [52000, 47000, 55000, 49000, 61000, 66000]]
BUD = [PSB, [110000, 112000, 114000, 116000, 118000, 120000], [round(v * .55) for v in PSB], [40000, 41000, 42500, 44000, 45000, 46000], [180000, 180000, 184000, 184000, 184000, 184000], [60000] * 6, [50000] * 6]
rows = [(D(2026, m + 1, 1), CATS[c][0], CATS[c][1], ACT[c][m], BUD[c][m]) for m in range(6) for c in range(len(CATS))]
def month_figs(m, src):
    v = lambda line: sum(src[c][m] for c in range(len(CATS)) if CATS[c][0] == line)
    rev, cogs, opex = v('Revenue'), v('Cost of goods'), v('Operating expenses')
    return dict(revenue=rev, cogs=cogs, gross=rev - cogs, margin=(rev - cogs) / rev, opex=opex, profit=rev - cogs - opex)
months = [dict(actual=month_figs(m, ACT), budget=month_figs(m, BUD), control=sum(ACT[c][m] for c in range(len(CATS)))) for m in range(6)]
def fit(xs, ys):
    n = len(xs); mx = sum(xs) / n; my = sum(ys) / n
    b = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs)
    return my - b * mx, b
revs = [m['actual']['revenue'] for m in months]
a6, b6 = fit(range(1, 7), revs); a5, b5 = fit(range(1, 6), revs[:5])
report = dict(rows=len(rows), months=months, forecast7=a6 + b6 * 7, slope=b6, backtest6=a5 + b5 * 6, actual6=revs[5], backtestError=(a5 + b5 * 6) / revs[5] - 1, revenues=revs)

def build_report(path):
    wb = Workbook(); r = wb.active; r.title = 'Report'; data = wb.create_sheet('Data'); ctl = wb.create_sheet('Control'); an = wb.create_sheet('Analytics'); notes = wb.create_sheet('Notes')
    header(data, 1, 1, ['Month', 'Line', 'Category', 'Actual', 'Budget'])
    for row in rows: data.append(list(row))
    for n in range(2, len(rows) + 2):
        data.cell(n, 1).number_format = 'mmm-yyyy'; data.cell(n, 4).number_format = data.cell(n, 5).number_format = '#,##0'
    widths(data, dict(A=11, B=20, C=17, D=12, E=12)); data.freeze_panes = 'A2'; page(data, False); data.page_setup.fitToHeight = 0
    header(ctl, 1, 1, ['Month', 'Control total from accounts (all actual lines)'])
    for i, m in enumerate(months): put(ctl, 'A%d' % (i + 2), D(2026, i + 1, 1), 'mmm-yyyy'); put(ctl, 'B%d' % (i + 2), m['control'], '#,##0')
    widths(ctl, dict(A=11, B=44)); page(ctl, False)
    MON, LINE, CAT, ACTR, BUDR = ('Data!$%s$2:$%s$2000' % (c, c) for c in 'ABCDE')
    widths(r, dict(A=36, B=15, C=15, D=15, E=14, F=15, G=14))
    r.merge_cells('A1:G1'); put(r, 'A1', 'Monthly management report (sample data)', border=False).font = Font(bold=True, size=16, color=NAVY); r.row_dimensions[1].height = 26
    put(r, 'A2', 'Report month', bold=True); put(r, 'B2', '=MAX(%s)' % MON, 'mmm-yyyy', True)
    put(r, 'A3', 'Status', bold=True); r.merge_cells('B3:G3'); put(r, 'B3', '=IF(COUNTIF(B19:B23,"Pass")=5,"READY: all checks pass","DO NOT SEND: check the list below")', bold=True)
    header(r, 5, 1, ['Measure', 'Actual', 'Budget', 'Variance', 'Against budget', 'Prior month', 'Change'])
    def s(rng, line, month): return 'SUMIFS(%s,%s,%s,%s,"%s")' % (rng, MON, month, LINE, line)
    prior = 'EDATE($B$2,-1)'
    lay = [(6, 'Revenue', 'line', 'Revenue', 1), (7, 'Cost of goods', 'line', 'Cost of goods', -1), (8, 'Gross profit', 'calc', ('{c}6-{c}7'), 1), (9, 'Gross margin', 'calc', 'IFERROR({c}8/{c}6,0)', 1), (10, 'Operating expenses', 'line', 'Operating expenses', -1), (11, 'Operating profit', 'calc', '{c}8-{c}10', 1)]
    for row, label, kind, spec, good in lay:
        put(r, 'A%d' % row, label, bold=True)
        for col, rng, month in (('B', ACTR, '$B$2'), ('C', BUDR, '$B$2'), ('F', ACTR, prior)):
            f = '=' + (s(rng, spec, month) if kind == 'line' else spec.format(c=col))
            put(r, '%s%d' % (col, row), f, '0.0%' if label == 'Gross margin' else '#,##0')
        pct = label == 'Gross margin'
        put(r, 'D%d' % row, '=B%d-C%d' % (row, row), '+0.0%;-0.0%;0.0%' if pct else '+#,##0;-#,##0;0')
        put(r, 'E%d' % row, '=IF(ROUND(D%d,6)=0,"On budget",IF(D%d*%d>0,"Favourable","Adverse"))' % (row, row, good))
        put(r, 'G%d' % row, ('=B%d-F%d' % (row, row)) if pct else '=IF(F%d=0,"n/a",B%d/F%d-1)' % (row, row, row), '+0.0%;-0.0%;0.0%')
    r.conditional_formatting.add('E6:E11', CellIsRule(operator='equal', formula=['"Favourable"'], fill=rule_fill('D9F2E6')))
    r.conditional_formatting.add('E6:E11', CellIsRule(operator='equal', formula=['"Adverse"'], fill=rule_fill('FBDADA')))
    put(r, 'A12', 'For gross margin, the variance and change are percentage-point differences.', border=False).font = Font(italic=True, size=9, color='5C6880')
    put(r, 'A13', 'Draft commentary', bold=True, border=False)
    r.merge_cells('A14:G14'); put(r, 'A14', '="Revenue was "&TEXT(B6,"#,##0")&", "&TEXT(ABS(IFERROR(B6/C6-1,0)),"0.0%")&IF(B6>=C6," above"," below")&" budget and "&TEXT(ABS(IFERROR(B6/F6-1,0)),"0.0%")&IF(B6>=F6," up"," down")&" on the prior month."', border=False)
    r.merge_cells('A15:G15'); put(r, 'A15', '="Operating profit was "&TEXT(B11,"#,##0")&", "&TEXT(ABS(D11),"#,##0")&IF(D11>=0," above"," below")&" budget. Gross margin was "&TEXT(B9,"0.0%")&" against a budget of "&TEXT(C9,"0.0%")&"."', border=False)
    for c in ('A14', 'A15'): r[c].alignment = Alignment(wrap_text=True, vertical='top'); r.row_dimensions[int(c[1:])].height = 18
    header(r, 18, 1, ['Check', 'Result'])
    checks = [('7 rows for the report month', '=IF(COUNTIFS(%s,$B$2)=7,"Pass","Fail")' % MON),
              ('Each category appears once', '=IF(SUMPRODUCT((COUNTIFS(%s,$B$2,%s,Notes!$A$12:$A$18)=1)*1)=7,"Pass","Fail")' % (MON, CAT)),
              ('Line names are recognised', '=IF(COUNTIFS(%s,$B$2,%s,"Revenue")+COUNTIFS(%s,$B$2,%s,"Cost of goods")+COUNTIFS(%s,$B$2,%s,"Operating expenses")=COUNTIFS(%s,$B$2),"Pass","Fail")' % (MON, LINE, MON, LINE, MON, LINE, MON)),
              ('No blank actual or budget', '=IF(COUNTIFS(%s,$B$2,%s,"")+COUNTIFS(%s,$B$2,%s,"")=0,"Pass","Fail")' % (MON, ACTR, MON, BUDR)),
              ('Actuals match the accounts control total', '=IF(ABS(SUMIFS(%s,%s,$B$2)-SUMIFS(Control!$B$2:$B$200,Control!$A$2:$A$200,$B$2))<0.5,"Pass","Fail")' % (ACTR, MON))]
    for i, (label, f) in enumerate(checks): put(r, 'A%d' % (19 + i), label); put(r, 'B%d' % (19 + i), f)
    r.conditional_formatting.add('B19:B23', CellIsRule(operator='equal', formula=['"Fail"'], fill=rule_fill('FBDADA')))
    r.conditional_formatting.add('B19:B23', CellIsRule(operator='equal', formula=['"Pass"'], fill=rule_fill('D9F2E6')))
    r.conditional_formatting.add('B3', FormulaRule(formula=['LEFT($B$3,5)="READY"'], fill=rule_fill('D9F2E6')))
    r.conditional_formatting.add('B3', FormulaRule(formula=['LEFT($B$3,5)<>"READY"'], fill=rule_fill('FBDADA')))
    r.print_area = 'A1:G23'; page(r)
    header(an, 1, 1, ['Month number', 'Month', 'Revenue', 'Trend line'])
    for i in range(6):
        n = i + 2
        put(an, 'A%d' % n, i + 1); put(an, 'B%d' % n, D(2026, i + 1, 1), 'mmm-yyyy'); put(an, 'C%d' % n, '=SUMIFS(%s,%s,B%d,%s,"Revenue")' % (ACTR, MON, n, LINE), '#,##0'); put(an, 'D%d' % n, '=_xlfn.FORECAST.LINEAR(A%d,$C$2:$C$7,$A$2:$A$7)' % n, '#,##0')
    put(an, 'A9', 'Straight-line forecast for month 7', bold=True, border=False); put(an, 'D9', '=_xlfn.FORECAST.LINEAR(7,C2:C7,A2:A7)', '#,##0', True)
    put(an, 'A10', 'Average change per month on the line', bold=True, border=False); put(an, 'D10', '=SLOPE(C2:C7,A2:A7)', '#,##0')
    put(an, 'A11', 'Test: forecast month 6 using months 1 to 5', bold=True, border=False); put(an, 'D11', '=_xlfn.FORECAST.LINEAR(6,C2:C6,A2:A6)', '#,##0')
    put(an, 'A12', 'What month 6 actually was', bold=True, border=False); put(an, 'D12', '=C7', '#,##0')
    put(an, 'A13', 'Forecast error in that test', bold=True, border=False); put(an, 'D13', '=D11/D12-1', '+0.0%;-0.0%;0.0%')
    put(an, 'A15', 'Six points are far too few for a reliable forecast. This sheet shows the method and its limits.', border=False).font = Font(italic=True, color='5C6880')
    widths(an, dict(A=16, B=20, C=14, D=14)); page(an, False)
    notes.column_dimensions['A'].width = 100
    text = ['About this example', 'All figures are made up.', 'To add a month: paste its 7 rows at the bottom of Data, then add its control total on Control. The Report sheet moves to the latest month by itself.', 'The control total must come from your accounting system, typed separately. Do not calculate it from the Data sheet.', 'Formulas read Data rows 2 to 2000.', 'Months are stored as the first day of the month.', 'The commentary is a starting draft. It states what changed, not why. A person must add the reasons.', 'Analytics covers months 1 to 6 only and does not extend by itself.', 'Guide: https://gmtoolshub.com/blog/automated-monthly-business-reporting-excel/', '', 'Categories used by the checks:']
    for line in text:
        notes.append([line]); notes.cell(notes.max_row, 1).alignment = Alignment(wrap_text=True)
    assert notes.max_row == 11
    for _, cat in CATS: notes.append([cat])
    notes['A1'].font = Font(bold=True, size=14); page(notes, False)
    wb.properties.title = 'GM Monthly Report Example'; wb.properties.creator = 'GM Tools Hub'; wb.save(path)

if __name__ == '__main__':
    build_sales(os.path.join(DL, 'GM-Sales-Performance-Example.xlsx'))
    build_report(os.path.join(DL, 'GM-Monthly-Report-Example.xlsx'))
    json.dump({'sales': sales, 'report': report}, open(os.path.join(ROOT, 'data', 'cornerstone-reporting.json'), 'w', encoding='utf-8'), indent=1, default=str)
    print('sales: time gone %.1f%% | ach %.1f%% pace %.1f%% | sales %d of %d | per day now %.0f needed %.0f | projection %.0f (%.1f%%) | coverage %.1f%% (%d of %d) | inv %.0f lines %.2f' % (sales['timeGone']*100, sales['ach']*100, sales['pace']*100, sales['sales'], sales['target'], sales['currentPerDay'], sales['required'], sales['projection'], sales['projAch']*100, sales['coverage']*100, sales['billed'], sales['outlets'], sales['invValue'], sales['linesPerInv']))
    for r_ in reps: print('  %s %s ach %.1f pace %.1f need %.0f proj %.0f (%.1f) cov %.1f inv %.0f lines %.1f' % (r_['rep'], r_['area'], r_['ach']*100, r_['pace']*100, r_['required'], r_['projection'], r_['projAch']*100, r_['coverage']*100, r_['invValue'], r_['linesPerInv']))
    for p in sales['products']: print('  %s ach %.1f mix %.1f target mix %.1f' % (p['name'], p['ach']*100, p['mix']*100, p['targetMix']*100))
    for i, m in enumerate(months): print('  month %d actual' % (i+1), {k: (round(v*100,2) if k=='margin' else v) for k, v in m['actual'].items()}, '| budget', {k: (round(v*100,2) if k=='margin' else v) for k, v in m['budget'].items()})
    print('forecast7 %.0f slope %.0f | backtest6 %.0f actual %d error %.1f%%' % (report['forecast7'], report['slope'], report['backtest6'], report['actual6'], report['backtestError']*100))
