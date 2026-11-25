# -*- coding: utf-8 -*-
"""Example workbooks for the attendance tracking guide and the HR attendance dashboard guide.
All people and figures are made up. The weekend, holiday and leave rules are EXAMPLES, not anyone's policy.
Expected figures are worked out here in plain Python and compared with Excel by build/verify-attendance.ps1.
Run: python build/cornerstone_attendance.py"""
import os, json, datetime as dt
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment
from openpyxl.chart import BarChart, Reference
from openpyxl.formatting.rule import CellIsRule, FormulaRule
from openpyxl.worksheet.datavalidation import DataValidation
from cornerstone_examples import ROOT, DL, NAVY, fill, rule_fill, header, put, widths, page, table

D = dt.date
# ================= A. Monthly attendance tracker (exceptions log) =================
STAFF = [('E01', 'Ayesha K.', 'Operations'), ('E02', 'Bilal R.', 'Operations'), ('E03', 'Celine D.', 'Operations'), ('E04', 'Danish M.', 'Sales'),
         ('E05', 'Erum S.', 'Sales'), ('E06', 'Farhan T.', 'Accounts'), ('E07', 'Gul N.', 'Accounts'), ('E08', 'Hamza A.', 'Operations')]
HOLIDAYS = [(D(2026, 3, 23), 'Example holiday')]
CODES = [('AL', 'Approved annual leave', 1, 1), ('SL', 'Approved sick leave', 1, 1), ('HD', 'Half day, approved', 0.5, 0.5), ('UA', 'Unapproved absence', 1, 0), ('LT', 'Late arrival (present)', 0, 0)]  # code, meaning, days away, approved days
LOG = [(D(2026, 3, 2), 'E02', 'LT', 20), (D(2026, 3, 3), 'E04', 'SL', 0), (D(2026, 3, 4), 'E04', 'SL', 0), (D(2026, 3, 5), 'E01', 'HD', 0), (D(2026, 3, 9), 'E03', 'AL', 0), (D(2026, 3, 10), 'E03', 'AL', 0), (D(2026, 3, 11), 'E03', 'AL', 0),
       (D(2026, 3, 11), 'E02', 'LT', 35), (D(2026, 3, 12), 'E05', 'UA', 0), (D(2026, 3, 13), 'E08', 'LT', 15), (D(2026, 3, 16), 'E02', 'UA', 0), (D(2026, 3, 17), 'E07', 'AL', 0), (D(2026, 3, 18), 'E07', 'AL', 0), (D(2026, 3, 19), 'E02', 'LT', 25),
       (D(2026, 3, 24), 'E05', 'HD', 0), (D(2026, 3, 25), 'E08', 'SL', 0), (D(2026, 3, 26), 'E02', 'UA', 0), (D(2026, 3, 27), 'E06', 'LT', 10), (D(2026, 3, 30), 'E01', 'AL', 0)]
OUTPUT = {'E01': (151, 906), 'E02': (140, 700), 'E03': (136, 884), 'E08': (156, 936)}  # Operations only: hours worked, orders processed

hol = {h for h, _ in HOLIDAYS}
working = [D(2026, 3, d) for d in range(1, 32) if D(2026, 3, d).weekday() < 5 and D(2026, 3, d) not in hol]
assert all(d in working for d, *_ in LOG), 'a log date is not a working day'
assert len({(d, e) for d, e, *_ in LOG}) == len(LOG), 'two entries for one person on one day'
code = {c[0]: c for c in CODES}
summary = []
for eid, name, dept in STAFF:
    mine = [x for x in LOG if x[1] == eid]
    count = lambda c: sum(1 for x in mine if x[2] == c)
    away = sum(code[x[2]][2] for x in mine); approved = sum(code[x[2]][3] for x in mine); present = len(working) - away
    summary.append(dict(id=eid, name=name, dept=dept, working=len(working), AL=count('AL'), SL=count('SL'), HD=count('HD'), UA=count('UA'), LT=count('LT'), lateMin=sum(x[3] for x in mine), approved=approved, present=present,
                        att=present / len(working), adj=present / (len(working) - approved)))
tp = sum(s['present'] for s in summary); tw = sum(s['working'] for s in summary); ta = sum(s['approved'] for s in summary)
prod = [dict(id=k, hours=h, orders=o, perHour=o / h) for k, (h, o) in OUTPUT.items()]
trk = dict(workingDays=len(working), staff=len(STAFF), entries=len(LOG), summary=summary, teamPresent=tp, teamWorking=tw, teamApproved=ta, teamAtt=tp / tw, teamAdj=tp / (tw - ta),
           teamUA=sum(s['UA'] for s in summary), teamLT=sum(s['LT'] for s in summary), productivity=prod, opsHours=sum(p['hours'] for p in prod), opsOrders=sum(p['orders'] for p in prod))
trk['opsPerHour'] = trk['opsOrders'] / trk['opsHours']

def build_tracker(path):
    wb = Workbook(); s = wb.active; s.title = 'Summary'
    emp = wb.create_sheet('Employees'); log = wb.create_sheet('Log'); st = wb.create_sheet('Settings'); pr = wb.create_sheet('Productivity'); notes = wb.create_sheet('Notes')
    header(emp, 1, 1, ['ID', 'Name', 'Department'])
    for r in STAFF: emp.append(list(r))
    widths(emp, dict(A=8, B=18, C=16)); table(emp, 'Employees', 'A1:C%d' % (len(STAFF) + 1)); page(emp, False)
    header(st, 1, 1, ['Month start', 'Month end', 'Working days'])
    put(st, 'A2', D(2026, 3, 1), 'dd-mmm-yyyy'); put(st, 'B2', '=EOMONTH(A2,0)', 'dd-mmm-yyyy'); put(st, 'C2', '=NETWORKDAYS.INTL(A2,B2,1,$A$6:$A$30)')
    header(st, 5, 1, ['Holiday', 'Name'])
    for i, (h, n) in enumerate(HOLIDAYS): put(st, 'A%d' % (6 + i), h, 'dd-mmm-yyyy'); put(st, 'B%d' % (6 + i), n)
    header(st, 5, 4, ['Code', 'Meaning', 'Days away', 'Approved days'])
    for i, c in enumerate(CODES):
        for k, v in enumerate(c): put(st, '%s%d' % ('DEFG'[k], 6 + i), v)
    widths(st, dict(A=15, B=17, C=14, D=8, E=26, F=11, G=14)); page(st)
    header(log, 1, 1, ['Date', 'ID', 'Code', 'Late minutes', 'Days away', 'Approved days', 'Check'])
    for n, (d, e, c, m) in enumerate(LOG, start=2):
        log.append([d, e, c, m or None,
                    '=IFERROR(INDEX(Settings!$F$6:$F$10,MATCH(C%d,Settings!$D$6:$D$10,0)),0)' % n, '=IFERROR(INDEX(Settings!$G$6:$G$10,MATCH(C%d,Settings!$D$6:$D$10,0)),0)' % n,
                    '=IF(COUNTIF(Employees!$A$2:$A$200,B{n})=0,"Unknown ID",IF(COUNTIF(Settings!$D$6:$D$10,C{n})=0,"Unknown code",IF(OR(A{n}<Settings!$A$2,A{n}>Settings!$B$2),"Outside month",IF(NETWORKDAYS.INTL(A{n},A{n},1,Settings!$A$6:$A$30)=0,"Not a working day",IF(COUNTIFS($A$2:$A$1000,A{n},$B$2:$B$1000,B{n})>1,"Duplicate","OK")))))'.format(n=n)])
        log.cell(n, 1).number_format = 'dd-mmm-yyyy'
    for col in ('G',):
        pass
    for n in range(2, len(LOG) + 2):
        for c in (log.cell(n, 5), log.cell(n, 6)): c.number_format = '0.0'
        x = log.cell(n, 7).value.replace('NETWORKDAYS.INTL(', '_xlfn.NETWORKDAYS.INTL('); log.cell(n, 7).value = x
    st['C2'] = '=_xlfn.NETWORKDAYS.INTL(A2,B2,1,$A$6:$A$30)'
    widths(log, dict(A=13, B=7, C=7, D=13, E=11, F=14, G=18)); log.freeze_panes = 'A2'; table(log, 'Log', 'A1:G%d' % (len(LOG) + 1))
    for dv, rng in ((DataValidation(type='list', formula1='Employees!$A$2:$A$200', showErrorMessage=True), 'B2:B1000'), (DataValidation(type='list', formula1='Settings!$D$6:$D$10', showErrorMessage=True), 'C2:C1000'), (DataValidation(type='whole', operator='between', formula1='0', formula2='600', showErrorMessage=True), 'D2:D1000')):
        log.add_data_validation(dv); dv.add(rng)
    log.conditional_formatting.add('G2:G1000', FormulaRule(formula=['AND($G2<>"",$G2<>"OK")'], fill=rule_fill('FBDADA')))
    page(log, False); log.page_setup.fitToHeight = 0
    s.merge_cells('A1:N1'); put(s, 'A1', 'Attendance summary for March 2026 (sample data, example rules)', border=False).font = Font(bold=True, size=16, color=NAVY); s.row_dimensions[1].height = 26
    put(s, 'A2', 'Log entries needing attention:', bold=True, border=False); put(s, 'D2', '=COUNTA(Log!$B$2:$B$1000)-COUNTIF(Log!$G$2:$G$1000,"OK")', '0', True)
    s.conditional_formatting.add('D2', CellIsRule(operator='greaterThan', formula=['0'], fill=rule_fill('FBDADA')))
    header(s, 4, 1, ['ID', 'Name', 'Department', 'Working days', 'Annual leave', 'Sick leave', 'Half days', 'Unapproved', 'Late arrivals', 'Late minutes', 'Approved days', 'Days present', 'Attendance', 'Excluding approved leave'])
    s.row_dimensions[4].height = 32
    for i in range(len(STAFF)):
        n, e = 5 + i, 2 + i
        cnt = lambda c: '=COUNTIFS(Log!$B$2:$B$1000,$A%d,Log!$C$2:$C$1000,"%s")' % (n, c)
        cells = [('=Employees!A%d' % e, None), ('=Employees!B%d' % e, None), ('=Employees!C%d' % e, None), ('=Settings!$C$2', None), (cnt('AL'), None), (cnt('SL'), None), (cnt('HD'), None), (cnt('UA'), None), (cnt('LT'), None),
                 ('=SUMIFS(Log!$D$2:$D$1000,Log!$B$2:$B$1000,$A%d)' % n, None), ('=SUMIFS(Log!$F$2:$F$1000,Log!$B$2:$B$1000,$A%d)' % n, '0.0'), ('=D%d-SUMIFS(Log!$E$2:$E$1000,Log!$B$2:$B$1000,$A%d)' % (n, n), '0.0'),
                 ('=IFERROR(L%d/D%d,0)' % (n, n), '0.0%'), ('=IFERROR(L%d/(D%d-K%d),0)' % (n, n, n), '0.0%')]
        for k, (f, fm) in enumerate(cells): put(s, '%s%d' % ('ABCDEFGHIJKLMN'[k], n), f, fm)
    last = 4 + len(STAFF); t = last + 1
    put(s, 'A%d' % t, 'Team', bold=True)
    for col in 'DEFGHIJKL': put(s, '%s%d' % (col, t), '=SUM(%s5:%s%d)' % (col, col, last), '0.0' if col in 'KL' else '0', True)
    put(s, 'M%d' % t, '=IFERROR(L%d/D%d,0)' % (t, t), '0.0%', True); put(s, 'N%d' % t, '=IFERROR(L%d/(D%d-K%d),0)' % (t, t, t), '0.0%', True)
    s.conditional_formatting.add('H5:H%d' % last, CellIsRule(operator='greaterThan', formula=['0'], fill=rule_fill('FFF0C2')))
    widths(s, dict(A=7, B=14, C=13, D=10, E=9, F=8, G=8, H=12, I=9, J=9, K=10, L=9, M=12, N=14)); s.freeze_panes = 'C5'; s.print_area = 'A1:N%d' % t; page(s)
    header(pr, 1, 1, ['ID', 'Name', 'Hours worked', 'Orders processed', 'Orders per hour'])
    for i, p in enumerate(prod):
        n = 2 + i
        put(pr, 'A%d' % n, p['id']); put(pr, 'B%d' % n, '=INDEX(Employees!$B$2:$B$200,MATCH(A%d,Employees!$A$2:$A$200,0))' % n); put(pr, 'C%d' % n, p['hours']); put(pr, 'D%d' % n, p['orders'], '#,##0'); put(pr, 'E%d' % n, '=IFERROR(D%d/C%d,0)' % (n, n), '0.00')
    t2 = 2 + len(prod); put(pr, 'A%d' % t2, 'Team', bold=True); put(pr, 'C%d' % t2, '=SUM(C2:C%d)' % (t2 - 1), '#,##0', True); put(pr, 'D%d' % t2, '=SUM(D2:D%d)' % (t2 - 1), '#,##0', True); put(pr, 'E%d' % t2, '=IFERROR(D%d/C%d,0)' % (t2, t2), '0.00', True)
    put(pr, 'A%d' % (t2 + 2), 'Operations team only. Hours and orders are typed in for this example and are not calculated from the attendance log.', border=False).font = Font(italic=True, color='5C6880')
    widths(pr, dict(A=8, B=16, C=13, D=17, E=16)); page(pr)
    notes.column_dimensions['A'].width = 100
    for line in ['About this example', 'All people and figures are made up. The weekend (Saturday and Sunday), the holiday and the leave codes are examples. Replace them with your own approved rules.', 'This is an exceptions log: everyone counts as present unless a row says otherwise. A missing entry therefore raises attendance. Confirm each month that all absences were entered.', 'One row per person per day. Check that "Log entries needing attention" is 0 before using the summary.', 'The Summary sheet has one row per employee. Add a row there when you add a person. It does not handle joiners or leavers part-way through a month.', 'Attendance records are personal data. Limit who can open this file. Do not record medical details.', 'Guide: https://gmtoolshub.com/blog/employee-attendance-productivity-tracking-excel/']:
        notes.append([line]); notes.cell(notes.max_row, 1).alignment = Alignment(wrap_text=True)
    notes['A1'].font = Font(bold=True, size=14); page(notes, False)
    wb.properties.title = 'GM Attendance Tracker Example'; wb.properties.creator = 'GM Tools Hub'; wb.save(path)

# ================= B. HR attendance dashboard =================
MONTHS = ['Jan', 'Feb', 'Mar']; WD = {'Jan': 22, 'Feb': 20, 'Mar': 21}
DEPTS = {'Operations': 14, 'Sales': 9, 'Accounts': 4, 'Warehouse': 11}
rows = []
i = 0
for dept, n in DEPTS.items():
    for k in range(n):
        i += 1; eid = 'H%02d' % i
        for mi, m in enumerate(MONTHS):
            seed = (i * 7 + mi * 5) % 23
            al = [0, 0, 1, 0, 2, 0, 0, 1, 0, 0, 3, 0, 1, 0, 0, 0, 1, 0, 2, 0, 0, 1, 0][seed]
            ua = 1 if (seed in (3, 11) or (dept == 'Warehouse' and mi == 2 and k in (1, 4, 7))) else 0
            if dept == 'Warehouse' and mi == 2 and k == 4: ua = 3
            late = [0, 1, 0, 0, 2, 0, 1, 0, 0, 3, 0, 0, 1, 0, 0, 0, 2, 0, 0, 1, 0, 0, 1][(i * 3 + mi) % 23]
            rows.append((m, eid, dept, WD[m], WD[m] - al - ua, al, ua, late))
def agg(**k):
    idx = {'month': 0, 'dept': 2}
    sel = [r for r in rows if all(r[idx[a]] == b for a, b in k.items())]
    w, p, a, u, l = (sum(r[j] for r in sel) for j in (3, 4, 5, 6, 7))
    return dict(people=len({r[1] for r in sel}), working=w, present=p, approved=a, ua=u, late=l, att=p / w, adj=p / (w - a), ua2=sum(1 for r in sel if r[6] >= 2))
dash = dict(rows=len(rows), months={m: agg(month=m) for m in MONTHS}, deptMar={d: agg(month='Mar', dept=d) for d in DEPTS})
dash['simpleAvgMar'] = sum(v['att'] for v in dash['deptMar'].values()) / len(DEPTS)

def build_hr(path):
    wb = Workbook(); d = wb.active; d.title = 'Dashboard'; data = wb.create_sheet('Data'); calc = wb.create_sheet('Calc'); notes = wb.create_sheet('Notes')
    header(data, 1, 1, ['Month', 'Employee ID', 'Department', 'Working days', 'Days present', 'Approved leave days', 'Unapproved days', 'Late arrivals', 'Row check'])
    for n, r in enumerate(rows, start=2):
        data.append(list(r) + ['=IF(D%d=E%d+F%d+G%d,"OK","CHECK")' % (n, n, n, n)])
    widths(data, dict(A=8, B=13, C=13, D=13, E=13, F=20, G=16, H=13, I=11)); data.freeze_panes = 'A2'; table(data, 'Attendance', 'A1:I%d' % (len(rows) + 1)); page(data, False); data.page_setup.fitToHeight = 0
    rng = lambda c: 'Data!$%s$2:$%s$1000' % (c, c)
    M, DEP, W, P, A, U, L = (rng(c) for c in 'ACDEFGH')
    header(calc, 1, 1, ['Month', 'Attendance', 'Excluding approved leave', 'Unapproved days'])
    for i, m in enumerate(MONTHS):
        n = i + 2
        put(calc, 'A%d' % n, m); put(calc, 'B%d' % n, '=IFERROR(SUMIFS(%s,%s,A%d)/SUMIFS(%s,%s,A%d),0)' % (P, M, n, W, M, n), '0.0%'); put(calc, 'C%d' % n, '=IFERROR(SUMIFS(%s,%s,A%d)/(SUMIFS(%s,%s,A%d)-SUMIFS(%s,%s,A%d)),0)' % (P, M, n, W, M, n, A, M, n), '0.0%'); put(calc, 'D%d' % n, '=SUMIFS(%s,%s,A%d)' % (U, M, n))
    header(calc, 1, 6, ['Check', 'Value']); put(calc, 'F2', 'Rows that do not add up'); put(calc, 'G2', '=COUNTA(%s)-COUNTIF(%s,"OK")' % (rng('B'), rng('I')))
    put(calc, 'F3', 'Minimum group size'); put(calc, 'G3', 5); calc['G3'].fill = fill('FFF4CC')
    widths(calc, dict(A=10, B=13, C=24, D=17, E=3, F=26, G=10))
    widths(d, dict(A=2, B=16, C=13, D=14, E=17, F=14, G=13, H=2))
    d.merge_cells('B1:G1'); put(d, 'B1', 'HR attendance dashboard (sample data)', border=False).font = Font(bold=True, size=18, color=NAVY); d.row_dimensions[1].height = 30
    put(d, 'B2', 'Month:', bold=True, border=False); put(d, 'C2', 'Mar', bold=True); d['C2'].fill = fill('FFF4CC')
    dv = DataValidation(type='list', formula1='"%s"' % ','.join(MONTHS), showErrorMessage=True); d.add_data_validation(dv); dv.add('C2')
    put(d, 'E2', '=IF(Calc!$G$2=0,"Data check: OK","Data check: "&Calc!$G$2&" row(s) wrong")', border=False, bold=True)
    tiles = [('B', 'People', '=COUNTIFS(%s,$C$2)' % M, '0'), ('C', 'Attendance', '=IFERROR(SUMIFS(%s,%s,$C$2)/SUMIFS(%s,%s,$C$2),0)' % (P, M, W, M), '0.0%'),
             ('D', 'Excl. approved leave', '=IFERROR(SUMIFS(%s,%s,$C$2)/(SUMIFS(%s,%s,$C$2)-SUMIFS(%s,%s,$C$2)),0)' % (P, M, W, M, A, M), '0.0%'), ('E', 'Approved leave days', '=SUMIFS(%s,%s,$C$2)' % (A, M), '#,##0'),
             ('F', 'Unapproved days', '=SUMIFS(%s,%s,$C$2)' % (U, M), '#,##0'), ('G', 'Late arrivals', '=SUMIFS(%s,%s,$C$2)' % (L, M), '#,##0')]
    for col, label, f, fm in tiles:
        c = put(d, col + '4', label); c.fill = fill(NAVY); c.font = Font(color='BCCCEC', size=9); c.alignment = Alignment(horizontal='center', wrap_text=True)
        c = put(d, col + '5', f, fm); c.font = Font(bold=True, size=17, color=NAVY); c.alignment = Alignment(horizontal='center', vertical='center'); c.fill = fill('EEF2FA')
    d.row_dimensions[4].height = 26; d.row_dimensions[5].height = 32
    header(d, 7, 2, ['Department', 'People', 'Attendance', 'Excl. approved leave', 'Unapproved days', 'People with 2+ unapproved'])
    d.row_dimensions[7].height = 30
    for i, dep in enumerate(DEPTS):
        n = 8 + i; c = '%s,$C$2,%s,$B%d' % (M, DEP, n)
        put(d, 'B%d' % n, dep); put(d, 'C%d' % n, '=COUNTIFS(%s)' % c, '0')
        small = '$C%d<Calc!$G$3' % n
        put(d, 'D%d' % n, '=IF(%s,"Hidden",IFERROR(SUMIFS(%s,%s)/SUMIFS(%s,%s),0))' % (small, P, c, W, c), '0.0%')
        put(d, 'E%d' % n, '=IF(%s,"Hidden",IFERROR(SUMIFS(%s,%s)/(SUMIFS(%s,%s)-SUMIFS(%s,%s)),0))' % (small, P, c, W, c, A, c), '0.0%')
        put(d, 'F%d' % n, '=IF(%s,"Hidden",SUMIFS(%s,%s))' % (small, U, c), '0'); put(d, 'G%d' % n, '=IF(%s,"Hidden",COUNTIFS(%s,%s,">=2"))' % (small, c, U), '0')
        for col in 'DEFG': d['%s%d' % (col, n)].alignment = Alignment(horizontal='right')
    put(d, 'B13', '="Departments with fewer than "&Calc!$G$3&" people are hidden. Totals above include them."', border=False).font = Font(italic=True, size=9, color='5C6880')
    ch = BarChart(); ch.type = 'col'; ch.title = 'Attendance by month'; ch.height = 6.0; ch.width = 16.0
    ch.add_data(Reference(calc, min_col=2, max_col=3, min_row=1, max_row=4), titles_from_data=True); ch.set_categories(Reference(calc, min_col=1, min_row=2, max_row=4)); ch.y_axis.scaling.min = 0; ch.y_axis.scaling.max = 1; ch.y_axis.number_format = '0%'; ch.legend.position = 'b'
    ch2 = BarChart(); ch2.type = 'col'; ch2.title = 'Unapproved days by month'; ch2.height = 5.2; ch2.width = 16.0; ch2.varyColors = False
    ch2.add_data(Reference(calc, min_col=4, min_row=1, max_row=4), titles_from_data=True); ch2.set_categories(Reference(calc, min_col=1, min_row=2, max_row=4)); ch2.y_axis.scaling.min = 0; ch2.legend = None
    for c in (ch, ch2): c.x_axis.delete = False; c.y_axis.delete = False; c.title.overlay = False
    ch.legend.overlay = False
    d.add_chart(ch, 'B15'); d.add_chart(ch2, 'B28'); d.print_area = 'A1:H39'; page(d, False)
    notes.column_dimensions['A'].width = 100
    for line in ['About this example', 'All figures are made up. Employee IDs are used instead of names.', 'Data holds one row per person per month. Row check confirms that days present, approved leave and unapproved days add up to working days.', 'Departments with fewer people than Calc!G3 are hidden in the department table so that one person is not singled out. This is not full protection: totals can still allow figures to be worked out, and the Data sheet shows every row. Share a copy without the Data sheet only after removing the formulas.', 'The sample covers January to March of one year.', 'Guide: https://gmtoolshub.com/blog/hr-attendance-dashboard-excel/']:
        notes.append([line]); notes.cell(notes.max_row, 1).alignment = Alignment(wrap_text=True)
    notes['A1'].font = Font(bold=True, size=14); page(notes, False)
    wb.properties.title = 'GM HR Attendance Dashboard Example'; wb.properties.creator = 'GM Tools Hub'; wb.save(path)

if __name__ == '__main__':
    build_tracker(os.path.join(DL, 'GM-Attendance-Tracking-Example.xlsx'))
    build_hr(os.path.join(DL, 'GM-HR-Attendance-Dashboard-Example.xlsx'))
    json.dump({'tracker': trk, 'hr': dash}, open(os.path.join(ROOT, 'data', 'cornerstone-attendance.json'), 'w', encoding='utf-8'), indent=1, default=str)
    print('tracker: working days', trk['workingDays'], '| entries', trk['entries'], '| team present', tp, 'of', tw, '| att %.2f%% adj %.2f%% | approved %s | UA %s late %s' % (trk['teamAtt'] * 100, trk['teamAdj'] * 100, ta, trk['teamUA'], trk['teamLT']))
    for s_ in summary: print(' ', s_['id'], s_['name'], 'AL', s_['AL'], 'SL', s_['SL'], 'HD', s_['HD'], 'UA', s_['UA'], 'LT', s_['LT'], s_['lateMin'], 'present', s_['present'], 'att %.1f adj %.1f' % (s_['att'] * 100, s_['adj'] * 100))
    for p in prod: print('  ', p['id'], p['hours'], p['orders'], '%.2f' % p['perHour'])
    print('  ops', trk['opsHours'], trk['opsOrders'], '%.2f' % trk['opsPerHour'])
    print('hr rows', dash['rows'])
    for k, v in dash['months'].items(): print(' ', k, 'people', v['people'], 'att %.2f adj %.2f' % (v['att'] * 100, v['adj'] * 100), 'approved', v['approved'], 'UA', v['ua'], 'late', v['late'])
    for k, v in dash['deptMar'].items(): print('  Mar', k, v['people'], 'att %.2f adj %.2f' % (v['att'] * 100, v['adj'] * 100), 'UA', v['ua'], '2+', v['ua2'])
    print(' simple average of departments Mar %.2f' % (dash['simpleAvgMar'] * 100))
