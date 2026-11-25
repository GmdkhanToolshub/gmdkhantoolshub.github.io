// Cornerstone guides. Every figure quoted here comes from the example workbooks (build/cornerstone_examples.py),
// checked in Microsoft Excel by build/verify-cornerstone.ps1. status: 'draft' until the owner has read and approved it. Set new guides to 'draft' first.
const MS = 'https://support.microsoft.com/en-us/excel/';
const ref = (u, t, n) => `<li><a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>. ${n}</li>`;
const refs = items => `<section class="refs"><h2>References</h2><ul>${items.join('')}</ul><p class="small muted">Links checked on 25 November 2026.</p></section>`;
const fig = (src, w, h, alt, cap) => `<figure class="guide-fig"><a href="../../assets/img/guides/${src}.webp" target="_blank" rel="noopener noreferrer"><img src="../../assets/img/guides/${src}.webp" width="${w}" height="${h}" alt="${alt}" loading="lazy" decoding="async"></a><figcaption>${cap} Select the image to open it full size.</figcaption></figure>`;
const dl = (file, label) => `<p class="guide-dl"><a class="btn btn-primary" href="../../assets/downloads/${file}" download>${label}</a></p>`;

import ATTENDANCE from './posts-attendance.mjs';

export default [
{
slug: 'excel-dashboard-guide-business-reporting', eyebrow: 'Business Intelligence', status: 'published', /* approved by the owner 2026-11-25 */
title: 'Complete Excel Dashboard Guide for Business Reporting',
desc: 'Build an Excel sales dashboard step by step: data layout, SUMIFS, summary tiles, a month selector, charts, status colours and checks, with a free example.',
tools: [['sales-target-calculator', 'Sales Target Calculator'], ['kpi-performance-calculator', 'KPI Performance Calculator'], ['excel-formula-generator', 'Excel Formula Generator']],
related: ['excel-formulas-sales-ops', 'weighted-kpi-scorecard', 'sales-target-tracking'],
body: `
<p>A monthly report often starts as a quick spreadsheet and grows until only one person can update it. Numbers get typed over, a total stops matching, and the meeting turns into a discussion about which figure is right. A dashboard is meant to prevent that: one screen that answers a few agreed questions, fed by data that is entered once.</p>
<p>This guide builds a small sales dashboard in Excel. You can download the finished workbook, change its made-up data and follow every step.</p>
${dl('GM-Sales-Dashboard-Example.xlsx', 'Download the example dashboard (.xlsx)')}
${fig('sales-dashboard-example', 1191, 1416, 'Example Excel sales dashboard for March: sales 535,500 against a target of 550,600, 97.3 percent achievement, a table of four regions with status colours, a monthly sales and target chart and a regional achievement chart', 'The finished dashboard with sample data, printed from Microsoft Excel.')}
<h2>1. Decide what the dashboard must answer</h2>
<p>Write the questions down before you open Excel. A dashboard that tries to show everything gets read by nobody. For a monthly sales review, five are usually enough to start:</p>
<ol><li>How much did we sell this month?</li><li>How does that compare with the target?</li><li>Is it better or worse than last month?</li><li>Which areas are behind?</li><li>Can I trust these figures?</li></ol>
<p>For each question, agree the definition. Does "sales" mean orders taken, goods dispatched or invoices raised? Are returns deducted? Which date decides the month? If two departments answer differently, no formula will settle it.</p>
<h2>2. Lay out the data so formulas can read it</h2>
<p>Keep raw data on its own sheet, with one row per record and one column per fact. The example has six columns: Date, Month, Region, Product, Sales and Target, and 36 rows (four regions, three products, three months).</p>
<ul><li>One header row, with no merged cells and no blank rows inside the data.</li><li>No subtotal rows. Totals belong in formulas, or you will count them twice.</li><li>Spell categories the same way every time. "North" and "North " with a space are different values.</li><li>Store numbers as numbers and dates as dates, not as text.</li></ul>
<p>The example data is formatted as an Excel table. A table keeps its formatting as you add rows and makes the data easier to filter. The workbook's formulas read rows 2 to 500; extend that if your data grows beyond it, or switch to the table's column names.</p>
<h2>3. Keep calculations on a separate sheet</h2>
<p>Use three layers: <strong>Data</strong> (what happened), <strong>Calc</strong> (summaries and checks) and <strong>Dashboard</strong> (what the reader sees). When something looks wrong, you can trace it one layer at a time.</p>
<p>The workhorse formula is SUMIFS. This one totals sales for the month chosen in cell C2 of the dashboard:</p>
<pre><code>=SUMIFS(Data!$E$2:$E$500, Data!$B$2:$B$500, $C$2)</code></pre>
<p>The first range is what to add. After it come pairs: a range to test and the value it must match. For the regional table, add a second pair for the region name. The dollar signs keep the ranges fixed when you copy the formula. See the <a href="../../excel-formulas/#sumifs">SUMIFS card in the formula library</a> for another worked example.</p>
<h2>4. Build the headline tiles</h2>
<p>Tiles answer the first three questions at a glance. With March selected, the example shows:</p>
<table><tr><th>Tile</th><th>How it is worked out</th><th>March</th></tr>
<tr><td>Sales</td><td>SUMIFS of sales for the month</td><td>535,500</td></tr>
<tr><td>Target</td><td>SUMIFS of target for the month</td><td>550,600</td></tr>
<tr><td>Achievement</td><td>Sales ÷ target</td><td>97.3%</td></tr>
<tr><td>Gap to target</td><td>Sales − target</td><td>−15,100</td></tr>
<tr><td>Change on prior month</td><td>This month ÷ last month − 1</td><td>+5.8%</td></tr></table>
<p>Show the gap as an amount as well as a percentage. "97.3%" sounds close; "15,100 short" tells people the size of the job.</p>
<p>Read the last two tiles together. March sales were 5.8% higher than February, yet still below target, because the target also rose, by about 4.8%. Growth and achievement answer different questions, so a dashboard needs both.</p>
<p>January has no earlier month in the sample, so that tile shows "n/a". Showing 0% would suggest that sales had not changed, which is not what the data says.</p>
<h2>5. Add a month selector</h2>
<p>Instead of building one dashboard per month, put the month in a single cell and let every formula read it. In the example, cell C2 has a drop-down list made with <strong>Data Validation</strong>: select the cell, choose Data, then Data Validation, allow a List, and enter the month names.</p>
<p>A list also stops typing mistakes. "March" typed where the data says "Mar" would return zero without any warning.</p>
<h2>6. Show where the gap comes from</h2>
<p>A total hides differences. The regional table for March is what turns the report into an action list:</p>
<table><tr><th>Region</th><th>Sales</th><th>Target</th><th>Achievement</th><th>Difference</th></tr>
<tr><td>North</td><td>171,800</td><td>171,600</td><td>100.1%</td><td>+200</td></tr>
<tr><td>South</td><td>136,100</td><td>143,000</td><td>95.2%</td><td>−6,900</td></tr>
<tr><td>East</td><td>141,700</td><td>128,700</td><td>110.1%</td><td>+13,000</td></tr>
<tr><td>West</td><td>85,900</td><td>107,300</td><td>80.1%</td><td>−21,400</td></tr></table>
<p>West alone is 21,400 short, more than the whole company's gap of 15,100. East's surplus hides part of it.</p>
<p><strong>Never average the percentages to get a total.</strong> The simple average of the four achievement figures is 96.4%, but the real achievement is 97.3%, because the regions have targets of different sizes. Divide total sales by total target.</p>
<h2>7. Use status colours with words</h2>
<p>The Status column uses one formula, then <strong>conditional formatting</strong> colours the word:</p>
<pre><code>=IF(E8>=1, "On target", IF(E8>=0.9, "Close", "Behind"))</code></pre>
<p>The 90% line is a choice made for this example, not a standard. Agree your own limits before the period starts. Keep the words as well as the colours: some readers cannot tell red from green, and printed copies may be in black and white. Our <a href="../color-contrast-and-accessible-design/">colour contrast guide</a> explains more.</p>
<h2>8. Choose charts for the question</h2>
<ul><li><strong>Sales against target by month:</strong> side-by-side columns show whether the gap is growing or shrinking.</li><li><strong>Achievement by region:</strong> horizontal bars make names easy to read and the weakest area easy to spot.</li></ul>
<p>Start column and bar charts at zero. A shortened axis can make a 2% difference look enormous. Avoid 3D effects, and avoid pie charts when you need to compare similar values. Give each chart a title that says what it shows and for which period. In the example, the monthly chart always shows all three months, while the regional chart follows the selected month, so each title should make that clear.</p>
<h2>9. Build checks you can see</h2>
<p>This step is often skipped, and it is the one that protects your reputation. The example has two checks:</p>
<ul><li><strong>Data against months:</strong> the total of all sales rows (1,533,200) must equal the sum of the three monthly totals. If a month is misspelled, the two differ and the cell shows CHECK DATA.</li><li><strong>Table against tile:</strong> the sum of the regional table must equal the sales tile. This catches a region that is missing from the table.</li></ul>
<p>We tested the first check by changing one "Jan" to "Jam" in a copy of the data. The warning appeared. Also compare the dashboard total with your accounting or order system before you share it. Internal checks cannot tell you that a whole file was never imported.</p>
<h2>10. Update it the same way every time</h2>
<ol><li>Paste the new rows under the existing data, using the same columns.</li><li>Check that month, region and product names match the existing spelling.</li><li>Select the new month on the dashboard.</li><li>Read both check cells.</li><li>Compare the total with the source system.</li><li>Save a dated copy of what you sent.</li></ol>
<p>When you add a new month, also add it to the Calc table, the chart range and the drop-down list. When you add a new region, add a row to the regional table. A sample spanning more than one year needs a Year column in every SUMIFS, or January of both years will be added together.</p>
<p>To limit accidental changes, you can protect the Calc and Dashboard sheets and leave the month cell unlocked. Treat sheet protection as a guard against mistakes, not as security for confidential data.</p>
<h2>When formulas are not the best tool</h2>
<ul><li><strong>PivotTables</strong> summarise large lists quickly and let you drag fields to explore. Refresh them after the data changes.</li><li><strong>Power Query</strong> can record the steps that clean a monthly export, so you can refresh instead of repeating them by hand.</li><li><strong>A reporting platform</strong> is worth considering when many people need live figures, access has to be restricted by person, or the files have become slow or hard to control.</li></ul>
<h2>Advantages and limits of an Excel dashboard</h2>
<p><strong>Advantages:</strong> most teams already know Excel, every calculation can be inspected, and you can change the layout in minutes.</p>
<p><strong>Limits:</strong> someone has to bring the data in, copies multiply when files are emailed around, one overwritten formula can spoil a report without being noticed, and an Excel file is not a database. A dashboard also shows what happened, not why. Plan time to ask the people closest to the numbers.</p>
<h2>Common mistakes</h2>
<ul><li>Typing a number over a formula to "fix" it.</li><li>Mixing data, calculations and presentation on one sheet.</li><li>Showing 20 measures with no sign of which matter.</li><li>Comparing a part month with a full month. Compare the same number of selling days.</li><li>Averaging percentages.</li><li>Sharing a report without stating the data date.</li></ul>
<h2>Practical next steps</h2>
<p>Start with five questions and one data sheet. Add a check before you add a chart. After two reporting cycles, ask readers what they did not use and remove it. To work out the daily sales needed for the rest of a month, use the <a href="../../tools/sales-target-calculator/">Sales Target Calculator</a>. For a score across several measures, see the <a href="../weighted-kpi-scorecard/">weighted KPI scorecard guide</a>. If you prefer a ready-made file, the <a href="../../shop/#sales-target-tracker">sales target tracker template</a> is in the shop.</p>
<h2>Frequently asked questions</h2>
<h3>What is the difference between a report and a dashboard?</h3>
<p>A report usually gives detail for reading. A dashboard shows a small set of measures for a quick decision, with detail available when needed.</p>
<h3>How many measures should one dashboard show?</h3>
<p>There is no fixed number. Include only those that lead to a question or an action. If nobody can say what they would do when a figure changes, leave it out.</p>
<h3>Why does my SUMIFS return zero?</h3>
<p>The usual causes are text that does not match exactly, extra spaces, numbers stored as text, or ranges that do not cover the data. Test one condition at a time to find which pair fails.</p>
<h3>Which Excel version do I need for the example?</h3>
<p>It uses SUMIFS, IFERROR, INDEX, MATCH and IF, which have been in Excel for many versions. It was checked in Microsoft Excel (version 16.0). Older versions and other spreadsheet programs were not tested.</p>
<h3>Can I use it for purchases, production or service work?</h3>
<p>Yes, if the data has the same shape: a period, a category, an actual value and a target. Rename the columns and labels, then run the checks again.</p>
<h3>How often should a dashboard be updated?</h3>
<p>As often as someone will act on it. A daily dashboard that is read monthly costs effort without helping. Always show the date of the latest data.</p>
${refs([ref(MS + 'functions/sumifs-function', 'Microsoft Support: SUMIFS', 'Syntax for adding values with several conditions.'), ref(MS + 'overview-of-excel-tables', 'Microsoft Support: Overview of Excel tables', 'How tables work.'), ref(MS + 'get-started/create-a-drop-down-list', 'Microsoft Support: Create a drop-down list', 'The Data Validation list used for the month selector.'), ref(MS + 'use-conditional-formatting-to-highlight-information-in-excel', 'Microsoft Support: Conditional formatting', 'Colouring cells by rule.'), ref(MS + 'get-started/create-a-chart-from-start-to-finish', 'Microsoft Support: Create a chart', 'Adding and formatting charts.'), ref(MS + 'get-started/create-a-pivottable-to-analyze-worksheet-data', 'Microsoft Support: Create a PivotTable', 'Including how to refresh it.'), ref(MS + 'about-power-query-in-excel', 'Microsoft Support: About Power Query', 'Importing and transforming data.'), ref(MS + 'protect-a-worksheet', 'Microsoft Support: Protect a worksheet', 'Locking cells against accidental changes.')])}
`
},
{
slug: 'inventory-management-using-excel', eyebrow: 'Business', status: 'published', /* approved by the owner 2026-11-25 */
title: 'Inventory Management Using Excel: A Practical Guide',
desc: 'Track stock in Excel with a movements log, reorder points, days of cover, stock value, inventory turnover and ABC analysis, with a free example workbook.',
tools: [['profit-margin-calculator', 'Profit Margin Calculator'], ['barcode-generator', 'Barcode Generator'], ['percentage-calculator', 'Percentage Calculator']],
related: ['excel-formulas-sales-ops', 'secondary-vs-primary-sales-fmcg', 'profit-margin-vs-markup'],
body: `
<p>Stock problems cost money in two directions. Too little, and you turn customers away. Too much, and cash sits on shelves while goods age or expire. Many small businesses only find out which problem they have when a shelf is empty or a count does not match the book.</p>
<p>A well-built spreadsheet can answer the daily questions: what do I have, what should I order, what is it worth and which items matter most? This guide builds that in Excel using a made-up grocery wholesaler with eight products, followed through March 2026.</p>
${dl('GM-Inventory-Tracker-Example.xlsx', 'Download the example inventory workbook (.xlsx)')}
<h2>1. Record movements, do not overwrite balances</h2>
<p>The most important design choice is this: <strong>never type over the quantity on hand.</strong> Record each receipt and each issue as a new row, and let a formula work out the balance. You then have a history you can check when the shelf and the sheet disagree.</p>
<p>The example uses these sheets:</p>
<table><tr><th>Sheet</th><th>What it holds</th></tr>
<tr><td>Products</td><td>One row per item: code, name, unit cost, selling price, opening stock, lead time and safety stock</td></tr>
<tr><td>Movements</td><td>One row per receipt or issue: date, code, type (In or Out) and quantity</td></tr>
<tr><td>Stock</td><td>Calculated balance, reorder status, cover and value for each item</td></tr>
<tr><td>ABC</td><td>Items ranked by the cost of what was sold</td></tr></table>
<p>Give every product a short unique code and use it everywhere. Names get typed in different ways; codes can be picked from a list. The Movements sheet has drop-down lists for the code and the type, accepts only whole quantities above zero, and shows CHECK beside a code that is not on the Products sheet. Pasting can bypass drop-down rules, which is why the visible check matters.</p>
<h2>2. Work out stock on hand</h2>
<p>The balance is opening stock, plus receipts, minus issues. SUMIFS collects the movements for each code:</p>
<pre><code>Received  =SUMIFS(Movements!$D$2:$D$1000, Movements!$B$2:$B$1000, A5, Movements!$C$2:$C$1000, "In")
Issued    =SUMIFS(Movements!$D$2:$D$1000, Movements!$B$2:$B$1000, A5, Movements!$C$2:$C$1000, "Out")
On hand   =C5+D5-E5</code></pre>
<p>Here C5 is opening stock, D5 receipts and E5 issues. A negative balance is highlighted, because it means a receipt is missing, an issue was entered twice or the opening figure was wrong. Do not hide it with a formula that shows zero.</p>
<p>Decide how to record other events. Customer returns, supplier returns, damaged goods and count corrections all change stock. Add clear types for them, or at least a note column, so that a write-off is not mistaken for a sale. The formulas must then include each new type.</p>
${fig('inventory-stock-sheet', 1500, 596, 'Excel stock sheet for March showing eight products with opening stock, receipts, issues, stock on hand, reorder point, status, days of cover and value. Apple juice, cream biscuits and sugar are marked Reorder', 'The Stock sheet with sample data, printed from Microsoft Excel.')}
<h2>3. Set a reorder point</h2>
<p>A reorder point tells you when to place an order, early enough for it to arrive before you run out. A common simple form is:</p>
<pre><code>Reorder point = average daily use × lead time in days + safety stock</code></pre>
<ul><li><strong>Average daily use:</strong> quantity issued divided by the days in the period.</li><li><strong>Lead time:</strong> days from placing an order until the goods are ready to use. Use what actually happens, not only what the supplier promises.</li><li><strong>Safety stock:</strong> a buffer for late deliveries and busier days than usual.</li></ul>
<p>Apple juice shows how it works. It sold 126 units in 31 days, about 4.06 a day. With a 5-day lead time and 40 units of safety stock, the reorder point is about 60.3. Only 34 are on hand, so the status reads <strong>Reorder</strong>. Cream biscuits (130 on hand against 145.2) and sugar (70 against 74.2) are flagged too.</p>
<p>The status formula checks for an empty shelf first:</p>
<pre><code>=IF(F5<=0, "Out of stock", IF(F5<=H5, "Reorder", "OK"))</code></pre>
<p>The safety stock figures here were chosen for the example. For your own items, start with a sensible estimate, record every time you run short or carry far too much, and adjust. A single month of history is a weak basis for items with seasons, promotions or irregular orders. Statistical methods exist for setting safety stock, but they need reliable history.</p>
<p>A reorder point says <em>when</em> to order, not <em>how much</em>. Order quantity also depends on supplier minimums, case sizes, storage space, shelf life and available cash. Before ordering, check what is already on order, or you may buy the same stock twice. The example does not track open purchase orders; add a column for them if you place orders with long lead times.</p>
<h2>4. Read days of cover with care</h2>
<p>Days of cover is stock on hand divided by average daily use. Apple juice has about 8.4 days, while honey has about 36.8.</p>
<p>Notice that the three flagged items still show more days of cover than their lead times. They are flagged because the safety buffer is included. Cover alone would not tell you to order. It also assumes that future demand looks like the past period, which may not be true before a festival or after a price change.</p>
<h2>5. Value your stock</h2>
<p>Multiply the quantity on hand by unit cost, not selling price:</p>
<pre><code>Stock value = quantity on hand × unit cost</code></pre>
<p>In the example, stock at cost fell from 291,350 at the start of March to 173,290 at the end. You can check this against the movements:</p>
<table><tr><th>Step</th><th>Amount at cost</th></tr>
<tr><td>Opening stock</td><td>291,350</td></tr>
<tr><td>Add goods received</td><td>174,250</td></tr>
<tr><td>Less cost of goods issued</td><td>292,310</td></tr>
<tr><td>Closing stock</td><td>173,290</td></tr></table>
<p>The figures agree, which is a useful test for your own sheet. It works neatly here because each product has one unit cost and every issue is a sale. When purchase prices change, you need a costing method, such as weighted average or first in, first out, and a record of each receipt's cost. Ask your accountant which method your accounts should use, and do not rely on this simple example for financial statements or tax.</p>
<h2>6. Measure turnover</h2>
<p>Inventory turnover shows how many times average stock was sold in a period:</p>
<pre><code>Average stock = (opening value + closing value) ÷ 2
Turnover      = cost of goods sold ÷ average stock
Days of stock = days in the period ÷ turnover</code></pre>
<p>For March, cost of goods sold was 292,310 and average stock 232,320. Turnover is about <strong>1.26 for the month</strong>, or about <strong>24.6 days</strong> of stock. Do not compare a monthly turnover with someone else's yearly figure. An average of only the opening and closing values can also mislead when stock swings during the month.</p>
<p>You can test your own figures in the <a href="../../business-calculators/#turnover">inventory turnover calculator</a>.</p>
<h2>7. Use ABC analysis to focus attention</h2>
<p>Not every item deserves the same effort. ABC analysis ranks items by value used, here the cost of goods sold, and adds up their share from the top.</p>
${fig('inventory-abc-sheet', 1095, 417, 'Excel ABC ranking of eight products by cost of goods sold: mango juice, black tea, salted biscuits and sugar are class A, apple juice, cream biscuits and green tea class B, and honey class C', 'The ABC sheet with sample data.')}
<p>In this example an item is class A while the items ranked above it cover less than 70% of the total, class B while they cover less than 90%, and C after that. So four items are A, three are B and one is C. These limits are a choice, not a rule, and with only eight products the groups are rough.</p>
<p>A sensible use is to count and review A items more often. But do not neglect a C item just because its value is low: a cheap part can stop a job, and a slow item may be the reason a good customer visits. A single month can also rank a seasonal item wrongly.</p>
<p>The ranking uses LARGE and MATCH using functions that have been in Excel for many versions. If two products had exactly the same cost of goods sold, the name lookup would repeat the first one, so check for ties.</p>
<h2>8. Count the stock and explain differences</h2>
<p>The sheet shows what <em>should</em> be there. Only a count shows what <em>is</em> there. Many businesses count a few items on a regular cycle instead of closing for one large count.</p>
<ol><li>Agree a cut-off time so that goods moving during the count are not counted twice or missed.</li><li>Have someone count without seeing the expected figure.</li><li>Recount large differences.</li><li>Look for the cause: unrecorded issues, wrong units, wrong item, damage or loss.</li><li>Record the correction as its own movement with a reason. Do not edit past rows.</li></ol>
<h2>Advantages and limits of Excel for stock</h2>
<p><strong>Advantages:</strong> low cost if you already have Excel, formulas you can inspect, and columns you can change to fit your business.</p>
<p><strong>Limits:</strong> it does not update itself when you sell, several people editing copies will create conflicting versions, there is no reliable record of who changed what in a simple file, and tracking batches, expiry dates, serial numbers or several warehouses quickly becomes difficult. If you need those, or you make many transactions a day, compare dedicated inventory or point-of-sale software.</p>
<h2>Common mistakes</h2>
<ul><li>Typing a new balance over the old one.</li><li>Mixing units, such as cartons in one row and single pieces in the next. Choose one unit per product.</li><li>Valuing stock at selling price.</li><li>Treating the supplier's promised lead time as certain.</li><li>Never revising reorder points after demand changes.</li><li>Sorting one column without the others, which scrambles records.</li><li>Keeping the only copy on one computer. Back it up.</li></ul>
<h2>Practical next steps</h2>
<p>Start with your twenty most important products, count them, and record every movement for two weeks. Fix the recording habits before adding more items or features. To check pricing on the same items, see <a href="../profit-margin-vs-markup/">profit margin vs markup</a>. For more formulas, visit the <a href="../../excel-formulas/">Excel formula library</a>. A larger ready-made <a href="../../shop/#inventory-sales-tracker">inventory and sales tracker</a> is available in the shop.</p>
<h2>Frequently asked questions</h2>
<h3>Can I manage inventory in Excel without macros?</h3>
<p>Yes. The example uses ordinary formulas, data validation and conditional formatting, with no macros.</p>
<h3>How do I add a new product?</h3>
<p>Add it to the Products sheet, then add a row on the Stock sheet and extend the ABC ranges and summary formulas. Check that totals include the new row.</p>
<h3>What if I have more than 1,000 movements?</h3>
<p>The example formulas and drop-down rules read up to row 1000. Extend the ranges, or change the formulas to use the table's column names. Test the totals afterwards.</p>
<h3>Why is my stock on hand negative?</h3>
<p>Usually a receipt was not entered, an issue was entered twice, a code is wrong or the opening quantity was incorrect. Trace the movements for that code and count the item.</p>
<h3>Should I include sales tax in unit cost?</h3>
<p>It depends on whether you can reclaim the tax and on your accounting rules. Treat all costs the same way and confirm the approach with your accountant.</p>
<h3>How is this different from a sales dashboard?</h3>
<p>A stock sheet manages quantities and ordering. A dashboard summarises performance for review. The <a href="../excel-dashboard-guide-business-reporting/">Excel dashboard guide</a> shows how to build one.</p>
${refs([ref(MS + 'functions/sumifs-function', 'Microsoft Support: SUMIFS', 'Totalling movements by code and type.'), ref(MS + 'functions/large-function', 'Microsoft Support: LARGE', 'Used to rank items for ABC analysis.'), ref(MS + 'get-started/apply-data-validation-to-cells', 'Microsoft Support: Data validation', 'Limiting what can be typed in a cell.'), ref(MS + 'use-conditional-formatting-to-highlight-information-in-excel', 'Microsoft Support: Conditional formatting', 'Highlighting reorder and negative values.'), ref(MS + 'overview-of-excel-tables', 'Microsoft Support: Overview of Excel tables', 'How tables work.')])}
<p class="small muted">The references cover the Excel features. The stock management methods are common practice described for general information; they are not accounting, tax or professional advice.</p>
`
},
...ATTENDANCE
];
