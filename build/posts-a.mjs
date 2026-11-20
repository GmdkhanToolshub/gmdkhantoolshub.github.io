// Blog articles 1-4. Body is HTML for the <article class="prose"> element.
export default [
{
slug: 'merge-and-split-pdf-files',
title: 'How to Merge and Split PDF Files',
desc: 'A practical guide to combining several PDFs into one, pulling out the pages you need, and avoiding the mistakes that waste time, with a free browser tool.',
eyebrow: 'Productivity',
tools: [['pdf-merge-split', 'PDF Merge and Split'], ['pdf-compressor', 'PDF Compressor'], ['pdf-rotator', 'PDF Rotator']],
related: ['compress-pdf-without-losing-quality', 'write-cv-for-jobs-in-pakistan', 'ats-friendly-resume'],
body: `
<p>Most people meet the same two PDF problems sooner or later. A job portal wants one file, but you have a CV, a cover letter and three certificates saved separately. Or you receive a 60-page report and only need pages 12 to 18 to forward to a colleague. Merging and splitting solve both, and neither needs expensive software. This guide explains how each one works, what to check before you start, and how to avoid the small mistakes that cost time.</p>

<h2>When merging makes sense</h2>
<p>Merging means joining several PDF files, in an order you choose, into a single document. It is the right move when a recipient expects one attachment, when pages belong together as a package, or when you want to keep a record in one place. Common examples include:</p>
<ul>
<li>A job application pack: cover letter first, then CV, then degrees and experience letters.</li>
<li>A fee or visa submission with a form, a bank slip and a copy of an identity document.</li>
<li>A monthly expense claim made of many separate receipts that were scanned one by one.</li>
<li>A client proposal where the quotation, terms and company profile were written in different programs.</li>
</ul>
<p>Merging is not the right tool if you only need to reduce file size. Joining files does not shrink them; the result is roughly the sum of the parts. If size is the problem, compress afterwards with the <a href="../../tools/pdf-compressor/">PDF Compressor</a>.</p>

<h2>Step by step: merging PDFs</h2>
<ol>
<li>Open the free <a href="../../tools/pdf-merge-split/">PDF Merge and Split</a> tool and choose Merge.</li>
<li>Drop all the files in, or click to choose them. Everything is processed inside your own browser, so the documents are not uploaded to a server.</li>
<li>Put the files in the order you want. This is the step people rush. Read the list from top to bottom as the recipient would read the pages.</li>
<li>Create the merged file and download it.</li>
<li>Open the result and scroll through every page. Check the page count against what you expected, for example 2 + 1 + 3 pages should give 6.</li>
</ol>

<h2>When splitting makes sense</h2>
<p>Splitting is the reverse. You start with one large PDF and produce smaller ones. There are three typical reasons:</p>
<ul>
<li><strong>Extracting a section.</strong> Send only the pages that matter, such as the summary of a report or one chapter of a book you are allowed to share.</li>
<li><strong>Meeting upload limits.</strong> Many portals cap attachments. Two files of 4 MB each can succeed where one file of 8 MB fails.</li>
<li><strong>Separating combined scans.</strong> A scanner may produce one file for a whole stack of documents. Splitting returns each document to its own file.</li>
</ul>
<p>When you split, you normally describe the pages you want. Typing 2-4 extracts pages two to four. A list such as 1,3,5 picks single pages. Splitting every page produces one file per page, which the tool can give you as a ZIP.</p>

<h2>Step by step: extracting pages</h2>
<ol>
<li>Choose Split in the tool and add your PDF.</li>
<li>Type the pages you want, or choose to split into single pages or parts.</li>
<li>Download the new PDF, or the ZIP if several files were made.</li>
<li>Open one of the results and confirm that the first and last pages are the ones you meant.</li>
</ol>

<h2>A worked example</h2>
<p>Imagine an application for a job abroad. You have a 2-page CV, a 1-page cover letter, a 4-page degree transcript scanned sideways, and a 3-page set of reference letters. The employer wants a single PDF under 5 MB.</p>
<p>First, fix the sideways transcript with the <a href="../../tools/pdf-rotator/">PDF Rotator</a>, so that nothing is upside down in the final file. Next, merge in the order cover letter, CV, transcript, references. That gives 10 pages. Check the count. If the combined file is, say, 9 MB, run it through the compressor on a medium setting and compare the size again. Finally, open the result and zoom in on small print such as grades or dates to be sure the text is still sharp.</p>

<h2>Mistakes to avoid</h2>
<ul>
<li><strong>Wrong order.</strong> Fixing order after merging means starting again. Arrange first.</li>
<li><strong>Password-protected files.</strong> A protected PDF usually has to be unlocked first with the password you were given. If you do not have the right to remove the protection, do not try to.</li>
<li><strong>Merging private documents into a shared file.</strong> Before you send a combined file, scroll through every page. It is easy to leave an unrelated bank statement at the end.</li>
<li><strong>Forgetting the file name.</strong> Name the result clearly, for example Ali-Khan-Application-2026.pdf, not merged(3).pdf.</li>
<li><strong>Assuming the file is smaller.</strong> It is not. Compress separately if needed.</li>
</ul>

<h2>Does merging reduce quality?</h2>
<p>A well-built merge copies the pages as they are. Text stays selectable, images keep their resolution and links keep working, because nothing is redrawn. Quality only falls when you also compress, and even then you control the level. This is why the order of operations matters: merge first, check, and compress last if you must.</p>

<h2>Privacy: why browser tools help</h2>
<p>Documents such as identity cards, contracts and bank statements are sensitive. A tool that runs in your browser reads the files on your own device and builds the new PDF there. Nothing has to travel to a server. That does not remove every risk, since your device and the file you send still matter, but it avoids handing copies to an unknown website.</p>

<h2>Quick checklist</h2>
<ul>
<li>Put the pages in the right order before you merge.</li>
<li>Rotate any sideways pages first.</li>
<li>Check the page count after merging or splitting.</li>
<li>Zoom in to confirm the text is readable.</li>
<li>Compress last, only if you need a smaller file.</li>
<li>Give the final file a clear name.</li>
</ul>
<p>With these habits, combining and extracting pages takes a couple of minutes and the result looks professional. Try it now with the free <a href="../../tools/pdf-merge-split/">PDF Merge and Split</a> tool.</p>`
},
{
slug: 'jpg-vs-png-vs-webp',
title: 'JPG vs PNG vs WebP: Which Format to Use?',
desc: 'The real differences between JPG, PNG and WebP, when each one is the best choice, and how to convert between them without wasting quality or file size.',
eyebrow: 'Productivity',
tools: [['image-converter', 'Image Converter'], ['image-compressor', 'Image Compressor'], ['image-resizer', 'Image Resizer']],
related: ['qr-codes-small-business', 'compress-pdf-without-losing-quality', 'write-cv-for-jobs-in-pakistan'],
body: `
<p>Every photo, screenshot and logo you save is stored in some format, and the choice affects file size, sharpness and where the image can be used. Most people never choose on purpose; they keep whatever the camera or screenshot tool produced. That is fine until a form rejects your file, a web page loads slowly, or a logo looks fuzzy. This guide compares the three formats you will meet most often: JPG, PNG and WebP.</p>

<h2>JPG in plain words</h2>
<p>JPG (also written JPEG) is built for photographs. It reduces file size by throwing away detail that the human eye is unlikely to notice, such as tiny colour variations in a sky. You choose how much to throw away with a quality setting. At a high setting the picture looks almost identical and the file is much smaller than the original. At a very low setting you start to see blocky patches and a smudgy look around edges.</p>
<p>Strengths: small files for photos, accepted almost everywhere, from government portals to old email programs. Weaknesses: no transparency, and every time you edit and re-save a JPG the quality can fall slightly. Text and sharp lines can look slightly rough when the quality is low.</p>

<h2>PNG in plain words</h2>
<p>PNG keeps every pixel exactly as it was. Nothing is thrown away, so the quality is perfect, but photographs become large files. PNG also supports transparency, which is why logos and icons with no background are usually PNG.</p>
<p>Strengths: crisp text and lines, perfect for screenshots, diagrams, logos and anything with flat colours; transparency support. Weaknesses: large files for photos, which can be several times the size of the same picture saved as JPG.</p>

<h2>WebP in plain words</h2>
<p>WebP is a newer format designed for the web. It can behave like JPG, losing a little detail to save space, or like PNG, keeping everything and supporting transparency. In many cases a WebP file is noticeably smaller than a JPG or PNG that looks the same, which is why websites like it: smaller files load faster, especially on mobile data.</p>
<p>Strengths: usually the smallest file, supports transparency and quality control. Weaknesses: some older software, print shops and upload forms do not accept it, so you may need to convert it back.</p>

<h2>Side-by-side comparison</h2>
<ul>
<li><strong>Photos:</strong> JPG or WebP. PNG is wasteful.</li>
<li><strong>Screenshots with text:</strong> PNG, or WebP at high quality.</li>
<li><strong>Logos and icons with transparent backgrounds:</strong> PNG or WebP.</li>
<li><strong>Images for forms, CNIC-style uploads, job portals:</strong> JPG, because it is accepted nearly everywhere.</li>
<li><strong>Website images where speed matters:</strong> WebP, with JPG as a fallback if needed.</li>
<li><strong>Anything you will edit many times:</strong> keep an original in PNG, then export JPG or WebP copies.</li>
</ul>

<h2>How to convert with the free tool</h2>
<ol>
<li>Open the <a href="../../tools/image-converter/">Image Converter</a>.</li>
<li>Drop in one image or a whole batch. The pictures are decoded in your browser and are not uploaded.</li>
<li>Choose the target format: JPG, PNG or WebP.</li>
<li>For JPG and WebP, set the quality. Around 75 to 85 percent is a good starting range for photos.</li>
<li>If you convert a transparent PNG to JPG, choose the background colour that will fill the transparent areas, usually white.</li>
<li>Convert and download. Open the result and compare it with the original.</li>
</ol>

<h2>A worked example</h2>
<p>You take a screenshot of a spreadsheet. The file is a PNG of about 1.8 MB, and an email system limits attachments. Because the content is text and lines, converting to JPG at a low quality would make the writing fuzzy. Converting to WebP at around 80 percent quality is likely to keep the text readable while making the file much smaller. If the recipient cannot open WebP, you can convert the same picture to JPG at a higher quality setting and accept a somewhat larger file.</p>
<p>Now take a 5 MB phone photo for an online application. Here JPG at about 75 percent, perhaps combined with a smaller width, will bring the file well under a 1 MB limit while still looking clean. The <a href="../../tools/image-compressor/">Image Compressor</a> and <a href="../../tools/image-resizer/">Image Resizer</a> are built for this job.</p>

<h2>Common mistakes</h2>
<ul>
<li><strong>Saving photos as PNG.</strong> The files balloon with no visible benefit.</li>
<li><strong>Re-saving a JPG again and again.</strong> Keep your original and export copies from it.</li>
<li><strong>Converting a low-quality image to a better format.</strong> Changing JPG to PNG does not bring back lost detail; it only makes the file bigger.</li>
<li><strong>Forgetting about transparency.</strong> A logo saved as JPG gets a solid background, often white, which looks wrong on a coloured page.</li>
<li><strong>Using the wrong size.</strong> A 4000-pixel-wide photo on a small website slows the page down. Resize first.</li>
</ul>

<h2>Which one should you remember?</h2>
<p>If you only keep one rule, use this: JPG for photographs you need to share widely, PNG for graphics and screenshots you need to keep sharp, and WebP when you control where the image will be used and want the smallest file. Keep an original, convert copies, and always open the converted file before you send it.</p>
<p>Ready to try it? Convert a batch in seconds with the free <a href="../../tools/image-converter/">Image Converter</a>.</p>`
},
{
slug: 'resize-images-for-whatsapp-email-and-websites',
title: 'How to Resize Images for Chat, Email and Web',
desc: 'Why photos are too big, what size to choose for chat, email, forms and web pages, and how to resize without stretching or blurring, using a free browser tool.',
eyebrow: 'Productivity',
tools: [['image-resizer', 'Image Resizer'], ['image-compressor', 'Image Compressor'], ['image-converter', 'Image Converter']],
related: ['qr-codes-small-business', 'compress-pdf-without-losing-quality', 'write-cv-for-jobs-in-pakistan'],
body: `
<p>A modern phone camera takes pictures that are 4000 pixels wide or more. That is wonderful for printing, but it is far more than you need for a chat message, an email, or most web pages. Oversized images are slow to send, slow to load and often rejected by upload forms. Resizing is the simple fix. This guide explains what pixel size really means, how to choose a sensible size for each use, and how to resize without making a picture look stretched or blurry.</p>

<h2>Pixels, file size and why they are different</h2>
<p>An image has two kinds of size. Its dimensions are the number of pixels across and down, for example 4000 by 3000. Its file size is how much storage it needs, for example 4 MB. They are linked, because more pixels usually means a bigger file, but they are not the same thing. Resizing changes the dimensions. Compressing changes how tightly the pixels are stored. To make a photo much smaller you often do both.</p>
<p>A screen only shows as many pixels as it has. If your image is wider than the screen area where it appears, the extra pixels are wasted. That is why shrinking a photo for screen use rarely reduces what viewers see, but it can reduce the file to a fraction of the original.</p>

<h2>Choosing a size for each situation</h2>
<p>Exact limits change between apps and websites, so treat these as starting points and check the current rules where you upload.</p>
<ul>
<li><strong>Chat apps.</strong> Apps compress pictures that you send as photos. Sending the original as a document keeps full quality, but it uses more data. For casual photos, a width of about 1280 to 1600 pixels is plenty.</li>
<li><strong>Email.</strong> A width of 1024 to 1600 pixels looks good on any screen and keeps attachments small. If you send several, the total matters.</li>
<li><strong>Online forms and job portals.</strong> They usually state a maximum file size, often between 100 KB and 2 MB, and sometimes exact dimensions for passport-style photos. Follow their instruction exactly.</li>
<li><strong>Blog and website images.</strong> A content image that is shown about 800 pixels wide on screen can be saved at 1200 to 1600 pixels wide to look sharp on high-density screens.</li>
<li><strong>Profile pictures.</strong> Square images, such as 400 by 400 pixels, are common. Crop to a square instead of stretching.</li>
</ul>

<h2>Step by step with the Image Resizer</h2>
<ol>
<li>Open the free <a href="../../tools/image-resizer/">Image Resizer</a> and drop in one or more pictures. They stay on your device.</li>
<li>Choose how to size them: by exact pixels, by percentage, or from a list of common sizes.</li>
<li>Keep the aspect ratio locked so the picture is not squashed. If you set both width and height, decide how to handle a different shape: crop to fill, fit inside with a background colour, or stretch. Stretching is rarely a good idea.</li>
<li>Choose the output format and quality. JPG suits photos; see our guide to <a href="../../blog/jpg-vs-png-vs-webp/">JPG, PNG and WebP</a> if you are unsure.</li>
<li>Resize, then download each file or all of them together.</li>
</ol>

<h2>A worked example</h2>
<p>You have a 4000 by 3000 pixel photo of 4.2 MB and a form that accepts images up to 500 KB. Start by setting the width to 1200 pixels with the aspect ratio locked. The height becomes 900 automatically. The new dimensions have less than a tenth of the original pixels, so the file will likely drop below 1 MB. If it is still too large, use the <a href="../../tools/image-compressor/">Image Compressor</a> at around 70 percent quality. Check the result at full size. If faces or text look soft, raise the quality a little and try again.</p>

<h2>Cropping versus fitting</h2>
<p>Suppose you need a square picture from a wide photo. Crop to fill cuts away the edges and keeps the centre, so the subject stays natural. Fit inside shows the whole picture and fills the leftover space with a colour, which suits product shots. Stretch forces the picture into a square and distorts it. Choose crop or fit, and look at the preview before you save.</p>

<h2>Do not enlarge small images</h2>
<p>Resizing down is safe because you are discarding pixels you do not need. Resizing up asks the software to invent pixels that were never captured, and the picture looks soft. If you need a larger image, find the original or retake the photo at a higher resolution instead.</p>

<h2>Keep your original</h2>
<p>Always keep the original file. Resized copies are for sending; the original is for later needs such as printing or a different crop. A simple habit is to save copies in a folder called Resized, so there is never doubt about which file is which.</p>

<h2>Common problems and quick fixes</h2>
<ul>
<li><strong>The picture looks stretched.</strong> The aspect ratio was not locked. Reset and lock it, or choose crop to fill.</li>
<li><strong>The text in a screenshot is blurry.</strong> The picture was reduced too much or compressed too hard. Use a larger width, or save as PNG or high-quality WebP.</li>
<li><strong>The file is still too big.</strong> Reduce the width further, then compress.</li>
<li><strong>The form rejects the image.</strong> Check the exact format, dimensions and file size rules, and convert to the format it lists.</li>
<li><strong>The picture appears rotated.</strong> Some phones store a rotation flag. Open the saved result before uploading and rotate if needed.</li>
</ul>

<h2>A simple routine</h2>
<p>Decide where the image will be used, pick a width that suits it, resize with the aspect ratio locked, compress if the size still matters, and open the final file to check it. It takes less than a minute once you have done it a few times, and your messages, emails and pages will load faster. Try it with the free <a href="../../tools/image-resizer/">Image Resizer</a>.</p>`
},
{
slug: 'convert-photos-and-scans-into-one-pdf',
title: 'Turn Photos and Scans Into One Clean PDF',
desc: 'Combine phone photos or scanned pages into a single, tidy PDF: how to take good photos, order the pages, choose a page size and keep the file small.',
eyebrow: 'Productivity',
tools: [['images-to-pdf', 'Images to PDF'], ['pdf-compressor', 'PDF Compressor'], ['pdf-merge-split', 'PDF Merge and Split']],
related: ['compress-pdf-without-losing-quality', 'merge-and-split-pdf-files', 'ats-resume-check-free'],
body: `
<p>Sooner or later you will need to turn a handful of photos into one PDF. Perhaps you have photographed a signed agreement, pages of a handwritten assignment, a set of receipts or a certificate with two sides. Sending five separate pictures is untidy and easy to misorder. A single PDF keeps the pages together, in order, and opens on any device. This guide shows how to take photos that convert well, how to build the PDF, and how to keep the final file a sensible size.</p>

<h2>Start with good photos</h2>
<p>The quality of the PDF depends mostly on the quality of the pictures. A few habits make a big difference:</p>
<ul>
<li><strong>Light.</strong> Use even light. Avoid a shadow from your phone or hand falling across the page.</li>
<li><strong>Flat page.</strong> Place the paper on a flat, plain surface in a contrasting colour, and hold the phone directly above it so the edges are parallel and the text is not slanted.</li>
<li><strong>Focus and distance.</strong> Fill the frame with the page without cutting off the edges, and tap to focus on the text.</li>
<li><strong>Orientation.</strong> Take all pages the same way up. Mixed orientation causes sideways pages later.</li>
<li><strong>One page per photo.</strong> Do not photograph two pages together unless they are meant to be one image.</li>
</ul>

<h2>Check each picture before you convert</h2>
<p>Zoom in on every photo. Can you read the smallest text? Are any corners cut off? Is a thumb in the picture? It is much faster to retake a photo now than to discover a problem after the PDF has been sent. Rename the files in order, for example page-1, page-2 and page-3, so you can see the sequence at a glance.</p>

<h2>Step by step with Images to PDF</h2>
<ol>
<li>Open the free <a href="../../tools/images-to-pdf/">Images to PDF</a> tool. The pictures are processed in your browser and are not uploaded.</li>
<li>Drop your images in, or click to choose them. JPG, PNG and WebP are accepted.</li>
<li>Use the arrows to put the pages in the right order. Each image becomes one page.</li>
<li>Choose the page size, such as A4 or Letter, the orientation and a margin. A small margin keeps text away from the edge when the page is printed.</li>
<li>Create the PDF and download it.</li>
<li>Open it and scroll through. Confirm the page count and that no page is upside down.</li>
</ol>

<h2>Choosing page size and margin</h2>
<p>A4 is the common size in Pakistan and most of the world, while Letter is used in North America. If the recipient will print the document, match the size they use. Portrait suits most letters and forms; landscape suits wide tables and certificates. Images are scaled to fit the page without stretching, so a picture with a different shape from the page will leave some white space, which is normal.</p>

<h2>Keeping the file small</h2>
<p>Photos from a modern phone are large, so a PDF of ten of them can run to tens of megabytes. Email systems and portals often limit attachments. There are three ways to keep the size down, and they work well together:</p>
<ol>
<li>Resize the photos before converting. A width of about 1600 pixels is usually enough for a readable page. See our guide on <a href="../../blog/resize-images-for-whatsapp-email-and-websites/">resizing images</a>.</li>
<li>Choose JPG for photographs of pages, since PNG files are much larger for the same picture.</li>
<li>After you create the PDF, run it through the <a href="../../tools/pdf-compressor/">PDF Compressor</a> on a medium setting, and check that the text is still sharp.</li>
</ol>

<h2>A worked example</h2>
<p>You photograph a four-page rental agreement. Each photo is 3.5 MB, so the four pages come to 14 MB. The landlord's portal allows 5 MB. First, resize each photo to about 1600 pixels wide, which brings each to well under 1 MB. Convert the four pictures into an A4 portrait PDF with a small margin. Check the page order and open the file. If the PDF is 3 MB, you are done. If it is still above the limit, compress it once at a medium level, then re-open it and read the smallest clause to check it is legible.</p>

<h2>Combining with existing PDFs</h2>
<p>Sometimes some pages are already PDFs and others are photos. Convert the photos into a PDF first, then use <a href="../../tools/pdf-merge-split/">PDF Merge and Split</a> to join it with the other files in the right order. If a page ends up sideways, fix it with a PDF rotator before sending.</p>

<h2>Is a photo PDF good enough for official use?</h2>
<p>For many everyday tasks, such as sharing a signed document or submitting a form, a clear photo PDF is accepted. Some offices ask for an original scan, a certified copy or a particular resolution. If the instructions mention scanned documents, follow them exactly. Photographed pages are not searchable text; they are pictures of text. That is normal, but it means you cannot copy words from the PDF.</p>

<h2>Privacy tips</h2>
<ul>
<li>Cover or leave out information the recipient does not need.</li>
<li>Delete the photos from your phone and cloud backups when you no longer need them, if they contain identity documents.</li>
<li>Use a browser-based tool so the files are not sent to someone else's server.</li>
<li>Name the final file clearly, and avoid putting an ID number in the file name.</li>
</ul>

<h2>Checklist</h2>
<ul>
<li>Take clear, flat, well-lit photos, all in the same orientation.</li>
<li>Rename files in page order.</li>
<li>Pick A4 or Letter to match the recipient.</li>
<li>Check the page count and orientation after converting.</li>
<li>Compress if the file is too big, then check readability.</li>
</ul>
<p>Follow these steps and a stack of photos becomes one neat, professional document. Start with the free <a href="../../tools/images-to-pdf/">Images to PDF</a> tool.</p>`
}
];
