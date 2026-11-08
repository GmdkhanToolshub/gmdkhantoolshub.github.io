"""Builds assets/js/core.js = config.js + util.js + main.js (one request instead of three).
Edit the three source files, then run:  python build/make-core.py   (from the project root)"""
import os
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
parts = [open(os.path.join(root, "assets/js", n), encoding="utf-8").read().rstrip() for n in ("config.js", "util.js", "main.js")]
open(os.path.join(root, "assets/js/core.js"), "w", encoding="utf-8", newline="\n").write("\n;\n".join(parts) + "\n")
print("core.js written")
