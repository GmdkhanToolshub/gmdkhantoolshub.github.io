# Recalculates both attendance workbooks in Microsoft Excel, compares them with data/cornerstone-attendance.json,
# proves the error checks and the small-group rule, and exports the screenshot sheets to PDF. Nothing is saved.
param([string]$PdfDir = $env:TEMP)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$j = Get-Content (Join-Path $root 'data\cornerstone-attendance.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$script:ok = 0; $script:fail = 0
function Test-Value($name, $got, $want) {
    $same = if ($want -is [string]) { "$got" -eq $want } else { $got -isnot [string] -and $null -ne $got -and [math]::Abs([double]$got - [double]$want) -lt 0.000001 }
    if ($same) { $script:ok++ } else { $script:fail++; "FAIL $name : Excel '$got' expected '$want'" }
}
function Get-ErrorCells($wb) { $n = 0; foreach ($s in $wb.Worksheets) { foreach ($c in $s.UsedRange.Cells) { if ($c.Text -match '^#(REF|VALUE|NAME|DIV/0|N/A|NUM|NULL|SPILL|CALC)') { $n++ } } }; $n }
$xl = New-Object -ComObject Excel.Application; $xl.Visible = $false; $xl.DisplayAlerts = $false
try {
    "Excel $($xl.Version) build $($xl.Build)"
    $wb = $xl.Workbooks.Open((Join-Path $root 'assets\downloads\GM-Attendance-Tracking-Example.xlsx'), 0, $true); $xl.CalculateFull()
    $s = $wb.Worksheets.Item('Summary'); $log = $wb.Worksheets.Item('Log'); $x = $j.tracker
    Test-Value 'working days' $wb.Worksheets.Item('Settings').Range('C2').Value2 $x.workingDays
    Test-Value 'entries needing attention' $s.Range('D2').Value2 0
    $cols = @{ E='AL'; F='SL'; G='HD'; H='UA'; I='LT'; J='lateMin'; K='approved'; L='present'; M='att'; N='adj' }
    for ($i = 0; $i -lt $x.summary.Count; $i++) { $p = $x.summary[$i]; foreach ($c in $cols.Keys) { Test-Value "$($p.id) $($cols[$c])" $s.Range("$c$(5+$i)").Value2 $p.($cols[$c]) } }
    $t = 5 + $x.summary.Count
    Test-Value 'team present' $s.Range("L$t").Value2 $x.teamPresent; Test-Value 'team working' $s.Range("D$t").Value2 $x.teamWorking; Test-Value 'team approved' $s.Range("K$t").Value2 $x.teamApproved; Test-Value 'team att' $s.Range("M$t").Value2 $x.teamAtt; Test-Value 'team adj' $s.Range("N$t").Value2 $x.teamAdj
    $pr = $wb.Worksheets.Item('Productivity'); for ($i = 0; $i -lt $x.productivity.Count; $i++) { Test-Value "per hour $($x.productivity[$i].id)" $pr.Range("E$(2+$i)").Value2 $x.productivity[$i].perHour }; Test-Value 'ops per hour' $pr.Range("E$(2+$x.productivity.Count)").Value2 $x.opsPerHour
    "error cells: $(Get-ErrorCells $wb)"
    $s.ExportAsFixedFormat(0, (Join-Path $PdfDir 'attsummary.pdf'))
    # each log check must fire; one change at a time, then restore
    $orig = @($log.Range('A3').Value2, $log.Range('B3').Value2, $log.Range('C3').Value2)
    function Set-Row($a, $b, $c) { $log.Range('A3').Value2 = [double]$a; $log.Range('B3').Value2 = [string]$b; $log.Range('C3').Value2 = [string]$c; $xl.CalculateFull() }
    Set-Row $orig[0] 'E99' $orig[2]; Test-Value 'unknown ID flagged' $log.Range('G3').Value2 'Unknown ID'
    Set-Row $orig[0] $orig[1] 'XX'; Test-Value 'unknown code flagged' $log.Range('G3').Value2 'Unknown code'
    Set-Row ([datetime]'2026-04-02').ToOADate() $orig[1] $orig[2]; Test-Value 'outside month flagged' $log.Range('G3').Value2 'Outside month'
    Set-Row ([datetime]'2026-03-23').ToOADate() $orig[1] $orig[2]; Test-Value 'holiday flagged' $log.Range('G3').Value2 'Not a working day'
    Set-Row ([datetime]'2026-03-07').ToOADate() $orig[1] $orig[2]; Test-Value 'weekend flagged' $log.Range('G3').Value2 'Not a working day'
    Set-Row $log.Range('A2').Value2 $log.Range('B2').Value2 $orig[2]; Test-Value 'duplicate flagged' $log.Range('G3').Value2 'Duplicate'; Test-Value 'summary counts the problems' $s.Range('D2').Value2 2
    Set-Row $orig[0] $orig[1] $orig[2]; Test-Value 'restored' $s.Range('D2').Value2 0
    $wb.Close($false)

    $wb = $xl.Workbooks.Open((Join-Path $root 'assets\downloads\GM-HR-Attendance-Dashboard-Example.xlsx'), 0, $true); $xl.CalculateFull()
    $d = $wb.Worksheets.Item('Dashboard'); $calc = $wb.Worksheets.Item('Calc'); $y = $j.hr
    Test-Value 'row check clean' $calc.Range('G2').Value2 0; Test-Value 'banner' $d.Range('E2').Value2 'Data check: OK'
    function Test-Month($m) { $v = $y.months.$m; Test-Value "$m people" $d.Range('B5').Value2 $v.people; Test-Value "$m att" $d.Range('C5').Value2 $v.att; Test-Value "$m adj" $d.Range('D5').Value2 $v.adj; Test-Value "$m approved" $d.Range('E5').Value2 $v.approved; Test-Value "$m ua" $d.Range('F5').Value2 $v.ua; Test-Value "$m late" $d.Range('G5').Value2 $v.late }
    Test-Month 'Mar'
    $depts = 'Operations','Sales','Accounts','Warehouse'
    for ($i = 0; $i -lt 4; $i++) { $v = $y.deptMar.($depts[$i]); $r = 8 + $i; Test-Value "$($depts[$i]) people" $d.Range("C$r").Value2 $v.people
        if ($v.people -lt 5) { foreach ($c in 'D','E','F','G') { Test-Value "$($depts[$i]) hidden $c" $d.Range("$c$r").Value2 'Hidden' } }
        else { Test-Value "$($depts[$i]) att" $d.Range("D$r").Value2 $v.att; Test-Value "$($depts[$i]) adj" $d.Range("E$r").Value2 $v.adj; Test-Value "$($depts[$i]) ua" $d.Range("F$r").Value2 $v.ua; Test-Value "$($depts[$i]) 2+" $d.Range("G$r").Value2 $v.ua2 } }
    "error cells: $(Get-ErrorCells $wb)"
    $d.ExportAsFixedFormat(0, (Join-Path $PdfDir 'hrdash.pdf'))
    foreach ($m in 'Jan','Feb') { $d.Range('C2').Value2 = [string]$m; $xl.CalculateFull(); Test-Month $m }
    $d.Range('C2').Value2 = 'Mar'; $calc.Range('G3').Value2 = [double]12; $xl.CalculateFull(); Test-Value 'raising minimum hides Sales' $d.Range('D9').Value2 'Hidden'; Test-Value 'Operations still shown' $d.Range('D8').Value2 $y.deptMar.Operations.att
    $wb.Worksheets.Item('Data').Range('E2').Value2 = [double]99; $xl.CalculateFull(); Test-Value 'bad row counted' $calc.Range('G2').Value2 1; Test-Value 'banner warns' $d.Range('E2').Value2 'Data check: 1 row(s) wrong'
    $wb.Close($false)
} finally { $xl.Quit(); [Runtime.InteropServices.Marshal]::ReleaseComObject($xl) | Out-Null }
"checks passed $script:ok, failed $script:fail"
if ($script:fail) { exit 1 }
