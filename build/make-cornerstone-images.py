"""Turns the Excel PDF exports from verify-cornerstone.ps1 into trimmed WebP screenshots for the two guides.
Usage: python build/make-cornerstone-images.py <folder with the exported PDFs> [image names]"""
import os, sys
import pypdfium2 as pdfium
from PIL import Image, ImageChops
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = os.path.join(ROOT, 'assets', 'img', 'guides'); os.makedirs(OUT, exist_ok=True)
ALL = (('dash.pdf', 'sales-dashboard-example'), ('stock.pdf', 'inventory-stock-sheet'), ('abc.pdf', 'inventory-abc-sheet'), ('attsummary.pdf', 'attendance-summary-sheet'), ('hrdash.pdf', 'hr-attendance-dashboard'), ('salesperf.pdf', 'sales-performance-scorecard'), ('monthreport.pdf', 'monthly-report-sheet'))
WANT = sys.argv[2:]  # optional: only these image names
for pdf, name in (x for x in ALL if not WANT or x[1] in WANT):
    doc = pdfium.PdfDocument(os.path.join(sys.argv[1], pdf))
    assert len(doc) == 1, '%s has %d pages' % (pdf, len(doc))
    im = doc[0].render(scale=2.4).to_pil().convert('RGB')
    box = ImageChops.difference(im, Image.new('RGB', im.size, (255, 255, 255))).getbbox()
    im = im.crop((max(box[0] - 18, 0), max(box[1] - 18, 0), min(box[2] + 18, im.width), min(box[3] + 18, im.height)))
    if im.width > 1500: im = im.resize((1500, round(im.height * 1500 / im.width)), Image.LANCZOS)
    p = os.path.join(OUT, name + '.webp'); im.save(p, 'WEBP', quality=86, method=6)
    print(name, im.size, os.path.getsize(p) // 1024, 'KB')
