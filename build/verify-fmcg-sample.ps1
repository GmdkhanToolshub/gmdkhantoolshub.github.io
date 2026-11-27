# Opens the sample workbook in real Excel, recalculates it, and compares it with the figures the web page shows.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$data = Get-Content "$root\build\fmcg-sample.json" -Raw | ConvertFrom-Json
$xl = New-Object -ComObject Excel.Application; $xl.Visible = $false; $xl.DisplayAlerts = $false
try {
  $wb = $xl.Workbooks.Open("$root\assets\downloads\gm-fmcg-sales-sample-dashboard.xlsx", 0, $true)
  $xl.CalculateFull()
  $db = $wb.Worksheets.Item('Dashboard'); $ck = $wb.Worksheets.Item('Checks')
  $script:n = 0; $script:bad = @()
  function Test-Near($what, $excel, $page) { $script:n++; if ([Math]::Abs([double]$excel - [double]$page) -gt 0.001) { $script:bad += "$what excel=$excel page=$page" } }
  Test-Near 'target' $db.Range('A5').Value2 $data.head.target
  Test-Near 'secondary' $db.Range('B5').Value2 $data.head.secondary
  Test-Near 'primary' $db.Range('D5').Value2 $data.head.primary
  Test-Near 'billed' $db.Range('F5').Value2 $data.head.billed
  Test-Near 'listed' $db.Range('G5').Value2 $data.head.listed
  for ($i = 0; $i -lt 8; $i++) { $r = 8 + $i; $d = $data.distributors[$i]
    Test-Near "$($d.name) target" $db.Cells.Item($r, 2).Value2 $d.target; Test-Near "$($d.name) secondary" $db.Cells.Item($r, 3).Value2 $d.secondary
    Test-Near "$($d.name) coverage" $db.Cells.Item($r, 6).Value2 $d.coverage; Test-Near "$($d.name) cover days" $db.Cells.Item($r, 8).Value2 $d.cover }
  for ($i = 0; $i -lt 4; $i++) { Test-Near "category $i" $db.Cells.Item(18 + $i, 3).Value2 $data.categories[$i].secondary }
  for ($i = 0; $i -lt 6; $i++) { Test-Near "month $i" $db.Cells.Item(24 + $i, 3).Value2 $data.trend[$i].secondary }
  $results = 2..6 | ForEach-Object { $ck.Cells.Item($_, 4).Text }
  $errors = 0; foreach ($ws in $wb.Worksheets) { foreach ($c in $ws.UsedRange.Cells) { if ($c.Text -match '^#(REF|VALUE|DIV|NAME|N/A|NUM|NULL)') { $errors++ } } }
  $flags = (8..15 | ForEach-Object { $db.Cells.Item($_, 9).Text }) | Group-Object | ForEach-Object { "$($_.Name): $($_.Count)" }
  # another month must also recalculate and still match
  $db.Range('B2').Value2 = '2026-03'; $xl.CalculateFull(); Test-Near 'March secondary' $db.Range('B5').Value2 $data.trend[2].secondary
  $march = (2..6 | ForEach-Object { $ck.Cells.Item($_, 4).Text }) -join ','
  "values compared: $script:n | differences: $($script:bad.Count) $($script:bad -join '; ')"
  "checks sheet: $($results -join ',') | after switching month: $march"
  "formula error cells: $errors | stock flags: $($flags -join ', ')"
  $wb.Close($false)
} finally { $xl.Quit(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($xl) }
