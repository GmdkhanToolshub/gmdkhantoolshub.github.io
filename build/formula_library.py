# -*- coding: utf-8 -*-
"""GM Excel Formula Library: single source for the formulas, the sample data, the expected answers and the example workbook.
Expected answers are worked out here in plain Python, separately from Excel. build/verify-formulas.ps1 then opens the
workbook in Microsoft Excel and compares Excel's results with them.
Run: python build/formula_library.py   -> data/excel-formulas.json and assets/downloads/GM-Excel-Formula-Examples.xlsx"""
import os, json, datetime as dt
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.formula import ArrayFormula

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = dt.date
HEAD = ['Region', 'Rep', 'Month', 'Product', 'Units', 'Unit price', 'Sales', 'Target', 'Order date']
ROWS = [
    ('North', 'Ali', 'Jan', 'Tea', 120, 450, 50000, D(2026, 1, 5)), ('North', 'Sara', 'Jan', 'Juice', 80, 300, 30000, D(2026, 1, 12)),
    ('South', 'Omar', 'Jan', 'Tea', 150, 450, 60000, D(2026, 1, 18)), ('East', 'Hina', 'Jan', 'Biscuits', 200, 120, 20000, D(2026, 1, 25)),
    ('North', 'Ali', 'Feb', 'Juice', 95, 300, 30000, D(2026, 2, 3)), ('North', 'Sara', 'Feb', 'Tea', 110, 450, 45000, D(2026, 2, 10)),
    ('South', 'Omar', 'Feb', 'Biscuits', 300, 120, 40000, D(2026, 2, 16)), ('East', 'Hina', 'Feb', 'Tea', 90, 450, 45000, D(2026, 2, 24)),
    ('North', 'Ali', 'Mar', 'Biscuits', 250, 120, 25000, D(2026, 3, 4)), ('North', 'Sara', 'Mar', 'Juice', 130, 300, 35000, D(2026, 3, 11)),
    ('South', 'Omar', 'Mar', 'Juice', 70, 300, 30000, D(2026, 3, 19)), ('East', 'Hina', 'Mar', 'Tea', 160, 450, 60000, D(2026, 3, 27))]
R = [dict(zip(['region', 'rep', 'month', 'product', 'units', 'price', 'target', 'date'], r)) for r in ROWS]
for r in R: r['sales'] = r['units'] * r['price']
PRODUCTS = [('Product', 'Category', 'List price'), ('Tea', 'Beverage', 450), ('Juice', 'Beverage', 300), ('Biscuits', 'Snack', 120)]
MESSY = '  ali   raza  '
sales = [r['sales'] for r in R]
S = lambda **k: [r for r in R if all(r[a] == b for a, b in k.items())]
total = lambda rows, f='sales': sum(r[f] for r in rows)

F = []  # (category, name, syntax, what it does, example, expected, format, common mistake, versions, array)
def add(cat, name, syntax, what, example, expected, tip, fmt='n', since='All versions', array=False):
    F.append(dict(category=cat, name=name, syntax=syntax, what=what, example=example, expected=expected, tip=tip, format=fmt, since=since, array=array))

C = 'Totals and counting'
add(C, 'SUM', 'SUM(number1, [number2], …)', 'Adds numbers or whole ranges.', '=SUM(Data!G2:G13)', total(R), 'Numbers stored as text are skipped without any warning. Compare COUNT with COUNTA to find them.')
add(C, 'SUMIF', 'SUMIF(range, criteria, [sum_range])', 'Adds the values that meet one condition.', '=SUMIF(Data!A2:A13,"North",Data!G2:G13)', total(S(region='North')), 'The sum range comes last here, but first in SUMIFS.')
add(C, 'SUMIFS', 'SUMIFS(sum_range, criteria_range1, criteria1, …)', 'Adds the values that meet several conditions at once.', '=SUMIFS(Data!G2:G13,Data!A2:A13,"North",Data!C2:C13,"Jan")', total(S(region='North', month='Jan')), 'Every range must be the same size, or the formula returns #VALUE!.', since='Excel 2007 and later')
add(C, 'COUNT', 'COUNT(value1, [value2], …)', 'Counts the cells that contain numbers.', '=COUNT(Data!E2:E13)', 12, 'Text that looks like a number is not counted.')
add(C, 'COUNTA', 'COUNTA(value1, [value2], …)', 'Counts the cells that are not empty.', '=COUNTA(Data!B2:B13)', 12, 'A cell holding an empty text result ("") still counts as filled.')
add(C, 'COUNTIF', 'COUNTIF(range, criteria)', 'Counts the cells that meet one condition.', '=COUNTIF(Data!D2:D13,"Tea")', len(S(product='Tea')), 'Put comparisons in quotes, for example ">100".')
add(C, 'COUNTIFS', 'COUNTIFS(criteria_range1, criteria1, …)', 'Counts the rows that meet several conditions.', '=COUNTIFS(Data!A2:A13,"North",Data!G2:G13,">30000")', len([r for r in S(region='North') if r['sales'] > 30000]), 'To compare with a cell, join the sign and the cell: ">"&H1.', since='Excel 2007 and later')
add(C, 'AVERAGE', 'AVERAGE(number1, [number2], …)', 'Returns the arithmetic mean.', '=AVERAGE(Data!G2:G13)', total(R) / 12, 'Empty cells are ignored but zeros are included, which changes the result.', fmt='n2')
add(C, 'AVERAGEIFS', 'AVERAGEIFS(average_range, criteria_range1, criteria1, …)', 'Averages only the rows that meet your conditions.', '=AVERAGEIFS(Data!G2:G13,Data!D2:D13,"Tea")', total(S(product='Tea')) / len(S(product='Tea')), 'If nothing matches, the result is #DIV/0!.', fmt='n2', since='Excel 2007 and later')
add(C, 'MAX', 'MAX(number1, [number2], …)', 'Returns the largest value.', '=MAX(Data!G2:G13)', max(sales), 'Text and empty cells are ignored.')
add(C, 'MIN', 'MIN(number1, [number2], …)', 'Returns the smallest value.', '=MIN(Data!G2:G13)', min(sales), 'A zero used as a placeholder will become the minimum.')
add(C, 'MAXIFS', 'MAXIFS(max_range, criteria_range1, criteria1, …)', 'Returns the largest value among rows that meet your conditions.', '=MAXIFS(Data!G2:G13,Data!A2:A13,"South")', max(r['sales'] for r in S(region='South')), 'It returns 0, not an error, when nothing matches.', since='Excel 2019 or Microsoft 365')
add(C, 'SUBTOTAL', 'SUBTOTAL(function_num, ref1, …)', 'Totals a list and ignores rows hidden by a filter. Function 9 means sum.', '=SUBTOTAL(9,Data!G2:G13)', total(R), 'Use 109 instead of 9 to also ignore rows you hid by hand.')
add(C, 'SUMPRODUCT', 'SUMPRODUCT(array1, [array2], …)', 'Multiplies matching items and adds the results.', '=SUMPRODUCT(Data!E2:E13,Data!F2:F13)', total(R), 'The arrays must have the same number of rows and columns.')

C = 'Lookup'
add(C, 'VLOOKUP', 'VLOOKUP(lookup_value, table_array, col_index_num, FALSE)', 'Finds a value in the first column of a table and returns a value from the same row.', '=VLOOKUP("Juice",Lookup!A2:C4,3,FALSE)', 300, 'Leaving out FALSE gives an approximate match, which can return a wrong value without warning.')
add(C, 'INDEX and MATCH', 'INDEX(return_range, MATCH(lookup_value, lookup_range, 0))', 'Looks up in any direction and works in every version.', '=INDEX(Lookup!A2:A4,MATCH(120,Lookup!C2:C4,0))', 'Biscuits', 'Keep both ranges the same height and use 0 for an exact match.', fmt='t')
add(C, 'XLOOKUP', 'XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found])', 'A modern lookup that can search left or right and shows your own message when nothing is found.', '=XLOOKUP("Coffee",Lookup!A2:A4,Lookup!C2:C4,"Not found")', 'Not found', 'It is not available in Excel 2019 or earlier. Use INDEX and MATCH for older versions.', fmt='t', since='Excel 2021 or Microsoft 365')

C = 'Logic and errors'
add(C, 'IF', 'IF(logical_test, value_if_true, value_if_false)', 'Chooses between two results.', '=IF(Data!G2>=Data!H2,"Met","Missed")', 'Met' if R[0]['sales'] >= R[0]['target'] else 'Missed', 'Put text results in quotes.', fmt='t')
add(C, 'IFS', 'IFS(test1, value1, test2, value2, …)', 'Checks conditions in order and returns the first that is true.', '=IFS(Data!G3>=Data!H3,"Met",Data!G3>=Data!H3*0.8,"Close",TRUE,"Missed")', 'Met' if R[1]['sales'] >= R[1]['target'] else ('Close' if R[1]['sales'] >= R[1]['target'] * .8 else 'Missed'), 'End with TRUE as the catch-all, or unmatched rows show #N/A.', fmt='t', since='Excel 2019 or Microsoft 365')
add(C, 'AND', 'AND(logical1, [logical2], …)', 'True only when every condition is true.', '=IF(AND(Data!E2>100,Data!G2>50000),"Yes","No")', 'Yes' if R[0]['units'] > 100 and R[0]['sales'] > 50000 else 'No', 'AND gives one answer for a whole range; it does not test row by row.', fmt='t')
add(C, 'OR', 'OR(logical1, [logical2], …)', 'True when at least one condition is true.', '=IF(OR(Data!A2="East",Data!D2="Tea"),"Yes","No")', 'Yes' if R[0]['region'] == 'East' or R[0]['product'] == 'Tea' else 'No', 'Repeat the cell for each test: OR(A2="North",A2="East"), not OR(A2="North","East").', fmt='t')
add(C, 'IFERROR', 'IFERROR(value, value_if_error)', 'Shows your own result instead of an error.', '=IFERROR(Data!G2/0,0)', 0, 'It hides every error, including broken references. For lookups, show a visible message instead of 0.')

C = 'Text'
add(C, 'TRIM', 'TRIM(text)', 'Removes extra spaces, leaving single spaces between words.', '=TRIM(Lookup!E2)', ' '.join(MESSY.split()), 'It does not remove non-breaking spaces copied from web pages.', fmt='t')
add(C, 'PROPER', 'PROPER(text)', 'Capitalises the first letter of each word.', '=PROPER(TRIM(Lookup!E2))', 'Ali Raza', 'Names such as McDonald need a manual check.', fmt='t')
add(C, 'UPPER', 'UPPER(text)', 'Changes text to capital letters.', '=UPPER(Data!A2)', 'NORTH', 'Lookups already ignore capitals, so this is for display.', fmt='t')
add(C, 'LEFT', 'LEFT(text, [num_chars])', 'Takes characters from the start of a text.', '=LEFT(Data!D5,3)', R[3]['product'][:3], 'The result is text, even when it looks like a number.', fmt='t')
add(C, 'MID', 'MID(text, start_num, num_chars)', 'Takes characters from the middle of a text.', '=MID("GM-2026-014",4,4)', '2026', 'Positions start at 1, and spaces count.', fmt='t')
add(C, 'LEN', 'LEN(text)', 'Counts the characters in a cell.', '=LEN(TRIM(Lookup!E2))', len(' '.join(MESSY.split())), 'Compare with LEN of the untrimmed cell to find hidden spaces.')
add(C, 'SUBSTITUTE', 'SUBSTITUTE(text, old_text, new_text, [instance_num])', 'Replaces one piece of text with another.', '=SUBSTITUTE("0300-123-4567","-","")', '03001234567', 'It is case-sensitive.', fmt='t')
add(C, 'TEXTJOIN', 'TEXTJOIN(delimiter, ignore_empty, text1, …)', 'Joins many cells with a separator.', '=TEXTJOIN(", ",TRUE,Lookup!A2:A4)', 'Tea, Juice, Biscuits', 'Set the second argument to TRUE to skip empty cells.', fmt='t', since='Excel 2019 or Microsoft 365')
add(C, 'TEXT', 'TEXT(value, format_text)', 'Turns a number or date into text in a chosen format.', '=TEXT(Data!G2,"#,##0")', '{:,}'.format(R[0]['sales']), 'The result is text and cannot be summed. Format codes can differ with regional settings.', fmt='t')

C = 'Dates'
add(C, 'EOMONTH', 'EOMONTH(start_date, months)', 'Returns the last day of a month, before or after a date.', '=EOMONTH(Data!J2,0)', '2026-01-31', 'Format the result cell as a date, or you will see a serial number.', fmt='d')
add(C, 'NETWORKDAYS', 'NETWORKDAYS(start_date, end_date, [holidays])', 'Counts Monday to Friday between two dates, including both ends.', '=NETWORKDAYS(DATE(2026,3,1),DATE(2026,3,31))', sum(1 for i in range(31) if (D(2026, 3, 1) + dt.timedelta(i)).weekday() < 5), 'For Friday and Saturday or Sunday-only weekends, use NETWORKDAYS.INTL.')
add(C, 'DATEDIF', 'DATEDIF(start_date, end_date, unit)', 'Counts complete years or months between two dates.', '=DATEDIF(DATE(2022,6,15),DATE(2026,11,25),"Y")', 4, 'Excel does not suggest it as you type. Microsoft advises against the "MD" unit.')
add(C, 'WEEKDAY', 'WEEKDAY(date, [return_type])', 'Returns the day of the week as a number. With type 2, Monday is 1.', '=WEEKDAY(Data!J2,2)', R[0]['date'].isoweekday(), 'Without the second argument, Sunday is 1.')

C = 'Analysis for sales and operations'
add(C, 'Target achievement %', 'actual / target', 'Shows how much of a target has been reached.', '=SUM(Data!G2:G13)/SUM(Data!H2:H13)', total(R) / total(R, 'target'), 'For a team, divide total actual by total target. Do not average each person\'s percentage.', fmt='p')
add(C, 'Growth %', '(new - old) / old', 'Measures change from one period to the next.', '=(SUMIFS(Data!G2:G13,Data!C2:C13,"Mar")-SUMIFS(Data!G2:G13,Data!C2:C13,"Feb"))/SUMIFS(Data!G2:G13,Data!C2:C13,"Feb")', (total(S(month='Mar')) - total(S(month='Feb'))) / total(S(month='Feb')), 'If the old value is zero or negative, the percentage has no useful meaning.', fmt='p')
add(C, 'Weighted average', 'SUMPRODUCT(values, weights) / SUM(weights)', 'Averages values where some count more than others. Here, the average selling price per unit.', '=SUMPRODUCT(Data!F2:F13,Data!E2:E13)/SUM(Data!E2:E13)', total(R) / total(R, 'units'), 'A simple average of prices ignores how many units were sold at each price.', fmt='n2')
add(C, 'Running total', 'SUM($G$2:G2) copied down', 'Adds up values as you go down a list. The example is the total after six rows.', '=SUM(Data!$G$2:G7)', sum(sales[:6]), 'Lock only the starting cell with $ so the end moves as you copy.')
add(C, 'RANK', 'RANK(number, ref, [order])', 'Shows the position of a number in a list.', '=RANK(Data!G2,Data!$G$2:$G$13,0)', 1 + sum(1 for x in sales if x > sales[0]), 'Lock the list with $. Equal values get the same rank.')
add(C, 'LARGE', 'LARGE(array, k)', 'Returns the k-th largest value.', '=LARGE(Data!G2:G13,3)', sorted(sales, reverse=True)[2], 'k cannot be larger than the number of values.')
add(C, 'ROUND', 'ROUND(number, num_digits)', 'Rounds to a chosen number of decimal places. Negative places round to tens, hundreds or thousands.', '=ROUND(AVERAGE(Data!G2:G13),-2)', int((total(R) / 12) / 100 + 0.5) * 100, 'Formatting hides decimals but keeps them. ROUND changes the stored value.')
add(C, 'FILTER', 'FILTER(array, include, [if_empty])', 'Returns the rows that meet a condition. Here the results are added up.', '=SUM(FILTER(Data!G2:G13,Data!A2:A13="East"))', total(S(region='East')), 'It needs empty cells below and beside it, or it shows #SPILL!.', since='Excel 2021 or Microsoft 365', array=True)
add(C, 'UNIQUE', 'UNIQUE(array)', 'Lists each value once. Here the unique regions are counted.', '=COUNTA(UNIQUE(Data!A2:A13))', len({r['region'] for r in R}), 'Extra spaces make two entries look different. Clean the data first.', since='Excel 2021 or Microsoft 365', array=True)

for i, f in enumerate(F): f['id'] = f['name'].lower().replace(' %', ' percent').replace(' ', '-')

def workbook(path):
    wb = Workbook()
    navy = PatternFill('solid', fgColor='0B1630'); white = Font(bold=True, color='FFFFFF'); thin = Side(style='thin', color='D6DEEC'); box = Border(left=thin, right=thin, top=thin, bottom=thin)
    def head(ws, values, widths):
        ws.append(values)
        for c in ws[1]: c.fill, c.font = navy, white
        for col, w in widths.items(): ws.column_dimensions[col].width = w
        ws.freeze_panes = 'A2'
    s = wb.active; s.title = 'Start here'; s.column_dimensions['A'].width = 100
    for line, bold in [('GM Excel Formula Examples', True), ('Every formula on the Formulas sheet works on the sample data in the Data and Lookup sheets.', False), ('Change the sample data and watch the results update. All names and figures are made up for practice.', False), ('Check column tells you whether the result still matches the answer for the original sample data.', False), ('Some formulas need Excel 2019, 2021 or Microsoft 365. The Needs column shows which; older versions display #NAME?.', False), ('More explanations: https://gmtoolshub.com/excel-formulas/', False)]:
        s.append([line]); s.cell(s.max_row, 1).alignment = Alignment(wrap_text=True)
        if bold: s.cell(s.max_row, 1).font = Font(bold=True, size=16, color='0B1630')
    d = wb.create_sheet('Data'); head(d, HEAD[:8] + ['Order date (text)', 'Order date'], dict(A=10, B=9, C=8, D=11, E=8, F=11, G=11, H=10, I=18, J=13))
    for n, r in enumerate(R, start=2):
        d.append([r['region'], r['rep'], r['month'], r['product'], r['units'], r['price'], '=E%d*F%d' % (n, n), r['target'], r['date'].isoformat(), r['date']])
        d.cell(n, 10).number_format = 'dd-mmm-yyyy'
        for col in (6, 7, 8): d.cell(n, col).number_format = '#,##0'
    d.column_dimensions['I'].hidden = True
    lk = wb.create_sheet('Lookup'); head(lk, list(PRODUCTS[0]) + [None, 'Messy name'], dict(A=12, B=12, C=11, D=4, E=22))
    for row in PRODUCTS[1:]: lk.append(list(row))
    lk['E2'] = MESSY
    fs = wb.create_sheet('Formulas', 1); head(fs, ['Function', 'Category', 'What it does', 'Formula (as text)', 'Live result', 'Check', 'Needs'], dict(A=22, B=22, C=60, D=62, E=24, F=9, G=26))
    newer = {'XLOOKUP(': '_xlfn.XLOOKUP(', 'IFS(': None, 'MAXIFS(': '_xlfn.MAXIFS(', 'TEXTJOIN(': '_xlfn.TEXTJOIN(', 'UNIQUE(': '_xlfn.UNIQUE(', 'FILTER(': '_xlfn._xlws.FILTER('}
    for n, f in enumerate(F, start=2):
        x = f['example']
        for k in ('XLOOKUP(', 'MAXIFS(', 'TEXTJOIN(', 'UNIQUE(', 'FILTER('): x = x.replace(k, newer[k])
        if x.startswith('=IFS('): x = '=_xlfn.IFS(' + x[5:]
        fs.append([f['name'], f['category'], f['what'], None, None, None, f['since']])
        t = fs.cell(n, 4); t.value = f['example']; t.data_type = 's'; t.quotePrefix = True
        fs.cell(n, 5).value = ArrayFormula('E%d' % n, x) if f['array'] else x
        fs.cell(n, 5).number_format = {'p': '0.0%', 'd': 'dd-mmm-yyyy', 'n': '#,##0', 'n2': '#,##0.00', 't': 'General'}[f['format']]
        e = f['expected']
        if f['format'] == 't': test = 'E%d="%s"' % (n, str(e).replace('"', '""'))
        elif f['format'] == 'd': y, m, day = map(int, e.split('-')); test = 'E%d=DATE(%d,%d,%d)' % (n, y, m, day)
        else: test = 'ABS(E%d-%s)<0.00001' % (n, repr(float(e)))
        fs.cell(n, 6).value = '=IFERROR(IF(%s,"OK","Changed"),"Error")' % test
        for c in fs[n]: c.alignment = Alignment(wrap_text=True, vertical='top'); c.border = box
    fs.auto_filter.ref = 'A1:G%d' % (len(F) + 1)
    for ws in wb.worksheets: ws.page_setup.orientation = 'landscape'; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0; ws.sheet_properties.pageSetUpPr.fitToPage = True
    wb.active = 0; wb.properties.title = 'GM Excel Formula Examples'; wb.properties.creator = 'GM Tools Hub'
    wb.save(path)

if __name__ == '__main__':
    assert len({f['id'] for f in F}) == len(F)
    os.makedirs(os.path.join(ROOT, 'data'), exist_ok=True)
    json.dump({'head': HEAD, 'rows': [[r['region'], r['rep'], r['month'], r['product'], r['units'], r['price'], r['sales'], r['target'], r['date'].isoformat()] for r in R], 'lookup': PRODUCTS, 'messy': MESSY, 'formulas': F},
              open(os.path.join(ROOT, 'data', 'excel-formulas.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    workbook(os.path.join(ROOT, 'assets', 'downloads', 'GM-Excel-Formula-Examples.xlsx'))
    print(len(F), 'formulas written')
