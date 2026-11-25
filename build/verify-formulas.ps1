# Opens the example workbook in Microsoft Excel (read-only), recalculates, and compares each result with the answer
# worked out separately in formula_library.py. Needs Excel installed. Usage: powershell -File build\verify-formulas.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$data = Get-Content (Join-Path $root 'data\excel-formulas.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$xl = New-Object -ComObject Excel.Application
$xl.Visible = $false; $xl.DisplayAlerts = $false
$fail = 0; $ok = 0
try {
    $wb = $xl.Workbooks.Open((Join-Path $root 'assets\downloads\GM-Excel-Formula-Examples.xlsx'), 0, $true)
    $xl.CalculateFull()
    $ws = $wb.Worksheets.Item('Formulas')
    "Excel $($xl.Version) build $($xl.Build)"
    for ($i = 0; $i -lt $data.formulas.Count; $i++) {
        $f = $data.formulas[$i]; $r = $i + 2
        $shown = $ws.Cells.Item($r, 5).Text
        $value = $ws.Cells.Item($r, 5).Value2
        $check = $ws.Cells.Item($r, 6).Value2
        if ($check -eq 'OK') { $ok++ } else { $fail++; "FAIL row $r $($f.name): shown '$shown' value '$value' expected '$($f.expected)' formula in cell: $($ws.Cells.Item($r,5).Formula)" }
    }
    $errs = 0; foreach ($s in $wb.Worksheets) { foreach ($c in $s.UsedRange.Cells) { if ($c.Text -match '^#(REF|VALUE|NAME|DIV/0|N/A|NUM|SPILL|CALC)') { $errs++ } } }
    "matched $ok, failed $fail, error cells in workbook $errs"
    $wb.Close($false)
} finally {
    $xl.Quit(); [Runtime.InteropServices.Marshal]::ReleaseComObject($xl) | Out-Null
}
if ($fail) { exit 1 }
