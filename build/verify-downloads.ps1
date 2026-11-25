# Opens every free workbook in assets/downloads read-only in Microsoft Excel (macros disabled), recalculates,
# and reports error cells, external links and macros. Saves nothing. Usage: powershell -File build\verify-downloads.ps1
$ErrorActionPreference = 'Stop'
$dir = Join-Path (Split-Path $PSScriptRoot -Parent) 'assets\downloads'
$xl = New-Object -ComObject Excel.Application; $xl.Visible = $false; $xl.DisplayAlerts = $false; $xl.AutomationSecurity = 3
$bad = 0; $n = 0
try {
    foreach ($f in Get-ChildItem $dir -Filter *.xlsx) {
        $wb = $xl.Workbooks.Open($f.FullName, 0, $true); $xl.CalculateFull(); $errs = @(); $formulas = 0
        foreach ($s in $wb.Worksheets) {
            $u = $s.UsedRange
            try { $formulas += $u.SpecialCells(-4123).Count } catch {}
            try { $e = $u.SpecialCells(-4123, 16); $errs += "$($s.Name):$($e.Count)" } catch {}
        }
        $links = $wb.LinkSources(1); $n++
        if ($errs -or $links -or $wb.HasVBProject) { $bad++ }
        "{0,-42} sheets {1} formulas {2,5} errors {3} links {4} macros {5}" -f $f.Name, $wb.Worksheets.Count, $formulas, $(if ($errs) { $errs -join ',' } else { 'none' }), $(if ($links) { @($links).Count } else { 0 }), $wb.HasVBProject
        $wb.Close($false)
    }
    # free Lite templates: a quick functional probe that totals react to input
} finally { $xl.Quit(); [Runtime.InteropServices.Marshal]::ReleaseComObject($xl) | Out-Null }
"workbooks $n, with problems $bad"
if ($bad) { exit 1 }
