// The two attendance guides. Figures come from build/cornerstone_attendance.py, checked in Excel by build/verify-attendance.ps1.
// Every attendance rule in them is an example. Both were approved by the owner on 2026-11-25.
const MS = 'https://support.microsoft.com/en-us/excel/';
const ref = (u, t, n) => `<li><a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>. ${n}</li>`;
const refs = items => `<section class="refs"><h2>References</h2><ul>${items.join('')}</ul><p class="small muted">Links checked on 25 November 2026.</p></section>`;
const fig = (src, w, h, alt, cap) => `<figure class="guide-fig"><a href="../../assets/img/guides/${src}.webp" target="_blank" rel="noopener noreferrer"><img src="../../assets/img/guides/${src}.webp" width="${w}" height="${h}" alt="${alt}" loading="lazy" decoding="async"></a><figcaption>${cap} Select the image to open it full size.</figcaption></figure>`;
const dl = (file, label) => `<p class="guide-dl"><a class="btn btn-primary" href="../../assets/downloads/${file}" download>${label}</a></p>`;
const NOT_ADVICE = '<p class="small muted">The references cover the Excel features. The attendance rules, definitions and management suggestions are examples for general information. They are not legal or HR advice and do not describe the law in any country. Check your own contracts, policies and the law that applies to you.</p>';

export default [
{
slug: 'employee-attendance-productivity-tracking-excel', eyebrow: 'Business', status: 'published', /* approved by the owner 2026-11-25 */
title: 'Employee Attendance and Productivity Tracking in Excel',
desc: 'Define attendance clearly, record absences in an Excel exceptions log, calculate attendance fairly and measure productivity with care, with a free example.',
tools: [['date-difference-calculator', 'Date Difference Calculator'], ['percentage-calculator', 'Percentage Calculator'], ['kpi-performance-calculator', 'KPI Performance Calculator']],
related: ['weighted-kpi-scorecard', 'effective-minutes-of-meeting', 'excel-formulas-sales-ops'],
body: `
<p>Two managers can look at the same month and report different attendance for the same person. One counts approved leave as absence and the other does not. One treats a half day as present. Unless the rules are written down before the counting starts, the percentage cannot be defended, and it should not be used to judge anyone.</p>
<p>This guide shows how to agree the definitions, record attendance in Excel, calculate it in two clearly labelled ways and add a productivity measure without drawing conclusions the numbers cannot support. <strong>All the rules below are examples.</strong> Replace them with your organisation's approved policy.</p>
${dl('GM-Attendance-Tracking-Example.xlsx', 'Download the example attendance workbook (.xlsx)')}
<h2>1. Write the rules first</h2>
<p>Answer these before you build anything:</p>
<ul><li>Which days are working days? Which holidays apply, and to whom?</li><li>Which kinds of leave exist, and who approves them?</li><li>How is a half day counted?</li><li>When is someone late, and does lateness affect attendance or only get recorded?</li><li>How are remote work, business travel and training counted?</li><li>Who records entries, by when, and who can correct them?</li></ul>
<p>The example uses a made-up team of eight in March 2026, with Saturday and Sunday off and one example holiday on 23 March. That leaves <strong>21 working days</strong>. Its codes are:</p>
<table><tr><th>Code</th><th>Meaning</th><th>Days away</th><th>Counts as approved leave</th></tr>
<tr><td>AL</td><td>Approved annual leave</td><td>1</td><td>1</td></tr>
<tr><td>SL</td><td>Approved sick leave</td><td>1</td><td>1</td></tr>
<tr><td>HD</td><td>Half day, approved</td><td>0.5</td><td>0.5</td></tr>
<tr><td>UA</td><td>Unapproved absence</td><td>1</td><td>0</td></tr>
<tr><td>LT</td><td>Late arrival, still present</td><td>0</td><td>0</td></tr></table>
<h2>2. Choose how to record</h2>
<p>An <strong>attendance register</strong> has an entry for every person on every day. It is complete but slow to fill in. An <strong>exceptions log</strong> records only what differs from normal attendance: leave, absence or lateness. Everyone else counts as present.</p>
<p>The example uses an exceptions log with 19 entries for the month. It is quick, but it has a serious weakness: <strong>a forgotten entry makes attendance look better than it was.</strong> Use it only if someone confirms each day or week that all absences have been entered. If your organisation must prove who was present, for pay, safety or legal reasons, use a time and attendance record that captures presence directly.</p>
<p>Each row holds the date, employee ID, code and, for late arrivals, the minutes. Drop-down lists limit the IDs and codes. A Check column then flags an unknown ID, an unknown code, a date outside the month, an entry on a weekend or holiday, and two entries for one person on one day. The Summary sheet counts entries needing attention. Do not use the figures until it reads zero.</p>
<h2>3. Count working days with a formula</h2>
<p>Excel's NETWORKDAYS.INTL function counts working days between two dates, lets you choose the weekend and skips a list of holidays:</p>
<pre><code>=NETWORKDAYS.INTL(A2, B2, 1, $A$6:$A$30)</code></pre>
<p>A2 and B2 are the first and last day of the month. The 1 means Saturday and Sunday are the weekend. Other numbers select other patterns, such as Friday and Saturday, or Sunday only, so check the list in Microsoft's reference. People on different shift patterns need their own working-day counts. The example gives everyone the same one.</p>
<h2>4. Calculate attendance in two ways</h2>
<pre><code>Days present             = working days − days away
Attendance               = days present ÷ working days
Excluding approved leave = days present ÷ (working days − approved leave days)</code></pre>
<p>The first figure answers "how much of the month was the person at work?" The second answers "of the days they were expected, how many did they attend?" Label both. A figure without its definition will be read in whichever way the reader assumes.</p>
${fig('attendance-summary-sheet', 1500, 407, 'Excel attendance summary for eight sample employees in March 2026 with leave, half days, unapproved days, late arrivals, days present, attendance and attendance excluding approved leave', 'The Summary sheet with sample data, printed from Microsoft Excel.')}
<h2>5. Read the results carefully</h2>
<p>The sample shows why one percentage is not enough:</p>
<ul><li><strong>Celine</strong> has the lowest attendance, 85.7%. All of it is three days of approved annual leave. Excluding approved leave, the figure is 100%.</li>
<li><strong>Bilal, Danish and Gul</strong> all show 90.5%. Gul had two days of annual leave and Danish two days of sick leave. Bilal had two unapproved days, so only Bilal's figure stays at 90.5% when approved leave is excluded.</li></ul>
<p>Ranking people on the first figure would put someone who used approved leave at the bottom. That is unfair, and it may discourage people from taking leave they are entitled to.</p>
<p>For the team, there were 168 possible days (eight people × 21). With 10 days of approved leave and 3 unapproved days, 155 days were attended: <strong>92.3%</strong> attendance, or <strong>98.1%</strong> excluding approved leave. There were also 5 late arrivals totalling 105 minutes. Calculate team figures from total days, which keeps them correct when people have different numbers of working days.</p>
<h2>6. Handle the difficult cases</h2>
<ul><li><strong>Joiners and leavers:</strong> count only the days they were employed. The example workbook does not do this; change that person's working days and note why.</li>
<li><strong>Long leave:</strong> long approved absences can distort a team percentage. Show them separately in a note, without health details.</li>
<li><strong>Corrections:</strong> keep a record of what changed, who changed it and why.</li>
<li><strong>Disputes:</strong> let employees see their own record and say how to challenge an entry.</li></ul>
<h2>7. Measure productivity separately</h2>
<p>Attendance says whether someone was there. It says nothing about what was achieved. For work with comparable units, output per hour is a simple starting measure:</p>
<pre><code>Output per hour = output ÷ hours worked</code></pre>
<p>The workbook has a separate sheet for four people in the sample's Operations team, with made-up hours and orders processed:</p>
<table><tr><th>Employee</th><th>Hours</th><th>Orders</th><th>Orders per hour</th></tr>
<tr><td>Ayesha</td><td>151</td><td>906</td><td>6.00</td></tr>
<tr><td>Bilal</td><td>140</td><td>700</td><td>5.00</td></tr>
<tr><td>Celine</td><td>136</td><td>884</td><td>6.50</td></tr>
<tr><td>Hamza</td><td>156</td><td>936</td><td>6.00</td></tr>
<tr><td>Team</td><td>583</td><td>3,426</td><td>5.88</td></tr></table>
<p>Celine worked the fewest hours and had the highest rate. Bilal's rate is lowest, but the table cannot say why. The orders may have been more complex, a system may have been down, or Bilal may have spent time training someone. Find out before drawing a conclusion.</p>
<p>The team rate is total orders divided by total hours, not the average of the four rates. Compare like with like, add a quality measure such as errors or returns, and do not treat output per hour as a complete view of performance. For several measures together, see the <a href="../weighted-kpi-scorecard/">weighted KPI scorecard guide</a>. To check a single person's percentage or a team's hourly rate, use the <a href="../../business-calculators/#attendance">attendance calculator</a> and the <a href="../../business-calculators/#productivity">productivity calculator</a>.</p>
<h2>8. Protect personal information</h2>
<p>Attendance records are personal data, and leave types can reveal sensitive matters such as health.</p>
<ul><li>Record only what you need. Do not write diagnoses or medical details in a spreadsheet.</li><li>Limit who can open the file, and avoid sending it by chat or personal email.</li><li>Decide how long records are kept and how they are deleted.</li><li>Tell employees what is recorded and why.</li></ul>
<p>Sheet protection helps prevent accidental changes but is not a security control. A password on the file is a separate Excel feature; access control on the folder or system where it is stored matters as well. Privacy and record-keeping duties differ between countries, so confirm yours.</p>
<h2>Advantages and limits of Excel</h2>
<p><strong>Advantages:</strong> low cost where Excel is already used, visible formulas and easy changes to codes.</p>
<p><strong>Limits:</strong> it relies on manual entry, has no built-in leave approval, cannot easily show who edited what, and becomes hard to manage with shifts, several sites or many employees. If pay depends on the records, consider a dedicated attendance or HR system and check its results against your rules.</p>
<h2>Common mistakes</h2>
<ul><li>Starting to count before agreeing definitions.</li><li>Treating approved and unapproved absence as the same thing.</li><li>Assuming a blank means present without anyone confirming it.</li><li>Averaging percentages instead of using total days.</li><li>Judging performance from attendance or output alone.</li><li>Sharing a named list more widely than necessary.</li></ul>
<h2>Practical next steps</h2>
<p>Agree your rules on one page, then record two weeks and compare the log with what supervisors remember. Fix the gaps before reporting percentages. When you need a management view across months and departments, follow the <a href="../hr-attendance-dashboard-excel/">HR attendance dashboard guide</a>. A ready-made <a href="../../shop/#hr-attendance-tracker">HR attendance and leave tracker</a> is also available in the shop.</p>
<h2>Frequently asked questions</h2>
<h3>Should approved leave reduce attendance?</h3>
<p>It depends on what you are measuring. Show both figures if there is any doubt, and say which one your policy uses.</p>
<h3>Should late arrivals count as absence?</h3>
<p>The example records them separately and does not reduce attendance. Any rule that turns lateness into absence or affects pay needs to be in your written policy and permitted by the law that applies.</p>
<h3>What is a good attendance percentage?</h3>
<p>There is no single figure that suits every organisation. It depends on leave entitlements, the kind of work and what you count. Compare similar periods using the same definitions.</p>
<h3>Can I use this for several months?</h3>
<p>The example covers one month. Keep one file per month, or add a month column to your own version and include it in every formula. Test the totals after any change.</p>
<h3>Does the workbook calculate pay?</h3>
<p>No. It counts days and late minutes. It does not calculate salary, deductions or leave balances.</p>
<h3>Which functions does the workbook use?</h3>
<p>Mainly COUNTIFS, SUMIFS, INDEX, MATCH, EOMONTH and NETWORKDAYS.INTL. It was checked in Microsoft Excel (version 16.0). Other versions and programs were not tested.</p>
${refs([ref(MS + 'functions/networkdays-intl-function', 'Microsoft Support: NETWORKDAYS.INTL', 'Working days with custom weekends and holidays.'), ref(MS + 'functions/countifs-function', 'Microsoft Support: COUNTIFS', 'Counting entries by person and code.'), ref(MS + 'functions/sumifs-function', 'Microsoft Support: SUMIFS', 'Totalling days and minutes.'), ref(MS + 'get-started/apply-data-validation-to-cells', 'Microsoft Support: Data validation', 'Limiting what can be entered.'), ref(MS + 'protect-a-worksheet', 'Microsoft Support: Protect a worksheet', 'What worksheet protection does.'), ref(MS + 'get-started/protect-an-excel-file', 'Microsoft Support: Protect an Excel file', 'Password protection for a file.')])}
${NOT_ADVICE}
`
},
{
slug: 'hr-attendance-dashboard-excel', eyebrow: 'Business Intelligence', status: 'published', /* approved by the owner 2026-11-25 */
title: 'How to Build an HR Attendance Dashboard in Excel',
desc: 'Turn monthly attendance data into an Excel HR dashboard with correct department totals, trends, follow-up counts, data checks and care for privacy.',
tools: [['percentage-calculator', 'Percentage Calculator'], ['business-report-generator', 'Business Report Generator'], ['kpi-performance-calculator', 'KPI Performance Calculator']],
related: ['employee-attendance-productivity-tracking-excel', 'excel-dashboard-guide-business-reporting', 'weighted-kpi-scorecard'],
body: `
<p>A manager asks, "How was attendance last month?" and receives a sheet with a row for every employee. It contains the answer, but nobody can see it, and it shows far more about individuals than most readers need. An HR attendance dashboard should show the overall picture, where attention is needed and whether the figures can be trusted, while limiting what it reveals about any one person.</p>
<p>This guide builds one from monthly records for a made-up organisation of 38 people in four departments, January to March 2026. It assumes your daily attendance is already recorded. If not, start with the <a href="../employee-attendance-productivity-tracking-excel/">attendance tracking guide</a>. For general dashboard layout and charts, see the <a href="../excel-dashboard-guide-business-reporting/">Excel dashboard guide</a>. This page concentrates on what is different about people data.</p>
${dl('GM-HR-Attendance-Dashboard-Example.xlsx', 'Download the example HR dashboard (.xlsx)')}
${fig('hr-attendance-dashboard', 1218, 1449, 'Example HR attendance dashboard for March 2026: 38 people, 96.7 percent attendance, 99.0 percent excluding approved leave, 8 unapproved days, a department table with the Accounts department hidden, and monthly charts', 'The dashboard with sample data, printed from Microsoft Excel.')}
<h2>1. Agree who the dashboard is for</h2>
<p>A leadership team usually needs totals and trends. A department manager may need their own team. HR may need individual records to give support or apply a policy. These are different reports with different access. Do not give everyone the most detailed one.</p>
<p>For each measure, write down the definition, the data source, who owns it and what someone might reasonably do when it changes.</p>
<h2>2. Prepare one row per person per month</h2>
<p>The Data sheet has 114 rows, which is 38 people for three months. Each row has the month, employee ID, department, working days, days present, approved leave days, unapproved days and late arrivals. It uses IDs, not names, because the dashboard never needs a name.</p>
<p>A Row check column tests that <strong>days present + approved leave + unapproved days = working days</strong>. The dashboard shows "Data check: OK" only when every row passes. We tested this by changing one value in a copy: the message changed to show one wrong row. This check cannot find a person who is missing altogether, so also compare the number of people with your employee list.</p>
<h2>3. Calculate rates from totals</h2>
<pre><code>Attendance = SUMIFS(days present) ÷ SUMIFS(working days)
Excluding approved leave = SUMIFS(days present) ÷ (SUMIFS(working days) − SUMIFS(approved leave))</code></pre>
<p>In March the organisation's attendance was <strong>96.7%</strong>. The simple average of the four department rates would be 97.2%, because it gives the four-person Accounts team the same weight as the fourteen-person Operations team. Always divide the totals.</p>
<h2>4. Choose the headline tiles</h2>
<p>The example shows six for the chosen month: people (38), attendance (96.7%), attendance excluding approved leave (99.0%), approved leave days (18), unapproved days (8) and late arrivals (18). The people count assumes one row per person per month, so a duplicate row would inflate it.</p>
<h2>5. Look beyond the headline</h2>
<p>This is where the sample becomes useful:</p>
<table><tr><th>Month</th><th>Attendance</th><th>Excluding approved leave</th><th>Approved leave days</th><th>Unapproved days</th><th>Late arrivals</th></tr>
<tr><td>January</td><td>97.5%</td><td>99.6%</td><td>18</td><td>3</td><td>24</td></tr>
<tr><td>February</td><td>96.8%</td><td>99.5%</td><td>20</td><td>4</td><td>18</td></tr>
<tr><td>March</td><td>96.7%</td><td>99.0%</td><td>18</td><td>8</td><td>18</td></tr></table>
<p>From February to March the main attendance figure barely moved, from 96.8% to 96.7%. In the same month, <strong>unapproved days doubled from 4 to 8</strong>. Two fewer days of approved leave hid much of the change. A dashboard that showed only the headline rate would have missed it.</p>
<p>Months also have different numbers of working days: 22, 20 and 21 in this sample. That is why rates are better than raw counts for attendance. For counts such as unapproved days, remember that headcount and working days can affect them too. Three months are not enough to show a lasting trend.</p>
<h2>6. Compare departments fairly</h2>
<table><tr><th>Department (March)</th><th>People</th><th>Attendance</th><th>Excluding approved leave</th><th>Unapproved days</th><th>People with 2 or more</th></tr>
<tr><td>Operations</td><td>14</td><td>97.6%</td><td>99.7%</td><td>1</td><td>0</td></tr>
<tr><td>Sales</td><td>9</td><td>96.3%</td><td>99.5%</td><td>1</td><td>0</td></tr>
<tr><td>Accounts</td><td>4</td><td>Hidden</td><td>Hidden</td><td>Hidden</td><td>Hidden</td></tr>
<tr><td>Warehouse</td><td>11</td><td>94.8%</td><td>97.3%</td><td>6</td><td>1</td></tr></table>
<p>The Warehouse team accounts for 6 of the 8 unapproved days, and one person there had two or more. The last column matters: the same total can come from many people with one day each or from one person with several, and those situations need different conversations. It is a reason to ask questions, not a finding of misconduct. Shift patterns, transport problems, illness recorded under the wrong code or a data error could all be behind it.</p>
<h2>7. Handle small groups with care</h2>
<p>In a very small team, a department figure can point to one person. The example hides departments with fewer than five people:</p>
<pre><code>=IF($C10&lt;Calc!$G$3, "Hidden", SUMIFS(…)/SUMIFS(…))</code></pre>
<p>Five is a setting chosen for this example, in cell Calc!G3. It is not a legal standard.</p>
<p><strong>Hiding a row is not enough on its own.</strong> Here the organisation had 8 unapproved days and the three visible departments account for 1 + 1 + 6 = 8. A reader can work out that Accounts had none. The workbook also contains every row on its Data sheet. To share results with a wider audience, send only the summary, check whether hidden figures can be worked out by subtraction, and consider combining small groups or leaving out the total that gives them away.</p>
<h2>8. Add charts that answer a question</h2>
<p>The example has two: attendance by month, with and without approved leave, and unapproved days by month. The percentage chart starts at zero, so small differences look small. If you need to show finer movement, use a table, or a clearly labelled line chart, rather than a shortened column axis. Check that each chart's title says what it counts. These two charts always show all three months, whatever month is selected above.</p>
<h2>9. Decide what happens next</h2>
<p>A dashboard is useful only if there is a fair, agreed response. For example:</p>
<ol><li>Check that the data is complete and correctly coded.</li><li>Look at whether the change comes from many people or a few.</li><li>Ask the relevant manager about work conditions in that period.</li><li>Where an individual needs a conversation, have it privately, hear their side and follow your policy.</li><li>Record the action and review it later.</li></ol>
<p>Do not use a colour or a threshold to trigger discipline automatically.</p>
<h2>10. Maintain it safely</h2>
<ul><li>Add each new month as new rows, then extend the Calc table, charts and month list.</li><li>For a new department, add a row to the department table and check that the people and unapproved totals still reconcile.</li><li>Add a year column before the data covers more than twelve months.</li><li>Store the file where access is limited and logged if possible.</li><li>Remove data you no longer need according to your retention rules.</li></ul>
<h2>Advantages and limits</h2>
<p><strong>Advantages:</strong> one consistent set of definitions, a quick monthly view and formulas that can be inspected.</p>
<p><strong>Limits:</strong> manual updates, weak access control compared with an HR system, no automatic audit history and privacy risks when files are copied. The dashboard shows patterns, not causes, and cannot judge whether a recorded reason is correct. If many people need access, or each should see only their own team, use a system that can enforce permissions.</p>
<h2>Common mistakes</h2>
<ul><li>Putting employee names on a leadership dashboard.</li><li>Reporting one attendance rate with no definition.</li><li>Averaging department percentages.</li><li>Ranking departments with very different shift patterns or headcounts without context.</li><li>Assuming a hidden row keeps its figures private.</li><li>Showing sick leave details for small groups.</li></ul>
<h2>Frequently asked questions</h2>
<h3>Which attendance rate should be the headline?</h3>
<p>Use the one your policy defines, and show the other beside it. In the sample, they differ by more than two percentage points in March.</p>
<h3>Should the dashboard rank employees?</h3>
<p>This design does not. A ranking invites comparisons without context. Where individual follow-up is needed, handle it separately with limited access.</p>
<h3>What minimum group size should I use?</h3>
<p>There is no figure that suits every case. Consider how identifiable people are, what the figures could reveal and the rules that apply to you. Ask whoever is responsible for data protection.</p>
<h3>Can I add turnover or overtime?</h3>
<p>Yes, with their own definitions and checks. Add measures only when someone will use them, and avoid combining unrelated figures into one score.</p>
<h3>Why does my total differ from the department table?</h3>
<p>A department may be spelled differently, be missing from the table or be hidden by the small-group rule. Hidden departments are still included in the headline totals.</p>
<h3>Can I use it with Excel for the web?</h3>
<p>The workbook uses common functions, but it was checked only in the desktop version of Microsoft Excel (version 16.0). Test it where you plan to use it.</p>
${refs([ref(MS + 'functions/sumifs-function', 'Microsoft Support: SUMIFS', 'Totals by month and department.'), ref(MS + 'functions/countifs-function', 'Microsoft Support: COUNTIFS', 'Counting people who meet a condition.'), ref(MS + 'get-started/create-a-drop-down-list', 'Microsoft Support: Create a drop-down list', 'The month selector.'), ref(MS + 'get-started/create-a-chart-from-start-to-finish', 'Microsoft Support: Create a chart', 'Adding and formatting charts.'), ref(MS + 'protect-a-worksheet', 'Microsoft Support: Protect a worksheet', 'What worksheet protection does.'), ref(MS + 'get-started/protect-an-excel-file', 'Microsoft Support: Protect an Excel file', 'Password protection for a file.')])}
${NOT_ADVICE}
`
}
];
