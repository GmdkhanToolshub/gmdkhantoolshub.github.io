# Boundary test of the paid workbooks in products/ (private): put data in the LAST row each product claims to support
# and check the results and totals follow. Opens read-only with macros disabled and never saves.
# Usage: powershell -File build\verify-shop-products.ps1
$ErrorActionPreference = 'Stop'
$dir = Join-Path (Split-Path $PSScriptRoot -Parent) 'products'
$script:ok = 0; $script:fail = 0; $script:product = ''
function Check($name, $got, $want) {
    $same = if ($want -is [string]) { "$got" -eq $want } else { $got -isnot [string] -and $null -ne $got -and [math]::Abs([double]$got - [double]$want) -lt 0.01 }
    if ($same) { $script:ok++ } else { $script:fail++; "  FAIL $($script:product) | $name : got '$got' expected '$want'" }
}
function V($ws, $ref) { $wb.Worksheets.Item($ws).Range($ref).Value2 }
function Put($ws, $ref, $value) { $r = $wb.Worksheets.Item($ws).Range($ref); if ($value -is [datetime]) { $r.Value2 = [double]$value.ToOADate() } elseif ($value -is [string]) { $r.Value2 = [string]$value } else { $r.Value2 = [double]$value } }
$xl = New-Object -ComObject Excel.Application; $xl.Visible = $false; $xl.DisplayAlerts = $false; $xl.AutomationSecurity = 3
function Open($file) { $script:product = Split-Path $file -Leaf; $script:wb = $xl.Workbooks.Open((Join-Path $dir $file), 0, $true); $xl.CalculateFull() }
function SlabTax($a) { $b = @(@(600000,0,0,0),@(1200000,1,0,600000),@(2200000,11,6000,1200000),@(3200000,20,116000,2200000),@(4100000,25,316000,3200000),@(5600000,29,541000,4100000),@(7000000,32,976000,5600000),@([double]::MaxValue,35,1424000,7000000)); foreach ($r in $b) { if ($a -le $r[0]) { return $r[2] + ($a - $r[3]) * $r[1] / 100 } } }
function Done { $wb.Close($false); "$($script:product): checked" }
try {
    # Team KPI: 50th person, results exactly on target (lower-is-better at its target) -> 100%
    Open 'Team-KPI-Scorecard.xlsx'; Put 'Team Scores' 'A55' 'Test Fifty'; Put 'Team Scores' 'C55' 100; Put 'Team Scores' 'D55' 100; Put 'Team Scores' 'E55' 100; Put 'Team Scores' 'F55' 5; $xl.CalculateFull()
    Check '50th person scores 100%' (V 'Team Scores' 'S55') 1.0; Check '50th person has a rank' ([bool]((V 'Team Scores' 'U55') -ge 1)) 'True'
    Put 'Team Scores' 'C55' 200; $xl.CalculateFull(); Check 'over-achievement capped at 120% (40% weight)' (V 'Team Scores' 'S55') 1.08; Done

    Open 'Sales-Target-Run-Rate-Tracker.xlsx'; $base = V 'Team Tracker' 'C31'; Put 'Team Tracker' 'A30' 'Rep Twentyfive'; Put 'Team Tracker' 'C30' 1000; Put 'Team Tracker' 'D30' 500; $xl.CalculateFull()
    Check '25th rep achievement' (V 'Team Tracker' 'E30') 0.5; Check 'team total includes 25th rep' (V 'Team Tracker' 'C31') ($base + 1000); Done

    Open 'Inventory-Sales-Tracker.xlsx'; $rev = V 'Dashboard' 'B4'
    Put 'Products' 'A205' 'SKU-200'; Put 'Products' 'B205' 'Test item'; Put 'Products' 'D205' 10; Put 'Products' 'E205' 15; Put 'Products' 'F205' 10; Put 'Products' 'G205' 20
    Put 'Stock In' 'A1005' ([datetime]'2026-03-01'); Put 'Stock In' 'B1005' 'SKU-200'; Put 'Stock In' 'D1005' 5
    Put 'Sales' 'A1005' ([datetime]'2026-03-02'); Put 'Sales' 'B1005' 'SKU-200'; Put 'Sales' 'D1005' 3; $xl.CalculateFull()
    Check '200th product current stock 10+5-3' (V 'Products' 'J205') 12; Check 'reorder status' (V 'Products' 'L205') 'Reorder'; Check 'profit 3 x (15-10)' (V 'Products' 'N205') 15; Check 'dashboard revenue includes row 1005' (V 'Dashboard' 'B4') ($rev + 45); Done

    Open 'Invoice-Payment-Tracker.xlsx'; $inv = V 'Dashboard' 'B4'; $rcv = V 'Dashboard' 'B5'
    Put 'Payment Register' 'A1005' 'INV-LAST'; Put 'Payment Register' 'B1005' ([datetime]::Today); Put 'Payment Register' 'C1005' 'Nobody'; Put 'Payment Register' 'D1005' 1000; Put 'Payment Register' 'F1005' 400; $xl.CalculateFull()
    Check 'row 1000 balance' (V 'Payment Register' 'H1005') 600; Check 'status part paid' (V 'Payment Register' 'I1005') 'Part paid'; Check 'total invoiced' (V 'Dashboard' 'B4') ($inv + 1000); Check 'total received' (V 'Dashboard' 'B5') ($rcv + 400)
    Put 'Payment Register' 'B1005' ([datetime]::Today.AddDays(-400)); $xl.CalculateFull(); Check 'old unpaid invoice is overdue' (V 'Payment Register' 'I1005') 'Overdue'; Done

    Open 'Personal-Budget-Planner.xlsx'; Put 'Dashboard' 'B4' 'March'; $xl.CalculateFull(); $inc = V 'Dashboard' 'B7'
    Put 'Transactions' 'A1005' ([datetime]'2026-03-15'); Put 'Transactions' 'B1005' 'Salary'; Put 'Transactions' 'D1005' 1234; $xl.CalculateFull(); Check 'row 1000 income counted in March' (V 'Dashboard' 'B7') ($inc + 1234); Done

    Open 'HR-Attendance-Leave-Tracker.xlsx'; Put 'Setup' 'A61' 'E050'; Put 'Setup' 'B61' 'Fiftieth Person'; Put 'Setup' 'C61' 'Sales'; Put 'Setup' 'B5' 3
    Put 'Attendance Log' 'A2004' ([datetime]'2026-03-02'); Put 'Attendance Log' 'B2004' 'Fiftieth Person'; Put 'Attendance Log' 'C2004' 'Absent'; $xl.CalculateFull()
    $wd = V 'Monthly Summary' 'C56'; Check 'March 2026 working days, Sat+Sun off, template holidays' $wd 22; Check '50th employee absence from last log row' (V 'Monthly Summary' 'D56') 1; Check 'attendance %' (V 'Monthly Summary' 'J56') (($wd - 1) / $wd)
    Put 'Setup' 'B6' 'Friday and Saturday'; $xl.CalculateFull(); Check 'Fri+Sat weekend changes working days' (V 'Monthly Summary' 'C56') 23; Done

    # Pakistan tax: same expected figures as the site calculator's 2026-27 slabs (not a legal verification)
    Open 'Pakistan-Payroll-Salary-Tax-Workbook.xlsx'
    foreach ($t in @(@(100000, 500), @(200000, 13000), @(300000, 34667))) {
        Put 'Employees' 'A104' 'E100'; Put 'Employees' 'B104' 'Hundredth'; Put 'Employees' 'C104' 'Sales'; Put 'Employees' 'D104' $t[0]; foreach ($c in 'E','F','G','H','I') { Put 'Employees' "${c}104" 0 }; $xl.CalculateFull()
        Check "100th employee monthly tax on $($t[0])" (V 'Payroll' 'G105') $t[1] }
    Done

    Open 'salary-tax-pack\Pakistan-Salary-Tax-Pack.xlsx'
    foreach ($t in @(@(100000, 500), @(200000, 13000), @(300000, 34666.67))) { Put 'Calculator' 'B4' $t[0]; Put 'Payroll' 'C29' $t[0]; foreach ($c in 'D','E','F') { Put 'Payroll' "${c}29" 0 }; $xl.CalculateFull(); Check "calculator monthly tax on $($t[0])" (V 'Calculator' 'B13') $t[1]; Check "25th payroll row tax on $($t[0])" (V 'Payroll' 'I29') $t[1] }
    Done

    Open 'Freelancer-Income-Tax-Tracker.xlsx'; $b5 = V 'Dashboard' 'B5'
    Put 'Income' 'A504' ([datetime]'2026-08-01'); Put 'Income' 'B504' 'Last Client'; Put 'Income' 'D504' 'USD'; Put 'Income' 'E504' 100; Put 'Income' 'F504' 10; Put 'Income' 'G504' 280; Put 'Income' 'I504' 'Paid'; $xl.CalculateFull()
    Check 'row 500: 100 USD less 10% at 280' (V 'Income' 'H504') 25200; Check 'dashboard includes it' (V 'Dashboard' 'B5') ($b5 + 25200)
    # estimated tax on the dashboard profit must match the 2026-27 slabs used by the site calculator
    foreach ($amount in 500000, 2000000, 5000000) { Put 'Income' 'D504' 'PKR'; Put 'Income' 'E504' $amount; Put 'Income' 'F504' 0; Put 'Income' 'G504' 1; $xl.CalculateFull(); $p = V 'Dashboard' 'B8'; Check "estimated tax on profit $p" (V 'Dashboard' 'B9') ([math]::Round((SlabTax $p), 0)) }
    Done

    Open 'Recruitment-Hiring-Tracker.xlsx'; $total = V 'Dashboard' 'B3'; $pos = V 'Positions' 'A4'; $app = V 'Positions' 'E4'; $hired = V 'Positions' 'H4'
    Put 'Candidates' 'B304' 'Candidate 300'; Put 'Candidates' 'C304' ([string]$pos); Put 'Candidates' 'F304' 'Hired'; Put 'Candidates' 'G304' ([datetime]'2026-10-01'); $xl.CalculateFull()
    Check 'dashboard total includes 300th' (V 'Dashboard' 'B3') ($total + 1); Check 'position applicants' (V 'Positions' 'E4') ($app + 1); Check 'position hires' (V 'Positions' 'H4') ($hired + 1); Done

    Open 'Sales-Leads-Pipeline-Tracker.xlsx'; $n = V 'Dashboard' 'B3'; $open = V 'Dashboard' 'B4'; $od = V 'Dashboard' 'B8'
    Put 'Leads' 'B304' 'Lead 300'; Put 'Leads' 'G304' 'Proposal sent'; Put 'Leads' 'H304' 1000; Put 'Leads' 'L304' ([datetime]::Today.AddDays(-3)); $xl.CalculateFull()
    Check 'total leads' (V 'Dashboard' 'B3') ($n + 1); Check 'open pipeline' (V 'Dashboard' 'B4') ($open + 1000); Check 'overdue follow-up flagged' (V 'Leads' 'M304') 'Overdue'; Check 'overdue count' (V 'Dashboard' 'B8') ($od + 1)
    Check 'weighted value uses stage probability' (V 'Leads' 'J304') (1000 * (V 'Leads' 'I304')); Done
} finally { $xl.Quit(); [Runtime.InteropServices.Marshal]::ReleaseComObject($xl) | Out-Null }
"boundary checks passed $script:ok, failed $script:fail"
if ($script:fail) { exit 1 }
