# Recalculates both example workbooks in Microsoft Excel, compares them with the Python answers in
# data/cornerstone-examples.json, proves the dashboard month selector and checks, and exports the sheets used as
# article screenshots to PDF. Workbooks are never saved. Usage: powershell -File build\verify-cornerstone.ps1 -PdfDir <folder>
param([string]$PdfDir = $env:TEMP)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$j = Get-Content (Join-Path $root 'data\cornerstone-examples.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$script:ok = 0; $script:fail = 0
function Test-Value($name, $got, $want) {
    $same = if ($want -is [string]) { "$got" -eq $want } else { [math]::Abs([double]$got - [double]$want) -lt 0.000001 }
    if ($same) { $script:ok++ } else { $script:fail++; "FAIL $name : Excel '$got' expected '$want'" }
}
function Get-ErrorCells($wb) { $n = 0; foreach ($s in $wb.Worksheets) { foreach ($c in $s.UsedRange.Cells) { if ($c.Text -match '^#(REF|VALUE|NAME|DIV/0|N/A|NUM|NULL|SPILL|CALC)') { $n++ } } }; $n }
$xl = New-Object -ComObject Excel.Application; $xl.Visible = $false; $xl.DisplayAlerts = $false
try {
    "Excel $($xl.Version) build $($xl.Build)"
    $wb = $xl.Workbooks.Open((Join-Path $root 'assets\downloads\GM-Sales-Dashboard-Example.xlsx'), 0, $true); $xl.CalculateFull()
    $d = $wb.Worksheets.Item('Dashboard'); $calc = $wb.Worksheets.Item('Calc'); $x = $j.dashboard
    Test-Value 'data total' $calc.Range('G2').Value2 $x.sales; Test-Value 'totals agree' $calc.Range('G4').Value2 'Yes'
    Test-Value 'Mar sales' $d.Range('B5').Value2 $x.marSales; Test-Value 'Mar target' $d.Range('C5').Value2 $x.marTarget; Test-Value 'Mar achievement' $d.Range('D5').Value2 $x.marAch; Test-Value 'Mar gap' $d.Range('E5').Value2 $x.marGap; Test-Value 'Mar growth' $d.Range('F5').Value2 $x.marGrowth
    $i = 0; foreach ($r in 'North','South','East','West') { Test-Value "$r sales" $d.Cells.Item(8 + $i, 3).Value2 $x.regionsMar.$r.sales; Test-Value "$r target" $d.Cells.Item(8 + $i, 4).Value2 $x.regionsMar.$r.target; $i++ }
    Test-Value 'table matches tile' $d.Range('F12').Value2 'Matches tile'
    "statuses (Mar): " + ((8..11 | % { "$($d.Cells.Item($_,2).Text)=$($d.Cells.Item($_,5).Text) $($d.Cells.Item($_,6).Text)" }) -join '; ')
    $d.ExportAsFixedFormat(0, (Join-Path $PdfDir 'dash.pdf'))
    "error cells: $(Get-ErrorCells $wb)"
    foreach ($m in 'Jan','Feb') { $d.Range('C2').Value2 = $m; $xl.CalculateFull(); Test-Value "$m sales after selecting" $d.Range('B5').Value2 $x.months.$m.sales; Test-Value "$m table matches" $d.Range('F12').Value2 'Matches tile' }
    $d.Range('C2').Value2 = 'Jan'; $xl.CalculateFull(); Test-Value 'Jan has no prior month' $d.Range('F5').Value2 'n/a'
    $wb.Worksheets.Item('Data').Range('B2').Value2 = 'Jam'; $xl.CalculateFull(); Test-Value 'misspelled month is caught' $calc.Range('G4').Value2 'CHECK DATA'
    $wb.Close($false)

    $wb = $xl.Workbooks.Open((Join-Path $root 'assets\downloads\GM-Inventory-Tracker-Example.xlsx'), 0, $true); $xl.CalculateFull()
    $s = $wb.Worksheets.Item('Stock'); $x = $j.inventory
    for ($k = 0; $k -lt $x.items.Count; $k++) { $it = $x.items[$k]; $r = 5 + $k
        Test-Value "$($it.code) in" $s.Cells.Item($r,4).Value2 $it.inQty; Test-Value "$($it.code) out" $s.Cells.Item($r,5).Value2 $it.outQty; Test-Value "$($it.code) on hand" $s.Cells.Item($r,6).Value2 $it.closing; Test-Value "$($it.code) daily" $s.Cells.Item($r,7).Value2 $it.daily; Test-Value "$($it.code) reorder point" $s.Cells.Item($r,8).Value2 $it.rop; Test-Value "$($it.code) status" $s.Cells.Item($r,9).Value2 $it.status; Test-Value "$($it.code) cover" $s.Cells.Item($r,10).Value2 $it.cover; Test-Value "$($it.code) value" $s.Cells.Item($r,11).Value2 $it.value; Test-Value "$($it.code) cogs" $s.Cells.Item($r,12).Value2 $it.cogs }
    Test-Value 'closing value' $s.Range('K13').Value2 $x.closeValue; Test-Value 'total cogs' $s.Range('L13').Value2 $x.cogs; Test-Value 'opening value' $s.Range('C15').Value2 $x.openValue; Test-Value 'turnover' $s.Range('C18').Value2 $x.turnover; Test-Value 'days of stock' $s.Range('C19').Value2 $x.daysOfStock
    $a = $wb.Worksheets.Item('ABC'); $ranked = $x.items | Sort-Object { -$_.cogs }
    for ($k = 0; $k -lt $ranked.Count; $k++) { Test-Value "abc rank $($k+1) name" $a.Cells.Item($k+2,2).Value2 $ranked[$k].name; Test-Value "abc rank $($k+1) share" $a.Cells.Item($k+2,4).Value2 $ranked[$k].share; Test-Value "abc rank $($k+1) class" $a.Cells.Item($k+2,5).Value2 $ranked[$k].abc }
    $m = $wb.Worksheets.Item('Movements'); $unknown = @(2..($x.moves + 1) | Where-Object { $m.Cells.Item($_,5).Value2 -ne 'Yes' }).Count; Test-Value 'all movement codes known' $unknown 0
    "error cells: $(Get-ErrorCells $wb)"
    $s.ExportAsFixedFormat(0, (Join-Path $PdfDir 'stock.pdf')); $a.ExportAsFixedFormat(0, (Join-Path $PdfDir 'abc.pdf'))
    $m.Range('B2').Value2 = 'P99'; $xl.CalculateFull(); Test-Value 'unknown code is flagged' $m.Range('E2').Value2 'CHECK'
    $wb.Close($false)
} finally { $xl.Quit(); [Runtime.InteropServices.Marshal]::ReleaseComObject($xl) | Out-Null }
"checks passed $script:ok, failed $script:fail"
if ($script:fail) { exit 1 }
