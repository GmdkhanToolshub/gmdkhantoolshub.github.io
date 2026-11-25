"""Replaces the old brand name inside workbook text without re-saving through a spreadsheet library,
so formulas, formatting and layout are left exactly as they were. Safe to re-run."""
import os, zipfile, shutil, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OLD, NEW = b'GM AI Tools HUB', b'GM Tools Hub'
targets = glob.glob(os.path.join(ROOT, 'assets', 'downloads', '*.xlsx')) + [os.path.join(ROOT, 'products', 'HR-Attendance-Leave-Tracker.xlsx'), os.path.join(ROOT, 'products', 'marketplace-pack', '06-hr-attendance-tracker', 'HR-Attendance-Leave-Tracker.xlsx')]
for f in targets:
    if not os.path.exists(f): continue
    with zipfile.ZipFile(f) as z:
        items = [(i, z.read(i.filename)) for i in z.infolist()]
    n = sum(d.count(OLD) for i, d in items if i.filename.endswith('.xml'))
    if not n: continue
    tmp = f + '.tmp'
    with zipfile.ZipFile(tmp, 'w') as out:
        for i, d in items: out.writestr(i, d.replace(OLD, NEW) if i.filename.endswith('.xml') else d)
    shutil.move(tmp, f); print(os.path.relpath(f, ROOT), 'replaced', n)
