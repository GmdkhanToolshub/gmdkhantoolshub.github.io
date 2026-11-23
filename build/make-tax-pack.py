# -*- coding: utf-8 -*-
"""Builds the 'Pakistan Salary Tax Pack' Excel workbook (calculator + payroll sheet + slab tables + guide).
Output: D:/GM_Claude/products/salary-tax-pack/Pakistan-Salary-Tax-Pack.xlsx (products/ is not part of the website repo).
Slabs mirror assets/js/tools/pakistan-salary-tax-calculator.js. Re-run after the slabs change."""
import os, sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.workbook.properties import CalcProperties

OUT = r'D:\GM_Claude\products\salary-tax-pack'; os.makedirs(OUT, exist_ok=True)
B2627 = [(0, 0, 0), (600000, 1, 0), (1200000, 11, 6000), (2200000, 20, 116000), (3200000, 25, 316000), (4100000, 29, 541000), (5600000, 32, 976000), (7000000, 35, 1424000)]
B2526 = [(0, 0, 0), (600000, 1, 0), (1200000, 11, 6000), (2200000, 23, 116000), (3200000, 30, 346000), (4100000, 35, 616000)]
NAVY, TEAL, LIGHT, INPUT = '0B1B34', '0E7490', 'EAF4F8', 'FFF7D6'
hf = Font(bold=True, color='FFFFFF'); hfill = PatternFill('solid', fgColor=NAVY); infill = PatternFill('solid', fgColor=INPUT); lfill = PatternFill('solid', fgColor=LIGHT)
thin = Side(style='thin', color='B6C2D1'); box = Border(left=thin, right=thin, top=thin, bottom=thin)
money = '#,##0'
wb = Workbook(); wb.calculation = CalcProperties(fullCalcOnLoad=True)

# ---------- Slabs
sl = wb.active; sl.title = 'Slabs'
sl['A1'] = 'Income tax slabs used by this workbook (salaried individuals, annual income in Rs)'; sl['A1'].font = Font(bold=True, size=13)
sl['A2'] = 'Check the current rates with FBR or your tax adviser before you rely on them. If the law changes, edit the yellow cells and every sheet updates.'
for c, txt in zip('ABC', ['Band starts at (Rs)', 'Rate on income above start (%)', 'Fixed tax at start (Rs)']): sl[c + '4'] = txt
for c, txt in zip('EFG', ['Band starts at (Rs)', 'Rate on income above start (%)', 'Fixed tax at start (Rs)']): sl[c + '4'] = txt
sl['A3'] = 'Tax year 2026-27'; sl['E3'] = 'Tax year 2025-26'; sl['A3'].font = sl['E3'].font = Font(bold=True)
for r, (a, b, c) in enumerate(B2627, 5): sl.cell(r, 1, a); sl.cell(r, 2, b); sl.cell(r, 3, c)
for r, (a, b, c) in enumerate(B2526, 5): sl.cell(r, 5, a); sl.cell(r, 6, b); sl.cell(r, 7, c)
sl['I4'] = 'Surcharge rule (2025-26)'; sl['I5'] = 'Applies above income of (Rs)'; sl['J5'] = 10000000; sl['I6'] = 'Surcharge on tax (%)'; sl['J6'] = 9
for row in sl['A4:J4']:
    for c in row:
        if c.value: c.font = hf; c.fill = hfill; c.alignment = Alignment(wrap_text=True, vertical='center')
for rng in ('A5:C12', 'E5:G10', 'J5:J6'):
    for row in sl[rng]:
        for c in row: c.fill = infill; c.border = box; c.number_format = money
for col, w in zip('ABCDEFGHIJ', [24, 26, 24, 4, 24, 26, 24, 4, 30, 16]): sl.column_dimensions[col].width = w
sl.row_dimensions[4].height = 34

def tax_formula(x):
    """Annual income tax (incl. surcharge for 2025-26) on taxable income in cell x, using the tax year in Calculator!$B$3."""
    t27 = f'(INDEX(Slabs!$C$5:$C$12,MATCH({x},Slabs!$A$5:$A$12,1))+({x}-INDEX(Slabs!$A$5:$A$12,MATCH({x},Slabs!$A$5:$A$12,1)))*INDEX(Slabs!$B$5:$B$12,MATCH({x},Slabs!$A$5:$A$12,1))/100)'
    t26 = f'(INDEX(Slabs!$G$5:$G$10,MATCH({x},Slabs!$E$5:$E$10,1))+({x}-INDEX(Slabs!$E$5:$E$10,MATCH({x},Slabs!$E$5:$E$10,1)))*INDEX(Slabs!$F$5:$F$10,MATCH({x},Slabs!$E$5:$E$10,1))/100)'
    return f'=IF({x}<=0,0,IF(Calculator!$B$3="2026-27",{t27},{t26}*(1+IF({x}>Slabs!$J$5,Slabs!$J$6/100,0))))'

# ---------- Calculator
ca = wb.create_sheet('Calculator', 0)
ca['A1'] = 'Pakistan Salary Tax Calculator (salaried individual)'; ca['A1'].font = Font(bold=True, size=15, color=NAVY)
ca['A2'] = 'Fill in the yellow cells. Results update automatically. Estimate only: see the Start Here sheet.'
labels = ['Tax year', 'Gross salary per month (Rs)', 'Annual bonus (Rs)', 'Exempt allowances per month (Rs)', 'Other deductions per month (Rs), e.g. provident fund, EOBI']
vals = ['2026-27', 150000, 0, 0, 0]
for i, (l, v) in enumerate(zip(labels, vals)):
    ca.cell(3 + i, 1, l).font = Font(bold=True); c = ca.cell(3 + i, 2, v); c.fill = infill; c.border = box; c.number_format = money if i else '@'
dv = DataValidation(type='list', formula1='"2026-27,2025-26"', allow_blank=False); ca.add_data_validation(dv); dv.add('B3')
ca['A9'] = 'Results'; ca['A9'].font = Font(bold=True, size=12, color=TEAL)
res = [
 ('Annual gross income', '=B4*12+B5'),
 ('Annual taxable income', '=MAX(0,B10-B6*12)'),
 ('Annual income tax', tax_formula('B11')),
 ('Monthly income tax', '=B12/12'),
 ('Monthly take-home pay', '=(B10-B12-B7*12)/12'),
 ('Tax as a share of gross pay', '=IF(B10>0,B12/B10,0)'),
]
for i, (l, f) in enumerate(res):
    ca.cell(10 + i, 1, l).font = Font(bold=True); c = ca.cell(10 + i, 2, f); c.fill = lfill; c.border = box; c.number_format = '0.00%' if 'share' in l else money
ca['A17'] = 'Compare with the other tax year'; ca['A17'].font = Font(bold=True, size=12, color=TEAL)
ca['A18'] = 'Annual tax under the other year\'s slabs'
ca['B18'] = tax_formula('B11').replace('Calculator!$B$3="2026-27"', 'Calculator!$B$3<>"2026-27"')
ca['A19'] = 'Difference (selected year minus other year)'; ca['B19'] = '=B12-B18'
for r in (18, 19): ca.cell(r, 2).fill = lfill; ca.cell(r, 2).border = box; ca.cell(r, 2).number_format = money
ca['A21'] = 'Estimate for full-year salaried income. Payroll figures can differ because of mid-year changes, tax credits and how each allowance is treated. Not tax advice.'
ca['A21'].alignment = Alignment(wrap_text=True); ca.merge_cells('A21:B22')
ca.column_dimensions['A'].width = 58; ca.column_dimensions['B'].width = 22

# ---------- Payroll
pr = wb.create_sheet('Payroll', 1)
pr['A1'] = 'Monthly payroll with income tax (up to 25 employees)'; pr['A1'].font = Font(bold=True, size=14, color=NAVY)
pr['A2'] = 'Uses the tax year selected on the Calculator sheet (cell B3). Enter employees in the yellow cells.'
hdr = ['#', 'Employee', 'Gross salary / month', 'Annual bonus', 'Exempt allowances / month', 'Other deductions / month', 'Annual taxable income', 'Annual tax', 'Monthly tax', 'Monthly take-home']
for j, h in enumerate(hdr, 1):
    c = pr.cell(4, j, h); c.font = hf; c.fill = hfill; c.alignment = Alignment(wrap_text=True, vertical='center', horizontal='center'); c.border = box
pr.row_dimensions[4].height = 36
sample = [('Employee 1', 80000, 0, 0, 0), ('Employee 2', 150000, 100000, 10000, 3000), ('Employee 3', 450000, 0, 0, 5000)]
for i in range(25):
    r = 5 + i; pr.cell(r, 1, i + 1)
    for j in range(2, 7):
        c = pr.cell(r, j, sample[i][j - 2] if i < 3 else None); c.fill = infill; c.border = box; c.number_format = money if j > 2 else '@'
    pr.cell(r, 7, f'=IF(C{r}="","",MAX(0,C{r}*12+D{r}-E{r}*12))')
    pr.cell(r, 8, f'=IF(C{r}="","",' + tax_formula(f'G{r}')[1:] + ')')
    pr.cell(r, 9, f'=IF(C{r}="","",H{r}/12)')
    pr.cell(r, 10, f'=IF(C{r}="","",C{r}+D{r}/12-I{r}-F{r})')
    for j in range(7, 11): pr.cell(r, j).number_format = money; pr.cell(r, j).border = box; pr.cell(r, j).fill = lfill
pr['B31'] = 'Totals'; pr['B31'].font = Font(bold=True)
for col in 'CDEFGHIJ': pr[f'{col}31'] = f'=SUM({col}5:{col}29)'; pr[f'{col}31'].number_format = money; pr[f'{col}31'].font = Font(bold=True)
pr['A33'] = 'Monthly take-home = gross salary + bonus spread over 12 months - monthly tax - other deductions. Exempt allowances are part of gross pay but are excluded from taxable income.'
for col, w in zip('ABCDEFGHIJ', [5, 24, 18, 14, 18, 18, 18, 16, 14, 18]): pr.column_dimensions[col].width = w
pr.freeze_panes = 'C5'

# ---------- Start here
st = wb.create_sheet('Start Here', 0)
lines = [
 ('Pakistan Salary Tax Pack', 'title'),
 ('Salary income tax calculator and monthly payroll sheet for Pakistan, tax years 2025-26 and 2026-27.', ''),
 ('', ''),
 ('How to use', 'h'),
 ('1. Open the Calculator sheet. Pick the tax year in B3 and fill the yellow cells.', ''),
 ('2. For a team, use the Payroll sheet: one row per employee, up to 25. It uses the tax year picked on the Calculator sheet.', ''),
 ('3. The Slabs sheet holds the tax slabs. If the rules change, edit the yellow cells there and everything updates.', ''),
 ('', ''),
 ('What it does and does not do', 'h'),
 ('It estimates annual and monthly income tax for full-year salaried income using the slab rates on the Slabs sheet, and take-home pay after tax and other deductions.', ''),
 ('It does NOT handle tax credits, mid-year changes, multiple income sources, other income, or special rules for particular allowances. Your payroll or tax adviser decides those.', ''),
 ('Slab rates were set to the rates used on gmtoolshub.com when this file was made. Always confirm the current rates with FBR or a qualified tax adviser.', ''),
 ('This workbook is for general information and is not tax, legal or financial advice.', ''),
 ('', ''),
 ('Requirements', 'h'),
 ('Microsoft Excel 2010 or later. Not tested in Google Sheets or LibreOffice.', ''),
 ('', ''),
 ('Support', 'h'),
 ('Questions about the file: https://gmtoolshub.com/contact/ . Free online version of the calculator: https://gmtoolshub.com/tools/pakistan-salary-tax-calculator/', ''),
 ('Version 1.0, built 2026-11-23. Copyright Gmd Khan Niazi. For your own use or your own company; please do not resell or share the file.', ''),
]
for i, (t, k) in enumerate(lines, 1):
    c = st.cell(i, 1, t); c.alignment = Alignment(wrap_text=True, vertical='top')
    if k == 'title': c.font = Font(bold=True, size=18, color=NAVY)
    elif k == 'h': c.font = Font(bold=True, size=12, color=TEAL)
st.column_dimensions['A'].width = 110
wb.move_sheet('Calculator', offset=0)
wb.save(os.path.join(OUT, 'Pakistan-Salary-Tax-Pack.xlsx')); print('saved')


