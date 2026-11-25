// Sales performance, monthly reporting, and BI vs analytics guides. Figures come from build/cornerstone_reporting.py,
// checked in Excel by build/verify-reporting.ps1. status stays 'draft' until the owner approves.
const MS = 'https://support.microsoft.com/en-us/excel/';
const ref = (u, t, n) => `<li><a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>. ${n}</li>`;
const refs = items => `<section class="refs"><h2>References</h2><ul>${items.join('')}</ul><p class="small muted">Links checked on 25 November 2026.</p></section>`;
const fig = (src, w, h, alt, cap) => `<figure class="guide-fig"><a href="../../assets/img/guides/${src}.webp" target="_blank" rel="noopener noreferrer"><img src="../../assets/img/guides/${src}.webp" width="${w}" height="${h}" alt="${alt}" loading="lazy" decoding="async"></a><figcaption>${cap} Select the image to open it full size.</figcaption></figure>`;
const dl = (file, label) => `<p class="guide-dl"><a class="btn btn-primary" href="../../assets/downloads/${file}" download>${label}</a></p>`;
const NOT_ADVICE = t => `<p class="small muted">${t} All names and figures are made up. The management suggestions are general information, not professional advice.</p>`;

export default [
{
slug: 'sales-performance-dashboard-measures', eyebrow: 'Sales Operations', status: 'draft',
title: 'Sales Performance Dashboard: Which Measures to Use',
desc: 'Choose and read sales dashboard measures: achievement, pace, required daily sales, projection, outlet coverage, invoice value, lines and product mix.',
tools: [['sales-target-calculator', 'Sales Target Calculator'], ['kpi-performance-calculator', 'KPI Performance Calculator'], ['percentage-calculator', 'Percentage Calculator']],
related: ['excel-dashboard-guide-business-reporting', 'secondary-vs-primary-sales-fmcg', 'sales-target-tracking'],
body: `
<p>On the sixteenth selling day, a team has reached 61.9% of its monthly target. Is that good? The percentage alone cannot say. It depends on how much of the month has gone, who is carrying the result, which products are selling and how many customers are buying.</p>
<p>This guide is about choosing and reading the measures on a sales performance dashboard. For the Excel construction steps, such as data layout, month selectors and charts, see the <a href="../excel-dashboard-guide-business-reporting/">Excel dashboard guide</a>. The example here is a made-up team of six representatives, day 16 of 26 selling days.</p>
${dl('GM-Sales-Performance-Example.xlsx', 'Download the example sales scorecard (.xlsx)')}
${fig('sales-performance-scorecard', 1500, 552, 'Example sales performance scorecard for six representatives on selling day 16 of 26 showing achievement, pace, required daily sales, projection, outlet coverage, average invoice, lines per invoice and a product table', 'The scorecard with sample data, printed from Microsoft Excel.')}
<h2>1. Start with decisions, not charts</h2>
<p>List what a sales manager can change during the month: where representatives visit, which customers get attention, which products are pushed, and what support or stock is needed. Choose measures that point to those actions. A figure that nobody can act on belongs in a detailed report, if anywhere.</p>
<p>Also agree what a "sale" is. Sales from the company to a distributor and sales from the distributor to shops can move very differently. Say which one the dashboard shows. See <a href="../secondary-vs-primary-sales-fmcg/">primary and secondary sales</a>.</p>
<h2>2. Compare sales with time gone: pace</h2>
<p>After 16 of 26 days, 61.5% of the selling time has passed. A simple pace measure compares sales with the part of the target you would expect by now:</p>
<pre><code>Expected by today = monthly target × days completed ÷ total selling days
Pace              = sales to date ÷ expected by today</code></pre>
<p>The team has sold 3,340,000 against a target of 5,400,000. Its achievement of 61.9% is just ahead of time gone, giving a pace of <strong>100.5%</strong>.</p>
<p>This assumes sales arrive evenly. In many businesses they do not: month-end loading, weekly visit routes, salary days and holidays change the pattern. If your history shows that only a smaller share is usually sold by day 16, compare with that pattern instead.</p>
<h2>3. Show what is still needed and where you are heading</h2>
<pre><code>Needed per remaining day = (target − sales to date) ÷ days left
Month-end projection     = sales to date ÷ days completed × total days</code></pre>
<p>The team needs 206,000 a day for the last 10 days, compared with an average of 208,750 so far. At the same average it would finish at about <strong>5,427,500</strong>, or 100.5% of target.</p>
<p>Notice that pace and projected achievement are the same number. Both rest on the same straight-line assumption, so they are not two independent pieces of evidence. Pick one for the headline. A projection is not a forecast of what customers will do.</p>
<h2>4. Look behind the team total</h2>
<p>A pace of 100.5% sounds comfortable. The scorecard shows that <strong>three of the six representatives are behind pace</strong>:</p>
<table><tr><th>Rep</th><th>Pace</th><th>Needed per day</th><th>Outlet coverage</th><th>Average invoice</th><th>Lines per invoice</th></tr>
<tr><td>Rep A</td><td>113.8%</td><td>30,000</td><td>45.0%</td><td>7,778</td><td>3.0</td></tr>
<tr><td>Rep B</td><td>97.5%</td><td>36,000</td><td>82.0%</td><td>2,571</td><td>4.0</td></tr>
<tr><td>Rep C</td><td>85.3%</td><td>38,000</td><td>70.0%</td><td>3,231</td><td>2.5</td></tr>
<tr><td>Rep D</td><td>106.4%</td><td>38,000</td><td>70.0%</td><td>4,500</td><td>4.0</td></tr>
<tr><td>Rep E</td><td>81.3%</td><td>35,000</td><td>45.0%</td><td>5,000</td><td>2.2</td></tr>
<tr><td>Rep F</td><td>110.1%</td><td>29,000</td><td>80.0%</td><td>3,486</td><td>4.0</td></tr></table>
<p>The surplus from A, D and F is covering the shortfall from B, C and E. If one large order behind that surplus were cancelled, the team picture could change quickly.</p>
<p>The colours in the example are green at 100% or more and red below 90%. Those limits are choices for the example.</p>
<h2>5. Add coverage: how many customers are buying</h2>
<pre><code>Coverage = outlets billed at least once so far ÷ outlets assigned</code></pre>
<p>The team has billed 501 of 750 outlets, <strong>66.8%</strong>. Count each outlet once, however many invoices it received, and keep the outlet list current. Closed shops left on the list make coverage look poor; removing hard shops to improve the figure makes it meaningless.</p>
<p>Rep A is ahead of pace with only 45% coverage and a large average invoice. That could mean strong key customers, or dependence on a few. Rep B reaches 82% of outlets with small invoices. These raise different questions:</p>
<ul><li><strong>For A:</strong> how much of the total comes from the largest few customers, and which outlets have not been billed?</li><li><strong>For B:</strong> could more products be sold in the same visit, and are the outlets the right size for the target?</li><li><strong>For E:</strong> low coverage and the fewest lines per invoice. Check the route, stock availability, territory changes and absence before judging effort.</li></ul>
<h2>6. Measure the size and breadth of each sale</h2>
<pre><code>Average invoice   = sales ÷ number of invoices
Lines per invoice = product lines sold ÷ number of invoices</code></pre>
<p>The team averages 4,000 per invoice and 3.5 lines. A line is usually one product on one invoice, but define it for your system, because pack sizes may be counted separately. Splitting one order into several invoices raises invoice count and lowers the average, so watch how invoices are raised if you reward these figures.</p>
<h2>7. Check product mix</h2>
<table><tr><th>Product</th><th>Achieved</th><th>Share of sales</th><th>Share of target</th></tr>
<tr><td>Tea</td><td>70.8%</td><td>50.9%</td><td>44.4%</td></tr>
<tr><td>Juice</td><td>54.4%</td><td>29.3%</td><td>33.3%</td></tr>
<tr><td>Biscuits</td><td>55.0%</td><td>19.8%</td><td>22.2%</td></tr></table>
<p>With 61.5% of time gone, only Tea is ahead. Juice and Biscuits are behind even though the total is on pace. If margins differ between products, a change in mix can change profit even when sales hit target. A sales dashboard that shows only value will not show that.</p>
<h2>8. Arrange the page in reading order</h2>
<ol><li><strong>Headline:</strong> sales, target, pace and needed per day, with the data date.</li><li><strong>Where:</strong> area and representative, sorted by the gap that matters.</li><li><strong>Why it may be happening:</strong> coverage, invoice value and lines.</li><li><strong>What:</strong> product mix.</li><li><strong>Checks:</strong> product totals equal representative totals. The example flags it if they do not.</li></ol>
<h2>9. Be careful with incentives</h2>
<p>People respond to what is measured. A value-only target can encourage heavy end-of-month loading or ignoring small customers. A coverage-only target can encourage very small token orders. Use a few measures together, review returns and collections where relevant, and see the <a href="../weighted-kpi-scorecard/">weighted KPI scorecard guide</a> before linking pay to any of them.</p>
<h2>Advantages and limits</h2>
<p><strong>Advantages:</strong> problems become visible while there is still time to act, and review meetings can start from the same figures.</p>
<p><strong>Limits:</strong> the measures describe results, not causes. They do not show stock shortages, competitor activity or relationship quality unless you record them. Straight-line pace can mislead early in the month, when a few days of data swing widely.</p>
<h2>Common mistakes</h2>
<ul><li>Comparing a part month with a full target without showing time gone.</li><li>Counting calendar days instead of selling days.</li><li>Averaging representatives' percentages instead of using totals.</li><li>Counting an outlet each time it is billed.</li><li>Ranking people with very different territories as if they were the same.</li><li>Showing figures without saying when the data was last updated.</li></ul>
<h2>Practical next steps</h2>
<p>Start with pace, needed per day and coverage. Add the other measures when your invoice data can support them. Test one person's figures by hand before you share the page. For a quick single-target check, use the <a href="../../tools/sales-target-calculator/">Sales Target Calculator</a>.</p>
<h2>Frequently asked questions</h2>
<h3>Which measure matters most?</h3>
<p>It depends on the decision. During a month, pace with the amount still needed per day is a useful start, but it should not be read without knowing who and what the result depends on.</p>
<h3>Should I use calendar days or selling days?</h3>
<p>Use the days on which sales can normally happen, and agree them before the month starts. Adjust for holidays that affect your market.</p>
<h3>What if sales are concentrated at month end?</h3>
<p>Build the expected figure from your usual pattern instead of a straight line, using several past months. Say which method the dashboard uses.</p>
<h3>Why does a representative with high sales show low coverage?</h3>
<p>Sales may be concentrated in a few large customers. Check the largest customers' share and which assigned outlets have not been billed.</p>
<h3>Can I use this for services?</h3>
<p>Pace and required daily value can apply. Replace outlet coverage and invoice lines with measures that fit how you win and serve customers.</p>
<h3>How often should it be updated?</h3>
<p>As often as the manager can act on it and the data is reliable. Show the last data date in every version.</p>
${refs([ref(MS + 'functions/sumifs-function', 'Microsoft Support: SUMIFS', 'Totalling sales by representative, area or product.'), ref(MS + 'functions/countifs-function', 'Microsoft Support: COUNTIFS', 'Counting records that meet conditions.'), ref(MS + 'use-conditional-formatting-to-highlight-information-in-excel', 'Microsoft Support: Conditional formatting', 'The pace colours.'), ref(MS + 'get-started/create-a-pivottable-to-analyze-worksheet-data', 'Microsoft Support: Create a PivotTable', 'Exploring sales by several dimensions.')])}
${NOT_ADVICE('The references cover Excel features.')}
`
},
{
slug: 'automated-monthly-business-reporting-excel', eyebrow: 'Business Intelligence', status: 'draft',
title: 'Automated Monthly Business Reporting in Excel',
desc: 'Make an Excel management report move to the new month by itself, with budget and prior-month comparisons, draft commentary and checks that block bad data.',
tools: [['business-report-generator', 'Business Report Generator'], ['percentage-calculator', 'Percentage Calculator'], ['meeting-minutes-generator', 'Meeting Minutes Generator']],
related: ['excel-dashboard-guide-business-reporting', 'effective-minutes-of-meeting', 'digital-transformation-start-with-data'],
body: `
<p>Many monthly reports are rebuilt by hand: copy last month's file, paste new figures, change the headings, update formulas and hope nothing was missed. The work repeats and so do the mistakes, such as a column still pointing at last month.</p>
<p>Automation does not have to mean new software. This guide builds an Excel report that moves to the newest month by itself, compares it with budget and the previous month, drafts two sentences of commentary and <strong>refuses to call itself ready when the data fails its checks</strong>.</p>
${dl('GM-Monthly-Report-Example.xlsx', 'Download the example monthly report (.xlsx)')}
${fig('monthly-report-sheet', 1500, 752, 'Example monthly management report for June showing status ready, revenue, cost of goods, gross profit, gross margin, operating expenses and operating profit against budget and the prior month, draft commentary and five passing checks', 'The Report sheet with sample data, printed from Microsoft Excel.')}
<h2>1. Decide what can be automated</h2>
<p>Calculations, comparisons, layout and checks can be automated. Deciding why a figure changed, whether it matters and what to do cannot be left to a formula. Plan the time you save to be spent on those.</p>
<h2>2. Keep all months in one long table</h2>
<p>The Data sheet has one row per month, line and category, with actual and budget columns. Six months with seven categories make 42 rows. New months are added at the bottom, with the same columns. Do not add a new column or sheet for each month; that is what forces formulas to be edited every time.</p>
<table><tr><th>Month</th><th>Line</th><th>Category</th><th>Actual</th><th>Budget</th></tr>
<tr><td>Jun-2026</td><td>Cost of goods</td><td>Materials</td><td>542,400</td><td>506,000</td></tr></table>
<h2>3. Let the report find the latest month</h2>
<pre><code>Report month = MAX(Data!$A$2:$A$2000)
Prior month  = EDATE(report month, -1)</code></pre>
<p>Every figure then uses SUMIFS with the report month and the line name. In the example, months are stored as the first day of the month. A stray future date would move the report, which is one reason for the checks below.</p>
<h2>4. Compare with budget and the prior month</h2>
<p>June in the sample looks like this:</p>
<table><tr><th>Measure</th><th>Actual</th><th>Budget</th><th>Variance</th></tr>
<tr><td>Revenue</td><td>1,088,000</td><td>1,040,000</td><td>+48,000, favourable</td></tr>
<tr><td>Cost of goods</td><td>592,700</td><td>552,000</td><td>+40,700, adverse</td></tr>
<tr><td>Gross profit</td><td>495,300</td><td>488,000</td><td>+7,300, favourable</td></tr>
<tr><td>Operating expenses</td><td>314,000</td><td>294,000</td><td>+20,000, adverse</td></tr>
<tr><td>Operating profit</td><td>181,300</td><td>194,000</td><td>−12,700, adverse</td></tr></table>
<p>A plus sign is good news for revenue and bad news for a cost. The report states "favourable" or "adverse" in words so that readers do not have to work out which is which.</p>
<p>One comparison is not enough. Operating profit was <strong>25.2% higher than May</strong> and still <strong>12,700 below budget</strong>. Gross margin was 45.5%, against a budget of 46.9%: a difference of 1.4 percentage points. Say "percentage points" when comparing two percentages.</p>
<h2>5. Draft commentary with formulas, then edit it</h2>
<p>Text formulas can assemble sentences from the figures. For June the workbook writes:</p>
<p><em>"Revenue was 1,088,000, 4.6% above budget and 8.6% up on the prior month."</em></p>
<p><em>"Operating profit was 181,300, 12,700 below budget. Gross margin was 45.5% against a budget of 46.9%."</em></p>
<p>These sentences say what changed, not why. Add the reasons only after you have checked them. In this sample, operating expenses were over budget mainly because "Other" was 16,000 above and salaries 4,000 above. Even that is only where the money went; someone still has to find out why.</p>
<h2>6. Block the report when checks fail</h2>
<p>This is what makes automation safe. The example has five checks, and shows <strong>READY</strong> only when all pass:</p>
<table><tr><th>Check</th><th>What it catches</th></tr>
<tr><td>Seven rows for the report month</td><td>A missing or extra row</td></tr>
<tr><td>Each category appears once</td><td>A duplicated or misspelled category</td></tr>
<tr><td>Line names are recognised</td><td>A line the formulas would ignore, such as "Opex" for "Operating expenses"</td></tr>
<tr><td>No blank actual or budget</td><td>An unfinished import</td></tr>
<tr><td>Actuals match the accounts control total</td><td>A wrong amount</td></tr></table>
<p>The control total must be typed from the accounting system, separately from the data. A total calculated from the same rows would always agree with itself and prove nothing.</p>
<p>We tested this in Excel by adding a July month to a copy. The report moved to July without any formula changes, but showed "DO NOT SEND" until a matching control total was entered. We then introduced a duplicated category, an unknown line name, a blank budget, a wrong amount and a missing row, one at a time. The matching check failed each time.</p>
<p>Passing checks does not prove the report is right. Amounts posted to the wrong category can still add up to the correct total, and an error in the accounting system would pass straight through. Keep a human review.</p>
<h2>7. Reduce the copying with Power Query</h2>
<p>The example workbook expects you to paste each month's rows. If your system exports a file every month with the same columns, Excel's Power Query can import the files from a folder, apply the same cleaning steps and combine them, so that you refresh instead of paste. The example does <em>not</em> include a query, because file locations and export layouts differ.</p>
<p>If you set one up: keep only data files in the folder, watch for changed column names, never keep two exports of the same month, and run the same checks after every refresh. A refresh that finishes without an error can still bring in the wrong file.</p>
<h2>8. Run a fixed monthly routine</h2>
<ol><li>Confirm that the accounting month is closed, or label the report provisional.</li><li>Import or paste the new rows.</li><li>Type the control total from the accounts.</li><li>Clear every failed check at its source. Do not edit the formula to make it pass.</li><li>Review large variances and add verified reasons.</li><li>Have a second person read it.</li><li>Save a dated copy, send it to the agreed people and record any later corrections.</li></ol>
<h2>9. Extend with care</h2>
<p>To add a category, update the data, the row-count check, the category list used by the second check and the control total definition, then test again. The formulas read rows 2 to 2000. The Analytics sheet covers the first six months only and does not extend itself.</p>
<h2>Advantages and limits</h2>
<p><strong>Advantages:</strong> fewer manual edits, the same layout every month, and checks that make some mistakes visible before anyone else sees them.</p>
<p><strong>Limits:</strong> it still depends on manual or imported data, has no built-in approval or audit trail, can be broken by an overwritten formula, and is not a substitute for accounting software. For many entities, currencies or users, consider a reporting system with controlled access.</p>
<h2>Common mistakes</h2>
<ul><li>Automating a report whose definitions are not agreed.</li><li>Calculating the control total from the report's own data.</li><li>Sending generated commentary without reading it.</li><li>Showing a change from the prior month without the budget, or the reverse.</li><li>Changing past data without telling readers.</li><li>Letting only one person understand the file.</li></ul>
<h2>Frequently asked questions</h2>
<h3>Do I need macros?</h3>
<p>No. The example uses formulas and conditional formatting.</p>
<h3>Why did the report jump to the wrong month?</h3>
<p>It uses the latest date in the data. Look for a mistyped year or a future date.</p>
<h3>What if the month has no budget?</h3>
<p>The blank-budget check fails. If a line genuinely has no budget, enter zero on purpose and explain it, and check that percentage comparisons still make sense.</p>
<h3>Can the report email itself?</h3>
<p>The example does not send anything. Automatic sending raises the cost of an unnoticed error, so keep a review step.</p>
<h3>Can I use a PivotTable instead?</h3>
<p>Yes, for summaries. Remember to refresh it, and keep separate checks, because a PivotTable will summarise wrong data just as readily.</p>
<h3>Which version of Excel was used?</h3>
<p>The workbook was recalculated and tested in Microsoft Excel (version 16.0). Older versions and other programs were not tested.</p>
${refs([ref(MS + 'functions/sumifs-function', 'Microsoft Support: SUMIFS', 'Totals by month and line.'), ref(MS + 'functions/text-function', 'Microsoft Support: TEXT', 'Formatting numbers inside commentary.'), ref(MS + 'functions/countifs-function', 'Microsoft Support: COUNTIFS', 'Used by the checks.'), ref(MS + 'about-power-query-in-excel', 'Microsoft Support: About Power Query', 'Importing, transforming and refreshing data.'), ref(MS + 'import-data-from-a-folder-with-multiple-files-power-query', 'Microsoft Support: Import data from a folder', 'Combining monthly export files.'), ref(MS + 'refresh-an-external-data-connection-in-excel', 'Microsoft Support: Refresh a data connection', 'Updating imported data.')])}
${NOT_ADVICE('The references cover Excel features. Reporting practice described here is not accounting advice.')}
`
},
{
slug: 'business-intelligence-vs-business-analytics', eyebrow: 'Business Intelligence', status: 'draft',
title: 'Business Intelligence vs Business Analytics Explained',
desc: 'How business intelligence and business analytics differ and overlap, shown with one worked data set: what happened, why, what may happen and what to do.',
tools: [['percentage-calculator', 'Percentage Calculator'], ['business-report-generator', 'Business Report Generator'], ['profit-margin-calculator', 'Profit Margin Calculator']],
related: ['automated-monthly-business-reporting-excel', 'excel-dashboard-guide-business-reporting', 'digital-transformation-start-with-data'],
body: `
<p>A company says it needs "analytics". One person means a monthly dashboard, another a sales forecast, a third a recommendation on pricing. Without a shared meaning, the wrong thing gets bought or built.</p>
<h2>The short answer</h2>
<p>In everyday use, <strong>business intelligence (BI)</strong> usually refers to collecting, organising and presenting business data so people can see what is happening. <strong>Business analytics (BA)</strong> usually refers to using statistical and other methods to explain why, estimate what may happen and support choices about what to do.</p>
<p><strong>The boundary is not fixed.</strong> IBM's explanation describes business analytics as a subset of business intelligence. Microsoft's introduction to BI says BI tools often include several kinds of analysis, including predictive. Other organisations draw the line differently. When it matters, ask what questions must be answered, not which label to use.</p>
<h2>Four questions</h2>
<table><tr><th>Question</th><th>Often called</th><th>Typical output</th></tr>
<tr><td>What happened?</td><td>Descriptive</td><td>Reports, dashboards, comparisons</td></tr>
<tr><td>Why did it happen?</td><td>Diagnostic</td><td>Breakdowns, drivers, investigation</td></tr>
<tr><td>What may happen?</td><td>Predictive</td><td>Forecasts and probabilities, with uncertainty</td></tr>
<tr><td>What should we do?</td><td>Prescriptive</td><td>Options, scenarios, recommendations</td></tr></table>
<p>We can follow all four with one made-up data set: six months of figures from the example in the <a href="../automated-monthly-business-reporting-excel/">monthly reporting guide</a>.</p>
${dl('GM-Monthly-Report-Example.xlsx', 'Download the data used in this guide (.xlsx)')}
<h2>1. What happened?</h2>
<p>June revenue was 1,088,000 against a budget of 1,040,000, and 8.6% above May. Operating profit was 181,300, which was 12,700 below budget.</p>
<p>This is reporting, the core of most BI work. It needs clear definitions, complete data and a trusted calculation. It is not "basic" in the sense of unimportant: every later step rests on it. Here it already shows something worth asking about: revenue beat budget but profit missed.</p>
<h2>2. Why did it happen?</h2>
<p>Break the gap into parts. Gross profit was 7,300 above budget, but operating expenses were 20,000 above, which gives the 12,700 shortfall.</p>
<p>Within cost of goods, materials were 36,400 over budget. That figure has two different parts. The budget set materials at 55% of product sales. June product sales were 960,000 against a budget of 920,000.</p>
<table><tr><th>Part of the materials variance</th><th>Working</th><th>Amount</th></tr>
<tr><td>Selling more than planned</td><td>40,000 extra sales × 55%</td><td>22,000</td></tr>
<tr><td>Materials taking a larger share</td><td>960,000 × (56.5% − 55%)</td><td>14,400</td></tr>
<tr><td>Total</td><td></td><td>36,400</td></tr></table>
<p>The first part is expected when sales rise. The second needs investigation. The arithmetic still does not give the cause. A higher share could come from supplier prices, discounts that lowered selling prices, waste, a shift towards products that use more material, or an accounting timing difference. <strong>A breakdown shows where to look. Finding the cause needs evidence.</strong></p>
<h2>3. What may happen?</h2>
<p>A very simple prediction fits a straight line through six months of revenue:</p>
<table><tr><th>Month</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th></tr>
<tr><td>Revenue</td><td>930,000</td><td>905,000</td><td>988,000</td><td>1,030,000</td><td>1,002,000</td><td>1,088,000</td></tr></table>
<p>Excel's FORECAST.LINEAR function gives about <strong>1,102,800</strong> for month 7. The line rises by about 32,086 a month.</p>
<p>One quick test is to hide the latest month and forecast it from the others. Using months 1 to 5, the method would have predicted 1,051,700 for month 6. The actual figure was 1,088,000, so the forecast was <strong>3.3% too low</strong>.</p>
<p>Do not read that as "this model is accurate to about 3%". It is a single test. Six points cannot reveal seasons, one-off orders, price changes or a change in the market, and a straight line will continue rising for ever. A responsible forecast states its assumptions, is tested on more history and gives a range, and it is compared with a simple alternative such as "same as last month".</p>
<h2>4. What should we do?</h2>
<p>Prescriptive work compares actions. Suppose the team asks what June would have looked like if materials had stayed at 55% of product sales, with everything else unchanged: cost would have been 14,400 lower, and operating profit 195,700 instead of 181,300, slightly above the budget of 194,000.</p>
<p>This is a <strong>what-if calculation, not a promise or a recommendation</strong>. It assumes the lower cost share was achievable without reducing sales or quality. A decision would need the verified cause, the options for fixing it, their costs and risks, and who is responsible. Some prescriptive methods use optimisation models; many business decisions use scenarios like this plus judgement.</p>
<h2>How the work differs in practice</h2>
<table><tr><th>Area</th><th>BI emphasis</th><th>BA emphasis</th></tr>
<tr><td>Main need</td><td>A shared, current view</td><td>Understanding and choosing</td></tr>
<tr><td>Typical work</td><td>Data models, dashboards, definitions, access</td><td>Investigation, statistics, forecasting, scenarios</td></tr>
<tr><td>Rhythm</td><td>Repeated reporting</td><td>Often organised around a question</td></tr>
<tr><td>Main risk</td><td>Trusted-looking figures that are wrong or unused</td><td>Confident conclusions the data cannot support</td></tr></table>
<p>These are tendencies, not job boundaries. In a small business one person often does both, sometimes in the same spreadsheet.</p>
<h2>Which should come first?</h2>
<p>If people disagree about basic figures, fix definitions and data first. A forecast built on disputed data only moves the argument. If reporting is trusted but decisions are still guesses, spend effort on analysis. In practice they develop together: analysis often reveals a data problem, which improves the reporting.</p>
<ol><li>Name one decision that needs better information.</li><li>List the figures it needs and agree their definitions.</li><li>Check that the data exists, is complete enough and may be used for this purpose.</li><li>Build the smallest report that answers "what happened".</li><li>Investigate one important change.</li><li>Add prediction only if a decision depends on the future, and test it.</li><li>Record what was decided and check the result later.</li></ol>
<h2>Do you need special tools?</h2>
<p>Not to start. A spreadsheet can handle small examples like this one. Dedicated BI tools such as Microsoft Power BI help with connecting sources, sharing and refreshing reports. Statistical or programming tools help with larger or more complex analysis. A tool does not supply good definitions, clean data or a sensible question.</p>
<h2>Advantages and limits of each</h2>
<p><strong>BI</strong> gives consistent, repeatable visibility, but can become a collection of unused dashboards and usually will not explain a change by itself. <strong>Analytics</strong> can improve understanding and test options, but needs more skill and care, and can sound more certain than it is.</p>
<h2>Common mistakes</h2>
<ul><li>Buying software before naming the decision.</li><li>Treating correlation or a breakdown as proof of cause.</li><li>Giving a forecast as a single number with no assumptions or test.</li><li>Assuming a more complex method is a better one.</li><li>Ignoring privacy and access when combining data.</li><li>Never checking whether a recommendation worked.</li></ul>
<h2>Frequently asked questions</h2>
<h3>Is business analytics part of business intelligence?</h3>
<p>Some definitions, including IBM's explanation, say so. Others treat them as overlapping or separate. State what you mean in your own project.</p>
<h3>Is a dashboard BI or analytics?</h3>
<p>A dashboard that reports results is usually called BI. If it also provides breakdowns, forecasts or scenarios, it supports analytics too.</p>
<h3>Can Excel be used for business analytics?</h3>
<p>Yes, for many small tasks, including breakdowns, simple forecasts and what-if calculations. Size, repeatability, collaboration and method may require other tools.</p>
<h3>Is predictive analytics the same as AI?</h3>
<p>No. Prediction can use simple statistics, as here, or machine learning. The method should fit the question and be tested.</p>
<h3>Which skills should I learn first?</h3>
<p>Learn to define a measure, check data, summarise it and explain a comparison. Then learn basic statistics and how to question a forecast.</p>
<h3>Why was the forecast not given with a range?</h3>
<p>Six points are too few to estimate a trustworthy range here. The example shows the mechanics and a limitation; it should not be used to plan a business.</p>
${refs([ref('https://www.ibm.com/think/topics/business-analytics', 'IBM: What is business analytics?', 'IBM\'s view of analytics, its types and its relation to BI.'), ref('https://www.ibm.com/think/topics/business-intelligence', 'IBM: What is business intelligence?', 'IBM\'s description of BI.'), ref('https://www.microsoft.com/en-us/microsoft-fabric/resources/data-101/what-is-business-intelligence', 'Microsoft: What is business intelligence?', 'Microsoft\'s introduction, including the kinds of analysis BI tools offer.'), ref('https://learn.microsoft.com/en-us/power-bi/fundamentals/power-bi-overview', 'Microsoft Learn: What is Power BI?', 'An example of a BI platform.'), ref(MS + 'functions/forecast-and-forecast-linear-functions', 'Microsoft Support: FORECAST and FORECAST.LINEAR', 'The straight-line forecast used here.')])}
${NOT_ADVICE('Definitions of these terms vary between organisations.')}
`
}
];
