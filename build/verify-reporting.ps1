# Recalculates the sales performance and monthly report workbooks in Microsoft Excel, compares them with
# data/cornerstone-reporting.json, proves the new-month pickup and every report check, and exports screenshot sheets.
# Nothing is saved. Usage: powershell -File build\verify-reporting.ps1 -PdfDir <folder>
param([string]$PdfDir = $env:TEMP)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$j = Get-Content (Join-Path $root 'data\cornerstone-reporting.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$script:ok = 0; $script:fail = 0
function Test-Value($name, $got, $want) {
    $same = if ($want -is [string]) { "$got" -ceq $want } else { $got -isnot [string] -and $null -ne $got -and [math]::Abs([double]$got - [double]$want) -lt 0.00001 }
    if ($same) { $script:ok++ } else { $script:fail++; "FAIL $name : Excel '$got' expected '$want'" }
}
function Get-ErrorCells($wb) { $n = 0; foreach ($s in $wb.Worksheets) { foreach ($c in $s.UsedRange.Cells) { if ($c.Text -match '^#(REF|VALUE|NAME|DIV/0|N/A|NUM|NULL|SPILL|CALC)') { $n++ } } }; $n }
$xl = New-Object -ComObject Excel.Application; $xl.Visible = $false; $xl.DisplayAlerts = $false
try {
    "Excel $($xl.Version) build $($xl.Build)"
    $wb = $xl.Workbooks.Open((Join-Path $root 'assets\downloads\GM-Sales-Performance-Example.xlsx'), 0, $true); $xl.CalculateFull()
    $s = $wb.Worksheets.Item('Scorecard'); $x = $j.sales
    Test-Value 'time gone' $s.Range('I2').Value2 $x.timeGone
    $cols = @{ B='target'; C='sales'; D='ach'; E='expected'; F='pace'; G='required'; H='projection'; I='projAch'; J='billed'; K='coverage'; L='invValue'; M='linesPerInv' }
    for ($i = 0; $i -lt $x.reps.Count; $i++) { foreach ($c in $cols.Keys) { Test-Value "$($x.reps[$i].rep) $($cols[$c])" $s.Range("$c$(5+$i)").Value2 $x.reps[$i].($cols[$c]) } }
    foreach ($c in $cols.Keys) { if ($c -ne 'E') { Test-Value "team $($cols[$c])" $s.Range("${c}11").Value2 $x.($cols[$c]) } }
    for ($i = 0; $i -lt 3; $i++) { $p = $x.products[$i]; $r = 14 + $i; Test-Value "$($p.name) ach" $s.Range("D$r").Value2 $p.ach; Test-Value "$($p.name) mix" $s.Range("E$r").Value2 $p.mix; Test-Value "$($p.name) target mix" $s.Range("F$r").Value2 $p.targetMix }
    Test-Value 'product check' $s.Range('B17').Value2 'Product totals match rep totals'
    "error cells: $(Get-ErrorCells $wb)"
    $s.ExportAsFixedFormat(0, (Join-Path $PdfDir 'salesperf.pdf'))
    $wb.Worksheets.Item('Data').Range('C11').Value2 = [double]1; $xl.CalculateFull(); Test-Value 'product mismatch caught' $s.Range('B17').Value2 'CHECK: product and rep totals differ'
    $s.Range('F2').Value2 = [double]26; $xl.CalculateFull(); Test-Value 'month complete: nothing per remaining day' $s.Range('G5').Value2 0
    "error cells after month end: $(Get-ErrorCells $wb)"
    $wb.Close($false)

    $wb = $xl.Workbooks.Open((Join-Path $root 'assets\downloads\GM-Monthly-Report-Example.xlsx'), 0, $true); $xl.CalculateFull()
    $r = $wb.Worksheets.Item('Report'); $y = $j.report; $cur = $y.months[5]; $prev = $y.months[4]
    $rowsMap = @{ 6='revenue'; 7='cogs'; 8='gross'; 9='margin'; 10='opex'; 11='profit' }
    Test-Value 'report month is June' $r.Range('B2').Value2 ([datetime]'2026-06-01').ToOADate()
    foreach ($row in $rowsMap.Keys) { $k = $rowsMap[$row]; Test-Value "Jun $k actual" $r.Range("B$row").Value2 $cur.actual.$k; Test-Value "Jun $k budget" $r.Range("C$row").Value2 $cur.budget.$k; Test-Value "Jun $k prior" $r.Range("F$row").Value2 $prev.actual.$k; Test-Value "Jun $k variance" $r.Range("D$row").Value2 ($cur.actual.$k - $cur.budget.$k) }
    Test-Value 'status ready' $r.Range('B3').Value2 'READY: all checks pass'
    "judgements: " + ((6..11 | % { "$($r.Cells.Item($_,1).Text)=$($r.Cells.Item($_,5).Text)" }) -join '; ')
    "commentary 1: $($r.Range('A14').Text)"; "commentary 2: $($r.Range('A15').Text)"
    "error cells: $(Get-ErrorCells $wb)"
    $r.ExportAsFixedFormat(0, (Join-Path $PdfDir 'monthreport.pdf'))
    $a = $wb.Worksheets.Item('Analytics')
    Test-Value 'forecast month 7' $a.Range('D9').Value2 $y.forecast7; Test-Value 'slope' $a.Range('D10').Value2 $y.slope; Test-Value 'backtest' $a.Range('D11').Value2 $y.backtest6; Test-Value 'actual 6' $a.Range('D12').Value2 $y.actual6; Test-Value 'backtest error' $a.Range('D13').Value2 $y.backtestError
    # add July exactly as the Notes describe: 7 rows, then the control total
    $data = $wb.Worksheets.Item('Data'); $ctl = $wb.Worksheets.Item('Control'); $july = ([datetime]'2026-07-01').ToOADate()
    $lines = 'Revenue','Revenue','Cost of goods','Cost of goods','Operating expenses','Operating expenses','Operating expenses'
    $cats = 'Product sales','Service income','Materials','Freight','Salaries','Rent','Other'
    $act = 1000000,130000,560000,52000,190000,60000,58000
    for ($i = 0; $i -lt 7; $i++) { $n = 44 + $i; $data.Cells.Item($n,1).Value2 = [double]$july; $data.Cells.Item($n,2).Value2 = [string]$lines[$i]; $data.Cells.Item($n,3).Value2 = [string]$cats[$i]; $data.Cells.Item($n,4).Value2 = [double]$act[$i]; $data.Cells.Item($n,5).Value2 = [double]$act[$i] }
    $xl.CalculateFull()
    Test-Value 'moves to July by itself' $r.Range('B2').Value2 $july; Test-Value 'July revenue' $r.Range('B6').Value2 1130000; Test-Value 'July prior is June' $r.Range('F6').Value2 $cur.actual.revenue; Test-Value 'July on budget' $r.Range('E6').Value2 'On budget'
    Test-Value 'no control total yet: do not send' $r.Range('B3').Value2 'DO NOT SEND: check the list below'; Test-Value 'control check fails' $r.Range('B23').Value2 'Fail'
    $ctl.Range('A8').Value2 = [double]$july; $ctl.Range('B8').Value2 = [double]2050000; $xl.CalculateFull(); Test-Value 'with control total: ready' $r.Range('B3').Value2 'READY: all checks pass'
    function Test-Fail($label, $cell) { $xl.CalculateFull(); Test-Value "$label fails" $r.Range($cell).Value2 'Fail'; Test-Value "$label blocks sending" $r.Range('B3').Value2 'DO NOT SEND: check the list below' }
    $data.Range('C50').Value2 = [string]'Rent'; Test-Fail 'duplicate category' 'B20'; $data.Range('C50').Value2 = [string]'Other'
    $data.Range('B50').Value2 = [string]'Opex'; Test-Fail 'unknown line name' 'B21'; $data.Range('B50').Value2 = [string]'Operating expenses'
    $data.Range('E50').ClearContents() | Out-Null; Test-Fail 'blank budget' 'B22'; $data.Range('E50').Value2 = [double]58000
    $data.Range('D50').Value2 = [double]85000; Test-Fail 'wrong amount against control total' 'B23'; $data.Range('D50').Value2 = [double]58000
    $data.Rows.Item(50).Delete() | Out-Null; Test-Fail 'missing row' 'B19'
    $wb.Close($false)
} finally { $xl.Quit(); [Runtime.InteropServices.Marshal]::ReleaseComObject($xl) | Out-Null }
"checks passed $script:ok, failed $script:fail"
if ($script:fail) { exit 1 }
